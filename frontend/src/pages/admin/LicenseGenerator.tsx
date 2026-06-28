import React, { useState } from 'react';
import { Key, Shield, CalendarDays, Copy, RefreshCw, CheckCircle2, Users, FileText } from 'lucide-react';
import { generateActivationKey, APP_MODULES, LicenseConfig } from '../../utils/fingerprint';

const LicenseGenerator: React.FC = () => {
    const [deviceId, setDeviceId] = useState('');
    const [duration, setDuration] = useState(30);
    const [packageType, setPackageType] = useState<LicenseConfig['packageType']>('enterprise');
    const [maxUsers, setMaxUsers] = useState(9999);
    const [maxStudents, setMaxStudents] = useState(9999);
    const [generatedKey, setGeneratedKey] = useState('');
    const [isCopied, setIsCopied] = useState(false);
    const [selectedFeatures, setSelectedFeatures] = useState<number[]>([]);

    const toggleFeature = (bit: number) => {
        if (selectedFeatures.includes(bit)) {
            setSelectedFeatures(selectedFeatures.filter(b => b !== bit));
        } else {
            setSelectedFeatures([...selectedFeatures, bit]);
        }
    };

    const handleGenerate = async () => {
        if (!deviceId) return;

        // Create bitmask
        let mask = 0;
        if (selectedFeatures.length === 0) {
            mask = 0xFFFF; // Default to all if none selected
        } else {
            selectedFeatures.forEach(bit => {
                mask |= (1 << bit);
            });
        }

        const config: LicenseConfig = {
             featuresMask: mask,
             packageType,
             maxUsers,
             maxStudents
        };

        const key = await generateActivationKey(deviceId, duration, config);
        setGeneratedKey(key);
        setIsCopied(false);
    };

    const handleCopy = () => {
        if (generatedKey) {
            navigator.clipboard.writeText(generatedKey);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto" dir="rtl">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Shield className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800">مولد التراخيص ومفاتيح التفعيل</h1>
                    <p className="text-slate-500 font-medium">نظام إدارة وتوليد مفاتيح الوصول والباقات (إصدار V5)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="font-bold text-lg text-slate-800 mb-4 border-b pb-2">بيانات الترخيص الأساسية</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">بصمة الجهاز (Device ID)</label>
                            <input 
                                type="text" 
                                value={deviceId}
                                onChange={(e) => setDeviceId(e.target.value.toUpperCase())}
                                placeholder="أدخل بصمة الجهاز..."
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-mono text-left"
                                dir="ltr"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">مدة الصلاحية (بالأيام)</label>
                            <select 
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value={14}>نسخة تجريبية (14 يوم)</option>
                                <option value={30}>شهر واحد (30 يوم)</option>
                                <option value={180}>6 أشهر (180 يوم)</option>
                                <option value={365}>سنة واحدة (365 يوم)</option>
                                <option value={730}>سنتان (730 يوم)</option>
                                <option value={3650}>مفتوح (10 سنوات)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="font-bold text-lg text-slate-800 mb-4 border-b pb-2">حدود وبيانات الباقة المخصصة</h2>
                    <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">نوع الباقة (التسويقية)</label>
                            <select 
                                value={packageType}
                                onChange={(e) => setPackageType(e.target.value as any)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <option value="trial">تجريبية (Trial)</option>
                                <option value="basic">الأساسية (Basic)</option>
                                <option value="pro">الاحترافية (Pro)</option>
                                <option value="enterprise">مؤسسية (Enterprise)</option>
                            </select>
                         </div>
                         <div className="flex gap-4">
                             <div className="flex-1">
                                <label className="block text-sm font-bold text-slate-700 mb-1">أقصى عدد مستخدمين</label>
                                <div className="relative">
                                    <Users className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="number" 
                                        min="1" max="4000"
                                        value={maxUsers === 9999 ? '' : maxUsers}
                                        onChange={(e) => setMaxUsers(e.target.value ? Number(e.target.value) : 9999)}
                                        placeholder="غير محدود (9999)"
                                        className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                             </div>
                             <div className="flex-1">
                                <label className="block text-sm font-bold text-slate-700 mb-1">أقصى عدد أطفال مسجلين</label>
                                <div className="relative">
                                    <FileText className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="number" 
                                        min="1" max="65000"
                                        value={maxStudents === 9999 ? '' : maxStudents}
                                        onChange={(e) => setMaxStudents(e.target.value ? Number(e.target.value) : 9999)}
                                        placeholder="غير محدود (9999)"
                                        className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                             </div>
                         </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2">
                    <h2 className="font-bold text-lg text-slate-800 mb-4 border-b pb-2">أقسام التطبيق المسموحة (Modules)</h2>
                    <p className="text-xs text-slate-500 mb-4">اذا لم تختر أي قسم، سيتم السماح بجميع الأقسام.</p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {APP_MODULES.map(mod => (
                            <label key={mod.bit} className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-indigo-50 rounded-lg cursor-pointer border border-transparent hover:border-indigo-200 transition-colors">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-indigo-600 rounded"
                                    checked={selectedFeatures.includes(mod.bit)}
                                    onChange={() => toggleFeature(mod.bit)}
                                />
                                <span className="text-sm font-bold text-slate-700 truncate">{mod.label}</span>
                            </label>
                        ))}
                    </div>
                    
                </div>
            </div>
            
            <div className="bg-white p-6 justify-center flex flex-col rounded-2xl shadow-sm border border-slate-200">
                <button 
                    onClick={handleGenerate}
                    disabled={!deviceId}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-6 text-lg"
                >
                    <RefreshCw className="w-6 h-6" />
                    إنشاء مفتاح التفعيل
                </button>

                {generatedKey && (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-slate-200 p-6 relative animate-in fade-in zoom-in-95">
                        <p className="text-sm font-bold text-slate-500 mb-3 absolute top-4 right-4">المفتاح الجاهز:</p>
                        <div className="bg-white p-4 rounded-xl border-2 border-indigo-100 shadow-inner w-full text-center mt-6 mb-4">
                            <p className="font-mono text-xl font-bold text-indigo-900 break-all select-all leading-loose bg-indigo-50/50 p-4 rounded-lg" dir="ltr">
                                {generatedKey}
                            </p>
                        </div>
                        <button 
                            onClick={handleCopy}
                            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${isCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-800 text-white hover:bg-slate-900 shadow-lg'}`}
                        >
                            {isCopied ? <><CheckCircle2 className="w-5 h-5" /> تم النسخ بنجاح</> : <><Copy className="w-5 h-5" /> نسخ المفتاح للإرسال</>}
                        </button>
                    </div>
                )}
            </div>
            
            <div className="mt-6 bg-amber-50 border border-amber-100 rounded-2xl p-5">
                <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    تعليمات أمنية
                </h3>
                <ul className="list-disc list-inside text-amber-700 text-sm space-y-1">
                    <li>لا تشارك هذا النظام مع أشخاص غير مصرح لهم بمبيعات وتفعيلات النظام.</li>
                    <li>المفاتيح المولدة ترتبط بشكل وثيق ببصمة الجهاز والأقسام المحددة، ولا يمكن تغيير الأقسام بعد التفعيل.</li>
                    <li>إذا حاول المستخدم التلاعب بالتاريخ، سيكتشف النظام ذلك إذا كان المفتاح مشفراً بتوقيت الخادم لاحقاً.</li>
                </ul>
            </div>
        </div>
    );
};

export default LicenseGenerator;
