import React from 'react';
import { Wallet, Calendar } from 'lucide-react';

interface PayrollHeaderProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  setProcessedUsers: (users: Set<number>) => void;
}

const PayrollHeader: React.FC<PayrollHeaderProps> = ({
  selectedMonth,
  setSelectedMonth,
  setProcessedUsers
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden font-['Tajawal']">
      <div>
         <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
               <Wallet className="w-8 h-8 stroke-[2]" />
             </div>
             مسير الرواتب
          </h1>
         <p className="text-slate-500 font-bold text-sm mt-1">إدارة أجور الموظفين، الغياب، الحوافز وطباعة القسائم المالية</p>
      </div>
      
      <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-indigo-100/10 shadow-sm">
          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 border border-indigo-100/40"><Calendar className="w-5 h-5 stroke-[2]" /></div>
          <div className="flex flex-col pr-1">
              <span className="text-[10px] font-black text-slate-400">فترة مسير الرواتب</span>
              <input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={(e) => { setSelectedMonth(e.target.value); setProcessedUsers(new Set()); }}
                  className="bg-transparent border-none p-0 text-sm font-black outline-none text-slate-800 cursor-pointer"
              />
          </div>
      </div>
    </div>
  );
};

export default PayrollHeader;
