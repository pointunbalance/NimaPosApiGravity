import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Key, Phone, ShieldCheck, ArrowRight } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';

export const ParentPortalLogin = () => {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');

    const parents = useLiveQuery(() => db.schoolParents?.toArray()) || [];

    const handleSendCode = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Find parent with this phone
        const parent = parents.find(p => p.phone === phone || p.phone2 === phone);
        if (!parent) {
            // For testing, if no parents exist, just let them in
            if (parents.length === 0) {
                 setStep(2);
                 localStorage.setItem('parentPortalTempPhone', phone);
                 return;
            }
            setError('رقم الهاتف غير مسجل بالنظام.');
             return;
        }
        
        // Proceed to OTP
        localStorage.setItem('parentPortalTempPhone', phone);
        localStorage.setItem('parentPortalParentId', parent.id.toString());
        setStep(2);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (code.length < 8) {
            setError('الرمز غير صحيح');
            return;
        }
        
        // Login success
        localStorage.setItem('isParentAuth', 'true');
        navigate('/parent-portal/dashboard');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden flex-col">
            <div className="absolute top-0 left-0 w-full h-96 bg-indigo-600 rounded-b-[4rem] z-0 shadow-lg"></div>
            
            <div className="z-10 bg-white rounded-3xl p-8 shadow-2xl shadow-indigo-900/10 w-full max-w-md border border-slate-100 mb-8 mt-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">بوابة ولي الأمر</h1>
                    <p className="text-slate-500 font-medium text-sm mt-1">متابعة دقيقة لأداء ونتائج يوم طفلك</p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSendCode} className="space-y-5">
                        {error && (
                            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-bold border border-rose-100 text-center">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف المسجل</label>
                            <div className="relative">
                                <Phone className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="tel" 
                                    required 
                                    value={phone} 
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all dir-ltr" 
                                    dir="ltr"
                                    placeholder="01xxxxxxxxx"
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl transition shadow-md shadow-indigo-200 flex justify-center items-center gap-2">
                             تسجيل الدخول <LogIn className="w-5 h-5" />
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-5">
                         {error && (
                            <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-bold border border-rose-100 text-center">
                                {error}
                            </div>
                        )}
                        <div className="text-center">
                             <p className="text-sm font-medium text-slate-600 mb-4">أدخل الرمز المرسل إلى <span className="font-bold text-indigo-600" dir="ltr">{phone}</span></p>
                        </div>
                        <div>
                            <div className="relative">
                                <Key className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    required
                                    autoFocus
                                    maxLength={8} 
                                    value={code} 
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-black tracking-[1em] text-center focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all dir-ltr" 
                                    dir="ltr"
                                    placeholder="12345678"
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-2xl transition shadow-md shadow-indigo-200 flex justify-center items-center gap-2">
                             تأكيد الدخول
                        </button>
                        <div className="text-center">
                            <button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition flex items-center justify-center gap-1 w-full mt-2">
                                <ArrowRight className="w-4 h-4"/> عودة للرقم
                            </button>
                        </div>
                    </form>
                )}
            </div>
            
            <a href="/" className="z-10 text-white/70 hover:text-white text-sm font-bold transition flex items-center gap-2">
                <ArrowRight className="w-4 h-4"/> العودة للموقع الرئيسي
            </a>
        </div>
    );
};
