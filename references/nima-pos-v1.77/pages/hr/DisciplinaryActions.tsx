import React, { useState } from 'react';
import { AlertOctagon, Plus, Search, Edit, Trash2, User, Calendar as CalendarIcon, FileText, Save, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { DisciplinaryAction } from '../../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const DisciplinaryActions: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<Partial<DisciplinaryAction> | null>(null);

  const actions = useLiveQuery(() => db.disciplinaryActions.toArray());

  const filteredActions = actions?.filter(action =>
    action.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAction?.employeeId || !editingAction?.employeeName || !editingAction?.type || !editingAction?.reason) return;

    const actionData: DisciplinaryAction = {
      employeeId: editingAction.employeeId,
      employeeName: editingAction.employeeName,
      type: editingAction.type as any,
      date: editingAction.date || new Date().toISOString().split('T')[0],
      reason: editingAction.reason,
      actionTaken: editingAction.actionTaken || '',
      status: editingAction.status as any || 'pending',
    };

    if (editingAction.id) {
      await db.disciplinaryActions.update(editingAction.id, actionData);
    } else {
      await db.disciplinaryActions.add(actionData);
    }

    setIsModalOpen(false);
    setEditingAction(null);
  };

  const handleDelete = async (id: number) => {
    alert('لأسباب قانونية وتنظيمية (سجل التدقيق)، لا يمكن حذف الإجراءات التأديبية من النظام. يمكنك تغيير حالتها إلى "منتهي" أو إضافة إجراء توضيحي.');
  };

  const openModal = (action?: DisciplinaryAction) => {
    if (action) {
      setEditingAction(action);
    } else {
      setEditingAction({
        employeeId: 0,
        employeeName: '',
        type: 'verbal_warning',
        date: new Date().toISOString().split('T')[0],
        reason: '',
        actionTaken: '',
        status: 'pending'
      });
    }
    setIsModalOpen(true);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'verbal_warning': return 'إنذار شفهي';
      case 'written_warning': return 'إنذار كتابي';
      case 'suspension': return 'إيقاف عن العمل';
      case 'termination': return 'إنهاء خدمة';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'active': return 'ساري';
      case 'resolved': return 'منتهي';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'active': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <AlertOctagon className="w-8 h-8 text-indigo-600" />
            الإجراءات التأديبية
          </h1>
          <p className="text-slate-500 mt-1">إدارة الإنذارات والخصومات والإجراءات التأديبية</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة إجراء جديد
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث في الإجراءات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الموظف</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">نوع الإجراء</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">تاريخ الإجراء</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">السبب</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الحالة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActions?.map(action => (
                <tr key={action.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{action.employeeName}</div>
                    <div className="text-xs text-slate-500">#{action.employeeId}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700">
                      <FileText className="w-3.5 h-3.5" />
                      {getTypeLabel(action.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {format(new Date(action.date), 'dd MMMM yyyy', { locale: ar })}
                  </td>
                  <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={action.reason}>
                    {action.reason}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(action.status)}`}>
                      {getStatusLabel(action.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openModal(action)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => action.id && handleDelete(action.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredActions?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <AlertOctagon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    لا توجد إجراءات تأديبية مسجلة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && editingAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingAction.id ? 'تعديل الإجراء التأديبي' : 'تسجيل مخالفة جديدة'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="action-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">اسم الموظف *</label>
                    <input
                      type="text"
                      required
                      value={editingAction.employeeName || ''}
                      onChange={e => setEditingAction({...editingAction, employeeName: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">الرقم الوظيفي *</label>
                    <input
                      type="number"
                      required
                      value={editingAction.employeeId || ''}
                      onChange={e => setEditingAction({...editingAction, employeeId: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">نوع الإجراء *</label>
                    <select
                      required
                      value={editingAction.type || 'verbal_warning'}
                      onChange={e => setEditingAction({...editingAction, type: e.target.value as any})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="verbal_warning">إنذار شفهي</option>
                      <option value="written_warning">إنذار كتابي</option>
                      <option value="suspension">إيقاف عن العمل</option>
                      <option value="termination">إنهاء خدمة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">تاريخ الإجراء *</label>
                    <input
                      type="date"
                      required
                      value={editingAction.date || ''}
                      onChange={e => setEditingAction({...editingAction, date: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">الحالة *</label>
                    <select
                      required
                      value={editingAction.status || 'pending'}
                      onChange={e => setEditingAction({...editingAction, status: e.target.value as any})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="pending">قيد المراجعة</option>
                      <option value="active">ساري</option>
                      <option value="resolved">منتهي</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">السبب (تفاصيل المخالفة) *</label>
                  <textarea
                    required
                    rows={3}
                    value={editingAction.reason || ''}
                    onChange={e => setEditingAction({...editingAction, reason: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الإجراء المتخذ (القرار)</label>
                  <textarea
                    rows={3}
                    value={editingAction.actionTaken || ''}
                    onChange={e => setEditingAction({...editingAction, actionTaken: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="action-form"
                className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors font-medium flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisciplinaryActions;
