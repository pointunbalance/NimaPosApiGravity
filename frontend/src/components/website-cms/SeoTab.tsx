import React from 'react';
import { Globe } from 'lucide-react';
import { WebsiteContent } from '../../types';

interface SeoTabProps {
  content: WebsiteContent;
  setContent: (content: WebsiteContent) => void;
}

export const SeoTab: React.FC<SeoTabProps> = ({ content, setContent }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
        <Globe className="text-indigo-500" />
        إعدادات محركات البحث (SEO) والنشر
      </h2>
      <div className="space-y-4">
        <div className="flex items-center gap-3 bg-amber-50 p-4 rounded-xl border border-amber-200">
            <input type="checkbox" id="isDraft" className="w-5 h-5 accent-amber-600" checked={content.isDraft || false} onChange={e => setContent({...content, isDraft: e.target.checked})} />
            <label htmlFor="isDraft" className="font-bold text-amber-900 cursor-pointer text-sm">
                تعليق النشر (مسودة) - الموقع لن يكون متاحاً للزوار
            </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">عنوان الـ SEO (Meta Title)</label>
          <input 
            type="text" 
            value={content.seoTitle || ''}
            onChange={e => setContent({...content, seoTitle: e.target.value})}
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="عنوان مختصر يعبر عن الموقع في محركات البحث"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">الوصف (Meta Description)</label>
          <textarea 
            value={content.seoDescription || ''}
            onChange={e => setContent({...content, seoDescription: e.target.value})}
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24"
            placeholder="وصف جذاب للموقع يظهر في نتائج البحث (150-160 حرف)"
            maxLength={160}
          />
          <div className="text-xs text-slate-500 text-left mt-1">{(content.seoDescription || '').length}/160</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">الكلمات الدلالية (Keywords)</label>
          <input 
            type="text" 
            value={content.seoKeywords || ''}
            onChange={e => setContent({...content, seoKeywords: e.target.value})}
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="مثال: شركة تقنية, برمجة, تطوير تطبيقات (مفصولة بفاصلة)"
          />
        </div>
      </div>
    </div>
  );
};
