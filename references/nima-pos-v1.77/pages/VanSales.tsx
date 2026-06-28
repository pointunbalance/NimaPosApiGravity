import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { VanSalesRoute } from '../types';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

import VanSalesHeader from '../components/van-sales/VanSalesHeader';
import VanSalesStats from '../components/van-sales/VanSalesStats';
import VanSalesToolbar from '../components/van-sales/VanSalesToolbar';
import VanSalesRoutesList from '../components/van-sales/VanSalesRoutesList';
import VanSalesMap from '../components/van-sales/VanSalesMap';
import VanSalesQuickActions from '../components/van-sales/VanSalesQuickActions';
import VanSalesRouteModal from '../components/van-sales/VanSalesRouteModal';
import VehiclesModal from '../components/van-sales/VehiclesModal';
import VehicleInventoryModal from '../components/van-sales/VehicleInventoryModal';

const VanSales = () => {
  const { success, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVehiclesModalOpen, setIsVehiclesModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<VanSalesRoute | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; routeId: number } | null>(null);
  const [formData, setFormData] = useState<Partial<VanSalesRoute>>({
    routeName: '',
    employeeId: 0,
    status: 'planned',
    stops: [],
    date: new Date().toISOString().split('T')[0]
  });

  const routes = useLiveQuery(() => db.vanSalesRoutes.toArray());
  const users = useLiveQuery(() => db.users.toArray());
  const vehicles = useLiveQuery(() => db.vehicles.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());
  const products = useLiveQuery(() => db.products.toArray());
  const orders = useLiveQuery(() => db.orders.toArray());

  const handleSave = async () => {
    try {
      if (editingRoute?.id) {
        await db.vanSalesRoutes.put({ ...formData, id: editingRoute.id } as VanSalesRoute);
        success('تم تحديث مسار المبيعات بنجاح');
      } else {
        await db.vanSalesRoutes.add(formData as VanSalesRoute);
        success('تم إضافة مسار المبيعات بنجاح');
      }
      setIsModalOpen(false);
      setEditingRoute(null);
      setFormData({
        routeName: '',
        employeeId: 0,
        status: 'planned',
        stops: [],
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error saving route:', error);
      showError('فشل حفظ مسار المبيعات');
    }
  };

  const handleEdit = (route: VanSalesRoute) => {
    setEditingRoute(route);
    setFormData(route);
    setIsModalOpen(true);
  };

  const confirmDeleteRoute = (id: number) => {
    setConfirmConfig({ isOpen: true, routeId: id });
  };

  const handleDelete = async () => {
    if (!confirmConfig) return;
    try {
      await db.vanSalesRoutes.delete(confirmConfig.routeId);
      success('تم حذف مسار المبيعات بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل حذف المسار');
    }
    setConfirmConfig(null);
  };

  const filteredRoutes = routes?.filter(route => 
    route.routeName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const activeVehicles = routes?.filter(r => r.status === 'in_progress').length || 0;
  const totalVehicles = routes?.length || 0;
  const totalStopsToday = routes?.filter(r => r.date === new Date().toISOString().split('T')[0]).reduce((sum, r) => sum + r.stops.length, 0) || 0;

  const totalInventoryValue = vehicles?.reduce((sum, vehicle) => {
    if (!vehicle.inventory) return sum;
    const vehicleValue = vehicle.inventory.reduce((vSum, item) => {
      const product = products?.find(p => p.id === item.productId);
      return vSum + (product ? product.price * item.quantity : 0);
    }, 0);
    return sum + vehicleValue;
  }, 0) || 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRoutes = routes?.filter(r => r.date === todayStr) || [];
  const routeEmployeeIds = todayRoutes.map(r => r.employeeId);

  const totalRevenueToday = orders?.filter(o => {
    const orderDateStr = new Date(o.date).toISOString().split('T')[0];
    return orderDateStr === todayStr && o.courierId && routeEmployeeIds.includes(o.courierId);
  }).reduce((sum, o) => sum + o.totalAmount, 0) || 0;

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return 'مخطط';
      case 'in_progress': return 'قيد التنفيذ';
      case 'completed': return 'مكتمل';
      default: return status;
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal'] min-h-screen rounded-2xl animate-in fade-in duration-350" dir="rtl">
      <VanSalesHeader 
        onNewRouteClick={() => {
          setEditingRoute(null);
          setFormData({
            routeName: '',
            employeeId: 0,
            status: 'planned',
            stops: [],
            date: new Date().toISOString().split('T')[0]
          });
          setIsModalOpen(true);
        }}
      />

      <VanSalesStats 
        activeVehicles={activeVehicles}
        totalVehicles={totalVehicles}
        totalStopsToday={totalStopsToday}
        totalInventoryValue={totalInventoryValue}
        totalRevenueToday={totalRevenueToday}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col - Routes List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-indigo-100/30 p-5">
            <VanSalesToolbar 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
            />

            <VanSalesRoutesList 
              routes={filteredRoutes}
              users={users || []}
              vehicles={vehicles || []}
              customers={customers || []}
              getStatusText={getStatusText}
              onEdit={handleEdit}
              onDelete={confirmDeleteRoute}
            />
          </div>
        </div>

        {/* Right Col - Map Placeholder & Quick Actions */}
        <div className="space-y-6">
          <VanSalesMap />
          <VanSalesQuickActions 
            onManageVehicles={() => setIsVehiclesModalOpen(true)}
            onManageInventory={() => setIsInventoryModalOpen(true)}
          />
        </div>
      </div>

      {isModalOpen && (
        <VanSalesRouteModal 
          editingRoute={editingRoute}
          formData={formData}
          setFormData={setFormData}
          users={users || []}
          vehicles={vehicles || []}
          customers={customers || []}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}

      {isVehiclesModalOpen && (
        <VehiclesModal 
          onClose={() => setIsVehiclesModalOpen(false)}
          users={users || []}
        />
      )}

      {isInventoryModalOpen && (
        <VehicleInventoryModal 
          onClose={() => setIsInventoryModalOpen(false)}
          vehicles={vehicles || []}
        />
      )}

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title="حذف مسار مبيعات السيارات"
          message="هل أنت متأكد من حذف مسار مبيعات المندوب هذا نهائياً؟ لا يمكن استرجاع خط السير أو تفاصيله بعد الحذف."
          onConfirm={handleDelete}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default VanSales;
