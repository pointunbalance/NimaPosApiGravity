import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { User } from '../../types';
import { Clock3, CheckCircle, ListTodo } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface TasksTabProps {
  user: User;
}

export const TasksTab: React.FC<TasksTabProps> = ({ user }) => {
  const { showToast } = useToast();

  const myTasks = useLiveQuery(() => {
    if (!user?.id) return [];
    return db.tasks.where('assignedTo').equals(user.id).toArray();
  }, [user?.id]);

  const handleUpdateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      await db.tasks.update(taskId, {
        status: newStatus as any,
        updatedAt: new Date()
      });
      showToast('تم تحديث حالة المهمة بنجاح', 'success');
    } catch (error) {
      showToast('حدث خطأ أثناء تحديث المهمة', 'error');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800">مهامي</h2>
        <p className="text-sm text-gray-500">متابعة المهام الموكلة إليك وتحديث حالتها</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {myTasks?.map(task => (
          <div key={task.id} className={`bg-white rounded-xl p-5 border shadow-sm flex flex-col ${
            task.status === 'done' ? 'border-emerald-200' : 'border-gray-200'
          }`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className={`font-bold ${task.status === 'done' ? 'text-emerald-700' : 'text-gray-800'} line-clamp-2`}>{task.title}</h3>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                task.priority === 'high' ? 'bg-red-100 text-red-800' : 
                task.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 
                'bg-blue-100 text-blue-800'
              }`}>
                {task.priority === 'high' ? 'عالية' : task.priority === 'medium' ? 'متوسطة' : 'عادية'}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">{task.description}</p>
            
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <Clock3 className="w-4 h-4" />
                {new Date(task.dueDate).toLocaleDateString('ar-EG')}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 mt-auto">
              <select
                value={task.status}
                onChange={(e) => handleUpdateTaskStatus(task.id!, e.target.value)}
                className={`w-full text-sm rounded-lg p-2 font-medium border-0 ring-1 focus:ring-2 ${
                  task.status === 'done' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 focus:ring-emerald-500' :
                  task.status === 'in-progress' ? 'bg-blue-50 text-blue-700 ring-blue-200 focus:ring-blue-500' :
                  'bg-gray-50 text-gray-700 ring-gray-200 focus:ring-gray-500'
                }`}
              >
                <option value="todo">قيد الانتظار</option>
                <option value="in-progress">قيد التنفيذ</option>
                <option value="review">مراجعة</option>
                <option value="done">مكتملة</option>
              </select>
            </div>
          </div>
        ))}
        {myTasks?.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <ListTodo className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p>لا توجد مهام موكلة إليك حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
};
