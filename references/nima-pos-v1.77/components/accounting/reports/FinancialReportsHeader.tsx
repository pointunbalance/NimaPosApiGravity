import React from 'react';
import { BarChart4, Download, Printer, Filter, Calendar, Building } from 'lucide-react';
import { CostCenter } from '../../../types';

interface FinancialReportsHeaderProps {
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  costCenterId: number | 'all';
  setCostCenterId: (id: number | 'all') => void;
  costCenters: CostCenter[];
  onExportCSV: () => void;
  onPrint: () => void;
  storeName?: string;
  activeTab: 'trial' | 'income' | 'balance' | 'cashflow';
}

const FinancialReportsHeader: React.FC<FinancialReportsHeaderProps> = ({
  dateRange,
  setDateRange,
  costCenterId,
  setCostCenterId,
  costCenters,
  onExportCSV,
  onPrint,
  storeName,
  activeTab
}) => {
  return (
    <>
      {/* Header - Hidden on Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print:hidden">
          <div>
              <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                  <BarChart4 className="w-8 h-8 text-indigo-600" />
                  التقارير المالية
              </h1>
              <p className="text-slate-500 mt-1">القوائم المالية الختامية ومؤشرات الأداء</p>
          </div>
          <div className="flex gap-2">
              <button 
                  onClick={onExportCSV}
                  className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-colors"
              >
                  <Download className="w-5 h-5" /> تصدير
              </button>
              <button 
                  onClick={onPrint}
                  className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 transition-colors"
              >
                  <Printer className="w-5 h-5" /> طباعة
              </button>
          </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-6 items-center print:hidden">
          <div className="flex items-center gap-2 text-slate-500 font-bold whitespace-nowrap">
              <Filter className="w-5 h-5" />
              <span>فلاتر التقرير:</span>
          </div>
          
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 flex-1 min-w-[250px]">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={e => setDateRange({...dateRange, start: e.target.value})}
                    className="bg-transparent py-2 text-sm font-bold text-slate-700 outline-none w-full [color-scheme:light]"
                />
                <span className="text-slate-400">إلى</span>
                <input 
                    type="date" 
                    value={dateRange.end}
                    onChange={e => setDateRange({...dateRange, end: e.target.value})}
                    className="bg-transparent py-2 text-sm font-bold text-slate-700 outline-none w-full [color-scheme:light]"
                />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 flex-1 min-w-[200px]">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                    value={costCenterId}
                    onChange={(e) => setCostCenterId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="bg-transparent py-2 text-sm font-bold text-slate-700 outline-none w-full"
                >
                    <option value="all">جميع مراكز التكلفة</option>
                    {costCenters.map(cc => (
                        <option key={cc.id} value={cc.id}>{cc.name}</option>
                    ))}
                </select>
            </div>
          </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold">{storeName}</h1>
          <h2 className="text-xl font-bold mt-2">
              {activeTab === 'trial' && 'ميزان المراجعة (Trial Balance)'}
              {activeTab === 'income' && 'قائمة الدخل (Income Statement)'}
              {activeTab === 'balance' && 'الميزانية العمومية (Balance Sheet)'}
              {activeTab === 'cashflow' && 'قائمة التدفقات النقدية (Cash Flow Statement)'}
          </h2>
          <p className="text-sm mt-1">الفترة من {new Date(dateRange.start).toLocaleDateString()} إلى {new Date(dateRange.end).toLocaleDateString()}</p>
          {costCenterId !== 'all' && (
              <p className="text-sm mt-1">
                  مركز التكلفة: {costCenters.find(c => c.id === costCenterId)?.name}
              </p>
          )}
      </div>
    </>
  );
};

export default FinancialReportsHeader;
