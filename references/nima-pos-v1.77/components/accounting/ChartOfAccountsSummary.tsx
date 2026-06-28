import React from 'react';
import { AccountType } from '../../types';
import { getTypeLabel, formatCurrency } from './ChartOfAccountsHelpers';

interface ChartOfAccountsSummaryProps {
  summary: {
    asset: number;
    liability: number;
    equity: number;
    revenue: number;
    expense: number;
  };
}

export const ChartOfAccountsSummary: React.FC<ChartOfAccountsSummaryProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 print:grid-cols-5 print:gap-2">
      {(['asset', 'liability', 'equity', 'revenue', 'expense'] as AccountType[]).map(type => {
        const style = getTypeLabel(type);
        const total = summary[type];
        return (
          <div key={type} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center print:border-black print:rounded-none print:p-2 print:shadow-none">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${style.color.replace('text-', 'bg-').replace('-700', '-100')} ${style.color} print:hidden`}>
              <style.icon className="w-5 h-5" />
            </div>
            <h3 className="text-slate-500 text-sm font-bold mb-1 print:text-black">{style.label}</h3>
            <p className={`text-lg font-extrabold font-mono ${total >= 0 ? 'text-slate-800' : 'text-red-600'} print:text-black print:text-base`}>
              {formatCurrency(Math.abs(total))}
            </p>
          </div>
        );
      })}
    </div>
  );
};
