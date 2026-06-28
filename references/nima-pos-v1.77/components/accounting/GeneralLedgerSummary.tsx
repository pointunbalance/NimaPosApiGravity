import React from 'react';
import { BookOpen, RefreshCw, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Account } from '../../types';

interface GeneralLedgerSummaryProps {
  selectedAccount: Account;
  ledgerData: {
    openingBalance: number;
    periodDebit: number;
    periodCredit: number;
    closingBalance: number;
    isDebitNormal: boolean;
  };
  dateRange: { start: string; end: string };
  formatCurrency: (amount: number) => string;
}

const accountTypeLabels: Record<string, string> = {
  asset: 'أصل',
  liability: 'التزام',
  equity: 'حقوق ملكية',
  revenue: 'إيراد',
  expense: 'مصروف'
};

const accountTypeColors: Record<string, string> = {
  asset: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  liability: 'bg-rose-100 text-rose-800 border-rose-200',
  equity: 'bg-purple-100 text-purple-800 border-purple-200',
  revenue: 'bg-blue-100 text-blue-800 border-blue-200',
  expense: 'bg-orange-100 text-orange-800 border-orange-200'
};

export const GeneralLedgerSummary: React.FC<GeneralLedgerSummaryProps> = ({
  selectedAccount,
  ledgerData,
  dateRange,
  formatCurrency
}) => {
  return (
    <>
      {/* Account Info Header */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:border-none print:shadow-none print:p-0 print:mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 print:hidden">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-slate-800">{selectedAccount.name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${accountTypeColors[selectedAccount.type]}`}>
                {accountTypeLabels[selectedAccount.type]}
              </span>
            </div>
            <p className="text-slate-500 font-mono text-sm">رقم الحساب: {selectedAccount.code}</p>
          </div>
        </div>
        <div className="text-right hidden md:block print:block">
          <p className="text-sm text-slate-500 mb-1">الفترة المالية</p>
          <p className="font-bold text-slate-800">
            {new Date(dateRange.start).toLocaleDateString('ar-IQ')} - {new Date(dateRange.end).toLocaleDateString('ar-IQ')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 print:border-2 print:border-black print:rounded-none">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-slate-500 font-bold">رصيد افتتاحي</p>
            <div className="p-2 bg-slate-50 rounded-lg print:hidden"><RefreshCw className="w-4 h-4 text-slate-400" /></div>
          </div>
          <p className={`text-2xl font-black ${ledgerData.openingBalance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
            {formatCurrency(Math.abs(ledgerData.openingBalance))}
            <span className="text-sm font-normal text-slate-400 mr-2">{ledgerData.openingBalance >= 0 ? (ledgerData.isDebitNormal ? 'مدين' : 'دائن') : (ledgerData.isDebitNormal ? 'دائن' : 'مدين')}</span>
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 print:border-2 print:border-black print:rounded-none">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-slate-500 font-bold">إجمالي المدين</p>
            <div className="p-2 bg-emerald-50 rounded-lg print:hidden"><TrendingUp className="w-4 h-4 text-emerald-500" /></div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{formatCurrency(ledgerData.periodDebit)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 print:border-2 print:border-black print:rounded-none">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-slate-500 font-bold">إجمالي الدائن</p>
            <div className="p-2 bg-red-50 rounded-lg print:hidden"><TrendingDown className="w-4 h-4 text-red-500" /></div>
          </div>
          <p className="text-2xl font-black text-red-600">{formatCurrency(ledgerData.periodCredit)}</p>
        </div>
        <div className="bg-indigo-600 p-6 rounded-3xl shadow-lg shadow-indigo-200 text-white print:bg-transparent print:border-2 print:border-black print:rounded-none print:text-black print:shadow-none">
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm text-indigo-100 font-bold print:text-slate-500">الرصيد الحالي (إغلاق)</p>
            <div className="p-2 bg-white/20 rounded-lg print:hidden"><Activity className="w-4 h-4 text-white" /></div>
          </div>
          <p className={`text-2xl font-black ${ledgerData.closingBalance < 0 ? 'text-red-300 print:text-red-600' : 'text-white print:text-slate-800'}`}>
            {formatCurrency(Math.abs(ledgerData.closingBalance))}
            <span className="text-sm font-normal text-indigo-200 print:text-slate-400 mr-2">{ledgerData.closingBalance >= 0 ? (ledgerData.isDebitNormal ? 'مدين' : 'دائن') : (ledgerData.isDebitNormal ? 'دائن' : 'مدين')}</span>
          </p>
        </div>
      </div>
    </>
  );
};
