import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db";
import { format } from "date-fns";
import { Search, Filter, ShieldCheck, Activity } from "lucide-react";

export const AuditTrail: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");

  const logs = useLiveQuery(() => db.auditLogs.reverse().toArray(), []) || [];

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = filterModule === "all" || log.module === filterModule;
    const matchesAction = filterAction === "all" || log.action === filterAction;
    return matchesSearch && matchesModule && matchesAction;
  });

  const getModuleLabel = (mod: string) => {
    switch (mod) {
      case "settings": return "الإعدادات";
      case "taxes": return "الضرائب والزكاة";
      case "fiscal_year": return "إقفال السنة";
      case "journal": return "القيود المحاسبية";
      case "einvoicing": return "الفاتورة الإلكترونية";
      default: return mod;
    }
  };

  const getActionLabel = (act: string) => {
    switch (act) {
      case "create": return "إنشاء";
      case "update": return "تعديل";
      case "delete": return "حذف";
      case "closing": return "إقفال";
      default: return act;
    }
  };

  const getActionColor = (act: string) => {
    switch (act) {
      case "create": return "bg-emerald-100 text-emerald-800";
      case "update": return "bg-blue-100 text-blue-800";
      case "delete": return "bg-red-100 text-red-800";
      case "closing": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <ShieldCheck className="w-6 h-6 text-indigo-600" />
             سجل المراجعة والتدقيق (Audit Trail)
           </h1>
           <p className="text-slate-500 mt-1">
             تتبع التغييرات الحساسة في العمليات المالية والضريبية لمنع التلاعب.
           </p>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 px-4 py-2 rounded-xl flex items-center gap-3">
            <Activity className="w-5 h-5" />
            <span className="font-bold">{logs.length} حركة مسجلة</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="بحث في التفاصيل أو المستخدم..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
           <Filter className="w-5 h-5 text-slate-400" />
           <select 
             value={filterModule}
             onChange={(e) => setFilterModule(e.target.value)}
             className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
           >
             <option value="all">كل الأقسام</option>
             <option value="journal">القيود المحاسبية</option>
             <option value="taxes">الضرائب والزكاة</option>
             <option value="fiscal_year">إقفال السنة المالي</option>
             <option value="einvoicing">الفاتورة الإلكترونية</option>
             <option value="settings">الإعدادات</option>
           </select>
           <select 
             value={filterAction}
             onChange={(e) => setFilterAction(e.target.value)}
             className="px-3 py-2 border border-slate-200 rounded-xl focus:outline-none"
           >
             <option value="all">كل الإجراءات</option>
             <option value="create">إنشاء</option>
             <option value="update">تعديل</option>
             <option value="delete">حذف</option>
             <option value="closing">إقفال</option>
           </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">التاريخ والوقت</th>
                <th className="px-6 py-4">المستخدم</th>
                <th className="px-6 py-4">القسم</th>
                <th className="px-6 py-4">الإجراء</th>
                <th className="px-6 py-4">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {filteredLogs.map(log => (
                 <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                   <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                     {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                   </td>
                   <td className="px-6 py-4 font-bold text-slate-700">
                     {log.userName || log.userId}
                   </td>
                   <td className="px-6 py-4 text-slate-600">
                     {getModuleLabel(log.module)}
                   </td>
                   <td className="px-6 py-4">
                     <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                       {getActionLabel(log.action)}
                     </span>
                   </td>
                   <td className="px-6 py-4 text-slate-600">
                     {log.details}
                   </td>
                 </tr>
               ))}
               
               {filteredLogs.length === 0 && (
                 <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        لا توجد سجلات مطابقة.
                    </td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
