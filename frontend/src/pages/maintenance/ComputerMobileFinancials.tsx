import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MaintenanceOrder, MaintenanceStatus } from '../../types';
import { 
  Monitor, Smartphone, Laptop, Tablet, Wrench, Search, AlertCircle, CheckCircle2, 
  Clock, X, Edit, Trash2, Printer, Plus, Cpu, HardDrive, Database, ShieldAlert, 
  Lock, DollarSign, UserCog, ClipboardList, Info, FileText, HelpCircle, Eye, RefreshCw,
  TrendingUp, BarChart3, Coins, Users, Award, Percent, Layers, Inbox, Scale, CheckCircle, Play, Droplets
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

const ComputerMobileFinancials: React.FC = () => {
  // Live queries from local database
  const orders = useLiveQuery(() => db.maintenanceOrders.toArray()) || [];
  const journalEntries = useLiveQuery(() => db.journalEntries.toArray()) || [];

  // Extract double entry ledger logs
  const departmentalReceipts = journalEntries.flatMap(entry => {
    const isPCMntc = entry.reference?.startsWith('PCMOB-MNTC-') || entry.reference?.startsWith('PRE-MNTC-');
    if (!isPCMntc) return [];
    return [{
      id: entry.id,
      date: entry.date,
      reference: entry.reference,
      description: entry.description,
      amount: entry.lines.reduce((max, l) => Math.max(max, l.debit, l.credit), 0)
    }];
  });

  return (
    <div className="p-6 select-none max-w-[1600px] mx-auto space-y-8 tech-circuit-bg min-h-screen text-slate-800 relative" dir="rtl" id="computer-mobile-maintenance-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@300;400;500;600;700;800;900&display=swap');

        #computer-mobile-maintenance-root {
          font-family: 'Tajawal', 'Cairo', sans-serif !important;
        }

        .tech-circuit-bg {
          background-color: #f8fafc !important;
          background-image: none !important;
        }

        #computer-mobile-maintenance-root .neu-pressed {
          background: #f1f5f9 !important;
          box-shadow: 
            inset 2px 2px 5px rgba(165, 180, 200, 0.08), 
            inset -2px -2px 5px rgba(255, 255, 255, 0.8) !important;
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
        }

        #computer-mobile-maintenance-root .neu-raised {
          background: #ffffff !important;
          box-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.02),
            0 4px 12px rgba(163, 177, 198, 0.06) !important;
          border: 1px solid rgba(241, 245, 249, 0.8) !important;
        }

        .neu-nav-item {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent !important;
        }

        .neu-nav-item:hover {
          transform: translateY(-1.5px);
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          color: #0f172a !important;
          box-shadow: 
            0 4px 12px rgba(148, 163, 184, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.01) !important;
        }

        #computer-mobile-maintenance-root .neu-nav-item-active {
          background: linear-gradient(102deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%) !important;
          color: #ffffff !important;
          border: 1px solid #2563eb !important;
          box-shadow: 
            0 10px 18px -3px rgba(37, 99, 235, 0.3), 
            0 4px 6px -4px rgba(37, 99, 235, 0.3),
            inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
          transform: translateY(-1.5px) scale(1.015);
        }
      `}</style>
      <Toaster position="top-left" reverseOrder={true} />

      {/* Header Banner */}
      <div className="bg-white p-8 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10 border border-slate-100 shadow-xs transition-all duration-300">
        <div className="space-y-3 text-right w-full font-sans">
          <div className="flex flex-wrap items-center gap-2.5 mb-1 bg-slate-50/50 p-1 rounded-full w-max border border-slate-100/50">
            <span className="px-3.5 py-1 text-[10px] font-black tracking-tight text-blue-755 bg-white border border-blue-100/80 rounded-full inline-flex items-center gap-1.5 shadow-3xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
              </span>
              قسم صيانة الإلكترونيات ورقاقة البورد المتقدمة
            </span>
            <span className="px-3 py-1 text-[10px] font-black text-slate-500 bg-transparent inline-flex items-center gap-1 select-none">
              المطابقة المحاسبية والضمانات الفنية 💻📱
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">اليومية والترحيل المالي المزدوج للورشة</h1>
              <p className="text-xs text-slate-500 font-medium">سجلات حركات الفحص المالي، ودفعات مقدم الصيانة المعالجة بالحسابات</p>
            </div>
          </div>
        </div>
      </div>



      {/* Financials SubPage Content */}
      <div className="space-y-6" id="mntc-financials-subpage">
        <div className="bg-sky-50/70 p-4.5 rounded-3xl border border-sky-100 flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-sky-600" />
            <div className="text-right">
              <span className="text-xs font-black text-sky-900 block">القيود التلقائية والتسويات لقسم الصيانة والقطع</span>
              <p className="text-[10px] text-slate-550 font-bold leading-normal">
                تنعكس مبيعات وعربونات الصيانة آليًا في حساب الصندوق والمصروفات، متوافقة فوريًا مع شجرة الحسابات والدفاتر العامة للشركة.
              </p>
            </div>
          </div>
          <div className="text-left font-sans">
            <span className="text-[10px] text-slate-400 block font-bold">إجمالي القيود المضافة</span>
            <span className="font-mono text-lg font-black text-sky-800">{departmentalReceipts.length} تسوية</span>
          </div>
        </div>

        {/* Table list */}
        {departmentalReceipts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/60 shadow-xs">
            <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Scale className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-850 mb-1">الدفاتر والقيود المحاسبية للقسم خالية</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto leading-normal">
              أكمل دورة صيانة أي حاسب أو هاتف وقم بتغيير حالته المالية إلى "تم التسليم" لإدراج القيود المزدوجة المتطابقة تلقائياً بالصناديق.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-xs overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-extrabold">
                  <th className="p-4 text-right">رأس القيد / Reference</th>
                  <th className="p-4 text-right">الوصف المحاسبي والتسوية</th>
                  <th className="p-4 text-center">التاريخ والوقت</th>
                  <th className="p-4 text-left rounded-tl-3xl">القيمة الحسابية المعتمدة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-sans font-bold">
                {departmentalReceipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-mono font-black text-slate-705">
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-800 border border-sky-200/60 rounded">
                        {rec.reference}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-slate-800">{rec.description}</td>
                    <td className="p-4 text-center text-slate-500 font-medium font-mono">{new Date(rec.date).toLocaleString('ar-EG')}</td>
                    <td className="p-4 text-left font-black font-mono text-emerald-700">+{rec.amount.toLocaleString()} ج.م</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComputerMobileFinancials;
