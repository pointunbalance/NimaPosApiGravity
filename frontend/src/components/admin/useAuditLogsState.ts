import { useState, useMemo, useDeferredValue } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { LogEntry } from '../../types';

export const useAuditLogsState = (showError: (msg: string) => void) => {
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [filterAction, setFilterAction] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterModule, setFilterModule] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isPurging, setIsPurging] = useState(false);
  
  const itemsPerPage = 20;

  const logs = useLiveQuery(() => db.logs.orderBy('date').reverse().toArray()) || [];

  // Statistics Calculation
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = logs.filter(l => new Date(l.date) >= today);
    const errorsToday = todayLogs.filter(l => l.status === 'error').length;
    const activeUsersToday = new Set(todayLogs.map(l => l.user).filter(Boolean)).size;

    return {
      totalLogs: logs.length,
      todayLogs: todayLogs.length,
      errorsToday,
      activeUsersToday
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const searchToUse = deferredSearchTerm.toLowerCase();
      const matchesSearch = !searchToUse || 
                            (log.details && log.details.toLowerCase().includes(searchToUse)) || 
                            (log.user && log.user.toLowerCase().includes(searchToUse)) ||
                            (log.action && log.action.toLowerCase().includes(searchToUse));
      const matchesAction = filterAction === 'all' || log.action === filterAction;
      const matchesType = filterType === 'all' || log.type === filterType;
      const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
      const matchesModule = filterModule === 'all' || log.module === filterModule;
      
      let matchesDate = true;
      if (dateFrom) {
        matchesDate = matchesDate && new Date(log.date) >= new Date(dateFrom);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && new Date(log.date) <= toDate;
      }

      return matchesSearch && matchesAction && matchesType && matchesStatus && matchesModule && matchesDate;
    });
  }, [logs, deferredSearchTerm, filterAction, filterType, filterStatus, filterModule, dateFrom, dateTo]);

  const uniqueActions = useMemo(() => Array.from(new Set(logs.map(log => log.action))).filter(Boolean), [logs]);
  const uniqueTypes = useMemo(() => Array.from(new Set(logs.map(log => log.type))).filter(Boolean), [logs]);
  const uniqueModules = useMemo(() => Array.from(new Set(logs.map(log => log.module))).filter(Boolean), [logs]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredLogs, currentPage]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['التاريخ', 'الوقت', 'المستخدم', 'الوحدة', 'النوع', 'الإجراء', 'الحالة', 'التفاصيل', 'عنوان IP', 'الرقم المرجعي'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => {
        const date = new Date(log.date);
        return [
          date.toLocaleDateString('en-GB'),
          date.toLocaleTimeString('en-GB'),
          `"${log.user || 'نظام'}"`,
          `"${log.module || ''}"`,
          `"${log.type || ''}"`,
          `"${log.action || ''}"`,
          `"${log.status || ''}"`,
          `"${(log.details || '').replace(/"/g, '""')}"`,
          `"${log.ipAddress || ''}"`,
          log.referenceId || ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePurgeLogs = async () => {
    showError('لأسباب أمنية وتشريعية (الامتثال لمعايير الأمان)، سجل التدقيق هذا غير قابل للتعديل أو الحذف المباشر (Immutable). يرجى الرجوع لسياسة الاحتفاظ بالبيانات والأرشفة الآمنة.');
  };

  return {
    searchTerm,
    setSearchTerm,
    filterAction,
    setFilterAction,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    filterModule,
    setFilterModule,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    currentPage,
    setCurrentPage,
    selectedLog,
    setSelectedLog,
    isPurging,
    logs,
    stats,
    filteredLogs,
    uniqueActions,
    uniqueTypes,
    uniqueModules,
    paginatedLogs,
    totalPages,
    itemsPerPage,
    handleExportCSV,
    handlePurgeLogs
  };
};
