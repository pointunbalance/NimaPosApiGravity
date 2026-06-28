import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Server, ShieldCheck, Activity, Database, AlertCircle, RefreshCw, HardDrive, Cpu, Network } from 'lucide-react';
import { t } from '../../utils/i18n';

export const SystemHealthAndLogs: React.FC = () => {
    const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
    const auditLogs = useLiveQuery(() => db.auditLogs.orderBy('timestamp').reverse().limit(100).toArray()) || [];
    const [isChecking, setIsChecking] = useState(false);
    
    // Simulated system health state for offline-first local system
    const [systemHealth, setSystemHealth] = useState({
        dbStatus: 'online',
        syncQueueLength: 0,
        localStorageUsage: '0 MB',
        lastBackup: 'Never',
        apiConnectivity: 'checking...',
    });

    const [isForceSyncing, setIsForceSyncing] = useState(false);

    useEffect(() => {
        const checkHealth = async () => {
            setIsChecking(true);
            try {
                let usage = '0 MB';
                if (navigator.storage && navigator.storage.estimate) {
                    const estimate = await navigator.storage.estimate();
                    usage = (estimate.usage! / (1024 * 1024)).toFixed(2) + ' MB';
                }
                
                setSystemHealth({
                    dbStatus: 'online', // Local IndexedDB is always online if app loads
                    syncQueueLength: Math.floor(Math.random() * 5), // Simulated queue length
                    localStorageUsage: usage,
                    lastBackup: settings?.dbConfig?.lastBackupDate ? new Date(settings.dbConfig.lastBackupDate).toLocaleString('ar-EG') : 'لم يتم',
                    apiConnectivity: navigator.onLine ? 'متصل' : 'مقطوع',
                });
            } catch (error) {
                console.error("Health check failed", error);
            } finally {
                setIsChecking(false);
            }
        };
        checkHealth();
        
        const handleOnline = () => setSystemHealth(s => ({...s, apiConnectivity: 'متصل'}));
        const handleOffline = () => setSystemHealth(s => ({...s, apiConnectivity: 'مقطوع'}));
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [settings]);

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-slate-100 text-slate-800 rounded-2xl shadow-sm border border-slate-200">
                            <Activity className="w-8 h-8" />
                        </div>
                        صحة النظام وسجل المراقبة (System Health)
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">مراقبة حالة السيرفرات، مزامنة الفروع، وسجل عمليات الـ API للتشخيص والنسخ الاحتياطي التلقائي.</p>
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                >
                    <RefreshCw className={`w-5 h-5 ${isChecking ? 'animate-spin' : ''}`} />
                    تحديث الحالة
                </button>
            </div>

            {/* Health Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <Database className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-bold text-slate-700">قاعدة البيانات المحلية</h3>
                    </div>
                    <p className="text-2xl font-black text-emerald-600 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        نشط ومستقر
                    </p>
                    <p className="text-sm text-slate-500 mt-2">المساحة المستخدمة: {systemHealth.localStorageUsage}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <Network className="w-5 h-5 text-blue-500" />
                        <h3 className="font-bold text-slate-700">حالة الاتصال بالشبكة</h3>
                    </div>
                    <p className={`text-2xl font-black ${navigator.onLine ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {systemHealth.apiConnectivity}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">مزامنة الفروع المركزية (Off-line First)</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <RefreshCw className="w-5 h-5 text-amber-500" />
                            <h3 className="font-bold text-slate-700">طابور المزامنة (Sync Queue)</h3>
                        </div>
                        <button 
                            onClick={() => {
                                setIsForceSyncing(true);
                                setTimeout(() => {
                                    setSystemHealth(s => ({...s, syncQueueLength: 0}));
                                    setIsForceSyncing(false);
                                }, 1500);
                            }}
                            disabled={isForceSyncing || systemHealth.syncQueueLength === 0}
                            className={`text-xs px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-md font-medium transition-colors ${isForceSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isForceSyncing ? 'جاري الدفع...' : 'تزامن الآن'}
                        </button>
                    </div>
                    <p className="text-2xl font-black text-slate-800">
                        {systemHealth.syncQueueLength} <span className="text-lg text-slate-500 font-medium">طلبات معلقة</span>
                    </p>
                    <p className="text-sm text-slate-500 mt-2">ستتم مزامنتها عند استقرار الاتصال بالانترنت.</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-bold text-slate-700">آخر نسخ احتياطي تلقائي</h3>
                    </div>
                    <p className="text-lg font-bold text-slate-800 dir-ltr text-right">
                        {systemHealth.lastBackup}
                    </p>
                    <p className="text-sm text-slate-500 mt-2">حسب اعدادات النسخ الاحتياطي في النظام.</p>
                </div>
            </div>

            {/* Audit Logs / API Requests Simulator */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <Server className="w-5 h-5 text-slate-600" />
                        <h2 className="text-lg font-bold text-slate-800">سجل الأحداث المركزية (Audit & API Logs)</h2>
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 sticky top-0 border-b border-slate-100 z-10">
                            <tr>
                                <th className="p-4 text-slate-600 font-semibold text-sm">الوقت والتاريخ</th>
                                <th className="p-4 text-slate-600 font-semibold text-sm">المستخدم</th>
                                <th className="p-4 text-slate-600 font-semibold text-sm">الوحدة (Module)</th>
                                <th className="p-4 text-slate-600 font-semibold text-sm">العملية</th>
                                <th className="p-4 text-slate-600 font-semibold text-sm">التفاصيل / Payload</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {auditLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        لا توجد سجلات أحداث متاحة حالياً.
                                    </td>
                                </tr>
                            ) : (
                                auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors text-sm">
                                        <td className="p-4 font-mono text-slate-500 whitespace-nowrap dir-ltr text-right">{new Date(log.timestamp).toLocaleString('en-GB')}</td>
                                        <td className="p-4 font-medium text-slate-800">{log.userName || log.userId}</td>
                                        <td className="p-4 text-indigo-600 font-medium">[{log.module.toUpperCase()}]</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                                                log.action === 'create' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                log.action === 'delete' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                log.action === 'update' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {log.action.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-600 max-w-xs truncate" title={log.details}>
                                            {log.details}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SystemHealthAndLogs;
