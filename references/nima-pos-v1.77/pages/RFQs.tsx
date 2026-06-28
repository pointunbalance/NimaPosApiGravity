import React from 'react';
import { useToast } from '../context/ToastContext';
import { useRFQsState } from '../components/rfqs/useRFQsState';
import { FileSearch, Search, Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, Save, X, Send, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import CompareRFQsModal from '../components/rfqs/CompareRFQsModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { RFQ } from '../types';

export const RFQs: React.FC = () => {
  const { success, error: showError } = useToast();

  const {
    rfqs,
    products,
    suppliers,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    setIsModalOpen,
    isCompareModalOpen,
    setIsCompareModalOpen,
    editingRFQ,
    setEditingRFQ,
    formData,
    setFormData,
    newItem,
    setNewItem,
    currencyCode,
    filteredRFQs,
    confirmState,
    setConfirmState,
    handleSave,
    resetForm,
    handleDelete,
    handleStatusChange,
    convertToPurchaseOrder,
    handleAddItem,
    handleRemoveItem,
    getProductName,
    getSupplierName,
  } = useRFQsState(success, showError);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': 
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center gap-1"><Edit2 size={12}/> مسودة</span>;
      case 'sent': 
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1"><Send size={12}/> تم الإرسال</span>;
      case 'received': 
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1"><Clock size={12}/> تم الاستلام</span>;
      case 'accepted': 
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1"><CheckCircle size={12}/> مقبول</span>;
      case 'rejected': 
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1"><XCircle size={12}/> مرفوض</span>;
      default: 
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center gap-1">غير معروف</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileSearch className="w-6 h-6 text-indigo-500" />
            عروض أسعار الموردين (RFQ)
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-sans">طلب وتتبع عروض الأسعار من الموردين ومقارنتها</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCompareModalOpen(true)}
            className="bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-colors"
            title="مقارنة عروض الأسعار المسجلة حالياً لمعرفة الأفضل"
          >
            مقارنة الأسعار
          </button>
          <button 
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors font-bold"
          >
            <Plus className="w-5 h-5" />
            طلب عرض سعر جديد
          </button>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="البحث برقم العرض أو اسم المورد..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">رقم العرض</th>
                <th className="p-4 text-sm font-semibold text-slate-600">التاريخ</th>
                <th className="p-4 text-sm font-semibold text-slate-600">تاريخ الانتهاء</th>
                <th className="p-4 text-sm font-semibold text-slate-600">المورد</th>
                <th className="p-4 text-sm font-semibold text-slate-600">عدد الأصناف</th>
                <th className="p-4 text-sm font-semibold text-slate-600">الحالة</th>
                <th className="p-4 text-sm font-semibold text-slate-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRFQs.map(rfq => (
                <tr key={rfq.id} className="hover:bg-slate-50">
                  <td className="p-4 text-sm font-medium text-indigo-600">
                    {rfq.rfqNumber}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {format(new Date(rfq.date), 'yyyy-MM-dd')}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {format(new Date(rfq.dueDate), 'yyyy-MM-dd')}
                  </td>
                  <td className="p-4 text-sm text-slate-800 font-bold">
                    {getSupplierName(rfq.supplierId)}
                  </td>
                  <td className="p-4 text-sm text-slate-600 font-bold">
                    {rfq.items.length}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(rfq.status)}
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    {rfq.status === 'draft' && (
                      <button onClick={() => handleStatusChange(rfq.id!, 'sent')} className="text-blue-600 hover:text-blue-800 bg-blue-50 p-1.5 rounded-lg" title="إرسال للمورد">
                        <Send size={16} />
                      </button>
                    )}
                    {rfq.status === 'sent' && (
                      <button onClick={() => handleStatusChange(rfq.id!, 'received')} className="text-yellow-600 hover:text-yellow-800 bg-yellow-50 p-1.5 rounded-lg" title="تم الاستلام">
                        <Clock size={16} />
                      </button>
                    )}
                    {rfq.status === 'received' && (
                      <>
                        <button onClick={() => convertToPurchaseOrder(rfq)} className="text-green-600 hover:text-green-800 bg-green-50 p-1.5 rounded-lg" title="قبول وإنشاء أمر شراء">
                          <ShoppingCart size={16} />
                        </button>
                        <button onClick={() => handleStatusChange(rfq.id!, 'rejected')} className="text-red-600 hover:text-red-800 bg-red-50 p-1.5 rounded-lg" title="رفض">
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => {
                        setEditingRFQ(rfq);
                        setFormData(rfq);
                        setIsModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-indigo-600 bg-slate-50 p-1.5 rounded-lg "
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(rfq.id!)}
                      className="text-slate-400 hover:text-red-600 bg-slate-50 p-1.5 rounded-lg "
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRFQs.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    لا توجد عروض أسعار
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editingRFQ ? 'تعديل عرض السعر' : 'طلب عرض سعر جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 ">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم العرض *</label>
                  <input
                    type="text"
                    required
                    value={formData.rfqNumber || ''}
                    onChange={e => setFormData({...formData, rfqNumber: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المورد *</label>
                  <select
                    required
                    value={formData.supplierId || ''}
                    onChange={e => setFormData({...formData, supplierId: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  >
                    <option value="">اختر المورد...</option>
                    {suppliers?.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الطلب *</label>
                  <input
                    type="date"
                    required
                    value={formData.date ? format(new Date(formData.date), 'yyyy-MM-dd') : ''}
                    onChange={e => setFormData({...formData, date: new Date(e.target.value)})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الانتهاء *</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate ? format(new Date(formData.dueDate), 'yyyy-MM-dd') : ''}
                    onChange={e => setFormData({...formData, dueDate: new Date(e.target.value)})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                  <select
                    value={formData.status || 'draft'}
                    onChange={e => setFormData({...formData, status: e.target.value as RFQ['status']})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  >
                    <option value="draft">مسودة</option>
                    <option value="sent">تم الإرسال</option>
                    <option value="received">تم الاستلام</option>
                    <option value="accepted">مقبول</option>
                    <option value="rejected">مرفوض</option>
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <h3 className="font-bold text-slate-800 mb-4">الأصناف المطلوبة</h3>
                
                <div className="flex gap-2 mb-4">
                  <select
                    value={newItem.productId || ''}
                    onChange={e => setNewItem({...newItem, productId: parseInt(e.target.value)})}
                    className="flex-1 p-2 border rounded-lg "
                  >
                    <option value="">اختر الصنف...</option>
                    {products?.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="الكمية"
                    min="0.01"
                    step="0.01"
                    value={newItem.quantity || ''}
                    onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})}
                    className="w-24 p-2 border rounded-lg "
                  />
                  <input
                    type="number"
                    placeholder={`السعر المعروض (${currencyCode})`}
                    min="0"
                    step="0.01"
                    value={newItem.quotedPrice || ''}
                    onChange={e => setNewItem({...newItem, quotedPrice: parseFloat(e.target.value)})}
                    className="w-32 p-2 border rounded-lg "
                  />
                  <input
                    type="text"
                    placeholder="ملاحظات"
                    value={newItem.notes || ''}
                    onChange={e => setNewItem({...newItem, notes: e.target.value})}
                    className="w-1/4 p-2 border rounded-lg "
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!newItem.productId || !newItem.quantity}
                    className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 disabled:opacity-50 font-bold"
                  >
                    إضافة
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-4">
                        <span className="font-medium text-slate-800 w-48">{getProductName(item.productId)}</span>
                        <span className="text-slate-500 font-bold w-16">{item.quantity}</span>
                        <span className="text-indigo-600 font-bold w-24">
                          {item.quotedPrice ? `${item.quotedPrice} ${currencyCode}` : '-'}
                        </span>
                        <span className="text-slate-500 text-sm">{item.notes}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  {(!formData.items || formData.items.length === 0) && (
                    <p className="text-center text-slate-500 py-4">لم يتم إضافة أصناف بعد</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات وشروط</label>
                <textarea
                  rows={3}
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-bold"
                >
                  <Save size={20} />
                  حفظ العرض
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CompareRFQsModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        rfqs={rfqs || []}
        products={products || []}
        suppliers={suppliers || []}
        currency={currencyCode}
      />

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

export default RFQs;
