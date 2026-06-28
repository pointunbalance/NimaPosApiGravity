import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { EcommerceOrder } from '../../types';

interface EcommerceOrderModalProps {
  editingOrder: EcommerceOrder | null;
  formData: Partial<EcommerceOrder>;
  setFormData: (data: Partial<EcommerceOrder>) => void;
  onClose: () => void;
  onSave: () => void;
}

const EcommerceOrderModal: React.FC<EcommerceOrderModalProps> = ({
  editingOrder,
  formData,
  setFormData,
  onClose,
  onSave
}) => {
  const [newItem, setNewItem] = useState({ name: '', quantity: 1, price: 0, sku: '' });

  const handleAddItem = () => {
    if (!newItem.name || newItem.price <= 0 || newItem.quantity <= 0) return;
    
    const updatedItems = [...(formData.items || []), newItem];
    const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newTotal = newSubtotal + (formData.tax || 0) + (formData.shippingFee || 0);
    
    setFormData({ 
      ...formData, 
      items: updatedItems,
      subtotal: newSubtotal,
      total: newTotal
    });
    setNewItem({ name: '', quantity: 1, price: 0, sku: '' });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = (formData.items || []).filter((_, i) => i !== index);
    const newSubtotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newTotal = newSubtotal + (formData.tax || 0) + (formData.shippingFee || 0);
    
    setFormData({ 
      ...formData, 
      items: updatedItems,
      subtotal: newSubtotal,
      total: newTotal
    });
  };

  const handleFinancialChange = (field: 'tax' | 'shippingFee', value: number) => {
    const newFormData = { ...formData, [field]: value };
    const newTotal = (newFormData.subtotal || 0) + (newFormData.tax || 0) + (newFormData.shippingFee || 0);
    setFormData({ ...newFormData, total: newTotal });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl p-6 my-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6">
          {editingOrder ? 'تعديل الطلب' : 'إضافة طلب جديد'}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Order Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 border-b pb-2">تفاصيل الطلب</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الطلب</label>
                <input
                  type="text"
                  value={formData.orderNumber || ''}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المنصة</label>
                <select
                  value={formData.platform || 'shopify'}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="shopify">Shopify</option>
                  <option value="woocommerce">WooCommerce</option>
                  <option value="salla">Salla</option>
                  <option value="zid">Zid</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                <select
                  value={formData.status || 'pending'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pending">قيد الانتظار</option>
                  <option value="processing">قيد المعالجة</option>
                  <option value="shipped">تم الشحن</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="cancelled">ملغي</option>
                  <option value="refunded">مسترجع</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">طريقة الدفع</label>
                <input
                  type="text"
                  value={formData.paymentMethod || ''}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  placeholder="مثال: بطاقة ائتمانية، مدى"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <h3 className="font-semibold text-slate-700 border-b pb-2 mt-6">بيانات العميل</h3>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم العميل</label>
              <input
                type="text"
                value={formData.customerName || ''}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={formData.customerPhone || ''}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.customerEmail || ''}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-left"
                  dir="ltr"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">عنوان الشحن</label>
              <textarea
                value={formData.shippingAddress || ''}
                onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">طريقة الشحن</label>
                <input
                  type="text"
                  value={formData.shippingMethod || ''}
                  onChange={(e) => setFormData({ ...formData, shippingMethod: e.target.value })}
                  placeholder="مثال: سمسا، أرامكس"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Column 2: Items & Financials */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 border-b pb-2">المنتجات</h3>
            
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="اسم المنتج"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    placeholder="SKU"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="السعر"
                    value={newItem.price || ''}
                    onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                    className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="الكمية"
                    value={newItem.quantity || ''}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                    className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" /> إضافة منتج
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-2 font-medium text-slate-600">المنتج</th>
                    <th className="p-2 font-medium text-slate-600">السعر</th>
                    <th className="p-2 font-medium text-slate-600">الكمية</th>
                    <th className="p-2 font-medium text-slate-600">الإجمالي</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(formData.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2">
                        <div className="font-medium">{item.name}</div>
                        {item.sku && <div className="text-xs text-slate-500">{item.sku}</div>}
                      </td>
                      <td className="p-2">{item.price.toFixed(2)}</td>
                      <td className="p-2">{item.quantity}</td>
                      <td className="p-2">{(item.price * item.quantity).toFixed(2)}</td>
                      <td className="p-2">
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!formData.items || formData.items.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500">لا توجد منتجات مضافة</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <h3 className="font-semibold text-slate-700 border-b pb-2 mt-6">المالية</h3>
            <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">المجموع الفرعي:</span>
                <span className="font-medium">{(formData.subtotal || 0).toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">الضريبة:</span>
                <input
                  type="number"
                  value={formData.tax || 0}
                  onChange={(e) => handleFinancialChange('tax', parseFloat(e.target.value) || 0)}
                  className="w-24 p-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 text-left"
                  dir="ltr"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">رسوم الشحن:</span>
                <input
                  type="number"
                  value={formData.shippingFee || 0}
                  onChange={(e) => handleFinancialChange('shippingFee', parseFloat(e.target.value) || 0)}
                  className="w-24 p-1 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 text-left"
                  dir="ltr"
                />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-800">الإجمالي النهائي:</span>
                <span className="font-bold text-indigo-600 text-lg">{(formData.total || 0).toFixed(2)} ر.س</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            حفظ الطلب
          </button>
        </div>
      </div>
    </div>
  );
};

export default EcommerceOrderModal;
