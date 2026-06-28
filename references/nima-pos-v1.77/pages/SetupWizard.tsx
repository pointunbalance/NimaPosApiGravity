
import React, { useState } from 'react';
import { db } from '../db';
import { AppSettings } from '../types';
import { 
  Store, Save, ChevronRight, ChevronLeft, ShieldCheck, 
  Layers, CheckCircle2, User, KeyRound, Database, Loader2, AlertCircle,
  Printer, Monitor, Eye, EyeOff, Wrench, Globe, Percent, Users, LayoutGrid
} from 'lucide-react';
import { seedLargeDataSet } from '../db';

import { allNavItems } from '../components/layout/navigationConfig';

// Build AVAILABLE_PAGES dynamically
const AVAILABLE_PAGES = allNavItems.flatMap(section => 
  section.items.map(item => ({
    path: item.path,
    label: item.label === 'dashboard' ? 'لوحة القيادة (Dashboard)' : 
           item.label === 'pos' ? 'نقطة البيع (POS)' : 
           item.label,
    section: section.label
  }))
);

interface SetupWizardProps {
  onComplete: () => void;
  isUpdate?: boolean;
  initialSettings?: AppSettings;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete, isUpdate = false, initialSettings }) => {
  const [step, setStep] = useState(1);
  const [isSeeding, setIsSeeding] = useState(false);
  const [generateData, setGenerateData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Business Settings State
  const [businessData, setBusinessData] = useState<Partial<AppSettings>>(initialSettings || {
    storeName: 'نيما ستور',
    language: 'ar',
    currency: 'ج.م',
    currencyCode: 'EGP',
    businessType: 'retail',
    appMode: 'enterprise',
    taxRate: 0,
    address: 'القاهرة، مصر',
    phone: '01208063327',
    taxNumber: '',
    initialCapital: 100000,
    enableAccounting: true,
    hiddenPages: [],
    printerWidth: '80mm',
    autoPrint: false,
    enableQr: true,
    enableSounds: true,
    requirePinForRefund: true,
  });

  // Admin User State
  const [adminData, setAdminData] = useState({
      name: 'مدير النظام',
      pin: '12345678'
  });
  
  // Confirm PIN State
  const [confirmPin, setConfirmPin] = useState('12345678');

  // Fetch settings dynamically if we are in update mode and didn't receive initial settings
  React.useEffect(() => {
    if (isUpdate && !initialSettings) {
        db.settings.toCollection().first().then((settings) => {
            if (settings) {
                setBusinessData(settings);
            }
        }).catch(err => console.error("Could not fetch settings for setup wizard", err));
    }
  }, [isUpdate, initialSettings]);

  const [defaultEmployees, setDefaultEmployees] = useState([
      { id: '1', name: 'مدير عام', role: 'admin', pin: '1000', permissions: ['all'] },
      { id: '2', name: 'مدير فرع', role: 'manager', pin: '2000', permissions: ['/', '/pos', '/orders', '/returns', '/customers', '/products', '/warehouse', '/expenses', '/reports'] },
      { id: '3', name: 'كاشير أول', role: 'senior_cashier', pin: '3000', permissions: ['/', '/pos', '/orders', '/returns', '/daily-report'] },
      { id: '4', name: 'كاشير', role: 'cashier', pin: '4000', permissions: ['/pos'] },
      { id: '5', name: 'محاسب', role: 'accountant', pin: '5000', permissions: ['/', '/accounting', '/expenses', '/capital', '/reports', '/purchases'] },
      { id: '6', name: 'أمين مخزن', role: 'storekeeper', pin: '6000', permissions: ['/', '/products', '/warehouse', '/purchases', '/suppliers'] },
      { id: '7', name: 'شيف / طباخ', role: 'chef', pin: '7000', permissions: ['/kitchen'] },
      { id: '8', name: 'كابتن صالة', role: 'waiter', pin: '8000', permissions: ['/tables', '/pos'] },
      { id: '9', name: 'موظف توصيل', role: 'delivery', pin: '9000', permissions: ['/delivery'] },
      { id: '10', name: 'خدمة عملاء', role: 'customer_service', pin: '1111', permissions: ['/', '/customers', '/loyalty', '/installments', '/rentals', '/studio'] }
  ]);

  const BUSINESS_TYPES = [
      { id: 'retail', label: 'تجزئة (سوبر ماركت، بقالة)', hidden: ['/tables', '/kitchen', '/rentals', '/studio', '/recipes'] },
      { id: 'restaurant', label: 'مطعم / كافيه', hidden: ['/recipes', '/installments'] },
      { id: 'service', label: 'خدمات (صيانة، استشارات)', hidden: ['/kitchen', '/tables', '/recipes'] },
      { id: 'pharmacy', label: 'صيدلية', hidden: ['/kitchen', '/tables', '/rentals', '/studio', '/recipes'] },
      { id: 'clothing', label: 'ملابس وأحذية', hidden: ['/kitchen', '/tables', '/rentals', '/studio', '/recipes'] },
      { id: 'electronics', label: 'إلكترونيات وهواتف', hidden: ['/kitchen', '/tables', '/rentals', '/studio'] },
      { id: 'furniture', label: 'مفروشات وأثاث', hidden: ['/kitchen', '/tables', '/rentals', '/studio'] },
      { id: 'hardware', label: 'مواد بناء وسباكة', hidden: ['/kitchen', '/tables', '/rentals', '/studio'] },
      { id: 'salon', label: 'صالون حلاقة / تجميل', hidden: ['/kitchen', '/tables', '/recipes', '/warehouse'] },
      { id: 'gym', label: 'صالة رياضية (جيم)', hidden: ['/kitchen', '/tables', '/recipes'] },
      { id: 'clinic', label: 'عيادة طبية', hidden: ['/kitchen', '/tables', '/recipes', '/warehouse'] },
      { id: 'auto_repair', label: 'ورشة سيارات', hidden: ['/kitchen', '/tables', '/rentals', '/studio'] },
      { id: 'real_estate', label: 'عقارات', hidden: ['/kitchen', '/tables', '/recipes', '/warehouse'] },
      { id: 'travel', label: 'سياحة وسفر', hidden: ['/kitchen', '/tables', '/recipes', '/warehouse'] },
      { id: 'education', label: 'معهد تعليمي', hidden: ['/kitchen', '/tables', '/recipes'] },
      { id: 'bakery', label: 'مخبز / حلويات', hidden: ['/rentals', '/studio', '/installments'] },
      { id: 'jewelry', label: 'مجوهرات وذهب', hidden: ['/kitchen', '/tables', '/rentals', '/studio', '/recipes'] },
      { id: 'perfume', label: 'عطور ومستحضرات تجميل', hidden: ['/kitchen', '/tables', '/rentals', '/studio', '/recipes'] },
      { id: 'optics', label: 'نظارات وبصريات', hidden: ['/kitchen', '/tables', '/rentals', '/studio', '/recipes'] },
      { id: 'manufacturing', label: 'مصنع / ورشة إنتاج', hidden: ['/kitchen', '/tables', '/rentals', '/studio'] },
  ];

  const handleBusinessTypeChange = (typeId: string) => {
      const selectedType = BUSINESS_TYPES.find(t => t.id === typeId);
      if (selectedType) {
          setBusinessData(prev => ({
              ...prev,
              businessType: typeId,
              hiddenPages: selectedType.hidden
          }));
      }
  };

  const steps = [
      { id: 1, label: 'هوية المتجر', icon: Store, desc: 'الاسم والعملة' },
      { id: 2, label: 'نظام العمل', icon: Layers, desc: 'نوع النشاط والنسخة' },
      { id: 3, label: 'خصائص النظام', icon: Wrench, desc: 'تفعيل الميزات' },
      { id: 4, label: 'إدارة الصفحات', icon: Monitor, desc: 'تحديد الصفحات المفعلة' },
      { id: 5, label: 'فريق العمل', icon: Users, desc: 'المستخدمين والصلاحيات' },
      { id: 6, label: 'إعدادات الطباعة', icon: Printer, desc: 'خيارات الطابعة' },
      ...(!isUpdate ? [
          { id: 7, label: 'حساب المدير', icon: ShieldCheck, desc: 'تأمين النظام' }
      ] : []),
  ];

  const togglePageVisibility = (path: string) => {
      const currentHidden = businessData.hiddenPages || [];
      const newHidden = currentHidden.includes(path) 
          ? currentHidden.filter(p => p !== path)
          : [...currentHidden, path];
      setBusinessData(prev => ({...prev, hiddenPages: newHidden}));
  };

  const toggleSectionVisibility = (section: string, isVisible: boolean) => {
      const sectionPages = AVAILABLE_PAGES.filter(p => p.section === section).map(p => p.path);
      let newHidden = [...(businessData.hiddenPages || [])];
      
      if (isVisible) {
          newHidden = newHidden.filter(p => !sectionPages.includes(p));
      } else {
          sectionPages.forEach(p => {
              if (!newHidden.includes(p)) {
                  newHidden.push(p);
              }
          });
      }
      setBusinessData(prev => ({...prev, hiddenPages: newHidden}));
  };

  const handleNext = () => {
      setError(null);
      if (step === 1) {
          if (!businessData.storeName?.trim()) { 
              setError('يرجى إدخال اسم المتجر للمتابعة'); 
              return; 
          }
          if (!businessData.currencyCode?.trim()) { 
              setError('يرجى إدخال رمز العملة (مثلاً: IQD)'); 
              return; 
          }
      }
      setStep(prev => prev + 1);
  };

  const handleBack = () => {
      setError(null);
      setStep(prev => prev - 1);
  };

  const handleFinish = async () => {
    setError(null);
    
    if (!isUpdate) {
        if (!adminData.pin || adminData.pin.length < 8) {
            setError('يرجى إدخال رمز دخول (PIN) مكون من 8 أرقام للمدير');
            return;
        }

        if (adminData.pin !== confirmPin) {
            setError('رمز الدخول وتأكيده غير متطابقين');
            return;
        }
    }
    
    setIsSeeding(true);

    try {
        if (isUpdate && initialSettings?.id) {
            // Just update settings
            await db.settings.update(initialSettings.id, businessData);
            
            // Add default employees if they don't exist
            const existingUsers = await db.users.toArray();
            const newEmployees = defaultEmployees.filter(emp => emp.role !== 'admin' && !existingUsers.some(u => u.role === emp.role));
            if (newEmployees.length > 0) {
                const employeesToAdd = newEmployees.map(emp => ({
                    name: emp.name,
                    pin: emp.pin,
                    role: emp.role,
                    permissions: emp.permissions,
                    isActive: true
                }));
                await db.users.bulkAdd(employeesToAdd as any);
            }
        } else {
            // Clear previous data to prevent conflicts
            await db.settings.clear();
            await db.users.clear();

            // 1. Save Settings
            await db.settings.add({
                ...businessData,
                dbConfig: { activeProfileId: 'local', profiles: [], autoBackup: false }
            } as AppSettings);
            
            // 2. Create Admin User
            const adminUser = {
                name: adminData.name,
                pin: adminData.pin,
                role: 'admin',
                permissions: ['all'],
                isActive: true
            };
            
            const userId = await db.users.add(adminUser as any);

            // Create other default employees
            const otherEmployees = defaultEmployees.filter(emp => emp.role !== 'admin').map(emp => ({
                name: emp.name,
                pin: emp.pin,
                role: emp.role,
                permissions: emp.permissions,
                isActive: true
            }));
            await db.users.bulkAdd(otherEmployees as any);

            // 3. Generate Test Data if requested
            if (generateData) {
                await seedLargeDataSet();
            }
            
            // 4. Auto Login Session
            localStorage.setItem('nima_user', JSON.stringify({ ...adminUser, id: userId }));
        }
        
        onComplete();
    } catch (e: any) {
        console.error(e);
        setError('حدث خطأ أثناء حفظ الإعدادات: ' + (e.message || 'خطأ غير معروف'));
        setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Tajawal']" dir="rtl">
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] h-[90vh]">
            
            {/* Right Side: Stepper (Sidebar) */}
            <div className="w-full md:w-80 bg-slate-50 border-l border-slate-100 p-8 flex flex-col overflow-y-auto shrink-0">
                <div className="mb-10">
                    <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-200">
                        <Store className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-800">إعداد النظام</h1>
                    <p className="text-slate-500 text-sm mt-1">Nima POS Setup</p>
                </div>

                <div className="space-y-6 flex-1">
                    {steps.map((s) => {
                        const isActive = step === s.id;
                        const isCompleted = step > s.id;
                        
                        return (
                            <div key={s.id} className="flex items-center gap-4 relative">
                                {/* Connector Line */}
                                {s.id !== steps.length && (
                                    <div className={`absolute top-10 right-5 w-0.5 h-8 ${isCompleted ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
                                )}
                                
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white shadow-lg scale-110' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-sm ${isActive ? 'text-indigo-600' : 'text-slate-700'}`}>{s.label}</h3>
                                    <p className="text-[10px] text-slate-400">{s.desc}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-auto pt-6 border-t border-slate-200 text-center">
                   <p className="text-[10px] text-slate-400">© 2024 Nima POS System</p>
                </div>
            </div>

            {/* Left Side: Content Form */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 pb-4 custom-scrollbar flex flex-col">
                
                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-2 shrink-0">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            {error}
                        </div>
                    )}

                {/* Step 1: Basic Info */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-left-8 flex-1">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">تفاصيل المنشأة</h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">اسم المتجر / الشركة <span className="text-red-500">*</span></label>
                                <input 
                                    type="text"
                                    className="w-full border-2 border-slate-200 bg-white p-4 rounded-xl outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-lg text-slate-900"
                                    value={businessData.storeName}
                                    onChange={e => setBusinessData(prev => ({...prev, storeName: e.target.value}))}
                                    placeholder="مثال: أسواق النور"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">العملة الرئيسية <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text"
                                        className="w-full border-2 border-slate-200 bg-white p-4 rounded-xl outline-none focus:border-indigo-600 font-bold text-slate-900"
                                        value={businessData.currencyCode}
                                        onChange={e => setBusinessData(prev => ({...prev, currencyCode: e.target.value}))}
                                        placeholder="IQD"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">رقم الهاتف (اختياري)</label>
                                    <input 
                                        type="tel"
                                        className="w-full border-2 border-slate-200 bg-white p-4 rounded-xl outline-none focus:border-indigo-600 font-bold text-slate-900"
                                        value={businessData.phone}
                                        onChange={e => setBusinessData(prev => ({...prev, phone: e.target.value}))}
                                        placeholder="07..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">الرقم الضريبي (اختياري)</label>
                                    <input 
                                        type="text"
                                        className="w-full border-2 border-slate-200 bg-white p-4 rounded-xl outline-none focus:border-indigo-600 font-bold text-slate-900"
                                        value={businessData.taxNumber || ''}
                                        onChange={e => setBusinessData(prev => ({...prev, taxNumber: e.target.value}))}
                                        placeholder="الرقم الضريبي"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">العنوان</label>
                                <input 
                                    type="text"
                                    className="w-full border-2 border-slate-200 bg-white p-4 rounded-xl outline-none focus:border-indigo-600 font-bold text-slate-900"
                                    value={businessData.address}
                                    onChange={e => setBusinessData(prev => ({...prev, address: e.target.value}))}
                                    placeholder="المدينة، المنطقة..."
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: System Mode */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-left-8 flex-1">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">تخصيص النظام</h2>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-3">مجال العمل (نوع النشاط)</label>
                            <select 
                                value={businessData.businessType}
                                onChange={e => handleBusinessTypeChange(e.target.value)}
                                className="w-full border-2 border-slate-200 bg-white p-4 rounded-xl outline-none focus:border-indigo-600 font-bold text-slate-900 mb-6"
                            >
                                {BUSINESS_TYPES.map(type => (
                                    <option key={type.id} value={type.id}>{type.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-3">حجم المنشأة (نسخة النظام)</label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'starter', label: 'مبتدئ (Starter)', desc: 'نقطة بيع سريعة' },
                                    { id: 'standard', label: 'قياسي (Standard)', desc: 'مبيعات + مخزون' },
                                    { id: 'service', label: 'خدمي (Service)', desc: 'حجوزات وخدمات' },
                                    { id: 'enterprise', label: 'مؤسسة (Enterprise)', desc: 'نظام كامل وشامل' },
                                ].map(mode => (
                                    <div 
                                        key={mode.id}
                                        onClick={() => setBusinessData(prev => ({...prev, appMode: mode.id as any}))}
                                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${
                                            businessData.appMode === mode.id 
                                            ? 'border-indigo-600 bg-indigo-50 shadow-md' 
                                            : 'border-slate-100 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                        <p className={`font-bold ${businessData.appMode === mode.id ? 'text-indigo-800' : 'text-slate-700'}`}>{mode.label}</p>
                                        <p className="text-xs text-slate-500 mt-1">{mode.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5 mb-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">لغة النظام</label>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setBusinessData(prev => ({...prev, language: 'ar'}))}
                                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${businessData.language === 'ar' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                                    >
                                        العربية
                                    </button>
                                    <button 
                                        onClick={() => setBusinessData(prev => ({...prev, language: 'en'}))}
                                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${businessData.language === 'en' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}
                                    >
                                        English
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">رأس المال التأسيسي</label>
                                <input 
                                    type="number" onFocus={(e) => e.target.select()} 
                                    value={businessData.initialCapital || ''}
                                    onChange={e => setBusinessData(prev => ({...prev, initialCapital: Number(e.target.value)}))}
                                    className="w-full border-2 border-slate-200 bg-white p-3.5 rounded-xl outline-none focus:border-indigo-600 font-bold text-slate-900"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={businessData.enableAccounting}
                                    onChange={e => setBusinessData(prev => ({...prev, enableAccounting: e.target.checked}))}
                                    className="w-5 h-5 accent-indigo-600 bg-white border-gray-300 rounded"
                                />
                                <div>
                                    <span className="font-bold text-slate-800 block">تفعيل النظام المحاسبي</span>
                                    <span className="text-xs text-slate-500">قيود يومية، شيكات، ومراكز تكلفة</span>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                {/* Step 3: System Features */}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-left-8 flex-1">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">خصائص النظام</h2>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={businessData.enableSounds}
                                        onChange={e => setBusinessData(prev => ({...prev, enableSounds: e.target.checked}))}
                                        className="w-5 h-5 accent-indigo-600 bg-white border-gray-300 rounded"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-800 block">تفعيل الأصوات</span>
                                        <span className="text-xs text-slate-500">مؤثرات صوتية للإشعارات والعمليات</span>
                                    </div>
                                </label>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={businessData.requirePinForRefund}
                                        onChange={e => setBusinessData(prev => ({...prev, requirePinForRefund: e.target.checked}))}
                                        className="w-5 h-5 accent-indigo-600 bg-white border-gray-300 rounded"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-800 block">طلب PIN عند الاسترجاع</span>
                                        <span className="text-xs text-slate-500">حماية عمليات استرجاع الأموال برمز المدير</span>
                                    </div>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">نسبة الضريبة الافتراضية (%)</label>
                                <div className="relative">
                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input 
                                        type="number" onFocus={(e) => e.target.select()} 
                                        min="0"
                                        value={businessData.taxRate}
                                        onChange={e => setBusinessData(prev => ({...prev, taxRate: Number(e.target.value)}))}
                                        className="w-full pr-10 pl-4 border-2 border-slate-200 bg-white p-4 rounded-xl outline-none focus:border-indigo-600 font-bold text-slate-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Page Management */}
                {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-left-8 flex-1">
                        <div className="mb-4">
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                <LayoutGrid className="w-6 h-6 text-indigo-600" />
                                إدارة الأقسام والصفحات
                            </h2>
                            <p className="text-slate-500 mt-2">حدد الموديولات والصفحات التي ترغب في تفعيلها. يمكنك تخصيص الواجهة لتناسب احتياجات منشأتك لتسهيل العمل.</p>
                        </div>
                        
                        <div className="space-y-4">
                            {allNavItems.map((section, sectionIdx) => {
                                const sectionPages = section.items;
                                const hiddenCount = sectionPages.filter(p => businessData.hiddenPages?.includes(p.path)).length;
                                const isAllVisible = hiddenCount === 0;

                                return (
                                    <div key={`section-${sectionIdx}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between p-4 bg-slate-50/80 border-b border-slate-100">
                                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <Layers className="w-5 h-5 text-indigo-500" />
                                                {section.label}
                                            </h3>
                                            <label className="flex items-center gap-3 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                                                <span className={`text-sm font-bold ${isAllVisible ? 'text-indigo-700' : 'text-slate-500'}`}>
                                                    {isAllVisible ? 'مفعل بالكامل' : hiddenCount === sectionPages.length ? 'معطل' : 'مفعل جزئياً'}
                                                </span>
                                                <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out ${isAllVisible ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                                    <div className={`absolute top-0.5 bottom-0.5 w-4 rounded-full bg-white transition-all duration-200 ease-in-out shadow-sm ${isAllVisible ? 'rtl:right-5 rtl:left-auto right-1' : 'rtl:right-1 rtl:left-auto left-1'}`} />
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isAllVisible}
                                                    onChange={() => toggleSectionVisibility(section.label, !isAllVisible)}
                                                    className="sr-only"
                                                />
                                            </label>
                                        </div>
                                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {sectionPages.map((page, idx) => {
                                                const isHidden = businessData.hiddenPages?.includes(page.path) || false;
                                                const Icon = page.icon || Eye;
                                                
                                                // Handle nested pages mapping for translations
                                                let pageLabel = page.label;
                                                if(pageLabel === 'dashboard') pageLabel = 'لوحة القيادة';
                                                if(pageLabel === 'pos') pageLabel = 'نقطة البيع';
                                                if(pageLabel === 'settings') pageLabel = 'الإعدادات';
                                                
                                                return (
                                                    <label 
                                                        key={`${page.path}-${idx}`} 
                                                        className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer select-none group ${
                                                            !isHidden 
                                                                ? 'bg-indigo-50/30 border-indigo-200 hover:border-indigo-300' 
                                                                : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 opacity-60 hover:opacity-100 grayscale hover:grayscale-0'
                                                        }`}
                                                    >
                                                        <div className="mt-1 shrink-0">
                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                                !isHidden ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 group-hover:border-slate-400'
                                                            }`}>
                                                                {!isHidden && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                            </div>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={!isHidden}
                                                                onChange={() => togglePageVisibility(page.path)}
                                                                className="sr-only"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-3 w-full">
                                                            <div className={`p-2 rounded-lg shrink-0 transition-colors ${!isHidden ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                                                                <Icon className="w-4 h-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`font-bold text-sm leading-snug ${!isHidden ? 'text-indigo-950' : 'text-slate-600'}`}>{pageLabel}</p>
                                                                <p className="text-[10px] text-slate-400 mt-1 break-all" dir="ltr">{page.path}</p>
                                                            </div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Step 5: Default Team */}
                {step === 5 && (
                    <div className="animate-in fade-in slide-in-from-left-8 flex-1">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">فريق العمل الافتراضي</h2>
                        <p className="text-slate-500 mb-6">سيتم إنشاء الحسابات التالية بصلاحيات مخصصة لتسهيل إدارة النظام. يمكنك تعديل أرقام الدخول (PIN) الآن أو لاحقاً من الإعدادات.</p>
                        
                        <div className="space-y-4">
                            {defaultEmployees.filter(emp => emp.role !== 'admin').map((emp, index) => (
                                <div key={emp.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{emp.name}</h3>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {emp.permissions.map(p => {
                                                    const page = AVAILABLE_PAGES.find(ap => ap.path === p);
                                                    return page ? (
                                                        <span key={p} className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                                            {page.label}
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 w-full md:w-32">
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1">رمز الدخول (PIN)</label>
                                        <input 
                                            type="text"
                                            value={emp.pin}
                                            onChange={e => {
                                                const newEmployees = [...defaultEmployees];
                                                const actualIndex = defaultEmployees.findIndex(e2 => e2.id === emp.id);
                                                if (actualIndex > -1) {
                                                    newEmployees[actualIndex].pin = e.target.value;
                                                    setDefaultEmployees(newEmployees);
                                                }
                                            }}
                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-bold text-center tracking-widest"
                                            maxLength={8}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 6: Printer Settings */}
                {step === 6 && (
                    <div className="animate-in fade-in slide-in-from-left-8 flex-1">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">إعدادات الطباعة</h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">حجم ورق الطابعة</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div 
                                        onClick={() => setBusinessData(prev => ({...prev, printerWidth: '80mm'}))}
                                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${businessData.printerWidth === '80mm' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                    >
                                        <Printer className={`w-8 h-8 ${businessData.printerWidth === '80mm' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <span className="font-bold text-slate-700">80mm (كبير)</span>
                                    </div>
                                    <div 
                                        onClick={() => setBusinessData(prev => ({...prev, printerWidth: '58mm'}))}
                                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${businessData.printerWidth === '58mm' ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                    >
                                        <Printer className={`w-6 h-6 ${businessData.printerWidth === '58mm' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <span className="font-bold text-slate-700">58mm (صغير)</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={businessData.autoPrint}
                                        onChange={e => setBusinessData(prev => ({...prev, autoPrint: e.target.checked}))}
                                        className="w-5 h-5 accent-indigo-600"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-800 block">الطباعة التلقائية</span>
                                        <span className="text-xs text-slate-500">طباعة الفاتورة تلقائياً عند الدفع</span>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={businessData.enableQr}
                                        onChange={e => setBusinessData(prev => ({...prev, enableQr: e.target.checked}))}
                                        className="w-5 h-5 accent-indigo-600"
                                    />
                                    <div>
                                        <span className="font-bold text-slate-800 block">تفعيل رمز الاستجابة السريعة (QR)</span>
                                        <span className="text-xs text-slate-500">طباعة رمز QR متوافق مع هيئة الزكاة والضريبة</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 7: Admin & Data (Only on first setup) */}
                {step === 7 && !isUpdate && (
                    <div className="animate-in fade-in slide-in-from-left-8 flex-1">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">تأمين حساب المدير</h2>
                        
                        <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 mb-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">اسم المدير</label>
                                <div className="relative">
                                    <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                                    <input 
                                        type="text"
                                        className="w-full pl-4 pr-12 py-3 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900"
                                        value={adminData.name}
                                        onChange={e => setAdminData(prev => ({...prev, name: e.target.value}))}
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">رمز الدخول (PIN) <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
                                        <input 
                                            type="tel"
                                            className="w-full pl-4 pr-12 py-3 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold tracking-widest text-slate-900"
                                            value={adminData.pin}
                                            onChange={e => setAdminData(prev => ({...prev, pin: e.target.value}))}
                                            placeholder="********"
                                            maxLength={8}
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">تأكيد الرمز <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <KeyRound className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 opacity-50" />
                                        <input 
                                            type="tel"
                                            className={`w-full pl-4 pr-12 py-3 bg-white border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold tracking-widest text-slate-900 ${confirmPin && confirmPin !== adminData.pin ? 'border-red-300 ring-2 ring-red-100' : 'border-indigo-200'}`}
                                            value={confirmPin}
                                            onChange={e => setConfirmPin(e.target.value)}
                                            placeholder="****"
                                            maxLength={6}
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <p className="text-xs text-slate-500 mt-2">يستخدم هذا الرمز لتسجيل الدخول والوصول للإعدادات الحساسة.</p>
                        </div>

                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-colors" onClick={() => setGenerateData(!generateData)}>
                            <label className="flex items-center gap-3 cursor-pointer pointer-events-none">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${generateData ? 'bg-emerald-600 border-emerald-600' : 'border-emerald-300 bg-white'}`}>
                                    {generateData && <CheckCircle2 className="w-4 h-4 text-white" />}
                                </div>
                                <div>
                                    <span className="font-bold text-emerald-900 block flex items-center gap-2">
                                        <Database className="w-4 h-4"/> توليد بيانات تجريبية
                                    </span>
                                    <span className="text-xs text-emerald-700">إضافة منتجات، عملاء، وفواتير وهمية لتجربة النظام فوراً.</span>
                                </div>
                            </label>
                        </div>
                    </div>
                )}

                </div> {/* End Scrollable Content Area */}

                {/* Footer Buttons */}
                <div className="flex justify-between items-center px-8 md:px-12 py-6 border-t border-slate-100 bg-white shrink-0 mt-auto">
                    {step > 1 ? (
                        <button 
                            type="button"
                            onClick={handleBack} 
                            className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 flex items-center gap-2 transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" /> سابق
                        </button>
                    ) : (
                        <div></div>
                    )}
                    
                    {step < (isUpdate ? 6 : 7) ? (
                        <button 
                            type="button"
                            onClick={handleNext} 
                            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all hover:scale-105"
                        >
                            التالي <ChevronLeft className="w-5 h-5" />
                        </button>
                    ) : (
                        <button 
                            type="button"
                            onClick={handleFinish} 
                            disabled={isSeeding}
                            className="px-10 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all hover:scale-105 disabled:opacity-70 disabled:cursor-wait"
                        >
                            {isSeeding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {isSeeding ? 'جاري الحفظ...' : (isUpdate ? 'حفظ التعديلات' : 'بدء الاستخدام')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default SetupWizard;
