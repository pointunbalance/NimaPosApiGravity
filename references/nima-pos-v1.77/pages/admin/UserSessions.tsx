import React, { useMemo } from 'react';
import { MapPin, Globe, ShieldAlert, MonitorSmartphone, Activity, Users } from 'lucide-react';
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, CartesianGrid } from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

export const UserSessions: React.FC = () => {
    const rawSessions = useLiveQuery(() => db.userSessions.orderBy('loginTime').reverse().limit(10).toArray()) || [];
    
    // Fallback Mock Data for map visualization (Scatter graph coordinate plotting)
    const loginData = [
        { id: 1, x: 45, y: 35, z: 200, location: 'الرياض، السعودية', users: 45, status: 'safe' },
        { id: 2, x: 42, y: 30, z: 120, location: 'جدة، السعودية', users: 20, status: 'safe' },
        { id: 3, x: 50, y: 40, z: 60, location: 'الظهران، السعودية', users: 8, status: 'safe' },
        { id: 4, x: 25, y: -10, z: 150, location: 'مكان غير معروف (VPN محتمل)', users: 2, status: 'warning' },
        { id: 5, x: 30, y: 20, z: 300, location: 'القاهرة، مصر', users: 15, status: 'safe' },
        { id: 6, x: 80, y: -40, z: 100, location: 'محاولة وصول غير مصرح بها', users: 1, status: 'danger' }
    ];

    const stats = useMemo(() => {
        const activeCount = rawSessions.filter(s => s.status === 'active').length;
        const total = rawSessions.length;
        const mobileCount = rawSessions.filter(s => s.deviceType === 'Mobile').length;
        const mobilePct = total > 0 ? Math.round((mobileCount / total) * 100) : 0;
        
        return {
            activeCount: activeCount > 0 ? activeCount : 91, // fallback mock stats
            mobilePct: total > 0 ? mobilePct : 45,
            dangerous: total > 0 ? 0 : 2
        };
    }, [rawSessions]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
          const data = payload[0].payload;
          return (
            <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-xl">
              <p className="font-bold text-slate-800">{data.location}</p>
              <p className="text-sm text-slate-500">الجلسات النشطة: {data.users}</p>
              {data.status === 'warning' && <p className="text-xs text-amber-600 font-bold mt-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> نشاط مشبوه</p>}
              {data.status === 'danger' && <p className="text-xs text-rose-600 font-bold mt-1 flex items-center gap-1"><ShieldAlert className="w-3 h-3"/> خطر أمني</p>}
            </div>
          );
        }
        return null;
      };

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        
        if (interval > 1) return `منذ ${Math.floor(interval)} سنة`;
        interval = seconds / 2592000;
        if (interval > 1) return `منذ ${Math.floor(interval)} شهر`;
        interval = seconds / 86400;
        if (interval > 1) return `منذ ${Math.floor(interval)} يوم`;
        interval = seconds / 3600;
        if (interval > 1) return `منذ ${Math.floor(interval)} ساعة`;
        interval = seconds / 60;
        if (interval > 1) return `منذ ${Math.floor(interval)} دقيقة`;
        return 'الآن';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl shadow-sm border border-indigo-200">
                            <MapPin className="w-8 h-8" />
                        </div>
                        خريطة الدخول الجغرافي والجلسات
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">مراقبة توزع المستخدمين جغرافياً واكتشاف الأنشطة المشبوهة (Geo-Tracking & Session Management).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 z-10 relative">
                        <Globe className="w-5 h-5 text-indigo-500" />
                        توزع الجلسات النشطة (محاكاة جغرافية)
                    </h3>
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                    
                    <div className="h-[400px] w-full dir-ltr z-10 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid opacity={0.1} />
                                <XAxis type="number" dataKey="x" name="stature" hide domain={[-100, 100]} />
                                <YAxis type="number" dataKey="y" name="weight" hide domain={[-100, 100]} />
                                <ZAxis type="number" dataKey="z" range={[50, 400]} name="score" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                                <Scatter name="Safe" data={loginData.filter(d => d.status === 'safe')} fill="#10b981" fillOpacity={0.6} />
                                <Scatter name="Warning" data={loginData.filter(d => d.status === 'warning')} fill="#f59e0b" fillOpacity={0.8} />
                                <Scatter name="Danger" data={loginData.filter(d => d.status === 'danger')} fill="#ef4444" fillOpacity={0.8} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-800 text-white rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-400" />
                            ملخص الجلسات
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                                <span className="text-slate-400">إجمالي الجلسات النشطة</span>
                                <span className="font-bold">{stats.activeCount}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                                <span className="text-slate-400">من أجهزة محمولة</span>
                                <span className="font-bold">{stats.mobilePct}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="flex items-center gap-2 text-rose-400">
                                    <ShieldAlert className="w-4 h-4" /> أنشطة خطرة (اليوم)
                                </span>
                                <span className="font-bold text-rose-400">{stats.dangerous}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
                         <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-500" />
                            أحدث عمليات الدخول
                        </h3>
                        <div className="space-y-4">
                            {rawSessions.length > 0 ? rawSessions.map(session => {
                                const isDanger = false; // Mocking this since UserSession type doesn't natively support 'danger'. We can add logic to compare IP later.
                                return (
                                <div key={session.id} className="flex gap-3 items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDanger ? 'bg-rose-50 border border-rose-100' : 'bg-slate-100'}`}>
                                        {isDanger ? <ShieldAlert className="w-5 h-5 text-rose-500" /> : <MonitorSmartphone className="w-5 h-5 text-slate-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${isDanger ? 'text-rose-700' : 'text-slate-800'}`}>{session.userName}</p>
                                        <p className="text-xs text-slate-500">{session.location} - {session.deviceType}</p>
                                    </div>
                                    <span className="text-xs text-slate-400">{getTimeAgo(session.loginTime)}</span>
                                </div>
                            )}) : (
                                <div className="text-center text-slate-500 text-sm">لا توجد بيانات جلسات محلية</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserSessions;
