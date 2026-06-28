import React from 'react';
import { Purchase } from '../../types';
import { X, Calendar, Package, DollarSign, FileText } from 'lucide-react';

interface ViewPurchaseModalProps {
  purchase: Purchase | null;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
}

const ViewPurchaseModal: React.FC<ViewPurchaseModalProps> = ({
  purchase,
  onClose,
  formatCurrency,
  formatDate
}) => {
  if (!purchase) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-200">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-gray-800">تفاصيل الفاتورة</h3>
              <p className="text-xs text-gray-500 font-medium">{purchase.invoiceNumber || 'بدون رقم'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full hover:bg-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 font-bold mb-1">المورد</p>
              <p className="font-bold text-gray-800 text-lg">{purchase.supplierName}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 font-bold mb-1">التاريخ</p>
              <div className="flex items-center gap-2 font-bold text-gray-800 text-lg">
                <Calendar className="w-5 h-5 text-indigo-500" />
                {formatDate(purchase.date)}
              </div>
            </div>
          </div>

          <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-500" />
            الأصناف المشتراة
          </h4>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">المنتج</th>
                  <th className="px-4 py-3 text-center">الكمية</th>
                  <th className="px-4 py-3 text-center">سعر الوحدة</th>
                  <th className="px-4 py-3 text-center">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchase.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-800">
                      {item.name}
                      {item.serials && item.serials.length > 0 && (
                        <div className="text-xs text-purple-600 mt-1">
                          سيريالات: {item.serials.join(' ، ')}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                        <span className="font-bold text-gray-600">{item.quantity}</span>
                        {item.bonusQuantity ? (
                            <span className="text-emerald-600 text-xs mr-2 p-1 bg-emerald-50 rounded" title="بونص">
                                +{item.bonusQuantity}
                            </span>
                        ) : null}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{formatCurrency(item.costPrice)}</td>
                    <td className="px-4 py-3 text-center font-bold text-indigo-700">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 font-bold mb-2">ملاحظات الفاتورة</p>
              <p className="text-sm text-gray-700">{purchase.notes || 'لا توجد ملاحظات'}</p>
              
              {purchase.attachment && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 font-bold mb-2">المرفقات</p>
                  <img src={purchase.attachment} alt="Attachment" className="max-h-48 rounded-lg border border-gray-200" />
                </div>
              )}
            </div>
            
            <div className="w-full md:w-72 bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex flex-col justify-center">
              <div className="flex justify-between items-center mb-2 text-sm text-indigo-700">
                <span>المجموع الفرعي</span>
                <span className="font-bold">{formatCurrency(purchase.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between items-center mb-2 text-sm text-indigo-700">
                <span>الضريبة</span>
                <span className="font-bold">{formatCurrency(purchase.taxAmount || 0)}</span>
              </div>
              <div className="flex justify-between items-center mb-4 text-sm text-indigo-700">
                <span>الخصم</span>
                <span className="font-bold">{formatCurrency(purchase.discountAmount || 0)}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-indigo-200">
                <span className="font-bold text-indigo-900">الإجمالي النهائي</span>
                <span className="text-2xl font-black text-indigo-700">{formatCurrency(purchase.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPurchaseModal;
