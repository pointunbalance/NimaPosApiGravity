import React, { useState, useEffect } from 'react';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { AppSettings } from '../../types';
import { 
    LayoutGrid, Calculator, Users, ShoppingCart, Target, HeartHandshake, 
    Wrench, Ruler, Briefcase, Scale, Layers, Box, Truck, BarChart3, ShieldCheck, Check, Info, Utensils,
    ShoppingBag, Scissors, Camera, GraduationCap, Building2, Heart, Activity
} from 'lucide-react';
import { t } from '../../utils/i18n';

// Definition of high-level modules mapped to page paths
const MODULES = [
    { 
        id: 'sales', 
        label: 'المبيعات والطلبات', 
        icon: ShoppingCart, 
        description: 'إدارة طلبات ونقاط البيع، وعروض الأسعار', 
        color: 'bg-blue-50 text-blue-600', 
        paths: ['/orders', '/returns', '/delivery', '/installments', '/b2b-sales', '/quotations', '/ecommerce', '/van-sales', '/pricing-rules'] 
    },
    { 
        id: 'restaurant', 
        label: 'المطاعم والكافيهات', 
        icon: Utensils, 
        description: 'كاشير المطاعم، المطبخ، الوصفات والطاولات', 
        color: 'bg-orange-50 text-orange-600', 
        paths: ['/restaurant-pos', '/restaurant/dashboard', '/kitchen', '/tables', '/restaurant-menu', '/restaurant/inventory', '/call-center', '/waiter'] 
    },
    { 
        id: 'clothes', 
        label: 'الملابس والأزياء', 
        icon: ShoppingBag, 
        description: 'المقاسات والموديلات واستئجار الفساتين', 
        color: 'bg-pink-50 text-pink-600', 
        paths: ['/rentals', '/products', '/returns'] 
    },
    { 
        id: 'tailoring', 
        label: 'التفصيل والخياطة', 
        icon: Scissors, 
        description: 'طلبات التفصيل والمقاسات وإدارة الخياطين', 
        color: 'bg-violet-50 text-violet-600', 
        paths: ['/tailoring', '/warehouse', '/purchases/invoices'] 
    },
    { 
        id: 'studio', 
        label: 'الاستوديو والتصوير', 
        icon: Camera, 
        description: 'مواعيد الاستوديو والطباعة والمصممين', 
        color: 'bg-fuchsia-50 text-fuchsia-600', 
        paths: ['/studio', '/orders'] 
    },
    {
        id: 'education',
        label: 'المدارس والتعليم',
        icon: GraduationCap,
        description: 'الطلاب والدرجات والغياب والجدول الدراسي',
        color: 'bg-yellow-50 text-yellow-600',
        paths: ['/school/dashboard', '/school/students', '/school/teachers', '/school/classes', '/school/timetable', '/school/attendance', '/school/grades', '/school/fees', '/school/transport', '/school/library']
    },
    {
        id: 'garage',
        label: 'الورش والصيانة',
        icon: Wrench,
        description: 'المركبات وبطاقات العمل (Job Cards)',
        color: 'bg-stone-50 text-stone-600',
        paths: ['/garage/dashboard', '/garage/jobs', '/garage/vehicles', '/garage/technicians', '/garage/spare-parts', '/garage/appointments', '/garage/invoices']
    },
    {
        id: 'gym',
        label: 'الأندية الرياضية',
        icon: Activity,
        description: 'العضويات، المدربين والحصص الرياضية',
        color: 'bg-red-50 text-red-600',
        paths: ['/gym/dashboard', '/gym/memberships', '/gym/classes', '/gym/trainers', '/gym/equipment', '/gym/store', '/gym/access-control']
    },
    {
        id: 'hotel',
        label: 'الفنادق والضيافة',
        icon: Building2,
        description: 'حجوزات الغرف والمرافق والفواتير',
        color: 'bg-lime-50 text-lime-600',
        paths: ['/hotel/dashboard', '/hotel/reservations', '/hotel/rooms', '/hotel/housekeeping', '/hotel/services', '/hotel/dining', '/hotel/billing']
    },
    {
        id: 'clinics',
        label: 'العيادات والمراكز الطبية',
        icon: Heart,
        description: 'حجوزات المرضى، الأطباء والمخزن الطبي',
        color: 'bg-rose-50 text-rose-500',
        paths: ['/clinics/dashboard', '/clinics', '/clinics/patients', '/clinics/doctors', '/clinics/cockpit', '/clinics/billing', '/clinics/services', '/clinics/insurance']
    },
    {
        id: 'pharmacy',
        label: 'الصيدلية وإدارة الدواء',
        icon: ShieldCheck,
        description: 'الأدوية، كاشير الصيدلية، صرف الروشتات، والفواتير الطبية والمشتريات',
        color: 'bg-emerald-50 text-emerald-600',
        paths: ['/pharmacy/dashboard', '/pharmacy/pos', '/pharmacy/medicines', '/pharmacy/prescriptions', '/pharmacy/purchases', '/pharmacy/reports']
    },
    { 
        id: 'inventory', 
        label: 'المخزون والمستودعات', 
        icon: Box, 
        description: 'إدارة المستودعات، الجرد الدوری وتحويلات الفروع', 
        color: 'bg-emerald-50 text-emerald-600', 
        paths: ['/warehouse', '/advanced-wms', '/inventory-count', '/branch-transfers', '/barcodes', '/products', '/categories', '/stock-adjustments', '/fulfillment'] 
    },
    { 
        id: 'purchases', 
        label: 'المشتريات والموردين', 
        icon: Target, 
        description: 'أوامر الشراء، طلبات الشراء، والموردين', 
        color: 'bg-indigo-50 text-indigo-600', 
        paths: ['/purchases', '/suppliers', '/purchase-orders', '/purchase-requests', '/rfqs'] 
    },
    { 
        id: 'accounting', 
        label: 'المالية والمحاسبة', 
        icon: Calculator, 
        description: 'المصروفات، قيود اليومية، شجرة الحسابات والضرائب', 
        color: 'bg-rose-50 text-rose-600', 
        paths: ['/expenses', '/accounting/journal', '/accounting/chart', '/accounting/assets', '/accounting/tax', '/accounting/budgeting', '/accounting/reconciliation'] 
    },
    { 
        id: 'hr', 
        label: 'الموارد البشرية (HR)', 
        icon: Users, 
        description: 'الموظفين، الحضور والانصراف، الرواتب والتقييم', 
        color: 'bg-purple-50 text-purple-600', 
        paths: ['/employees', '/payroll', '/attendance', '/leaves', '/loans', '/recruitment', '/training', '/benefits', '/hr/lms'] 
    },
    { 
        id: 'crm', 
        label: 'علاقات العملاء (CRM)', 
        icon: HeartHandshake, 
        description: 'العملاء، نقاط الولاء، البطاقات والنقاط', 
        color: 'bg-teal-50 text-teal-600', 
        paths: ['/customers', '/crm/leads', '/helpdesk', '/loyalty', '/gift-cards', '/promotions', '/subscriptions'] 
    },
    { 
        id: 'manufacturing', 
        label: 'التصنيع والإنتاج', 
        icon: Wrench, 
        description: 'أوامر الشغل، الوصفات والتخطيط الإنتاجي', 
        color: 'bg-amber-50 text-amber-600', 
        paths: ['/work-orders', '/bom', '/work-centers', '/manufacturing/tqm', '/manufacturing/plm'] 
    },
    { 
        id: 'projects', 
        label: 'المشاريع والمقاولات', 
        icon: Briefcase, 
        description: 'تتبع وإدارة المشاريع، الجداول الزمنية (Timesheets)', 
        color: 'bg-cyan-50 text-cyan-600', 
        paths: ['/projects', '/timesheets'] 
    },
    { 
        id: 'legal', 
        label: 'الإدارة القانونية', 
        icon: Scale, 
        description: 'للمحامين والمكاتب لإدارة القضايا والجلسات', 
        color: 'bg-slate-50 text-slate-800', 
        paths: ['/law-firm', '/legal/clients', '/legal/judgments'] 
    },
    { 
        id: 'logistics', 
        label: 'إدارة اللوجستيات والأساطيل', 
        icon: Truck, 
        description: 'تتبع المركبات والصيانة والإركاب', 
        color: 'bg-sky-50 text-sky-600', 
        paths: ['/fleet', '/shipping'] 
    }
];

const ModulesManagement: React.FC = () => {
    const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
    const [hiddenPages, setHiddenPages] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (settings && settings.hiddenPages) {
            setHiddenPages(settings.hiddenPages);
        }
    }, [settings]);

    const handleToggleModule = (module: typeof MODULES[0]) => {
        // If ALL paths of the module are hidden, the module is currently DISABLED.
        // If not all are hidden, the module is partially or fully ENABLED.
        const isModuleDisabled = module.paths.every(p => hiddenPages.includes(p));

        let newHidden = [...hiddenPages];

        if (isModuleDisabled) {
            // Enable the module -> Remove all its paths from hiddenPages
            newHidden = newHidden.filter(p => !module.paths.includes(p));
        } else {
            // Disable the module -> Add all its paths to hiddenPages
            module.paths.forEach(p => {
                if (!newHidden.includes(p)) {
                    newHidden.push(p);
                }
            });
        }
        setHiddenPages(newHidden);
        saveSettings(newHidden);
    };

    const saveSettings = async (newHidden: string[]) => {
        setIsSaving(true);
        try {
            if (settings?.id) {
                await db.settings.update(settings.id, { hiddenPages: newHidden });
            } else {
                await db.settings.add({ 
                    storeName: 'متجري', language: 'ar', currency: 'SAR', businessType: 'retail', hiddenPages: newHidden 
                } as any);
            }
            
            // Log to Audit
            let currentUser = 'system';
            try {
                const userStr = localStorage.getItem('nima_user');
                if (userStr) currentUser = JSON.parse(userStr).name;
            } catch(e){}
            
            await db.auditLogs.add({
                userId: currentUser,
                userName: currentUser,
                action: 'update',
                module: 'settings',
                details: 'تم تحديث تفعيل وإخفاء التطبيقات (Modules)',
                timestamp: new Date().toISOString()
            });

            setSaveMessage('تم الحفظ بنجاح! سيتم تحديث القائمة الجانبية.');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            console.error("Failed to update modules", error);
            setSaveMessage('حدث خطأ أثناء الحفظ.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shadow-sm">
                            <LayoutGrid className="w-8 h-8" />
                        </div>
                        إدارة التطبيقات والموديولات
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium max-w-2xl bg-white/60 p-2 rounded-lg border">
                        قم بتفعيل التطبيقات التي تحتاجها فقط لتخفيف الواجهة الجانبية وتسهيل العمل. 
                        أنت تتحكم بكامل قوة النظام، استمتع بالتجربة!
                    </p>
                </div>
            </div>

            {saveMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3 font-bold animate-in slide-in-from-top fade-in">
                    <Check className="w-5 h-5 text-green-600" />
                    {saveMessage}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {MODULES.map(module => {
                    // It is disabled if ALL of its paths are in hiddenPages
                    const isDisabled = module.paths.every(p => hiddenPages.includes(p));
                    const isEnabled = !isDisabled;

                    return (
                        <div 
                            key={module.id} 
                            onClick={() => handleToggleModule(module)}
                            className={`
                                relative p-6 rounded-3xl border-2 transition-all duration-300 cursor-pointer overflow-hidden
                                ${isEnabled 
                                    ? 'bg-white border-indigo-600 shadow-xl shadow-indigo-100 hover:-translate-y-1' 
                                    : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-90 grayscale'
                                }
                            `}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-4 rounded-2xl ${module.color}`}>
                                    <module.icon className="w-8 h-8" strokeWidth={1.5} />
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isEnabled ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                                    {isEnabled && <Check className="w-4 h-4" strokeWidth={3} />}
                                </div>
                            </div>
                            
                            <h3 className={`text-xl font-bold mb-2 ${isEnabled ? 'text-slate-800' : 'text-slate-500'}`}>
                                {module.label}
                            </h3>
                            
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                {module.description}
                            </p>
                            
                            {/* Decorative background element */}
                            {isEnabled && (
                                <div className="absolute -bottom-8 -left-8 opacity-[0.03] scale-150 transform -rotate-12 pointer-events-none">
                                    <module.icon className="w-32 h-32" />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-12 bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                <div>
                    <h4 className="font-bold text-blue-900 text-lg">كيف تعمل إدارة التطبيقات؟</h4>
                    <p className="text-blue-700 leading-relaxed mt-1">
                        تعطيل أي تطبيق سيقوم فوراً بإخفاء القوائم الخاصة به من الشريط الجانبي لتنظيف واجهة مساحة العمل الخاصة بك وفريقك.
                        لن يتم حذف أي بيانات، ومجرد إعادة تفعيل التطبيق، ستجد جميع بياناتك محفوظة كما هي وتظهر القوائم فوراً.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ModulesManagement;
