import React from 'react';
import { Plus, Edit2, Trash2, Truck, Key, Users, MapPin } from 'lucide-react';
import { db } from '../../../db';

interface TransportRoutesTabProps {
  routes: any[];
  subscribers: any[];
  getStaffName: (id: number) => string;
  setRouteFormData: (val: any) => void;
  setRouteModalOpen: (val: boolean) => void;
}

export const TransportRoutesTab: React.FC<TransportRoutesTabProps> = ({
  routes,
  subscribers,
  getStaffName,
  setRouteFormData,
  setRouteModalOpen,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-800">خطوط الحافلات (Routes)</h2>
        <button
          onClick={() => {
            setRouteFormData({
              name: '',
              busNumber: '',
              driverId: 0,
              supervisorId: 0,
              capacity: 20,
              stops: '',
              status: 'active',
              monthlyCost: 0,
            });
            setRouteModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> إضافة خط جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map((r) => (
          <div
            key={r.id}
            className="border border-slate-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-md transition-all bg-white relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500"></div>
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-black text-lg text-slate-800 pr-2">{r.name}</h3>
              <span
                className={`px-2 py-1 rounded text-[10px] font-bold ${
                  r.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}
              >
                {r.status === 'active' ? 'نشط' : 'متوقف'}
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <p className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-400" /> اللوحة:{' '}
                <span className="font-bold text-slate-800" dir="ltr">
                  {r.busNumber}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-400" /> السائق:{' '}
                <span className="font-bold text-slate-800">{getStaffName(r.driverId)}</span>
              </p>
              <p className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" /> المشرفة:{' '}
                <span className="font-bold text-slate-800">{getStaffName(r.supervisorId)}</span>
              </p>
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" /> نقاط التجمع:{' '}
                <span className="font-medium flex-1">{r.stops}</span>
              </p>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                المشتركين: {subscribers.filter((s: any) => s.routeId === r.id).length} / {r.capacity}
              </p>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setRouteFormData(r);
                    setRouteModalOpen(true);
                  }}
                  className="p-1.5 bg-slate-100 text-indigo-600 rounded hover:bg-indigo-100 cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    if (confirm('متأكد؟')) {
                      await db.transportRoutes.delete(r.id!);
                    }
                  }}
                  className="p-1.5 bg-slate-100 text-rose-600 rounded hover:bg-rose-100 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {routes.length === 0 && (
          <div className="col-span-3 text-center p-12 text-slate-500 font-medium">
            لا يوجد خطوط باصات مسجلة
          </div>
        )}
      </div>
    </div>
  );
};
export default TransportRoutesTab;
