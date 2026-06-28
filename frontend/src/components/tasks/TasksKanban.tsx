import React from 'react';
import { Edit2, Trash2, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '../../types';

interface TasksKanbanProps {
  filteredTasks: Task[];
  projects: any[];
  users: any[];
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: Task['status']) => void;
}

export const TasksKanban: React.FC<TasksKanbanProps> = ({
  filteredTasks,
  projects,
  users,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  const columns: { id: Task['status']; title: string; color: string; textClass: string; borderClass: string }[] = [
    { id: 'todo', title: 'المهام المطلوبة', color: 'bg-slate-50/70', textClass: 'text-slate-800', borderClass: 'border-slate-200/50' },
    { id: 'in-progress', title: 'قيد التنفيذ', color: 'bg-sky-50/50', textClass: 'text-sky-800', borderClass: 'border-sky-200/40' },
    { id: 'review', title: 'قيد المراجعة', color: 'bg-amber-50/50', textClass: 'text-amber-800', borderClass: 'border-amber-200/40' },
    { id: 'done', title: 'مكتملة', color: 'bg-emerald-50/50', textClass: 'text-emerald-800', borderClass: 'border-emerald-200/40' }
  ];

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-black border border-rose-100">عالية</span>;
      case 'medium': return <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-black border border-amber-100">متوسطة</span>;
      case 'low': return <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black border border-emerald-100">منخفضة</span>;
      default: return null;
    }
  };

  const getUserName = (id?: number) => users?.find(u => u.id === id)?.name || 'غير معين';
  const getProjectName = (id: number) => projects?.find(p => p.id === id)?.name || 'مشروع غير معروف';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start font-['Tajawal']">
      {columns.map(col => {
        const columnTasks = filteredTasks.filter(t => t.status === col.id);
        return (
          <div key={col.id} className={`rounded-3xl p-4 ${col.color} border border-indigo-100/10 min-h-[500px] shadow-sm`}>
            <h3 className="font-black text-slate-700 text-sm mb-4 flex justify-between items-center px-1">
              <span className={col.textClass}>{col.title}</span>
              <span className="bg-white/80 border border-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-xs font-bold">
                {columnTasks.length}
              </span>
            </h3>
            
            <div className="space-y-3">
              {columnTasks.map(task => (
                <div key={task.id} className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100/30 cursor-pointer hover:shadow-md transition-all group hover:scale-[1.01]">
                  <div className="flex justify-between items-start mb-2">
                    {getPriorityBadge(task.priority)}
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit(task)}
                        className="p-1 bg-slate-50 hover:bg-slate-100 text-indigo-600 rounded-lg transition-colors border border-slate-200/50"
                      >
                        <Edit2 size={12} className="stroke-[2.5]" />
                      </button>
                      <button 
                        onClick={() => onDelete(task.id!)}
                        className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-100/50"
                      >
                        <Trash2 size={12} className="stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="font-black text-slate-800 text-sm mb-1 line-clamp-2 leading-relaxed">{task.title}</h4>
                  <p className="text-xs text-indigo-600 font-bold mb-3">{getProjectName(task.projectId)}</p>
                  
                  {task.dueDate && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold mb-3">
                      <Clock size={13} className="text-slate-400 stroke-[2]" />
                      <span>{format(new Date(task.dueDate), 'yyyy-MM-dd')}</span>
                      {new Date(task.dueDate) < new Date() && task.status !== 'done' && (
                        <span className="flex items-center gap-0.5 text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md text-[10px] font-black border border-rose-100/40 animate-pulse">
                          متأخرة
                          <AlertCircle size={10} className="stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-indigo-50/50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-black shadow-sm" title={getUserName(task.assignedTo)}>
                        {getUserName(task.assignedTo).substring(0, 2)}
                      </div>
                    </div>
                    
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id!, e.target.value as Task['status'])}
                      className="text-xs font-black bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-600 outline-none cursor-pointer"
                    >
                      <option value="todo">مطلوبة</option>
                      <option value="in-progress">قيد التنفيذ</option>
                      <option value="review">مراجعة</option>
                      <option value="done">مكتملة</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
