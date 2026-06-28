import React from 'react';
import { Plus, Calendar, Flag, CheckCircle2, Archive, RotateCcw } from 'lucide-react';
import { useAcademicYear } from '../../components/school/academicyear/useAcademicYear';
import { AcademicYearModal, PromoteModal } from '../../components/school/academicyear/AcademicYearModals';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const SchoolAcademicYear = () => {
    const {
        isModalOpen,
        setIsModalOpen,
        selectedYearId,
        formData,
        setFormData,
        daysOfWeek,
        academicYears,
        levels,
        handleOpenModal,
        handleSave,
        handleSetCurrent,
        isArchiveConfirmOpen,
        setIsArchiveConfirmOpen,
        triggerArchive,
        handleConfirmArchive,
        handleToggleWorkingDay,
        isPromoteModalOpen,
        setIsPromoteModalOpen,
        promoteFromLevel,
        setPromoteFromLevel,
        promoteToLevel,
        setPromoteToLevel,
        isPromoteConfirmOpen,
        setIsPromoteConfirmOpen,
        handleOpenPromote,
        handleTryPromote,
        handlePromoteStudents,
    } = useAcademicYear();

    return (
        <div className="p-6" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                        <Calendar className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">الأعوام الدراسية</h1>
                        <p className="text-sm text-slate-500 font-medium">إدارة فترات السنة، الإجازات، وترقية الطلاب</p>
                    </div>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 font-bold transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" /> عام دراسي جديد
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {academicYears
                    .sort((a, b) => {
                        if (a.isCurrent !== b.isCurrent) return a.isCurrent ? -1 : 1;
                        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                    })
                    .map((year) => (
                        <div
                            key={year.id}
                            className={`bg-white rounded-2xl border ${
                                year.isCurrent
                                    ? 'border-emerald-300 ring-2 ring-emerald-100 shadow-md'
                                    : year.isArchived
                                    ? 'border-slate-200 opacity-75'
                                    : 'border-slate-200 shadow-sm'
                            } overflow-hidden flex flex-col`}
                        >
                            <div
                                className={`p-4 border-b flex justify-between items-center ${
                                    year.isCurrent
                                        ? 'bg-emerald-50 border-emerald-100'
                                        : year.isArchived
                                        ? 'bg-slate-50 border-slate-200'
                                        : 'bg-white border-slate-100'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-black text-slate-800" dir="ltr">
                                        {year.name}
                                    </h3>
                                    {year.isCurrent && (
                                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> الحالي
                                        </span>
                                    )}
                                    {year.isArchived && (
                                        <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Archive className="w-3 h-3" /> مؤرشف
                                        </span>
                                    )}
                                </div>
                                {!year.isArchived && (
                                    <button
                                        onClick={() => handleOpenModal(year)}
                                        className="text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg text-sm font-bold transition-colors"
                                    >
                                        تعديل
                                    </button>
                                )}
                            </div>

                            <div className="p-5 flex-1 flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-slate-500 font-medium mb-1">تاريخ البدء</p>
                                        <p className="font-bold text-slate-800 font-mono">{year.startDate || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-medium mb-1">تاريخ الانتهاء</p>
                                        <p className="font-bold text-slate-800 font-mono">{year.endDate || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-medium mb-1">أيام العمل</p>
                                        <p className="font-bold text-slate-800">{year.workingDays?.length || 5} أيام</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-500 font-medium mb-1">إجازات الأسبوع</p>
                                        <p className="font-bold text-rose-600">{year.weekendDays?.length || 2} أيام</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                                {!year.isCurrent && !year.isArchived && (
                                    <button
                                        onClick={() => handleSetCurrent(year.id)}
                                        className="flex-1 bg-white border border-slate-200 text-slate-700 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Flag className="w-4 h-4" /> تعيين كحالي
                                    </button>
                                )}
                                {year.isCurrent && (
                                    <button
                                        onClick={handleOpenPromote}
                                        className="flex-1 bg-indigo-50 border border-indigo-100 text-indigo-700 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <RotateCcw className="w-4 h-4" /> ترقية الأطفال
                                    </button>
                                )}
                                {!year.isArchived && (
                                    <button
                                        onClick={() => triggerArchive(year.id)}
                                        className="px-4 bg-white border border-slate-200 text-slate-600 py-2 rounded-xl text-sm font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors flex items-center justify-center"
                                        title="أرشفة العام الدراسي"
                                    >
                                        <Archive className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                {academicYears.length === 0 && (
                    <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-slate-500">
                        <Calendar className="w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold mb-2">لا توجد أعوام دراسية</h3>
                        <p className="mb-6 text-center max-w-sm">
                            قم بإضافة العام الدراسي الأول لضبط تقويم الحضور والانصراف والمصروفات الخاصة بالأطفال.
                        </p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-sm transition-colors"
                        >
                            إضافة عام دراسي
                        </button>
                    </div>
                )}
            </div>

            <AcademicYearModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selectedYearId={selectedYearId}
                formData={formData}
                setFormData={setFormData}
                handleSave={handleSave}
                daysOfWeek={daysOfWeek}
                handleToggleWorkingDay={handleToggleWorkingDay}
            />

            <PromoteModal
                isOpen={isPromoteModalOpen}
                onClose={() => setIsPromoteModalOpen(false)}
                promoteFromLevel={promoteFromLevel}
                setPromoteFromLevel={setPromoteFromLevel}
                promoteToLevel={promoteToLevel}
                setPromoteToLevel={setPromoteToLevel}
                levels={levels}
                onPromote={handleTryPromote}
            />

            {/* Confirm Archiving Academic Year */}
            <ConfirmModal
                isOpen={isArchiveConfirmOpen}
                title="تأكيد أرشفة العام الدراسي"
                message="تحذير: أرشفة العام الدراسي ستحتفظ به كسجل تاريخي للاطلاع فقط وتمنع أي تعديلات عليه. هل أنت متأكد؟"
                onConfirm={handleConfirmArchive}
                onCancel={() => setIsArchiveConfirmOpen(false)}
                confirmText="نعم، أرشفة"
                cancelText="إلغاء"
            />

            {/* Confirm Promoting Students */}
            <ConfirmModal
                isOpen={isPromoteConfirmOpen}
                title="تأكيد ترقية الأطفال للعام الجديد"
                message="تأكيد نقل الأطفال النشطين من المرحلة المحددة إلى المرحلة الجديدة مع تصفير تعيين الفصول في هذا العام الدراسي الجديد؟"
                onConfirm={handlePromoteStudents}
                onCancel={() => setIsPromoteConfirmOpen(false)}
                confirmText="تأكيد النقل والترقية"
                cancelText="إلغاء"
            />
        </div>
    );
};

export default SchoolAcademicYear;
