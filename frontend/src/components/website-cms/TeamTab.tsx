import React from 'react';
import { Users, Plus, Trash2 } from 'lucide-react';
import { WebsiteContent } from '../../types';

interface TeamTabProps {
  content: WebsiteContent;
  setContent: (content: WebsiteContent) => void;
}

export const TeamTab: React.FC<TeamTabProps> = ({ content, setContent }) => {
  const addTeamMember = () => {
    setContent({
      ...content,
      team: [...(content.team || []), { id: Date.now().toString(), name: '', role: '', image: '' }]
    });
  };

  const removeTeamMember = (id: string) => {
    setContent({
      ...content,
      team: (content.team || []).filter(t => t.id !== id)
    });
  };

  const updateTeamMember = (id: string, field: string, value: string) => {
    setContent({
      ...content,
      team: (content.team || []).map(t => t.id === id ? { ...t, [field]: value } : t)
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div className="flex justify-between items-center border-b pb-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Users className="text-indigo-500" />
          فريق العمل
        </h2>
        <button onClick={addTeamMember} className="text-sm flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg">
          <Plus size={16} /> إضافة عضو
        </button>
      </div>
      
      <div className="space-y-4">
        {(content.team || []).map((member) => (
          <div key={member.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative group">
            <button 
              onClick={() => removeTeamMember(member.id)}
              className="absolute top-4 left-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={18} />
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">الاسم</label>
                <input 
                  type="text" 
                  value={member.name}
                  onChange={e => updateTeamMember(member.id, 'name', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">المسمى الوظيفي</label>
                <input 
                  type="text" 
                  value={member.role}
                  onChange={e => updateTeamMember(member.id, 'role', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">رابط الصورة الشخصية</label>
                <input 
                  type="text" 
                  value={member.image}
                  onChange={e => updateTeamMember(member.id, 'image', e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none ltr"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        ))}
        {(!content.team || content.team.length === 0) && (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">لا يوجد أعضاء مضافين.</div>
        )}
      </div>
    </div>
  );
};
