
import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { LogEntry, LogType, LogStatus } from '../types';
import { Search, RefreshCw } from 'lucide-react';
import LogbookHeader from '../components/logbook/LogbookHeader';
import LogbookToolbar from '../components/logbook/LogbookToolbar';
import LogbookList from '../components/logbook/LogbookList';
import LogbookTimeline from '../components/logbook/LogbookTimeline';
import LogbookDetailSidebar from '../components/logbook/LogbookDetailSidebar';
import { getLogTypeLabel } from '../components/logbook/logbookUtils';

const Logbook: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<LogType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<LogStatus | 'all'>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [limit, setLimit] = useState(100);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Queries
  const logs = useLiveQuery(async () => {
    const allLogs = await db.logs.toArray();
    return allLogs.sort((a, b) => b.date.getTime() - a.date.getTime()); // Newest first
  }, []);

  const users = useLiveQuery(() => db.users.toArray(), []);

  // Stats for the top cards (calculated from ALL logs in date range, not just limit)
  const dashboardStats = useMemo(() => {
      if (!logs) return { totalToday: 0, errorsToday: 0, volumeToday: 0 };
      
      const today = new Date().setHours(0,0,0,0);
      const todayLogs = logs.filter(l => new Date(l.date).setHours(0,0,0,0) === today);
      
      return {
          totalToday: todayLogs.length,
          errorsToday: todayLogs.filter(l => l.status === 'error').length,
          volumeToday: todayLogs.reduce((sum, l) => sum + (l.amount || 0), 0)
      };
  }, [logs]);

  // Filtering
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    
    return logs.filter(log => {
        // Text Search
        const matchesSearch = 
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (log.referenceId && log.referenceId.toString().includes(searchTerm));
        
        // Type Filter
        const matchesType = filterType === 'all' || log.type === filterType;

        // Status Filter
        const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

        // User Filter
        const matchesUser = filterUser === 'all' || log.user === filterUser;

        // Date Filter
        const logDate = new Date(log.date).setHours(0,0,0,0);
        const startDate = new Date(dateRange.start).setHours(0,0,0,0);
        const endDate = new Date(dateRange.end).setHours(23,59,59,999);
        const matchesDate = logDate >= startDate && logDate <= endDate;

        return matchesSearch && matchesType && matchesStatus && matchesDate && matchesUser;
    }).slice(0, limit);
  }, [logs, searchTerm, filterType, filterStatus, filterUser, dateRange, limit]);

  const handleExport = () => {
      if (filteredLogs.length === 0) return;
      const headers = ['ID', 'Date', 'Time', 'Type', 'Status', 'Action', 'User', 'Amount', 'Ref ID', 'Details'];
      const rows = filteredLogs.map(l => [
          l.id,
          new Date(l.date).toLocaleDateString(),
          new Date(l.date).toLocaleTimeString(),
          getLogTypeLabel(l.type), // Export Arabic Label
          l.status || 'success',
          l.action,
          l.user,
          l.amount || 0,
          l.referenceId || '',
          l.details || ''
      ]);
      
      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = `logbook_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
  };

  return (
    <div className="flex h-full bg-[#f3f4f6] overflow-hidden font-['Tajawal']">
        
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${selectedLog ? 'w-[65%] hidden lg:flex' : 'w-full'}`}>
            
            <LogbookHeader 
              dashboardStats={dashboardStats}
              onRefresh={() => window.location.reload()}
              onExport={handleExport}
            />

            <LogbookToolbar 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              viewMode={viewMode}
              setViewMode={setViewMode}
              filterType={filterType}
              setFilterType={setFilterType}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              filterUser={filterUser}
              setFilterUser={setFilterUser}
              dateRange={dateRange}
              setDateRange={setDateRange}
              users={users}
            />

            {/* Logs View */}
            <div className="flex-1 overflow-y-auto p-8 scroll-smooth">
                {filteredLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 pb-20">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-10 h-10 opacity-30" />
                        </div>
                        <p className="text-lg font-bold text-gray-500">لا توجد سجلات مطابقة</p>
                        <p className="text-sm">جرب تغيير خيارات البحث أو التاريخ</p>
                    </div>
                ) : viewMode === 'list' ? (
                    <LogbookList 
                      logs={filteredLogs}
                      selectedLog={selectedLog}
                      onSelectLog={setSelectedLog}
                    />
                ) : (
                    <LogbookTimeline 
                      logs={filteredLogs}
                      selectedLog={selectedLog}
                      onSelectLog={setSelectedLog}
                    />
                )}

                {logs && logs.length > limit && (
                    <div className="p-4 mt-4 border-t border-gray-200 bg-gray-50 text-center rounded-xl">
                        <button onClick={() => setLimit(prev => prev + 50)} className="text-indigo-600 font-bold hover:underline text-sm flex items-center justify-center gap-2 w-full">
                            <RefreshCw className="w-4 h-4" />
                            تحميل المزيد من السجلات
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* DETAILS SIDE DRAWER */}
        {selectedLog && (
            <LogbookDetailSidebar 
              selectedLog={selectedLog}
              onClose={() => setSelectedLog(null)}
            />
        )}

    </div>
  );
};

export default Logbook;
