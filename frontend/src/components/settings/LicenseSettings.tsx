import React, { useContext, useState, useEffect } from 'react';
import { LicenseContext } from '../ActivationGuard';
import { Key, ShieldCheck, Zap, Star, Shield, Users, RefreshCw, CalendarOff } from 'lucide-react';
import { getDeviceFingerprint, validateActivationKey } from '../../utils/fingerprint';

export const LicenseSettings: React.FC = () => {
    const licenseConfig = useContext(LicenseContext);
    const [deviceFingerprint, setDeviceFingerprint] = useState('');
    const [activationKey, setActivationKey] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        getDeviceFingerprint().then(setDeviceFingerprint);
        const storedKey = localStorage.getItem('app_activation_key') || '';
        setActivationKey(storedKey);
    }, []);

    const handleUpdateLicense = async () => {
        const validation = await validateActivationKey(deviceFingerprint, activationKey);
        
        if (validation.valid && !validation.isExpired) {
            localStorage.setItem('app_activation_key', activationKey);
            setMessage('تم تحديث الترخيص بنجاح. أعد تشغيل التطبيق لتطبيق التغييرات.');
            setError('');
            setTimeout(() => { window.location.reload(); }, 2000);
        } else if (validation.valid && validation.isExpired) {
            setError('هذا المفتاح منتهي الصلاحية');
            setMessage('');
        } else {
            setError('مفتاح التفعيل غير صحيح');
            setMessage('');
        }
    };

    const getPackageIcon = () => {
        if (licenseConfig.packageType === 'basic') return <Zap className="w-8 h-8 text-blue-500" />;
        if (licenseConfig.packageType === 'pro') return <Star className="w-8 h-8 text-emerald-500" />;
        if (licenseConfig.packageType === 'enterprise') return <Shield className="w-8 h-8 text-indigo-500" />;
        return <ShieldCheck className="w-8 h-8 text-amber-500" />;
    };

    const getPackageName = () => {
        if (licenseConfig.packageType === 'basic') return 'الباقة الأساسية (Basic)';
        if (licenseConfig.packageType === 'pro') return 'الباقة الاحترافية (Pro)';
        if (licenseConfig.packageType === 'enterprise') return 'باقة المؤسسات (Enterprise)';
        return 'إصدار تجريبي (Trial)';
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="border-b pb-4 mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Key className="w-6 h-6 text-indigo-600" />
                    تفاصيل الترخيص والاشتراك
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                    إدارة رخصة النظام والصلاحيات المرتبطة بالاستخدام
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Current License Details */}
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                            {getPackageIcon()}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">{getPackageName()}</h3>
                            <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium mt-1">
                                <ShieldCheck className="w-4 h-4" /> رخصة نشطة وفعالة
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <div className="flex justify-between items-center py-2 border-b border-slate-200/60">
                             <span className="text-slate-600">أقصى عدد مسجلين (أطفال)</span>
                             <span className="font-bold text-slate-800">{licenseConfig.maxStudents === 9999 ? 'غير محدود' : licenseConfig.maxStudents}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-200/60">
                             <span className="text-slate-600">أقصى عدد مستخدمين (موظفين)</span>
                             <span className="font-bold text-slate-800">{licenseConfig.maxUsers === 9999 ? 'غير محدود' : licenseConfig.maxUsers}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 border-b border-slate-200/60">
                             <span className="text-slate-600">خصائص النظام المفتوحة</span>
                             <span className="font-bold text-indigo-600">{licenseConfig.featuresMask === 0xFFFF ? 'كاملة' : 'محددة'}</span>
                         </div>
                         <div className="flex justify-between items-center py-2 text-rose-600">
                             <span className="flex items-center gap-1"><CalendarOff className="w-4 h-4" /> تنبيه</span>
                             <span className="text-sm font-medium">سيتوقف النظام فور انتهاء الرخصة الممنوحة ولن يفتح إلا بمفتاح مجدد.</span>
                         </div>
                    </div>
                </div>

                {/* Update License */}
                <div className="bg-indigo-50/50 rounded-xl p-6 border border-indigo-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">تحديث الاستراك</h3>
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                        عند انتهاء مدة الاشتراك، أو ترقية الباقة لزيادة عدد المستخدمين والأطفال، 
                        يرجى تزويد الدعم الفني ببصمة الجهاز التالية للحصول على مفتاح التفعيل الجديد.
                    </p>

                    <div className="mb-4">
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">بصمة الجهاز (Device ID)</label>
                         <div className="flex gap-2">
                             <code className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono text-sm break-all">
                                 {deviceFingerprint}
                             </code>
                             <button
                                 onClick={() => navigator.clipboard.writeText(deviceFingerprint)}
                                 className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition"
                             >
                                 نسخ
                             </button>
                         </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">مفتاح التفعيل الجديد</label>
                        <input
                            type="text"
                            value={activationKey}
                            onChange={(e) => setActivationKey(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm font-mono text-left outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="أدخل مفتاح التفعيل هنا..."
                            dir="ltr"
                        />
                    </div>

                    {message && <div className="mt-4 p-3 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-lg">{message}</div>}
                    {error && <div className="mt-4 p-3 bg-red-100 text-red-700 text-sm font-medium rounded-lg">{error}</div>}

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleUpdateLicense}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition shadow-sm"
                        >
                            <RefreshCw className="w-5 h-5" />
                            تحديث وتفعيل الرخصة
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
