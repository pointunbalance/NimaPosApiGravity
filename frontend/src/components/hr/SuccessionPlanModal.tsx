import React from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { User, SuccessionPlan } from '../../types';

interface SuccessionPlanModalProps {
  isOpen: boolean;
  editingPlan: Partial<SuccessionPlan> | null;
  setEditingPlan: (plan: Partial<SuccessionPlan> | null) => void;
  employeeList: User[];
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export const SuccessionPlanModal: React.FC<SuccessionPlanModalProps> = ({
  isOpen,
  editingPlan,
  setEditingPlan,
  employeeList,
  onClose,
  onSave,
}) => {
  if (!isOpen || !editingPlan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-row-reverse text-right">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-500 bg-white p-2 rounded-full shadow-sm">
            <X size={20} />
          </button>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            تعيين خطة التعاقب المستهدفة
          </h2>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-right">
          <form id="plan-form" onSubmit={onSave} className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{editingPlan.role}</h3>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-4 flex-row-reverse">
                <button type="button" onClick={() => {
                  setEditingPlan({
                    ...editingPlan,
                    successors: [...(editingPlan.successors || []), { employeeId: employeeList[0]?.id || 0, readiness: 50, flightRisk: 20 }]
                  });
                }} className="text-sm text-indigo-600 font-bold flex items-center gap-1">
                  <Plus size={16} /> إضافة بديل
                </button>
                <label className="block text-sm font-bold text-slate-700">البدلاء المحتملون</label>
              </div>
              
              <div className="space-y-4">
                {editingPlan.successors?.map((succ, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl items-center">
                    <div className="col-span-12 md:col-span-5 text-right">
                      <label className="text-xs font-bold text-slate-500 mb-1 block">الموظف</label>
                      <select
                        value={succ.employeeId}
                        onChange={e => {
                          const updated = [...editingPlan.successors!];
                          updated[index].employeeId = Number(e.target.value);
                          setEditingPlan({...editingPlan, successors: updated});
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                      >
                        {employeeList.map(u => (
                          <option key={u.id} value={u.id}>{u.name} - {u.jobTitle}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-5 md:col-span-3 text-right">
                      <label className="text-xs font-bold text-slate-500 mb-1 block">الجاهزية %</label>
                      <input type="number" min="0" max="100" value={succ.readiness} onChange={e => {
                        const updated = [...editingPlan.successors!];
                        updated[index].readiness = Number(e.target.value);
                        setEditingPlan({...editingPlan, successors: updated});
                      }} className="w-full px-3 py-2 text-center border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="col-span-5 md:col-span-3 text-right">
                      <label className="text-xs font-bold text-slate-500 mb-1 block">خطر المغادرة %</label>
                      <input type="number" min="0" max="100" value={succ.flightRisk} onChange={e => {
                        const updated = [...editingPlan.successors!];
                        updated[index].flightRisk = Number(e.target.value);
                        setEditingPlan({...editingPlan, successors: updated});
                      }} className="w-full px-3 py-2 text-center border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="col-span-2 md:col-span-1 flex justify-end">
                      <button type="button" onClick={() => {
                        const updated = editingPlan.successors!.filter((_, i) => i !== index);
                        setEditingPlan({...editingPlan, successors: updated});
                      }} className="text-rose-500 p-2 mt-4">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {editingPlan.successors?.length === 0 && (
                  <div className="text-center text-sm text-slate-500 p-4 border border-dashed border-slate-300 rounded-xl">
                    لا يوجد بدلاء محددين
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 flex-row-reverse text-right">
          <button type="submit" form="plan-form" className="px-5 py-2.5 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl transition flex items-center gap-2">
            <Save size={18} /> حفظ الخطة
          </button>
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessionPlanModal;
