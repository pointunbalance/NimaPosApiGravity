import React, { useState, useEffect } from 'react';
import { X, Heart, Gift, MessageSquare, Calendar, Star, DollarSign, Send } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

interface CRMLoyaltyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CRMLoyaltyModal({ isOpen, onClose }: CRMLoyaltyModalProps) {
    const patients = useLiveQuery(() => db.customers.toArray()) || [];
    const appointments = useLiveQuery(() => db.appointments.toArray()) || [];
    const loyaltyTx = useLiveQuery(() => db.loyaltyTransactions?.toArray() || []) || [];

    const [activeTab, setActiveTab] = useState<'loyalty' | 'followup'>('loyalty');

    // Auto Follow-up Logic: Find appointments that were completed yesterday
    const followUps = appointments.filter(a => {
        if (a.status !== 'completed') return false;
        
        const appDate = new Date(a.date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - appDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays >= 1 && diffDays <= 3; // Find completed in last 1-3 days
    });

    const handleSendFollowUp = async (app: any) => {
        if (!confirm('سيتم جدولة رسالة اطمئنان إلكترونية وإرسال استبيان رضا. متابعة؟')) return;
        try {
            await db.auditLogs.add({
                userId: 1,
                action: 'CRM_FOLLOWUP',
                module: 'CRMLoyalty',
                timestamp: new Date().toISOString(),
                details: `تم إرسال رسالة متابعة واستبيان للمريض ${app.customerId} عن زيارة ${app.date}`
            });
            alert('تم الإرسال بنجاح (Simulation)');
        } catch(e) {
            console.error(e);
        }
    };

    const handleAddPoints = async (patientId: number, points: number) => {
        try {
            const patient = await db.customers.get(patientId);
            if (patient) {
                const currentPoints = patient.loyaltyPoints || 0;
                await db.customers.update(patientId, { loyaltyPoints: currentPoints + points });
                
                if (db.loyaltyTransactions) {
                    await db.loyaltyTransactions.add({
                        customerId: patientId,
                        date: new Date(),
                        points: points,
                        type: 'manual_add'
                    });
                }
                
                await db.auditLogs.add({
                    userId: 1,
                    action: 'CRM_POINTS',
                    module: 'CRMLoyalty',
                    timestamp: new Date().toISOString(),
                    details: `تم إضافة ${points} نقطة للمريض ${patient.name} (Loyalty)`
                });
                alert('تمت إضافة النقاط بنجاح');
            }
        } catch(e) {
            console.error(e);
            alert('حدث خطأ');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex overflow-hidden shadow-2xl relative">
                {/* Sidebar */}
                <div className="w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col hidden md:flex">
                    <div className="flex items-center gap-3 mb-8">
                        <Heart className="w-8 h-8 text-rose-500" />
                        <h2 className="text-xl font-black text-slate-800">برنامج الولاء ومتابعة المرضى</h2>
                    </div>
                    
                    <div className="space-y-2 flex-1">
                        <button 
                            onClick={() => setActiveTab('loyalty')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'loyalty' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <Gift className="w-5 h-5" /> سجل النقاط والمكافآت
                        </button>
                        <button 
                            onClick={() => setActiveTab('followup')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'followup' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
                        >
                            <MessageSquare className="w-5 h-5" /> المتابعات الآلية
                            {followUps.length > 0 && (
                                <span className="mr-auto bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{followUps.length}</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                        <h3 className="font-bold text-slate-800 text-lg">
                            {activeTab === 'loyalty' ? 'نظام النقاط والمكافآت' : 'المتابعات والاطمئنان'}
                        </h3>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'loyalty' && (
                            <div className="space-y-6">
                                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-indigo-900">
                                    <h4 className="font-bold mb-2 flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" /> كيف تعمل النقاط؟</h4>
                                    <p className="text-sm">يقوم النظام تلقائياً بتحويل جزء من المدفوعات إلى نقاط بناءً على إعدادات العيادة. يمكن استخدام النقاط لتقديم خصومات أو خدمات مجانية لزيادة ولاء المرضى.</p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {patients.filter(p => (p.loyaltyPoints || 0) > 0).sort((a,b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0)).map(patient => (
                                        <div key={patient.id} className="border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col">
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="font-bold text-slate-800">{patient.name}</h5>
                                                <span className="bg-amber-100 text-amber-800 text-xs font-black px-2 py-1 rounded flex items-center gap-1">
                                                    <Star className="w-3 h-3" /> {patient.loyaltyPoints || 0} نقطة
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-4">{patient.phone}</p>
                                            <button 
                                                onClick={() => handleAddPoints(patient.id!, 50)}
                                                className="mt-auto bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2 rounded-xl text-sm transition-colors w-full"
                                            >
                                                إضافة 50 مكافأة يدوية +
                                            </button>
                                        </div>
                                    ))}
                                    {patients.filter(p => (p.loyaltyPoints || 0) > 0).length === 0 && (
                                        <div className="col-span-full py-12 text-center text-slate-500">لا يوجد مرضى لديهم نقاط ولاء حتى الآن.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'followup' && (
                            <div className="space-y-6">
                                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-emerald-900">
                                    <h4 className="font-bold mb-2 flex items-center gap-2"><MessageSquare className="w-5 h-5 text-emerald-600" /> المتابعة الآلية (Auto Follow-up)</h4>
                                    <p className="text-sm">يعرض النظام هنا المرضى الذين أجروا عمليات أو كشوفات قبل 24 إلى 72 ساعة لإرسال رسائل اطمئنان أو تقييمات تلقائية، مما يعزز الثقة.</p>
                                </div>

                                <div className="space-y-4">
                                    {followUps.map(app => {
                                        const patient = patients.find(p => p.id === app.customerId);
                                        return (
                                            <div key={app.id} className="border border-slate-200 bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                                                        <Calendar className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-slate-800">{patient?.name}</h5>
                                                        <p className="text-xs text-slate-500 font-bold">تاريخ الزيارة: {app.date} | النوع: {app.type === 'urgent' ? 'طارئ' : 'كشف عادي'}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleSendFollowUp(app)}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors"
                                                >
                                                    <Send className="w-4 h-4" /> جدولة رسالة اطمئنان
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {followUps.length === 0 && (
                                        <div className="py-12 text-center text-slate-500">لا يوجد متابعات مستحقة اليوم.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
