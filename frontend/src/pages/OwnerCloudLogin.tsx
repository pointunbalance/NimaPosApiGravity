import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, ShieldCheck, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';

export const OwnerCloudLogin: React.FC = () => {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<1 | 2>(1);
    const [isLoading, setIsLoading] = useState(false);
    const { success, error } = useToast();
    const navigate = useNavigate();

    const handleSendOTP = (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 10) {
            error('أدخل رقم هاتف صحيح');
            return;
        }
        setIsLoading(true);
        // Simulate API call to send OTP
        setTimeout(() => {
            setIsLoading(false);
            setStep(2);
            success('تم إرسال رمز التحقق (للتجربة: استخدم 12345678)');
        }, 1200);
    };

    const handleVerifyOTP = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API verification
        setTimeout(() => {
            setIsLoading(false);
            if (otp === '12345678') {
                success('تم تسجيل الدخول بنجاح');
                // Set a simulated owner session
                localStorage.setItem('nima_owner_session', 'true');
                navigate('/owner-cloud/dashboard');
            } else {
                error('رمز التحقق غير صحيح');
            }
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
            {/* Cloud/Network aesthetic background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl mix-blend-multiply pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-indigo-500/5 rotate-45 pointer-events-none"></div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 shadow-xl w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                        <ShieldCheck className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">المركز السحابي الآمن</h1>
                    <p className="text-slate-500 text-sm mt-2">تسجيل الدخول لمالك السلسلة (Owner Portal)</p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSendOTP} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف المحمول</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <Smartphone className="w-5 h-5 text-slate-400" />
                                </span>
                                <input 
                                    type="tel" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 pr-10 pl-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono text-left placeholder-slate-400"
                                    placeholder="+20 100 000 0000"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                            إرسال رمز التحقق (OTP)
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOTP} className="space-y-6 animate-in fade-in slide-in-from-left-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">أدخل رمز التحقق (OTP)</label>
                            <p className="text-xs text-slate-500 mb-3">تم إرسال كود إلى {phone}</p>
                            <div className="relative">
                                <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <KeyRound className="w-5 h-5 text-slate-400" />
                                </span>
                                <input 
                                    type="text" 
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={8}
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 pr-10 pl-4 text-center tracking-[1em] text-xl font-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-300"
                                    placeholder="--------"
                                    dir="ltr"
                                />
                            </div>
                            <button type="button" onClick={() => setStep(1)} className="text-xs text-indigo-600 mt-2 hover:text-indigo-700">
                                تغيير رقم الهاتف؟
                            </button>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading || otp.length < 8}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                            التحقق والدخول
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
};
