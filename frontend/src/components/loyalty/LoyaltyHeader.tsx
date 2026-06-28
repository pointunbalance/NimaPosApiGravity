import React from 'react';
import { Star, Users, Settings } from 'lucide-react';

interface LoyaltyHeaderProps {
  activeTab: 'customers' | 'settings';
  setActiveTab: (tab: 'customers' | 'settings') => void;
}

const LoyaltyHeader: React.FC<LoyaltyHeaderProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="font-['Tajawal'] space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-500 border border-amber-100 shadow-sm">
              <Star className="w-8 h-8 fill-amber-400 stroke-amber-500 stroke-[1.5]" />
            </div>
            برنامج الولاء والنقاط
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">إدارة نقاط العملاء، مستويات العضوية وإعدادات المكافآت</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-indigo-100/30 pb-px">
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-6 py-3 font-black text-sm rounded-t-2xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-white/80 text-indigo-600 border-t border-l border-r border-indigo-100/40 shadow-sm backdrop-blur-md'
              : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 stroke-[2]" />
          أرصدة العملاء
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-6 py-3 font-black text-sm rounded-t-2xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-white/80 text-indigo-600 border-t border-l border-r border-indigo-100/40 shadow-sm backdrop-blur-md'
              : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4 stroke-[2]" />
          إعدادات البرنامج
        </button>
      </div>
    </div>
  );
};

export default LoyaltyHeader;
