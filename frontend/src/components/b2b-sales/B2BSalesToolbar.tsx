import React from 'react';
import { Search, Download, Calendar } from 'lucide-react';

interface B2BSalesToolbarProps {
  activeTab: 'orders' | 'customers' | 'quotations';
  setActiveTab: (tab: 'orders' | 'customers' | 'quotations') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateRange?: 'all' | 'today' | 'week' | 'month';
  setDateRange?: (range: 'all' | 'today' | 'week' | 'month') => void;
  statusFilter?: 'all' | 'paid' | 'partial' | 'unpaid';
  setStatusFilter?: (status: 'all' | 'paid' | 'partial' | 'unpaid') => void;
  sortBy?: 'date' | 'amount' | 'dueDate' | 'status';
  setSortBy?: (sort: 'date' | 'amount' | 'dueDate' | 'status') => void;
  sortOrder?: 'asc' | 'desc';
  setSortOrder?: (order: 'asc' | 'desc') => void;
  onExport?: () => void;
}

const B2BSalesToolbar: React.FC<B2BSalesToolbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  dateRange,
  setDateRange,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  onExport
}) => {
  return (
    <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex space-x-reverse space-x-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'orders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          الفواتير
        </button>
        <button
          onClick={() => setActiveTab('quotations')}
          className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'quotations' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          عروض الأسعار
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'customers' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          العملاء
        </button>
      </div>
      
      <div className="flex items-center gap-4 w-full sm:w-auto">
        {(activeTab === 'orders' || activeTab === 'quotations') && setStatusFilter && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white"
          >
            <option value="all">كل الحالات</option>
            {activeTab === 'orders' ? (
              <>
                <option value="paid">مدفوعة</option>
                <option value="partial">جزئي</option>
                <option value="unpaid">غير مدفوعة</option>
              </>
            ) : (
              <>
                <option value="pending">قيد الانتظار</option>
                <option value="accepted">مقبول</option>
                <option value="rejected">مرفوض</option>
                <option value="converted">محول لفاتورة</option>
              </>
            )}
          </select>
        )}
        
        {(activeTab === 'orders' || activeTab === 'quotations') && setSortBy && setSortOrder && (
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg bg-white">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border-none focus:outline-none text-sm bg-transparent"
            >
              <option value="date">التاريخ</option>
              <option value="amount">المبلغ</option>
              <option value="dueDate">تاريخ الاستحقاق/الانتهاء</option>
              <option value="status">الحالة</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-l-lg border-r border-slate-200"
              title={sortOrder === 'asc' ? 'تصاعدي' : 'تنازلي'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        )}
        
        {(activeTab === 'orders' || activeTab === 'quotations') && setDateRange && (
          <div className="relative">
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm appearance-none bg-white"
            >
              <option value="all">كل التواريخ</option>
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
            </select>
          </div>
        )}

        <div className="relative flex-1 sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder={activeTab === 'orders' ? "البحث في الفواتير..." : "البحث عن عميل..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        {activeTab === 'orders' && onExport && (
          <button
            onClick={onExport}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="تصدير إلى CSV"
          >
            <Download size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default B2BSalesToolbar;
