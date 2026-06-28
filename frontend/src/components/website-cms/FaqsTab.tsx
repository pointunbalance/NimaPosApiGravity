import React from 'react';
import { HelpCircle, Plus, Trash2 } from 'lucide-react';
import { WebsiteContent } from '../../types';

interface FaqsTabProps {
  content: WebsiteContent;
  setContent: (content: WebsiteContent) => void;
}

export const FaqsTab: React.FC<FaqsTabProps> = ({ content, setContent }) => {
  const addFaq = () => {
    setContent({
      ...content,
      faqs: [...(content.faqs || []), { id: Date.now().toString(), question: '', answer: '' }]
    });
  };

  const removeFaq = (id: string) => {
    setContent({
      ...content,
      faqs: (content.faqs || []).filter(f => f.id !== id)
    });
  };

  const updateFaq = (id: string, field: string, value: string) => {
    setContent({
      ...content,
      faqs: (content.faqs || []).map(f => f.id === id ? { ...f, [field]: value } : f)
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <HelpCircle className="text-indigo-500" />
          الأسئلة الشائعة
        </h2>
        <button onClick={addFaq} className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">
          <Plus size={16} /> إضافة سؤال
        </button>
      </div>
      
      <div className="space-y-4">
        {(content.faqs || []).map((faq) => (
          <div key={faq.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative group">
            <button 
              onClick={() => removeFaq(faq.id)}
              className="absolute top-4 left-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={18} />
            </button>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">السؤال</label>
                <input 
                  type="text" 
                  value={faq.question}
                  onChange={e => updateFaq(faq.id, 'question', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">الإجابة</label>
                <textarea 
                  value={faq.answer}
                  onChange={e => updateFaq(faq.id, 'answer', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20"
                />
              </div>
            </div>
          </div>
        ))}
        {(!content.faqs || content.faqs.length === 0) && (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">لا توجد أسئلة مضافة.</div>
        )}
      </div>
    </div>
  );
};
