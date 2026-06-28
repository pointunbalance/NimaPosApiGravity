import React from 'react';
import { X, FileText, Package, DollarSign } from 'lucide-react';
import { PurchaseOrder } from '../../types';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
}

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ isOpen, onClose, order }) => {
  if (!isOpen || !order) return null;

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-sm font-bold">مسودة</span>;
      case 'sent':
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">مرسل</span>;
      case 'partially_received':
        return <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold">مستلم جزئياً</span>;
      case 'received':
        return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-bold">مستلم</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">ملغي</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-sm font-bold">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                تفاصيل أمر الشراء
                <span className="text-sm font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                  PO-{order.id?.toString().padStart(4, '0')}
                </span>
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                تاريخ الأمر: {new Date(order.date).toLocaleDateString('ar-EG')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {getStatusBadge(order.status)}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4" /> معلومات المورد
              </h4>
              <p className="font-bold text-slate-800 text-lg">{order.supplierName}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <h4 className="text-sm font-bold text-slate-500 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> القيمة الإجمالية
              </h4>
              <p className="font-black text-slate-800 text-xl">{order.totalAmount.toFixed(2)} ر.س</p>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 p-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-800">المنتجات المطلوبة</h4>
            </div>
            <table className="w-full text-right">
              <thead className="bg-white border-b border-slate-100 text-slate-500 text-sm">
                <tr>
                  <th className="p-4 font-bold">المنتج</th>
                  <th className="p-4 font-bold text-center">الكمية</th>
                  <th className="p-4 font-bold text-center">سعر الوحدة</th>
                  <th className="p-4 font-bold text-center">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{item.productName}</td>
                    <td className="p-4 text-center font-black text-slate-600">{item.quantity}</td>
                    <td className="p-4 text-center font-medium text-slate-600">{item.costPrice.toFixed(2)}</td>
                    <td className="p-4 text-center font-black text-slate-800">{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {order.notes && (
            <div className="mt-6 bg-amber-50 p-4 rounded-xl border border-amber-100">
              <h4 className="text-sm font-bold text-amber-800 mb-2">ملاحظات:</h4>
              <p className="text-amber-700">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;
