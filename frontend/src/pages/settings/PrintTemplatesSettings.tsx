import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Settings, Save, Image, Type, CheckCircle2, FileText, Printer } from 'lucide-react';
import { PrintTemplate } from '../../components/PrintTemplate';

export const PrintTemplatesSettings = () => {
    const settings = useLiveQuery(() => db.settings?.get(1));
    const [formData, setFormData] = useState<any>({
        printHeaderLogo: '',
        printStoreName: '',
        printAddress: '',
        printStamp: '',
        printSignature: '',
        printTermsText: '',
        printManagerName: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

    useEffect(() => {
        if (settings) {
            setFormData({
                printHeaderLogo: settings.printHeaderLogo || '',
                printStoreName: settings.printStoreName || '',
                printAddress: settings.printAddress || '',
                printStamp: settings.printStamp || '',
                printSignature: settings.printSignature || '',
                printTermsText: settings.printTermsText || '',
                printManagerName: settings.printManagerName || ''
            });
        }
    }, [settings]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, [fieldName]: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await db.settings.update(1, formData);
            setMessage('تم حفظ إعدادات الطباعة بنجاح');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error(error);
            setMessage('حدث خطأ أثناء الحفظ');
        } finally {
            setIsSaving(false);
        }
    };

    const templatesList = [
        { id: 'registration', name: 'استمارة تسجيل طفل' },
        { id: 'contract', name: 'عقد التحاق' },
        { id: 'receipt', name: 'إيصال استلام نقدية' },
        { id: 'invoice', name: 'فاتورة' },
        { id: 'payment_request', name: 'مطالبة دفع' },
        { id: 'statement', name: 'كشف حساب طفل' },
        { id: 'certificate', name: 'شهادة تقييم/تخرج' },
        { id: 'attendance', name: 'تقرير حضور' },
        { id: 'payroll', name: 'كشف مرتبات موظف' },
        { id: 'trip_permission', name: 'إذن رحلة' },
        { id: 'photography_consent', name: 'موافقة تصوير' },
        { id: 'pickup_auth', name: 'إذن استلام طفل' },
        { id: 'vault_report', name: 'تقرير خزنة' }
    ];

    if (!settings) return <div className="p-8">جاري التحميل...</div>;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Printer className="w-8 h-8 text-indigo-600" />
                        إعدادات الطباعة والقوالب
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">تخصيص شكل المطبوعات للمؤسسة ومعاينة القوالب الجاهزة</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                    <Save className="w-5 h-5"/>
                    {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
            </div>

            {message && (
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 font-bold border border-emerald-100">
                    <CheckCircle2 className="w-6 h-6"/> {message}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Settings */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                            <Type className="w-6 h-6 text-slate-400" />
                            <h2 className="text-lg font-black text-slate-800">بيانات رأس الصفحة (Header)</h2>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">اسم المؤسسة (للطباعة)</label>
                            <input 
                                type="text" 
                                name="printStoreName"
                                value={formData.printStoreName} 
                                onChange={handleChange}
                                placeholder={settings.storeName}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm" 
                            />
                            <p className="text-xs text-slate-500 mt-1">سيتم استخدام الاسم الرئيسي إذا ترك فارغاً</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">العنوان وتفاصيل الاتصال</label>
                            <textarea 
                                name="printAddress"
                                value={formData.printAddress} 
                                onChange={handleChange}
                                placeholder="مثال: شارع الاستقلال - التجمع الخامس&#10;ت: 01000000000"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium resize-none h-24" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">شعار المؤسسة للطباعة (يفضل خلفية بيضاء)</label>
                            <div className="flex items-center gap-4">
                                {formData.printHeaderLogo && (
                                    <img src={formData.printHeaderLogo} alt="Logo preview" className="h-16 w-16 object-contain border border-slate-200 rounded-lg bg-white" />
                                )}
                                <label className="flex-1 cursor-pointer">
                                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-center hover:bg-slate-100 transition">
                                        <span className="text-sm font-bold text-slate-600 flex items-center justify-center gap-2"><Image className="w-4 h-4"/> اختر صورة الشعار</span>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'printHeaderLogo')} />
                                </label>
                                {formData.printHeaderLogo && (
                                    <button onClick={() => setFormData({...formData, printHeaderLogo: ''})} className="text-xs text-rose-500 font-bold hover:underline">إزالة</button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                            <FileText className="w-6 h-6 text-slate-400" />
                            <h2 className="text-lg font-black text-slate-800">بيانات تذييل المطبوعات (Footer)</h2>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">اسم المدير / المعتمد</label>
                            <input 
                                type="text" 
                                name="printManagerName"
                                value={formData.printManagerName} 
                                onChange={handleChange}
                                placeholder="مدير إدارة الحضانة"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-sm" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">توقيع المدير (صورة شفافة png)</label>
                            <div className="flex items-center gap-4">
                                {formData.printSignature && (
                                    <img src={formData.printSignature} alt="Signature preview" className="h-12 object-contain border border-slate-200 p-2 rounded-lg bg-white" />
                                )}
                                <label className="flex-1 cursor-pointer">
                                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-center hover:bg-slate-100 transition">
                                        <span className="text-sm font-bold text-slate-600 flex items-center justify-center gap-2"><Image className="w-4 h-4"/> رفع التوقيع</span>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'printSignature')} />
                                </label>
                                {formData.printSignature && (
                                    <button onClick={() => setFormData({...formData, printSignature: ''})} className="text-xs text-rose-500 font-bold hover:underline">إزالة</button>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">ختم المؤسسة (صورة مستديرة)</label>
                            <div className="flex items-center gap-4">
                                {formData.printStamp && (
                                    <img src={formData.printStamp} alt="Stamp preview" className="w-16 h-16 object-contain border border-slate-200 p-1 rounded-full bg-white" />
                                )}
                                <label className="flex-1 cursor-pointer">
                                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-center hover:bg-slate-100 transition">
                                        <span className="text-sm font-bold text-slate-600 flex items-center justify-center gap-2"><Image className="w-4 h-4"/> رفع الختم</span>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'printStamp')} />
                                </label>
                                {formData.printStamp && (
                                    <button onClick={() => setFormData({...formData, printStamp: ''})} className="text-xs text-rose-500 font-bold hover:underline">إزالة</button>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">نصوص الشروط والأحكام (يظهر أسفل العقود والفواتير)</label>
                            <textarea 
                                name="printTermsText"
                                value={formData.printTermsText} 
                                onChange={handleChange}
                                placeholder="1. الرسوم غير قابلة للاسترداد.&#10;2. يجب الاحتفاظ بالإيصال."
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium resize-none h-32" 
                            />
                        </div>
                    </div>
                </div>

                {/* Templates Preview Preview  */}
                <div>
                     <div className="bg-slate-900 rounded-3xl p-6 shadow-xl sticky top-24">
                        <h2 className="text-xl font-black text-white mb-6 border-b border-slate-700 pb-4">معاينة القوالب الجاهزة</h2>
                        <div className="space-y-3">
                            {templatesList.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => setPreviewTemplate(template.id)}
                                    className="w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-right font-bold transition flex justify-between items-center group border border-slate-700"
                                >
                                    {template.name}
                                    <span className="opacity-0 group-hover:opacity-100 transition text-indigo-400 text-xs">معاينة 👁️</span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-8 p-4 bg-indigo-900/40 rounded-xl border border-indigo-500/30">
                            <p className="text-indigo-200 text-sm font-bold text-center leading-relaxed">
                                يتم إدراج هذه القوالب تلقائياً عند إجراء أي عملية بالنظام (تسجيل، دفع، رواتب).
                            </p>
                        </div>
                     </div>
                </div>
            </div>

            {/* Print Modal Overlay for Previews */}
            {previewTemplate && (
                <PrintTemplate 
                    title={templatesList.find(t => t.id === previewTemplate)?.name || 'معاينة'}
                    type={previewTemplate as any}
                    data={{
                        // Dummy Data for preview
                        student: { name: 'ياروسلاف بوهدان كوزا', nationalId: '32001010101234', dateOfBirth: '2020-05-10', nationality: 'مصري' },
                        parent: { name: 'بوهدان كوزا', phone: '01001234567', job: 'مهندس برمجيات', address: 'القاهرة - مدينة نصر' },
                        receiptNo: 'RC-10204',
                        date: '2026-05-18',
                        name: 'بوهدان كوزا',
                        amount: 4500,
                        amountText: 'أربعة آلاف وخمسمائة جنيه مصري',
                        description: 'القسط الشهري لشهر مايو',
                        employeeName: 'أولغا بافليوك',
                        month: 'مايو 2026',
                        basicSalary: 6000,
                        bonuses: 500,
                        deductions: 200,
                        netSalary: 6300,
                        destination: 'حديقة الطفل / مدينة نصر',
                        tripDate: '2026-06-01',
                        tripDay: 'الاثنين',
                        cost: 150,
                        period: 'الوردية الصباحية 18 مايو',
                        startBalance: 1200,
                        feesCollected: 4500,
                        otherIn: 0,
                        totalIn: 5700,
                        expenses: 300,
                        payrollOut: 0,
                        refunds: 0,
                        totalOut: 300,
                        netBalance: 5400
                    }}
                    onClose={() => setPreviewTemplate(null)}
                />
            )}
        </div>
    );
};
