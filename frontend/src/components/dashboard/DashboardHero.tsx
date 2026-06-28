import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardHeroProps {
    user: any;
    orderCount: number;
    dateRange: string;
    setDateRange: (range: string) => void;
    tabs: { id: string, label: string, icon: React.ElementType }[];
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({ user, orderCount, dateRange, setDateRange, tabs, activeTab, setActiveTab }) => {
    const navigate = useNavigate();

    return (
        <div className="p-4 md:p-8">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-r from-indigo-900 to-violet-900 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl text-white pb-20 md:pb-24"
            >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
                
                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-8">
                    <div className="max-w-2xl">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6 backdrop-blur-md"
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            النظام يعمل بكفاءة
                        </motion.div>
                        <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
                            مرحباً، <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-white">{user.name || 'المدير'}</span>
                        </h1>
                        <p className="text-indigo-100/80 text-lg font-light leading-relaxed">
                            إليك ملخص أداء الأعمال. لديك <span className="text-white font-bold bg-white/20 px-2 py-0.5 rounded-md mx-1">{orderCount}</span> طلبات جديدة في هذه الفترة. استمر في العمل الرائع!
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                            <select 
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 text-white pl-10 pr-12 py-3.5 rounded-2xl font-bold outline-none focus:bg-white/20 transition-all appearance-none cursor-pointer backdrop-blur-md"
                            >
                                <option value="1" className="text-slate-900">اليوم</option>
                                <option value="7" className="text-slate-900">آخر 7 أيام</option>
                                <option value="30" className="text-slate-900">آخر 30 يوم</option>
                                <option value="90" className="text-slate-900">آخر 3 أشهر</option>
                            </select>
                            <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-200 pointer-events-none" />
                        </div>
                        <button onClick={() => navigate('/pos')} className="bg-white text-indigo-900 px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] hover:scale-[1.02] transition-all group">
                            <CreditCard className="w-5 h-5 text-indigo-600 group-hover:rotate-12 transition-transform" /> 
                            <span>نقطة بيع جديدة</span>
                            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                        </button>
                    </div>
                </div>

                {/* Integrated Tabs */}
                <div className="absolute bottom-0 left-0 right-0 px-8 py-4 bg-white/5 backdrop-blur-md border-t border-white/10 overflow-x-auto hide-scrollbar hidden sm:block">
                    <div className="flex gap-2 min-w-max">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300
                                        ${isActive 
                                            ? 'bg-white text-indigo-900 shadow-lg scale-100' 
                                            : 'text-indigo-100/70 hover:bg-white/10 hover:text-white scale-95 hover:scale-100'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : ''}`} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
