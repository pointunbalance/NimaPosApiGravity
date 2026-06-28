import React from 'react';
import { InventoryCountSession, InventoryCountItem } from '../../types';
import { X, AlertTriangle, Save, CheckCircle2, FileText, Play, XCircle, Printer, Download } from 'lucide-react';

interface ActiveSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSession: InventoryCountSession | null;
  activeItems: InventoryCountItem[];
  getWarehouseName: (id: number) => string;
  handleUpdateActualQuantity: (productId: number, value: string) => void;
  handleUpdateItemNotes: (productId: number, notes: string) => void;
  handleUpdateAdjustmentReason: (productId: number, reason: string) => void;
  handleCancelSession: () => void;
  handleSaveDraft: () => void;
  handleCompleteSession: () => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return (
        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <FileText className="w-3 h-3" /> مسودة
        </span>
      );
    case 'in_progress':
      return (
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Play className="w-3 h-3" /> قيد التنفيذ
        </span>
      );
    case 'completed':
      return (
        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> مكتمل
        </span>
      );
    case 'cancelled':
      return (
        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <XCircle className="w-3 h-3" /> ملغي
        </span>
      );
    default:
      return null;
  }
};

const ActiveSessionModal: React.FC<ActiveSessionModalProps> = ({
  isOpen,
  onClose,
  selectedSession,
  activeItems,
  getWarehouseName,
  handleUpdateActualQuantity,
  handleUpdateItemNotes,
  handleUpdateAdjustmentReason,
  handleCancelSession,
  handleSaveDraft,
  handleCompleteSession,
}) => {
  const [showVariances, setShowVariances] = React.useState(false);

  const handleExportCSV = () => {
    if (!selectedSession) return;
    
    const headers = ['المنتج', 'الرصيد النظري (Theoretical)', 'الرصيد الفعلي (Physical)', 'الفجوة (Gap)', 'ملاحظات'];
    const csvContent = [
      headers.join(','),
      ...activeItems.map(item => [
        `"${item.productName}"`,
        item.systemQuantity,
        item.actualQuantity !== null ? item.actualQuantity : '',
        item.difference,
        `"${item.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_count_${selectedSession.id}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !selectedSession) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
              جلسة جرد
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-sm font-bold tracking-wider ml-2">
                INV-{selectedSession.id?.toString().padStart(4, '0')}
              </span>
            </h3>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              المخزن:{' '}
              <span className="font-bold text-slate-700">
                {getWarehouseName(selectedSession.warehouseId)}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            {getStatusBadge(selectedSession.status)}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50/50">
          {/* Desktop View */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-4 font-bold">المنتج</th>
                  <th className="px-4 py-4 font-bold text-center w-32 leading-tight">الرصيد النظري<br/><span className="text-[10px] text-slate-400 font-normal tracking-wide">THEORETICAL</span></th>
                  <th className="px-4 py-4 font-bold text-center w-40 leading-tight">الرصيد الفعلي<br/><span className="text-[10px] text-slate-400 font-normal tracking-wide">PHYSICAL</span></th>
                  <th className="px-4 py-4 font-bold text-center w-32 leading-tight">الفجوة<br/><span className="text-[10px] text-slate-400 font-normal tracking-wide">GAP</span></th>
                  <th className="px-4 py-4 font-bold w-1/4">ملاحظات والتسويات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeItems.map((item) => {
                  const isCompleted =
                    selectedSession.status === 'completed' ||
                    selectedSession.status === 'cancelled';
                  const diff = item.difference;
                  const diffColor =
                    diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-slate-400';

                  const canSeeVariances = isCompleted || showVariances;

                  return (
                    <tr key={item.productId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-800">{item.productName}</td>
                      <td className="px-4 py-3 font-black text-center text-slate-500">
                        {canSeeVariances ? item.systemQuantity : <span className="text-slate-300 blur-sm select-none" title="الرصيد النظري مخفي أثناء الجرد">???</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isCompleted ? (
                          <span className="font-black text-indigo-600">
                            {item.actualQuantity !== null ? item.actualQuantity : '-'}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            value={item.actualQuantity === null ? '' : item.actualQuantity}
                            onChange={(e) =>
                              handleUpdateActualQuantity(item.productId, e.target.value)
                            }
                            className="w-full bg-white border border-slate-200 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-center text-indigo-600"
                            placeholder="-"
                          />
                        )}
                      </td>
                      <td className={`px-4 py-3 font-black text-center ${canSeeVariances ? diffColor : 'text-slate-300 blur-sm select-none'}`} dir="ltr" title={!canSeeVariances ? "الفجوة مخفية أثناء الجرد" : ""}>
                        {canSeeVariances ? (item.actualQuantity !== null ? (diff > 0 ? `+${diff}` : diff) : '-') : '???'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          {isCompleted ? (
                            <span className="text-slate-500 text-xs">{item.notes || '-'}</span>
                          ) : (
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => handleUpdateItemNotes(item.productId, e.target.value)}
                              className="w-full bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-500 px-2 py-1 outline-none text-xs transition-colors text-slate-800 placeholder-slate-400"
                              placeholder="أضف ملاحظة..."
                            />
                          )}
                          
                          {canSeeVariances && diff !== 0 && !isCompleted && item.actualQuantity !== null && (
                             <select
                               value={item.adjustmentReason || ''}
                               onChange={(e) => handleUpdateAdjustmentReason(item.productId, e.target.value)}
                               className="text-xs bg-slate-50 border border-slate-200 rounded p-1 outline-none focus:border-indigo-500 text-slate-700"
                             >
                                <option value="" disabled>اختر سبب التسوية...</option>
                                <option value="wastage">تسوية هالك (Wastage)</option>
                                <option value="shortage">تسوية فقد/سرقة (Shortage)</option>
                                <option value="wrong_entry">خطأ إدخال سابق (Wrong Entry)</option>
                                <option value="inventory_count">أخرى (Other)</option>
                             </select>
                          )}
                          
                          {isCompleted && diff !== 0 && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded w-fit">
                              سبب: {item.adjustmentReason === 'wastage' ? 'هالك' : item.adjustmentReason === 'shortage' ? 'فقد/سرقة' : item.adjustmentReason === 'wrong_entry' ? 'خطأ إدخال' : 'أخرى'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden flex flex-col gap-4">
             {activeItems.map((item) => {
                  const isCompleted = selectedSession.status === 'completed' || selectedSession.status === 'cancelled';
                  const diff = item.difference;
                  const diffColor = diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-slate-400';
                  const canSeeVariances = isCompleted || showVariances;

                  return (
                    <div key={item.productId} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-3">
                       <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                          <h4 className="font-bold text-slate-800">{item.productName}</h4>
                          <div className="text-left flex flex-col items-end">
                             <span className="text-[10px] text-slate-400 font-bold mb-1">الرصيد النظري</span>
                             <span className="font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-sm">
                               {canSeeVariances ? item.systemQuantity : <span className="text-slate-300 blur-sm select-none">???</span>}
                             </span>
                          </div>
                       </div>
                       
                       <div className="flex items-center justify-between gap-4 py-2">
                          <div className="flex-1">
                             <label className="block text-[10px] font-bold text-slate-500 mb-1">الكمية الفعلية (على الرف)</label>
                             {isCompleted ? (
                              <div className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg font-black text-indigo-600 text-center">
                                {item.actualQuantity !== null ? item.actualQuantity : '-'}
                              </div>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                value={item.actualQuantity === null ? '' : item.actualQuantity}
                                onChange={(e) => handleUpdateActualQuantity(item.productId, e.target.value)}
                                className="w-full bg-white border-2 border-indigo-100 px-3 py-2 rounded-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-black text-center text-indigo-600 text-lg"
                                placeholder="..."
                              />
                            )}
                          </div>
                          <div className="w-20 text-center border-l border-slate-100 pl-4">
                             <label className="block text-[10px] font-bold text-slate-500 mb-1">الفجوة</label>
                             <div className={`font-black text-lg ${canSeeVariances ? diffColor : 'text-slate-300 blur-sm select-none'}`} dir="ltr">
                                {canSeeVariances ? (item.actualQuantity !== null ? (diff > 0 ? `+${diff}` : diff) : '-') : '???'}
                             </div>
                          </div>
                       </div>

                       <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                          {isCompleted ? (
                            <p className="text-slate-500 text-xs">{item.notes || 'لا توجد ملاحظات'}</p>
                          ) : (
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => handleUpdateItemNotes(item.productId, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 px-3 py-2 rounded-lg outline-none text-xs text-slate-800 placeholder-slate-400"
                              placeholder="أضف ملاحظة (اختياري)..."
                            />
                          )}
                          
                          {canSeeVariances && diff !== 0 && !isCompleted && item.actualQuantity !== null && (
                             <select
                               value={item.adjustmentReason || ''}
                               onChange={(e) => handleUpdateAdjustmentReason(item.productId, e.target.value)}
                               className="text-xs font-bold bg-white border-2 border-rose-100 rounded-lg p-2 outline-none focus:border-rose-500 text-rose-700 w-full mt-1"
                             >
                                <option value="" disabled>⚠️ اختر سبب التسوية...</option>
                                <option value="wastage">تسوية هالك (Wastage)</option>
                                <option value="shortage">تسوية فقد/سرقة (Shortage)</option>
                                <option value="wrong_entry">خطأ إدخال سابق (Wrong Entry)</option>
                                <option value="inventory_count">أخرى (Other)</option>
                             </select>
                          )}
                          
                          {isCompleted && diff !== 0 && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded w-fit">
                              سبب التسوية: {item.adjustmentReason === 'wastage' ? 'هالك' : item.adjustmentReason === 'shortage' ? 'فقد/سرقة' : item.adjustmentReason === 'wrong_entry' ? 'خطأ إدخال' : 'أخرى'}
                            </span>
                          )}
                       </div>
                    </div>
                  );
             })}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
          {selectedSession.status !== 'completed' && selectedSession.status !== 'cancelled' ? (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                 <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  المنتجات التي لم يتم جردها سيتم اعتبار رصيدها الفعلي صفر عند الاعتماد.
                </div>
                <button
                  onClick={() => setShowVariances(!showVariances)}
                  className={`px-4 py-2 font-bold rounded-lg transition-all text-sm ${showVariances ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {showVariances ? 'إخفاء تقرير الفروقات (Variance Report)' : 'عرض تقرير الفروقات وأسباب التسوية'}
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-3 justify-end items-center">
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={handleCancelSession}
                    className="px-6 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all"
                  >
                    إلغاء الجرد
                  </button>
                  <button
                    onClick={handleSaveDraft}
                    className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> حفظ كمسودة
                  </button>
                  <button
                    onClick={handleCompleteSession}
                    className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" /> اعتماد وتسوية المخزون
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {/* Gap Analysis Report (تقارير الفجوة) */}
              {selectedSession.status === 'completed' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        تقرير تحليل الفجوة (Gap Analysis)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-4 rounded-xl border border-rose-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-bold mb-1">إجمالي الخسارة (عجز)</p>
                                <p className="text-2xl font-black text-rose-600">{selectedSession.totalLoss || 0}</p>
                            </div>
                            <div className="bg-rose-50 p-3 rounded-full text-rose-500">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500 font-bold mb-1">إجمالي الوفر (زيادة)</p>
                                <p className="text-2xl font-black text-emerald-600">{selectedSession.totalGain || 0}</p>
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-full text-emerald-500">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                </div>
              )}
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleExportCSV}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" /> تصدير CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" /> طباعة
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveSessionModal;
