import React from "react";
import { QrCode, ShieldCheck, ShieldAlert, UserCheck, CheckCircle2 } from "lucide-react";

interface PickupStudentCardProps {
  student: any;
  studentClass: any;
  studentPickups: any[];
  hasPickedUpToday: boolean;
  openPickupModal: (student: any) => void;
  openManageAuthModal: (student: any) => void;
}

export const PickupStudentCard: React.FC<PickupStudentCardProps> = ({
  student,
  studentClass,
  studentPickups,
  hasPickedUpToday,
  openPickupModal,
  openManageAuthModal,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      {hasPickedUpToday && (
        <div className="absolute top-0 right-0 left-0 bg-emerald-500 text-white text-xs font-bold text-center py-1 flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> تم تسليم الطفل اليوم
        </div>
      )}
      <div className={`flex items-start gap-4 ${hasPickedUpToday ? "mt-4" : ""}`}>
        <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
          <UserCheck className="w-8 h-8 text-slate-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-lg text-slate-800">{student.name}</h3>
          <p className="text-sm font-medium text-slate-500 mb-2">
            {studentClass ? studentClass.name : "بدون فصل"} • كود: {student.code || "N/A"}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              disabled={hasPickedUpToday}
              onClick={() => openPickupModal(student)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                hasPickedUpToday
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : studentPickups.length > 0
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                  : "bg-rose-100 text-rose-700 cursor-not-allowed"
              }`}
              title={
                studentPickups.length === 0 && !hasPickedUpToday
                  ? "يجب إضافة أشخاص مصرح لهم أولاً"
                  : ""
              }
            >
              <QrCode className="w-3.5 h-3.5" />
              {hasPickedUpToday ? "تم التسليم" : "تسليم الطفل"}
            </button>

            <button
              onClick={() => openManageAuthModal(student)}
              className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> المصرح لهم ({studentPickups.length})
            </button>
          </div>
          {studentPickups.length === 0 && !hasPickedUpToday && (
            <p className="text-xs text-rose-500 mt-2 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> لا يوجد أشخاص مصرح لهم
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PickupStudentCard;
