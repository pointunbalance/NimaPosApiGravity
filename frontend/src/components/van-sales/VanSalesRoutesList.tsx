import React, { useState } from 'react';
import { Users, Edit, Trash2, Truck, MapPin, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { VanSalesRoute, User, Vehicle, Customer } from '../../types';

interface VanSalesRoutesListProps {
  routes: VanSalesRoute[];
  users: User[];
  vehicles: Vehicle[];
  customers: Customer[];
  getStatusText: (status: string) => string;
  onEdit: (route: VanSalesRoute) => void;
  onDelete: (id: number) => void;
}

const VanSalesRoutesList: React.FC<VanSalesRoutesListProps> = ({
  routes,
  users,
  vehicles,
  customers,
  getStatusText,
  onEdit,
  onDelete
}) => {
  const [expandedRouteId, setExpandedRouteId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedRouteId(expandedRouteId === id ? null : id);
  };

  return (
    <div className="space-y-3">
      {routes.map((route) => {
        const driver = users?.find(u => u.id === route.employeeId);
        const vehicle = vehicles?.find(v => v.id === route.vehicleId);
        const isExpanded = expandedRouteId === route.id;

        return (
          <div key={route.id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-300 transition-colors relative group bg-white">
            <div className="absolute top-2 left-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); window.print(); }} className="text-slate-600 hover:text-slate-900 bg-white p-1 rounded-md shadow-sm border border-slate-200" title="طباعة المسار">
                <Printer className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onEdit(route); }} className="text-indigo-600 hover:text-indigo-900 bg-white p-1 rounded-md shadow-sm border border-slate-200" title="تعديل">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); route.id && onDelete(route.id); }} className="text-red-600 hover:text-red-900 bg-white p-1 rounded-md shadow-sm border border-slate-200" title="حذف">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  {route.routeName}
                </h3>
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Users className="w-4 h-4 text-slate-400" /> {driver?.name || 'غير محدد'}
                  </p>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Truck className="w-4 h-4 text-slate-400" /> {vehicle ? `${vehicle.plateNumber} - ${vehicle.make}` : 'غير محدد'}
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                route.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                route.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {getStatusText(route.status)}
              </span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-sm text-slate-500">التاريخ: <span className="font-semibold text-slate-900">{route.date}</span></span>
              <button 
                onClick={() => route.id && toggleExpand(route.id)}
                className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1"
              >
                {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  نقاط التوقف ({route.stops?.length || 0})
                </h4>
                {route.stops && route.stops.length > 0 ? (
                  <ul className="space-y-2">
                    {route.stops.map((stopId, index) => {
                      const customer = customers?.find(c => c.id === stopId);
                      return (
                        <li key={`${route.id}-stop-${index}`} className="flex items-center gap-3 text-sm p-2 bg-slate-50 rounded-lg">
                          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{customer?.name || 'عميل غير معروف'}</p>
                            <p className="text-xs text-slate-500">{customer?.address || 'لا يوجد عنوان'}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-2 bg-slate-50 rounded-lg">لا توجد نقاط توقف محددة</p>
                )}
              </div>
            )}
          </div>
        );
      })}
      {routes.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          لا توجد مسارات مطابقة للبحث
        </div>
      )}
    </div>
  );
};

export default VanSalesRoutesList;
