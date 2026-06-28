import { useState } from 'react';
import { db } from '../../../db';
import { logActivity } from '../../../utils/logger';

export const useStudentPickup = (
  selectedChildId: number | null,
  myPickups: any[],
  success: (msg: string) => void,
  toastError: (msg: string) => void,
  requestConfirmation: (title: string, message: string, onConfirm: () => void) => void
) => {
  const [newPickup, setNewPickup] = useState({ name: "", phone: "" });

  const handleAddPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return toastError("الرجاء حفظ بيانات الطفل أولاً");
    try {
      await db.authorizedPickups.add({
        ...newPickup,
        studentId: selectedChildId
      });
      await logActivity('students', 'إضافة مصرح', `تم إضافة مصرح استلام: ${newPickup.name}`, undefined, selectedChildId);
      setNewPickup({ name: "", phone: "" });
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemovePickup = async (id: number) => {
    requestConfirmation(
      "حذف مصرح استلام",
      "هل أنت متأكد من الحذف؟",
      async () => {
        const p = myPickups.find(x => x.id === id);
        await db.authorizedPickups.delete(id);
        await logActivity('students', 'حذف مصرح', `تم حذف المصرح بالاستلام: ${p?.name}`, undefined, selectedChildId!);
        success("تم حذف مصرح الاستلام بنجاح.");
      }
    );
  };

  return {
    newPickup,
    setNewPickup,
    handleAddPickup,
    handleRemovePickup
  };
};
