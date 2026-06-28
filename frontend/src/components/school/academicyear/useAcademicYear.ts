import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { useToast } from '../../../context/ToastContext';

export const useAcademicYear = () => {
    const { success, error } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedYearId, setSelectedYearId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        startDate: '',
        endDate: '',
        term1Start: '',
        term1End: '',
        term2Start: '',
        term2End: '',
        isCurrent: false,
        isArchived: false,
        workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        weekendDays: ['Friday', 'Saturday'],
        holidays: [] as { date: string; name: string }[]
    });

    const [newHolidayDate, setNewHolidayDate] = useState('');
    const [newHolidayName, setNewHolidayName] = useState('');

    const daysOfWeek = [
        { id: 'Saturday', name: 'السبت' },
        { id: 'Sunday', name: 'الأحد' },
        { id: 'Monday', name: 'الإثنين' },
        { id: 'Tuesday', name: 'الثلاثاء' },
        { id: 'Wednesday', name: 'الأربعاء' },
        { id: 'Thursday', name: 'الخميس' },
        { id: 'Friday', name: 'الجمعة' },
    ];

    const academicYears = useLiveQuery(() => db.academicYears?.toArray()) || [];
    const levels = useLiveQuery(() => db.educationalLevels?.toArray()) || [];
    const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];

    const handleOpenModal = (year: any = null) => {
        if (year) {
            setSelectedYearId(year.id);
            setFormData({
                name: year.name || '',
                startDate: year.startDate || '',
                endDate: year.endDate || '',
                term1Start: year.term1Start || '',
                term1End: year.term1End || '',
                term2Start: year.term2Start || '',
                term2End: year.term2End || '',
                isCurrent: year.isCurrent || false,
                isArchived: year.isArchived || false,
                workingDays: year.workingDays || ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                weekendDays: year.weekendDays || ['Friday', 'Saturday'],
                holidays: year.holidays || []
            });
        } else {
            setSelectedYearId(null);
            setFormData({
                name: '',
                startDate: '',
                endDate: '',
                term1Start: '',
                term1End: '',
                term2Start: '',
                term2End: '',
                isCurrent: academicYears.length === 0,
                isArchived: false,
                workingDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                weekendDays: ['Friday', 'Saturday'],
                holidays: []
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await db.transaction('rw', db.academicYears, async () => {
                if (formData.isCurrent) {
                    const currentYears = await db.academicYears.where('isCurrent').equals(1).toArray();
                    for (const cy of currentYears) {
                        if (cy.id !== selectedYearId) {
                            await db.academicYears.update(cy.id!, { isCurrent: false });
                        }
                    }
                }

                if (selectedYearId) {
                    await db.academicYears.update(selectedYearId, formData);
                    success('تم تعديل العام الدراسي بنجاح');
                } else {
                    await db.academicYears.add(formData);
                    success('تم إضافة العام الدراسي الجديد بنجاح');
                }
            });
            setIsModalOpen(false);
        } catch (err) {
            console.error("Error saving academic year:", err);
            error("حدث خطأ أثناء حفظ العام الدراسي");
        }
    };

    const handleSetCurrent = async (id: number) => {
        try {
            await db.transaction('rw', db.academicYears, async () => {
                const currentYears = await db.academicYears.where('isCurrent').equals(1).toArray();
                for (const cy of currentYears) {
                    await db.academicYears.update(cy.id!, { isCurrent: false });
                }
                await db.academicYears.update(id, { isCurrent: true, isArchived: false });
            });
            success('تم تعيين العام الدراسي كنشاط حالي');
        } catch (err) {
            console.error(err);
            error('فشل تعيين العام كحالي');
        }
    };

    const [archiveTargetId, setArchiveTargetId] = useState<number | null>(null);
    const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

    const triggerArchive = (id: number) => {
        setArchiveTargetId(id);
        setIsArchiveConfirmOpen(true);
    };

    const handleConfirmArchive = async () => {
        if (archiveTargetId) {
            try {
                await db.academicYears.update(archiveTargetId, { isArchived: true, isCurrent: false });
                success('تم أرشفة العام الدراسي بنجاح');
            } catch (err) {
                error('خطأ في أرشفة العام');
            }
        }
        setIsArchiveConfirmOpen(false);
        setArchiveTargetId(null);
    };

    const handleToggleWorkingDay = (dayId: string) => {
        let newWorkingDays = [...formData.workingDays];
        let newWeekendDays = [...formData.weekendDays];

        if (newWorkingDays.includes(dayId)) {
            newWorkingDays = newWorkingDays.filter(d => d !== dayId);
            newWeekendDays.push(dayId);
        } else {
            newWeekendDays = newWeekendDays.filter(d => d !== dayId);
            newWorkingDays.push(dayId);
        }

        setFormData({ ...formData, workingDays: newWorkingDays, weekendDays: newWeekendDays });
    };

    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [promoteFromLevel, setPromoteFromLevel] = useState('');
    const [promoteToLevel, setPromoteToLevel] = useState('');
    const [isPromoteConfirmOpen, setIsPromoteConfirmOpen] = useState(false);

    const handleOpenPromote = () => {
        setIsPromoteModalOpen(true);
        setPromoteFromLevel('');
        setPromoteToLevel('');
    };

    const handleTryPromote = () => {
        if (!promoteFromLevel || !promoteToLevel) {
            error('يجب اختيار المرحلة المنقول منها والمنقول إليها أولاً');
            return;
        }
        setIsPromoteConfirmOpen(true);
    };

    const handlePromoteStudents = async () => {
        setIsPromoteConfirmOpen(false);
        try {
            const targetStudents = students.filter(s => String(s.levelId) === promoteFromLevel && s.status === 'نشط');
            if (targetStudents.length === 0) {
                error('لا يوجد أطفال نشطين في هذه المرحلة المحددة');
                return;
            }
            
            await db.transaction('rw', db.schoolStudents, async () => {
                for (const s of targetStudents) {
                    await db.schoolStudents.update(s.id!, {
                        levelId: Number(promoteToLevel),
                        classroomId: 0 // Reset class so they can be distributed over new classes
                    });
                }
            });
            
            success(`تم بنجاح نقل عدد ${targetStudents.length} طلاب للمرحلة المختارة وتصفير فصولهم للعام الجديد.`);
            setIsPromoteModalOpen(false);
        } catch (err) {
            console.error(err);
            error("حدث خطأ أثناء ترقية الطلاب");
        }
    };

    return {
        isModalOpen,
        setIsModalOpen,
        selectedYearId,
        formData,
        setFormData,
        newHolidayDate,
        setNewHolidayDate,
        newHolidayName,
        setNewHolidayName,
        daysOfWeek,
        academicYears,
        levels,
        students,
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
    };
};
