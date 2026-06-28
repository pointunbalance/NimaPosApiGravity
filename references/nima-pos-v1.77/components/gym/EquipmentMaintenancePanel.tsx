import React from 'react';
import { 
  X, 
  Wrench, 
  Calendar, 
  Plus, 
  Clock, 
  FileSpreadsheet, 
  PlusCircle, 
  ClipboardList 
} from 'lucide-react';
import { EquipmentType } from './equipmentTypes';

interface EquipmentMaintenancePanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEquipForHistory: EquipmentType | null;
  showAddLogForm: boolean;
  setShowAddLogForm: (show: boolean) => void;
  logFormData: {
    date: string;
    description: string;
    cost: string;
    paymentMethod: 'cash' | 'bank' | 'on_credit';
    technician: string;
  };
  setLogFormData: (data: any) => void;
  onAddLog: (e: React.FormEvent) => void;
  currency: string;
}

export const EquipmentMaintenancePanel: React.FC<EquipmentMaintenancePanelProps> = ({
  isOpen,
  onClose,
  selectedEquipForHistory,
  showAddLogForm,
  setShowAddLogForm,
  logFormData,
  setLogFormData,
  onAddLog,
  currency
}) => {
  if (!isOpen || !selectedEquipForHistory) return null;

  const logs = selectedEquipForHistory.maintenanceLogs || [];

  return (
    <div className="fixed inset-y-0 left-0 w-full md:w-96 bg-white shadow-2xl border-r border-slate-200 z-[80] flex flex-col justify-between animate-in slide-in-from-left duration-300 font-sans text-right" dir="rtl">
      
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-row-reverse text-right">
        <button 
          onClick={onClose}
          className="p-1 px-3 hover:bg-slate-200 text-slate-500 rounded-full text-xs font-black transition-all cursor-pointer"
        >
          إغلاق ×
        </button>
        
        <div className="flex items-center gap-1.5 flex-row-reverse text-right">
          <Wrench className="w-4.5 h-4.5 text-indigo-600" />
          <h3 className="font-black text-sm text-slate-800">بطاقة الحالة والإنفاق الفني</h3>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* Device overview card */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-right">
          <span className="text-[9px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-md font-bold font-mono">
            #{selectedEquipForHistory.id}
          </span>
          <h4 className="text-sm font-black text-slate-850 mt-1">{selectedEquipForHistory.name}</h4>
          <p className="text-[10px] text-slate-400 mt-0.5 font-bold">التصنيف: {selectedEquipForHistory.type}</p>
          
          <div className="mt-3.5 pt-3 border-t border-slate-250/30 flex justify-between items-center text-[11px] flex-row-reverse">
            <span className="font-bold text-slate-500">حالة التشغيل:</span>
            <span className="font-black text-slate-800">{selectedEquipForHistory.status}</span>
          </div>
        </div>

        {/* Action triggers */}
        <div className="flex justify-between items-center flex-row-reverse">
          <h5 className="font-black text-xs text-slate-800">بيان عمليات الفحص السابقة ({logs.length})</h5>
          
          {!showAddLogForm && (
            <button
              onClick={() => setShowAddLogForm(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black shadow transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>تسجيل فحص دوري/إصلاح</span>
            </button>
          )}
        </div>

        {/* Sub-form layer to insert a new Maintenance Log */}
        {showAddLogForm && (
          <form onSubmit={onAddLog} className="bg-indigo-50/20 border border-indigo-150/40 p-4 rounded-xl space-y-3.5 animate-in fade-in slide-in-from-top-3">
            <div className="flex justify-between items-center flex-row-reverse">
              <span className="text-[10px] font-black text-indigo-700">سند صيانة فنية جديد</span>
              <button
                type="button"
                onClick={() => setShowAddLogForm(false)}
                className="text-[10px] font-bold text-slate-400 hover:text-rose-600"
              >
                إلغاء ×
              </button>
            </div>

            {/* Inputs date & Tech */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-550">تاريخ الصيانة *</label>
                <input 
                  type="date" 
                  value={logFormData.date}
                  onChange={(e) => setLogFormData({...logFormData, date: e.target.value})}
                  required
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-805"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-550">المهندس / الفني المختص *</label>
                <input 
                  type="text" 
                  value={logFormData.technician}
                  onChange={(e) => setLogFormData({...logFormData, technician: e.target.value})}
                  placeholder="شركة الصيانة..."
                  required
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-805 text-right"
                />
              </div>
            </div>

            {/* Cost & Payment mechanism */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-550">رسوم التكلفة ({currency}) *</label>
                <input 
                  type="number" 
                  value={logFormData.cost}
                  onChange={(e) => setLogFormData({...logFormData, cost: e.target.value})}
                  placeholder="أدخل التكلفة مالي..."
                  required
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold text-indigo-705 font-mono text-right"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-550">طريقة الدفع وقيد المحاسبة *</label>
                <select
                  value={logFormData.paymentMethod}
                  onChange={(e) => setLogFormData({...logFormData, paymentMethod: e.target.value as any})}
                  className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-[9px] font-black text-slate-700 text-right"
                >
                  <option value="cash">💵 دفع نقداً وصندوق</option>
                  <option value="bank">🏦 تحويل بنكي / شبكة</option>
                  <option value="on_credit">⏳ صيانة بقيد آجل للحساب</option>
                </select>
              </div>
            </div>

            {/* Description report info */}
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold text-slate-550">التقرير الفني للتصليحات أو التشحيم *</label>
              <textarea 
                value={logFormData.description}
                onChange={(e) => setLogFormData({...logFormData, description: e.target.value})}
                placeholder="مثال: تغيير القشاط البلاستيكي للجهاز وتشحيم التروس الرئيسية"
                required
                rows={2}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[10px]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer"
            >
              حفظ وتوليد القيد المزدوج اليومي
            </button>
          </form>
        )}

        {/* List of historical reports */}
        <div className="space-y-3.5">
          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs border border-dashed rounded-xl p-3">
              لا توجد تقارير أو صيانة دورية سابقة مسجلة لهذا الجهاز.
            </div>
          ) : (
            [...logs].reverse().map((log) => (
              <div key={log.id} className="bg-white border rounded-xl p-3.5 space-y-2 relative shadow-xs">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono flex-row-reverse">
                  <span className="flex items-center gap-1 flex-row-reverse">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{log.date}</span>
                  </span>
                  {log.journalRef && (
                    <span className="bg-slate-100 text-slate-500 px-1 rounded font-bold font-mono">
                      Q: {log.journalRef}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-850 font-black leading-relaxed">{log.description}</p>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] flex-row-reverse">
                  <span className="text-slate-450">المشرف: <strong className="text-slate-600 font-black">{log.technician || 'شركة معتمدة'}</strong></span>
                  <span className="text-rose-650 font-black font-mono">التكلفة: {log.cost.toLocaleString()} {currency}</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      <div className="p-4 border-t bg-slate-50/80 text-[10px] text-slate-400 font-bold leading-normal text-right">
        * كافة تكاليف الصيانة يتم ربطها تلقائياً بالدفتر لإنشاء القيود المزدوجة المناسبة بالتنسيق مع قسم الحسابات وصندوق النقدية.
      </div>

    </div>
  );
};
