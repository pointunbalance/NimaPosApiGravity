import React from "react";
import { format } from "date-fns";
import { FileText, LineChart, MessageCircle, Star } from "lucide-react";

interface BehaviorRecordCardProps {
  record: any;
  student: any;
  studentClass: any;
  typeMeta: any;
  updateStatus: (id: number, status: string) => void;
}

export const BehaviorRecordCard: React.FC<BehaviorRecordCardProps> = ({
  record,
  student,
  studentClass,
  typeMeta,
  updateStatus,
}) => {
  const Icon = typeMeta.icon;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col" dir="rtl">
      <div className="p-5 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${typeMeta.bg} ${typeMeta.color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg mb-0.5">
              {student?.name || "طالب غير معروف"}
            </h3>
            <p className="text-xs font-bold text-slate-500">
              {studentClass ? studentClass.name : "بدون فصل حالي"}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            {format(new Date(record.date), "yyyy-MM-dd")}
          </span>
          {record.recurrent && (
            <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
              سلوك متكرر
            </span>
          )}
        </div>
      </div>

      <div className="p-5 flex-1 space-y-4">
        <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${typeMeta.bg.replace("bg-", "bg-").replace("100", "500")}`}></span>
            <span className="font-bold text-slate-700 text-sm">{typeMeta.label}</span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded-md ${
              record.priority === "high"
                ? "bg-red-100 text-red-700"
                : record.priority === "medium"
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {record.priority === "high"
              ? "أولوية قصوى"
              : record.priority === "medium"
              ? "أولوية متوسطة"
              : "ملاحظة عادية"}
          </span>
        </div>

        {record.dailyNotes && (
          <div>
            <h4 className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3" /> الملاحظات اليومية:
            </h4>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">{record.dailyNotes}</p>
          </div>
        )}

        {record.modificationPlan && (
          <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
            <h4 className="text-xs font-bold text-indigo-400 mb-1 flex items-center gap-1">
              <LineChart className="w-3 h-3" /> خطة تعديل السلوك:
            </h4>
            <p className="text-sm font-medium text-indigo-900 leading-relaxed">{record.modificationPlan}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {record.teacherEvaluation && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 mb-1">تقييم المعلمة:</h4>
              <p className="text-xs font-medium text-slate-700">{record.teacherEvaluation}</p>
            </div>
          )}
          {record.specialistEvaluation && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 mb-1">تقييم الأخصائي:</h4>
              <p className="text-xs font-medium text-slate-700">{record.specialistEvaluation}</p>
            </div>
          )}
        </div>

        {record.parentMeetingDate && (
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" /> مقابلة ولي الأمر:
            </h4>
            <p className="text-xs font-bold text-slate-800 mb-1">
              بتاريخ {format(new Date(record.parentMeetingDate), "yyyy-MM-dd")}
            </p>
            {record.parentMeetingNotes && (
              <p className="text-xs font-medium text-slate-600">{record.parentMeetingNotes}</p>
            )}
          </div>
        )}

        {record.improvementResult && (
          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl mt-2">
            <h4 className="text-xs font-bold text-emerald-600 mb-1 flex items-center gap-1">
              <Star className="w-3 h-3" /> نتيجة التحسن:
            </h4>
            <p className="text-sm font-medium text-emerald-800">{record.improvementResult}</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <select
          value={record.status}
          onChange={(e) => updateStatus(record.id, e.target.value)}
          className={`w-full text-center text-sm font-bold py-2 rounded-xl outline-none focus:ring-2 ${
            record.status === "ongoing"
              ? "bg-amber-100 text-amber-700 focus:ring-amber-500 border border-amber-200"
              : record.status === "improved"
              ? "bg-emerald-100 text-emerald-700 focus:ring-emerald-500 border border-emerald-200"
              : "bg-slate-200 text-slate-700 focus:ring-slate-500 border border-slate-300"
          }`}
        >
          <option value="ongoing">⏳ المتابعة مستمرة</option>
          <option value="improved">🌟 تحسن ملموس</option>
          <option value="resolved">✅ تم الحل وإغلاق الملف</option>
        </select>
      </div>
    </div>
  );
};
export default BehaviorRecordCard;
