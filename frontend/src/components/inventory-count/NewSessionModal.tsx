import React from 'react';
import { Plus, X, ClipboardList, ScanLine, ListTree, PackageSearch } from 'lucide-react';
import { Warehouse, Category } from '../../types';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouses: Warehouse[] | undefined;
  categories: Category[] | undefined;
  selectedWarehouseId: number | '';
  setSelectedWarehouseId: (id: number | '') => void;
  countType: 'comprehensive' | 'spot' | 'cycle';
  setCountType: (type: 'comprehensive' | 'spot' | 'cycle') => void;
  selectedCategoryId: number | '';
  setSelectedCategoryId: (id: number | '') => void;
  notes: string;
  setNotes: (notes: string) => void;
  handleCreateSession: (e: React.FormEvent) => void;
}

const NewSessionModal: React.FC<NewSessionModalProps> = ({
  isOpen,
  onClose,
  warehouses,
  categories,
  selectedWarehouseId,
  setSelectedWarehouseId,
  countType,
  setCountType,
  selectedCategoryId,
  setSelectedCategoryId,
  notes,
  setNotes,
  handleCreateSession,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
            <Plus className="w-6 h-6 text-indigo-600" />
            بدء جلسة جرد جديدة
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <form id="newSessionForm" onSubmit={handleCreateSession} className="space-y-6">
            
            {/* Inventory Type Selector */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setCountType('comprehensive')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${countType === 'comprehensive' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                 <ClipboardList className={`w-6 h-6 ${countType === 'comprehensive' ? 'text-indigo-600' : 'text-slate-400'}`} />
                 <span className="font-bold text-sm">جرد شامل</span>
                 <span className="text-[10px] text-slate-400 font-medium text-center leading-tight">إغلاق وتسوّية كاملة (End of Month)</span>
              </button>
              
              <button
                type="button"
                onClick={() => setCountType('cycle')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${countType === 'cycle' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                 <ListTree className={`w-6 h-6 ${countType === 'cycle' ? 'text-indigo-600' : 'text-slate-400'}`} />
                 <span className="font-bold text-sm">جرد دوري</span>
                 <span className="text-[10px] text-slate-400 font-medium text-center leading-tight">بحسب التصنيف (Cycle Count)</span>
              </button>

               <button
                type="button"
                onClick={() => setCountType('spot')}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${countType === 'spot' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
              >
                 <ScanLine className={`w-6 h-6 ${countType === 'spot' ? 'text-indigo-600' : 'text-slate-400'}`} />
                 <span className="font-bold text-sm">جرد مفاجئ</span>
                 <span className="text-[10px] text-slate-400 font-medium text-center leading-tight">تفتيش عشوائي لـ 5 أصناف (Spot Check)</span>
              </button>
            </div>

            <div className={`grid gap-4 ${countType === 'cycle' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  المخزن المستهدف <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-700 appearance-none"
                  required
                >
                  <option value="" disabled>
                    اختر المخزن...
                  </option>
                  {warehouses?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              {countType === 'cycle' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    التصنيف (القسم) <span className="text-red-500">*</span>
                  </label>
                   <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-700 appearance-none"
                    required
                  >
                    <option value="" disabled>
                      اختر التصنيف...
                    </option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                ملاحظات أو سبب الجرد (اختياري)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-sm transition-all resize-none h-24 text-slate-900 placeholder-slate-400"
                placeholder="أدخل أي ملاحظات لسياق هذا الجرد..."
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all"
          >
            إلغاء
          </button>
          <button
            form="newSessionForm"
            type="submit"
            className="flex-1 py-3.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <PackageSearch className="w-5 h-5" />
            توليد قائمة الجرد
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSessionModal;
