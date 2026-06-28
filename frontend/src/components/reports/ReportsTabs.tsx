import React from 'react';

interface ReportsTabsProps {
  activeTab: 'financial' | 'treasury' | 'maintenance' | 'products' | 'staff' | 'taxes';
  setActiveTab: (tab: 'financial' | 'treasury' | 'maintenance' | 'products' | 'staff' | 'taxes') => void;
}

const ReportsTabs: React.FC<ReportsTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex gap-4 border-b border-slate-200 mb-6 overflow-x-auto whitespace-nowrap pb-1 scrollbar-thin print:hidden">
      <button 
        onClick={() => setActiveTab('financial')} 
        className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'financial' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
      >
        المالية والأرباح والخسائر
      </button>
      <button 
        onClick={() => setActiveTab('treasury')} 
        className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'treasury' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
      >
        حركة الخزينة المفصلة
      </button>
      <button 
        onClick={() => setActiveTab('maintenance')} 
        className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'maintenance' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
      >
        تقارير الصيانة والورشة
      </button>
      <button 
        onClick={() => setActiveTab('products')} 
        className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'products' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
      >
        تحليل المنتجات والمخزون
      </button>
      <button 
        onClick={() => setActiveTab('staff')} 
        className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'staff' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
      >
        أداء الموظفين
      </button>
      <button 
        onClick={() => setActiveTab('taxes')} 
        className={`pb-3 px-2 font-bold text-sm border-b-2 transition-colors ${activeTab === 'taxes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
      >
        الضرائب
      </button>
    </div>
  );
};

export default ReportsTabs;
