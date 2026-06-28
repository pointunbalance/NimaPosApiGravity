import React from 'react';
import { Scale, TrendingUp, Landmark, Activity } from 'lucide-react';

interface FinancialReportsTabsProps {
  activeTab: 'trial' | 'income' | 'balance' | 'cashflow';
  setActiveTab: (tab: 'trial' | 'income' | 'balance' | 'cashflow') => void;
}

const FinancialReportsTabs: React.FC<FinancialReportsTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex flex-wrap bg-slate-100 p-1 rounded-2xl w-fit mb-8 print:hidden">
        {[
            { id: 'trial', label: 'ميزان المراجعة', icon: Scale },
            { id: 'income', label: 'قائمة الدخل', icon: TrendingUp },
            { id: 'balance', label: 'الميزانية العمومية', icon: Landmark },
            { id: 'cashflow', label: 'التدفقات النقدية', icon: Activity },
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${
                    activeTab === tab.id 
                    ? 'bg-white text-indigo-600 shadow-md scale-105' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
            >
                <tab.icon className="w-4 h-4" />
                {tab.label}
            </button>
        ))}
    </div>
  );
};

export default FinancialReportsTabs;
