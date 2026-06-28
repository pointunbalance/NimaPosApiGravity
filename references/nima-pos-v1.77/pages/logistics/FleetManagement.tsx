import React, { useState } from 'react';
import { db } from '../../db';
import { Vehicle, MaintenanceRecord, FuelRecord } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';
import { 
  Truck, Plus, Search, Wrench, Fuel, Calendar, 
  AlertTriangle, CheckCircle, Clock, X, Save, Car
} from 'lucide-react';

export default function FleetManagement() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'vehicles' | 'maintenance' | 'fuel'>('vehicles');
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const vehicles = useLiveQuery(() => db.vehicles.toArray());
  const maintenanceRecords = useLiveQuery(() => db.maintenanceRecords.reverse().sortBy('date'));
  const fuelRecords = useLiveQuery(() => db.fuelRecords.reverse().sortBy('date'));
  const users = useLiveQuery(() => db.users.toArray());

  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({
    status: 'active',
    type: 'van',
    licenseExpiry: new Date(),
    insuranceExpiry: new Date(),
    currentMileage: 0
  });

  const [newMaintenance, setNewMaintenance] = useState<Partial<MaintenanceRecord>>({
    date: new Date(),
    type: 'routine',
    status: 'scheduled',
    cost: 0,
    mileage: 0
  });

  const [newFuel, setNewFuel] = useState<Partial<FuelRecord>>({
    date: new Date(),
    amount: 0,
    cost: 0,
    mileage: 0
  });

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.plateNumber || !newVehicle.make || !newVehicle.model) {
      showToast('يرجى تعبئة الحقول المطلوبة', 'warning');
      return;
    }

    try {
      await db.vehicles.add({
        plateNumber: newVehicle.plateNumber,
        make: newVehicle.make,
        model: newVehicle.model,
        year: newVehicle.year || new Date().getFullYear(),
        type: newVehicle.type as any,
        status: newVehicle.status as any,
        assignedDriverId: newVehicle.assignedDriverId ? Number(newVehicle.assignedDriverId) : undefined,
        licenseExpiry: newVehicle.licenseExpiry || new Date(),
        insuranceExpiry: newVehicle.insuranceExpiry || new Date(),
        currentMileage: newVehicle.currentMileage || 0,
        notes: newVehicle.notes
      });

      setIsVehicleModalOpen(false);
      setNewVehicle({
        status: 'active',
        type: 'van',
        licenseExpiry: new Date(),
        insuranceExpiry: new Date(),
        currentMileage: 0
      });
      showToast('تم تسجيل المركبة بنجاح', 'success');
    } catch (error) {
      showToast('حدث خطأ أثناء حفظ المركبة', 'error');
    }
  };

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaintenance.vehicleId || !newMaintenance.description) {
      showToast('يرجى تعبئة الحقول المطلوبة', 'warning');
      return;
    }

    try {
      await db.maintenanceRecords.add({
        vehicleId: Number(newMaintenance.vehicleId),
        date: newMaintenance.date || new Date(),
        type: newMaintenance.type as any,
        description: newMaintenance.description,
        cost: Number(newMaintenance.cost),
        mileage: Number(newMaintenance.mileage),
        provider: newMaintenance.provider || '',
        nextDueDate: newMaintenance.nextDueDate,
        nextDueMileage: newMaintenance.nextDueMileage ? Number(newMaintenance.nextDueMileage) : undefined,
        status: newMaintenance.status as any
      });

      // Update vehicle status
      if (newMaintenance.status === 'scheduled') {
        await db.vehicles.update(Number(newMaintenance.vehicleId), { status: 'maintenance' });
      } else if (newMaintenance.status === 'completed') {
        await db.vehicles.update(Number(newMaintenance.vehicleId), { status: 'active' });
      }

      setIsMaintenanceModalOpen(false);
      setNewMaintenance({
        date: new Date(),
        type: 'routine',
        status: 'scheduled',
        cost: 0,
        mileage: 0
      });
      showToast('تم تسجيل الصيانة وتحديث حالة المركبة', 'success');
    } catch (error) {
      showToast('حدث خطأ أثناء حفظ الصيانة', 'error');
    }
  };

  const handleCreateFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFuel.vehicleId || !newFuel.driverId) {
      showToast('يرجى تعبئة الحقول المطلوبة', 'warning');
      return;
    }

    const vehicle = vehicles?.find(v => v.id === Number(newFuel.vehicleId));
    if (vehicle && Number(newFuel.mileage) < vehicle.currentMileage) {
      showToast(`قراءة العداد (${newFuel.mileage}) لا يمكن أن تكون أقل من القراءة الحالية (${vehicle.currentMileage})`, 'warning');
      return;
    }

    try {
      await db.fuelRecords.add({
        vehicleId: Number(newFuel.vehicleId),
        driverId: Number(newFuel.driverId),
        date: newFuel.date || new Date(),
        amount: Number(newFuel.amount),
        cost: Number(newFuel.cost),
        mileage: Number(newFuel.mileage),
        notes: newFuel.notes
      });

      // Update vehicle mileage
      if (vehicle && Number(newFuel.mileage) > vehicle.currentMileage) {
        await db.vehicles.update(vehicle.id!, { currentMileage: Number(newFuel.mileage) });
      }

      setIsFuelModalOpen(false);
      setNewFuel({
        date: new Date(),
        amount: 0,
        cost: 0,
        mileage: 0
      });
      showToast('تم تسجيل الوقود', 'success');
    } catch (error) {
      showToast('حدث خطأ أثناء تسجيل الوقود', 'error');
    }
  };

  const getVehicleName = (id?: number) => {
    const v = vehicles?.find(v => v.id === id);
    return v ? `${v.make} ${v.model} (${v.plateNumber})` : 'غير محدد';
  };

  const getUserName = (id?: number) => users?.find(u => u.id === id)?.name || 'غير محدد';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-800 ';
      case 'maintenance': return 'bg-amber-100 text-amber-800 ';
      case 'inactive': return 'bg-slate-100 text-slate-800 ';
      case 'scheduled': return 'bg-blue-100 text-blue-800 ';
      case 'completed': return 'bg-emerald-100 text-emerald-800 ';
      case 'cancelled': return 'bg-red-100 text-red-800 ';
      default: return 'bg-slate-100 text-slate-800 ';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'maintenance': return 'في الصيانة';
      case 'inactive': return 'غير نشط';
      case 'scheduled': return 'مجدول';
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغى';
      default: return status;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Truck className="text-indigo-600" />
            إدارة المركبات والأسطول
          </h1>
          <p className="text-slate-500 text-sm mt-1">تتبع سيارات الشركة، الصيانة، واستهلاك الوقود</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsFuelModalOpen(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Fuel size={20} />
            تسجيل وقود
          </button>
          <button
            onClick={() => setIsMaintenanceModalOpen(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Wrench size={20} />
            صيانة جديدة
          </button>
          <button
            onClick={() => setIsVehicleModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            مركبة جديدة
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'vehicles'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 '
            }`}
          >
            <Car size={18} />
            المركبات
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'maintenance'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 '
            }`}
          >
            <Wrench size={18} />
            سجل الصيانة
          </button>
          <button
            onClick={() => setActiveTab('fuel')}
            className={`flex-1 py-4 text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'fuel'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 '
            }`}
          >
            <Fuel size={18} />
            استهلاك الوقود
          </button>
        </div>

        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="بحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'vehicles' && (
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-sm">
                <tr>
                  <th className="p-4 font-medium">المركبة</th>
                  <th className="p-4 font-medium">رقم اللوحة</th>
                  <th className="p-4 font-medium">النوع</th>
                  <th className="p-4 font-medium">السائق المعين</th>
                  <th className="p-4 font-medium">العداد (كم)</th>
                  <th className="p-4 font-medium">انتهاء الترخيص</th>
                  <th className="p-4 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {vehicles?.filter(v => v.plateNumber.includes(searchTerm) || v.make.includes(searchTerm)).map(vehicle => (
                  <tr key={vehicle.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">
                      {vehicle.make} {vehicle.model} ({vehicle.year})
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 font-mono">
                        {vehicle.plateNumber}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{vehicle.type}</td>
                    <td className="p-4 text-sm text-slate-600">{getUserName(vehicle.assignedDriverId)}</td>
                    <td className="p-4 text-sm font-medium text-slate-700">{vehicle.currentMileage.toLocaleString()}</td>
                    <td className="p-4 text-sm text-slate-500">
                      {format(new Date(vehicle.licenseExpiry), 'yyyy-MM-dd')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                        {getStatusLabel(vehicle.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {vehicles?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      لا توجد مركبات مسجلة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'maintenance' && (
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-sm">
                <tr>
                  <th className="p-4 font-medium">التاريخ</th>
                  <th className="p-4 font-medium">المركبة</th>
                  <th className="p-4 font-medium">نوع الصيانة</th>
                  <th className="p-4 font-medium">الوصف</th>
                  <th className="p-4 font-medium">التكلفة</th>
                  <th className="p-4 font-medium">العداد (كم)</th>
                  <th className="p-4 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {maintenanceRecords?.filter(m => m.description.includes(searchTerm)).map(record => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-500">
                      {format(new Date(record.date), 'yyyy-MM-dd')}
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {getVehicleName(record.vehicleId)}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {record.type === 'routine' ? 'دورية' : record.type === 'repair' ? 'إصلاح' : 'فحص'}
                    </td>
                    <td className="p-4 text-sm text-slate-600">{record.description}</td>
                    <td className="p-4 text-sm font-medium text-slate-700">{record.cost.toLocaleString()}</td>
                    <td className="p-4 text-sm text-slate-600">{record.mileage.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {maintenanceRecords?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      لا توجد سجلات صيانة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'fuel' && (
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-500 text-sm">
                <tr>
                  <th className="p-4 font-medium">التاريخ</th>
                  <th className="p-4 font-medium">المركبة</th>
                  <th className="p-4 font-medium">السائق</th>
                  <th className="p-4 font-medium">الكمية (لتر)</th>
                  <th className="p-4 font-medium">التكلفة</th>
                  <th className="p-4 font-medium">العداد (كم)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {fuelRecords?.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-500">
                      {format(new Date(record.date), 'yyyy-MM-dd')}
                    </td>
                    <td className="p-4 font-medium text-slate-800">
                      {getVehicleName(record.vehicleId)}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {getUserName(record.driverId)}
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-700">{record.amount}</td>
                    <td className="p-4 text-sm font-medium text-slate-700">{record.cost.toLocaleString()}</td>
                    <td className="p-4 text-sm text-slate-600">{record.mileage.toLocaleString()}</td>
                  </tr>
                ))}
                {fuelRecords?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      لا توجد سجلات وقود
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* New Vehicle Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">إضافة مركبة جديدة</h2>
              <button onClick={() => setIsVehicleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="vehicle-form" onSubmit={handleCreateVehicle} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">رقم اللوحة *</label>
                    <input
                      required
                      type="text"
                      value={newVehicle.plateNumber || ''}
                      onChange={e => setNewVehicle({...newVehicle, plateNumber: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">النوع</label>
                    <select
                      value={newVehicle.type}
                      onChange={e => setNewVehicle({...newVehicle, type: e.target.value as any})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="car">سيارة</option>
                      <option value="van">فان / باص</option>
                      <option value="truck">شاحنة</option>
                      <option value="motorcycle">دراجة نارية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الشركة المصنعة *</label>
                    <input
                      required
                      type="text"
                      placeholder="مثال: تويوتا"
                      value={newVehicle.make || ''}
                      onChange={e => setNewVehicle({...newVehicle, make: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الموديل *</label>
                    <input
                      required
                      type="text"
                      placeholder="مثال: هايس"
                      value={newVehicle.model || ''}
                      onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">سنة الصنع</label>
                    <input
                      type="number"
                      value={newVehicle.year || ''}
                      onChange={e => setNewVehicle({...newVehicle, year: Number(e.target.value)})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">السائق المعين</label>
                    <select
                      value={newVehicle.assignedDriverId || ''}
                      onChange={e => setNewVehicle({...newVehicle, assignedDriverId: Number(e.target.value)})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="">-- بدون سائق --</option>
                      {users?.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">انتهاء الترخيص</label>
                    <input
                      type="date"
                      value={format(newVehicle.licenseExpiry || new Date(), 'yyyy-MM-dd')}
                      onChange={e => setNewVehicle({...newVehicle, licenseExpiry: new Date(e.target.value)})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">انتهاء التأمين</label>
                    <input
                      type="date"
                      value={format(newVehicle.insuranceExpiry || new Date(), 'yyyy-MM-dd')}
                      onChange={e => setNewVehicle({...newVehicle, insuranceExpiry: new Date(e.target.value)})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">قراءة العداد الحالية (كم)</label>
                    <input
                      type="number"
                      value={newVehicle.currentMileage || 0}
                      onChange={e => setNewVehicle({...newVehicle, currentMileage: Number(e.target.value)})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                    <select
                      value={newVehicle.status}
                      onChange={e => setNewVehicle({...newVehicle, status: e.target.value as any})}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="active">نشط</option>
                      <option value="maintenance">في الصيانة</option>
                      <option value="inactive">غير نشط</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsVehicleModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                form="vehicle-form"
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Save size={20} />
                حفظ المركبة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Maintenance Modal */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">تسجيل صيانة</h2>
              <button onClick={() => setIsMaintenanceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateMaintenance} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المركبة *</label>
                <select
                  required
                  value={newMaintenance.vehicleId || ''}
                  onChange={e => setNewMaintenance({...newMaintenance, vehicleId: Number(e.target.value)})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- اختر المركبة --</option>
                  {vehicles?.map(v => (
                    <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plateNumber})</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ *</label>
                  <input
                    required
                    type="date"
                    value={format(newMaintenance.date || new Date(), 'yyyy-MM-dd')}
                    onChange={e => setNewMaintenance({...newMaintenance, date: new Date(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">نوع الصيانة</label>
                  <select
                    value={newMaintenance.type}
                    onChange={e => setNewMaintenance({...newMaintenance, type: e.target.value as any})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="routine">دورية</option>
                    <option value="repair">إصلاح أعطال</option>
                    <option value="inspection">فحص</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الوصف *</label>
                <input
                  required
                  type="text"
                  placeholder="مثال: تغيير زيت وفلاتر"
                  value={newMaintenance.description || ''}
                  onChange={e => setNewMaintenance({...newMaintenance, description: e.target.value})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">التكلفة</label>
                  <input
                    type="number"
                    value={newMaintenance.cost || 0}
                    onChange={e => setNewMaintenance({...newMaintenance, cost: Number(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">العداد (كم)</label>
                  <input
                    type="number"
                    value={newMaintenance.mileage || 0}
                    onChange={e => setNewMaintenance({...newMaintenance, mileage: Number(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                <select
                  value={newMaintenance.status}
                  onChange={e => setNewMaintenance({...newMaintenance, status: e.target.value as any})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="scheduled">مجدول</option>
                  <option value="completed">مكتمل</option>
                  <option value="cancelled">ملغى</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  حفظ الصيانة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Fuel Modal */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">تسجيل استهلاك وقود</h2>
              <button onClick={() => setIsFuelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateFuel} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المركبة *</label>
                <select
                  required
                  value={newFuel.vehicleId || ''}
                  onChange={e => setNewFuel({...newFuel, vehicleId: Number(e.target.value)})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- اختر المركبة --</option>
                  {vehicles?.map(v => (
                    <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plateNumber})</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">السائق *</label>
                <select
                  required
                  value={newFuel.driverId || ''}
                  onChange={e => setNewFuel({...newFuel, driverId: Number(e.target.value)})}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- اختر السائق --</option>
                  {users?.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">التاريخ *</label>
                  <input
                    required
                    type="date"
                    value={format(newFuel.date || new Date(), 'yyyy-MM-dd')}
                    onChange={e => setNewFuel({...newFuel, date: new Date(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الكمية (لتر) *</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    value={newFuel.amount || 0}
                    onChange={e => setNewFuel({...newFuel, amount: Number(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">التكلفة الإجمالية *</label>
                  <input
                    required
                    type="number"
                    value={newFuel.cost || 0}
                    onChange={e => setNewFuel({...newFuel, cost: Number(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">العداد (كم) *</label>
                  <input
                    required
                    type="number"
                    value={newFuel.mileage || 0}
                    onChange={e => setNewFuel({...newFuel, mileage: Number(e.target.value)})}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFuelModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  حفظ السجل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
