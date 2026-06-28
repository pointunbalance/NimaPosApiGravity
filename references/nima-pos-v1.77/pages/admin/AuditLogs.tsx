import React from 'react';
import { ShieldAlert, Search, Calendar as CalendarIcon, Clock, User, Activity, Download, Eye, X, AlertTriangle, CheckCircle2, Info, Trash2, Server, Globe } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useAuditLogsState } from '../../components/admin/useAuditLogsState';

const AuditLogs: React.FC = () => {
  const { error: showError } = useToast();
  
  const {
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
  } = useAuditLogsState(showError);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">{getStatusIcon(status)} ناجح</span>;
      case 'warning': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{getStatusIcon(status)} تحذير</span>;
      case 'error': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">{getStatusIcon(status)} خطأ</span>;
      default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">{getStatusIcon(status)} معلومات</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen bg-gradient-to-tr from-sky-50/60 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/55 shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>
            سجل التدقيق الرقابي (Audit Logs)
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">مراقبة وتتبع جميع الأنشطة والعمليات الأمنية والمالية في النظام بشكل محمي من التعديل</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePurgeLogs}
            disabled={isPurging || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5" />
            تنظيف السجلات القديمة
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">إجمالي السجلات</p>
            <p className="text-xl font-bold text-slate-800">{stats.totalLogs}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">عمليات اليوم</p>
            <p className="text-xl font-bold text-slate-800">{stats.todayLogs}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">أخطاء اليوم</p>
            <p className="text-xl font-bold text-slate-800">{stats.errorsToday}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">مستخدمين نشطين اليوم</p>
            <p className="text-xl font-bold text-slate-800">{stats.activeUsersToday}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative lg:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="البحث في السجلات (المستخدم، الإجراء، التفاصيل)..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          
          <div>
            <select
              value={filterModule}
              onChange={(e) => { setFilterModule(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">جميع الوحدات</option>
              {uniqueModules.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">جميع الأنواع</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterAction}
              onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">جميع الإجراءات</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">جميع الحالات</option>
              <option value="success">ناجح</option>
              <option value="warning">تحذير</option>
              <option value="error">خطأ</option>
            </select>
          </div>

          <div className="lg:col-span-6 flex items-center gap-2">
            <div className="relative flex-1">
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <span className="text-slate-400">-</span>
            <div className="relative flex-1">
              <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">التاريخ والوقت</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">المستخدم</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الوحدة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الإجراء</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">الحالة</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600">التفاصيل</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-600 text-center">عرض</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    لا توجد سجلات مطابقة للبحث
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-sm text-slate-600">
                        <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {new Date(log.date).toLocaleDateString('ar-EG')}</span>
                        <span className="flex items-center gap-1 text-slate-400"><Clock className="w-3 h-3" /> {new Date(log.date).toLocaleTimeString('ar-EG')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                          <User className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {log.user || 'نظام'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{log.module || log.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="عرض التفاصيل"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-sm text-slate-500">
              عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, filteredLogs.length)} من {filteredLogs.length} سجل
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50"
              >
                السابق
              </button>
              <span className="text-sm font-medium text-slate-700 px-2">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-sm disabled:opacity-50 hover:bg-slate-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-indigo-600" />
                تفاصيل السجل
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">المستخدم</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500" />
                    {selectedLog.user || 'نظام'}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">التاريخ والوقت</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span dir="ltr">{new Date(selectedLog.date).toLocaleString('en-GB')}</span>
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">الوحدة / النوع</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-500" />
                    {selectedLog.module || selectedLog.type}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">الإجراء</p>
                  <p className="font-semibold text-slate-800">
                    {selectedLog.action}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">الحالة</p>
                  <div>{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-sm text-slate-500 mb-1">عنوان IP</p>
                  <p className="font-semibold text-slate-800 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    <span dir="ltr">{selectedLog.ipAddress || 'غير متوفر'}</span>
                  </p>
                </div>
              </div>

              {selectedLog.referenceId && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2">الرقم المرجعي</h3>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl">{selectedLog.referenceId}</p>
                </div>
              )}

              {selectedLog.amount !== undefined && (
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-2">المبلغ</h3>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-xl font-mono">{selectedLog.amount}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-2">التفاصيل</h3>
                <p className="text-slate-600 bg-slate-50 p-4 rounded-xl whitespace-pre-wrap leading-relaxed">
                  {selectedLog.details || 'لا توجد تفاصيل إضافية.'}
                </p>
              </div>

              {(selectedLog.oldValue || selectedLog.newValue) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLog.oldValue && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-700 mb-2">القيمة القديمة</h3>
                      <pre className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl overflow-x-auto" dir="ltr">
                        {JSON.stringify(selectedLog.oldValue, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.newValue && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-700 mb-2">القيمة الجديدة</h3>
                      <pre className="text-xs text-slate-600 bg-slate-50 p-4 rounded-xl overflow-x-auto" dir="ltr">
                        {JSON.stringify(selectedLog.newValue, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-100 transition-colors font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
