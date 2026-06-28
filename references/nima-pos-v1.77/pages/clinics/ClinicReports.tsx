import React, { useState, useMemo } from 'react';
import { FileText, Download, Calendar, DollarSign, Users, Activity, Filter, PieChart, TrendingUp, AlertCircle, Receipt, Printer } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';

export const ClinicReports = () => {
    const [dateRange, setDateRange] = useState('today');
    const [activeTab, setActiveTab] = useState<'overview' | 'productivity' | 'tax' | 'noshow' | 'audit' | 'rcm_forecast' | 'crisis' | 'hr_commissions' | 'bi'>('overview');

    const invoices = useLiveQuery(() => db.clinicInvoices.toArray()) || [];
    const appointments = useLiveQuery(() => db.appointments.toArray()) || [];
    const customers = useLiveQuery(() => db.customers.toArray()) || [];
    const doctors = useLiveQuery(() => db.doctors.toArray()) || [];
    const auditLogsAll = useLiveQuery(() => db.auditLogs.orderBy('timestamp').reverse().limit(100).toArray()) || [];
    const recycleBinItems = useLiveQuery(() => db.recycleBin.orderBy('deletedAt').reverse().toArray()) || [];
    const assets = useLiveQuery(() => db.assets?.where('category').equals('clinic').toArray() || []) || [];

    const filteredInvoices = useMemo(() => invoices /* Add date filter logic here if needed based on dateRange */, [invoices, dateRange]);
    const filteredAppointments = useMemo(() => appointments /* Add date filter logic here if needed */, [appointments, dateRange]);

    // --- Manipulation Alert Logic ---
    const manipulationFlags = useMemo(() => {
        const flags: any[] = [];
        
        filteredAppointments.forEach(app => {
            if (app.status === 'completed') {
                // Find corresponding invoice by customerId and date
                const inv = filteredInvoices.find(i => i.customerId === app.customerId && i.date === app.date);
                if (!inv) {
                     flags.push({
                         type: 'missing_invoice',
                         severity: 'high',
                         message: `موعد مكتمل للمريض (ID: ${app.customerId}) بتاريخ ${app.date} ولكن لا توجد فاتورة مرتبطة (احتمالية تحصيل خارجي).`,
                         appId: app.id
                     });
                } else {
                     // Check time gap if required (simple check, if time exists)
                     // Suppose we had appointment completion time and invoice creation time, we would compare them here.
                }
            }
        });

        // Detect cancelled appointments with multiple follow-ups but no payments
        const cancelled = filteredAppointments.filter(a => a.status === 'scheduled' || a.state === 'cancelled'); 
        // More complex logic can be added here
        return flags;
    }, [filteredAppointments, filteredInvoices]);

    const handleRestoreItem = async (item: any) => {
        if (!confirm('سيتم استعادة هذا العنصر. هل توافق؟ (هذا الإجراء يتطلب صلاحية Super Admin)')) return;
        try {
             // Assuming we have table name in item.originalTable
             const originalData = { ...item.data };
             delete originalData.id; // avoid id conflict if not required or preserve it if needed
             
             if (item.originalTable === 'clinicInvoices') {
                 await db.clinicInvoices.put(item.data); // restore with original id
             } else if (item.originalTable === 'medicalRecords') {
                 await db.medicalRecords.put(item.data);
             }
             
             await db.recycleBin.delete(item.id);
             await db.auditLogs.add({
                 userId: 1,
                 action: 'RESTORE',
                 module: 'CrisisManagement',
                 timestamp: new Date().toISOString(),
                 details: `تم استعادة سجل من ${item.originalTable} برقم ${item.originalId} بواسطة Super Admin`
             });
             alert('تم الاستعادة بنجاح');
        } catch(e) {
             console.error(e);
             alert('حدث خطأ أثناء الاستعادة');
        }
    };

    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
    const totalAppointments = filteredAppointments.length;
    const totalPatients = customers.length;

    // --- Productivity Data ---
    const serviceRevenue = useMemo(() => {
        const services: Record<string, number> = {};
        filteredInvoices.forEach(inv => {
            const srv = inv.service || 'غير محدد';
            services[srv] = (services[srv] || 0) + (Number(inv.amount) || 0);
        });
        return Object.entries(services).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    }, [filteredInvoices]);

    const doctorProductivity = useMemo(() => {
         const docStats: Record<number, { name: string, count: number }> = {};
         filteredAppointments.forEach(app => {
             if (app.status === 'completed' && app.doctorId) {
                 if (!docStats[app.doctorId]) {
                     const doc = doctors.find(d => d.id === app.doctorId);
                     docStats[app.doctorId] = { name: doc ? doc.name : 'طبيب مجهول', count: 0 };
                 }
                 docStats[app.doctorId].count++;
             }
         });
         return Object.values(docStats).sort((a,b) => b.count - a.count);
    }, [filteredAppointments, doctors]);

    // --- Tax Data ---
    const taxRate = 0.15; // 15% VAT example
    const totalVat = totalRevenue * taxRate;
    const netRevenue = totalRevenue - totalVat;

    // --- HR & Commissions Logic ---
    const doctorCommissions = useMemo(() => {
        const comms: any[] = [];
        doctors.forEach((doctor: any) => {
            // Find all completed appointments for this doctor within the filtered invoices/appointments
            const docInvoices = filteredInvoices.filter(i => {
                // Determine if this invoice belongs to the doctor by looking at the linked appointment
                const linkedApp = filteredAppointments.find(a => a.customerId === i.customerId && a.date === i.date);
                return linkedApp?.doctorId === doctor.id;
            });
            const grossRevenue = docInvoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
            const doctorCutRate = 0.60; // 60% for doctor
            const taxRate = 0.10; // 10% tax on doctor's cut
            const rawCut = grossRevenue * doctorCutRate;
            const taxAmount = rawCut * taxRate;
            const netCut = rawCut - taxAmount;
            const clinicShare = grossRevenue - rawCut;

            if (grossRevenue > 0) {
                comms.push({
                    doctorId: doctor.id,
                    name: doctor.name,
                    specialty: doctor.specialty,
                    appointmentsCount: docInvoices.length,
                    grossRevenue,
                    clinicShare,
                    rawCut,
                    taxAmount,
                    netCut
                });
            }
        });
        return comms.sort((a, b) => b.netCut - a.netCut);
    }, [doctors, filteredInvoices, filteredAppointments]);

    // RCM Forecast Logic
    const rcmForecast = useMemo(() => {
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        const todayStr = today.toISOString().split('T')[0];
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        const upcomingAppointments = appointments.filter(a => a.date >= todayStr && a.date <= nextWeekStr && a.status !== 'completed' && a.status !== 'cancelled' && a.status !== 'no_show');
        
        let estimatedRevenue = 0;
        let expectedPatientsCount = upcomingAppointments.length;
        
        const avgInvoiceAmt = invoices.length ? invoices.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) / invoices.length : 500;
        estimatedRevenue = expectedPatientsCount * avgInvoiceAmt;

        const supplierNeeds = estimatedRevenue * 0.20; // estimate 20%

        return { expectedPatientsCount, estimatedRevenue, avgInvoiceAmt, supplierNeeds, upcomingAppointments };
    }, [appointments, invoices]);

    // --- No Show Data ---
    const noShowStats = useMemo(() => {
        const total = filteredAppointments.length;
        if (total === 0) return { attended: 0, noShow: 0, cancelled: 0, rate: 0 };
        const attended = filteredAppointments.filter(a => a.status === 'completed').length;
        const noShow = filteredAppointments.filter(a => a.status === 'no_show').length;
        const cancelled = filteredAppointments.filter(a => a.status === 'cancelled').length;
        return {
             attended,
             noShow,
             cancelled,
             rate: Math.round(((noShow + cancelled) / total) * 100)
        };
    }, [filteredAppointments]);

    const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#3b82f6'];

    const exportProductivityToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(doctorProductivity.map(d => ({
            'اسم الطبيب': d.name,
            'عدد الكشوفات المكتملة': d.count
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "إنتاجية الأطباء");
        XLSX.writeFile(wb, `تقرير_إنتاجية_الأطباء_${dateRange}.xlsx`);
    };

    const handlePrintTaxReport = () => {
        window.print();
    };

    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-slate-50 print:bg-white print:overflow-visible">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10 print:hidden"></div>
            
            <div className="p-6 pb-0 flex justify-between items-end border-b border-slate-200 print:hidden">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2 mb-2">
                        <Activity className="w-7 h-7 text-indigo-600" />
                        التقارير المتقدمة والتحليلات
                    </h1>
                    <div className="flex gap-4">
                        {[
                          { id: 'overview', label: 'نظرة عامة' },
                          { id: 'productivity', label: 'تقرير الإنتاجية' },
                          { id: 'tax', label: 'التقارير الضريبية' },
                          { id: 'noshow', label: 'تحليل الغياب والمرتجع' },
                          { id: 'audit', label: 'سجل التدقيق وتتبع الأثر' },
                          { id: 'rcm_forecast', label: 'تنبؤات الدخل (RCM)' },
                          { id: 'crisis', label: 'إدارة النزاعات (Crisis Management)' },
                          { id: 'hr_commissions', label: 'الموارد البشرية والعمولات' },
                          { id: 'bi', label: 'تحليلات الأعمال (BI)' }
                        ].map(tab => (
                             <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-3 font-bold text-sm px-2 border-b-2 transition-colors ${activeTab === tab.id ? 'border-indigo-500 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                             >
                                 {tab.label}
                             </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 relative mb-3">
                    <select 
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="appearance-none bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 font-bold text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    >
                        <option value="today">اليوم</option>
                        <option value="week">هذا الأسبوع</option>
                        <option value="month">هذا الشهر</option>
                        <option value="year">هذا العام</option>
                    </select>
                    <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-bold mb-1">إجمالي الإيرادات</p>
                                    <h3 className="text-2xl font-black text-slate-800">{totalRevenue.toLocaleString()} ج.م</h3>
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <Receipt className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-bold mb-1">حالات الكشف</p>
                                    <h3 className="text-2xl font-black text-slate-800">{filteredInvoices.length}</h3>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-bold mb-1">إجمالي الحجوزات</p>
                                    <h3 className="text-2xl font-black text-slate-800">{totalAppointments}</h3>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <Users className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-bold mb-1">عدد المرضى الكلي</p>
                                    <h3 className="text-2xl font-black text-slate-800">{totalPatients}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-indigo-600" /> 
                                    إيرادات الخدمات (أكثر 5 خدمات)
                                </h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={serviceRevenue} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                            <XAxis type="number" tick={{fontSize: 12}} />
                                            <YAxis dataKey="name" type="category" tick={{fontSize: 12, fill: '#475569'}} width={100} />
                                            <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                                            <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">آخر العمليات المالية</h3>
                                <div className="space-y-3">
                                    {filteredInvoices.slice(-5).map((inv: any, i) => {
                                        const pName = customers.find(c => c.id === inv.customerId)?.name || 'مجهول';
                                        return (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                                                    {inv.id}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{pName}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{inv.service} • {inv.date}</p>
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <div className="font-black text-emerald-600">{inv.amount} ج.م</div>
                                                <div className="text-[10px] font-bold text-slate-400 mt-1">{inv.paymentMethod === 'cash' ? 'كاش' : inv.paymentMethod === 'card' ? 'فيزا' : 'آجل'}</div>
                                            </div>
                                        </div>
                                    )})}
                                    {filteredInvoices.length === 0 && <p className="text-slate-500 text-sm text-center py-4 font-medium">لا توجد عمليات مسجلة</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'productivity' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <PieChart className="w-5 h-5 text-indigo-600" />
                                    إنتاجية الأطباء (عدد الكشوفات المكتملة)
                                </h3>
                                <button onClick={exportProductivityToExcel} className="bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 border border-slate-200">
                                    <Download className="w-4 h-4" /> تصدير Excel
                                </button>
                            </div>
                            
                            {doctorProductivity.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsPieChart>
                                                <Pie
                                                    data={doctorProductivity}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="count"
                                                >
                                                    {doctorProductivity.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-4">
                                        {doctorProductivity.map((doc, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-4 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                                                    <span className="font-bold text-slate-700 text-sm">د. {doc.name}</span>
                                                </div>
                                                <span className="font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">{doc.count} كشف</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-slate-500 font-medium">لا توجد بيانات كشوفات مكتملة لعرض إنتاجية الأطباء.</div>
                            )}
                         </div>
                     </div>
                )}

                {activeTab === 'tax' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-900/20">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[60px] pointer-events-none"></div>
                             
                             <div className="flex justify-between items-start mb-10 relative z-10 print:mb-6">
                                <div>
                                    <h2 className="text-2xl font-black mb-2 flex items-center gap-2 print:text-black">
                                        <FileText className="w-6 h-6 opacity-80 print:text-black" />
                                        الإقرار الضريبي والمالي
                                    </h2>
                                    <p className="text-slate-400 font-medium text-sm print:text-slate-600">كشف مالي جاهز للجهات الرقابية والمحاسب القانوني للفترة المحددة.</p>
                                </div>
                                <button onClick={handlePrintTaxReport} className="print:hidden bg-white text-slate-900 hover:bg-slate-50 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg">
                                    <Printer className="w-5 h-5" /> طباعة المقبوضات/PDF
                                </button>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                 <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 print:border-slate-300 print:text-black">
                                     <div className="text-slate-300 font-bold mb-1 text-sm print:text-slate-600">إجمالي الإيرادات (شامل الضريبة)</div>
                                     <div className="text-3xl font-black print:text-black">{totalRevenue.toLocaleString()} <span className="text-base font-bold opacity-70">ج.م</span></div>
                                 </div>
                                 <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 print:border-slate-300 print:text-black">
                                     <div className="text-slate-300 font-bold mb-1 text-sm print:text-slate-600">الضريبة المستحقة ({taxRate * 100}%)</div>
                                     <div className="text-3xl font-black text-rose-400 print:text-rose-600">{totalVat.toLocaleString()} <span className="text-base font-bold opacity-70">ج.م</span></div>
                                 </div>
                                 <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-6 print:border-slate-300 print:text-black">
                                     <div className="text-slate-300 font-bold mb-1 text-sm print:text-slate-600">صافي الإيرادات (خاضع للضريبة)</div>
                                     <div className="text-3xl font-black text-emerald-400 print:text-emerald-600">{netRevenue.toLocaleString()} <span className="text-base font-bold opacity-70">ج.م</span></div>
                                 </div>
                             </div>
                         </div>
                     </div>
                )}

                {activeTab === 'noshow' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                  <AlertCircle className="w-5 h-5 text-rose-500" />
                                  تحليل الغياب وإلغاء المواعيد (No-Show Rate)
                              </h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-center">
                                      <div className="text-slate-500 font-bold text-sm mb-1">إجمالي الحجوزات</div>
                                      <div className="text-3xl font-black text-slate-800">{filteredAppointments.length}</div>
                                  </div>
                                  <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-center">
                                      <div className="text-emerald-600 font-bold text-sm mb-1">حضر وتم الكشف</div>
                                      <div className="text-3xl font-black text-emerald-700">{noShowStats.attended}</div>
                                  </div>
                                  <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl text-center">
                                      <div className="text-rose-600 font-bold text-sm mb-1">غياب / إلغاء</div>
                                      <div className="text-3xl font-black text-rose-700">{noShowStats.noShow + noShowStats.cancelled}</div>
                                  </div>
                                  <div className={`p-5 rounded-2xl text-center border ${noShowStats.rate > 20 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                      <div className="font-bold text-sm mb-1 text-inherit opacity-80">نسبة التخلف (No-Show Rate)</div>
                                      <div className="text-3xl font-black text-inherit">{noShowStats.rate}%</div>
                                  </div>
                              </div>

                              {noShowStats.rate > 20 && (
                                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800 text-sm font-bold items-start leading-relaxed">
                                      <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600 mt-0.5"><AlertCircle className="w-5 h-5" /></div>
                                      <div>
                                          <p>نسبة التخلف عن المواعيد تتجاوز الحد الطبيعي (20%). يُنصح باتخاذ الإجراءات التالية:</p>
                                          <ul className="list-disc list-inside mt-2 text-amber-700/80 space-y-1">
                                              <li>تفعيل خدمة التذكير الآلي برسائل SMS قبل الموعد بـ 24 ساعة.</li>
                                              <li>تطبيق نظام "العربون" أو الدفع المسبق لتأكيد الحجوزات.</li>
                                              <li>مراجعة قائمة انتظار المرضى (Waitlist) لملء الفراغات الناتجة عن الإلغاء.</li>
                                          </ul>
                                      </div>
                                  </div>
                              )}
                          </div>
                     </div>
                )}
            </div>
                 {activeTab === 'audit' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                             <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                     <AlertCircle className="w-5 h-5 text-indigo-600" />
                                     سجل التدقيق وتتبع الأثر (Audit Trail)
                                 </h3>
                                 <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded-lg">Last 100 entries</span>
                             </div>
                             <div className="flex-1 overflow-auto p-0">
                                 <table className="w-full text-sm text-right">
                                     <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                                         <tr>
                                             <th className="px-4 py-3 text-slate-500 font-bold w-48 border-b border-slate-200 shadow-sm">الوقت والتاريخ</th>
                                             <th className="px-4 py-3 text-slate-500 font-bold w-24 border-b border-slate-200 shadow-sm">المستخدم</th>
                                             <th className="px-4 py-3 text-slate-500 font-bold w-32 border-b border-slate-200 shadow-sm">النظام</th>
                                             <th className="px-4 py-3 text-slate-500 font-bold w-40 border-b border-slate-200 shadow-sm">نوع العملية</th>
                                             <th className="px-4 py-3 text-slate-500 font-bold border-b border-slate-200 shadow-sm">التفاصيل والأثر</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-100">
                                         {auditLogsAll.length === 0 ? (
                                             <tr><td colSpan={5} className="py-8 text-center text-slate-500">لا يوجد سجلات حالياً</td></tr>
                                         ) : auditLogsAll.map((log: any) => (
                                             <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                 <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap" dir="ltr">
                                                     {new Date(log.timestamp).toLocaleString('en-GB')}
                                                 </td>
                                                 <td className="px-4 py-3 font-bold text-slate-700">
                                                     ID: {log.userId || 'System'}
                                                 </td>
                                                 <td className="px-4 py-3">
                                                     <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{log.module}</span>
                                                 </td>
                                                 <td className="px-4 py-3">
                                                     <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                         String(log.action).includes('DELETE') || String(log.action).includes('CANCEL') ? 'bg-rose-100 text-rose-700' : 
                                                         String(log.action).includes('UPDATE') || String(log.action).includes('MODIFY') ? 'bg-amber-100 text-amber-700' : 
                                                         'bg-emerald-100 text-emerald-700'
                                                     }`}>
                                                         {log.action}
                                                     </span>
                                                 </td>
                                                 <td className="px-4 py-3 text-slate-800 text-sm whitespace-pre-wrap leading-relaxed">
                                                     {log.details}
                                                     {log.oldValue && (
                                                         <div className="mt-2 flex flex-col md:flex-row gap-2 overflow-x-auto">
                                                            <div className="border border-rose-200 bg-rose-50 rounded p-2 flex-1">
                                                                <span className="font-bold text-rose-600 block mb-1 text-xs">البيانات السابقة</span>
                                                                <pre className="font-mono text-slate-600 text-[10px] overflow-hidden whitespace-pre-wrap word-break-all">{typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue, null, 2) : log.oldValue}</pre>
                                                            </div>
                                                            <div className="border border-emerald-200 bg-emerald-50 rounded p-2 flex-1">
                                                                <span className="font-bold text-emerald-600 block mb-1 text-xs">البيانات المعدلة:</span>
                                                                <pre className="font-mono text-slate-600 text-[10px] overflow-hidden whitespace-pre-wrap word-break-all">{typeof log.newValue === 'object' ? JSON.stringify(log.newValue, null, 2) : log.newValue}</pre>
                                                            </div>
                                                         </div>
                                                     )}
                                                 </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                         </div>
                     </div>
                 )}

                 {activeTab === 'rcm_forecast' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <div className="bg-gradient-to-l from-indigo-700 to-brand-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-500/20 text-center md:text-right">
                             <div className="absolute left-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
                             <h2 className="text-3xl font-black mb-2 flex items-center justify-center md:justify-start gap-3">
                                 <TrendingUp className="w-8 h-8 opacity-80" /> تنبؤات الدخل وتخطيط الموارد (RCM)
                             </h2>
                             <p className="text-indigo-100 font-medium max-w-2xl mx-auto md:mx-0">
                                 بناءً على المواعيد المحجوزة للأسبوع القادم، يقوم النظام بتقدير الدخل المتوقع وتنبيه الإدارة بالاحتياجات المالية لشراء المستلزمات الطبية ودفع الموردين، مما يسمح بحركة تدفق نقدي صحية.
                             </p>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                                 <div className="bg-blue-50 text-blue-600 p-4 rounded-full mb-4">
                                     <Calendar className="w-8 h-8" />
                                 </div>
                                 <h4 className="text-slate-500 font-bold mb-1">المواعيد القادمة (أسبوع)</h4>
                                 <p className="text-3xl font-black text-slate-800">{rcmForecast.expectedPatientsCount}</p>
                                 <p className="text-xs text-slate-400 mt-2">مرضى مجدولين</p>
                             </div>

                             <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                                 <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full mb-4">
                                     <DollarSign className="w-8 h-8" />
                                 </div>
                                 <h4 className="text-slate-500 font-bold mb-1">متوسط قيمة الفاتورة</h4>
                                 <p className="text-3xl font-black text-slate-800">{rcmForecast.avgInvoiceAmt.toFixed(0)} <span className="text-lg">ج.م</span></p>
                                 <p className="text-xs text-slate-400 mt-2">تاريخياً</p>
                             </div>

                             <div className="bg-white p-6 rounded-2xl border-2 border-indigo-200 shadow-md flex flex-col justify-center items-center text-center scale-105 z-10 relative">
                                 <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 blur-2xl opacity-20"></div>
                                 <div className="bg-indigo-100 text-indigo-700 p-4 rounded-full mb-4">
                                     <Activity className="w-8 h-8" />
                                 </div>
                                 <h4 className="text-indigo-800 font-bold mb-1">الدخل المتوقع (Estimated)</h4>
                                 <p className="text-4xl font-black text-indigo-600">{rcmForecast.estimatedRevenue.toFixed(0)} <span className="text-xl">ج.م</span></p>
                                 <p className="text-xs text-indigo-500 mt-2">الأسبوع القادم</p>
                             </div>

                             <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm flex flex-col justify-center items-center text-center bg-rose-50/30">
                                 <div className="bg-rose-100 text-rose-600 p-4 rounded-full mb-4">
                                     <AlertCircle className="w-8 h-8" />
                                 </div>
                                 <h4 className="text-slate-700 font-bold mb-1">احتياجات الموردين (استهلاك مرتقب)</h4>
                                 <p className="text-3xl font-black text-rose-600">{rcmForecast.supplierNeeds.toFixed(0)} <span className="text-lg">ج.م</span></p>
                                 <p className="text-xs text-rose-500/70 mt-2">بناءً على نسبة استهلاك المواد (20%)</p>
                             </div>
                         </div>
                     </div>
                 )}

                 {activeTab === 'crisis' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         {/* Manipulation Detection */}
                         <div className="bg-white rounded-2xl border border-rose-200 shadow-sm overflow-hidden mb-6">
                             <div className="p-4 bg-rose-50 border-b border-rose-100 flex justify-between items-center">
                                 <h3 className="font-bold text-rose-800 flex items-center gap-2">
                                     <AlertCircle className="w-5 h-5 text-rose-600" />
                                     تحليل التلاعب المالي والأخطاء الإدارية
                                 </h3>
                             </div>
                             <div className="p-6">
                                 {manipulationFlags.length === 0 ? (
                                     <div className="text-center py-6 text-slate-500">
                                         <AlertCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-50" />
                                         <p className="font-bold text-emerald-600">لا يوجد بيانات مشبوهة. النظام مستقر ولله الحمد.</p>
                                     </div>
                                 ) : (
                                     <div className="space-y-4">
                                         {manipulationFlags.map((flag, idx) => (
                                             <div key={idx} className="bg-rose-50/50 border border-rose-100 p-4 rounded-xl flex items-start gap-3">
                                                 <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                                                 <div>
                                                     <h4 className="font-bold text-rose-800 text-sm">تنبيه محتمل (Severity: {flag.severity})</h4>
                                                     <p className="text-slate-700 text-sm mt-1">{flag.message}</p>
                                                     <button className="text-xs font-bold text-rose-600 underline mt-2 hover:bg-rose-50 px-2 py-1 rounded">مراجعة الحالة (App ID: {flag.appId})</button>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 )}
                             </div>
                         </div>

                         {/* Recycle Bin / Discarded Records */}
                         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                             <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                     <FileText className="w-5 h-5 text-indigo-600" />
                                     سلة المهملات والأرشفة المؤقتة
                                 </h3>
                                 <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-lg">خاصية Super Admin (Rollback Logic)</span>
                             </div>
                             <div className="overflow-x-auto">
                                 <table className="w-full text-sm text-right">
                                     <thead className="bg-slate-50 border-b border-slate-200">
                                         <tr>
                                             <th className="px-4 py-3 text-slate-500 font-bold">تاريخ الحذف</th>
                                             <th className="px-4 py-3 text-slate-500 font-bold">بواسطة</th>
                                             <th className="px-4 py-3 text-slate-500 font-bold">الجدول الأصلي</th>
                                             <th className="px-4 py-3 text-slate-500 font-bold">تفاصيل البيانات</th>
                                             <th className="px-4 py-3 text-slate-500 font-bold text-left">إجراء</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-slate-100">
                                         {recycleBinItems.length === 0 ? (
                                             <tr><td colSpan={5} className="py-8 text-center text-slate-500">سلة المهملات فارغة</td></tr>
                                         ) : recycleBinItems.map((item: any) => (
                                             <tr key={item.id} className="hover:bg-slate-50">
                                                 <td className="px-4 py-3 text-xs" dir="ltr">{new Date(item.deletedAt).toLocaleString('en-GB')}</td>
                                                 <td className="px-4 py-3 text-xs font-bold text-slate-700">{item.deletedBy}</td>
                                                 <td className="px-4 py-3 text-xs">
                                                     <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">{item.originalTable}</span>
                                                 </td>
                                                 <td className="px-4 py-3 text-xs">
                                                     <div className="max-w-xs truncate" title={JSON.stringify(item.data)}>
                                                         {JSON.stringify(item.data).substring(0, 50)}...
                                                     </div>
                                                 </td>
                                                 <td className="px-4 py-3 text-left">
                                                     <button 
                                                         onClick={() => handleRestoreItem(item)}
                                                         className="text-emerald-600 hover:bg-emerald-50 px-3 py-1 rounded-lg font-bold transition-colors"
                                                     >
                                                         استعادة البيانات
                                                     </button>
                                                 </td>
                                             </tr>
                                         ))}
                                     </tbody>
                                 </table>
                             </div>
                         </div>
                     </div>
                 )}

                 {activeTab === 'hr_commissions' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)]">
                             <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                     <Users className="w-5 h-5 text-indigo-600" />
                                     إدارة العمولات والحوافز للأطباء
                                 </h3>
                                 <button
                                     onClick={() => window.print()}
                                     className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-sm"
                                 >
                                     <Printer className="w-4 h-4" /> طباعة مسير الرواتب
                                 </button>
                             </div>
                             <div className="flex-1 overflow-auto p-6">
                                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                     {doctorCommissions.map(comm => (
                                         <div key={comm.doctorId} className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-indigo-200 hover:shadow-md transition-all overflow-hidden">
                                             <div className="bg-indigo-50 border-b border-indigo-100 p-4">
                                                 <h4 className="font-bold text-indigo-900 text-lg">د. {comm.name}</h4>
                                                 <p className="text-sm font-bold text-indigo-600/70">{comm.specialty}</p>
                                             </div>
                                             <div className="p-4 space-y-4">
                                                 <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                                     <span className="text-slate-500 text-sm font-bold">الحالات المنجزة</span>
                                                     <span className="font-black text-slate-800">{comm.appointmentsCount}</span>
                                                 </div>
                                                 <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                                     <span className="text-slate-500 text-sm font-bold">إجمالي الإيراد</span>
                                                     <span className="font-black text-slate-800">{comm.grossRevenue.toFixed(2)} ج.م</span>
                                                 </div>
                                                 <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                                     <span className="text-rose-500 text-sm font-bold">نسبة العيادة (الاستقطاع)</span>
                                                     <span className="font-black text-rose-600">- {comm.clinicShare.toFixed(2)} ج.م</span>
                                                 </div>
                                                 <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                                     <span className="text-amber-600 text-sm font-bold">الضرائب (10%)</span>
                                                     <span className="font-black text-amber-600">- {comm.taxAmount.toFixed(2)} ج.م</span>
                                                 </div>
                                                 <div className="flex justify-between items-center pt-2">
                                                     <span className="text-indigo-900 text-sm font-black">صافي المستحق (Net)</span>
                                                     <span className="font-black text-xl text-emerald-600">{comm.netCut.toFixed(2)} ج.م</span>
                                                 </div>
                                             </div>
                                         </div>
                                     ))}
                                     {doctorCommissions.length === 0 && (
                                         <div className="col-span-full py-12 text-center text-slate-500">
                                             لا يوجد إيرادات مسجلة للأطباء في هذه الفترة.
                                         </div>
                                     )}
                                 </div>
                             </div>
                         </div>
                     </div>
                 )}

                 {activeTab === 'bi' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                         {/* ROI Analysis Section */}
                         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                             <div className="p-4 bg-slate-50 border-b border-slate-100">
                                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                     <PieChart className="w-5 h-5 text-indigo-600" />
                                     تحليل العائد على الاستثمار (ROI) للأصول الطبية
                                 </h3>
                             </div>
                             <div className="p-6">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                     {assets.map(asset => {
                                         // Mock AI ROI computation
                                         const estimatedRevenuePerUse = 500; // Average session cost
                                         const currentGeneratedRevenue = (asset.usageCount || 0) * estimatedRevenuePerUse;
                                         const roiPercentage = asset.cost > 0 ? (currentGeneratedRevenue / asset.cost) * 100 : 0;
                                         const isProfitable = currentGeneratedRevenue >= asset.cost;

                                         return (
                                             <div key={asset.id} className="border border-slate-200 rounded-2xl p-5 shadow-sm">
                                                 <div className="flex justify-between items-start mb-4">
                                                     <div>
                                                         <h4 className="font-black text-slate-800 text-lg">{asset.name}</h4>
                                                         <p className="text-sm font-bold text-slate-500">{asset.location || 'غير محدد'}</p>
                                                     </div>
                                                     <div className={`px-3 py-1 rounded-lg text-xs font-bold ${isProfitable ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                         {isProfitable ? 'استرد تكلفته' : 'في طور الاسترداد'}
                                                     </div>
                                                 </div>

                                                 <div className="space-y-3">
                                                     <div className="flex justify-between items-center text-sm">
                                                         <span className="text-slate-500 font-bold">تكلفة الشراء:</span>
                                                         <span className="font-black text-slate-800">{asset.cost.toLocaleString()} ج.م</span>
                                                     </div>
                                                     <div className="flex justify-between items-center text-sm">
                                                         <span className="text-slate-500 font-bold">عدد مرات الاستخدام:</span>
                                                         <span className="font-black text-slate-800">{asset.usageCount || 0}</span>
                                                     </div>
                                                     <div className="flex justify-between items-center text-sm">
                                                         <span className="text-slate-500 font-bold">الإيراد التقديري المولد:</span>
                                                         <span className="font-black text-indigo-600">{currentGeneratedRevenue.toLocaleString()} ج.م</span>
                                                     </div>
                                                 </div>

                                                 <div className="mt-4 pt-4 border-t border-slate-100">
                                                     <div className="flex justify-between items-center mb-1">
                                                         <span className="text-xs font-bold text-slate-500">نسبة العائد (ROI)</span>
                                                         <span className="text-xs font-black text-slate-800">{roiPercentage.toFixed(1)}%</span>
                                                     </div>
                                                     <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                         <div 
                                                             className={`h-full ${isProfitable ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                                             style={{ width: `${Math.min(roiPercentage, 100)}%` }} 
                                                         />
                                                     </div>
                                                 </div>
                                             </div>
                                         );
                                     })}
                                     {assets.length === 0 && (
                                         <div className="col-span-full py-8 text-center text-slate-500 font-bold text-sm">لا توجد أصول مسجلة في العيادة.</div>
                                     )}
                                 </div>
                             </div>
                         </div>

                         {/* Geographic Heatmap Section */}
                         <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                             <div className="p-4 bg-slate-50 border-b border-slate-100">
                                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                     <TrendingUp className="w-5 h-5 text-indigo-600" />
                                     الخريطة الحرارية للمرضى (Heatmap)
                                 </h3>
                                 <p className="text-xs text-slate-500 mt-1 font-bold">توزيع المرضى حسب المناطق الجغرافية لتوجيه الحملات التسويقية</p>
                             </div>
                             <div className="p-6 h-[400px]">
                                 <ResponsiveContainer width="100%" height="100%">
                                     <BarChart
                                         data={Object.entries(
                                             customers.reduce((acc, customer) => {
                                                 const region = customer.address || 'غير محدد (مجهول)';
                                                 acc[region] = (acc[region] || 0) + 1;
                                                 return acc;
                                             }, {} as Record<string, number>)
                                         ).map(([region, count]) => ({ region, count })).sort((a, b) => b.count - a.count).slice(0, 10)}
                                         margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                         layout="vertical"
                                     >
                                         <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                         <XAxis type="number" tick={{fontSize: 12, fontWeight: 'bold'}} />
                                         <YAxis dataKey="region" type="category" tick={{fontSize: 12, fontWeight: 'bold'}} width={120} />
                                         <Tooltip 
                                             cursor={{fill: '#F8FAFC'}}
                                             contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                         />
                                         <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} name="عدد المرضى" />
                                     </BarChart>
                                 </ResponsiveContainer>
                             </div>
                         </div>
                     </div>
                 )}
        </div>
    );
}


