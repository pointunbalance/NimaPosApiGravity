import React, { useState } from 'react';
import { X, Calendar, User, Package, Check, ClipboardList, Wallet, Ban, Printer } from 'lucide-react';
import { db } from '../../db';
import { AccountingEngine } from '../../services/AccountingEngine';

interface ViewLayawayModalProps {
  layaway: any | null;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
}

export const ViewLayawayModal: React.FC<ViewLayawayModalProps> = ({
  layaway,
  onClose,
  formatCurrency,
}) => {
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [deliveryQtyMap, setDeliveryQtyMap] = useState<Record<number, number>>({});

  if (!layaway) return null;

  const handlePrint = () => {
     window.print(); // Simple print or we can hook a specific layaway receipt logic
  };

  const handleAddPayment = async () => {
    if (paymentAmount <= 0 || paymentAmount > layaway.remainingAmount) {
      alert("مبلغ الدفعة غير صالح.");
      return;
    }

    try {
      if (layaway.isRealOrder) {
        // Direct POS Order reservation
        const amount = Number(paymentAmount);
        const updatedPaid = (layaway._rawOrder.paidAmount || 0) + amount;
        const updatedRemaining = layaway.totalValue - updatedPaid;
        const updatedDeposit = (layaway._rawOrder.reservationDetails?.depositAmount || 0) + amount;
        
        await db.orders.update(layaway._rawOrder.id, {
            paidAmount: updatedPaid,
            reservationDetails: {
                ...layaway._rawOrder.reservationDetails,
                depositAmount: updatedDeposit,
                remainingAmount: updatedRemaining
            }
        });

        // Accounting integration: Debit Cash (1010), Credit A/R (1030)
        try {
            const cashAcc = await db.accounts.where('code').equals('1010').first();
            const customerAcc = await db.accounts.where('code').equals('1030').first();
            if (cashAcc && customerAcc) {
                await AccountingEngine.postEntry({
                    description: `سداد جزء من حجز الفاتورة #ORD-${layaway.id} - العميل: ${layaway.customerName}`,
                    reference: `PAY-RES-${layaway.id}`,
                    lines: [
                        {
                            accountId: cashAcc.id!,
                            accountName: cashAcc.name,
                            debit: amount,
                            credit: 0,
                        },
                        {
                            accountId: customerAcc.id!,
                            accountName: customerAcc.name,
                            debit: 0,
                            credit: amount,
                        }
                    ],
                    createdBy: "1"
                });
            }
        } catch (acctErr) {
            console.error("Accounting error for reservation payment:", acctErr);
        }

      } else {
        // Standard legacy layaway
        await db.layaways.update(layaway.id, {
          remainingAmount: layaway.remainingAmount - paymentAmount,
          payments: [...layaway.payments, { amount: paymentAmount, date: new Date().toISOString() }]
        });
      }
      setPaymentAmount(0);
      onClose();
    } catch (e: any) {
      alert("حدث خطأ " + e.message);
    }
  };

  const handleDeliverSelected = async () => {
    if (!layaway.isRealOrder) return;
    
    // Check if anything is entered
    const hasItemsToDeliver = Object.values(deliveryQtyMap).some(qty => qty > 0);
    if (!hasItemsToDeliver) {
        alert("يرجى تحديد كميات للتسليم أولاً.");
        return;
    }

    try {
        await db.transaction('rw', db.orders, db.products, async () => {
            // Deduct from stock
            for (const item of layaway._rawOrder.items) {
                const nowDeliverQty = Number(deliveryQtyMap[item.id] || 0);
                if (nowDeliverQty <= 0) continue;
                
                const product = await db.products.get(item.id);
                if (product) {
                    const factor = item.selectedUnit ? item.selectedUnit.conversionFactor : 1;
                    const effectiveQtyToDeduct = nowDeliverQty * factor;
                    await db.products.update(item.id, {
                        stock: Math.max(0, (product.stock || 0) - effectiveQtyToDeduct)
                    });
                }
            }

            // Update delivered items in order
            const updatedDeliveredItems = layaway._rawOrder.reservationDetails.deliveredItems.map((d: any) => {
                const nowDeliverQty = Number(deliveryQtyMap[d.productId] || 0);
                return {
                    productId: d.productId,
                    quantity: d.quantity + nowDeliverQty
                };
            });

            // Check if all items are fully delivered
            const isAllFullyDelivered = layaway._rawOrder.items.every((item: any) => {
                const d = updatedDeliveredItems.find((e: any) => e.productId === item.id);
                return (d ? d.quantity : 0) >= item.quantity;
            });

            const newDeliveryStatus = isAllFullyDelivered ? 'fully_delivered' : 'partially_delivered';

            await db.orders.update(layaway._rawOrder.id, {
                reservationDetails: {
                    ...layaway._rawOrder.reservationDetails,
                    deliveryStatus: newDeliveryStatus,
                    deliveredItems: updatedDeliveredItems
                }
            } as any);
        });

        alert("تم تسليم الكميات المحددة وتحديث المخزون والقيود المحاسبية بنجاح.");
        setDeliveryQtyMap({});
        onClose();
    } catch (e: any) {
        alert("حدث خطأ أثناء حفظ التسليم: " + e.message);
    }
  };

  const handleFinalize = async () => {
      if (layaway.remainingAmount > 0) {
          alert('يجب سداد كامل المبلغ قبل تسليم البضاعة (أو قم بإضافة دفعة بالباقي أولاً)');
          return;
      }
      if (!window.confirm("هل أنت متأكد من تسليم البضاعة بالكامل وإغلاق هذا الحجز؟")) return;

      try {
          if (layaway.isRealOrder) {
              await db.transaction('rw', db.orders, db.products, async () => {
                  // Deduct whatever is left
                  const updatedDeliveredItems = [];
                  for (const item of layaway._rawOrder.items) {
                      const dEntry = layaway._rawOrder.reservationDetails.deliveredItems.find((e: any) => e.productId === item.id);
                      const previouslyDelivered = dEntry ? dEntry.quantity : 0;
                      const remainingToDeliver = Math.max(0, item.quantity - previouslyDelivered);
                      
                      if (remainingToDeliver > 0) {
                          const product = await db.products.get(item.id);
                          if (product) {
                              const factor = item.selectedUnit ? item.selectedUnit.conversionFactor : 1;
                              await db.products.update(item.id, {
                                  stock: Math.max(0, (product.stock || 0) - (remainingToDeliver * factor))
                              });
                          }
                      }
                      updatedDeliveredItems.push({
                          productId: item.id,
                          quantity: item.quantity
                      });
                  }

                  await db.orders.update(layaway._rawOrder.id, {
                      reservationDetails: {
                          ...layaway._rawOrder.reservationDetails,
                          deliveryStatus: 'fully_delivered',
                          deliveredItems: updatedDeliveredItems
                      }
                  } as any);
              });
          } else {
              await db.layaways.update(layaway.id, {
                  status: 'completed'
              });
          }
          onClose();
      } catch (e: any) {
          alert("حدث خطأ " + e.message);
      }
  };

  const handleCancel = async () => {
      if (!window.confirm('هل تريد إلغاء هذا الحجز؟ سيتم استرجاع أي بضاعة تم خصمها للمخزون.')) return;

      try {
          if (layaway.isRealOrder) {
              // Return any custom stock
              await db.transaction('rw', db.orders, db.products, async () => {
                  for (const d of layaway._rawOrder.reservationDetails.deliveredItems) {
                      if (d.quantity > 0) {
                          const product = await db.products.get(d.productId);
                          if (product) {
                              await db.products.update(d.productId, {
                                  stock: (product.stock || 0) + d.quantity
                              });
                          }
                      }
                  }
                  await db.orders.update(layaway._rawOrder.id, {
                      reservationDetails: {
                          ...layaway._rawOrder.reservationDetails,
                          deliveryStatus: "not_delivered"
                      },
                      status: "cancelled"
                  } as any);
              });
          } else {
              await (db as any).transaction('rw', db.layaways, db.products, async () => {
                  // Return items to stock
                  for(const item of layaway.items) {
                      const product = await db.products.get(item.productId);
                      if(product) {
                          await db.products.update(item.productId, {
                              stock: product.stock + item.quantity
                          });
                      }
                  }

                  await db.layaways.update(layaway.id, {
                      status: 'cancelled'
                  });
              });
          }
          onClose();
      } catch (e: any) {
          alert("خطأ: " + e.message);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
              <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-xl">
                  <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                  <h3 className="text-xl font-extrabold text-gray-800">تفاصيل حجز العربون #{layaway.id}</h3>
                  <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${layaway.status === 'active' ? 'bg-amber-100 text-amber-700' : layaway.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                          {layaway.status === 'active' ? 'نشط (تحت الحجز)' : layaway.status === 'completed' ? 'مكتمل (مُسلم)' : 'ملغى'}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">{new Date(layaway.date).toLocaleDateString()}</span>
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

        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 flex flex-col gap-6">
            
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 mb-1">العميل</p>
                        <p className="font-bold text-gray-800">{layaway.customerName}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-center">
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 mb-1">تاريخ الاستحقاق والتسليم</p>
                        <p className="font-bold text-gray-800">{new Date(layaway.dueDate).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-500" />
                      <h4 className="font-bold text-gray-700">الأصناف المحجوزة المشمولة</h4>
                  </div>
                  {layaway.isRealOrder && layaway.status === 'active' && (
                      <button 
                          onClick={handleDeliverSelected}
                          className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold text-xs transition shadow-sm"
                      >
                          حفظ تسليم الكميات المحددة
                      </button>
                  )}
              </div>
              <table className="w-full text-right">
                <thead className="bg-gray-50/50 text-gray-500 text-xs border-b border-gray-100">
                  {layaway.isRealOrder ? (
                    <tr>
                      <th className="px-5 py-3 font-bold">الصنف</th>
                      <th className="px-5 py-3 font-bold text-center">الكمية المطلوبة</th>
                      <th className="px-5 py-3 font-bold text-center text-emerald-600">المستلم سابقاً</th>
                      <th className="px-5 py-3 font-bold text-center text-brand-600">التسليم الآن</th>
                      <th className="px-5 py-3 font-bold text-center">السعر</th>
                      <th className="px-5 py-3 font-bold text-left">الإجمالي</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-5 py-3 font-bold">الصنف</th>
                      <th className="px-5 py-3 font-bold text-center">الكمية</th>
                      <th className="px-5 py-3 font-bold text-center">السعر</th>
                      <th className="px-5 py-3 font-bold text-left">الإجمالي</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {layaway.items.map((item: any, idx: number) => {
                    if (layaway.isRealOrder) {
                      const dEntry = layaway._rawOrder?.reservationDetails?.deliveredItems?.find((d: any) => d.productId === item.id);
                      const prevDelivered = dEntry ? dEntry.quantity : 0;
                      const maxDeliverable = item.quantity - prevDelivered;
                      const currentDeliverNow = deliveryQtyMap[item.id] || 0;

                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 font-bold text-gray-800">{item.name}</td>
                          <td className="px-5 py-3 font-bold text-gray-600 text-center">{item.quantity}</td>
                          <td className="px-5 py-3 font-bold text-emerald-600 text-center">{prevDelivered}</td>
                          <td className="px-5 py-3 text-center">
                            {maxDeliverable > 0 ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <input 
                                  type="number" 
                                  min={0}
                                  max={maxDeliverable}
                                  value={currentDeliverNow}
                                  onChange={e => {
                                      const val = Math.min(maxDeliverable, Math.max(0, Number(e.target.value)));
                                      setDeliveryQtyMap({ ...deliveryQtyMap, [item.id]: val });
                                  }}
                                  className="w-16 p-1 border text-center font-bold bg-white rounded-lg text-slate-800"
                                />
                                <span className="text-[10px] text-gray-400">متاح {maxDeliverable}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">مكتمل التسليم</span>
                            )}
                          </td>
                          <td className="px-5 py-3 font-medium text-gray-600 text-center">{formatCurrency(item.price)}</td>
                          <td className="px-5 py-3 font-bold text-indigo-700 text-left">{formatCurrency(item.total)}</td>
                        </tr>
                      );
                    } else {
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 font-bold text-gray-800">{item.name}</td>
                          <td className="px-5 py-3 font-bold text-gray-600 text-center">{item.quantity}</td>
                          <td className="px-5 py-3 font-medium text-gray-600 text-center">{formatCurrency(item.price)}</td>
                          <td className="px-5 py-3 font-bold text-indigo-700 text-left">{formatCurrency(item.total)}</td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>

            {/* Payments & Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payments */}
                {layaway.payments && layaway.payments.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                         <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                             <Wallet className="w-4 h-4 text-emerald-500" />
                             سجل الدفعات المقبوضة
                         </h4>
                         <div className="space-y-3">
                             {layaway.payments.map((p: any, idx: number) => (
                                 <div key={idx} className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                                     <div className="flex flex-col">
                                         <span className="text-xs text-gray-500 font-medium">{new Date(p.date).toLocaleString()}</span>
                                         <span className="text-sm font-bold text-gray-700">{idx === 0 ? 'الدفعة المقدمة (العربون)' : `دفعة سداد #${idx+1}`}</span>
                                     </div>
                                     <span className="font-black text-emerald-700">{formatCurrency(p.amount)}</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}
                
                {/* Totals Box */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex flex-col h-full">
                    <h4 className="font-bold text-gray-700 mb-4 border-b border-gray-100 pb-2">الخلاصة المالية</h4>
                    <div className="space-y-3 flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium">إجمالي البضاعة المحجوزة</span>
                            <span className="font-bold text-gray-800 text-lg">{formatCurrency(layaway.totalValue)}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-600">
                            <span className="font-medium">إجمالي المدفوع</span>
                            <span className="font-bold text-lg">{formatCurrency(layaway.totalValue - layaway.remainingAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 mt-2">
                            <span className="font-bold">المتبقي للتسليم</span>
                            <span className="font-black text-xl">{formatCurrency(layaway.remainingAmount)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {layaway.notes && (
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800 text-sm font-medium">
                    <strong className="block mb-1">ملاحظات:</strong>
                    {layaway.notes}
                </div>
            )}
        </div>

        {/* Action Footer */}
        {layaway.status === 'active' && (
            <div className="p-5 border-t border-gray-100 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
                
                <div className="flex gap-2">
                    <button onClick={handleCancel} className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition flex items-center gap-2 text-sm">
                        <Ban className="w-4 h-4"/>
                        إلغاء الحجز
                    </button>
                    {layaway.remainingAmount > 0 && (
                        <div className="flex gap-2 bg-indigo-50 p-1.5 rounded-xl border border-indigo-100">
                            <input 
                                type="number" 
                                min="0" 
                                max={layaway.remainingAmount} 
                                value={paymentAmount} 
                                onChange={e => setPaymentAmount(Number(e.target.value))} 
                                onFocus={e=>e.target.select()}
                                className="w-32 px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm text-center font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500" 
                                placeholder="مبلغ الدفعة"
                            />
                            <button onClick={handleAddPayment} className="px-4 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-bold text-sm transition">
                                قبض
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={onClose} className="px-6 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl font-bold transition flex-1 md:flex-none">
                        إغلاق
                    </button>
                    <button 
                        onClick={handleFinalize}
                        // disabled={layaway.remainingAmount > 0} 
                        className={`px-6 py-2.5 rounded-xl font-bold transition flex-1 md:flex-none flex items-center justify-center gap-2 ${layaway.remainingAmount === 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                        <Check className="w-5 h-5"/>
                        تأكيد تسليم البضاعة
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
