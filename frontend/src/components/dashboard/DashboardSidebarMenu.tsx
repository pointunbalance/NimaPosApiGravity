import React from 'react';
import { FolderOpen, LucideIcon } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface DashboardSidebarMenuProps {
  tabs: TabItem[];
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  getTabCount: (tabId: string) => number;
}

export const DashboardSidebarMenu: React.FC<DashboardSidebarMenuProps> = ({
  tabs,
  activeTab,
  setActiveTab,
  getTabCount,
}) => {
  return (
    <div id="dashboard-categories-navigation" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hidden md:block">
      <div className="p-3 border-b border-slate-100 bg-slate-50 font-bold text-slate-800 text-sm flex items-center gap-2">
        <FolderOpen className="w-4 h-4 text-indigo-500" />
        تصنيفات المنظومة
      </div>
      <div className="p-2 space-y-1">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = getTabCount(tab.id);
          return (
            <button
              id={`tab-btn-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-all ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-700 font-bold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <TabIcon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {tab.label}
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
