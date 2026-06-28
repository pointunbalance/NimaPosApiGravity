import React from 'react';
import { PurchaseOrder } from '../../types';
import { X, Package, FileText } from 'lucide-react';

export interface ViewPurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrder: PurchaseOrder | null;
  getStatusBadge: (status: string) => React.ReactNode;
  currency: string;
  handleStatusChange: (id: number, status: PurchaseOrder['status']) => void;
  onOpenReceive: () => void;
}

const ViewPurchaseOrderModal: React.FC<ViewPurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  selectedOrder,
  getStatusBadge,
  currency,
  handleStatusChange,
  onOpenReceive
}) => {
  if (!isOpen || !selectedOrder) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
                <div>
                    <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                        أمر شراء
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-sm font-bold tracking-wider ml-2">
                            PO-{selectedOrder.id?.toString().padStart(4, '0')}
                        </span>
                    </h3>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
                {/* Status Banner */}
                <div className={`p-4 rounded-2xl flex items-center justify-between border ${
                    selectedOrder.status === 'draft' ? 'bg-slate-50 border-slate-200' :
                    selectedOrder.status === 'sent' ? 'bg-blue-50 border-blue-100' :
                    selectedOrder.status === 'received' ? 'bg-emerald-50 border-emerald-100' :
                    'bg-red-50 border-red-100'
                }`}>
                    <div className="flex items-center gap-3">
                        {getStatusBadge(selectedOrder.status)}
                        <span className="text-sm font-medium text-slate-600">بواسطة: {selectedOrder.createdBy}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{new Date(selectedOrder.date).toLocaleString('ar-EG')}</span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-400 font-bold mb-1 uppercase">المورد</p>
                        <p className="font-black text-slate-800 text-lg">{selectedOrder.supplierName}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-xs text-slate-400 font-bold mb-1 uppercase">تاريخ الاستلام المتوقع</p>
                        <p className="font-black text-slate-800 text-lg">
                            {selectedOrder.expectedDeliveryDate ? new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                        </p>
                    </div>
                </div>

                {/* Items */}
                <div>
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Package className="w-5 h-5 text-indigo-500" /> المنتجات المطلوبة</h4>
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 font-bold">المنتج</th>
                                    <th className="px-4 py-3 font-bold text-center">الكمية</th>
                                    <th className="px-4 py-3 font-bold text-center">التكلفة</th>
                                    <th className="px-4 py-3 font-bold text-center">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {selectedOrder.items.map(item => (
                                    <tr key={item.productId}>
                                        <td className="px-4 py-3 font-bold text-slate-800">{item.productName}</td>
                                        <td className="px-4 py-3 font-black text-center text-slate-600">{item.quantity}</td>
                                        <td className="px-4 py-3 font-black text-center text-slate-600">{item.costPrice.toLocaleString()}</td>
                                        <td className="px-4 py-3 font-black text-center text-indigo-600">{item.total.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-100">
                                <tr>
                                    <td colSpan={3} className="px-4 py-4 font-bold text-slate-600 text-left">الإجمالي الكلي:</td>
                                    <td className="px-4 py-4 font-black text-center text-slate-800 text-lg">{selectedOrder.totalAmount.toLocaleString()} {currency}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                    <div>
                        <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> ملاحظات</h4>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700">
                            {selectedOrder.notes}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                {selectedOrder.status !== 'received' && selectedOrder.status !== 'cancelled' ? (
                    <div className="flex gap-3">
                        {selectedOrder.status === 'draft' && (
                            <button 
                                onClick={() => handleStatusChange(selectedOrder.id!, 'sent')}
                                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                            >
                                تغيير الحالة إلى "مرسل للمورد"
                            </button>
                        )}
                        <button 
                            onClick={onOpenReceive}
                            className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
                        >
                            استلام بضاعة (جزئي / كلي)
                        </button>
                        <button 
                            onClick={() => {
                                if (window.confirm('هل أنت متأكد من إلغاء أمر الشراء؟')) {
                                    handleStatusChange(selectedOrder.id!, 'cancelled');
                                }
                            }}
                            className="py-3 px-6 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all"
                        >
                            إلغاء
                        </button>
                    </div>
                ) : (
                    <button onClick={onClose} className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all">إغلاق</button>
                )}
            </div>
        </div>
    </div>
  );
};

export default ViewPurchaseOrderModal;
