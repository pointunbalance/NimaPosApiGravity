import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { WebsiteContent } from '../../types';

interface ContactTabProps {
  content: WebsiteContent;
  setContent: (content: WebsiteContent) => void;
}

export const ContactTab: React.FC<ContactTabProps> = ({ content, setContent }) => {
  const addSocialLink = () => {
    setContent({
      ...content,
      socialLinks: [...content.socialLinks, { platform: '', url: '' }]
    });
  };

  const removeSocialLink = (index: number) => {
    const newLinks = [...content.socialLinks];
    newLinks.splice(index, 1);
    setContent({ ...content, socialLinks: newLinks });
  };

  const updateSocialLink = (index: number, field: string, value: string) => {
    const newLinks = [...content.socialLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setContent({ ...content, socialLinks: newLinks });
  };

  return (
    <>
      {/* Contact Info */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 border-b pb-3">معلومات التواصل</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
            <input 
              type="email" 
              value={content.contactEmail}
              onChange={e => setContent({...content, contactEmail: e.target.value})}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ltr"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
            <input 
              type="text" 
              value={content.contactPhone}
              onChange={e => setContent({...content, contactPhone: e.target.value})}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ltr"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">العنوان</label>
            <textarea 
              value={content.address}
              onChange={e => setContent({...content, address: e.target.value})}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-24"
            />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="text-lg font-bold text-slate-800">روابط التواصل الاجتماعي</h2>
          <button onClick={addSocialLink} className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">
            <Plus size={16} /> إضافة
          </button>
        </div>
        <div className="space-y-3">
          {content.socialLinks.map((link, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input 
                type="text" 
                placeholder="المنصة (مثل Twitter)"
                value={link.platform}
                onChange={e => updateSocialLink(index, 'platform', e.target.value)}
                className="w-1/3 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm ltr"
                dir="ltr"
              />
              <input 
                type="text" 
                placeholder="الرابط (URL)"
                value={link.url}
                onChange={e => updateSocialLink(index, 'url', e.target.value)}
                className="flex-1 p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm ltr"
                dir="ltr"
              />
              <button onClick={() => removeSocialLink(index)} className="p-2 text-slate-400 hover:text-red-500">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
