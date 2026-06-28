import React from 'react';
import { FileText, Clock } from 'lucide-react';
import { PettyCash } from '../../types';

interface PettyCashGridProps {
  filteredFunds: PettyCash[];
  calculateRemaining: (fund: PettyCash) => number;
  onSelectFund: (fund: PettyCash) => void;
}

const PettyCashGrid: React.FC<PettyCashGridProps> = ({ filteredFunds, calculateRemaining, onSelectFund }) => {
  if (filteredFunds.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-12 text-center text-slate-400 flex flex-col items-center">
            <FileText className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-bold">لا توجد عهد نقدية مسجلة حالياً</p>
            <p className="text-sm mt-2">انقر على "صرف عهدة جديدة" للبدء</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredFunds.map(fund => {
        const remaining = calculateRemaining(fund);
        const isClosed = fund.status === 'closed';
        
        return (
          <div 
            key={fund.id} 
            onClick={() => onSelectFund(fund)}
            className={`bg-white rounded-2xl shadow-sm border ${isClosed ? 'border-slate-200 opacity-75' : 'border-indigo-100 hover:border-indigo-300'} p-6 cursor-pointer transition-all hover:shadow-md`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{fund.employeeName}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(fund.date).toLocaleDateString('ar-EG')}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${isClosed ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                {isClosed ? 'مغلقة' : 'نشطة'}
              </span>
            </div>
            
            <p className="text-slate-600 text-sm mb-6 line-clamp-2">{fund.description}</p>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500 mb-1">المبلغ الأساسي</p>
                <p className="font-bold text-slate-800">{fund.amount.toLocaleString()} ج.م</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">المتبقي</p>
                <p className={`font-bold ${remaining < 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
                  {remaining.toLocaleString()} ج.م
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PettyCashGrid;
