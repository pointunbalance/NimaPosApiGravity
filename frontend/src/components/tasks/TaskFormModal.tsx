import React from 'react';
import { X, Save } from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '../../types';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTask: Task | null;
  formData: Partial<Task>;
  setFormData: (data: Partial<Task>) => void;
  onSubmit: (e: React.FormEvent) => void;
  projects: any[];
  users: any[];
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  editingTask,
  formData,
  setFormData,
  onSubmit,
  projects,
  users,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in font-['Tajawal']">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-indigo-100/50">
        <div className="p-6 border-b border-indigo-50 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-black text-slate-800">
            {editingTask ? 'تعديل تفاصيل المهمة' : 'إضافة مهمة جديدة للمشروع'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl transition-all">
            <X size={20} className="stroke-[2.5]" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-700 mb-1.5">عنوان المهمة *</label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">المشروع التابع له *</label>
              <select
                required
                value={formData.projectId || ''}
                onChange={e => setFormData({...formData, projectId: parseInt(e.target.value)})}
                className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-700 cursor-pointer appearance-none"
              >
                <option value="">اختر المشروع...</option>
                {projects?.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">الموظف المسؤول عن التنفيذ</label>
              <select
                value={formData.assignedTo || ''}
                onChange={e => setFormData({...formData, assignedTo: parseInt(e.target.value) || undefined})}
                className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-700 cursor-pointer appearance-none"
              >
                <option value="">غير معين</option>
                {users?.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">تاريخ بدء المهمة</label>
              <input
                type="date"
                value={formData.startDate ? format(new Date(formData.startDate), 'yyyy-MM-dd') : ''}
                onChange={e => setFormData({...formData, startDate: e.target.value ? new Date(e.target.value) : undefined})}
                className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">تاريخ الاستحقاق والتسليم</label>
              <input
                type="date"
                value={formData.dueDate ? format(new Date(formData.dueDate), 'yyyy-MM-dd') : ''}
                onChange={e => setFormData({...formData, dueDate: e.target.value ? new Date(e.target.value) : undefined})}
                className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">الساعات المقدرة للعمل</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.estimatedHours || ''}
                onChange={e => setFormData({...formData, estimatedHours: parseFloat(e.target.value) || 0})}
                className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">الساعات الفعلية المستهلكة</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.actualHours || ''}
                onChange={e => setFormData({...formData, actualHours: parseFloat(e.target.value) || 0})}
                className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">أولوية التنفيذ</label>
              <select
                value={formData.priority || 'medium'}
                onChange={e => setFormData({...formData, priority: e.target.value as Task['priority']})}
                className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-700 cursor-pointer"
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">حالة العمل الحالية</label>
              <select
                value={formData.status || 'todo'}
                onChange={e => setFormData({...formData, status: e.target.value as Task['status']})}
                className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-700 cursor-pointer"
              >
                <option value="todo">مطلوبة</option>
                <option value="in-progress">قيد التنفيذ</option>
                <option value="review">قيد المراجعة</option>
                <option value="done">مكتملة</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">تفاصيل وشرح المهمة</label>
            <textarea
              rows={4}
              value={formData.description || ''}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-slate-50/70 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-indigo-50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-black text-sm transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white rounded-xl font-black shadow-md shadow-indigo-500/10 flex items-center gap-2 text-sm transition-all cursor-pointer active:scale-95"
            >
              <Save size={18} className="stroke-[2.5]" />
              حفظ المهمة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
