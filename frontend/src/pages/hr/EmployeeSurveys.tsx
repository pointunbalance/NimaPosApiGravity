import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, BarChart2, CheckCircle2, Search, Target, Users, Plus, X, Save, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { EmployeeSurvey } from '../../types';

export default function EmployeeSurveys() {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSurvey, setNewSurvey] = useState<Partial<EmployeeSurvey>>({
        title: '',
        description: '',
        status: 'draft',
        questions: [{ id: Date.now().toString(), text: '', type: 'rating' }]
    });

    const surveys = useLiveQuery(() => db.employeeSurveys.toArray()) || [];
    const responses = useLiveQuery(() => db.employeeSurveyResponses.toArray()) || [];
    const employeesCount = useLiveQuery(() => db.users.where('isActive').equals(1).count()) || 0;

    const handleCreateSurvey = () => {
        setNewSurvey({
            title: '',
            description: '',
            status: 'draft',
            questions: [{ id: Date.now().toString(), text: '', type: 'rating' }]
        });
        setIsCreateModalOpen(true);
    };

    const handleSaveSurvey = async (e: React.FormEvent, status: 'draft' | 'active' = 'draft') => {
        e.preventDefault();
        try {
            await db.employeeSurveys.add({
                ...newSurvey,
                status,
                startDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                questions: newSurvey.questions || []
            } as EmployeeSurvey);
            showToast('تم حفظ الاستبيان بنجاح', 'success');
            setIsCreateModalOpen(false);
        } catch (err) {
            showToast('حدث خطأ أثناء الحفظ', 'error');
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                        <MessageSquare className="w-8 h-8 text-indigo-600" />
                        استبيانات رضا الموظفين (Surveys)
                    </h1>
                    <p className="text-slate-500 mt-1">
                        قياس مستوى رضا الموظفين، جمع الملاحظات، وتحسين بيئة العمل المؤسسية.
                    </p>
                </div>
                <button
                    onClick={handleCreateSurvey}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 font-bold"
                >
                    <CheckCircle2 size={18} /> إنشاء استبيان جديد
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-4">
                        <ThumbsUp size={32} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-500 mb-1">مؤشر السعادة العام</h3>
                    <div className="text-4xl font-black text-slate-800">80%</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                        <Users size={32} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-500 mb-1">نسبة المشاركة في الاستبيانات</h3>
                    <div className="text-4xl font-black text-slate-800">90%</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
                        <Target size={32} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-500 mb-1">المبادرات الناتجة من التغذية الراجعة</h3>
                    <div className="text-4xl font-black text-slate-800">4</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                    <div className="relative max-w-md">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="البحث في الاستبيانات..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600">عنوان الاستبيان</th>
                                <th className="p-4 font-semibold text-slate-600">تاريخ الإطلاق</th>
                                <th className="p-4 font-semibold text-slate-600">نسبة المشاركة</th>
                                <th className="p-4 font-semibold text-slate-600">درجة الرضا العام</th>
                                <th className="p-4 font-semibold text-slate-600">الحالة</th>
                                <th className="p-4 font-semibold text-slate-600">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {surveys.filter(s => s.title.includes(searchTerm)).map(survey => {
                                const surveyResponses = responses.filter(r => r.surveyId === survey.id);
                                const respondedCount = surveyResponses.length;
                                const satisfactionScore = survey.status === 'completed' && respondedCount > 0 ? 85 : null; // This would be calculated based on real rating questions

                                return (
                                <tr key={survey.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-bold text-slate-800">
                                        {survey.title}
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        {new Date(survey.createdAt).toLocaleDateString('ar-SA')}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-slate-200 rounded-full h-2">
                                                <div 
                                                    className="bg-indigo-500 h-2 rounded-full" 
                                                    style={{width: employeesCount > 0 ? `${(respondedCount / employeesCount) * 100}%` : '0%'}}
                                                ></div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">
                                                {respondedCount}/{employeesCount}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {satisfactionScore ? (
                                             <div className="flex items-center gap-1">
                                                 <span className={`font-black ${satisfactionScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                     {satisfactionScore}%
                                                 </span>
                                             </div>
                                        ) : (
                                             <span className="text-slate-400 text-sm">قيد الجمع...</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                                            survey.status === 'completed' 
                                            ? 'bg-emerald-100 text-emerald-700 ' 
                                            : survey.status === 'active' 
                                                ? 'bg-amber-100 text-amber-700 '
                                                : 'bg-slate-100 text-slate-700 '
                                        }`}>
                                            {survey.status === 'completed' ? 'مكتمل' : survey.status === 'active' ? 'نشط (مفتوح)' : 'مسودة'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button className="text-indigo-600 hover:underline text-sm font-bold flex items-center gap-1">
                                            <BarChart2 size={16} /> عرض التحليل
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>

            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Plus className="text-indigo-600" />
                                تصميم استبيان جديد
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-500 bg-white p-2 rounded-full shadow-sm">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <form id="survey-form" className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">عنوان الاستبيان</label>
                                    <input 
                                        required
                                        type="text" 
                                        value={newSurvey.title}
                                        onChange={e => setNewSurvey({...newSurvey, title: e.target.value})}
                                        placeholder="مثال: نبض بيئة العمل 2026"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">وصف تفصيلي (اختياري)</label>
                                    <textarea 
                                        value={newSurvey.description}
                                        onChange={e => setNewSurvey({...newSurvey, description: e.target.value})}
                                        rows={2}
                                        placeholder="الهدف من الاستبيان..."
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                                    ></textarea>
                                </div>

                                <div className="border-t border-slate-100 pt-4 mt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-slate-800">أسئلة الاستبيان</h3>
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                const q = newSurvey.questions || [];
                                                setNewSurvey({...newSurvey, questions: [...q, { id: Date.now().toString(), text: '', type: 'rating' }]});
                                            }}
                                            className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:underline"
                                        >
                                            <Plus size={16} /> إضافة سؤال
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {newSurvey.questions?.map((question, index) => (
                                            <div key={question.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex gap-4 items-start">
                                                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-slate-500 text-sm border border-slate-200 flex-shrink-0">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <input 
                                                        required
                                                        type="text" 
                                                        value={question.text}
                                                        onChange={(e) => {
                                                            const updated = [...newSurvey.questions!];
                                                            updated[index].text = e.target.value;
                                                            setNewSurvey({...newSurvey, questions: updated});
                                                        }}
                                                        placeholder="نص السؤال..."
                                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
                                                    />
                                                    <div className="flex gap-4">
                                                        <label className="flex items-center gap-2 text-sm text-slate-600">
                                                            <input type="radio" checked={question.type === 'rating'} onChange={() => {
                                                                 const updated = [...newSurvey.questions!];
                                                                 updated[index].type = 'rating';
                                                                 setNewSurvey({...newSurvey, questions: updated});
                                                            }} className="text-indigo-600" />
                                                            مقياس تقييم (1-5)
                                                        </label>
                                                        <label className="flex items-center gap-2 text-sm text-slate-600">
                                                            <input type="radio" checked={question.type === 'text'} onChange={() => {
                                                                 const updated = [...newSurvey.questions!];
                                                                 updated[index].type = 'text';
                                                                 setNewSurvey({...newSurvey, questions: updated});
                                                            }} className="text-indigo-600" />
                                                            نص مفتوح
                                                        </label>
                                                    </div>
                                                </div>
                                                {newSurvey.questions!.length > 1 && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = newSurvey.questions!.filter(q => q.id !== question.id);
                                                            setNewSurvey({...newSurvey, questions: updated});
                                                        }}
                                                        className="text-slate-400 hover:text-rose-500 p-2"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition"
                            >
                                إلغاء
                            </button>
                            <button 
                                type="button"
                                onClick={(e) => handleSaveSurvey(e, 'draft')}
                                className="px-5 py-2.5 bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 rounded-xl transition flex items-center gap-2"
                            >
                                <Save size={18} /> حفظ مستودة
                            </button>
                            <button 
                                type="submit"
                                form="survey-form"
                                onClick={(e) => {
                                    const form = document.getElementById('survey-form') as HTMLFormElement;
                                    if(form.checkValidity()){
                                        handleSaveSurvey(e, 'active')
                                    } else {
                                        form.reportValidity();
                                    }
                                }}
                                className="px-5 py-2.5 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl transition flex items-center gap-2"
                            >
                                <CheckCircle2 size={18} /> إطلاق للاستبيان
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
