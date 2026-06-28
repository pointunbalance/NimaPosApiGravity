import React, { useEffect, useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Printer } from 'lucide-react';
import { format } from 'date-fns';

interface PrintTemplateProps {
    title: string;
    type: 'registration' | 'contract' | 'receipt' | 'invoice' | 'payment_request' | 'statement' | 'certificate' | 'attendance' | 'trip_permission' | 'photography_consent' | 'payroll' | 'vault_report' | 'pickup_auth' | 'custom';
    data: any;
    onClose?: () => void;
    autoPrint?: boolean;
}

export const PrintTemplate: React.FC<PrintTemplateProps> = ({ title, type, data, onClose, autoPrint }) => {
    const settings = useLiveQuery(() => db.settings?.get(1));
    const printRef = useRef<HTMLDivElement>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    const handlePrint = () => {
        if (!printRef.current) return;
        setIsPrinting(true);
        
        // Slight delay to allow UI to update (hide buttons)
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 100);
    };

    useEffect(() => {
        if (autoPrint) {
            handlePrint();
        }
    }, [autoPrint]);

    if (!settings) return <div>جاري تحميل الإعدادات...</div>;

    const renderHeader = () => (
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
            <div className="flex-1 max-w-[50%]">
                <h1 className="text-2xl font-black text-slate-900 mb-1">{settings.printStoreName || settings.storeName || 'مؤسستنا'}</h1>
                {settings.printAddress && <p className="text-sm font-bold text-slate-700 whitespace-pre-wrap">{settings.printAddress}</p>}
                <div className="flex gap-4 mt-2">
                    <p className="text-sm text-slate-600 font-bold">التاريخ: {format(new Date(), 'yyyy-MM-dd')}</p>
                    {data?.documentNo && <p className="text-sm text-slate-600 font-bold">رقم المستند: {data.documentNo}</p>}
                </div>
                <p className="text-sm text-slate-600 mt-1 font-medium">أصدره: {data?.issuedBy || 'مدير النظام'}</p>
            </div>
            {(settings.printHeaderLogo || settings.logo) && (
                <div className="w-32 h-32 flex-shrink-0 flex items-center justify-end">
                    <img src={settings.printHeaderLogo || settings.logo} alt="Logo" className="max-h-full max-w-full object-contain" />
                </div>
            )}
        </div>
    );

    const renderFooter = () => (
        <div className="mt-12 pt-6 border-t border-slate-300">
            {settings.printTermsText && (
                <div className="mb-8 text-[11px] font-medium text-slate-600 leading-relaxed max-w-3xl whitespace-pre-wrap">
                    <strong className="text-slate-800 mb-1 block text-xs">الشروط والأحكام:</strong>
                    {settings.printTermsText}
                </div>
            )}
            
            <div className="flex justify-between items-end">
                <div className="text-center w-48">
                    <p className="text-sm font-bold text-slate-700 mb-8 border-b border-slate-200 pb-1">توقيع ولي الأمر / العميل</p>
                </div>

                <div className="text-center w-48 flex flex-col items-center">
                    {settings.printSignature ? (
                        <img src={settings.printSignature} alt="Signature" className="h-16 object-contain mb-2 mix-blend-multiply" />
                    ) : (
                        <div className="h-16"></div>
                    )}
                    <p className="text-sm font-bold text-slate-700 border-t border-slate-200 pt-1 w-full">
                        {settings.printManagerName || 'إدارة المؤسسة'}
                    </p>
                </div>
                
                {settings.printStamp && (
                    <div className="w-32 text-center">
                        <img src={settings.printStamp} alt="Stamp" className="w-24 h-24 object-contain opacity-80 mix-blend-multiply mx-auto" />
                    </div>
                )}
            </div>
        </div>
    );

    const renderContent = () => {
        switch (type) {
            case 'registration':
                return (
                    <div className="space-y-6 text-sm font-bold">
                        <h2 className="text-2xl font-black text-center mb-8 border-b-4 border-slate-200 pb-4 inline-block mx-auto border-double -mt-4 w-full">استمارة تسجيل طفل</h2>
                        
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <div className="col-span-2 bg-slate-50 p-4 border border-slate-300">
                                <h3 className="font-black text-lg mb-4 border-b border-slate-300 pb-2">بيانات الطفل الأساسية</h3>
                                <div className="grid grid-cols-2 gap-4">
                                     <p>اسم الطفل (رباعي): <span className="text-slate-600 mr-2">{data?.student?.name || '...........................................'}</span></p>
                                     <p>الرقم القومي / الإقامة: <span className="text-slate-600 mr-2">{data?.student?.nationalId || '.......................'}</span></p>
                                     <p>تاريخ الميلاد: <span className="text-slate-600 mr-2">{data?.student?.dateOfBirth || '.......................'}</span></p>
                                     <p>الجنسية: <span className="text-slate-600 mr-2">{data?.student?.nationality || '.......................'}</span></p>
                                </div>
                            </div>

                            <div className="col-span-2 bg-slate-50 p-4 border border-slate-300 mt-4">
                                <h3 className="font-black text-lg mb-4 border-b border-slate-300 pb-2">بيانات ولي الأمر</h3>
                                <div className="grid grid-cols-2 gap-4">
                                     <p>اسم الأب / ولي الأمر: <span className="text-slate-600 mr-2">{data?.parent?.name || '...........................................'}</span></p>
                                     <p>رقم الهاتف الأساسي: <span className="text-slate-600 mr-2" dir="ltr">{data?.parent?.phone || '.......................'}</span></p>
                                     <p>المهنة أو جهة العمل: <span className="text-slate-600 mr-2">{data?.parent?.job || '.......................'}</span></p>
                                     <p>العنوان السكني: <span className="text-slate-600 mr-2">{data?.parent?.address || '.......................'}</span></p>
                                </div>
                            </div>
                            
                            <div className="col-span-2 bg-slate-50 p-4 border border-slate-300 mt-4">
                                <h3 className="font-black text-lg mb-4 border-b border-slate-300 pb-2">التاريخ الطبي (اختياري)</h3>
                                <div className="space-y-4">
                                     <p>هل يعاني الطفل من أي أمراض مزمنة أو حساسية؟ <span className="text-slate-600 mr-2">{data?.student?.medicalInfo ? 'نعم: ' + data.student.medicalInfo : 'لا يوجد ( ................................... )'}</span></p>
                                     <p>طبيب الطفل المعالج (إن وجد): <span className="text-slate-600 mr-2">...........................................</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'contract':
                return (
                    <div className="space-y-6 text-sm">
                        <h2 className="text-2xl font-black text-center mb-6">عقد التحاق والتزام</h2>
                        <p className="font-bold text-justify leading-loose">
                            إنه في يوم <span>.......................</span> الموافق <span>{format(new Date(), 'yyyy/MM/dd')}</span>، تم الاتفاق بين كل من:<br/><br/>
                            1. الطرف الأول: إدارة <strong>{settings.printStoreName || 'المؤسسة'}</strong> (ويشار إليها لاحقاً بالمؤسسة/الحضانة).<br/>
                            2. الطرف الثاني: السيد/ة <strong>{data?.parent?.name || '...........................................'}</strong>، بصفته ولي أمر الطفل <strong>{data?.student?.name || '...........................................'}</strong>.<br/><br/>
                            <strong>تمهيد:</strong><br/>
                            يرغب الطرف الثاني في إلحاق نجله/كريمته لدى الطرف الأول للفترة الدراسية/الرعاية المقررة، وقد وافق الطرف الأول على ذلك وفق الشروط والأحكام الآتية:<br/>
                        </p>
                        <ol className="list-decimal list-inside font-bold space-y-4 leading-relaxed pr-4">
                            <li>يلتزم الطرف الثاني بسداد المصروفات والرسوم الدراسية المقررة في مواعيدها المحددة.</li>
                            <li>لا ترد الرسوم المسددة أو أي دفعة مقدمة في حال رغبة الطرف الثاني في سحب الملف بعد بدء النشاط.</li>
                            <li>يلتزم الطرف الثاني بتقديم كافة الأوراق الطبية الدقيقة، ويتحمل المسؤولية كاملة إذا أخفى أية حالة صحية.</li>
                            <li>يوافق الطرف الثاني على التزام الطفل بتعليمات ومواعيد المؤسسة.</li>
                        </ol>
                        <p className="font-bold text-center mt-8">والله الموفق والمستعان.</p>
                    </div>
                );
            case 'receipt':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-4 border-double border-slate-800 p-2 text-center mx-auto w-64 mb-6">
                            <h2 className="text-2xl font-black w-full">إيصال استلام نقدية</h2>
                        </div>
                        <div className="flex justify-between font-bold text-sm mb-4">
                            <span>رقم الإيصال: {data?.receiptNo || '........'}</span>
                            <span>التاريخ: {data?.date || format(new Date(), 'yyyy-MM-dd')}</span>
                        </div>
                        <div className="bg-slate-50 p-6 border border-slate-800 rounded-xl space-y-6 font-bold text-lg leading-loose">
                            <div className="flex">
                                <span className="w-48 flex-shrink-0">استلمنا من السيد/ة:</span>
                                <span className="flex-1 border-b-2 border-dotted border-slate-400 pb-1 text-indigo-900">{data?.name || '..........................................................'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-48 flex-shrink-0">مبلغاً وقدره:</span>
                                <span className="flex-1 border-b-2 border-dotted border-slate-400 pb-1 text-indigo-900">{data?.amountText || '..........................................................'} فقط لا غير.</span>
                            </div>
                            <div className="flex">
                                <span className="w-48 flex-shrink-0">بالأرقام:</span>
                                <span className="flex-1 border-b-2 border-dotted border-slate-400 pb-1 text-indigo-900">{data?.amount ? data.amount.toLocaleString() : '..........'} ج.م</span>
                            </div>
                            <div className="flex">
                                <span className="w-48 flex-shrink-0">وذلك قيمة:</span>
                                <span className="flex-1 border-b-2 border-dotted border-slate-400 pb-1 text-indigo-900">{data?.description || '..........................................................'}</span>
                            </div>
                        </div>
                    </div>
                );
            case 'payroll':
                 return (
                    <div className="space-y-6 text-sm font-bold">
                        <h2 className="text-2xl font-black text-center mb-6">مفردات مرتب (كشف حساب موظف)</h2>
                        <div className="flex justify-between mb-2">
                             <span>اسم الموظف: <strong>{data?.employeeName || '.......................'}</strong></span>
                             <span>شهر الاستحقاق: <strong>{data?.month || '..........'}</strong></span>
                        </div>
                        <table className="w-full border-collapse border border-slate-400 text-center">
                            <thead>
                                <tr className="bg-slate-100 uppercase text-xs">
                                    <th className="border border-slate-400 p-2">البند</th>
                                    <th className="border border-slate-400 p-2">المبلغ (إضافة)</th>
                                    <th className="border border-slate-400 p-2">المبلغ (خصم)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-slate-400 p-2">الراتب الأساسي</td>
                                    <td className="border border-slate-400 p-2 text-emerald-600">{data?.basicSalary || 0}</td>
                                    <td className="border border-slate-400 p-2"></td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-400 p-2">بدلات ومكافآت</td>
                                    <td className="border border-slate-400 p-2 text-emerald-600">{data?.bonuses || 0}</td>
                                    <td className="border border-slate-400 p-2"></td>
                                </tr>
                                <tr>
                                    <td className="border border-slate-400 p-2">خصومات / تأخير / سلف</td>
                                    <td className="border border-slate-400 p-2"></td>
                                    <td className="border border-slate-400 p-2 text-rose-600">{data?.deductions || 0}</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-slate-50 font-black">
                                <tr>
                                    <td className="border border-slate-400 p-3 text-left pl-4">صافي الراتب المستحق:</td>
                                    <td colSpan={2} className="border border-slate-400 p-3 text-xl bg-indigo-50 text-indigo-900">
                                        {data?.netSalary || 0} ج.م
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                );
            case 'photography_consent':
                 return (
                    <div className="space-y-6 text-sm">
                        <h2 className="text-2xl font-black text-center mb-6">موافقة على تصوير ونشر صور الطفل</h2>
                        <p className="font-bold text-justify leading-loose">
                            أنا الموقع أدناه السيد/ة: <strong>{data?.parent?.name || '...........................................'}</strong><br/>
                            بصفتي ولي أمر الطفل/ة: <strong>{data?.student?.name || '...........................................'}</strong><br/><br/>
                            أقر بموجب هذا المستند بموافقتي / عدم موافقتي على قيام إدارة <strong>{settings.printStoreName || 'المؤسسة'}</strong> بالتقاط صور فوتوغرافية ومقاطع فيديو لطفلي أثناء الأنشطة والفعاليات داخل أو خارج جدران الحضانة/المدرسة.<br/>
                            كما أوافق على إمكانية استخدام هذه الصور لأغراض ترويجية أو إعلانية أو نشرها على صفحات التواصل الاجتماعي الخاصة بالمؤسسة، وذلك دون المطالبة بأي حقوق مادية أو فكرية مقابل ذلك في المستقبل.
                        </p>
                        
                        <div className="flex gap-12 mt-8 justify-center">
                            <label className="flex items-center gap-2 font-black text-lg p-4 border-2 border-slate-300 rounded-xl cursor-pointer">
                                <div className="w-6 h-6 border-2 border-slate-400 rounded-sm"></div>
                                أوافق
                            </label>
                            <label className="flex items-center gap-2 font-black text-lg p-4 border-2 border-slate-300 rounded-xl cursor-pointer">
                                <div className="w-6 h-6 border-2 border-slate-400 rounded-sm"></div>
                                لا أوافق
                            </label>
                        </div>
                    </div>
                );
            case 'trip_permission':
                return (
                    <div className="space-y-6 text-sm">
                        <h2 className="text-2xl font-black text-center mb-6">إذن خروج لرحلة / نشاط خارجي</h2>
                        <p className="font-bold text-justify leading-loose text-lg">
                            السادة أولياء أمور الطفل/ة: <strong>{data?.student?.name || '...........................................'}</strong><br/><br/>
                            تحية طيبة وبعد،،،<br/>
                            تتشرف إدارة <strong>{settings.printStoreName || 'المؤسسة'}</strong> بإعلامكم بتنظيم رحلة / نشاط خارجي إلى: <span className="border-b-2 border-dotted border-slate-500 w-48 inline-block">{data?.destination || ''}</span><br/>
                            وذلك يوم: <strong>{data?.tripDate || '............'}</strong> الموافق: <strong>{data?.tripDay || '............'}</strong>.<br/>
                            تبلغ تكلفة الاشتراك في الرحلة (إن وجدت): <strong>{data?.cost || '............'} ج.م</strong>.<br/><br/>
                            برجاء تعبئة الموافقة أدناه وإعادتها للإدارة للتمكن من تسجيل الحجز.
                        </p>
                        <div className="border-t-2 border-dashed border-slate-400 my-8 py-8 relative">
                             <span className="absolute -top-4 bg-white px-4 left-1/2 -translate-x-1/2 text-slate-400 font-bold text-xs flex items-center gap-2">✂️ قص من هنا</span>
                             
                             <p className="font-bold text-justify leading-loose">
                                أنا الموقع أدناه، ولي أمر الطفل: <strong>{data?.student?.name || '...........................................'}</strong><br/>
                                أوافق على مشاركة طفلي في الرحلة المذكورة أعلاه، وأؤكد أنني قرأت كافة التفاصيل، وأتحمل سداد رسوم الاشتراك المطلوبة.
                            </p>
                        </div>
                    </div>
                );
            case 'vault_report':
                 return (
                    <div className="space-y-6 text-sm font-bold">
                        <h2 className="text-2xl font-black text-center mb-2">تقرير حركة الخزينة (الدرج)</h2>
                        <p className="text-center text-slate-600 mb-6 font-medium">عن فترة أو وردية: <strong>{data?.period || format(new Date(), 'yyyy-MM-dd')}</strong></p>
                        
                        <div className="grid grid-cols-2 gap-8 mb-6">
                            <div className="border border-slate-300 p-4 bg-emerald-50/30">
                                <h3 className="font-black text-emerald-800 border-b border-emerald-200 pb-2 mb-3">المقبوضات (الداخل)</h3>
                                <div className="space-y-2">
                                     <div className="flex justify-between"><span>رصيد البداية:</span> <span>{data?.startBalance || 0}</span></div>
                                     <div className="flex justify-between"><span>متحصلات اشتراكات:</span> <span>{data?.feesCollected || 0}</span></div>
                                     <div className="flex justify-between"><span>أخرى:</span> <span>{data?.otherIn || 0}</span></div>
                                     <div className="flex justify-between font-black text-emerald-700 pt-2 border-t border-emerald-200 mt-2">
                                         <span>إجمالي الداخل:</span> <span>{data?.totalIn || 0}</span>
                                     </div>
                                </div>
                            </div>
                            <div className="border border-slate-300 p-4 bg-rose-50/30">
                                <h3 className="font-black text-rose-800 border-b border-rose-200 pb-2 mb-3">المدفوعات (الخارج)</h3>
                                <div className="space-y-2">
                                     <div className="flex justify-between"><span>مصروفات نثرية:</span> <span>{data?.expenses || 0}</span></div>
                                     <div className="flex justify-between"><span>سلف ورواتب:</span> <span>{data?.payrollOut || 0}</span></div>
                                     <div className="flex justify-between"><span>مرتجعات:</span> <span>{data?.refunds || 0}</span></div>
                                     <div className="flex justify-between font-black text-rose-700 pt-2 border-t border-rose-200 mt-2">
                                         <span>إجمالي الخارج:</span> <span>{data?.totalOut || 0}</span>
                                     </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-slate-100 p-6 rounded-xl border border-slate-300 text-center">
                            <h3 className="text-lg font-medium text-slate-700 mb-1">صافي الرصيد الحالي</h3>
                            <p className="text-3xl font-black text-slate-900">{data?.netBalance || 0} ج.م</p>
                        </div>
                    </div>
                );
            case 'certificate':
                return (
                    <div className="space-y-6 text-sm font-bold text-center mt-12 bg-indigo-50/30 p-12 rounded-3xl border-8 border-double border-indigo-200">
                        <h2 className="text-4xl font-black mb-8 text-indigo-900 border-b-4 border-slate-900 inline-block pb-4 border-double">شهادة تقدير وتفوق</h2>
                        <p className="text-2xl mt-4">تتقدم إدارة <strong>{settings.printStoreName || 'المؤسسة'}</strong></p>
                        <p className="text-xl mt-4">بخالص الشكر والتقدير للطالب / الطفل</p>
                        <h3 className="text-5xl font-black text-indigo-700 my-8 py-4 border-y-2 border-dashed border-indigo-300">{data?.studentName || '...........................................'}</h3>
                        <p className="text-xl leading-loose">وذلك تقديراً لتفوقه وتميزه الملحوظ خلال {data?.period || 'العام الدراسي'} في مادة / نشاط</p>
                        <p className="text-2xl font-black mt-2 text-indigo-900">{data?.subject || '...........................................'}</p>
                        <p className="text-lg mt-12">متمنين له دوام التوفيق والنجاح،،،</p>
                    </div>
                );
            case 'statement':
                return (
                    <div className="space-y-6 text-sm font-bold">
                        <h2 className="text-2xl font-black text-center mb-6">كشف حساب طفل / عميل</h2>
                        <div className="flex justify-between mb-2">
                             <span>اسم العميل: <strong>{data?.customerName || '.......................'}</strong></span>
                             <span>تاريخ الكشف: <strong>{data?.statementDate || format(new Date(), 'yyyy-MM-dd')}</strong></span>
                        </div>
                        <table className="w-full border-collapse border border-slate-400 text-center">
                            <thead>
                                <tr className="bg-slate-100 uppercase text-xs">
                                    <th className="border border-slate-400 p-2">التاريخ</th>
                                    <th className="border border-slate-400 p-2">البيان</th>
                                    <th className="border border-slate-400 p-2">مدين (عليه)</th>
                                    <th className="border border-slate-400 p-2">دائن (له)</th>
                                    <th className="border border-slate-400 p-2">الرصيد</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={5} className="border border-slate-400 p-8 text-center text-slate-500 font-medium">سيتم إدراج حركات الحساب التفصيلية هنا من قاعدة البيانات</td>
                                </tr>
                            </tbody>
                            <tfoot className="bg-slate-50 font-black">
                                <tr>
                                    <td colSpan={4} className="border border-slate-400 p-3 text-left pl-4">الرصيد النهائي المستحق:</td>
                                    <td className="border border-slate-400 p-3 text-lg bg-indigo-50 text-indigo-900">
                                        {data?.finalBalance || 0} ج.م
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                );
            case 'invoice':
                return (
                    <div className="space-y-4 text-sm font-bold">
                        <h2 className="text-2xl font-black text-center mb-6">فاتورة ضريبية / مبيعات</h2>
                        <div className="flex justify-between mb-4 bg-slate-50 p-4 border border-slate-200">
                             <div>
                                 <p>رقم الفاتورة: <strong>{data?.invoiceNo || 'INV-0001'}</strong></p>
                                 <p>التاريخ: <strong>{data?.date || format(new Date(), 'yyyy-MM-dd')}</strong></p>
                             </div>
                             <div>
                                 <p>العميل: <strong>{data?.customerName || 'عميل نقدي'}</strong></p>
                                 <p>مسؤول المبيعات: <strong>{data?.cashier || 'الكاشير'}</strong></p>
                             </div>
                        </div>
                        <table className="w-full border-collapse border border-slate-400 text-center">
                            <thead>
                                <tr className="bg-slate-100 uppercase text-xs">
                                    <th className="border border-slate-400 p-2">الصنف</th>
                                    <th className="border border-slate-400 p-2">الكمية</th>
                                    <th className="border border-slate-400 p-2">السعر</th>
                                    <th className="border border-slate-400 p-2">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={4} className="border border-slate-400 p-8 text-slate-500 text-center">أصناف الفاتورة تضاف هنا</td>
                                </tr>
                            </tbody>
                             <tfoot className="bg-slate-50 font-black">
                                <tr>
                                    <td colSpan={3} className="border border-slate-400 p-3 text-left pl-4">الإجمالي قبل الضريبة:</td>
                                    <td className="border border-slate-400 p-3">{data?.subtotal || 0}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="border border-slate-400 p-3 text-left pl-4">قيمة الضريبة:</td>
                                    <td className="border border-slate-400 p-3">{data?.taxAmount || 0}</td>
                                </tr>
                                <tr>
                                    <td colSpan={3} className="border border-slate-400 p-3 text-left pl-4 text-xl">الصافي المطلوب:</td>
                                    <td className="border border-slate-400 p-3 text-xl">{data?.totalAmount || 0}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                );
            case 'payment_request':
                return (
                    <div className="space-y-6 text-sm font-bold">
                        <h2 className="text-2xl font-black text-center mb-6">مطالبة سداد مستحقات</h2>
                        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                            <p className="text-lg leading-loose">
                                السيد/ة ولي الأمر: <strong className="text-indigo-900 border-b-2 border-dotted border-slate-400 pb-1">{data?.parentName || '...........................................'}</strong><br/>
                                تحية طيبة وبعد ،،،<br/>
                                نرجو التكرم بالعلم بأنه قد حان موعد سداد المستحقات الخاصة بالطفل/ة: <strong className="text-indigo-900 border-b-2 border-dotted border-slate-400 pb-1">{data?.studentName || '...........................................'}</strong>
                            </p>
                        </div>
                        <table className="w-full border-collapse border border-slate-400 text-center mt-6">
                            <thead>
                                <tr className="bg-slate-100 uppercase text-xs">
                                    <th className="border border-slate-400 p-3">وصف المستحق</th>
                                    <th className="border border-slate-400 p-3">المبلغ المطلوب</th>
                                    <th className="border border-slate-400 p-3">تاريخ الاستحقاق</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-slate-400 p-4">{data?.description || 'رسوم اشتراك / خدمات ومصروفات'}</td>
                                    <td className="border border-slate-400 p-4 text-rose-700 font-black text-lg">{data?.amount || '..........'} ج.م</td>
                                    <td className="border border-slate-400 p-4 text-emerald-700">{data?.dueDate || format(new Date(), 'yyyy-MM-dd')}</td>
                                </tr>
                            </tbody>
                        </table>
                        <p className="font-bold text-slate-600 mt-4 leading-loose">
                            برجاء سرعة السداد في موعد أقصاه <strong>{data?.deadline || 'أسبوع من تاريخه'}</strong> لتجنب تطبيق غرامات التأخير أو إيقاف الخدمة.<br/>
                            شاكرين لكم حسن تعاونكم.
                        </p>
                    </div>
                );
            case 'attendance':
                return (
                    <div className="space-y-6 text-sm font-bold">
                        <h2 className="text-2xl font-black text-center mb-6">تقرير حضور وإنصراف</h2>
                        <div className="flex justify-between mb-4 bg-slate-50 p-4 border border-slate-200 rounded-lg">
                             <div>
                                 <p>الاسم: <strong className="text-indigo-900">{data?.personName || '.......................'}</strong></p>
                                 <p>النوع: <strong>{data?.personType === 'employee' ? 'موظف' : 'طالب/طفل'}</strong></p>
                             </div>
                             <div>
                                 <p>عن فترة من: <strong>{data?.startDate || format(new Date(), 'yyyy-MM-dd')}</strong></p>
                                 <p>إلى: <strong>{data?.endDate || format(new Date(), 'yyyy-MM-dd')}</strong></p>
                             </div>
                        </div>
                        <table className="w-full border-collapse border border-slate-400 text-center">
                            <thead>
                                <tr className="bg-slate-100 text-xs">
                                    <th className="border border-slate-400 p-2">التاريخ</th>
                                    <th className="border border-slate-400 p-2">الحالة</th>
                                    <th className="border border-slate-400 p-2">وقت الحضور</th>
                                    <th className="border border-slate-400 p-2">وقت الإنصراف</th>
                                    <th className="border border-slate-400 p-2">ملاحظات</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={5} className="border border-slate-400 p-8 text-center text-slate-500">سيتم إدراج تقرير الحضور التفصيلي هنا</td>
                                </tr>
                            </tbody>
                        </table>
                        <div className="flex justify-around mt-8 p-4 bg-slate-100 rounded-lg font-black">
                            <span className="text-emerald-700">إجمالي الحضور: {data?.presentCount || 0} أيام</span>
                            <span className="text-rose-700">إجمالي الغياب: {data?.absentCount || 0} أيام</span>
                        </div>
                    </div>
                );
            case 'pickup_auth':
                return (
                    <div className="space-y-6 text-sm">
                        <h2 className="text-2xl font-black text-center mb-6">تفويض وإذن استلام طفل</h2>
                        <div className="border border-slate-800 p-8 rounded-xl leading-loose font-bold">
                             <p className="mb-4">
                                 أنا الموقع أدناه السيد/ة: <strong className="text-indigo-900 border-b-2 border-slate-400 pb-1">{data?.parentName || '...........................................'}</strong><br/>
                                 ولي أمر الطفل/ة: <strong className="text-indigo-900 border-b-2 border-slate-400 pb-1">{data?.studentName || '...........................................'}</strong>
                             </p>
                             <p className="mb-4">
                                 أفوض وأصرح رسمياً للسيد/ة المذكورة بياناته(ا) أدناه باستلام طفلي من مقر <strong className="text-indigo-900">{settings.printStoreName || 'المؤسسة'}</strong>.<br/>
                                 وأتحمل المسؤولية القانونية والأدبية كاملة بمجرد تسليم الطفل للشخص المفوض، ولا يحق لي الرجوع على الإدارة بأي مسؤولية.
                             </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                             <div className="bg-slate-50 p-4 border border-slate-300">
                                 <h3 className="font-black border-b border-slate-300 pb-2 mb-4 text-indigo-900">بيانات الشخص المفوض بالاستلام</h3>
                                 <p className="mb-3">الاســم: <strong>{data?.authorizedName || '...................................'}</strong></p>
                                 <p className="mb-3">القرابة: <strong>{data?.relation || '...................................'}</strong></p>
                                 <p className="mb-3">الرقم القومي: <strong>{data?.nationalId || '...................................'}</strong></p>
                                 <p className="mb-3">رقم الهاتف: <strong dir="ltr">{data?.phone || '...................................'}</strong></p>
                             </div>
                             <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-300 p-4">
                                 <p className="font-black mb-4 w-full text-center">صورة البطاقة للشخص المفوض</p>
                                 <div className="w-48 h-32 border-2 border-dashed border-slate-400 flex items-center justify-center text-slate-400 text-xs">
                                     يفضل إرفاق صورة البطاقة
                                 </div>
                             </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="text-center p-12">
                        <h2 className="text-2xl font-black mb-4">{title || 'مستند مخصص'}</h2>
                        <p className="text-slate-500 font-bold whitespace-pre-wrap">{data?.content || 'صيغة القالب غير محددة أو قيد الإنشاء...'}</p>
                    </div>
                );
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] bg-white flex flex-col ${isPrinting ? 'print:block' : ''}`}>
             
            {/* Control Bar (Hidden on print) */}
            {!isPrinting && (
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-xl print:hidden sticky top-0 z-10 w-full shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="px-4 py-2 bg-slate-800 rounded-lg font-bold hover:bg-slate-700 transition">الغاء وإغلاق</button>
                        <span className="font-bold">معاينة الطباعة: {title}</span>
                    </div>
                    <button onClick={handlePrint} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-500/30">
                        <Printer className="w-5 h-5"/> طباعة الآن (Print)
                    </button>
                </div>
            )}

            {/* A4 Paper Container */}
            <div className={`flex-1 overflow-y-auto bg-slate-100 p-4 md:p-8 flex justify-center print:p-0 print:bg-white print:overflow-visible`}>
                <div 
                    ref={printRef}
                    className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl p-[20mm] mx-auto print:shadow-none print:w-auto print:h-auto print:max-w-none print:m-0 print:p-0"
                    style={{ direction: 'rtl' }}
                >
                    {renderHeader()}
                    
                    <div className="min-h-[150mm]">
                        {renderContent()}
                    </div>

                    {renderFooter()}
                </div>
            </div>

            {/* Print Styles */}
            <style>
                {`
                @media print {
                    @page { size: A4; margin: 10mm; }
                    body {
                        background: white;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    div.print\\:hidden { display: none !important; }
                }
                `}
            </style>
        </div>
    );
};
