import React from 'react';
import { Search, LayoutList, AlignLeft } from 'lucide-react';
import { LogType, LogStatus, User } from '../../types';

interface LogbookToolbarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  viewMode: 'list' | 'timeline';
  setViewMode: (mode: 'list' | 'timeline') => void;
  filterType: LogType | 'all';
  setFilterType: (type: LogType | 'all') => void;
  filterStatus: LogStatus | 'all';
  setFilterStatus: (status: LogStatus | 'all') => void;
  filterUser: string;
  setFilterUser: (user: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  users?: User[];
}

const LogbookToolbar: React.FC<LogbookToolbarProps> = ({
  searchTerm, setSearchTerm,
  viewMode, setViewMode,
  filterType, setFilterType,
  filterStatus, setFilterStatus,
  filterUser, setFilterUser,
  dateRange, setDateRange,
  users
}) => {
  return (
    <div className="px-8 py-4 bg-white/50 backdrop-blur-md sticky top-0 z-10 border-b border-gray-200">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="بحث سريع (رقم الفاتورة، تفاصيل)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold shadow-sm"
          />
        </div>

        {/* View Toggle */}
        <div className="flex bg-white rounded-xl p-1 border border-gray-300 shadow-sm">
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`} title="قائمة"><LayoutList className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('timeline')} className={`p-2 rounded-lg transition-colors ${viewMode === 'timeline' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`} title="خط زمني"><AlignLeft className="w-4 h-4" /></button>
        </div>

        {/* Filters Group */}
        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
          <select 
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
            className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 outline-none cursor-pointer hover:bg-gray-50 shadow-sm"
          >
            <option value="all">كل الأنواع</option>
            <option value="sale">مبيعات</option>
            <option value="refund">مرتجع</option>
            <option value="purchase">مشتريات</option>
            <option value="payment">دفعات</option>
            <option value="expense">مصروفات</option>
            <option value="shift">صندوق</option>
            <option value="adjustment">مخزون</option>
            <option value="system">نظام</option>
          </select>

          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className={`px-4 py-2.5 border rounded-xl text-sm font-bold outline-none cursor-pointer shadow-sm ${filterStatus === 'error' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            <option value="all">كل الحالات</option>
            <option value="success">نجاح</option>
            <option value="error">أخطاء فقط</option>
            <option value="warning">تحذيرات</option>
          </select>

          <select 
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 outline-none cursor-pointer hover:bg-gray-50 shadow-sm"
          >
            <option value="all">كل المستخدمين</option>
            {users?.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
          </select>

          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-xl px-2 shadow-sm min-w-[240px]">
            <input 
              type="date" 
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              className="bg-transparent text-sm font-medium outline-none py-2 w-full text-center"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date" 
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              className="bg-transparent text-sm font-medium outline-none py-2 w-full text-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogbookToolbar;
