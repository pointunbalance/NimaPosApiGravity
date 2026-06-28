import React, { useState } from 'react';
import { AlertTriangle, Plus, Filter, ShieldAlert, CheckCircle2, Clock, Megaphone, MessageSquareWarning, UserX, Info } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { format } from 'date-fns';
import { CreateComplaintModal, ResolutionModal } from '../../components/school/ComplaintModals';

const COMPLAINT_TYPES = [
    { id: 'parent_complaint', label: 'شكوى من ولي أمر', icon: Megaphone, color: 'text-indigo-600 bg-indigo-100' },
    { id: 'student_issue', label: 'شكوى/ملاحظة عن طفل', icon: MessageSquareWarning, color: 'text-amber-600 bg-amber-100' },
    { id: 'employee_issue', label: 'شكوى عن موظف', icon: UserX, color: 'text-rose-600 bg-rose-100' },
    { id: 'admin_note', label: 'ملاحظة إدارية', icon: Info, color: 'text-sky-600 bg-sky-100' },
];

const PRIORITIES = [
    { id: 'high', label: 'عالية جداً', color: 'bg-red-100 text-red-700 border-red-200' },
    { id: 'medium', label: 'متوسطة', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 'low', label: 'عادية', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
];

const STATUSES = [
    { id: 'new', label: 'جديدة', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { id: 'in_progress', label: 'قيد المتابعة', color: 'bg-sky-100 text-sky-700 border-sky-200' },
    { id: 'resolved', label: 'تم الحل', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { id: 'closed', label: 'مغلقة', color: 'bg-slate-800 text-white border-slate-700' },
];

export const SchoolComplaints = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');

    const complaints = useLiveQuery(() => 
        db.schoolComplaints?.orderBy('date').reverse().toArray()
    ) || [];
    const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
    const employees = useLiveQuery(() => db.users?.toArray()) || [];
    
    const safeEmployees = employees || [];

    const [form, setForm] = useState({
        type: 'parent_complaint',
        title: '',
        description: '',
        priority: 'medium',
        status: 'new',
        assignedTo: '',
        studentId: '',
        employeeId: '',
        parentId: '',
        date: format(new Date(), 'yyyy-MM-dd')
    });

    const [resolutionForm, setResolutionForm] = useState({
        status: '',
        resolutionNote: '',
        replyDate: format(new Date(), 'yyyy-MM-dd')
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        await db.schoolComplaints.add({
            ...form,
            studentId: form.studentId ? Number(form.studentId) : undefined,
            employeeId: form.employeeId ? Number(form.employeeId) : undefined
        });
        setIsCreateModalOpen(false);
        setForm({
            type: 'parent_complaint',
            title: '',
            description: '',
            priority: 'medium',
            status: 'new',
            assignedTo: '',
            studentId: '',
            employeeId: '',
            parentId: '',
            date: format(new Date(), 'yyyy-MM-dd')
        });
    };

    const handleOpenResolution = (complaint: any) => {
        setSelectedComplaint(complaint);
        setResolutionForm({
            status: complaint.status,
            resolutionNote: complaint.resolutionNote || '',
            replyDate: complaint.replyDate || format(new Date(), 'yyyy-MM-dd')
        });
    };

    const handleUpdateResolution = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedComplaint) return;
        
        await db.schoolComplaints.update(selectedComplaint.id, {
            status: resolutionForm.status,
            resolutionNote: resolutionForm.resolutionNote,
            replyDate: resolutionForm.replyDate
        });
        setSelectedComplaint(null);
    };

    const filteredComplaints = complaints.filter(c => {
        if (filterStatus !== 'all' && c.status !== filterStatus) return false;
        if (filterType !== 'all' && c.type !== filterType) return false;
        return true;
    });

    const getStatusInfo = (statusId: string) => STATUSES.find(s => s.id === statusId) || STATUSES[0];
    const getPriorityInfo = (priorityId: string) => PRIORITIES.find(p => p.id === priorityId) || PRIORITIES[0];
    const getTypeInfo = (typeId: string) => COMPLAINT_TYPES.find(t => t.id === typeId) || COMPLAINT_TYPES[0];

    return (
        <div className="p-6" dir="rtl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="bg-red-100 p-3 rounded-2xl">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-800">الشكاوى والملاحظات</h1>
                        <p className="text-slate-500 font-medium">إدارة الشكاوى، متابعة الحلول، والردود</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-700 transition shadow-sm shadow-red-200"
                >
                    <Plus className="w-5 h-5"/> إضافة شكوى / ملاحظة
                </button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center mb-6">
                <div className="flex items-center gap-2 text-slate-500 font-bold">
                    <Filter className="w-4 h-4"/> تصفية:
                </div>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-red-500 outline-none">
                    <option value="all">جميع الحالات</option>
                    {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-4 py-2 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-red-500 outline-none">
                    <option value="all">جميع الأنواع</option>
                    {COMPLAINT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredComplaints.map(complaint => {
                    const status = getStatusInfo(complaint.status);
                    const priority = getPriorityInfo(complaint.priority);
                    const type = getTypeInfo(complaint.type);

                    return (
                        <div key={complaint.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                            <div className="p-5 border-b border-slate-100 flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl ${type.color}`}>
                                        <type.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500">{type.label}</p>
                                        <p className="text-sm font-bold text-slate-800">{complaint.date}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${priority.color}`}>
                                    {priority.label}
                                </span>
                            </div>

                            <div className="p-5 flex-1 space-y-4">
                                <div>
                                    <h3 className="font-black text-slate-800 text-lg mb-1">{complaint.title}</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{complaint.description}</p>
                                </div>

                                <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-2 border border-slate-100 font-medium text-slate-600">
                                    {complaint.studentId && (
                                        <div className="flex justify-between border-b border-slate-200 pb-2">
                                            <span>الطفل المعني:</span>
                                            <span className="font-bold text-slate-800">{students.find(s => s.id === complaint.studentId)?.name || 'غير معروف'}</span>
                                        </div>
                                    )}
                                    {complaint.employeeId && (
                                        <div className="flex justify-between border-b border-slate-200 pb-2">
                                            <span>الموظف المعني:</span>
                                            <span className="font-bold text-slate-800">{safeEmployees.find(e => e.id === complaint.employeeId)?.name || 'غير معروف'}</span>
                                        </div>
                                    )}
                                    {complaint.parentId && (
                                        <div className="flex justify-between border-b border-slate-200 pb-2">
                                            <span>ولي الأمر:</span>
                                            <span className="font-bold text-slate-800">{complaint.parentId}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between pt-1">
                                        <span>المسؤول عن المتابعة:</span>
                                        <span className="font-bold text-slate-800">{complaint.assignedTo || 'لم يحدد'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${status.color}`}>
                                    {complaint.status === 'resolved' || complaint.status === 'closed' ? <CheckCircle2 className="w-3.5 h-3.5"/> : <Clock className="w-3.5 h-3.5"/>}
                                    {status.label}
                                </span>
                                
                                <button 
                                    onClick={() => handleOpenResolution(complaint)}
                                    className="text-xs font-bold bg-white text-slate-600 hover:text-red-600 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-red-200 hover:bg-red-50 transition-colors"
                                >
                                    متابعة / تحديث
                                </button>
                            </div>
                        </div>
                    );
                })}
                {filteredComplaints.length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                        <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-bold text-lg text-slate-600">لا توجد شكاوى أو ملاحظات حالياً</p>
                    </div>
                )}
            </div>

            <CreateComplaintModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                form={form}
                setForm={setForm}
                onSubmit={handleCreate}
                students={students}
                employees={safeEmployees}
                COMPLAINT_TYPES={COMPLAINT_TYPES}
                PRIORITIES={PRIORITIES}
            />

            <ResolutionModal
                complaint={selectedComplaint}
                onClose={() => setSelectedComplaint(null)}
                resolutionForm={resolutionForm}
                setResolutionForm={setResolutionForm}
                onSubmit={handleUpdateResolution}
                STATUSES={STATUSES}
            />
        </div>
    );
};

export default SchoolComplaints;
