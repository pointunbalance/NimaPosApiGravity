import React from 'react';
import { MessageCircleHeart, Plus, Trash2 } from 'lucide-react';
import { WebsiteContent } from '../../types';

interface TestimonialsTabProps {
  content: WebsiteContent;
  setContent: (content: WebsiteContent) => void;
}

export const TestimonialsTab: React.FC<TestimonialsTabProps> = ({ content, setContent }) => {
  const addTestimonial = () => {
    setContent({
      ...content,
      testimonials: [...(content.testimonials || []), { id: Date.now().toString(), name: '', role: '', content: '', avatar: '' }]
    });
  };

  const removeTestimonial = (id: string) => {
    setContent({
      ...content,
      testimonials: (content.testimonials || []).filter(t => t.id !== id)
    });
  };

  const updateTestimonial = (id: string, field: string, value: string) => {
    setContent({
      ...content,
      testimonials: (content.testimonials || []).map(t => t.id === id ? { ...t, [field]: value } : t)
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <MessageCircleHeart className="text-indigo-500" />
          آراء العملاء
        </h2>
        <button onClick={addTestimonial} className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">
          <Plus size={16} /> إضافة رأي
        </button>
      </div>
      
      <div className="space-y-4">
        {(content.testimonials || []).map((testimonial) => (
          <div key={testimonial.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative group">
            <button 
              onClick={() => removeTestimonial(testimonial.id)}
              className="absolute top-4 left-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={18} />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">اسم العميل</label>
                <input 
                  type="text" 
                  value={testimonial.name}
                  onChange={e => updateTestimonial(testimonial.id, 'name', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">المنصب / الشركة</label>
                <input 
                  type="text" 
                  value={testimonial.role}
                  onChange={e => updateTestimonial(testimonial.id, 'role', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">الرأي (التقييم)</label>
                <textarea 
                  value={testimonial.content}
                  onChange={e => updateTestimonial(testimonial.id, 'content', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">رابط الصورة (اختياري)</label>
                <input 
                  type="text" 
                  value={testimonial.avatar}
                  onChange={e => updateTestimonial(testimonial.id, 'avatar', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ltr"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        ))}
        {(!content.testimonials || content.testimonials.length === 0) && (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">لا توجد آراء مضافة.</div>
        )}
      </div>
    </div>
  );
};
