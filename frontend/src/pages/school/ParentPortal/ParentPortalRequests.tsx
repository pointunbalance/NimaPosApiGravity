import React, { useState } from 'react';
import { Send, FileText, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { format } from 'date-fns';
import { useToast } from '../../../context/ToastContext';

export const ParentPortalRequests = () => {
    const { success, error: toastError } = useToast();
    const parentIdStr = localStorage.getItem('parentPortalParentId');
    const parentId = parentIdStr ? Number(parentIdStr) : null;

    const students = useLiveQuery(() => 
        db.schoolStudents?.filter(s => s.guardianId === parentId).toArray()
    ) || [];

    const activeStudents = parentId ? students : useLiveQuery(() => db.schoolStudents?.limit(2).toArray()) || [];

    const [msgForm, setMsgForm] = useState({
        studentId: '',
        type: 'absence',
        subject: '',
        details: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await db.schoolComplaints.add({
                date: new Date().toISOString(),
                status: 'pending',
                type: msgForm.type === 'complaint' ? 'complaint' : msgForm.type === 'absence' ? 'suggestion' : 'other', // Mapping to existing types
                priority: 'normal',
                studentId: Number(msgForm.studentId),
                parentId: parentId || 1, // fallback
                description: `[${msgForm.type === 'absence' ? 'طلب إذن غياب' : msgForm.type === 'meeting' ? 'طلب مقابلة' : 'رسالة/شكوى'}] ${msgForm.subject}\n\n${msgForm.details}`,
                title: msgForm.subject
            });
            success('تم إرسال طلبك بنجاح للإدارة.');
            setMsgForm({ ...msgForm, subject: '', details: '' });
        } catch (error) {
            console.error(error);
            toastError('حدث خطأ أثناء الإرسال');
        } finally {
            setIsSubmitting(false);
        }
    };

    // For demo purposes, we fetch complaints
    const requests = useLiveQuery(() => db.schoolComplaints?.filter(c => c.parentId === (parentId || 1)).toArray()) || [];

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-2xl font-black text-slate-800 mb-2">الطلبات والمراسلات</h1>
                <p className="text-slate-500 font-medium">إرسال أذونات الغياب، طلب مقابلة الإدارة، أو الشكاوى</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm sticky top-24">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Send className="w-5 h-5 text-indigo-600"/> إرسال طلب جديد</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">الطفل</label>
                                <select required value={msgForm.studentId} onChange={e => setMsgForm({...msgForm, studentId: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none text-sm">
                                    <option value="">-- اختر الطفل --</option>
                                    {activeStudents.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">نوع الطلب</label>
                                <select required value={msgForm.type} onChange={e => setMsgForm({...msgForm, type: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none text-sm">
                                    <option value="absence">إذن غياب</option>
                                    <option value="meeting">طلب مقابلة إدارة</option>
                                    <option value="complaint">شكوى أو ملاحظة</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">الموضوع</label>
                                <input required type="text" value={msgForm.subject} onChange={e => setMsgForm({...msgForm, subject: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold outline-none text-sm" placeholder="مثال: غياب لظروف صحية" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">التفاصيل</label>
                                <textarea required value={msgForm.details} onChange={e => setMsgForm({...msgForm, details: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium outline-none resize-none text-sm" rows={4} placeholder="اكتب التفاصيل هنا..."></textarea>
                            </div>

                            <button disabled={isSubmitting || !msgForm.studentId} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition shadow-sm disabled:opacity-50">
                                {isSubmitting ? 'جاري الإرسال...' : 'إرسال للإدارة'}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                     <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-slate-500"/> سجل الطلبات السابقة</h2>
                     
                     {requests.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(req => {
                         const student = students.find(s => s.id === req.studentId) || activeStudents.find(s => s.id === req.studentId);
                         return (
                            <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl text-white ${req.type === 'complaint' ? 'bg-rose-500' : 'bg-indigo-500'}`}>
                                            <FileText className="w-5 h-5"/>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{req.title || req.type}</h3>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{format(new Date(req.date), 'yyyy-MM-dd HH:mm')} • بخصوص: <span className="font-bold text-indigo-600">{student?.name || 'غير محدد'}</span></p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 ${
                                        req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                                        req.status === 'in_progress' ? 'bg-sky-50 text-sky-600 border-sky-200' : 
                                        'bg-emerald-50 text-emerald-600 border-emerald-200'
                                    }`}>
                                        {req.status === 'pending' && <><Clock className="w-3 h-3"/> قيد الانتظار</>}
                                        {req.status === 'in_progress' && <><AlertCircle className="w-3 h-3"/> جاري المراجعة</>}
                                        {req.status === 'resolved' && <><CheckCircle2 className="w-3 h-3"/> تم الرد/الحل</>}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm font-medium text-slate-700 whitespace-pre-line leading-relaxed">
                                    {req.description}
                                </div>
                            </div>
                         )
                     })}

                     {requests.length === 0 && (
                          <div className="text-center py-12 text-slate-400 bg-white rounded-3xl border border-slate-200 border-dashed">
                             <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                             <p className="font-bold">لا توجد طلبات سابقة</p>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};
