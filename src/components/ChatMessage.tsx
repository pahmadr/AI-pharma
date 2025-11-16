import { ImageWithFallback } from './figma/ImageWithFallback';
import { Message } from '../App';
import ReactMarkdown from 'react-markdown';
import { Button } from './ui/button';
import { useState } from 'react';

export interface ChatMessageProps {
  message: Message;
  onDrugDetailsRequest?: (drugName: string, dosage: string) => void;
}

interface PrescriptionItem {
  drugName: string;
  dosage: string;
}

export function ChatMessage({ message, onDrugDetailsRequest }: ChatMessageProps) {
  const isUser = message.type === 'user';
  const [expandedDrugs, setExpandedDrugs] = useState<Set<string>>(new Set());

  // Check if content is a prescription
  const isPrescription = (content: string) => {
    return content.includes('[PRESCRIPTION_START]') && content.includes('[PRESCRIPTION_END]');
  };

  // Parse prescription content
  const parsePrescription = (content: string): PrescriptionItem[] => {
    const startIndex = content.indexOf('[PRESCRIPTION_START]');
    const endIndex = content.indexOf('[PRESCRIPTION_END]');
    
    if (startIndex === -1 || endIndex === -1) return [];
    
    const prescriptionText = content.substring(
      startIndex + '[PRESCRIPTION_START]'.length,
      endIndex
    ).trim();
    
    const items: PrescriptionItem[] = [];
    const lines = prescriptionText.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      // Match pattern: "1. Drug Name - Dosage"
      const match = line.match(/^\d+\.\s*(.+?)\s*-\s*(.+)$/);
      if (match) {
        items.push({
          drugName: match[1].trim(),
          dosage: match[2].trim(),
        });
      }
    }
    
    return items;
  };

  // Render prescription with buttons
  const renderPrescription = (content: string) => {
    const items = parsePrescription(content);
    
    return (
      <div className="space-y-4 font-['Vazirmatn',sans-serif]" dir="rtl">
        <h3 className="text-[#101828] font-semibold text-[16px] mb-4 text-right">
          نسخه پزشکی
        </h3>
        
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="bg-[#f9fafb] rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1" dir="rtl">
                  <div className="text-[#101828] font-medium text-[15px] mb-1">
                    {index + 1}. {item.drugName}
                  </div>
                  <div className="text-[#6b7280] text-[14px]">
                    {item.dosage}
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => {
                  if (onDrugDetailsRequest) {
                    onDrugDetailsRequest(item.drugName, item.dosage);
                  }
                }}
                variant="outline"
                size="sm"
                className="w-full font-['Vazirmatn',sans-serif] text-[14px] h-9 rounded-xl border-[#774AF5] text-[#774AF5] hover:bg-[#774AF5] hover:text-white"
              >
                مشاهده توضیحات
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Parse AI response into structured sections
  const parseAIResponse = (content: string) => {
    const sections: { title: string; content: string }[] = [];
    const lines = content.split('\n');
    
    let currentSection: { title: string; content: string } | null = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Check if this is a bold heading (wrapped in ** or __)
      const boldMatch = trimmedLine.match(/^\*\*(.+?)\*\*/) || trimmedLine.match(/^__(.+?)__/);
      
      if (boldMatch) {
        // This is a new section title
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: boldMatch[1].replace(/[💊⚖️⚠️🩺📋]/g, '').trim(),
          content: ''
        };
      } else if (currentSection) {
        // Add to current section content
        currentSection.content += (currentSection.content ? '\n' : '') + trimmedLine;
      }
    }
    
    // Push the last section
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  };

  const renderAIResponse = (content: string) => {
    // Check if it's a prescription
    if (isPrescription(content)) {
      return renderPrescription(content);
    }
    
    // Otherwise, render as normal drug information
    const sections = parseAIResponse(content);
    
    // Debug: log content and sections
    console.log('AI Response Content:', content);
    console.log('Parsed Sections:', sections);
    
    // If no sections found, render raw content as fallback
    if (sections.length === 0) {
      return (
        <div className="space-y-2 font-['Vazirmatn',sans-serif]" dir="rtl">
          <div className="text-[#101828] text-[15px] leading-[24px] text-right whitespace-pre-wrap">
            {content}
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-0 font-['Vazirmatn',sans-serif]" dir="rtl">
        {sections.map((section, index) => (
          <div key={index}>
            {/* Section title - Bold */}
            <h3 className="text-[#101828] font-semibold text-[15px] mb-2 text-right">
              {section.title}
            </h3>
            
            {/* Section content - Normal weight */}
            <div className="text-[#101828] text-[14px] leading-[22px] mb-4 text-right">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
                  li: ({ children }) => <li>{children}</li>,
                  strong: ({ children }) => <span className="font-medium">{children}</span>,
                  em: ({ children }) => <span className="italic">{children}</span>,
                }}
              >
                {section.content}
              </ReactMarkdown>
            </div>
            
            {/* Separator line - except after last section */}
            {index < sections.length - 1 && (
              <div className="border-t border-gray-200 my-4"></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`px-4 py-0 bg-white`} dir="rtl">
      <div className="max-w-3xl mx-auto" dir="rtl">
        {/* Content */}
        <div className="w-full" dir="rtl">
          {message.image && (
            <div className="mb-4">
              <div className="bg-white rounded-[24px] p-3 inline-block shadow-sm border border-gray-200">
                <ImageWithFallback
                  src={message.image}
                  alt="تصویر آپلود شده"
                  className="rounded-[16px] max-w-full h-auto max-h-64 object-contain"
                />
              </div>
            </div>
          )}
          
          <div className="text-gray-900 break-words font-['Vazirmatn',sans-serif] text-right" dir="rtl">
            {isUser ? (
              <div className="bg-[rgb(233,233,233)] rounded-[24px] px-5 py-4 inline-block">
                <div className="whitespace-pre-wrap text-[#101828] text-[15px] text-right">
                  {message.content}
                </div>
              </div>
            ) : (
              renderAIResponse(message.content)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}