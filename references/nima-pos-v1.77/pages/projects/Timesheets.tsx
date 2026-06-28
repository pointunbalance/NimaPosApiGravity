import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Clock, Plus, Search, Calendar, Play, Square, Save, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Timesheet } from '../../types';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const Timesheets: React.FC = () => {
  const { success, error: showError } = useToast();
  const users = useLiveQuery(() => db.users.toArray(), []) || [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) || [];
  const timesheets = useLiveQuery(() => db.timesheets.toArray(), []) || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState<Timesheet | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<Timesheet>>({
    userId: 0,
    projectId: 0,
    date: format(new Date(), 'yyyy-MM-dd'),
    hours: 0,
    description: ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTimesheet?.id) {
        await db.timesheets.put({
          ...formData,
          id: editingTimesheet.id,
          createdAt: editingTimesheet.createdAt,
          updatedAt: new Date()
        } as Timesheet);
        success('تم تحديث سجل الوقت بنجاح');
      } else {
        await db.timesheets.add({
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        } as Timesheet);
        success('تم تسجيل الوقت بنجاح');
      }
      setIsModalOpen(false);
      setEditingTimesheet(null);
      setFormData({
        userId: 0,
        projectId: 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        hours: 0,
        description: ''
      });
    } catch (error) {
      console.error('Error saving timesheet:', error);
      showError('حدث خطأ أثناء حفظ السجل');
    }
  };

  const handleEdit = (timesheet: Timesheet) => {
    setEditingTimesheet(timesheet);
    setFormData(timesheet);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await db.timesheets.delete(deleteId);
        success('تم حذف السجل بنجاح');
      } catch (err) {
        console.error(err);
        showError('حدث خطأ أثناء حذف السجل');
      } finally {
        setDeleteId(null);
      }
    }
  };

  const getUserName = (id: number) => {
    return users.find(u => u.id === id)?.name || 'غير معروف';
  };

  const getProjectName = (id: number) => {
    return projects.find(p => p.id === id)?.name || 'غير معروف';
  };

  const filteredTimesheets = timesheets.filter(ts => {
    const userName = getUserName(ts.userId).toLowerCase();
    const projectName = getProjectName(ts.projectId).toLowerCase();
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = userName.includes(search) || projectName.includes(search) || ts.description.toLowerCase().includes(search);
    const matchesDate = dateFilter ? ts.date === dateFilter : true;
    
    return matchesSearch && matchesDate;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Clock className="w-6 h-6 text-indigo-600" />
          سجلات الوقت (Timesheets)
        </h1>
        <button
          onClick={() => {
            setEditingTimesheet(null);
            setFormData({
              userId: users.length > 0 ? users[0].id : 0,
              projectId: projects.length > 0 ? projects[0].id : 0,
              date: format(new Date(), 'yyyy-MM-dd'),
              hours: 0,
              description: ''
            });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة سجل
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="بحث في السجلات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-900"
            />
            {dateFilter && (
              <button 
                onClick={() => setDateFilter('')}
                className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                مسح
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-4 font-medium">الموظف</th>
                <th className="p-4 font-medium">المشروع</th>
                <th className="p-4 font-medium">التاريخ</th>
                <th className="p-4 font-medium">الساعات</th>
                <th className="p-4 font-medium">الوصف</th>
                <th className="p-4 font-medium">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTimesheets.map((ts) => (
                <tr key={ts.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-900">{getUserName(ts.userId)}</td>
                  <td className="p-4 text-gray-900">{getProjectName(ts.projectId)}</td>
                  <td className="p-4 text-gray-500">{ts.date}</td>
                  <td className="p-4 text-gray-900 font-medium">{ts.hours}</td>
                  <td className="p-4 text-gray-500 truncate max-w-xs">{ts.description}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(ts)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => ts.id && setDeleteId(ts.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTimesheets.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    لا توجد سجلات وقت مطابقة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {editingTimesheet ? 'تعديل سجل وقت' : 'إضافة سجل وقت'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الموظف</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                  required
                >
                  <option value={0}>اختر الموظف...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المشروع</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                  required
                >
                  <option value={0}>اختر المشروع...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الساعات</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={formData.hours || ''}
                    onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                  rows={3}
                  required
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="تأكيد حذف سجل الوقت"
        message="هل أنت متأكد من رغبتك في حذف هذا السجل بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};

export default Timesheets;
