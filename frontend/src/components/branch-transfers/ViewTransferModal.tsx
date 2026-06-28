import React from 'react';
import { BranchTransfer } from '../../types';
import { X, ArrowLeftRight, Package, FileText, Clock, Truck, CheckCircle2, XCircle } from 'lucide-react';

interface ViewTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransfer: BranchTransfer | null;
  getWarehouseName: (id: number) => string;
  handleStatusChange: (transferId: number, newStatus: BranchTransfer['status']) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return (
        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Clock className="w-3 h-3" /> قيد الانتظار
        </span>
      );
    case 'in_transit':
      return (
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Truck className="w-3 h-3" /> في الطريق
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

const ViewTransferModal: React.FC<ViewTransferModalProps> = ({
  isOpen,
  onClose,
  selectedTransfer,
  getWarehouseName,
  handleStatusChange,
}) => {
  if (!isOpen || !selectedTransfer) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
              تفاصيل التحويل
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-sm font-bold tracking-wider ml-2">
                TRN-{selectedTransfer.id?.toString().padStart(4, '0')}
              </span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-2xl flex items-center justify-between border ${
              selectedTransfer.status === 'pending'
                ? 'bg-orange-50 border-orange-100'
                : selectedTransfer.status === 'in_transit'
                ? 'bg-blue-50 border-blue-100'
                : selectedTransfer.status === 'completed'
                ? 'bg-emerald-50 border-emerald-100'
                : 'bg-red-50 border-red-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {getStatusBadge(selectedTransfer.status)}
              <span className="text-sm font-medium text-slate-600">
                بواسطة: {selectedTransfer.createdBy}
              </span>
            </div>
            <span className="text-sm font-bold text-slate-700">
              {new Date(selectedTransfer.date).toLocaleString('ar-EG')}
            </span>
          </div>

          {/* Route */}
          <div className="flex items-center gap-4 relative">
            <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase">من مخزن</p>
              <p className="font-black text-slate-800 text-lg">
                {getWarehouseName(selectedTransfer.sourceWarehouseId)}
              </p>
            </div>
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center shrink-0 z-10 border border-indigo-100">
              <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs text-slate-400 font-bold mb-1 uppercase">إلى مخزن</p>
              <p className="font-black text-slate-800 text-lg">
                {getWarehouseName(selectedTransfer.destinationWarehouseId)}
              </p>
            </div>
            <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -z-0 -translate-y-1/2"></div>
          </div>

          {/* Items */}
          <div>
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" /> المنتجات المحولة
            </h4>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold">المنتج</th>
                    <th className="px-4 py-3 font-bold text-center">الكمية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {selectedTransfer.items.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-4 py-3 font-bold text-slate-800">{item.productName}</td>
                      <td className="px-4 py-3 font-black text-center text-indigo-600">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-100">
                  <tr>
                    <td className="px-4 py-3 font-bold text-slate-600">الإجمالي</td>
                    <td className="px-4 py-3 font-black text-center text-slate-800">
                      {selectedTransfer.items.reduce((acc, item) => acc + item.quantity, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {selectedTransfer.notes && (
            <div>
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" /> ملاحظات
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-700">
                {selectedTransfer.notes}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
          {selectedTransfer.status !== 'completed' && selectedTransfer.status !== 'cancelled' ? (
            <div className="flex gap-3">
              {selectedTransfer.status === 'pending' && (
                <button
                  onClick={() => handleStatusChange(selectedTransfer.id!, 'in_transit')}
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
                >
                  تغيير الحالة إلى "في الطريق"
                </button>
              )}
              <button
                onClick={() => {
                  if (
                    window.confirm('هل أنت متأكد من استلام البضائع؟ سيتم تحديث المخزون نهائياً.')
                  ) {
                    handleStatusChange(selectedTransfer.id!, 'completed');
                  }
                }}
                className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
              >
                تأكيد الاستلام (مكتمل)
              </button>
              <button
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من إلغاء هذا التحويل؟')) {
                    handleStatusChange(selectedTransfer.id!, 'cancelled');
                  }
                }}
                className="py-3 px-6 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all"
              >
                إلغاء
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition-all"
            >
              إغلاق
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewTransferModal;
