import React, { useState } from 'react';
import { Factory, Plus, Search, Edit, Trash2, Save, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { WorkCenter } from '../../types';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../context/ToastContext';

const WorkCenters: React.FC = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [centerToDeleteId, setCenterToDeleteId] = useState<number | null>(null);
  const [editingCenter, setEditingCenter] = useState<Partial<WorkCenter> | null>(null);

  const workCenters = useLiveQuery(() => db.workCenters.toArray());

  const filteredCenters = workCenters?.filter(center =>
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCenter?.name || !editingCenter?.code) return;

    const centerData: WorkCenter = {
      name: editingCenter.name,
      code: editingCenter.code,
      workingHours: Number(editingCenter.workingHours) || 8,
      hourlyCost: Number(editingCenter.hourlyCost) || 0,
      notes: editingCenter.notes,
    };

    if (editingCenter.id) {
      await db.workCenters.update(editingCenter.id, centerData);
      showToast('تم تعديل مركز العمل بنجاح', 'success');
    } else {
      await db.workCenters.add(centerData);
      showToast('تم إضافة مركز العمل بنجاح', 'success');
    }

    setIsModalOpen(false);
    setEditingCenter(null);
  };

  const handleDelete = (id: number) => {
    setCenterToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (centerToDeleteId) {
      await db.workCenters.delete(centerToDeleteId);
      showToast('تم حذف مركز العمل بنجاح', 'success');
      setCenterToDeleteId(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const openModal = (center?: WorkCenter) => {
    if (center) {
      setEditingCenter(center);
    } else {
      setEditingCenter({
        name: '',
        code: '',
        workingHours: 8,
        hourlyCost: 0,
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Factory className="w-8 h-8 text-indigo-600" />
            مراكز العمل
          </h1>
          <p className="text-slate-500 mt-1">إدارة مراكز العمل وخطوط الإنتاج</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة مركز عمل
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث في مراكز العمل..."
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
                <th className="px-6 py-4 text-sm font-bold text-slate-600">اسم المركز</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الكود</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">ساعات العمل</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">تكلفة الساعة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCenters?.map(center => (
                <tr key={center.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{center.name}</td>
                  <td className="px-6 py-4 text-slate-600">{center.code}</td>
                  <td className="px-6 py-4 text-slate-600">{center.workingHours}</td>
                  <td className="px-6 py-4 text-slate-600">{center.hourlyCost}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openModal(center)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => center.id && handleDelete(center.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCenters?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Factory className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    لا توجد مراكز عمل مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && editingCenter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCenter.id ? 'تعديل مركز العمل' : 'إضافة مركز عمل جديد'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="workcenter-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">اسم المركز *</label>
                  <input
                    type="text"
                    required
                    value={editingCenter.name || ''}
                    onChange={e => setEditingCenter({...editingCenter, name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الكود *</label>
                  <input
                    type="text"
                    required
                    value={editingCenter.code || ''}
                    onChange={e => setEditingCenter({...editingCenter, code: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ساعات العمل اليومية</label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={editingCenter.workingHours || ''}
                      onChange={e => setEditingCenter({...editingCenter, workingHours: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">تكلفة الساعة</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingCenter.hourlyCost || ''}
                      onChange={e => setEditingCenter({...editingCenter, hourlyCost: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">ملاحظات</label>
                  <textarea
                    rows={3}
                    value={editingCenter.notes || ''}
                    onChange={e => setEditingCenter({...editingCenter, notes: e.target.value})}
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
                form="workcenter-form"
                className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors font-medium flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="حذف مركز العمل"
        message="هل أنت متأكد من رغبتك في حذف مركز العمل هذا؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};

export default WorkCenters;
