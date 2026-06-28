import React from 'react';
import { 
  Search, CheckCircle2, FileText, PlusCircle, MinusCircle, 
  CreditCard, Coins, Printer, History, DollarSign, Download 
} from 'lucide-react';
import { User } from '../../types';

interface PayrollTableProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredUsers: User[];
  processedUsers: Set<number>;
  bonuses: Record<number, number>;
  deductions: Record<number, number>;
  daysWorked: Record<number, number>;
  notes: Record<number, string>;
  handleValueChange: (userId: number, type: 'bonus' | 'deduction' | 'days', value: string) => void;
  handleBaseSalaryChange: (userId: number, value: string) => void;
  setNotes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  togglePaymentMethod: (user: User) => void;
  calculateNetSalary: (user: User) => number;
  calculateSalaryDetails: any;
  isProcessingAll: boolean;
  processAllSalaries: () => void;
  processSalary: (user: User) => void;
  processingId: number | null;
  printSlip: any;
  setHistoryUser: (user: User) => void;
  formatCurrency: (amount: number) => string;
  handleExportCSV: () => void;
}

const PayrollTable: React.FC<PayrollTableProps> = ({
  searchTerm,
  setSearchTerm,
  filteredUsers,
  processedUsers,
  bonuses,
  deductions,
  daysWorked,
  notes,
  handleValueChange,
  handleBaseSalaryChange,
  setNotes,
  togglePaymentMethod,
  calculateNetSalary,
  calculateSalaryDetails,
  isProcessingAll,
  processAllSalaries,
  processSalary,
  processingId,
  printSlip,
  setHistoryUser,
  formatCurrency,
  handleExportCSV
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col print:border-none print:shadow-none">
      {/* Toolbar */}
      <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 print:hidden">
          <div className="relative w-full md:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="بحث عن موظف..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-slate-800"
              />
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <button 
                onClick={processAllSalaries} 
                disabled={isProcessingAll || filteredUsers.filter(u => !processedUsers.has(u.id!) && calculateNetSalary(u) > 0).length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
              >
                  {isProcessingAll ? 'جاري الصرف...' : <><CheckCircle2 className="w-4 h-4" /> صرف الكل</>}
              </button>
              <button 
                onClick={handleExportCSV} 
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
              >
                  <Download className="w-4 h-4" /> تصدير
              </button>
              <button 
                onClick={() => window.print()} 
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors"
              >
                  <FileText className="w-4 h-4" /> تقرير
              </button>
          </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                      <th className="p-4 w-56">الموظف</th>
                      <th className="p-4 w-28">الراتب (عقد)</th>
                      <th className="p-4 w-24">الأيام</th>
                      <th className="p-4 w-32">مكافآت</th>
                      <th className="p-4 w-32">خصومات</th>
                      <th className="p-4 w-40">ملاحظات</th>
                      <th className="p-4 w-28">طريقة الدفع</th>
                      <th className="p-4 w-32 bg-indigo-50/50 text-indigo-700">الصافي</th>
                      <th className="p-4 w-36 text-center print:hidden">الحالة / الإجراء</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                      <tr><td colSpan={9} className="p-8 text-center text-slate-400">لا يوجد موظفين للعرض</td></tr>
                  ) : (
                      filteredUsers.map(user => {
                          const isProcessed = processedUsers.has(user.id!);
                          const baseSalary = user.baseSalary || 0;
                          const bonus = bonuses[user.id!] || 0;
                          const deduction = deductions[user.id!] || 0;
                          const days = daysWorked[user.id!] !== undefined ? daysWorked[user.id!] : 30;
                          const payMethod = user.paymentMethod || 'cash';
                          
                          const net = calculateNetSalary(user);
                          const isProcessingUser = processingId === user.id;

                          return (
                          <tr key={user.id} className={`hover:bg-slate-50 transition-colors group ${isProcessed ? 'bg-emerald-50/30' : ''}`}>
                                  <td className="p-4">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${isProcessed ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                                              {user.name.substring(0, 1)}
                                          </div>
                                          <div>
                                              <div className="font-bold text-slate-800">{user.name}</div>
                                              <div className="text-xs text-slate-500">{user.jobTitle || user.role}</div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="p-4">
                                      <input 
                                        type="number" onFocus={(e) => e.target.select()} 
                                        className="w-20 p-2 bg-white border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 print:border-none print:bg-transparent print:p-0 print:w-auto"
                                        placeholder="0"
                                        value={user.baseSalary || ''}
                                        onChange={(e) => handleBaseSalaryChange(user.id!, e.target.value)}
                                        disabled={isProcessed}
                                      />
                                  </td>
                                  <td className="p-4">
                                      <div className="relative">
                                          <input 
                                            type="number" onFocus={(e) => e.target.select()} 
                                            className="w-16 p-2 bg-white border border-slate-200 rounded-lg text-center font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 print:border-none print:bg-transparent print:p-0 print:w-auto"
                                            min="0" max="31"
                                            value={days}
                                            onChange={(e) => handleValueChange(user.id!, 'days', e.target.value)}
                                            disabled={isProcessed}
                                          />
                                          <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold print:hidden">يوم</span>
                                      </div>
                                  </td>
                                  <td className="p-4">
                                      <div className="relative">
                                          <PlusCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none print:hidden" />
                                          <input 
                                            type="number" onFocus={(e) => e.target.select()} 
                                            className="w-24 pr-8 pl-2 py-2 bg-white border border-emerald-200 rounded-lg text-emerald-700 font-bold outline-none focus:ring-2 focus:ring-emerald-500 print:border-none print:bg-transparent print:p-0 print:w-auto print:text-slate-800"
                                            placeholder="0"
                                            value={bonus || ''}
                                            onChange={(e) => handleValueChange(user.id!, 'bonus', e.target.value)}
                                            disabled={isProcessed}
                                          />
                                      </div>
                                  </td>
                                  <td className="p-4">
                                      <div className="relative">
                                          <MinusCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500 pointer-events-none print:hidden" />
                                          <input 
                                            type="number" onFocus={(e) => e.target.select()} 
                                            className="w-24 pr-8 pl-2 py-2 bg-white border border-red-200 rounded-lg text-red-700 font-bold outline-none focus:ring-2 focus:ring-red-500 print:border-none print:bg-transparent print:p-0 print:w-auto print:text-slate-800"
                                            placeholder="0"
                                            value={deduction || ''}
                                            onChange={(e) => handleValueChange(user.id!, 'deduction', e.target.value)}
                                            disabled={isProcessed}
                                          />
                                      </div>
                                  </td>
                                  <td className="p-4">
                                      <input 
                                        type="text"
                                        className="w-32 p-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 print:border-none print:bg-transparent print:p-0 print:w-auto"
                                        placeholder="سبب الخصم/المكافأة"
                                        value={notes[user.id!] || ''}
                                        onChange={(e) => setNotes(prev => ({...prev, [user.id!]: e.target.value}))}
                                        disabled={isProcessed}
                                      />
                                  </td>
                                  <td className="p-4">
                                      <button 
                                        onClick={() => togglePaymentMethod(user)} 
                                        disabled={isProcessed}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all print:border-none print:bg-transparent print:p-0 print:text-slate-800 ${
                                            payMethod === 'bank' 
                                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                            : 'bg-slate-50 text-slate-700 border-slate-200'
                                        }`}
                                      >
                                          {payMethod === 'bank' ? <CreditCard className="w-3 h-3 print:hidden"/> : <Coins className="w-3 h-3 print:hidden"/>}
                                          {payMethod === 'bank' ? 'بنك' : 'نقدي'}
                                      </button>
                                  </td>
                                  <td className="p-4 font-black text-lg text-indigo-700 bg-indigo-50/30">
                                      {formatCurrency(net)}
                                  </td>
                                  <td className="p-4 text-center print:hidden">
                                      {isProcessed ? (
                                          <div className="flex items-center justify-center gap-2">
                                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm">
                                                  <CheckCircle2 className="w-4 h-4" /> تم الصرف
                                              </span>
                                              <button 
                                                onClick={() => {
                                                  const details = calculateSalaryDetails(user);
                                                  const userNotes = notes[user.id!] || '';
                                                  printSlip(user, details, bonus, deduction, days, userNotes);
                                                }}
                                                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500"
                                                title="طباعة قسيمة"
                                              >
                                                  <Printer className="w-4 h-4" />
                                              </button>
                                              <button 
                                                onClick={() => setHistoryUser(user)}
                                                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500"
                                                title="سجل الرواتب"
                                              >
                                                  <History className="w-4 h-4" />
                                              </button>
                                          </div>
                                      ) : (
                                          <div className="flex items-center justify-center gap-2">
                                              <button 
                                                onClick={() => processSalary(user)}
                                                disabled={net <= 0 || isProcessingUser}
                                                className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group-hover:scale-105"
                                              >
                                                  {isProcessingUser ? 'جاري...' : <><DollarSign className="w-3 h-3" /> صرف الراتب</>}
                                              </button>
                                              <button 
                                                onClick={() => setHistoryUser(user)}
                                                className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 shrink-0"
                                                title="سجل الرواتب"
                                              >
                                                  <History className="w-4 h-4" />
                                              </button>
                                          </div>
                                      )}
                                  </td>
                              </tr>
                          );
                      })
                  )}
              </tbody>
          </table>
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400 font-medium print:hidden">
          يتم حفظ الراتب الأساسي وطريقة الدفع تلقائياً للشهر القادم
      </div>
    </div>
  );
};

export default PayrollTable;
