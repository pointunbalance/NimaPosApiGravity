import React from 'react';
import {
  Phone,
  Calendar,
  UserPlus,
  Search,
  HeartHandshake,
  Megaphone,
  History,
  ArrowLeftRight,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';

interface AdmissionRequestCardProps {
  request: any;
  STATUSES: any;
  levels: any[];
  employees: any[];
  crmLogs: any[];
  setSelectedRequest: (req: any) => void;
  setIsFollowupModalOpen: (open: boolean) => void;
  convertToStudent: (req: any) => void;
  updateRejection: (id: number, reason: string) => void;
  updateStatus: (id: number, status: string) => void;
  handleDelete: (id: number) => void;
}

export const AdmissionRequestCard: React.FC<AdmissionRequestCardProps> = ({
  request,
  STATUSES,
  levels,
  employees,
  crmLogs,
  setSelectedRequest,
  setIsFollowupModalOpen,
  convertToStudent,
  updateRejection,
  updateStatus,
  handleDelete,
}) => {
  const statusMeta = STATUSES[request.status as keyof typeof STATUSES] || STATUSES.new;
  const StatusIcon = statusMeta.icon;
  const level = levels.find((l) => l.id === Number(request.requestedLevelId));
  const assignedEmp = employees.find((emp) => emp.id === Number(request.assignedTo));
  const reqLogs = crmLogs.filter((log) => log.requestId === request.id);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
      <div className={`p-5 border-b flex justify-between items-start ${statusMeta.bg} ${statusMeta.border} bg-opacity-30 relative`}>
        {request.campaign && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/70 backdrop-blur text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-bold border border-indigo-200">
            <Megaphone className="w-3 h-3" /> {request.campaign}
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl bg-white shadow-sm flex items-center justify-center ${statusMeta.color}`}>
            <StatusIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-xl text-slate-800 mb-1">
              {request.childName}{' '}
              <span className="text-sm font-bold text-slate-500 ml-2">
                ({request.childAge} سنوات)
              </span>
            </h3>
            <p className="text-sm font-bold text-slate-600 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-slate-400" /> ولي الأمر: {request.parentName}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
            {statusMeta.label}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400">رقم التواصل</div>
              <div className="text-xs font-bold text-slate-800 font-mono" dir="ltr">
                {request.phone}
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400">المستوى المطلوب</div>
              <div className="text-xs font-bold text-slate-800">{level ? level.name : 'غير محدد'}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400">تاريخ الزيارة/المقابلة</div>
              <div className="text-xs font-bold text-slate-800">
                {request.visitDate ? format(new Date(request.visitDate), 'yyyy-MM-dd') : 'لم يحدد'}
              </div>
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-sky-100 text-sky-600 rounded-lg">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400">المصدر والمسؤول</div>
              <div className="text-xs font-bold text-slate-800">
                {request.leadSource} • {assignedEmp ? assignedEmp.name.split(' ')[0] : 'لا يوجد'}
              </div>
            </div>
          </div>
        </div>

        {request.status === 'rejected' && (
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex flex-col gap-1">
            <label className="text-[10px] font-bold text-rose-500">سبب إلغاء التسجيل:</label>
            <input
              type="text"
              value={request.rejectionReason || ''}
              onChange={(e) => updateRejection(request.id, e.target.value)}
              placeholder="اكتب سبب الرفض/عدم التسجيل..."
              className="bg-white border border-rose-200 rounded p-1 text-sm outline-none w-full text-slate-700"
            />
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={() => {
              setSelectedRequest(request);
              setIsFollowupModalOpen(true);
            }}
            className="w-full bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-sm font-bold py-2 rounded-xl transition flex items-center justify-center gap-2"
          >
            <History className="w-4 h-4" /> سجل المتابعات ({reqLogs.length})
          </button>
        </div>
        {request.status !== 'registered' && (
          <button
            onClick={() => convertToStudent(request)}
            className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm font-bold py-2 rounded-xl transition flex items-center justify-center gap-2"
          >
            <ArrowLeftRight className="w-4 h-4" /> تحويل إلى طفل مسجل بالنظام
          </button>
        )}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3 justify-between">
        <div className="flex-1 flex gap-2 overflow-x-auto custom-scrollbar pb-1">
          <select
            value={request.status}
            onChange={(e) => updateStatus(request.id, e.target.value)}
            className="px-3 py-1.5 text-sm font-bold rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white min-w-[140px] text-slate-700"
          >
            <option value="new">🆕 جديد لم يتم التواصل</option>
            <option value="contacted">📞 تم التواصل هاتفياً</option>
            <option value="no_answer">⏳ لم يرد</option>
            <option value="visit_scheduled">📅 موعد زيارة محدد</option>
            <option value="accepted">✅ تم القبول وفي انتظار رسوم</option>
            <option value="rejected">❌ مرفوض/ملغي</option>
            <option value="registered" disabled>
              📝 مسجل رسميًا
            </option>
          </select>
        </div>
        <button
          onClick={() => handleDelete(request.id)}
          className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition-colors border border-rose-100"
          title="حذف الطلب"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
