import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { ImageWithFallback } from './components/figma/ImageWithFallback';
import { projectId, publicAnonKey } from './utils/supabase/info';
import svgPaths from './imports/svg-qff2itxbxz';
import emptyStateGif from 'figma:asset/3834c0274ee4be533a2fe7cbd3bf10d3b2ac8733.png';
import { Menu, MessageSquare, Settings, Info, Trash2, FileText } from 'lucide-react';
import { Button } from './components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './components/ui/sheet';

export interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  image?: string;
  timestamp: Date;
  onDrugDetailsRequest?: (drugName: string, dosage: string) => void;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDrugDetailsRequest = async (drugName: string, dosage: string) => {
    setIsLoading(true);

    try {
      // Call backend to get drug details
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a50b80a2/drug-details`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            drugName,
            dosage,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get drug details');
      }

      const data = await response.json();

      // Add AI response with drug details
      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: data.description,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting drug details:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'ai',
        content: `متأسفم، خطایی رخ داد: ${error instanceof Error ? error.message : 'خطای ناشناخته'}. لطفاً دوباره امتحان کنید.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (imageData: string | null, prompt: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: prompt,
      image: imageData || undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call backend to analyze image
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a50b80a2/analyze-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            imageData,
            prompt,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image');
      }

      const data = await response.json();

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.description,
        timestamp: new Date(),
      };

      console.log('AI Response received:', data.description);
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message to AI:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `متأسفم، خطایی رخ داد: ${error instanceof Error ? error.message : 'خطای ناشناخته'}. لطفاً دوباره امتحان کنید.`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white max-w-md mx-auto">
      {/* Header */}
      <header className="box-border content-stretch flex h-[68px] items-center justify-between px-[16px] py-0 w-full">
        <button 
          className="relative shrink-0 size-[32px] flex items-center justify-center"
          aria-label="Menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="size-6 text-[#101828]" />
        </button>
        <div className="flex-1" />
        <Button 
          variant="default" 
          size="sm"
          className="font-['Vazirmatn',sans-serif] h-auto px-4 py-2 bg-black text-white rounded-full hover:bg-gray-800"
        >
          ثبت نام
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="content-stretch flex flex-col gap-[28px] h-full items-center justify-center overflow-clip w-full px-4">
            <div className="relative shrink-0 size-[92px]">
              <img 
                src={emptyStateGif} 
                alt="Logo" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <p className="font-['Vazirmatn',sans-serif] leading-[38px] relative shrink-0 text-[22px] text-black text-center tracking-[-0.5px]" dir="rtl">
              <span className="font-bold text-[20px]">سلام</span>
              <span className="text-[20px]">{`، `}</span>
              <span className="text-[#878787] text-[20px]">اسم دارو یا عکسشو برام بفرست!</span>
            </p>
          </div>
        ) : (
          <div className="py-4 p-[0px]">
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                onDrugDetailsRequest={handleDrugDetailsRequest}
              />
            ))}
            {isLoading && (
              <div className="px-4 py-6">
                <div className="flex items-start gap-3 max-w-3xl mx-auto" dir="rtl">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-md p-1">
                    <div className="relative size-full animate-spin-slow">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <g clipPath="url(#clip0_22_439_loading)">
                          <path d={svgPaths.p11b4e100} fill="#774AF5" fillOpacity="0.3" />
                          <path d={svgPaths.p2f0f8a00} fill="#774AF5" />
                        </g>
                        <defs>
                          <clipPath id="clip0_22_439_loading">
                            <rect fill="white" height="100" width="100" />
                          </clipPath>
                        </defs>
                      </svg>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-3">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} isLoading={isLoading} />

      {/* Hamburger Menu */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[350px] font-['Vazirmatn',sans-serif]" dir="rtl">
          <SheetHeader>
            <SheetTitle className="text-right text-[#101828]">منو</SheetTitle>
          </SheetHeader>
          
          <div className="flex flex-col gap-2 mt-6" dir="rtl">
            <Button
              variant="ghost"
              className="w-full justify-end hover:bg-gray-100 h-auto py-3 px-4"
              onClick={() => {
                setMessages([]);
                setIsMenuOpen(false);
              }}
            >
              <div className="flex items-center gap-3 text-right w-full">
                <MessageSquare className="size-5 text-[#774AF5]" />
                <span className="flex-1">گفتگوی جدید</span>
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-end hover:bg-gray-100 h-auto py-3 px-4"
              onClick={() => {
                if (confirm('آیا می‌خواهید تمام پیام‌ها را پاک کنید؟')) {
                  setMessages([]);
                  setIsMenuOpen(false);
                }
              }}
            >
              <div className="flex items-center gap-3 text-right w-full">
                <Trash2 className="size-5 text-red-500" />
                <span className="flex-1">پاک کردن تاریخچه</span>
              </div>
            </Button>

            <div className="border-t border-gray-200 my-4"></div>

            <Button
              variant="ghost"
              className="w-full justify-end hover:bg-gray-100 h-auto py-3 px-4"
            >
              <div className="flex items-center gap-3 text-right w-full">
                <Info className="size-5 text-gray-600" />
                <span className="flex-1">درباره ما</span>
              </div>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-end hover:bg-gray-100 h-auto py-3 px-4"
            >
              <div className="flex items-center gap-3 text-right w-full">
                <FileText className="size-5 text-gray-600" />
                <span className="flex-1">شرایط و قوانین استفاده</span>
              </div>
            </Button>
          </div>

          <div className="absolute bottom-6 right-4 left-4 text-center text-sm text-gray-500" dir="rtl">
            <p>دستیار هوش مصنوعی پزشکی</p>
            <p className="mt-1">نسخه 1.0.0</p>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}