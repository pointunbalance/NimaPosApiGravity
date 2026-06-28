import React from 'react';
import { format, differenceInDays } from 'date-fns';
import { Task } from '../../types';

interface TasksGanttProps {
  filteredTasks: Task[];
  projects: any[];
  ganttData: { start: Date; end: Date; days: Date[] };
  onEdit: (task: Task) => void;
}

export const TasksGantt: React.FC<TasksGanttProps> = ({
  filteredTasks,
  projects,
  ganttData,
  onEdit,
}) => {
  const getProjectName = (id: number) => projects?.find(p => p.id === id)?.name || 'مشروع غير معروف';

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-indigo-100/40 overflow-x-auto p-5 font-['Tajawal']">
      <div className="min-w-[800px]">
        <div className="flex border-b border-indigo-100/50 pb-3 mb-4">
          <div className="w-64 shrink-0 font-black text-slate-700">المهمة والمشروع</div>
          <div className="flex-1 flex">
            {ganttData.days.map((day, i) => (
              <div key={i} className="flex-1 text-center text-xs font-black text-slate-500 border-l border-indigo-50/40 last:border-0">
                {format(day, 'MM/dd')}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {filteredTasks.map(task => {
            const taskStart = task.startDate ? new Date(task.startDate) : new Date();
            const taskEnd = task.dueDate ? new Date(task.dueDate) : new Date();
            
            const startOffset = Math.max(0, differenceInDays(taskStart, ganttData.start));
            const duration = Math.max(1, differenceInDays(taskEnd, taskStart) + 1);
            
            const rightPercent = (startOffset / ganttData.days.length) * 100;
            const widthPercent = (duration / ganttData.days.length) * 100;
            
            return (
              <div key={task.id} className="flex items-center group">
                <div className="w-64 shrink-0 pr-4">
                  <h4 className="font-black text-sm text-slate-800 truncate" title={task.title}>{task.title}</h4>
                  <p className="text-xs text-slate-500 font-bold truncate">{getProjectName(task.projectId)}</p>
                </div>
                <div className="flex-1 relative h-8 bg-slate-50 border border-slate-100 rounded-xl" dir="ltr">
                  <div 
                    className={`absolute h-full rounded-xl flex items-center px-3 text-xs text-white overflow-hidden font-black transition-all cursor-pointer hover:opacity-90 shadow-sm ${
                      task.status === 'done' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                      task.status === 'in-progress' ? 'bg-gradient-to-r from-blue-500 to-sky-500' :
                      task.status === 'review' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-slate-400 to-slate-500'
                    }`}
                    style={{ left: `${rightPercent}%`, width: `${widthPercent}%` }}
                    title={`${format(taskStart, 'yyyy-MM-dd')} - ${format(taskEnd, 'yyyy-MM-dd')}`}
                    onClick={() => onEdit(task)}
                  >
                    <span className="truncate">{task.title}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
