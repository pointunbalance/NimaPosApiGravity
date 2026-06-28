import React from 'react';
import { 
  Star, 
  Phone, 
  Clock, 
  CalendarDays, 
  DollarSign, 
  Edit2, 
  Trash2, 
  Info 
} from 'lucide-react';
import { TrainerType } from './trainersTypes';

interface TrainersTabDirectoryProps {
  filteredTrainers: TrainerType[];
  classes: any[];
  currency: string;
  onSelectPayroll: (id: number) => void;
  onEdit: (item: TrainerType) => void;
  onDelete: (id: number) => void;
}

export const TrainersTabDirectory: React.FC<TrainersTabDirectoryProps> = ({
  filteredTrainers,
  classes,
  currency,
  onSelectPayroll,
  onEdit,
  onDelete
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 text-right" dir="rtl">
      {filteredTrainers.length === 0 ? (
        <div className="md:col-span-2 xl:col-span-3 bg-white border border-slate-200 p-12 text-center rounded-3xl flex flex-col items-center justify-center gap-3">
          <Info className="w-12 h-12 text-slate-300" />
          <div>
            <h3 className="text-base font-extrabold text-slate-700">لا يوجد مدربين في الدليل</h3>
            <p className="text-xs text-slate-400 mt-1">تأكد من تعديل خيارات البحث والبحث بالأصناف.</p>
          </div>
        </div>
      ) : (
        filteredTrainers.map((trObj: TrainerType) => {
          // Calculate specific values dynamically matching trainer classes
          const trainerClassesCount = classes.filter(c => c.trainerId === trObj.name).length;
          
          let currentEnrollments = 0;
          classes.filter(c => c.trainerId === trObj.name).forEach(c => {
            const attendees = Array.isArray(c.enrolledMembers) ? c.enrolledMembers : [];
            currentEnrollments += attendees.length;
          });

          return (
            <div 
               key={trObj.id} 
               className={`bg-white rounded-2xl border transition-all p-5 hover:border-indigo-200 hover:shadow-md flex flex-col justify-between space-y-4 relative ${
                 trObj.status === 'موقوف' ? 'opacity-70 bg-slate-50 border-dashed border-slate-200' : 'border-slate-200'
               }`}
            >
              
              {/* Rating / Status */}
              <div className="flex justify-between items-center bg-transparent">
                <span className="flex items-center gap-1 text-xs font-extrabold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{trObj.rating || 4.8}</span>
                </span>

                <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full ${
                  trObj.status === 'متاح' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : trObj.status === 'في إجازة'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {trObj.status || 'متاح'}
                </span>
              </div>

              {/* Core Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-row-reverse text-right">
                  {/* Avatar design */}
                  <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-lg font-black shrink-0 shadow-sm">
                    {trObj.name?.trim().split(' ').slice(1, 2)[0]?.charAt(0) || trObj.name?.charAt(0) || 'ك'}
                  </div>

                  <div className="truncate">
                    <h3 className="text-base font-black text-slate-800 truncate">{trObj.name}</h3>
                    <p className="text-[10px] text-indigo-600 font-bold truncate mt-0.5">{trObj.specialization}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {trObj.bio || 'لا توجد نبذة تفصيلية مضافة لهذا المدرب حالياً. افتح التعديل لإثراء الملفات.'}
                </p>

                {/* Meta items */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-slate-500 font-medium text-right">
                  <div className="flex items-center gap-1 leading-none justify-end">
                    <span className="font-mono">{trObj.phone || 'غير مسجل'}</span>
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1 leading-none justify-end">
                    <span className="truncate">{trObj.shift?.split(' ')[0] || 'مرن'}</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1 leading-none justify-end">
                    <span className="font-mono">{trObj.hireDate || 'غير مسجل'}</span>
                    <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1 leading-none font-bold text-slate-700 justify-end">
                    <span>الراتب: {trObj.baseSalary} {currency}</span>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </div>
                </div>
              </div>

              {/* Dynamic classes info stats */}
              <div className="border-t border-slate-100 pt-3 grid grid-cols-3 gap-1 text-center text-[10px] bg-slate-50/50 p-2 rounded-xl">
                <div>
                  <span className="block text-slate-400">حساب العمولات</span>
                  <strong className="text-emerald-600 font-black text-xs">
                    {trObj.commissionType === 'fixed_per_student' ? `${trObj.commissionValue}${currency}/فرد` : `${trObj.commissionValue}%`}
                  </strong>
                </div>
                <div>
                  <span className="block text-slate-400">المتدربين</span>
                  <strong className="text-indigo-650 font-black text-xs font-mono">{currentEnrollments} فرد</strong>
                </div>
                <div>
                  <span className="block text-slate-400">الحصص</span>
                  <strong className="text-slate-700 font-black text-xs font-mono">{trainerClassesCount} حصة</strong>
                </div>
              </div>

              {/* Actions bar */}
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <button
                  onClick={() => onSelectPayroll(trObj.id!)}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all font-black text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>صرف المستحقات والرواتب</span>
                </button>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => onEdit(trObj)} 
                    className="p-2 text-indigo-600 hover:bg-indigo-50 border border-slate-100 rounded-lg transition-all cursor-pointer"
                    title="تعديل المدرب"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => onDelete(trObj.id!)} 
                    className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg transition-all cursor-pointer"
                    title="حذف المدرب"
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
