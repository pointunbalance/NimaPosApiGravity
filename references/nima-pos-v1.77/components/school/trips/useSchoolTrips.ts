import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { format } from 'date-fns';

export const useSchoolTrips = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState<number | null>(null);

    const [isReportOpen, setIsReportOpen] = useState(false);
    const [reportTripId, setReportTripId] = useState<number | null>(null);

    // Custom confirm modal state
    const [confirmAction, setConfirmAction] = useState<{
        type: 'delete' | 'message';
        id: number;
        title: string;
        message: string;
    } | null>(null);

    const trips = useLiveQuery(() => db.schoolTrips?.toArray()) || [];
    const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
    const employees = useLiveQuery(() => db.users?.toArray()) || [];

    const [formData, setFormData] = useState({
        name: '',
        destination: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        childCost: 0,
        transportCost: 0,
        supervisorIds: [] as number[],
        participants: [] as { studentId: number; parentApproved: boolean; paidAmount: number; attended: boolean }[],
        additionalExpenses: [] as { description: string; amount: number }[],
        isMessageSent: false,
        notes: '',
        capacity: 30
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [newExpenseDesc, setNewExpenseDesc] = useState('');
    const [newExpenseAmount, setNewExpenseAmount] = useState('');

    const handleOpenModal = (editMode = false, item: any = null) => {
        setIsEdit(editMode);
        if (editMode && item) {
            setCurrentId(item.id!);
            setFormData({
                name: item.name || '',
                destination: item.destination || '',
                date: item.date || format(new Date(), 'yyyy-MM-dd'),
                childCost: item.childCost || 0,
                transportCost: item.transportCost || 0,
                supervisorIds: item.supervisorIds || [],
                participants: item.participants || [],
                additionalExpenses: item.additionalExpenses || [],
                isMessageSent: item.isMessageSent || false,
                notes: item.notes || '',
                capacity: item.capacity || 30
            });
        } else {
            setCurrentId(null);
            setFormData({
                name: '',
                destination: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                childCost: 0,
                transportCost: 0,
                supervisorIds: [],
                participants: [],
                additionalExpenses: [],
                isMessageSent: false,
                notes: '',
                capacity: 30
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEdit && currentId) {
                await db.schoolTrips.update(currentId, formData);
            } else {
                await db.schoolTrips.add(formData);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error("Error saving trip:", error);
        }
    };

    const triggerDeleteTrip = (id: number) => {
        setConfirmAction({
            type: 'delete',
            id,
            title: 'حذف الرحلة',
            message: 'هل أنت متأكد من حذف هذه الرحلة نهائياً وجميع البيانات المالية والاشتراكات المتعلقة بها؟'
        });
    };

    const triggerSendBulkMessage = (id: number) => {
        setConfirmAction({
            type: 'message',
            id,
            title: 'إرسال إشعارات جماعية',
            message: 'هل ترغب في إرسال رسالة ترحيبية وتفاصيل الاشتراك بالرحلة لجميع أولياء أمور المشاركين؟'
        });
    };

    const executeConfirmAction = async () => {
        if (!confirmAction) return;
        const { type, id } = confirmAction;

        try {
            if (type === 'delete') {
                await db.schoolTrips.delete(id);
            } else if (type === 'message') {
                await db.schoolTrips.update(id, { isMessageSent: true });
            }
        } catch (error) {
            console.error("Error running confirmed action:", error);
        } finally {
            setConfirmAction(null);
        }
    };

    const toggleStudentSelection = (studentId: number) => {
        const existing = formData.participants.find(p => p.studentId === studentId);
        if (existing) {
            setFormData({
                ...formData,
                participants: formData.participants.filter(p => p.studentId !== studentId)
            });
        } else {
            setFormData({
                ...formData,
                participants: [...formData.participants, { studentId, parentApproved: false, paidAmount: 0, attended: false }]
            });
        }
    };

    const updateParticipant = (studentId: number, field: string, value: any) => {
        setFormData({
            ...formData,
            participants: formData.participants.map(p => p.studentId === studentId ? { ...p, [field]: value } : p)
        });
    };

    const addExpense = () => {
        if (newExpenseDesc && newExpenseAmount) {
            setFormData({
                ...formData,
                additionalExpenses: [...formData.additionalExpenses, { description: newExpenseDesc, amount: Number(newExpenseAmount) }]
            });
            setNewExpenseDesc('');
            setNewExpenseAmount('');
        }
    };

    const removeExpense = (index: number) => {
        const newExp = [...formData.additionalExpenses];
        newExp.splice(index, 1);
        setFormData({ ...formData, additionalExpenses: newExp });
    };

    const generateFinancialReport = (trip: any) => {
        const totalRevenues = trip.participants?.reduce((sum: number, p: any) => sum + Number(p.paidAmount || 0), 0) || 0;
        const transportation = Number(trip.transportCost || 0);
        const additional = trip.additionalExpenses?.reduce((sum: number, ex: any) => sum + Number(ex.amount || 0), 0) || 0;
        const totalExpenses = transportation + additional;
        const profit = totalRevenues - totalExpenses;

        return { totalRevenues, totalExpenses, transportation, additional, profit };
    };

    const filteredTrips = trips.filter(t => t.name.includes(searchQuery) || t.destination.includes(searchQuery));

    return {
        isModalOpen,
        setIsModalOpen,
        isEdit,
        setIsEdit,
        currentId,
        isReportOpen,
        setIsReportOpen,
        reportTripId,
        setReportTripId,
        confirmAction,
        setConfirmAction,
        trips,
        students,
        employees,
        formData,
        setFormData,
        searchQuery,
        setSearchQuery,
        newExpenseDesc,
        setNewExpenseDesc,
        newExpenseAmount,
        setNewExpenseAmount,
        handleOpenModal,
        handleSave,
        triggerDeleteTrip,
        triggerSendBulkMessage,
        executeConfirmAction,
        toggleStudentSelection,
        updateParticipant,
        addExpense,
        removeExpense,
        generateFinancialReport,
        filteredTrips,
    };
};
