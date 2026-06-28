import React from 'react';
import { InventoryCountSession } from '../../types';
import { ClipboardCheck, Boxes, Calendar, CheckCircle2, Clock, XCircle, FileText, Eye, Play } from 'lucide-react';

interface InventoryCountListProps {
  filteredSessions: InventoryCountSession[];
  getWarehouseName: (id: number) => string;
  onOpenSession: (session: InventoryCountSession) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return (
        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <FileText className="w-3 h-3" /> مسودة
        </span>
      );
    case 'in_progress':
      return (
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Play className="w-3 h-3" /> قيد التنفيذ
        </span>
      );
    case 'completed':
      return (
        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> مكتمل
        </span>
      );
    case 'cancelled':
      return (
        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <XCircle className="w-3 h-3" /> ملغي
        </span>
      );
    default:
      return null;
  }
};

const getCountTypeBadge = (type?: string) => {
  switch(type) {
    case 'spot':
      return <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">مفاجئ</span>;
    case 'cycle':
      return <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">دوري</span>;
    case 'comprehensive':
    default:
      return <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">شامل</span>;
  }
}

const InventoryCountList: React.FC<InventoryCountListProps> = ({
  filteredSessions,
  getWarehouseName,
  onOpenSession,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      {filteredSessions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-black tracking-wider">
                    INV-{session.id?.toString().padStart(4, '0')}
                  </div>
                  {getCountTypeBadge(session.countType)}
                </div>
                {getStatusBadge(session.status)}
              </div>

              <div className="mb-6">
                <p className="text-xs text-slate-400 font-bold mb-1 uppercase">المخزن</p>
                <p className="font-black text-slate-800 text-lg">
                  {getWarehouseName(session.warehouseId)}
                </p>
              </div>

              <div className="flex flex-col gap-2 text-sm text-slate-500 mb-6 font-medium">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      {new Date(session.date).toLocaleDateString('ar-EG')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Boxes className="w-4 h-4" />
                      {session.items.length} منتج
                    </div>
                </div>
                {session.status === 'completed' && (session.totalLoss !== undefined || session.totalGain !== undefined) && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-xs font-bold">
                        {session.totalLoss! > 0 && <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-md mb-1">عجز مالي: {session.totalLoss}</span>}
                        {session.totalGain! > 0 && <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">وفر مالي: {session.totalGain}</span>}
                    </div>
                )}
              </div>

              <button
                onClick={() => onOpenSession(session)}
                className="w-full py-3 bg-slate-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white "
              >
                {session.status === 'completed' || session.status === 'cancelled' ? (
                  <>
                    <Eye className="w-4 h-4" /> عرض التفاصيل
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> متابعة الجرد
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
            <ClipboardCheck className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-700 mb-2">لا توجد جلسات جرد</h3>
          <p className="text-slate-500 max-w-md text-center">
            لم يتم العثور على أي جلسات جرد مطابقة للبحث أو الفلتر الحالي.
          </p>
        </div>
      )}
    </div>
  );
};

export default InventoryCountList;
