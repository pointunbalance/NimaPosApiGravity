import React from 'react';
import { X, MapPin, Bus } from 'lucide-react';

interface SchoolTripModalProps {
  tripModalOpen: boolean;
  setTripModalOpen: (val: boolean) => void;
  handleStartTrip: (e: any) => void;
  tripFormData: any;
  setTripFormData: (val: any) => void;
  routes: any[];
}

export const SchoolTripModal: React.FC<SchoolTripModalProps> = (props) => {
  const {
    tripModalOpen,
    setTripModalOpen,
    handleStartTrip,
    tripFormData,
    setTripFormData,
    routes,
  } = props;
  if (!tripModalOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200 border-2 border-emerald-500">
        <div className="p-6 border-b border-emerald-100 flex justify-between items-center bg-emerald-50">
          <h3 className="text-xl font-black text-emerald-900 flex items-center gap-2">
            <Bus className="w-6 h-6" /> بدء رحلة باص
          </h3>
          <button
            onClick={() => setTripModalOpen(false)}
            type="button"
            className="text-emerald-700 hover:text-rose-500 bg-white p-1 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleStartTrip} className="p-6 space-y-4 text-sm">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">الخط الذي سينطلق</label>
            <select
              required
              value={tripFormData.routeId}
              onChange={(e) => setTripFormData({ ...tripFormData, routeId: Number(e.target.value) })}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-slate-700"
            >
              <option value={0} disabled>
                -- اختر --
              </option>
              {routes
                .filter((r) => r.status === 'active')
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">اتجاه الرحلة</label>
            <select
              value={tripFormData.direction}
              onChange={(e) => setTripFormData({ ...tripFormData, direction: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold text-emerald-700 text-center"
            >
              <option value="to_school">وصول للحضانة (تجميع صباحي)</option>
              <option value="to_home">خروج للمنازل (توزيع مسائي)</option>
            </select>
          </div>
          <div className="pt-6">
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white p-4 rounded-xl font-black text-lg hover:bg-emerald-700 flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/40 hover:scale-105 transition-all"
            >
              <Bus className="w-6 h-6" /> انطلاق الرحلة الآن
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SchoolTripModal;
