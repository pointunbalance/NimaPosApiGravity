import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Activity, Users, FileText, Briefcase, HeartPulse, TrendingUp, Calendar, Clock, BarChart as BarChartIcon, ArrowLeft, Bell, AlertTriangle, Settings, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

export default function ClinicDashboard() {
  const navigate = useNavigate();
  const { success } = useToast();
  const [isAutoEndOpen, setIsAutoEndOpen] = useState(false);

  const doctors = useLiveQuery(() => db.doctors.toArray(), []) || [];
  const patients = useLiveQuery(() => db.customers.toArray(), []) || [];
  const appointments = useLiveQuery(() => db.appointments.toArray(), []) || [];
  const medicalRecords = useLiveQuery(() => db.medicalRecords.toArray(), []) || [];
  const inventoryItems = useLiveQuery(() => db.clinicInventoryItems?.toArray(), []) || []; // Optional chaining in case table is not populated yet

  const today = new Date().toISOString().split('T')[0];
  
  const stats = useMemo(() => {
    const todayAppointments = appointments.filter(a => a.date === today);
    const completedToday = todayAppointments.filter(a => a.status === 'completed');
    const waitingToday = todayAppointments.filter(a => a.status === 'scheduled');
    const canceledToday = todayAppointments.filter(a => a.status === 'cancelled');

    const revenueExpected = todayAppointments.reduce((sum, app) => {
        const doctor = doctors.find(d => d.id === app.doctorId);
        return sum + (doctor?.consultationFee || 0);
    }, 0);

    // Calculate last 7 days chart data
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        
        const appsOnDate = appointments.filter(a => a.date === dateStr);
        const dayRevenue = appsOnDate.reduce((sum, app) => {
            const doctor = doctors.find(doc => doc.id === app.doctorId);
            return sum + (app.status === 'completed' ? (doctor?.consultationFee || 0) : 0);
        }, 0);

        chartData.push({
            date: dateStr.substring(5), // Make it shorter like MM-DD
            appointments: appsOnDate.length,
            revenue: dayRevenue
        });
    }

    // Alerts logic
    const alerts = [];
    
    // Low stock inventory (assumed logic: < 10)
    inventoryItems.forEach(item => {
        if (Number(item.stockAmount) < 10) {
            alerts.push({
                type: 'warning',
                title: 'نقص في المخزون',
                message: `الصنف (${item.itemName}) أوشك على النفاد (الكمية: ${item.stockAmount})`
            });
        }
    });

    // Canceled appointments
    canceledToday.forEach(app => {
        const patient = patients.find(p => p.id === app.customerId);
        alerts.push({
            type: 'error',
            title: 'إلغاء حجز',
            message: `تم إلغاء حجز المريض: ${patient?.name || 'غير معروف'} اليوم`
        });
    });

    // High number of waiting patients
    if (waitingToday.length > 10) {
        alerts.push({
            type: 'info',
            title: 'ازدحام في العيادة',
            message: `يوجد ${waitingToday.length} حالة في وضع الانتظار حالياً.`
        });
    }

    return {
      totalDoctors: doctors.length,
      totalPatients: patients.length,
      todayAppointments: todayAppointments.length,
      completedToday: completedToday.length,
      waitingToday: waitingToday.length,
      totalMedicalRecords: medicalRecords.length,
      revenueExpected,
      chartData,
      todayAppointmentsList: todayAppointments,
      alerts
    };
  }, [doctors, patients, appointments, medicalRecords, inventoryItems, today]);

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-slate-50">
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <Activity className="w-8 h-8 text-brand-600" />
                لوحة تحكم العيادات
                </h1>
                <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                ملخص عام للعيادات والمراكز الطبية
                </p>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => {
                        db.auditLogs.add({
                            userId: 1,
                            action: 'AUTO_END_DAY',
                            module: 'ClinicDashboard',
                            timestamp: new Date().toISOString(),
                            details: 'تم تشغيل روبوت الإغلاق التلقائي (Auto-End Day) بنجاح وإرسال التقرير.'
                        });
                        setIsAutoEndOpen(true);
                        success('تم إرسال تقرير الإغلاق وتصفير الورديات آلياً');
                    }}
                    className="bg-slate-800 text-white hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                    <Settings className="w-4 h-4 text-emerald-400" />
                    محاكاة الإغلاق الآلي لليوم (Auto-End Day)
                </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                            <Calendar className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 mb-1">مواعيد اليوم</p>
                            <h3 className="text-3xl font-black text-slate-800">{stats.todayAppointments}</h3>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                            <Users className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 mb-1">المرضى المسجلين</p>
                            <h3 className="text-3xl font-black text-slate-800">{stats.totalPatients}</h3>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <Briefcase className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 mb-1">الأطباء المتاحين</p>
                            <h3 className="text-3xl font-black text-slate-800">{stats.totalDoctors}</h3>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                            <TrendingUp className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 mb-1">الإيرادات المتوقعة لليوم</p>
                            <h3 className="text-3xl font-black text-slate-800">{stats.revenueExpected} <span className="text-sm font-bold text-slate-500">ج.م</span></h3>
                        </div>
                    </motion.div>
                </div>

                {/* Alerts Section */}
                {stats.alerts.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-white rounded-2xl border border-slate-200 p-6">
                         <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                             <Bell className="w-5 h-5 text-rose-500" />
                             أحدث التنبيهات
                         </h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {stats.alerts.map((alert, idx) => (
                                   <div key={idx} className={`p-4 rounded-xl border flex gap-3 ${
                                        alert.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' :
                                        alert.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' :
                                        'bg-blue-50 border-blue-100 text-blue-800'
                                   }`}>
                                        <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                                            alert.type === 'error' ? 'text-rose-500' :
                                            alert.type === 'warning' ? 'text-amber-500' :
                                            'text-blue-500'
                                        }`} />
                                        <div>
                                             <h4 className="font-bold text-sm mb-1">{alert.title}</h4>
                                             <p className="text-xs opacity-90 leading-relaxed">{alert.message}</p>
                                        </div>
                                   </div>
                              ))}
                         </div>
                    </motion.div>
                )}

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                             <BarChartIcon className="w-5 h-5 text-indigo-500" />
                             المواعيد خلال 7 أيام
                        </h3>
                        <div className="h-64" dir="ltr">
                             <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                      <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                      <Bar dataKey="appointments" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} name="المواعيد" />
                                  </BarChart>
                             </ResponsiveContainer>
                        </div>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                             <TrendingUp className="w-5 h-5 text-emerald-500" />
                             الإيرادات خلال 7 أيام
                        </h3>
                        <div className="h-64" dir="ltr">
                             <ResponsiveContainer width="100%" height="100%">
                                 <LineChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                     <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                     <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                     <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} name="الإيرادات (ج.م)" />
                                 </LineChart>
                             </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Summary and Stats */}
                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-white rounded-2xl border border-slate-200 p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                             <HeartPulse className="w-5 h-5 text-rose-500" /> ملخص نشاط اليوم
                        </h3>
                        <div className="space-y-4">
                             <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                  <span className="font-bold text-slate-600">مواعيد في الانتظار</span>
                                  <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-bold">{stats.waitingToday}</span>
                             </div>
                             <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                  <span className="font-bold text-slate-600">زيارات مكتملة</span>
                                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg font-bold">{stats.completedToday}</span>
                             </div>
                             <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                  <span className="font-bold text-slate-600">إجمالي التشخيصات (السجل الطبي)</span>
                                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-bold">{stats.totalMedicalRecords}</span>
                             </div>
                        </div>
                     </motion.div>

                     {/* Doctor Stats & Appointments Preview */}
                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-brand-500" /> مواعيد اليوم
                                </h3>
                                <button 
                                    onClick={() => navigate('/clinics')}
                                    className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                                >
                                    الذهاب للاستقبال
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {stats.todayAppointmentsList.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-slate-500 font-bold">لا توجد مواعيد اليوم</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {stats.todayAppointmentsList.slice(0, 4).map(app => {
                                        const patient = patients.find(p => p.id === app.customerId);
                                        const doctor = doctors.find(d => d.id === app.doctorId);
                                        return (
                                            <div key={app.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div>
                                                    <p className="font-bold text-slate-800 mb-0.5">{patient?.name || 'مريض غير معروف'}</p>
                                                    <p className="text-xs text-slate-500">د. {doctor?.name}</p>
                                                </div>
                                                <div>
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-lg ${
                                                        app.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                                        app.status === 'scheduled' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {app.status === 'completed' ? 'تم الكشف' : 
                                                         app.status === 'scheduled' ? 'في الانتظار' : 'ملغي'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {stats.todayAppointmentsList.length > 4 && (
                                        <div className="text-center pt-2">
                                            <span className="text-xs font-medium text-slate-500">+{stats.todayAppointmentsList.length - 4} مواعيد أخرى</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                     </motion.div>
                </div>
            </div>
        </div>

        {/* Auto-End Day Modal */}
        <AnimatePresence>
            {isAutoEndOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-8 text-center relative"
                    >
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">تم الإغلاق الآلي بنجاح</h2>
                        <p className="text-slate-600 mb-6">
                            قام النظام بحساب الإيرادات، تفقيط الحسابات، توليد تقرير PDF، وإرساله لمدير النظام (عبر البريد/واتساب) آلياً.
                        </p>
                        <ul className="text-sm text-slate-500 text-right space-y-2 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <li className="flex items-center gap-2">✅ تم الجرد ومطابقة عدد الحالات ({stats.completedToday}).</li>
                            <li className="flex items-center gap-2">✅ تم احتساب إيرادات اليوم ({stats.revenueExpected} ج.م).</li>
                            <li className="flex items-center gap-2">✅ تم جرد المستودع واكتشاف النواقص.</li>
                            <li className="flex items-center gap-2">✅ تم تسجيل الإجراء في سجل التدقيق (Audit).</li>
                        </ul>
                        <button 
                            onClick={() => setIsAutoEndOpen(false)}
                            className="bg-slate-800 text-white hover:bg-slate-700 w-full rounded-xl py-3 font-bold transition-all"
                        >
                            حسناً، إغلاق
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
}
