import React, { useState, useEffect } from 'react';
import { Server, Cpu, HardDrive, Activity, AlertTriangle, Zap, Network, MemoryStick } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export const ServerResources: React.FC = () => {
    const [cpuData, setCpuData] = useState(Array.from({length: 20}, (_, i) => ({ time: i, usage: Math.random() * 40 + 20 })));
    const [memoryData, setMemoryData] = useState(Array.from({length: 20}, (_, i) => ({ time: i, usage: Math.random() * 20 + 50 })));
    const [networkData, setNetworkData] = useState(Array.from({length: 20}, (_, i) => ({ time: i, inbound: Math.random() * 100, outbound: Math.random() * 80 })));

    useEffect(() => {
        const interval = setInterval(() => {
            setCpuData(prev => {
                const newData = [...prev.slice(1), { time: prev[prev.length - 1].time + 1, usage: Math.random() * 60 + 20 }];
                return newData;
            });
            setMemoryData(prev => {
                const newData = [...prev.slice(1), { time: prev[prev.length - 1].time + 1, usage: Math.random() * 10 + 60 }];
                return newData;
            });
            setNetworkData(prev => {
                const newData = [...prev.slice(1), { time: prev[prev.length - 1].time + 1, inbound: Math.random() * 120, outbound: Math.random() * 100 }];
                return newData;
            });
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl shadow-sm border border-indigo-200">
                            <Server className="w-8 h-8" />
                        </div>
                        موارد السيرفر (Server Resources)
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">مراقبة استهلاك الموارد وحالة الخوادم التشغيلية لحظياً.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Cpu className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-bold text-slate-700">استهلاك المعالج (CPU)</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-800 flex items-center gap-2">
                        {Math.round(cpuData[cpuData.length - 1].usage)}%
                    </p>
                    <div className="mt-2 w-full bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${cpuData[cpuData.length - 1].usage > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{width: `${cpuData[cpuData.length - 1].usage}%`}}></div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <MemoryStick className="w-5 h-5 text-emerald-500" />
                        <h3 className="font-bold text-slate-700">الذاكرة (RAM)</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-800 flex items-center gap-2">
                        {Math.round(memoryData[memoryData.length - 1].usage)}%
                        <span className="text-sm font-medium text-slate-500 ml-2">16 / 32 GB</span>
                    </p>
                    <div className="mt-2 w-full bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${memoryData[memoryData.length - 1].usage > 85 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{width: `${memoryData[memoryData.length - 1].usage}%`}}></div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <HardDrive className="w-5 h-5 text-blue-500" />
                        <h3 className="font-bold text-slate-700">مساحة التخزين</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-800 flex items-center gap-2">
                        45%
                        <span className="text-sm font-medium text-slate-500 ml-2">450 / 1000 GB</span>
                    </p>
                    <div className="mt-2 w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: '45%'}}></div>
                    </div>
                </div>
                
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <Activity className="w-5 h-5 text-rose-500" />
                        <h3 className="font-bold text-slate-700">حالة النظام</h3>
                    </div>
                    <p className="text-3xl font-black text-emerald-600 flex items-center gap-2">
                        مستقر
                    </p>
                    <p className="text-sm text-slate-500 mt-2">Uptime: 45 Days, 12 Hrs</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-indigo-500" />
                        أداء المعالج (CPU Load)
                    </h3>
                    <div className="h-64 dir-ltr font-sans text-sm">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={cpuData}>
                                <defs>
                                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                                <XAxis dataKey="time" hide />
                                <YAxis domain={[0, 100]} />
                                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Area type="monotone" dataKey="usage" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" name="CPU Usage %" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Network className="w-5 h-5 text-emerald-500" />
                        حركة الشبكة (Network I/O)
                    </h3>
                    <div className="h-64 dir-ltr font-sans text-sm">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={networkData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                                <XAxis dataKey="time" hide />
                                <YAxis />
                                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                <Line type="monotone" dataKey="inbound" stroke="#10b981" strokeWidth={3} dot={false} name="Inbound (Mbps)" isAnimationActive={false} />
                                <Line type="monotone" dataKey="outbound" stroke="#3b82f6" strokeWidth={3} dot={false} name="Outbound (Mbps)" isAnimationActive={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                   <h3 className="font-bold text-amber-900 mb-1">استهلاك الموارد ضمن الحدود الطبيعية</h3>
                   <p className="text-sm text-amber-700">لا توجد اختناقات (Bottlenecks) في أداء الخوادم حالياً. يعمل خادم قواعد البيانات وخادم التطبيق بشكل متوازٍ.</p>
                </div>
            </div>
        </div>
    );
};

export default ServerResources;
