import React, { useState } from 'react';
import { db } from '../../db';
import { VanSalesRoute } from '../../types';
import { Truck, Plus, Edit, Trash2, MapPin, CheckCircle, Clock } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function VanSales() {
  const { success, error: showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<VanSalesRoute | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; id: number } | null>(null);
  const [formData, setFormData] = useState<Partial<VanSalesRoute>>({
    employeeId: 0,
    routeName: '',
    date: new Date().toISOString().split('T')[0],
    status: 'planned',
    stops: []
  });

  const routes = useLiveQuery(() => db.vanSalesRoutes.toArray());
  const employees = useLiveQuery(() => db.users.where('role').notEqual('admin').toArray());
  const customers = useLiveQuery(() => db.customers.toArray());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRoute?.id) {
        await db.vanSalesRoutes.put({ ...formData, id: editingRoute.id } as VanSalesRoute);
        success('تم تحديث خط سير المندوب بنجاح');
      } else {
        await db.vanSalesRoutes.add(formData as VanSalesRoute);
        success('تم إضافة خط السير الجديد بنجاح');
      }
      setIsModalOpen(false);
      setEditingRoute(null);
      setFormData({ employeeId: 0, routeName: '', date: new Date().toISOString().split('T')[0], status: 'planned', stops: [] });
    } catch (err) {
      console.error(err);
      showError('فشل في حفظ خط السير');
    }
  };

  const handleEdit = (route: VanSalesRoute) => {
    setEditingRoute(route);
    setFormData(route);
    setIsModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setConfirmConfig({ isOpen: true, id });
  };

  const handleDelete = async () => {
    if (!confirmConfig) return;
    try {
      await db.vanSalesRoutes.delete(confirmConfig.id);
      success('تم حذف خط السير بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل في حذف خط السير');
    }
    setConfirmConfig(null);
  };

  const getEmployeeName = (id: number) => {
    return employees?.find(e => e.id === id)?.name || 'غير معروف';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned': return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-semibold flex items-center gap-1 w-max"><Clock className="w-3.5 h-3.5"/> مخطط</span>;
      case 'in_progress': return <span className="px-2.5 py-1 bg-sky-100 text-sky-800 rounded-full text-xs font-semibold flex items-center gap-1 w-max animate-pulse"><Truck className="w-3.5 h-3.5"/> قيد التنفيذ</span>;
      case 'completed': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold flex items-center gap-1 w-max"><CheckCircle className="w-3.5 h-3.5"/> مكتمل</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6 min-h-full bg-gradient-to-tr from-sky-50/60 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600 animate-pulse" />
            خطوط السير ومبيعات المندوبين
          </h1>
          <p className="text-gray-500 mt-1">إدارة مسارات التوزيع والمبيعات الخارجية وتتبع زيارات العملاء</p>
        </div>
        <button
          onClick={() => {
            setEditingRoute(null);
            setFormData({ employeeId: 0, routeName: '', date: new Date().toISOString().split('T')[0], status: 'planned', stops: [] });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-md transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          إضافة خط سير جديد
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-indigo-100/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-indigo-100/40">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">اسم الخط</th>
                <th className="p-4 text-sm font-semibold text-gray-600">المندوب</th>
                <th className="p-4 text-sm font-semibold text-gray-600">التاريخ</th>
                <th className="p-4 text-sm font-semibold text-gray-600">عدد المحطات (العملاء)</th>
                <th className="p-4 text-sm font-semibold text-gray-600">الحالة</th>
                <th className="p-4 text-sm font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {routes?.map((route) => (
                <tr key={route.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-500 animate-bounce" />
                    {route.routeName}
                  </td>
                  <td className="p-4 text-gray-600">{getEmployeeName(route.employeeId)}</td>
                  <td className="p-4 text-gray-600 font-mono">{new Date(route.date).toLocaleDateString('ar-SA')}</td>
                  <td className="p-4 font-bold text-indigo-600 font-mono">{route.stops.length} محطات</td>
                  <td className="p-4">{getStatusBadge(route.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(route)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => route.id && confirmDelete(route.id)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {routes?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Truck className="w-12 h-12 text-gray-300 animate-pulse" />
                      <p>لا توجد خطوط سير مسجلة حتى الآن</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-indigo-100/30">
            <h2 className="text-xl font-bold mb-4 text-gray-900 border-b border-gray-100 pb-2">{editingRoute ? 'تعديل خط السير' : 'إضافة خط سير جديد'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم الخط / المنطقة</label>
                <input
                  type="text"
                  required
                  value={formData.routeName}
                  onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="مثال: مسار شمال الرياض"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المندوب</label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: Number(e.target.value) })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value={0}>اختر المندوب...</option>
                  {employees?.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">العملاء (المحطات)</label>
                <select
                  multiple
                  value={formData.stops?.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => Number(option.value));
                    setFormData({ ...formData, stops: selected });
                  }}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 h-32 bg-white"
                >
                  {customers?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">اضغط Ctrl أو Cmd لاختيار أكثر من عميل</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="planned">مخطط</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتمل</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow"
                >
                  حفظ خط السير
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title="حذف خط سير المندوب"
          message="هل أنت متأكد من حذف خط السير هذا نهائياً من سجلات التوزيع؟ لا يمكن التراجع عن هذا الإجراء."
          onConfirm={handleDelete}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
}
