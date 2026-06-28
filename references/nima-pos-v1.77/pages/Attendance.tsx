import React, { useMemo, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import AttendanceHeader from '../components/attendance/AttendanceHeader';
import AttendanceStats from '../components/attendance/AttendanceStats';
import AttendanceControls from '../components/attendance/AttendanceControls';
import { AttendanceAnalytics } from '../components/attendance/AttendanceAnalytics';
import AttendanceTable from '../components/attendance/AttendanceTable';
import { useReactToPrint } from 'react-to-print';
import { X, Calendar as CalendarIcon, Clock3, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { AttendanceOfficialReport } from '../components/attendance/AttendanceOfficialReport';
import { useAttendanceData } from '../components/attendance/useAttendanceData';
import { useAttendanceActions } from '../components/attendance/useAttendanceActions';

interface AttendanceProps {
  department?: string;
  title?: string;
  subtitle?: string;
}

const Attendance: React.FC<AttendanceProps> = ({ department, title, subtitle }) => {
  const { showToast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const officialPrintRef = useRef<HTMLDivElement>(null);

  const data = useAttendanceData(department);
  const actions = useAttendanceActions(
    data.selectedDate,
    data.attendanceData,
    data.getUserActiveShift,
    data.labels,
    showToast
  );

  const handlePrintOfficial = useReactToPrint({
    contentRef: officialPrintRef,
    documentTitle: `كشف_الدوام_${department || 'الكل'}_${data.selectedDate}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 15mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `
  });

  // Stats calculation
  const stats = useMemo(() => {
    const total = data.users.filter(u => u.isActive).length;
    const present = data.attendances.filter(a => a.status === 'present').length;
    const late = data.attendances.filter(a => a.status === 'late').length;
    const excused = data.attendances.filter(a => a.status === 'excused').length;
    const absent = total - present - late - excused;

    return { total, present, late, excused, absent };
  }, [data.users, data.attendances]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> حاضر</span>;
      case 'absent':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1 w-fit"><XCircle size={12}/> غائب</span>;
      case 'late':
        return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs flex items-center gap-1 w-fit"><Clock3 size={12}/> متأخر</span>;
      case 'excused':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1 w-fit"><AlertCircle size={12}/> مجاز</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-800 rounded-full text-xs flex items-center gap-1 w-fit"><XCircle size={12}/> غير محدد</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-['Tajawal']" ref={printRef} dir="rtl">
      <div className="print:hidden">
        <AttendanceHeader 
          selectedDate={data.selectedDate} 
          setSelectedDate={data.setSelectedDate} 
          title={title}
          subtitle={subtitle}
        />
      </div>

      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">تقرير الحضور والانصراف</h1>
        <p className="text-center text-slate-500">التاريخ: {data.selectedDate}</p>
      </div>

      <div className="print:hidden pb-4">
        <AttendanceStats stats={stats} totalLabel={`إجمالي ${data.labels.employeeLabelPlural}`} />
        <AttendanceAnalytics stats={stats} department={department} selectedDate={data.selectedDate} />
      </div>

      <div className="pb-4">
        <AttendanceControls 
          searchTerm={data.searchTerm} 
          setSearchTerm={data.setSearchTerm} 
          statusFilter={data.statusFilter}
          setStatusFilter={data.setStatusFilter}
          onExport={actions.handleExport}
          onPrint={() => window.print()}
          onPrintOfficial={handlePrintOfficial}
          searchPlaceholder={`بحث عن ${data.labels.employeeLabel}...`}
        />
      </div>

      <AttendanceTable 
        attendanceData={data.attendanceData}
        handleStatusChange={actions.handleStatusChange}
        handleTimeChange={actions.handleTimeChange}
        handleNotesChange={actions.handleNotesChange}
        onViewHistory={data.setSelectedUser}
        employeeLabel={data.labels.employeeLabel}
        employeeRoleLabel={data.labels.employeeRoleLabel}
      />

      {/* History Modal */}
      {data.selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon className="text-brand-600" />
                سجل الحضور: {data.selectedUser.name}
              </h2>
              <button onClick={() => data.setSelectedUser(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              <table className="w-full text-right">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-4 text-slate-600 font-bold text-sm">التاريخ</th>
                    <th className="px-6 py-4 text-slate-600 font-bold text-sm">الحالة</th>
                    <th className="px-6 py-4 text-slate-600 font-bold text-sm">وقت الحضور</th>
                    <th className="px-6 py-4 text-slate-600 font-bold text-sm">وقت الانصراف</th>
                    <th className="px-6 py-4 text-slate-600 font-bold text-sm">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.userHistory && data.userHistory.length > 0 ? (
                    data.userHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-800 font-medium">
                          {record.date}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(record.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {record.checkInTime || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {record.checkOutTime || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {record.notes || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                        لا يوجد سجل حضور لهذا {data.labels.employeeLabel}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                onClick={() => data.setSelectedUser(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Official Report */}
      <AttendanceOfficialReport 
        ref={officialPrintRef}
        date={data.selectedDate}
        department={department}
        data={data.attendanceData}
        stats={stats}
      />
    </div>
  );
};

export default Attendance;
