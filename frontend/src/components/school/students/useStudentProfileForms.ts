import { useState, useEffect } from 'react';
import { db } from '../../../db';
import { logActivity } from '../../../utils/logger';

export const useStudentProfileForms = (
  selectedChildId: number | null,
  children: any[],
  success: (msg: string) => void,
  toastError: (msg: string) => void
) => {
  const [medicalForm, setMedicalForm] = useState<any>({
    foodAllergies: "", medicineAllergies: "", chronicDiseases: "", dailyMedications: "", allowNurseryToGiveMeds: false, doctorName: "", doctorPhone: "", preferredHospital: "", extraEmergencyPhone: "", bloodType: "", dietaryNotes: "", psychologicalOrBehavioralNotes: ""
  });
  const [behavioralForm, setBehavioralForm] = useState<any>({
    isShy: false, criesALot: false, isAggressive: false, needsSpeechFollowUp: false, needsMovementFollowUp: false, difficultyIntegrating: false, firstWeekNotes: "", acclimatizationPlan: ""
  });
  const [parentsForm, setParentsForm] = useState<any>({
    fatherName: "", fatherPhone: "", fatherQualification: "", fatherJob: "",
    motherName: "", motherPhone: "", motherQualification: "", motherJob: ""
  });
  const [checklistForm, setChecklistForm] = useState<any>({
    bagDelivered: false, uniformDelivered: false, booksDelivered: false, birthCertificateReceived: false, guardianIdCopyReceived: false, subscriptionContractSigned: false, tripConsentSigned: false, photographyConsentSigned: false
  });

  useEffect(() => {
    if (selectedChildId) {
      const child = children.find(c => c.id === selectedChildId);
      if (child) {
        setMedicalForm(child.medicalProfile || {
          foodAllergies: "", medicineAllergies: "", chronicDiseases: "", dailyMedications: "", allowNurseryToGiveMeds: false, doctorName: "", doctorPhone: "", preferredHospital: "", extraEmergencyPhone: "", bloodType: "", dietaryNotes: "", psychologicalOrBehavioralNotes: ""
        });
        setBehavioralForm(child.behavioralProfile || {
          isShy: false, criesALot: false, isAggressive: false, needsSpeechFollowUp: false, needsMovementFollowUp: false, difficultyIntegrating: false, firstWeekNotes: "", acclimatizationPlan: ""
        });
        setChecklistForm(child.administrativeChecklist || {
          bagDelivered: false, uniformDelivered: false, booksDelivered: false, birthCertificateReceived: false, guardianIdCopyReceived: false, subscriptionContractSigned: false, tripConsentSigned: false, photographyConsentSigned: false
        });
        setParentsForm(child.parentsData || {
          fatherName: "", fatherPhone: "", fatherQualification: "", fatherJob: "",
          motherName: "", motherPhone: "", motherQualification: "", motherJob: ""
        });
      }
    } else {
      setMedicalForm({
        foodAllergies: "", medicineAllergies: "", chronicDiseases: "", dailyMedications: "", allowNurseryToGiveMeds: false, doctorName: "", doctorPhone: "", preferredHospital: "", extraEmergencyPhone: "", bloodType: "", dietaryNotes: "", psychologicalOrBehavioralNotes: ""
      });
      setBehavioralForm({
        isShy: false, criesALot: false, isAggressive: false, needsSpeechFollowUp: false, needsMovementFollowUp: false, difficultyIntegrating: false, firstWeekNotes: "", acclimatizationPlan: ""
      });
      setChecklistForm({
        bagDelivered: false, uniformDelivered: false, booksDelivered: false, birthCertificateReceived: false, guardianIdCopyReceived: false, subscriptionContractSigned: false, tripConsentSigned: false, photographyConsentSigned: false
      });
      setParentsForm({
        fatherName: "", fatherPhone: "", fatherQualification: "", fatherJob: "",
        motherName: "", motherPhone: "", motherQualification: "", motherJob: ""
      });
    }
  }, [selectedChildId, children]);

  const handleSaveMedical = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return toastError("الرجاء حفظ البيانات الأساسية أولاً");
    try {
      await db.schoolStudents.update(selectedChildId, { medicalProfile: medicalForm });
      await logActivity('students', 'تحديث طبي', `تم تحديث الملف الطبي للطفل`, undefined, selectedChildId);
      success("تم حفظ الملف الطبي بنجاح");
    } catch (err) {
      console.error(err);
      toastError("حدث خطأ أثناء حفظ الملف الطبي");
    }
  };

  const handleSaveParents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return toastError("الرجاء حفظ البيانات الأساسية أولاً");
    try {
      await db.schoolStudents.update(selectedChildId, { parentsData: parentsForm });
      await logActivity('students', 'تحديث أولياء الأمور', `تم تحديث بيانات الوالدين للطفل`, undefined, selectedChildId);
      success("تم حفظ بيانات الوالدين بنجاح");
    } catch (err) {
      console.error(err);
      toastError("حدث خطأ أثناء حفظ بيانات الوالدين");
    }
  };

  const handleSaveBehavioral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return toastError("الرجاء حفظ البيانات الأساسية أولاً");
    try {
      await db.schoolStudents.update(selectedChildId, { behavioralProfile: behavioralForm });
      await logActivity('students', 'تحديث سلوكي', `تم تحديث السجل السلوكي للطفل`, undefined, selectedChildId);
      success("تم حفظ السجل السلوكي بنجاح");
    } catch (err) {
      console.error(err);
      toastError("حدث خطأ أثناء حفظ السجل السلوكي");
    }
  };

  const handleSaveChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return toastError("الرجاء حفظ البيانات الأساسية أولاً");
    try {
      await db.schoolStudents.update(selectedChildId, { administrativeChecklist: checklistForm });
      await logActivity('students', 'تحديث مهام', `تم تحديث المهام الإدارية للطفل`, undefined, selectedChildId);
      success("تم حفظ المهام الإدارية بنجاح");
    } catch (err) {
      console.error(err);
      toastError("حدث خطأ أثناء حفظ المهام الإدارية");
    }
  };

  return {
    medicalForm,
    setMedicalForm,
    behavioralForm,
    setBehavioralForm,
    parentsForm,
    setParentsForm,
    checklistForm,
    setChecklistForm,
    handleSaveMedical,
    handleSaveParents,
    handleSaveBehavioral,
    handleSaveChecklist
  };
};
