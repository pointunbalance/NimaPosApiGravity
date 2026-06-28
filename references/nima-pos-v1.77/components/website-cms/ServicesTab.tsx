import React from 'react';
import { WebsiteContent } from '../../types';
import { LayoutTemplate, Plus, Trash2 } from 'lucide-react';

interface ServicesTabProps {
  content: WebsiteContent;
  setContent: React.Dispatch<React.SetStateAction<WebsiteContent>>;
}

export const ServicesTab: React.FC<ServicesTabProps> = ({ content, setContent }) => {
  const addService = () => {
    setContent({
      ...content,
      services: [...(content.services || []), { id: Date.now().toString(), title: '', description: '', icon: '' }]
    });
  };

  const removeService = (id: string) => {
    setContent({
      ...content,
      services: (content.services || []).filter(s => s.id !== id)
    });
  };

  const updateService = (id: string, field: string, value: string) => {
    setContent({
      ...content,
      services: (content.services || []).map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <LayoutTemplate className="text-indigo-500" />
          الخدمات والمميزات
        </h2>
        <button onClick={addService} className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">
          <Plus size={16} /> إضافة خدمة
        </button>
      </div>
      
      <div className="space-y-4">
        {content.services.map((service) => (
          <div key={service.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative group">
            <button 
              onClick={() => removeService(service.id)}
              className="absolute top-4 left-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={18} />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">عنوان الخدمة</label>
                <input 
                  type="text" 
                  value={service.title}
                  onChange={e => updateService(service.id, 'title', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">الوصف</label>
                <input 
                  type="text" 
                  value={service.description}
                  onChange={e => updateService(service.id, 'description', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        ))}
        {content.services.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">لا توجد خدمات مضافة.</div>
        )}
      </div>
    </div>
  );
};
