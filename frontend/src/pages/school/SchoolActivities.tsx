import React, { useState } from 'react';
import { Plus, Palette, UserCheck, Calendar, Filter, Trash2, Edit2, Users, CheckCircle2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { SchoolActivityModal, ACTIVITY_TYPES } from '../../components/school/activities/SchoolActivityModal';

export const SchoolActivities = () => {
    const { success, error: toastError } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState<{
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ title: '', message: '', onConfirm: () => {} });

    const triggerConfirmation = (title: string, message: string, onConfirm: () => void) => {
        setConfirmConfig({ title, message, onConfirm });
        setIsConfirmOpen(true);
    };

    const activities = useLiveQuery(() => db.schoolActivities?.toArray()) || [];
    const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];
    const employees = useLiveQuery(() => db.users?.toArray()) || [];

    const [filterClass, setFilterClass] = useState('');
    const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const handleOpenModal = (item: any = null) => {
        setSelectedActivity(item);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        triggerConfirmation("تأكيد الحذف", "هل تريد حذف هذا النشاط؟", async () => {
            try {
                await db.schoolActivities.delete(id);
                success("تم حذف النشاط بنجاح");
            } catch (err) {
                toastError("فشل حذف النشاط");
            }
        });
    };

    const filteredActivities = activities
        .filter(a => filterClass ? a.classroomId === Number(filterClass) : true)
        .filter(a => filterDate ? a.date === filterDate : true)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-sky-100 p-3 rounded-2xl">
                        <Palette className="w-8 h-8 text-sky-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">الأنشطة اليومية المتنوعة</h1>
                        <p className="text-slate-500 font-medium">تسجيل الأنشطة وتوثيقها (رسم، مونتيسوري، رياضة...)</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="bg-transparent border-none focus:outline-none text-sm font-bold text-slate-700 w-28">
                            <option value="">كل الفصول</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-transparent border-none focus:outline-none text-sm font-bold text-slate-700 w-32 font-mono" />
                    </div>
                    <button onClick={() => handleOpenModal()} className="bg-sky-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-sky-700 shadow-md transition-colors shrink-0">
                        <Plus className="w-5 h-5" /> تسجيل نشاط
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredActivities.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-slate-400 font-bold flex flex-col items-center">
                        <Palette className="w-16 h-16 text-slate-200 mb-4" />
                        <p>لا توجد أنشطة مسجلة لهذا الفصل في هذا اليوم.</p>
                    </div>
                ) : (
                    filteredActivities.map(activity => {
                        const typeInfo = ACTIVITY_TYPES.find(t => t.id === activity.type) || ACTIVITY_TYPES[0];
                        const TypeIcon = typeInfo.icon;
                        const cls = classes.find(c => c.id === activity.classroomId);
                        const emp = employees.find(e => e.id === activity.supervisorId);

                        return (
                            <div key={activity.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                                <div className={`h-2 w-full ${typeInfo.color.split(' ')[0]}`}></div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className={`p-2.5 rounded-2xl ${typeInfo.color} shrink-0`}>
                                            <TypeIcon className="w-6 h-6" />
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenModal(activity)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4"/></button>
                                            <button onClick={() => handleDelete(activity.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <h3 className="text-lg font-black text-slate-800 line-clamp-1">{activity.title}</h3>
                                        <span className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-md border ${typeInfo.color}`}>{typeInfo.label}</span>
                                    </div>
                                    
                                    <div className="space-y-3 mb-4 flex-1">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            <span className="font-bold text-slate-700 truncate">{cls?.name || 'فصل غير محدد'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <UserCheck className="w-4 h-4 text-slate-400" />
                                            <span className="font-semibold text-slate-600 truncate">{emp?.name || 'بدون مشرف'}</span>
                                        </div>
                                    </div>
                                    
                                    {activity.description && (
                                        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">
                                            {activity.description}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <span className="text-xs font-mono font-bold text-slate-500">{activity.date}</span>
                                    {activity.parentNote && (
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> يوجد تقرير لولي الأمر</span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <SchoolActivityModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                activityToEdit={selectedActivity}
                classes={classes}
                employees={employees}
                onSaved={() => {}}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setIsConfirmOpen(false)}
            />
        </div>
    );
};

export default SchoolActivities;
