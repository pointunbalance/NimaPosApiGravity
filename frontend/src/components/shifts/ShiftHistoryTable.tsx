import React from 'react';
import { History, ArrowRight, AlertTriangle, Printer, Eye } from 'lucide-react';
import { Shift } from '../../types';

interface ShiftHistoryTableProps {
  shiftHistory: Shift[] | undefined;
  formatCurrency: (amount: number) => string;
  printZReport: (shift: Shift) => void;
  onViewDetails: (shift: Shift) => void;
  hasViewExpectedCashPermission: boolean;
}

const ShiftHistoryTable: React.FC<ShiftHistoryTableProps> = ({
  shiftHistory,
  formatCurrency,
  printZReport,
  onViewDetails,
  hasViewExpectedCashPermission
}) => {
  return (
    <div className="mt-12 print:mt-0">
        <h3 className="font-bold text-xl text-gray-800 mb-6 flex items-center gap-2 print:hidden">
            <History className="w-6 h-6 text-gray-400" />
            أرشيف الورديات
        </h3>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden print:border-2 print:border-black print:rounded-none print:shadow-none">
            <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-sm text-right print:min-w-full">
                    <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 print:bg-transparent print:border-b-2 print:border-black print:text-black">
                        <tr>
                            <th className="p-5">رقم الوردية</th>
                            <th className="p-5">التاريخ والوقت</th>
                            <th className="p-5">مبيعات نقدية</th>
                            {hasViewExpectedCashPermission && (
                                <th className="p-5">المتوقع بالدرج</th>
                            )}
                            <th className="p-5">العد الفعلي</th>
                            {hasViewExpectedCashPermission && (
                                <th className="p-5">العجز/الزيادة</th>
                            )}
                            <th className="p-5 print:hidden">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 print:divide-black">
                        {shiftHistory?.map(shift => {
                            const diff = shift.difference || 0;
                            return (
                                <tr key={shift.id} className="hover:bg-gray-50/80 transition-colors print:bg-transparent">
                                    <td className="p-5 font-mono font-bold text-gray-600 print:text-black">#{shift.id}</td>
                                    <td className="p-5 text-gray-600 print:text-black" dir="ltr">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-800 print:text-black">{new Date(shift.startTime).toLocaleDateString()}</span>
                                            <span className="text-xs text-gray-400 flex items-center gap-1 print:text-black">
                                                {new Date(shift.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                <ArrowRight className="w-3 h-3 print:hidden" />
                                                <span className="hidden print:inline">-</span>
                                                {shift.endTime ? new Date(shift.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '...'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5 font-bold text-emerald-600 print:text-black">+{formatCurrency(shift.cashSales)}</td>
                                    
                                    {hasViewExpectedCashPermission && (
                                        <td className="p-5 text-gray-500 font-medium print:text-black">{formatCurrency(shift.expectedCash)}</td>
                                    )}
                                    <td className="p-5 font-bold text-gray-800 bg-gray-50/50 print:bg-transparent print:text-black">{formatCurrency(shift.actualCash || 0)}</td>
                                    {hasViewExpectedCashPermission && (
                                        <td className="p-5">
                                            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 w-fit print:bg-transparent print:border-none print:p-0 print:text-black ${
                                                diff < 0 ? 'bg-red-50 text-red-700 border-red-100' : 
                                                diff > 0 ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                                'bg-green-50 text-green-700 border-green-100'
                                            }`}>
                                                {diff !== 0 && <AlertTriangle className="w-3 h-3 print:hidden" />}
                                                {formatCurrency(diff)}
                                            </span>
                                        </td>
                                    )}
                                    <td className="p-5 print:hidden">
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => onViewDetails(shift)}
                                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                title="عرض التفاصيل"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => printZReport(shift)}
                                                className="p-2 text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                                                title="إعادة طباعة التقرير"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {shiftHistory?.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-10 text-center text-gray-400 font-medium print:text-black">لا يوجد سجل ورديات سابقة</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default ShiftHistoryTable;
