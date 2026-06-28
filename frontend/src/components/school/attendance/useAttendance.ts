import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { useToast } from '../../../context/ToastContext';

export const useAttendance = () => {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'daily' | 'records' | 'pickups'>('daily');
  
  const students = useLiveQuery(() => db.schoolStudents?.toArray()) || [];
  const allAttendance = useLiveQuery(() => db.studentAttendances?.toArray()) || [];
  const allPickups = useLiveQuery(() => db.authorizedPickups?.toArray()) || [];

  // State for daily check-in/out
  const [selectedStudentId, setSelectedStudentId] = useState<number>(0);
  const [pickupId, setPickupId] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const today = new Date().toISOString().split('T')[0];

  // Authorized Pickups state
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [pickupFormData, setPickupFormData] = useState<any>({
     studentId: 0, name: '', relation: '', phone: '', nationalId: '', isAllowed: true, notes: ''
  });

  // Custom Confirm modal states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const requestConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmConfig({ title, message, onConfirm });
    setConfirmOpen(true);
  };

  // Custom prompt state for absence reason
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptStudentId, setPromptStudentId] = useState<number | null>(null);
  const [absenceReasonText, setAbsenceReasonText] = useState('');

  const getStudentName = (id: number) => students.find(s => s.id === id)?.name || 'غير معروف';

  const handleCheckIn = async () => {
     if (!selectedStudentId) return;
     
     const existing = allAttendance.find(a => a.studentId === selectedStudentId && a.date === today);
     if (existing) {
         if (existing.checkInTime) {
            toastError('تم تسجيل حضور الطفل مسبقاً اليوم!');
            return;
         } else {
            await db.studentAttendances.update(existing.id, {
               status: 'present',
               checkInTime: new Date().toLocaleTimeString('ar-EG'),
            });
         }
     } else {
         await db.studentAttendances.add({
            studentId: selectedStudentId,
            date: today,
            status: 'present',
            checkInTime: new Date().toLocaleTimeString('ar-EG'),
         });
     }
     
     success(`تم تسجيل حضور: ${getStudentName(selectedStudentId)} - تم إرسال تنبيه لولي الأمر.`);
     setSelectedStudentId(0);
  };

  const executeCheckOut = async () => {
    const existing = allAttendance.find(a => a.studentId === selectedStudentId && a.date === today);
    if (existing) {
        await db.studentAttendances.update(existing.id, {
           checkOutTime: new Date().toLocaleTimeString('ar-EG'),
           pickedUpById: pickupId,
           notes: notes || existing.notes
        });
    } else {
        await db.studentAttendances.add({
           studentId: selectedStudentId,
           date: today,
           status: 'present',
           checkOutTime: new Date().toLocaleTimeString('ar-EG'),
           pickedUpById: pickupId,
           notes: notes
        });
    }
    
    success(`تم تسجيل انصراف: ${getStudentName(selectedStudentId)} - تم إرسال تنبيه لولي الأمر.`);
    setSelectedStudentId(0);
    setPickupId(0);
    setNotes('');
  };

  const handleCheckOut = async () => {
     if (!selectedStudentId) return;
     if (!pickupId) return toastError('يرجى اختيار الشخص المستلم!');
     
     const existing = allAttendance.find(a => a.studentId === selectedStudentId && a.date === today);
     if (!existing || !existing.checkInTime) {
         requestConfirmation(
           'تحذير الدخول',
           'الطفل غير مسجل حضوره اليوم! هل تريد تسجيل انصرافه على أي حال؟',
           executeCheckOut
         );
         return;
     }
     if (existing && existing.checkOutTime) {
         toastError('تم تسجيل انصراف الطفل مسبقاً اليوم!');
         return;
     }

     await executeCheckOut();
  };

  const markAbsent = async (id: number, reason: string = '') => {
     const existing = allAttendance.find(a => a.studentId === id && a.date === today);
     if (existing) {
        await db.studentAttendances.update(existing.id, {
           status: 'absent',
           absenceReason: reason
        });
     } else {
        await db.studentAttendances.add({
           studentId: id,
           date: today,
           status: 'absent',
           absenceReason: reason
        });
     }
     success('تم إثبات غياب الطالب اليوم.');
  };

  const triggerAbsencePrompt = (id: number) => {
    setPromptStudentId(id);
    setAbsenceReasonText('');
    setPromptOpen(true);
  };

  const handleAbsencePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (promptStudentId !== null) {
      markAbsent(promptStudentId, absenceReasonText);
    }
    setPromptOpen(false);
    setPromptStudentId(null);
  };

  const handleSavePickup = async (e: React.FormEvent) => {
     e.preventDefault();
     if (pickupFormData.id) {
        await db.authorizedPickups.update(pickupFormData.id, pickupFormData);
        success('تم تحديث بيانات الشخص المفوض');
     } else {
        await db.authorizedPickups.add({...pickupFormData, photoUrl: '', idCardPhotoUrl: ''});
        success('تم إضافة الشخص المفوض بنجاح');
     }
     setPickupModalOpen(false);
     setPickupFormData({ studentId: 0, name: '', relation: '', phone: '', nationalId: '', isAllowed: true, notes: '' });
  };

  const handleDeletePickup = (id: number) => {
    requestConfirmation(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذا الشخص المفوض؟',
      async () => {
        try {
          await db.authorizedPickups.delete(id);
          success('تم الحذف بنجاح');
        } catch (err) {
          console.error(err);
          toastError('فشل الحذف');
        }
      }
    );
  };

  return {
    activeTab,
    setActiveTab,
    students,
    allAttendance,
    allPickups,
    selectedStudentId,
    setSelectedStudentId,
    pickupId,
    setPickupId,
    notes,
    setNotes,
    today,
    pickupModalOpen,
    setPickupModalOpen,
    pickupFormData,
    setPickupFormData,
    confirmOpen,
    setConfirmOpen,
    confirmConfig,
    promptOpen,
    setPromptOpen,
    absenceReasonText,
    setAbsenceReasonText,
    getStudentName,
    handleCheckIn,
    handleCheckOut,
    handleSavePickup,
    handleDeletePickup,
    triggerAbsencePrompt,
    handleAbsencePromptSubmit
  };
};
