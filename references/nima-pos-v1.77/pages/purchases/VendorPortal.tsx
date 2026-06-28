import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Store, FileText, CheckCircle, Clock, AlertTriangle, Eye } from 'lucide-react';
import { PurchaseOrder } from '../../types';
import PurchaseOrderModal from '../../components/purchases/PurchaseOrderModal';

export const VendorPortal: React.FC = () => {
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []) || [];
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'invoices'>('orders');

  const purchaseOrders = useLiveQuery(
    () => {
      if (!selectedSupplier) return [];
      return db.purchaseOrders.where('supplierId').equals(Number(selectedSupplier)).reverse().sortBy('date');
    },
    [selectedSupplier]
  ) || [];

  const purchases = useLiveQuery(
    () => {
      if (!selectedSupplier) return [];
      return db.purchases.where('supplierId').equals(Number(selectedSupplier)).toArray();
    },
    [selectedSupplier]
  ) || [];

  const openPurchaseOrders = purchaseOrders.filter(po => po.status !== 'received' && po.status !== 'cancelled');
  const totalPurchases = purchases.length;
  const totalPurchasesAmount = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'draft':
        return <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-full text-xs font-bold">مسودة</span>;
      case 'sent':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-bold">مرسل</span>;
      case 'partially_received':
        return <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-bold">مستلم جزئياً</span>;
      case 'received':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-bold">مستلم</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">ملغي</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const handleViewOrder = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Store className="w-6 h-6 text-indigo-600" />
          بوابة الموردين (Vendor Portal)
        </h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-colors">
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            اختر المورد لعرض البوابة الخاصة به
          </label>
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full md:w-1/3 p-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold transition-all"
          >
            <option value="">-- اختر المورد --</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {selectedSupplier ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 transition-colors">
                <div className="flex items-center gap-2 text-blue-600 mb-3">
                  <FileText className="w-6 h-6" />
                  <h3 className="font-bold text-lg">أوامر الشراء المفتوحة</h3>
                </div>
                <p className="text-3xl font-black text-slate-900">{openPurchaseOrders.length}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 transition-colors">
                <div className="flex items-center gap-2 text-emerald-600 mb-3">
                  <CheckCircle className="w-6 h-6" />
                  <h3 className="font-bold text-lg">إجمالي الفواتير</h3>
                </div>
                <p className="text-3xl font-black text-slate-900">{totalPurchases}</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 transition-colors">
                <div className="flex items-center gap-2 text-amber-600 mb-3">
                  <Store className="w-6 h-6" />
                  <h3 className="font-bold text-lg">إجمالي المشتريات</h3>
                </div>
                <p className="text-3xl font-black text-slate-900">{totalPurchasesAmount.toFixed(2)} <span className="text-lg font-medium text-slate-500">ر.س</span></p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden transition-colors">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex gap-4">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`font-bold text-lg pb-2 border-b-2 transition-colors ${
                    activeTab === 'orders'
                      ? 'border-indigo-600 text-indigo-600 '
                      : 'border-transparent text-slate-500 hover:text-slate-700 '
                  }`}
                >
                  أوامر الشراء
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={`font-bold text-lg pb-2 border-b-2 transition-colors ${
                    activeTab === 'invoices'
                      ? 'border-indigo-600 text-indigo-600 '
                      : 'border-transparent text-slate-500 hover:text-slate-700 '
                  }`}
                >
                  الفواتير (المشتريات)
                </button>
              </div>
              <div className="overflow-x-auto">
                {activeTab === 'orders' ? (
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                      <tr>
                        <th className="p-4 font-bold">رقم الأمر</th>
                        <th className="p-4 font-bold">التاريخ</th>
                        <th className="p-4 font-bold">القيمة</th>
                        <th className="p-4 font-bold">الحالة</th>
                        <th className="p-4 font-bold text-center">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {purchaseOrders.map(po => (
                        <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-slate-900 font-bold">PO-{po.id?.toString().padStart(4, '0')}</td>
                          <td className="p-4 text-slate-500 font-medium">{new Date(po.date).toLocaleDateString('ar-EG')}</td>
                          <td className="p-4 text-slate-900 font-black">{po.totalAmount.toFixed(2)} ر.س</td>
                          <td className="p-4">
                            {getStatusBadge(po.status)}
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => handleViewOrder(po)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex items-center justify-center"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {purchaseOrders.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-500 font-medium">
                            لا توجد أوامر شراء لهذا المورد
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                      <tr>
                        <th className="p-4 font-bold">رقم الفاتورة</th>
                        <th className="p-4 font-bold">التاريخ</th>
                        <th className="p-4 font-bold">القيمة</th>
                        <th className="p-4 font-bold">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {purchases.map(purchase => (
                        <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-slate-900 font-bold">{purchase.invoiceNumber || `INV-${purchase.id?.toString().padStart(4, '0')}`}</td>
                          <td className="p-4 text-slate-500 font-medium">{new Date(purchase.date).toLocaleDateString('ar-EG')}</td>
                          <td className="p-4 text-slate-900 font-black">{purchase.totalAmount.toFixed(2)} ر.س</td>
                          <td className="p-4 text-slate-500">{purchase.notes || '-'}</td>
                        </tr>
                      ))}
                      {purchases.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">
                            لا توجد فواتير مشتريات لهذا المورد
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 flex flex-col items-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Store className="w-16 h-16 mb-4 text-slate-300" />
            <p className="text-lg font-bold">يرجى اختيار مورد لعرض بيانات البوابة</p>
          </div>
        )}
      </div>

      <PurchaseOrderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
};

export default VendorPortal;
