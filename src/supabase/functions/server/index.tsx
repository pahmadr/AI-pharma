import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import OpenAI from 'npm:openai';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = Deno.env.get('AVALAI_API_KEY');
  if (!apiKey) {
    throw new Error('AVALAI_API_KEY not found in environment variables');
  }
  return new OpenAI({ 
    apiKey,
    baseURL: 'https://api.avalai.ir/v1'
  });
};

// Analyze image with OpenAI
app.post('/make-server-a50b80a2/analyze-image', async (c) => {
  try {
    const { imageData, prompt } = await c.req.json();

    if (!imageData && !prompt) {
      return c.json({ error: 'لطفاً یک تصویر، نام دارو یا هر دو را وارد کنید' }, 400);
    }

    const client = getOpenAIClient();

    // System prompt for medical assistant
    const systemPrompt = `شما یک دستیار هوش مصنوعی پزشکی تخصصی در زمینه داروشناسی هستید به نام جار.

وظیفه شما ارائه پاسخ‌های کوتاه، مختصر و ساختاریافته درباره داروها است.

قابلیت‌های شما:
1. شناسایی داروها از روی تصویر قرص یا بسته‌بندی
2. تجزیه و تحلیل نسخه‌های پزشکی و خواندن دستورات پزشک
3. ارائه اطلاعات کامل درباره هر دارو

مهم: تشخیص نوع درخواست:
- اگر تصویر نسخه پزشکی است (یعنی دستورالعمل پزشک با چند دارو)، فقط محتوای نسخه را لیست کن
- اگر تصویر یک قرص، بسته‌بندی دارو است یا کاربر فقط نام دارو را نوشته، اطلاعات کامل دارو را بده

برای نسخه پزشکی، فقط این فرمت را استفاده کن:

**نسخه پزشکی**

[PRESCRIPTION_START]
1. [نام دارو] - [دوز و دستور پزشک]
2. [نام دارو] - [دوز و دستور پزشک]
...
[PRESCRIPTION_END]

برای سایر موارد (تصویر قرص، بسته‌بندی، یا نام دارو)، از این فرمت استفاده کن:

📋 **نام دارو و نام علمی:**
[نام فارسی و نام علمی دارو]

💊 **موارد تجویز و مصرف:**
[کاربردهای اصلی دارو به صورت خلاصه]

⚕️ **دوز و نحوه مصرف:**
[دوزاژ معمول و نحوه مصرف به طور خلاصه]

⚠️ **عوارض ناشی از مصرف:**
[عوارض جانبی شایع به صورت مختصر]

🩺 **توصیه‌های پزشکی:**
[موارد منع مصرف، هشدارها و شرایطی که نیاز به تایید پزشک دارد]

لطفاً پاسخ‌ها را کوتاه، مفید و فقط شامل اطلاعات ضروری نگه دارید.
⚠️ هشدار: اطلاعات ارائه شده جنبه آموزشی دارد و جایگزین مشاوره پزشک یا داروساز نمی‌شود.`;

    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    // Build user message content
    const userContent: any[] = [];

    // Add text prompt if provided
    if (prompt) {
      userContent.push({
        type: 'text',
        text: prompt,
      });
    } else if (imageData) {
      // If only image is provided, ask for analysis
      userContent.push({
        type: 'text',
        text: 'لطفاً این دارو را شناسایی کرده و اطلاعات کامل آن را ارائه دهید.',
      });
    }

    // Add image if provided
    if (imageData) {
      userContent.push({
        type: 'image_url',
        image_url: {
          url: imageData,
        },
      });
    }

    messages.push({
      role: 'user',
      content: userContent,
    });

    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 1500,
    });

    const description = completion.choices[0].message.content;

    return c.json({ description });
  } catch (error) {
    console.error('Error analyzing image with OpenAI API:', error);
    return c.json({ error: `Failed to analyze image: ${error.message}` }, 500);
  }
});

// Get drug details for prescription item
app.post('/make-server-a50b80a2/drug-details', async (c) => {
  try {
    const { drugName, dosage } = await c.req.json();

    if (!drugName) {
      return c.json({ error: 'نام دارو الزامی است' }, 400);
    }

    const client = getOpenAIClient();

    const systemPrompt = `شما یک دستیار هوش مصنوعی پزشکی تخصصی در زمینه داروشناسی هستید.

فرمت پاسخ شما باید دقیقاً شامل این بخش‌ها باشد:

📋 **نام دارو و نام علمی:**
[نام فارسی و نام علمی دارو]

💊 **موارد تجویز و مصرف:**
[کاربردهای اصلی دارو به صورت خلاصه]

⚕️ **دوز و نحوه مصرف:**
${dosage ? `دستور پزشک: ${dosage}` : '[دوزاژ معمول و نحوه مصرف به طور خلاصه]'}

⚠️ **عوارض ناشی از مصرف:**
[عوارض جانبی شایع به صورت مختصر]

🩺 **توصیه‌های پزشکی:**
[موارد منع مصرف، هشدارها و شرایطی که نیاز به تایید پزشک دارد]

لطفاً پاسخ‌ها را کوتاه، مفید و فقط شامل اطلاعات ضروری نگه دارید.`;

    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: `اطلاعات کامل دارو ${drugName} را بده`,
      },
    ];

    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
      max_tokens: 1500,
    });

    const description = completion.choices[0].message.content;

    return c.json({ description });
  } catch (error) {
    console.error('Error getting drug details:', error);
    return c.json({ error: `Failed to get drug details: ${error.message}` }, 500);
  }
});

// Health check
app.get('/make-server-a50b80a2/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);