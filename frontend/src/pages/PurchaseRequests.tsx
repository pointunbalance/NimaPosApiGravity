import React from 'react';
import { useToast } from '../context/ToastContext';
import { usePurchaseRequestsState } from '../components/purchaseRequests/usePurchaseRequestsState';
import { FileText, Search, Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, Save, X, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmModal from '../components/ui/ConfirmModal';
import { PurchaseRequest } from '../types';

export const PurchaseRequests: React.FC = () => {
  const { success, error: showError } = useToast();

  const {
    products,
    currentUser,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    setIsModalOpen,
    editingRequest,
    setEditingRequest,
    formData,
    setFormData,
    newItem,
    setNewItem,
    filteredRequests,
    workflows,
    confirmState,
    setConfirmState,
    handleSave,
    resetForm,
    handleDelete,
    handleStatusChange,
    handleWorkflowAction,
    handleAddItem,
    handleRemoveItem,
    getProductName,
    getUserName
  } = usePurchaseRequestsState(success, showError);

  const getStatusBadge = (status: string, req?: PurchaseRequest) => {
    switch (status) {
      case 'approved': 
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1 font-bold"><CheckCircle size={12}/> معتمد</span>;
      case 'rejected': 
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1 font-bold"><XCircle size={12}/> مرفوض</span>;
      case 'ordered': 
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1 font-bold"><ShoppingCart size={12}/> تم الطلب</span>;
      case 'in_workflow': {
        let stepName = 'مرحلة الاعتماد';
        if (req && req.activeWorkflowId) {
          const wf = workflows?.find(w => w.id === req.activeWorkflowId);
          if (wf && wf.steps) {
            stepName = `انتظار: ${wf.steps[req.approvalStepIndex || 0] || ''}`;
          }
        }
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs flex items-center gap-1 font-bold"><Clock size={12}/> {stepName}</span>;
      }
      default: 
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1 font-bold"><Clock size={12}/> قيد الانتظار</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            طلبات الشراء الداخلية
          </h1>
          <p className="text-slate-500 text-sm mt-1">إدارة طلبات احتياجات الأقسام والموظفين ومتابعة مراحل اعتمادها</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors font-bold"
        >
          <Plus className="w-5 h-5" />
          طلب شراء جديد
        </button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="البحث برقم الطلب أو القسم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">رقم الطلب</th>
                <th className="p-4 text-sm font-semibold text-slate-600">التاريخ</th>
                <th className="p-4 text-sm font-semibold text-slate-600">مقدم الطلب</th>
                <th className="p-4 text-sm font-semibold text-slate-600">القسم</th>
                <th className="p-4 text-sm font-semibold text-slate-600">عدد الأصناف</th>
                <th className="p-4 text-sm font-semibold text-slate-600">الحالة</th>
                <th className="p-4 text-sm font-semibold text-slate-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map(req => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="p-4 text-sm font-medium text-indigo-600">
                    {req.requestNumber}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {format(new Date(req.date), 'yyyy-MM-dd')}
                  </td>
                  <td className="p-4 text-sm text-slate-800">
                    {getUserName(req.requestedBy)}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {req.department || '-'}
                  </td>
                  <td className="p-4 text-sm text-slate-600 font-bold">
                    {req.items.length}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(req.status, req)}
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    {currentUser.role === 'admin' && (req.status === 'pending' || req.status === 'in_workflow') && (
                      <>
                        <button onClick={() => handleWorkflowAction(req, 'approved')} className="text-green-600 hover:text-green-800 bg-green-50 p-1.5 rounded-lg" title="اعتماد">
                          <CheckCircle size={16} />
                        </button>
                        <button onClick={() => handleWorkflowAction(req, 'rejected')} className="text-red-600 hover:text-red-800 bg-red-50 p-1.5 rounded-lg" title="رفض">
                          <XCircle size={16} />
                        </button>
                      </>
                    )}
                    {currentUser.role === 'admin' && req.status === 'approved' && (
                      <button onClick={() => handleStatusChange(req.id!, 'ordered')} className="text-blue-600 hover:text-blue-800 bg-blue-50 p-1.5 rounded-lg" title="تحويل إلى طلب شراء">
                        <ShoppingCart size={16} />
                      </button>
                    )}
                    {(currentUser.role === 'admin' || req.status === 'pending') && (
                      <>
                        <button 
                          onClick={() => {
                            setEditingRequest(req);
                            setFormData(req);
                            setIsModalOpen(true);
                          }}
                          className="text-slate-400 hover:text-indigo-600 bg-slate-50 p-1.5 rounded-lg "
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(req.id!)}
                          className="text-slate-400 hover:text-red-600 bg-slate-50 p-1.5 rounded-lg "
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    لا توجد طلبات شراء داخلية مسجلة حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editingRequest ? 'تعديل طلب الشراء' : 'طلب شراء جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 ">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الطلب *</label>
                  <input
                    type="text"
                    required
                    value={formData.requestNumber || ''}
                    onChange={e => setFormData({...formData, requestNumber: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ *</label>
                  <input
                    type="date"
                    required
                    value={formData.date ? format(new Date(formData.date), 'yyyy-MM-dd') : ''}
                    onChange={e => setFormData({...formData, date: new Date(e.target.value)})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">القسم الطالب</label>
                  <input
                    type="text"
                    value={formData.department || ''}
                    onChange={e => setFormData({...formData, department: e.target.value})}
                    placeholder="مثال: المبيعات، الصيانة..."
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                {currentUser.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                    <select
                      value={formData.status || 'pending'}
                      onChange={e => setFormData({...formData, status: e.target.value as PurchaseRequest['status']})}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="pending">قيد الانتظار</option>
                      <option value="approved">معتمد</option>
                      <option value="rejected">مرفوض</option>
                      <option value="ordered">تم الطلب</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <h3 className="font-bold text-slate-800 mb-4">الأصناف المطلوبة</h3>
                
                <div className="flex gap-2 mb-4">
                  <select
                    value={newItem.productId || ''}
                    onChange={e => setNewItem({...newItem, productId: parseInt(e.target.value)})}
                    className="flex-1 p-2 border rounded-lg outline-none"
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
                    className="w-24 p-2 border rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    placeholder="ملاحظات (اختياري)"
                    value={newItem.notes || ''}
                    onChange={e => setNewItem({...newItem, notes: e.target.value})}
                    className="w-1/3 p-2 border rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!newItem.productId || !newItem.quantity}
                    className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 disabled:opacity-50 font-bold transition-colors"
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
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات عامة</label>
                <textarea
                  rows={3}
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
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
                  حفظ الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default PurchaseRequests;
