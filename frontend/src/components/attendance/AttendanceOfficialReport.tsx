import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import JsBarcode from 'jsbarcode';

interface AttendanceOfficialReportProps {
  date: string;
  department?: string;
  data: any[];
  stats: { total: number; present: number; late: number; excused: number; absent: number };
}

export const AttendanceOfficialReport = React.forwardRef<HTMLDivElement, AttendanceOfficialReportProps>(({ date, department, data, stats }, ref) => {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current) {
      // Generate a document ID
      const docId = `ATT-${date.replace(/-/g, '')}-${department?.toUpperCase() || 'ALL'}`;
      JsBarcode(barcodeRef.current, docId, {
        format: "CODE128",
        lineColor: "#0f172a",
        width: 1.5,
        height: 40,
        displayValue: true,
        fontSize: 12,
        font: "sans-serif",
      });
    }
  }, [date, department]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'حاضر';
      case 'absent': return 'غائب';
      case 'late': return 'متأخر';
      case 'excused': return 'مجاز';
      default: return 'غير محدد';
    }
  };

  return (
    <div className="hidden">
      <div ref={ref} className="p-8 bg-white text-slate-800" dir="rtl" style={{ fontFamily: "'Cairo', 'Tajawal', sans-serif" }}>
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black mb-1">نظام نيما لإدارة الموارد</h1>
            <h2 className="text-xl font-bold text-slate-600">كشف الحضور والانصراف الرسمي</h2>
            {department && <h3 className="text-lg text-slate-500 mt-1">القسم: {department}</h3>}
          </div>
          <div className="flex flex-col items-end">
            <div className="w-16 h-16 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-2xl mb-2">
              NIMA
            </div>
            <svg ref={barcodeRef}></svg>
          </div>
        </div>

        {/* Info & Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="space-y-2">
            <p className="text-sm border border-slate-200 p-2 rounded"><strong className="w-24 inline-block">التاريخ:</strong> {format(new Date(date), 'EEEE, d MMMM yyyy', { locale: arSA })}</p>
            <p className="text-sm border border-slate-200 p-2 rounded"><strong className="w-24 inline-block">وقت الطباعة:</strong> {format(new Date(), 'HH:mm:ss a')}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-center">
             <div className="bg-slate-100 p-2 rounded">
                 <p className="font-bold">إجمالي الموظفين</p>
                 <p className="text-lg">{stats.total}</p>
             </div>
             <div className="bg-emerald-50 text-emerald-800 p-2 rounded">
                 <p className="font-bold">حاضر</p>
                 <p className="text-lg">{stats.present}</p>
             </div>
             <div className="bg-amber-50 text-amber-800 p-2 rounded">
                 <p className="font-bold">متأخر</p>
                 <p className="text-lg">{stats.late}</p>
             </div>
             <div className="bg-rose-50 text-rose-800 p-2 rounded">
                 <p className="font-bold">غائب / أخرى</p>
                 <p className="text-lg">{stats.absent + stats.excused}</p>
             </div>
          </div>
        </div>

        {/* Dynamic Table */}
        <table className="w-full text-sm border-collapse mb-8 text-center text-slate-700">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="border border-slate-800 p-2 w-10">م</th>
              <th className="border border-slate-800 p-2 text-right">اسم الموظف</th>
              <th className="border border-slate-800 p-2 text-right">الوظيفة</th>
              <th className="border border-slate-800 p-2">حالة الدوام</th>
              <th className="border border-slate-800 p-2">وقت الدخول</th>
              <th className="border border-slate-800 p-2">وقت الخروج</th>
              <th className="border border-slate-800 p-2">التأخير/المبكر</th>
              <th className="border border-slate-800 p-2 w-32">التوقيع</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.user.id} className="even:bg-slate-50">
                <td className="border border-slate-300 p-2">{idx + 1}</td>
                <td className="border border-slate-300 p-2 text-right font-bold">{item.user.name}</td>
                <td className="border border-slate-300 p-2 text-right text-xs">{item.user.jobTitle || '-'}</td>
                <td className="border border-slate-300 p-2">{getStatusLabel(item.record.status)}</td>
                <td className="border border-slate-300 p-2" dir="ltr">{item.record.checkInTime || '---'}</td>
                <td className="border border-slate-300 p-2" dir="ltr">{item.record.checkOutTime || '---'}</td>
                <td className="border border-slate-300 p-2 text-xs">
                    {item.record.lateMinutes ? <div className="text-rose-600">تأخير: {item.record.lateMinutes} د</div> : ''}
                    {item.record.earlyLeaveMinutes ? <div className="text-rose-600">انصراف: {item.record.earlyLeaveMinutes} د</div> : ''}
                    {!item.record.lateMinutes && !item.record.earlyLeaveMinutes ? '-' : ''}
                </td>
                <td className="border border-slate-300 p-2 text-transparent">توقيع</td>
              </tr>
            ))}
            {data.length === 0 && (
               <tr><td colSpan={8} className="border border-slate-300 p-4 text-center">لا توجد بيانات حضور وانصراف</td></tr>
            )}
          </tbody>
        </table>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-16 text-center">
            <div>
               <div className="border-b border-slate-400 pb-2 mb-2 font-bold">إعداد الموارد البشرية</div>
               <div className="h-16"></div>
               <div className="text-sm text-slate-500">التوقيع: .....................</div>
            </div>
            <div>
               <div className="border-b border-slate-400 pb-2 mb-2 font-bold">المراجعة والتدقيق</div>
               <div className="h-16"></div>
               <div className="text-sm text-slate-500">التوقيع: .....................</div>
            </div>
            <div>
               <div className="border-b border-slate-400 pb-2 mb-2 font-bold">اعتماد الإدارة العُليا</div>
               <div className="h-16"></div>
               <div className="text-sm text-slate-500">التوقيع والختم</div>
            </div>
        </div>

        <div className="mt-12 text-center text-xs text-slate-400 font-mono">
           وثيقة صادرة وموثقة آلياً من نظام NIMA POS & ERP - مُحرم استخدامها بغير الأغراض الرسمية المخصصة لها.
        </div>
      </div>
    </div>
  );
});

AttendanceOfficialReport.displayName = 'AttendanceOfficialReport';
