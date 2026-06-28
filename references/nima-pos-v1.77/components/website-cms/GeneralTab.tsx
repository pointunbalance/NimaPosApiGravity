import React from 'react';
import { ImageIcon, MessageSquare } from 'lucide-react';
import { WebsiteContent } from '../../types';

interface GeneralTabProps {
  content: WebsiteContent;
  setContent: (content: WebsiteContent) => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({ content, setContent }) => {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
          <ImageIcon className="text-indigo-500" />
          القسم الرئيسي (Hero)
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">العنوان الرئيسي</label>
            <input 
              type="text" 
              value={content.heroTitle}
              onChange={e => setContent({...content, heroTitle: e.target.value})}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">النص الفرعي</label>
            <textarea 
              value={content.heroSubtitle}
              onChange={e => setContent({...content, heroSubtitle: e.target.value})}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">رابط صورة الخلفية</label>
            <input 
              type="text" 
              value={content.heroImage}
              onChange={e => setContent({...content, heroImage: e.target.value})}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ltr"
              dir="ltr"
            />
            {content.heroImage && (
              <div className="mt-3 h-48 rounded-lg bg-cover bg-center border border-slate-200" style={{ backgroundImage: `url(${content.heroImage})` }}></div>
            )}
          </div>
        </div>
      </div>

      {/* About Us */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-3">
          <MessageSquare className="text-indigo-500" />
          من نحن
        </h2>
        <div>
          <textarea 
            value={content.aboutUs}
            onChange={e => setContent({...content, aboutUs: e.target.value})}
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-48"
          />
        </div>
      </div>
    </>
  );
};
