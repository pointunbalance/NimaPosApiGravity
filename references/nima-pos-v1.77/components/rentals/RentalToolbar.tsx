import React from 'react';
import { List, Calendar as CalendarIcon, Search, Shirt } from 'lucide-react';

interface RentalToolbarProps {
    viewMode: 'calendar' | 'list' | 'items';
    setViewMode: (mode: 'calendar' | 'list' | 'items') => void;
    filterStatus: 'all' | 'reserved' | 'active' | 'late' | 'returned';
    setFilterStatus: (status: 'all' | 'reserved' | 'active' | 'late' | 'returned') => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
}

export const RentalToolbar: React.FC<RentalToolbarProps> = ({
    viewMode, setViewMode, filterStatus, setFilterStatus, searchTerm, setSearchTerm
}) => {
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                    <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-bold text-sm ${viewMode === 'list' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="قائمة الحجوزات">
                        <List className="w-4 h-4"/>
                        <span className="hidden sm:inline">القائمة</span>
                    </button>
                    <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-bold text-sm ${viewMode === 'calendar' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="التقويم">
                        <CalendarIcon className="w-4 h-4"/>
                        <span className="hidden sm:inline">التقويم</span>
                    </button>
                    <button onClick={() => setViewMode('items')} className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 font-bold text-sm ${viewMode === 'items' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="كتالوج المنتجات">
                        <Shirt className="w-4 h-4"/>
                        <span className="hidden sm:inline">كتالوج المنتجات</span>
                    </button>
                </div>
                {/* Status Filters */}
                {viewMode !== 'items' && (
                    <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                        {[
                            { id: 'all', label: 'الكل' },
                            { id: 'active', label: 'في الخارج' },
                            { id: 'reserved', label: 'قادمة' },
                            { id: 'late', label: 'متأخرة' },
                        ].map(f => (
                            <button 
                                key={f.id}
                                onClick={() => setFilterStatus(f.id as any)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${filterStatus === f.id ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="relative w-full md:w-80 shrink-0">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="بحث باسم العميل، القطعة..."
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm transition-all focus:bg-white"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
    );
};
