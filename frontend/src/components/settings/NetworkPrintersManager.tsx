import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Printer, X, Plus, Edit2, Trash2, Printer as PrinterIcon } from 'lucide-react';
import { Printer as PrinterType } from '../../types';
import { useToast } from '../../context/ToastContext';

const NetworkPrintersManager: React.FC = () => {
    const printers = useLiveQuery(() => db.printers.toArray(), []) || [];
    const categories = useLiveQuery(() => db.categories.toArray(), []) || [];
    const [isEditing, setIsEditing] = useState<PrinterType | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<PrinterType>>({ type: 'network', paperWidth: 80 });
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [categoryAlarms, setCategoryAlarms] = useState<Record<number, 'long' | 'short' | 'none'>>({});
    const { success, error } = useToast();

    // Map printers to their categories
    const getPrinterCategories = (printerId?: number) => {
        if (!printerId) return [];
        return categories.filter(c => c.targetPrinterId === printerId);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let printerId = isEditing?.id;
            if (isEditing && isEditing.id) {
                await db.printers.update(isEditing.id, formData);
            } else {
                printerId = (await db.printers.add({ ...formData } as PrinterType)) as number;
            }

            // Sync categories
            if (printerId) {
                for (const cat of categories) {
                    if (cat.id) {
                        const isSelected = selectedCategoryIds.includes(cat.id);
                        if (isSelected) {
                            const newAlarm = categoryAlarms[cat.id] || 'none';
                            if (cat.targetPrinterId !== printerId || cat.printerBuzzerType !== newAlarm) {
                                await db.categories.update(cat.id, { 
                                    targetPrinterId: printerId,
                                    printerBuzzerType: newAlarm
                                });
                            }
                        } else if (!isSelected && cat.targetPrinterId === printerId) {
                            await db.categories.update(cat.id, { 
                                targetPrinterId: null as any,
                                printerBuzzerType: null as any
                            });
                        }
                    }
                }
            }

            closeModal();
            success('تم حفظ إعدادات الطابعة بنجاح');
        } catch (err) {
            console.error('Failed to save printer', err);
            error('حدث خطأ أثناء حفظ الطابعة');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('هل أنت متأكد من حذف هذه الطابعة؟')) {
            await db.printers.delete(id);
            // Remove from categories
            const catsToUpdate = categories.filter(c => c.targetPrinterId === id);
            for (const cat of catsToUpdate) {
                if (cat.id) await db.categories.update(cat.id, { targetPrinterId: null as any });
            }
            success('تم حذف الطابعة');
        }
    };

    const openModal = (printer?: PrinterType) => {
        if (printer) {
            setIsEditing(printer);
            setFormData(printer);
            const cats = getPrinterCategories(printer.id);
            setSelectedCategoryIds(cats.map(c => c.id as number));
            const alarms: Record<number, 'long' | 'short' | 'none'> = {};
            cats.forEach(c => {
               if (c.id) alarms[c.id] = c.printerBuzzerType || 'none';
            });
            setCategoryAlarms(alarms);
        } else {
            setIsEditing(null);
            setFormData({ type: 'network', paperWidth: 80, name: '' });
            setSelectedCategoryIds([]);
            setCategoryAlarms({});
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsEditing(null);
        setSelectedCategoryIds([]);
        setCategoryAlarms({});
    };

    const handleTestPrint = async (printer: PrinterType) => {
        const width = `${printer.paperWidth || 80}mm`;
        const fontSize = printer.paperWidth === 58 ? '12px' : '14px';
        const margin = printer.paperWidth === 58 ? '0' : '2mm';

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
        
        const doc = iframe.contentWindow?.document;
        if(!doc) {
            error('حدث خطأ أثناء التحضير للطباعة');
            return;
        }

        const html = `
        <html>
            <head>
            <title>Test Print - ${printer.name}</title>
            <style>
                @page { size: ${width} auto; margin: 0; }
                body { 
                font-family: system-ui, -apple-system, sans-serif; 
                font-size: ${fontSize}; 
                color: black; 
                margin: ${margin};
                padding: 10px;
                text-align: center;
                direction: rtl;
                }
                h1 { font-size: 1.5em; margin-bottom: 5px; }
                p { margin-bottom: 5px; }
                .divider { border-bottom: 2px dashed black; margin: 15px 0; }
            </style>
            </head>
            <body>
                <h1>اختبار الطابعة</h1>
                <p><strong>الاسم:</strong> ${printer.name}</p>
                <p><strong>النوع:</strong> ${printer.type === 'system' ? 'النظام (Driver)' : printer.type === 'usb' ? 'USB' : printer.type === 'network' ? 'شبكة / IP' : printer.type}</p>
                ${printer.ipAddress && printer.type === 'network' ? `<p><strong>IP:</strong> ${printer.ipAddress}</p>` : ''}
                <p><strong>حجم الورق:</strong> ${printer.paperWidth}mm</p>
                <div class="divider"></div>
                <h2>طباعة ناجحة!</h2>
                <div class="divider"></div>
            </body>
        </html>
        `;

        doc.open();
        doc.write(html);
        doc.close();

        iframe.contentWindow?.focus();
        
        await new Promise(resolve => setTimeout(resolve, 300));
        iframe.contentWindow?.print();
        
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 500);
        
        success(`تم إرسال أمر الاختبار لطابعة: ${printer.name}`);
    };

    return (
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
                        <PrinterIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">طابعات وتوجيه المطبخ</h2>
                        <p className="text-slate-500 mt-1">إضافة وإدارة طابعات إضافية لطباعة طلبات المطبخ</p>
                    </div>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">إضافة طابعة</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {printers.map((printer: PrinterType) => {
                    const attachedCategories = getPrinterCategories(printer.id);
                    return (
                    <div key={printer.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${printer.type === 'network' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-600'}`}>
                                        <PrinterIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800">{printer.name}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${printer.type === 'network' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-700'}`}>
                                            {printer.type === 'system' ? 'Driver' : printer.type}
                                        </span>
                                    </div>
                                </div>
                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    متصلة
                                </span>
                            </div>
                            
                            <div className="mt-4 space-y-2">
                                {printer.type === 'network' && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">عنوان IP</span>
                                        <span className="font-mono font-bold text-slate-700">{printer.ipAddress}</span>
                                    </div>
                                )}
                                {(printer.type === 'system' || printer.type === 'usb') && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">طريقة الاتصال</span>
                                        <span className="font-bold text-slate-700 text-xs">نظام افتراضي/متصل</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">حجم الورق</span>
                                    <span className="font-bold text-slate-700">{printer.paperWidth}mm</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-200">
                                <h4 className="text-xs font-bold text-slate-500 mb-2">الأقسام الموجهة لهذه الطابعة:</h4>
                                {attachedCategories.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {attachedCategories.map(cat => (
                                            <span key={cat.id} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold border border-indigo-100">
                                                {cat.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">لم يتم توجيه أي قسم بعد.</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="mt-5 flex gap-2">
                            <button onClick={() => handleTestPrint(printer)} className="flex-[2] bg-indigo-50 border border-indigo-200 py-2 rounded-xl text-indigo-600 font-bold text-sm hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                                <PrinterIcon className="w-4 h-4" />
                                اختبار
                            </button>
                            <button onClick={() => openModal(printer)} className="flex-1 bg-white border border-slate-200 py-2 rounded-xl text-slate-600 font-bold text-sm hover:bg-slate-100 transition-colors">
                                <Edit2 className="w-4 h-4 mx-auto" />
                            </button>
                            <button onClick={() => printer.id && handleDelete(printer.id)} className="flex-1 bg-white border border-red-200 py-2 rounded-xl text-red-600 font-bold text-sm hover:bg-red-50 transition-colors">
                                <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                        </div>
                    </div>
                )})}
                
                {printers.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                        <PrinterIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-slate-700">لا توجد طابعات مضافة</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                            قم بإضافة طابعات المطبخ والأقسام لتتمكن من توجيه الأصناف للطباعة عندها.
                        </p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h3 className="font-bold text-xl text-slate-800">
                                {isEditing ? 'تعديل طابعة' : 'إضافة طابعة جديدة'}
                            </h3>
                            <button type="button" onClick={closeModal} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                                <X className="w-5 h-5"/>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">اسم الطابعة <span className="text-red-500">*</span></label>
                                <input 
                                    required
                                    value={formData.name || ''}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="مثال: مطبخ المشويات"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">يجب أن يتطابق مع الاسم في النظام لو اخترت (تعريف ويندوز)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">نوع الاتصال</label>
                                <select 
                                    value={formData.type || 'network'}
                                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="system">تعريف ويندوز (System Driver)</option>
                                    <option value="network">شبكة محليّة (Network / IP)</option>
                                    <option value="usb">USB مباشر</option>
                                </select>
                            </div>

                            {formData.type === 'network' && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">عنوان IP <span className="text-red-500">*</span></label>
                                    <input 
                                        required
                                        value={formData.ipAddress || ''}
                                        onChange={e => setFormData({...formData, ipAddress: e.target.value})}
                                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-left"
                                        placeholder="192.168.1.100"
                                        dir="ltr"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">حجم الورق</label>
                                <div className="flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, paperWidth: 80})}
                                        className={`flex-1 py-3 rounded-xl font-bold border-2 transition-colors ${formData.paperWidth === 80 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500'}`}
                                    >80mm</button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, paperWidth: 58})}
                                        className={`flex-1 py-3 rounded-xl font-bold border-2 transition-colors ${formData.paperWidth === 58 ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500'}`}
                                    >58mm</button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">الأقسام الموجهة (اختياري)</label>
                                <div className="border border-slate-200 rounded-xl max-h-40 overflow-y-auto bg-slate-50 p-2 space-y-1">
                                    {categories.length > 0 ? categories.map(cat => (
                                        <div key={cat.id} className="flex items-center justify-between p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                    checked={selectedCategoryIds.includes(cat.id as number)}
                                                    onChange={(e) => {
                                                        if(e.target.checked) {
                                                            setSelectedCategoryIds([...selectedCategoryIds, cat.id as number]);
                                                        } else {
                                                            setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== cat.id));
                                                        }
                                                    }}
                                                />
                                                <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                                            </label>
                                            
                                            {selectedCategoryIds.includes(cat.id as number) && (
                                                <select
                                                    value={categoryAlarms[cat.id as number] || 'none'}
                                                    onChange={(e) => setCategoryAlarms({...categoryAlarms, [cat.id as number]: e.target.value as any})}
                                                    className="text-xs bg-white border border-slate-300 rounded-md py-1 px-2 text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                >
                                                    <option value="none">بدون جرس</option>
                                                    <option value="short">جرس قصير</option>
                                                    <option value="long">جرس طويل</option>
                                                </select>
                                            )}
                                        </div>
                                    )) : (
                                        <p className="text-xs text-slate-400 p-2 text-center">لا توجد أقسام مضافة بعد</p>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-1">عند اختيار أقسام هنا، سيتم طباعة الطلبات التي تحتوي على أصناف من هذه الأقسام في هذه الطابعة تلقائياً لتجهيزها.</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">إلغاء</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">حفظ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NetworkPrintersManager;

