import React, { useState, useEffect, createContext } from 'react';
import { Key, ShieldCheck, Lock, Clock, CalendarDays, Zap, Star, Shield } from 'lucide-react';
import { getDeviceFingerprint, generateActivationKey, validateActivationKey, LicenseConfig } from '../utils/fingerprint';

export const LicenseContext = createContext<LicenseConfig>({ featuresMask: 0xFFFF, packageType: 'enterprise', maxUsers: 9999, maxStudents: 9999 });

export const ActivationGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isActivated, setIsActivated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [deviceFingerprint, setDeviceFingerprint] = useState('');
    const [activationKey, setActivationKey] = useState('');
    const [error, setError] = useState('');
    const [expirationInfo, setExpirationInfo] = useState<{ isExpired: boolean; date?: Date } | null>(null);
    const [licenseConfig, setLicenseConfig] = useState<LicenseConfig>({ featuresMask: 0xFFFF, packageType: 'enterprise', maxUsers: 9999, maxStudents: 9999 });

    useEffect(() => {
        const initFingerprint = async () => {
            const fp = await getDeviceFingerprint();
            setDeviceFingerprint(fp);

            const storedKey = localStorage.getItem('app_activation_key');
            if (storedKey) {
                const validation = await validateActivationKey(fp, storedKey);
                if (validation.valid && !validation.isExpired) {
                    setLicenseConfig(validation.config || { featuresMask: 0xFFFF, packageType: 'enterprise', maxUsers: 9999, maxStudents: 9999 });
                    setIsActivated(true);
                } else {
                    setIsActivated(false);
                    if (validation.isExpired) {
                        setError('النسخة منتهية الصلاحية');
                        setExpirationInfo({ isExpired: true, date: validation.expirationDate });
                    }
                }
            } else {
                // Auto-activate for testing initially with full features
                const autoKey = await generateActivationKey(fp, 30, { featuresMask: 0xFFFF, packageType: 'enterprise', maxUsers: 9999, maxStudents: 9999 });
                localStorage.setItem('app_activation_key', autoKey);
                setLicenseConfig({ featuresMask: 0xFFFF, packageType: 'enterprise', maxUsers: 9999, maxStudents: 9999 });
                setIsActivated(true);
            }
            setIsChecking(false);
        };
        
        initFingerprint();
    }, []);

    const handleActivate = async () => {
        const validation = await validateActivationKey(deviceFingerprint, activationKey);
        
        if (validation.valid && !validation.isExpired) {
            localStorage.setItem('app_activation_key', activationKey);
            setLicenseConfig(validation.config || { featuresMask: 0xFFFF, packageType: 'enterprise', maxUsers: 9999, maxStudents: 9999 });
            setIsActivated(true);
            setError('');
        } else if (validation.valid && validation.isExpired) {
            setError('هذا المفتاح منتهي الصلاحية');
        } else {
            setError('مفتاح التفعيل غير صحيح');
        }
    };

    if (isChecking) {
        return <div className="h-screen bg-slate-900 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    if (isActivated) {
        return <LicenseContext.Provider value={licenseConfig}>{children}</LicenseContext.Provider>;
    }

    return (
        <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4 z-50 text-right overflow-y-auto" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full my-8">
                <div className="flex justify-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${expirationInfo?.isExpired ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {expirationInfo?.isExpired ? <Clock className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                    </div>
                </div>
                
                <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
                    {expirationInfo?.isExpired ? 'تجديد الاشتراك' : 'تفعيل النظام'}
                </h1>
                <p className="text-center text-slate-500 mb-8">
                    {expirationInfo?.isExpired 
                        ? 'انتهت صلاحية نسختك. يرجى إدخال مفتاح تجديد جديد.' 
                        : 'يرجى إدخال مفتاح التفعيل الخاص بجهازك للاستمرار'}
                </p>

                <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200 shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">بصمة الجهاز (Device ID):</p>
                    <div className="flex items-center justify-between">
                        <code className="text-lg font-bold text-slate-800 tracking-wider">
                            {deviceFingerprint}
                        </code>
                        <button 
                            onClick={() => navigator.clipboard.writeText(deviceFingerprint)}
                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 text-sm font-bold px-3 py-1.5 bg-indigo-50 rounded-lg transition-colors border border-indigo-100"
                        >
                            نسخ
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        مفتاح التفعيل (License Key)
                    </label>
                    <div className="relative">
                        <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={activationKey}
                            onChange={(e) => {
                                setActivationKey(e.target.value);
                                setError('');
                            }}
                            className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-mono text-left"
                            placeholder="XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                            dir="ltr"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2 font-medium">{error}</p>}
                </div>

                <button
                    onClick={handleActivate}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors mb-8 shadow-md hover:shadow-lg"
                >
                    <ShieldCheck className="w-5 h-5" />
                    {expirationInfo?.isExpired ? 'تجديد' : 'تفعيل النسخة'}
                </button>

                <div className="border-t border-slate-200 pt-6">
                    <p className="text-xs text-slate-500 font-bold mb-3 text-center uppercase tracking-wider">
                        توليد مفتاح تجريبي للتقييم
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <button
                            onClick={async () => {
                                const key = await generateActivationKey(deviceFingerprint, 14, { featuresMask: 0xFFFF, packageType: 'trial', maxUsers: 3, maxStudents: 50 });
                                setActivationKey(key);
                            }}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold py-2 px-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                            <CalendarDays className="w-4 h-4" />
                            تجربة 14 يوم (Trial)
                        </button>
                        <button
                            onClick={async () => {
                                const key = await generateActivationKey(deviceFingerprint, 365, { featuresMask: 0xFFFF, packageType: 'basic', maxUsers: 5, maxStudents: 150 });
                                setActivationKey(key);
                            }}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold py-2 px-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                            <Zap className="w-4 h-4" />
                            باقة أساسية (Basic)
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                         <button
                            onClick={async () => {
                                const key = await generateActivationKey(deviceFingerprint, 365, { featuresMask: 0xFFFF, packageType: 'pro', maxUsers: 15, maxStudents: 500 });
                                setActivationKey(key);
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold py-2 px-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                            <Star className="w-4 h-4" />
                            باقة احترافية (Pro)
                        </button>
                        <button
                            onClick={async () => {
                                const key = await generateActivationKey(deviceFingerprint, 365, { featuresMask: 0xFFFF, packageType: 'enterprise', maxUsers: 9999, maxStudents: 9999 });
                                setActivationKey(key);
                            }}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold py-2 px-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors"
                        >
                            <Shield className="w-4 h-4" />
                            مؤسسية (Enterprise)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
