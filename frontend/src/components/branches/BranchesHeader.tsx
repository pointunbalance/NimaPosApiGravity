import React from 'react';
import { Building, Search, Plus } from 'lucide-react';

interface BranchesHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddBranch: () => void;
}

const BranchesHeader: React.FC<BranchesHeaderProps> = ({
  searchTerm,
  onSearchChange,
  onAddBranch
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-in slide-in-from-left duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Building className="w-6 h-6 text-brand-500" />
          إدارة الفروع
        </h1>
        <p className="text-slate-500 text-sm mt-1">إعدادات الفروع وبياناتها الأساسية</p>
      </div>
      
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:w-64">
          <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="بحث عن فرع..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
        </div>
        <button 
          onClick={onAddBranch}
          className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-brand-700 transition-colors whitespace-nowrap shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5" />
          إضافة فرع
        </button>
      </div>
    </div>
  );
};

export default BranchesHeader;
