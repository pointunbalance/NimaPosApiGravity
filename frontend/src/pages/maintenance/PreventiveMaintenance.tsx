import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Calendar, Wrench, Plus, Search, CheckCircle, Clock, AlertTriangle, Edit, Trash2, X, Save, User, DollarSign, Filter, CheckSquare, Square } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { PreventiveMaintenance as PreventiveMaintenanceType } from '../../types';

export const PreventiveMaintenance: React.FC = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Partial<PreventiveMaintenanceType> | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [completeId, setCompleteId] = useState<number | null>(null);

  const schedules = useLiveQuery(() => db.preventiveMaintenance?.toArray() || []) || [];

  const filteredSchedules = schedules.filter(s => {
    const matchesSearch = s.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: schedules.length,
    pending: schedules.filter(s => s.status === 'pending').length,
    completed: schedules.filter(s => s.status === 'completed').length,
    overdue: schedules.filter(s => s.status === 'overdue').length,
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchedule?.equipment || !editingSchedule?.type || !editingSchedule?.nextDate) {
      showToast('يرجى تعبئة الحقول المطلوبة', 'warning');
      return;
    }

    const scheduleData: PreventiveMaintenanceType = {
      equipment: editingSchedule.equipment,
      type: editingSchedule.type,
      frequency: editingSchedule.frequency || 'شهري',
      nextDate: editingSchedule.nextDate,
      lastDate: editingSchedule.lastDate,
      status: editingSchedule.status || 'pending',
      assignedTo: editingSchedule.assignedTo,
      estimatedCost: editingSchedule.estimatedCost ? Number(editingSchedule.estimatedCost) : undefined,
      notes: editingSchedule.notes || '',
      checklist: editingSchedule.checklist || [],
    };

    try {
      if (editingSchedule.id) {
        await db.preventiveMaintenance?.update(editingSchedule.id, scheduleData as any);
        showToast('تم تحديث جدول الصيانة بنجاح', 'success');
      } else {
        await db.preventiveMaintenance?.add(scheduleData);
        showToast('تمت إضافة جدول صيانة جديد', 'success');
      }
      setIsModalOpen(false);
      setEditingSchedule(null);
    } catch (error) {
      console.error('Error saving schedule:', error);
      showToast('حدث خطأ أثناء حفظ جدول الصيانة', 'error');
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await db.preventiveMaintenance?.delete(deleteId);
        showToast('تم حذف جدول الصيانة بنجاح', 'success');
      } catch (error) {
        console.error('Error deleting schedule:', error);
        showToast('حدث خطأ أثناء الحذف', 'error');
      } finally {
        setDeleteId(null);
      }
    }
  };

  const confirmComplete = async () => {
    if (completeId) {
      try {
        await db.preventiveMaintenance?.update(completeId, { status: 'completed' });
        showToast('تم إتمام الصيانة بنجاح', 'success');
      } catch (error) {
        console.error('Error completing schedule:', error);
        showToast('حدث خطأ أثناء التحديث', 'error');
      } finally {
        setCompleteId(null);
      }
    }
  };

  const openModal = (schedule?: PreventiveMaintenanceType) => {
    if (schedule) {
      setEditingSchedule(schedule);
    } else {
      setEditingSchedule({
        equipment: '',
        type: '',
        frequency: 'شهري',
        nextDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: '',
        checklist: []
      });
    }
    setIsModalOpen(true);
  };

  const handleAddChecklistItem = () => {
    if (editingSchedule) {
      const newItem = { id: Math.random().toString(36).substring(7), task: '', completed: false };
      setEditingSchedule({
        ...editingSchedule,
        checklist: [...(editingSchedule.checklist || []), newItem]
      });
    }
  };

  const handleUpdateChecklistItem = (id: string, field: 'task' | 'completed', value: string | boolean) => {
    if (editingSchedule && editingSchedule.checklist) {
      const updatedChecklist = editingSchedule.checklist.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      );
      setEditingSchedule({ ...editingSchedule, checklist: updatedChecklist });
    }
  };

  const handleRemoveChecklistItem = (id: string) => {
    if (editingSchedule && editingSchedule.checklist) {
      const updatedChecklist = editingSchedule.checklist.filter(item => item.id !== id);
      setEditingSchedule({ ...editingSchedule, checklist: updatedChecklist });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-600" />
            الصيانة الوقائية (Preventive Maintenance)
          </h1>
          <p className="text-slate-500 mt-1">إدارة وجدولة عمليات الصيانة الدورية للمعدات والأصول</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
        >
          <Plus className="w-5 h-5" />
          جدولة صيانة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
          </div>
          <h3 className="text-slate-500 font-medium">إجمالي الجداول</h3>
        </div>
        
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{stats.pending}</span>
          </div>
          <h3 className="text-slate-500 font-medium">قيد الانتظار</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{stats.completed}</span>
          </div>
          <h3 className="text-slate-500 font-medium">مكتملة</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-slate-800">{stats.overdue}</span>
          </div>
          <h3 className="text-slate-500 font-medium">متأخرة</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative md:w-1/3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في الجداول..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">مجدولة</option>
                <option value="completed">مكتملة</option>
                <option value="overdue">متأخرة</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
              <tr>
                <th className="p-4 font-semibold text-sm">المعدة/الأصل</th>
                <th className="p-4 font-semibold text-sm">نوع الصيانة</th>
                <th className="p-4 font-semibold text-sm">التكرار</th>
                <th className="p-4 font-semibold text-sm">التاريخ القادم</th>
                <th className="p-4 font-semibold text-sm">المسؤول</th>
                <th className="p-4 font-semibold text-sm">الحالة</th>
                <th className="p-4 font-semibold text-sm">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <Wrench className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    لا توجد جداول صيانة مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredSchedules.map(schedule => (
                  <tr key={schedule.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <span className="text-slate-800 font-medium">{schedule.equipment}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">{schedule.type}</td>
                    <td className="p-4 text-slate-600">{schedule.frequency}</td>
                    <td className="p-4 text-slate-600">{schedule.nextDate}</td>
                    <td className="p-4 text-slate-600">{schedule.assignedTo || '-'}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        schedule.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : schedule.status === 'overdue'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {schedule.status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                        {schedule.status === 'overdue' && <AlertTriangle className="w-3.5 h-3.5" />}
                        {schedule.status === 'pending' && <Clock className="w-3.5 h-3.5" />}
                        {schedule.status === 'completed' ? 'مكتملة' : schedule.status === 'overdue' ? 'متأخرة' : 'مجدولة'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {schedule.status !== 'completed' && (
                          <button 
                            onClick={() => setCompleteId(schedule.id!)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="إتمام"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => openModal(schedule)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteId(schedule.id!)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && editingSchedule && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-indigo-600" />
                {editingSchedule.id ? 'تعديل جدول صيانة' : 'جدولة صيانة جديدة'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="maintenance-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">المعدة/الأصل *</label>
                    <input
                      type="text"
                      required
                      value={editingSchedule.equipment || ''}
                      onChange={e => setEditingSchedule({...editingSchedule, equipment: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="اسم المعدة أو الأصل"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">نوع الصيانة *</label>
                    <input
                      type="text"
                      required
                      value={editingSchedule.type || ''}
                      onChange={e => setEditingSchedule({...editingSchedule, type: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="مثال: تغيير زيت، فحص شامل"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">التكرار</label>
                    <select
                      value={editingSchedule.frequency || 'شهري'}
                      onChange={e => setEditingSchedule({...editingSchedule, frequency: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="يومي">يومي</option>
                      <option value="أسبوعي">أسبوعي</option>
                      <option value="شهري">شهري</option>
                      <option value="ربع سنوي">ربع سنوي (كل 3 أشهر)</option>
                      <option value="نصف سنوي">نصف سنوي (كل 6 أشهر)</option>
                      <option value="سنوي">سنوي</option>
                      <option value="حسب الحاجة">حسب الحاجة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">التاريخ القادم *</label>
                    <input
                      type="date"
                      required
                      value={editingSchedule.nextDate || ''}
                      onChange={e => setEditingSchedule({...editingSchedule, nextDate: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">تاريخ آخر صيانة</label>
                    <input
                      type="date"
                      value={editingSchedule.lastDate || ''}
                      onChange={e => setEditingSchedule({...editingSchedule, lastDate: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">الحالة</label>
                    <select
                      value={editingSchedule.status || 'pending'}
                      onChange={e => setEditingSchedule({...editingSchedule, status: e.target.value as any})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    >
                      <option value="pending">مجدولة</option>
                      <option value="completed">مكتملة</option>
                      <option value="overdue">متأخرة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">المسؤول (الفني)</label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={editingSchedule.assignedTo || ''}
                        onChange={e => setEditingSchedule({...editingSchedule, assignedTo: e.target.value})}
                        className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="اسم الفني أو المهندس"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">التكلفة المتوقعة</label>
                    <div className="relative">
                      <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingSchedule.estimatedCost || ''}
                        onChange={e => setEditingSchedule({...editingSchedule, estimatedCost: parseFloat(e.target.value)})}
                        className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Checklist Section */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-slate-700">قائمة المهام (Checklist)</label>
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة مهمة
                    </button>
                  </div>
                  
                  {(!editingSchedule.checklist || editingSchedule.checklist.length === 0) ? (
                    <p className="text-sm text-slate-500 text-center py-4">لا توجد مهام مضافة. أضف مهام لتتبع خطوات الصيانة.</p>
                  ) : (
                    <div className="space-y-3">
                      {editingSchedule.checklist.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200">
                          <button
                            type="button"
                            onClick={() => handleUpdateChecklistItem(item.id, 'completed', !item.completed)}
                            className={`text-slate-400 hover:text-indigo-600 transition-colors ${item.completed ? 'text-emerald-500 hover:text-emerald-600' : ''}`}
                          >
                            {item.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                          </button>
                          <input
                            type="text"
                            value={item.task}
                            onChange={(e) => handleUpdateChecklistItem(item.id, 'task', e.target.value)}
                            placeholder={`المهمة ${index + 1}`}
                            className={`flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItem(item.id)}
                            className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ملاحظات</label>
                  <textarea
                    rows={3}
                    value={editingSchedule.notes || ''}
                    onChange={e => setEditingSchedule({...editingSchedule, notes: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    placeholder="أي ملاحظات إضافية..."
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="maintenance-form"
                className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors font-medium flex items-center gap-2 shadow-sm"
              >
                <Save className="w-5 h-5" />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteId !== null}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف جدول الصيانة هذا؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="حذف"
      />

      <ConfirmModal
        isOpen={completeId !== null}
        title="تأكيد إتمام الصيانة"
        message="هل أنت متأكد من إتمام عملية الصيانة هذه؟ سيتم تغيير حالتها إلى 'مكتملة'."
        onConfirm={confirmComplete}
        onCancel={() => setCompleteId(null)}
        confirmText="تأكيد"
      />
    </div>
  );
};

export default PreventiveMaintenance;
