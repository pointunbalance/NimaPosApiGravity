import React from 'react';
import { 
  Search, 
  Plus, 
  HelpCircle, 
  Phone, 
  Tag, 
  AlertCircle, 
  Edit2, 
  Trash2 
} from 'lucide-react';
import { MembershipType } from './membershipsTypes';

interface MembershipsTabRecordsProps {
  records: any[];
  search: string;
  setSearch: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  filteredRecords: any[];
  isExpiringSoon: (endDateStr: string, status: string) => boolean;
  currency: string;
  onOpenModal: (editMode: boolean, item?: any) => void;
  onAskDelete: (id: number) => void;
}

export const MembershipsTabRecords: React.FC<MembershipsTabRecordsProps> = ({
  records,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  filteredRecords,
  isExpiringSoon,
  currency,
  onOpenModal,
  onAskDelete
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-right" dir="rtl">
      
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Quick search input */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="البحث باسم المشترك، الهاتف، أو باقة التدريب..." 
            className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium transition-colors text-right"
          />
        </div>

        {/* Status pills selector */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 self-start lg:self-auto text-xs font-bold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white shadow text-slate-900 border border-slate-200/50' : 'text-slate-500 hover:text-slate-950'}`}
          >
            الكل ({records.length})
          </button>
          <button
            onClick={() => setStatusFilter('فعال')}
            className={`px-4 py-2 rounded-lg transition-all ${statusFilter === 'فعال' ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 hover:text-emerald-600'}`}
          >
            النشطة ({records.filter(r => r.status === 'فعال').length})
          </button>
          <button
            onClick={() => setStatusFilter('expiring')}
            className={`px-4 py-2 rounded-lg transition-all ${statusFilter === 'expiring' ? 'bg-amber-500 text-white shadow' : 'text-slate-500 hover:text-amber-500'}`}
          >
            الاقتراب من الانتهاء ({records.filter(r => isExpiringSoon(r.endDate, r.status)).length})
          </button>
          <button
            onClick={() => setStatusFilter('منتهي')}
            className={`px-4 py-2 rounded-lg transition-all ${statusFilter === 'منتهي' ? 'bg-rose-500 text-white shadow' : 'text-slate-500 hover:text-rose-600'}`}
          >
            المنتهية ({records.filter(r => r.status === 'منتهي').length})
          </button>
        </div>

        <button 
          onClick={() => onOpenModal(false)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl flex items-center gap-2 font-bold shadow transition-all shrink-0 justify-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>اشتراك جديد</span>
        </button>

      </div>

      {/* List display */}
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="bg-slate-50/55 border-b border-slate-100 text-slate-500 text-xs font-black">
              <th className="px-6 py-4.5">معرف</th>
              <th className="px-6 py-4.5">المشترك</th>
              <th className="px-6 py-4.5">الباقة المختارة</th>
              <th className="px-6 py-4.5">وسيلة السداد والرسوم</th>
              <th className="px-6 py-4.5">تاريخ البدء</th>
              <th className="px-6 py-4.5">تاريخ الانتهاء والتحذيرات</th>
              <th className="px-6 py-4.5 text-center">أيام الصلاحية</th>
              <th className="px-6 py-4.5 text-center">الحالة</th>
              <th className="px-6 py-4.5 text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <HelpCircle className="w-10 h-10 text-slate-300" />
                    <div>
                      <p className="font-bold text-slate-600">لم يتم العثور على أي باقات مطابقة للاشتراك</p>
                      <p className="text-xs text-slate-400 mt-1">يرجى تعديل خيارات التصفية أو تسجيل اشتراك عضو جديد.</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRecords.map((item: any) => {
                const end = new Date(item.endDate);
                const now = new Date();
                const isExpiring = isExpiringSoon(item.endDate, item.status);
                const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const progressPct = daysLeft > 0 ? Math.min(100, Math.max(0, (daysLeft / 30) * 100)) : 0;

                return (
                  <tr key={item.id} className="hover:bg-indigo-50/10 transition-colors">
                    <td className="px-6 py-4.5 font-mono text-slate-400 text-xs font-bold">#{item.id}</td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-extrabold text-sm border border-slate-200">
                          {item.memberId?.charAt(0) || 'ع'}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{item.memberId}</div>
                          {item.phone && (
                            <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{item.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="font-bold text-slate-700">{item.plan}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div>
                        <span className="font-extrabold text-slate-800 font-mono">{(Number(item.price) || 0).toLocaleString()}</span>
                        <span className="text-xs text-slate-400 mr-1">{currency}</span>
                      </div>
                      {item.paymentMethod && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                          💳 {item.paymentMethod}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4.5 font-mono text-xs text-slate-500">
                      {item.startDate}
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="space-y-1">
                        <div className="font-mono text-xs text-slate-500">{item.endDate}</div>
                        {isExpiring && (
                          <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-1 border border-amber-100">
                            <AlertCircle className="w-3 h-3" />
                            أوشك على الانتهاء
                          </span>
                        )}
                        {item.status === 'منتهي' && (
                          <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded-md font-bold inline-flex items-center gap-0.5 border border-red-100 text-center">
                            🚫 منتهي
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      {item.status === 'منتهي' ? (
                        <span className="text-xs text-rose-500 font-bold">منتهي</span>
                      ) : daysLeft < 0 ? (
                        <span className="text-xs text-red-500 font-bold font-mono">متجاوز {Math.abs(daysLeft)} يوم</span>
                      ) : (
                        <div className="inline-block w-24">
                          <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1 font-mono">
                            <span>متبقي: {daysLeft} يوم</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full ${isExpiring ? 'bg-amber-400' : 'bg-emerald-500'}`} 
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                        item.status === 'فعال' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : item.status === 'معلق' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-center">
                      <div className="flex justify-center items-center gap-1.5">
                        <button 
                          onClick={() => onOpenModal(true, item)} 
                          className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onAskDelete(item.id)} 
                          className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
