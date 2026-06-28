import React, { useState } from 'react';
import { Vehicle, User } from '../../types';
import { X, Plus, Edit, Trash2, Truck } from 'lucide-react';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';

interface VehiclesModalProps {
  onClose: () => void;
  users: User[];
}

const VehiclesModal: React.FC<VehiclesModalProps> = ({ onClose, users }) => {
  const vehicles = useLiveQuery(() => db.vehicles.toArray());
  const [isEditing, setIsEditing] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    plateNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'van',
    status: 'active',
    currentMileage: 0,
    licenseExpiry: new Date(),
    insuranceExpiry: new Date()
  });

  const handleSave = async () => {
    try {
      if (editingVehicle?.id) {
        await db.vehicles.put({ ...formData, id: editingVehicle.id } as Vehicle);
      } else {
        await db.vehicles.add(formData as Vehicle);
      }
      setIsEditing(false);
      setEditingVehicle(null);
      setFormData({
        plateNumber: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        type: 'van',
        status: 'active',
        currentMileage: 0,
        licenseExpiry: new Date(),
        insuranceExpiry: new Date()
      });
    } catch (error) {
      console.error('Error saving vehicle:', error);
    }
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setFormData(vehicle);
    setIsEditing(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذه السيارة؟')) {
      await db.vehicles.delete(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" />
            إدارة السيارات
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {!isEditing ? (
            <div>
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => {
                    setEditingVehicle(null);
                    setFormData({
                      plateNumber: '',
                      make: '',
                      model: '',
                      year: new Date().getFullYear(),
                      type: 'van',
                      status: 'active',
                      currentMileage: 0,
                      licenseExpiry: new Date(),
                      insuranceExpiry: new Date()
                    });
                    setIsEditing(true);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> إضافة سيارة
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-600">اللوحة</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-600">النوع والموديل</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-600">السائق المعين</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-600">الحالة</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-600 w-24">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vehicles?.map(vehicle => {
                      const driver = users.find(u => u.id === vehicle.assignedDriverId);
                      return (
                        <tr key={vehicle.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-medium text-slate-800">{vehicle.plateNumber}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{vehicle.make} {vehicle.model} ({vehicle.year})</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{driver?.name || 'غير معين'}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              vehicle.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                              vehicle.status === 'maintenance' ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {vehicle.status === 'active' ? 'نشطة' : vehicle.status === 'maintenance' ? 'صيانة' : 'غير نشطة'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm flex gap-2">
                            <button onClick={() => handleEdit(vehicle)} className="text-indigo-600 hover:text-indigo-900 p-1">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => vehicle.id && handleDelete(vehicle.id)} className="text-red-600 hover:text-red-900 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {(!vehicles || vehicles.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                          لا توجد سيارات مسجلة
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم اللوحة</label>
                  <input
                    type="text"
                    value={formData.plateNumber || ''}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الشركة المصنعة (Make)</label>
                  <input
                    type="text"
                    value={formData.make || ''}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الموديل (Model)</label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">سنة الصنع</label>
                  <input
                    type="number"
                    value={formData.year || new Date().getFullYear()}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">نوع السيارة</label>
                  <select
                    value={formData.type || 'van'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="car">سيارة صغيرة</option>
                    <option value="van">فان (Van)</option>
                    <option value="truck">شاحنة</option>
                    <option value="motorcycle">دراجة نارية</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">نشطة</option>
                    <option value="maintenance">في الصيانة</option>
                    <option value="inactive">غير نشطة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">السائق المعين</label>
                  <select
                    value={formData.assignedDriverId || 0}
                    onChange={(e) => setFormData({ ...formData, assignedDriverId: parseInt(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={0}>بدون سائق</option>
                    {users?.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الممشى الحالي (كم)</label>
                  <input
                    type="number"
                    value={formData.currentMileage || 0}
                    onChange={(e) => setFormData({ ...formData, currentMileage: parseInt(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ انتهاء الرخصة</label>
                  <input
                    type="date"
                    value={formData.licenseExpiry ? new Date(formData.licenseExpiry).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, licenseExpiry: new Date(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ انتهاء التأمين</label>
                  <input
                    type="date"
                    value={formData.insuranceExpiry ? new Date(formData.insuranceExpiry).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, insuranceExpiry: new Date(e.target.value) })}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  حفظ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehiclesModal;
