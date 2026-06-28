import React from 'react';
import { Search, LayoutGrid, Calendar } from 'lucide-react';

interface TasksToolbarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedProject: number | 'all';
  setSelectedProject: (val: number | 'all') => void;
  viewMode: 'kanban' | 'gantt';
  setViewMode: (val: 'kanban' | 'gantt') => void;
  projects: any[];
}

export const TasksToolbar: React.FC<TasksToolbarProps> = ({
  searchTerm,
  setSearchTerm,
  selectedProject,
  setSelectedProject,
  viewMode,
  setViewMode,
  projects,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-center bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-indigo-100/10 shadow-sm font-['Tajawal']">
      <div className="relative flex-1 w-full">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 stroke-[2]" size={20} />
        <input
          type="text"
          placeholder="البحث في المهام..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/85 border border-indigo-100/60 py-2.5 pr-10 pl-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-stretch sm:items-center">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          className="bg-white/85 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-sm text-slate-700 appearance-none cursor-pointer flex-1 md:w-48"
        >
          <option value="all">جميع المشاريع</option>
          {projects?.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="flex bg-slate-100/85 p-1 rounded-2xl self-center">
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-2 rounded-xl flex items-center justify-center transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            title="عرض كانبان"
          >
            <LayoutGrid size={18} className="stroke-[2]" />
          </button>
          <button
            onClick={() => setViewMode('gantt')}
            className={`p-2 rounded-xl flex items-center justify-center transition-all ${viewMode === 'gantt' ? 'bg-white shadow-sm text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            title="مخطط جانت (Gantt)"
          >
            <Calendar size={18} className="stroke-[2]" />
          </button>
        </div>
      </div>
    </div>
  );
};
