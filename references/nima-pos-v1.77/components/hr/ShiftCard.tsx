import React from 'react';
import { Clock, CheckCircle2, XCircle, Edit2, Trash2 } from 'lucide-react';
import { WorkShift } from '../../types';

interface ShiftCardProps {
  shift: WorkShift;
  onEdit: (shift: WorkShift) => void;
  onDeleteRequest: (shiftId: number) => void;
  daysOfWeek: string[];
}

export const ShiftCard: React.FC<ShiftCardProps> = ({
  shift,
  onEdit,
  onDeleteRequest,
  daysOfWeek,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className={`h-2 ${shift.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
      <div className="p-6 relative">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-lg text-slate-800">{shift.name}</h3>
          <div className="bg-slate-100 px-2 py-1 rounded-full flex items-center gap-1 text-xs font-semibold">
            {shift.isActive ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-700">مفعل</span>
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 text-slate-400" />
                <span className="text-slate-500">معطل</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4" /> توقيت الوردية:
            </span>
            <span className="font-bold text-slate-800" dir="ltr">
              {shift.startTime} - {shift.endTime}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">فترة التسامح (للتأخير):</span>
            <span className="font-semibold text-slate-700">
              {shift.gracePeriodMinutes || 0} دقيقة
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">أيام العطة:</span>
            <span className="font-semibold text-slate-700">
              {shift.daysOff && shift.daysOff.length > 0
                ? shift.daysOff.map((d) => daysOfWeek[d]).join(' و ')
                : 'لا يوجد'}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-auto">
          <button
            onClick={() => onEdit(shift)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="تعديل"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => shift.id && onDeleteRequest(shift.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            title="حذف"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
