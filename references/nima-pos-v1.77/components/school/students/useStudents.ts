import { useState, useEffect, useContext } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { logActivity } from '../../../utils/logger';
import { LicenseContext } from '../../ActivationGuard';
import { useToast } from '../../../context/ToastContext';
import { useStudentPickup } from './useStudentPickup';
import { useStudentFinance } from './useStudentFinance';
import { useStudentProfileForms } from './useStudentProfileForms';

export const useStudents = () => {
  const { success, error: toastError } = useToast();
  const license = useContext(LicenseContext);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmParams, setConfirmParams] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const requestConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setConfirmParams({ title, message, onConfirm });
    setConfirmOpen(true);
  };

  const [filterLevel, setFilterLevel] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const children = useLiveQuery(() => db.schoolStudents.toArray()) || [];
  const levels = useLiveQuery(() => db.educationalLevels.orderBy('sortOrder').toArray()) || [];
  const classesList = useLiveQuery(() => db.schoolClassesList.toArray()) || [];
  const guardians = useLiveQuery(() => db.guardians.toArray()) || [];
  const pickups = useLiveQuery(() => db.authorizedPickups.toArray()) || [];
  const myPickups = pickups.filter(p => p.studentId === selectedChildId);

  // Note state for child profile
  const [childNotes, setChildNotes] = useState('');

  const [evalForm, setEvalForm] = useState({ subject: '', score: '', date: '', comments: '' });

  // Core Basic Info Form State
  const [formData, setFormData] = useState<any>({
    code: "", name: "", nationalId: "", levelId: "", classroomId: "", status: "نشط", gender: "ذكر", dateOfBirth: ""
  });
  const [guardianId, setGuardianId] = useState<string>("");

  // Sub-hooks integration
  const {
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
  } = useStudentProfileForms(selectedChildId, children, success, toastError);

  const {
    newPickup,
    setNewPickup,
    handleAddPickup,
    handleRemovePickup
  } = useStudentPickup(selectedChildId, myPickups, success, toastError, requestConfirmation);

  const {
    subForm,
    setSubForm,
    paymentForm,
    setPaymentForm,
    handleAddSubscription,
    handleAddPayment
  } = useStudentFinance(selectedChildId, children);

  useEffect(() => {
    if (selectedChildId) {
      const child = children.find(c => c.id === selectedChildId);
      if (child) {
        setFormData({
          name: child.name || "",
          code: child.code || "",
          nationalId: child.nationalId || "",
          levelId: String(child.levelId || ""),
          classroomId: String(child.classroomId || ""),
          status: child.status || "نشط",
          gender: child.gender || "ذكر",
          dateOfBirth: (child as any).dateOfBirth || child.birthDate || ""
        });
        setGuardianId(String(child.guardianId || ""));
        setChildNotes(child.notes || "");
      }
    } else {
      setFormData({
        code: `CH${Math.floor(Math.random() * 10000)}`, name: "", nationalId: "", levelId: "", classroomId: "", status: "نشط", gender: "ذكر", dateOfBirth: ""
      });
      setGuardianId("");
      setChildNotes("");
    }
  }, [selectedChildId, children]);

  const handleOpenProfile = (id: number | null) => {
    setSelectedChildId(id);
    setActiveTab('info');
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedChildId(null);
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        parentsData: parentsForm,
        levelId: Number(formData.levelId),
        classroomId: Number(formData.classroomId),
        guardianId: guardianId ? Number(guardianId) : null
      };

      if (selectedChildId) {
        await db.schoolStudents.update(selectedChildId, payload);
        await logActivity('students', 'تعديل', `تم تعديل بيانات الطفل ${formData.name}`, undefined, selectedChildId);
      } else {
        if ((children?.length || 0) >= license.maxStudents) {
          toastError(`عذراً، لقد وصلت للحد الأقصى لعدد الأطفال في باقتك (${license.maxStudents}). يرجى ترقية باقتك لإضافة المزيد.`);
          return;
        }
        const newId = await db.schoolStudents.add(payload);
        setSelectedChildId(newId as number);
        await logActivity('students', 'إضافة', `تم إضافة طفل جديد ${formData.name}`, undefined, newId as number);
      }
      success("تم حفظ البيانات بنجاح");
    } catch (err) {
      console.error(err);
      toastError('حدث خطأ أثناء الحفظ');
    }
  };

  const handleLinkGuardian = async () => {
    if (!selectedChildId) return toastError("الرجاء حفظ البيانات الأساسية للطفل أولاً");
    try {
      await db.schoolStudents.update(selectedChildId, { guardianId: Number(guardianId) });
      const guardian = guardians.find(g => g.id === Number(guardianId));
      await logActivity('students', 'ربط ولي أمر', `تم توثيق ربط ولي الأمر ${guardian?.name} بالطفل`, undefined, selectedChildId);
      success("تم ربط ولي الأمر بنجاح");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) return;
    try {
      await db.studentEvaluations.add({ ...evalForm, studentId: selectedChildId });
      await logActivity('studentEvaluations', 'تعديل التقييم', 'تم تسجيل تقييم جديد للطفل', undefined, selectedChildId);
      setEvalForm({ subject: '', score: '', date: '', comments: '' });
    } catch (err) { console.error(err); }
  };

  const handleSaveNotes = async () => {
    if (!selectedChildId) return toastError("الرجاء حفظ البيانات الأساسية للطفل أولاً");
    try {
      await db.schoolStudents.update(selectedChildId, { notes: childNotes });
      await logActivity('students', 'تعديل الملاحظات', `تم تحديث ملاحظات الطفل`, undefined, selectedChildId);
      success("تم حفظ الملاحظات بنجاح");
    } catch (err) {
      console.error(err);
      toastError("حدث خطأ أثناء حفظ الملاحظات");
    }
  };

  // Filter logic
  const filteredChildren = children.filter(child => {
    const s = search.toLowerCase();
    const matchesSearch = !search || 
      child.name?.toLowerCase().includes(s) || 
      child.code?.toLowerCase().includes(s) || 
      child.nationalId?.includes(s);
    const matchesLevel = !filterLevel || child.levelId === Number(filterLevel);
    const matchesClass = !filterClass || child.classroomId === Number(filterClass);
    const matchesStatus = !filterStatus || child.status === filterStatus;
    return matchesSearch && matchesLevel && matchesClass && matchesStatus;
  });

  return {
    search,
    setSearch,
    isModalOpen,
    setIsModalOpen,
    activeTab,
    setActiveTab,
    selectedChildId,
    setSelectedChildId,
    confirmOpen,
    setConfirmOpen,
    confirmParams,
    requestConfirmation,
    filterLevel,
    setFilterLevel,
    filterClass,
    setFilterClass,
    filterStatus,
    setFilterStatus,
    children,
    levels,
    classesList,
    guardians,
    pickups,
    myPickups,
    childNotes,
    setChildNotes,
    subForm,
    setSubForm,
    paymentForm,
    setPaymentForm,
    evalForm,
    setEvalForm,
    formData,
    setFormData,
    medicalForm,
    setMedicalForm,
    behavioralForm,
    setBehavioralForm,
    parentsForm,
    setParentsForm,
    checklistForm,
    setChecklistForm,
    guardianId,
    setGuardianId,
    newPickup,
    setNewPickup,
    handleSaveMedical,
    handleSaveParents,
    handleSaveBehavioral,
    handleSaveChecklist,
    handleOpenProfile,
    handleClose,
    handleSaveInfo,
    handleLinkGuardian,
    handleAddPickup,
    handleRemovePickup,
    handleAddSubscription,
    handleAddPayment,
    handleAddEvaluation,
    handleSaveNotes,
    filteredChildren,
    success
  };
};
