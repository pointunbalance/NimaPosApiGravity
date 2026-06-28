import React, { useState } from 'react';
import { VanSalesRoute, User, Vehicle, Customer } from '../../types';
import { X, Plus, Search } from 'lucide-react';

interface VanSalesRouteModalProps {
  editingRoute: VanSalesRoute | null;
  formData: Partial<VanSalesRoute>;
  setFormData: (data: Partial<VanSalesRoute>) => void;
  users: User[];
  vehicles: Vehicle[];
  customers: Customer[];
  onClose: () => void;
  onSave: () => void;
}

const VanSalesRouteModal: React.FC<VanSalesRouteModalProps> = ({
  editingRoute,
  formData,
  setFormData,
  users,
  vehicles,
  customers,
  onClose,
  onSave
}) => {
  const [customerSearch, setCustomerSearch] = useState('');

  const handleAddStop = (customerId: number) => {
    if (!formData.stops?.includes(customerId)) {
      setFormData({ ...formData, stops: [...(formData.stops || []), customerId] });
    }
  };

  const handleRemoveStop = (customerId: number) => {
    setFormData({ ...formData, stops: formData.stops?.filter(id => id !== customerId) || [] });
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  ).slice(0, 5); // Limit to 5 for UI performance

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            {editingRoute ? 'تعديل المسار' : 'إضافة مسار جديد'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">اسم المسار</label>
              <input
                type="text"
                value={formData.routeName || ''}
                onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="مثال: مسار شمال الرياض"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ</label>
              <input
                type="date"
                value={formData.date || ''}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">السائق</label>
              <select
                value={formData.employeeId || 0}
                onChange={(e) => setFormData({ ...formData, employeeId: parseInt(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0}>اختر السائق...</option>
                {users?.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">السيارة</label>
              <select
                value={formData.vehicleId || 0}
                onChange={(e) => setFormData({ ...formData, vehicleId: parseInt(e.target.value) })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value={0}>اختر السيارة...</option>
                {vehicles?.map(v => (
                  <option key={v.id} value={v.id}>{v.plateNumber} - {v.make} {v.model}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
              <select
                value={formData.status || 'planned'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="planned">مخطط</option>
                <option value="in_progress">قيد التنفيذ</option>
                <option value="completed">مكتمل</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">نقاط التوقف (العملاء)</h3>
            
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="البحث عن عميل لإضافته للمسار..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {customerSearch && (
              <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-40 overflow-y-auto">
                {filteredCustomers.length > 0 ? (
                  <ul className="space-y-1">
                    {filteredCustomers.map(customer => (
                      <li key={customer.id} className="flex justify-between items-center p-2 hover:bg-white rounded-md">
                        <div>
                          <p className="font-medium text-sm text-slate-800">{customer.name}</p>
                          <p className="text-xs text-slate-500">{customer.phone} - {customer.address}</p>
                        </div>
                        <button
                          onClick={() => customer.id && handleAddStop(customer.id)}
                          disabled={formData.stops?.includes(customer.id!)}
                          className="p-1 text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-50"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-2">لم يتم العثور على عملاء</p>
                )}
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-sm font-semibold text-slate-600">الترتيب</th>
                    <th className="px-4 py-2 text-sm font-semibold text-slate-600">اسم العميل</th>
                    <th className="px-4 py-2 text-sm font-semibold text-slate-600">العنوان</th>
                    <th className="px-4 py-2 text-sm font-semibold text-slate-600 w-16">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {formData.stops?.map((stopId, index) => {
                    const customer = customers.find(c => c.id === stopId);
                    return (
                      <tr key={stopId} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-sm text-slate-600">{index + 1}</td>
                        <td className="px-4 py-2 text-sm font-medium text-slate-800">{customer?.name || 'عميل غير معروف'}</td>
                        <td className="px-4 py-2 text-sm text-slate-600">{customer?.address || '-'}</td>
                        <td className="px-4 py-2 text-sm">
                          <button
                            onClick={() => handleRemoveStop(stopId)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {(!formData.stops || formData.stops.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                        لم يتم إضافة أي نقاط توقف للمسار
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            حفظ المسار
          </button>
        </div>
      </div>
    </div>
  );
};

export default VanSalesRouteModal;
