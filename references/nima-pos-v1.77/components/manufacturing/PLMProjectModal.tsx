import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PLMProject, User } from '../../types';

interface PLMProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<PLMProject>) => void;
  editingProject?: PLMProject | null;
  users: User[];
}

const PLMProjectModal: React.FC<PLMProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingProject,
  users
}) => {
  const [formData, setFormData] = useState<Partial<PLMProject>>({
    name: '',
    description: '',
    status: 'concept',
    startDate: new Date(),
    targetLaunchDate: undefined,
    managerId: 0,
    budget: 0,
    documents: []
  });

  useEffect(() => {
    if (editingProject) {
      setFormData(editingProject);
    } else {
      setFormData({
        name: '',
        description: '',
        status: 'concept',
        startDate: new Date(),
        targetLaunchDate: undefined,
        managerId: users.length > 0 ? users[0].id : 0,
        budget: 0,
        documents: []
      });
    }
  }, [editingProject, isOpen, users]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      createdAt: editingProject?.createdAt || new Date(),
      updatedAt: new Date()
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {editingProject ? 'تعديل مشروع' : 'مشروع منتج جديد'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">اسم المشروع / المنتج</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">الوصف</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">الحالة</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="concept">مفهوم (Concept)</option>
                <option value="design">تصميم (Design)</option>
                <option value="prototyping">نمذجة (Prototyping)</option>
                <option value="testing">اختبار (Testing)</option>
                <option value="production">إنتاج (Production)</option>
                <option value="retired">متقاعد (Retired)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">مدير المشروع</label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: Number(e.target.value) })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={0}>اختر المدير...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">تاريخ البدء</label>
              <input
                type="date"
                value={formData.startDate ? new Date(formData.startDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value) })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">تاريخ الإطلاق المستهدف</label>
              <input
                type="date"
                value={formData.targetLaunchDate ? new Date(formData.targetLaunchDate).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, targetLaunchDate: new Date(e.target.value) })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">الميزانية</label>
              <input
                type="number"
                value={formData.budget || ''}
                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              حفظ المشروع
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PLMProjectModal;
