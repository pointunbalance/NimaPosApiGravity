import React from 'react';
import { FileText, Plus, Search } from 'lucide-react';

interface PurchaseOrdersHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: 'all' | 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled';
  setStatusFilter: (status: 'all' | 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled') => void;
  onNewOrderClick: () => void;
}

const PurchaseOrdersHeader: React.FC<PurchaseOrdersHeaderProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  onNewOrderClick
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-8 py-6 shrink-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <FileText className="w-8 h-8 text-indigo-600" />
            أوامر الشراء
          </h1>
          <p className="text-slate-500 font-medium mt-2">إدارة طلبات الشراء وإرسالها للموردين</p>
        </div>
        <button 
          onClick={onNewOrderClick}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
        >
          <Plus className="w-5 h-5" />
          إنشاء أمر شراء
        </button>
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="relative flex-1 w-full">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                  type="text" 
                  placeholder="بحث برقم الأمر أو اسم المورد..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="w-full pr-12 pl-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
              />
          </div>
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {(['all', 'draft', 'sent', 'partially_received', 'received', 'cancelled'] as const).map(status => (
                  <button 
                      key={status}
                      onClick={() => setStatusFilter(status)} 
                      className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                          statusFilter === status 
                          ? 'bg-slate-800 text-white shadow-md' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                  >
                      {status === 'all' ? 'الكل' : 
                       status === 'draft' ? 'مسودة' : 
                       status === 'sent' ? 'مرسل' : 
                       status === 'received' ? 'مستلم' : 'ملغي'}
                  </button>
              ))}
          </div>
      </div>
    </div>
  );
};

export default PurchaseOrdersHeader;
