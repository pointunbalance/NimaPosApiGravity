import React, { useState } from 'react';
import { X, Calendar, User, Package, Check, ClipboardList, Ban, Printer, ReplyAll, DollarSign } from 'lucide-react';
import { db } from '../../db';
import { Consignment } from '../../types';
import ConfirmModal from '../ui/ConfirmModal';
import { useToast } from '../../context/ToastContext';

interface ViewConsignmentModalProps {
  consignment: Consignment | null;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
}

export const ViewConsignmentModal: React.FC<ViewConsignmentModalProps> = ({
  consignment,
  onClose,
  formatCurrency,
}) => {
  const [returnQuantities, setReturnQuantities] = useState<Record<number, number>>({});
  const [sellQuantities, setSellQuantities] = useState<Record<number, number>>({});
  const { error, success } = useToast();

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  if (!consignment) return null;

  const handlePrint = () => {
     window.print();
  };

  const handleProcessItems = async (action: 'return' | 'sell', productId: number, maxQty: number) => {
      const qty = action === 'return' ? (returnQuantities[productId] || 0) : (sellQuantities[productId] || 0);
      
      if (qty <= 0 || qty > maxQty) {
          error('الكمية غير صالحة');
          return;
      }

      setConfirmState({
          isOpen: true,
          title: `تأكيد הل${action === 'return' ? 'إرجاع' : 'بيع/تسوية'}`,
          message: `هل أنت متأكد من ${action === 'return' ? 'إرجاع' : 'بيع/تسوية'} ${qty} من هذا الصنف؟`,
          onConfirm: async () => {
              setConfirmState(prev => ({ ...prev, isOpen: false }));
              try {
                  await (db as any).transaction('rw', db.consignments, db.products, async () => {
                      const csg = await db.consignments.get(consignment.id!);
                      if (!csg) throw new Error("السجل غير موجود");

                      const itemIndex = csg.items.findIndex((i: any) => i.productId === productId);
                      if (itemIndex === -1) throw new Error("الصنف غير موجود في هذا الكشف");

                      const item = csg.items[itemIndex];
                      
                      if (action === 'return') {
                          item.returnedQuantity += qty;
                          // If inward (from supplier) and returned, decrease our stock
                          // If outward (to customer) and returned, increase our stock
                          const product = await db.products.get(productId);
                          if (product) {
                              const stockChange = csg.type === 'inward' ? -qty : qty;
                              await db.products.update(productId, { stock: product.stock + stockChange });
                          }
                      } else {
                          item.soldQuantity += qty;
                          // If inward (supplier) and sold -> we sold it, keep money (or owe supplier), stock already in our system, wait we sold it so we decreased stock upon sale normally. But wait, in consignment we might not track via normal POS?
                          // If they sold it via normal POS it subtracted stock. We just record it's sold here. 
                          // If outward (to customer) and sold -> customer bought it, stock was already subtracted when we sent it.
                      }

                      // Check if all items are fully processed (returned + sold == quantity)
                      const allProcessed = csg.items.every((i: any) => i.returnedQuantity + i.soldQuantity >= i.quantity);
                      
                      if (allProcessed) {
                          csg.status = 'completed';
                      }

                      await db.consignments.put(csg);
                  });

                  // Reset inputs
                  if (action === 'return') {
                      setReturnQuantities(prev => ({...prev, [productId]: 0}));
                  } else {
                      setSellQuantities(prev => ({...prev, [productId]: 0}));
                  }
                  
                  success('تمت المعالجة بنجاح');
                  onClose(); // We close it to refresh, or we could mutate local state
              } catch (e: any) {
                  error("خطأ: " + e.message);
              }
          }
      });
  };

  const handleCancel = async () => {
      if (!window.confirm('هل تريد إلغاء هذا السجل (تصفير حركات البضاعة)؟')) return;

      try {
          await (db as any).transaction('rw', db.consignments, db.products, async () => {
              // Revert stock changes for unprocessed items
              for(const item of consignment.items) {
                  const unprocessedQty = item.quantity - item.soldQuantity - item.returnedQuantity;
                  if (unprocessedQty > 0) {
                      const product = await db.products.get(item.productId);
                      if(product) {
                          const stockChange = consignment.type === 'inward' ? -unprocessedQty : unprocessedQty;
                          await db.products.update(item.productId, {
                              stock: product.stock + stockChange
                          });
                      }
                  }
              }

              await db.consignments.update(consignment.id, {
                  status: 'cancelled'
              });
          });
          onClose();
      } catch (e: any) {
          alert("خطأ: " + e.message);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 print:hidden">
          <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${consignment.type === 'inward' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                  <h3 className="text-xl font-extrabold text-gray-800">
                      تفاصيل بضاعة الأمانة - {consignment.referenceNumber}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${consignment.status === 'active' ? 'bg-amber-100 text-amber-700' : consignment.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {consignment.status === 'active' ? 'مفتوح (قيد التسوية)' : consignment.status === 'completed' ? 'مغلق (تمت التسوية)' : 'ملغى'}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">{new Date(consignment.date).toLocaleDateString()}</span>
                  </div>
              </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="text-gray-500 hover:text-indigo-600 bg-white border border-gray-200 p-2 rounded-full hover:bg-indigo-50 transition-colors">
                <Printer className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full hover:bg-gray-200 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 flex flex-col gap-6 print:bg-white print:p-0">
            
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white print:border-none p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shrink-0 print:hidden">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 mb-1">{consignment.type === 'inward' ? 'المورد (صاحب البضاعة)' : 'العميل (المستلم)'}</p>
                        <p className="font-bold text-gray-800">{consignment.partyName}</p>
                    </div>
                </div>
                <div className="bg-white print:border-none p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center">
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0 print:hidden">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 mb-1">نوع الأمانة</p>
                        <p className={`font-bold ${consignment.type === 'inward' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                            {consignment.type === 'inward' ? 'واردة (من مورد)' : 'منصرفة (لعميل)'}
                        </p>
                    </div>
                </div>
                <div className="bg-white print:border-none p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center">
                    <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center shrink-0 print:hidden">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 mb-1">إجمالي القيمة</p>
                        <p className="font-bold text-slate-800 text-lg">{formatCurrency(consignment.totalValue)}</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2 print:hidden">
                  <Package className="w-4 h-4 text-gray-500" />
                  <h4 className="font-bold text-gray-700">الأصناف والتسويات</h4>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-right min-w-[800px]">
                <thead className="bg-gray-50/50 text-gray-500 text-xs border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3 font-bold">الصنف</th>
                    <th className="px-5 py-3 font-bold text-center">الكمية المسلمة</th>
                    <th className="px-5 py-3 font-bold text-center">المباع/المُسوى</th>
                    <th className="px-5 py-3 font-bold text-center">المرتجع</th>
                    <th className="px-5 py-3 font-bold text-center">المتبقي للتسوية</th>
                    <th className="px-5 py-3 font-bold text-center">سعر الوحدة</th>
                    <th className="px-5 py-3 font-bold text-center print:hidden">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {consignment.items.map((item: any, idx: number) => {
                      const remaining = item.quantity - item.soldQuantity - item.returnedQuantity;
                      return (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-bold text-gray-800">{item.name}</td>
                      <td className="px-5 py-3 font-bold text-gray-600 text-center">{item.quantity}</td>
                      <td className="px-5 py-3 font-bold text-emerald-600 text-center">{item.soldQuantity}</td>
                      <td className="px-5 py-3 font-bold text-rose-600 text-center">{item.returnedQuantity}</td>
                      <td className="px-5 py-3 font-black text-indigo-700 text-center bg-indigo-50/30">{remaining}</td>
                      <td className="px-5 py-3 font-medium text-gray-600 text-center">{formatCurrency(item.agreedPrice)}</td>
                      <td className="px-5 py-3 text-center print:hidden">
                          {consignment.status === 'active' && remaining > 0 ? (
                              <div className="flex items-center justify-center gap-2">
                                  <div className="flex items-center border border-emerald-200 rounded-lg overflow-hidden w-24">
                                      <input 
                                          type="number" min="0" max={remaining} 
                                          value={sellQuantities[item.productId] ?? ''}
                                          onChange={e => setSellQuantities(prev => ({...prev, [item.productId]: Number(e.target.value)}))}
                                          className="w-12 px-2 py-1 bg-white text-xs text-center outline-none"
                                          placeholder="بيع"
                                      />
                                      <button onClick={() => handleProcessItems('sell', item.productId, remaining)} className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-1 text-xs font-bold" title="تسجيل كمباع">✔</button>
                                  </div>
                                  <div className="flex items-center border border-rose-200 rounded-lg overflow-hidden w-28">
                                      <input 
                                          type="number" min="0" max={remaining} 
                                          value={returnQuantities[item.productId] ?? ''}
                                          onChange={e => setReturnQuantities(prev => ({...prev, [item.productId]: Number(e.target.value)}))}
                                          className="w-12 px-2 py-1 bg-white text-xs text-center outline-none"
                                          placeholder="مرتجع"
                                      />
                                      <button onClick={() => handleProcessItems('return', item.productId, remaining)} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 py-1 text-xs font-bold" title="إرجاع البضاعة"><ReplyAll className="w-3 h-3 mx-auto" /></button>
                                  </div>
                              </div>
                          ) : (
                              <Check className="w-5 h-5 text-emerald-500 mx-auto" />
                          )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
              </div>
            </div>

            {consignment.notes && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800 text-sm font-medium">
                    <strong className="block mb-1">ملاحظات:</strong>
                    {consignment.notes}
                </div>
            )}
        </div>

        {/* Action Footer */}
        {consignment.status === 'active' && (
            <div className="p-5 border-t border-gray-100 bg-white flex justify-between print:hidden">
                <button onClick={handleCancel} className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition flex items-center gap-2 text-sm">
                    <Ban className="w-4 h-4"/>
                    إلغاء الإيصال (إرجاع كامل المتبقي)
                </button>
                <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition">
                    إغلاق
                </button>
            </div>
        )}
      </div>
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
