import React, { useState, useEffect } from 'react';
import { X, Palette, Dumbbell, BookOpen, Music, Flame, Star, Brain } from 'lucide-react';
import { db } from '../../../db';
import { format } from 'date-fns';
import { useToast } from '../../../context/ToastContext';

export const ACTIVITY_TYPES = [
    { id: 'art', label: 'نشاط رسم وفنون', icon: Palette, color: 'bg-rose-100 text-rose-600 border-rose-200' },
    { id: 'sports', label: 'نشاط رياضي', icon: Dumbbell, color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
    { id: 'religion', label: 'نشاط ديني (قرآن/إنجيل)', icon: BookOpen, color: 'bg-indigo-100 text-indigo-600 border-indigo-200' },
    { id: 'music', label: 'نشاط موسيقى', icon: Music, color: 'bg-amber-100 text-amber-600 border-amber-200' },
    { id: 'cooking', label: 'نشاط طبخ', icon: Flame, color: 'bg-orange-100 text-orange-600 border-orange-200' },
    { id: 'sensory', label: 'نشاط حسي', icon: Star, color: 'bg-sky-100 text-sky-600 border-sky-200' },
    { id: 'montessori', label: 'نشاط Montessori', icon: Brain, color: 'bg-fuchsia-100 text-fuchsia-600 border-fuchsia-200' },
];

interface SchoolActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    activityToEdit: any | null;
    classes: any[];
    employees: any[];
    onSaved: () => void;
}

export const SchoolActivityModal: React.FC<SchoolActivityModalProps> = ({
    isOpen,
    onClose,
    activityToEdit,
    classes,
    employees,
    onSaved
}) => {
    const { success, error: toastError } = useToast();
    const isEdit = !!activityToEdit;

    const [formData, setFormData] = useState({
        title: '',
        type: 'art',
        date: format(new Date(), 'yyyy-MM-dd'),
        classroomId: '',
        supervisorId: '',
        description: '',
        parentNote: '',
    });

    useEffect(() => {
        if (activityToEdit) {
            setFormData({
                title: activityToEdit.title || '',
                type: activityToEdit.type || 'art',
                date: activityToEdit.date || format(new Date(), 'yyyy-MM-dd'),
                classroomId: activityToEdit.classroomId ? String(activityToEdit.classroomId) : '',
                supervisorId: activityToEdit.supervisorId ? String(activityToEdit.supervisorId) : '',
                description: activityToEdit.description || '',
                parentNote: activityToEdit.parentNote || '',
            });
        } else {
            setFormData({
                title: '',
                type: 'art',
                date: format(new Date(), 'yyyy-MM-dd'),
                classroomId: '',
                supervisorId: '',
                description: '',
                parentNote: '',
            });
        }
    }, [activityToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const dataToSave = {
                ...formData,
                classroomId: Number(formData.classroomId),
                supervisorId: Number(formData.supervisorId)
            };

            if (isEdit && activityToEdit?.id) {
                await db.schoolActivities.update(activityToEdit.id, dataToSave);
                success("تم تحديث النشاط بنجاح");
            } else {
                await db.schoolActivities.add(dataToSave);
                success("تم تسجيل النشاط بنجاح");
            }
            onSaved();
            onClose();
        } catch (error) {
            console.error("Error saving activity:", error);
            toastError("حدث خطأ أثناء حفظ النشاط");
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl sticky top-0 z-10">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <Palette className="w-6 h-6 text-sky-600"/> 
                        {isEdit ? 'تعديل النشاط' : 'تسجيل نشاط جديد'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 overflow-y-auto max-h-[75vh]">
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">عنوان النشاط</label>
                            <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold" placeholder="مثال: التلوين بالأصابع، مطابقة الأشكال..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">نوع النشاط</label>
                                <div className="relative">
                                    <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold appearance-none">
                                        {ACTIVITY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        {(() => {
                                            const Icon = ACTIVITY_TYPES.find(t => t.id === formData.type)?.icon || Palette;
                                            return <Icon className="w-5 h-5 text-slate-400" />;
                                        })()}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">التاريخ</label>
                                <input required type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">الفصل الدراسي</label>
                                <select required value={formData.classroomId} onChange={(e) => setFormData({...formData, classroomId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold">
                                    <option value="">-- اختر الفصل --</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">المشرف / المعلم</label>
                                <select required value={formData.supervisorId} onChange={(e) => setFormData({...formData, supervisorId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold">
                                    <option value="">-- المعلم المشرف --</option>
                                    {employees.filter(e => e.role === 'teacher' || e.role === 'supervisor').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">تفاصيل النشاط الداخلي (للإدارة)</label>
                            <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} placeholder="ماذا فعل الأطفال؟ ما هي الأدوات المستخدمة؟..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 font-medium resize-none"></textarea>
                        </div>

                        <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl">
                            <label className="block text-sm font-black text-sky-900 mb-2">رسالة وتحديث لولي الأمر (سيظهر في تطبيق الأهل)</label>
                            <textarea value={formData.parentNote} onChange={(e) => setFormData({...formData, parentNote: e.target.value})} rows={2} placeholder="مثال: استمتع الأطفال اليوم بتجربة الألوان المائية واكتشاف مزج الألوان..." className="w-full px-4 py-3 bg-white border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 font-medium resize-none text-sm"></textarea>
                        </div>

                    </div>
                    
                    <div className="mt-8 flex justify-end gap-3 sticky bottom-0 bg-white pt-4 border-t border-slate-100 z-10">
                        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">إلغاء</button>
                        <button type="submit" className="px-8 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition-colors shadow-lg shadow-sky-200">{isEdit ? 'حفظ التعديلات' : 'تسجيل النشاط'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
