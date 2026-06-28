import React from 'react';
import { 
  Award, 
  Clock, 
  MapPin, 
  Coins, 
  UserCheck, 
  Edit2, 
  Trash2, 
  HelpCircle,
  Layers
} from 'lucide-react';
import { ClassType, CATEGORIES_OPTIONS } from './types';

interface ClassesTabGridProps {
  filteredRecords: ClassType[];
  currency: string;
  onSelectClass: (id: number) => void;
  onEditClass: (item: ClassType) => void;
  onDeleteClass: (id: number) => void;
}

export const ClassesTabGrid: React.FC<ClassesTabGridProps> = ({
  filteredRecords,
  currency,
  onSelectClass,
  onEditClass,
  onDeleteClass,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {filteredRecords.length === 0 ? (
        <div className="md:col-span-2 xl:col-span-3 bg-white border border-slate-150 p-12 text-center rounded-3xl flex flex-col items-center justify-center gap-3">
          <HelpCircle className="w-12 h-12 text-slate-300" />
          <div>
            <h3 className="text-base font-extrabold text-slate-700">لم يتم العثور على أي حصة رياضية جماعية</h3>
            <p className="text-xs text-slate-400 mt-1">يرجى تعديل خيارات البحث والتصفية أو النقر على "جدولة حصة جديدة" للبدء.</p>
          </div>
        </div>
      ) : (
        filteredRecords.map((item: ClassType) => {
          const attendees = Array.isArray(item.enrolledMembers) ? item.enrolledMembers : [];
          const placesLeft = Math.max(0, (item.capacity || 20) - attendees.length);
          const progressPct = Math.min(100, Math.round((attendees.length / (item.capacity || 20)) * 100));

          return (
            <div 
              key={item.id} 
              className={`bg-white rounded-2xl border transition-all p-5 hover:border-indigo-200 hover:shadow-md flex flex-col justify-between space-y-4 group relative ${
                item.status === 'معلقة' ? 'opacity-70 border-slate-200 border-dashed bg-slate-50/40' : 'border-slate-150'
              }`}
            >
              {/* Category badge */}
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700">
                  {item.category || 'لياقة عامة'}
                </span>

                <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                  item.status === 'معلقة' 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {item.status || 'نشطة'}
                </span>
              </div>

              {/* Core details */}
              <div className="space-y-2 text-right">
                <h3 className="text-base font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
                  {item.name}
                </h3>

                <div className="grid grid-cols-1 gap-1.5 pt-1 text-slate-500 text-xs">
                  <div className="flex items-center gap-1.5 justify-start">
                    <Award className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>المدرب: </span>
                    <strong className="text-slate-700 font-bold">{item.trainerId}</strong>
                  </div>

                  <div className="flex items-center gap-1.5 justify-start">
                    <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="truncate">{item.schedule}</span>
                  </div>

                  <div className="flex items-center gap-1.5 justify-start text-slate-400">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{item.room || 'الصالة الرئيسية'}</span>
                  </div>

                  {item.price && item.price > 0 ? (
                    <div className="flex items-center gap-1.5 justify-start text-amber-600 font-bold">
                      <Coins className="w-4 h-4 shrink-0" />
                      <span>رسوم حجز إضافية: {item.price} {currency}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 justify-start text-emerald-600 font-bold">
                      <Coins className="w-4 h-4 shrink-0" />
                      <span>دخول مجاني لأعضاء النادي</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Occupancy Indicator */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-right">
                <div className="flex justify-between text-[10px] font-black">
                  <span className="text-slate-400">نسبة حيازة المقاعد:</span>
                  <span className={placesLeft === 0 ? 'text-rose-500 font-mono' : 'text-slate-700 font-mono'}>
                    {attendees.length} مسجل / {item.capacity} الأقصى
                  </span>
                </div>

                <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      placesLeft === 0 
                        ? 'bg-rose-500' 
                        : progressPct >= 80 
                        ? 'bg-amber-400' 
                        : 'bg-indigo-500'
                    }`} 
                    style={{ width: `${progressPct}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                  <span>متبقي {placesLeft} مكان</span>
                  {placesLeft === 0 && <span className="text-rose-600 font-bold">مكتمل تماماً</span>}
                </div>
              </div>

              {/* Actions Drawer */}
              <div className="flex items-center justify-between border-t border-slate-150 pt-3 text-xs font-black">
                <button
                  type="button"
                  onClick={() => onSelectClass(item.id!)}
                  className="px-3.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>الحضور والمسجلين ({attendees.length})</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button 
                    type="button"
                    onClick={() => onEditClass(item)} 
                    className="p-2 text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-xl transition-all cursor-pointer"
                    title="تعديل الحصة"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => onDeleteClass(item.id!)} 
                    className="p-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-xl transition-all cursor-pointer"
                    title="حذف الجدول"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
