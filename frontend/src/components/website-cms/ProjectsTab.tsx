import React from 'react';
import { ImageIcon, Plus, Trash2 } from 'lucide-react';
import { WebsiteContent } from '../../types';

interface ProjectsTabProps {
  content: WebsiteContent;
  setContent: (content: WebsiteContent) => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({ content, setContent }) => {
  const addProject = () => {
    setContent({
      ...content,
      projects: [...(content.projects || []), { id: Date.now().toString(), title: '', description: '', image: '', category: '' }]
    });
  };

  const removeProject = (id: string) => {
    setContent({
      ...content,
      projects: (content.projects || []).filter(p => p.id !== id)
    });
  };

  const updateProject = (id: string, field: string, value: string) => {
    setContent({
      ...content,
      projects: (content.projects || []).map(p => p.id === id ? { ...p, [field]: value } : p)
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ImageIcon className="text-indigo-500" />
          المشاريع السابقة
        </h2>
        <button onClick={addProject} className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">
          <Plus size={16} /> إضافة مشروع
        </button>
      </div>
      
      <div className="space-y-4">
        {(content.projects || []).map((project) => (
          <div key={project.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative group">
            <button 
              onClick={() => removeProject(project.id)}
              className="absolute top-4 left-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={18} />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">عنوان المشروع</label>
                <input 
                  type="text" 
                  value={project.title}
                  onChange={e => updateProject(project.id, 'title', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">الفئة</label>
                <input 
                  type="text" 
                  value={project.category}
                  onChange={e => updateProject(project.id, 'category', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">الوصف</label>
                <textarea 
                  value={project.description}
                  onChange={e => updateProject(project.id, 'description', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">رابط الصورة</label>
                <input 
                  type="text" 
                  value={project.image}
                  onChange={e => updateProject(project.id, 'image', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ltr"
                  dir="ltr"
                />
                {project.image && (
                  <div className="mt-2 h-32 rounded-lg bg-cover bg-center border border-slate-200" style={{ backgroundImage: `url(${project.image})` }}></div>
                )}
              </div>
            </div>
          </div>
        ))}
        {(!content.projects || content.projects.length === 0) && (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">لا توجد مشاريع مضافة.</div>
        )}
      </div>
    </div>
  );
};
