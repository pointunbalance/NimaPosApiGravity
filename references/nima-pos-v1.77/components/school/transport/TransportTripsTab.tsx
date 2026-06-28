import React from 'react';
import { Bus, MapPin as MapPinIcon, Check, X } from 'lucide-react';

interface TransportTripsTabProps {
  trips: any[];
  subscribers: any[];
  logs: any[];
  getRouteName: (id: number) => string;
  getStudentName: (id: number) => string;
  setTripFormData: (val: any) => void;
  setTripModalOpen: (val: boolean) => void;
  handleCompleteTrip: (id: number) => void;
  handleStudentAction: (tripId: number, studentId: number, action: 'boarded' | 'dropped' | 'absent') => void;
}

export const TransportTripsTab: React.FC<TransportTripsTabProps> = ({
  trips,
  subscribers,
  logs,
  getRouteName,
  getStudentName,
  setTripFormData,
  setTripModalOpen,
  handleCompleteTrip,
  handleStudentAction,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-emerald-900">الرحلات وحالة التوصيل الفعلي</h2>
          <p className="text-sm text-emerald-600 font-medium mt-1">
            تطبق هذه الشاشة للمشرفة لمتابعة الصعود والنزول من الموبايل.
          </p>
        </div>
        <button
          onClick={() => {
            setTripFormData({
              routeId: 0,
              date: new Date().toISOString().split('T')[0],
              direction: 'to_school',
              status: 'in_progress',
            });
            setTripModalOpen(true);
          }}
          className="bg-emerald-600 text-white px-5 py-3 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg shadow-emerald-500/30 cursor-pointer"
        >
          <Bus className="w-5 h-5 animate-pulse" /> بدء رحلة جديدة الآن
        </button>
      </div>

      <div className="space-y-6 max-w-5xl mx-auto">
        {trips
          .filter((t) => t.status === 'in_progress')
          .map((trip) => {
            const tripSubs = subscribers.filter(
              (s) =>
                s.routeId === trip.routeId &&
                (s.type === 'both' ||
                  (s.type === 'morning' && trip.direction === 'to_school') ||
                  (s.type === 'afternoon' && trip.direction === 'to_home'))
            );

            return (
              <div
                key={trip.id}
                className="bg-emerald-50/30 border border-emerald-200 rounded-3xl overflow-hidden shadow-sm"
              >
                <div className="bg-emerald-600 p-5 flex flex-col md:flex-row justify-between items-start md:items-center text-white gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                      <Bus className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl mb-1">{getRouteName(trip.routeId)}</h3>
                      <p className="text-emerald-100 font-medium text-sm flex gap-3">
                        <span>
                          اتجاه الرحلة: {trip.direction === 'to_school' ? 'تجميع صباحي' : 'توزيع مسائي'}
                        </span>
                        <span>|</span>
                        <span>{trip.date}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCompleteTrip(trip.id!)}
                    className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-black text-sm hover:scale-105 transition-transform shadow-md cursor-pointer"
                  >
                    أنهِ الرحلة 🏁
                  </button>
                </div>
                <div className="p-0">
                  <table className="w-full text-sm text-right">
                    <thead>
                      <tr className="bg-emerald-50 text-emerald-800 font-bold border-b border-emerald-200">
                        <th className="py-4 px-6">الطالب</th>
                        <th className="py-4 px-6">نقطة التجمع</th>
                        <th className="py-4 px-6 w-40">الحالة</th>
                        <th className="py-4 px-6 text-left w-48">إجراءات المشرفة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100/50 bg-white">
                      {tripSubs.map((sub) => {
                        const log = logs.find((l) => l.tripId === trip.id && l.studentId === sub.studentId);
                        return (
                          <tr key={sub.id} className="hover:bg-emerald-50/50 transition-colors">
                            <td className="py-4 px-6 font-black text-slate-800 text-base">
                              {getStudentName(sub.studentId)}
                            </td>
                            <td className="py-4 px-6 font-medium text-slate-600">{sub.stopName || '-'}</td>
                            <td className="py-4 px-6">
                              {!log ? (
                                <span className="text-slate-400 font-bold border border-slate-200 px-2 py-1 rounded-md text-xs">
                                  في الانتظار..
                                </span>
                              ) : log.action === 'boarded' ? (
                                <span className="text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md font-bold text-xs">
                                  صعد للحافلة 🚌
                                </span>
                              ) : log.action === 'dropped' ? (
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md font-bold text-xs">
                                  وصل المنزل ✔️
                                </span>
                              ) : (
                                <span className="text-rose-700 bg-rose-50 px-2 py-1 rounded-md font-bold text-xs">
                                  غائب ❌
                                </span>
                              )}
                              {log?.time && (
                                <span className="block text-[10px] text-slate-400 mt-1">{log.time}</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-left">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleStudentAction(trip.id!, sub.studentId, 'boarded')}
                                  className={`p-3 rounded-xl font-bold transition-all shadow-sm cursor-pointer ${
                                    log?.action === 'boarded'
                                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 scale-105'
                                      : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 border border-slate-200'
                                  }`}
                                  title="صعد للباص"
                                >
                                  <MapPinIcon className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleStudentAction(trip.id!, sub.studentId, 'dropped')}
                                  className={`p-3 rounded-xl font-bold transition-all shadow-sm cursor-pointer ${
                                    log?.action === 'dropped'
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 scale-105'
                                      : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 border border-slate-200'
                                  }`}
                                  title="تم التوصيل"
                                >
                                  <Check className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleStudentAction(trip.id!, sub.studentId, 'absent')}
                                  className={`p-3 rounded-xl font-bold transition-all shadow-sm cursor-pointer ${
                                    log?.action === 'absent'
                                      ? 'bg-rose-600 text-white hover:bg-rose-700 scale-105'
                                      : 'bg-slate-100 text-slate-600 hover:bg-rose-50 border border-slate-200'
                                  }`}
                                  title="غائب"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        {trips.filter((t) => t.status === 'in_progress').length === 0 && (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 text-slate-500 font-bold p-12 text-center rounded-3xl">
            لا توجد رحلات جارية حالياً.
          </div>
        )}
      </div>

      <h3 className="text-lg font-black text-slate-800 mt-12 mb-4">سجل الرحلات السابقة (المنتهية)</h3>
      <div className="overflow-x-auto border border-slate-200 rounded-2xl max-w-5xl mx-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
            <tr>
              <th className="p-4">التاريخ</th>
              <th className="p-4">الخط</th>
              <th className="p-4">اتجاه الرحلة</th>
              <th className="p-4">عدد من صعدوا</th>
              <th className="p-4">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white text-slate-700 font-medium">
            {trips
              .filter((t) => t.status === 'completed')
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-slate-500">{trip.date}</td>
                  <td className="p-4 font-bold text-slate-800">{getRouteName(trip.routeId)}</td>
                  <td className="p-4">
                    {trip.direction === 'to_school' ? 'للمدرسة (صباحي)' : 'للمنزل (مسائي)'}
                  </td>
                  <td className="p-4 font-bold text-indigo-600">
                    {logs.filter((l) => l.tripId === trip.id && l.action === 'boarded').length} طالب
                  </td>
                  <td className="p-4">
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                      مكتملة
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default TransportTripsTab;
