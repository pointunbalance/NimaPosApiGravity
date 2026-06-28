import React from 'react';
import { Plus, Search, LayoutGrid, List } from 'lucide-react';

interface UsersHeaderProps {
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddUser: () => void;
}

const UsersHeader: React.FC<UsersHeaderProps> = ({
  viewMode,
  setViewMode,
  searchTerm,
  setSearchTerm,
  onAddUser
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 mb-2">إدارة الموظفين</h1>
          <p className="text-slate-500">متابعة العقود، المهل الزمنية، وأداء الفريق</p>
        </div>
        
        <div className="flex gap-3">
            <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}><LayoutGrid className="w-5 h-5"/></button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}><List className="w-5 h-5"/></button>
            </div>
            <button 
            onClick={onAddUser}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-200 font-bold hover:-translate-y-0.5"
            >
            <Plus className="w-5 h-5" />
            <span>موظف جديد</span>
            </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="بحث باسم الموظف أو الوظيفة..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
          />
      </div>
    </>
  );
};

export default UsersHeader;
