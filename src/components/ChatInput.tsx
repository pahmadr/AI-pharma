import { useState, useRef } from 'react';
import { ImagePlus, Send } from 'lucide-react';
import { Button } from './ui/button';
import svgPaths from '../imports/svg-qff2itxbxz';

interface ChatInputProps {
  onSend: (imageData: string | null, prompt: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [borderRadius, setBorderRadius] = useState(1.67772e+07);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
      
      // Adjust border radius based on height
      // When height grows from 24px (1 line) to 48px (2 lines), smoothly transition from full radius to 24px
      const minHeight = 24;
      const maxHeight = 48;
      const minRadius = 24;
      const maxRadius = 1.67772e+07;
      
      if (newHeight <= minHeight) {
        setBorderRadius(maxRadius);
      } else if (newHeight >= maxHeight) {
        setBorderRadius(minRadius);
      } else {
        // Linear interpolation
        const ratio = (newHeight - minHeight) / (maxHeight - minHeight);
        const newRadius = maxRadius - (ratio * (maxRadius - minRadius));
        setBorderRadius(newRadius);
      }
    }
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    adjustTextareaHeight();
  };

  const handleSend = () => {
    if (isLoading || (!selectedImage && !prompt.trim())) return;

    onSend(selectedImage, prompt.trim());

    // Reset
    setPrompt('');
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setBorderRadius(1.67772e+07);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="" dir="rtl">
      {/* Image Preview */}
      {selectedImage && (
        <div className="px-4 pt-3">
          <div className="relative inline-block">
            <img
              src={selectedImage}
              alt="Selected"
              className="h-20 rounded-lg object-cover"
            />
            <button
              onClick={() => {
                setSelectedImage(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 shadow-md"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-[rgba(0,0,0,0)]">
        <div 
          className="bg-white box-border content-stretch flex gap-[8px] min-h-[54px] items-end pl-[9px] pr-[13px] py-2 w-full relative transition-all duration-200 ease-out"
          style={{ borderRadius: `${borderRadius}px` }}
          dir="rtl"
        >
          <div 
            aria-hidden="true" 
            className="absolute border border-[#dadada] border-solid inset-0 pointer-events-none shadow-[0px_17px_40px_0px_rgba(0,0,0,0.06)] transition-all duration-200 ease-out"
            style={{ borderRadius: `${borderRadius}px` }}
          />
          
          {/* Image Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="relative shrink-0 size-[36px] cursor-pointer">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col items-start relative size-[36px]">
              <div className="h-[36px] relative rounded-[1.67772e+07px] shrink-0 w-full">
                <div className="absolute left-[6px] size-[24px] top-[6px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                    <g>
                      <path d="M15.999 4.99951H21.999" stroke="#4A5565" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      <path d="M18.999 1.99951V7.99951" stroke="#4A5565" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      <path d={svgPaths.p30acba0} stroke="#4A5565" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      <path d={svgPaths.p32e95240} stroke="#4A5565" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      <path d={svgPaths.p28a77300} stroke="#4A5565" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </label>

          {/* Text Area */}
          <div className="basis-0 grow min-h-[36px] min-w-px relative shrink-0 flex items-end">
            <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex w-full items-center justify-end relative rounded-[inherit]">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleKeyPress}
                placeholder="مثلا: استامینوفن، آزیترومایسین و..."
                className="font-['Vazirmatn',sans-serif] font-normal leading-[24px] relative text-[#101828] placeholder:text-[#99a1af] text-[16px] w-full bg-transparent border-0 outline-none resize-none text-right max-h-[120px] overflow-y-auto py-1.5"
                rows={1}
                disabled={isLoading}
                dir="rtl"
                style={{ minHeight: '24px' }}
              />
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!selectedImage && !prompt.trim()) || isLoading}
            className="bg-[#101828] relative rounded-[1.67772e+07px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] shrink-0 size-[36px] disabled:opacity-50"
          >
            <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex items-center justify-center relative size-[36px]">
              <div className="flex items-center justify-center relative shrink-0">
                <div className="flex-none rotate-[180deg] scale-y-[-100%]">
                  <div className="relative size-[16px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                      <g clipPath="url(#clip0_12_326)">
                        <path d={svgPaths.p3d73a900} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                        <path d={svgPaths.p3370bc40} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                      </g>
                      <defs>
                        <clipPath id="clip0_12_326">
                          <rect fill="white" height="16" width="16" />
                        </clipPath>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>
        
        {/* Disclaimer Text */}
        <p className="font-['Vazirmatn',sans-serif] text-[12px] text-[rgb(159,159,159)] text-center mt-3" dir="rtl">
          پاسخ های هوش مصنوعی می توانند در مواردی اشتباه باشند.
        </p>
      </div>
    </div>
  );
}