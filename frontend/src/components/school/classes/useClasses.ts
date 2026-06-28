import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { useToast } from '../../../context/ToastContext';
import { 
  INITIAL_LEVEL_FORM, 
  INITIAL_CLASS_FORM,
  saveLevelInDb,
  saveClassInDb,
  deleteLevelFromDb,
  deleteClassFromDb,
  transferStudentsInDb,
  promoteStudentsInDb
} from './classConstants';

export const useClasses = () => {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'levels' | 'classes'>('levels');
  const [search, setSearch] = useState('');
  
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Class Profile
  const [isClassProfileOpen, setIsClassProfileOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [profileTab, setProfileTab] = useState<'info' | 'students' | 'schedule'>('info');
  
  // Bulk Transfer
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedStudentsToTransfer, setSelectedStudentsToTransfer] = useState<number[]>([]);
  const [transferTargetClass, setTransferTargetClass] = useState<string>('');

  // Confirm Modal state
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

  const [levelFormData, setLevelFormData] = useState(INITIAL_LEVEL_FORM);
  const [classFormData, setClassFormData] = useState(INITIAL_CLASS_FORM);

  const levels = useLiveQuery(() => db.educationalLevels.orderBy('sortOrder').toArray()) || [];
  const classesList = useLiveQuery(() => db.schoolClassesList.toArray()) || [];
  const students = useLiveQuery(() => db.schoolStudents.toArray()) || [];

  const filteredLevels = levels.filter(lvl => lvl.name.includes(search));
  const filteredClasses = classesList.filter(cls => 
    cls.name.includes(search) || 
    (cls.teacherName && cls.teacherName.includes(search))
  );

  const handleOpenLevelModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id);
      setLevelFormData({
        name: item.name,
        sortOrder: String(item.sortOrder || "1"),
        ageFrom: String(item.ageFrom || "3"),
        ageTo: String(item.ageTo || "4"),
        isActive: item.isActive ?? true
      });
    } else {
      setCurrentId(null);
      setLevelFormData({ ...INITIAL_LEVEL_FORM, sortOrder: String(levels.length + 1) });
    }
    setIsLevelModalOpen(true);
  };

  const handleOpenClassModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id);
      setClassFormData({
        name: item.name,
        levelId: String(item.levelId || levels[0]?.id || ""),
        capacity: String(item.capacity || "20"),
        teacherName: item.teacherName || "",
        assistantName: item.assistantName || "",
        status: item.status || "متاح",
        notes: item.notes || ""
      });
    } else {
      setCurrentId(null);
      setClassFormData({
        ...INITIAL_CLASS_FORM,
        levelId: String(levels[0]?.id || "")
      });
    }
    setIsClassModalOpen(true);
  };

  const handleSaveLevel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveLevelInDb(isEdit, currentId, levelFormData);
      success(isEdit ? 'تم تحديث المستوى بنجاح' : 'تم إضافة المستوى بنجاح');
      setIsLevelModalOpen(false);
    } catch (err) {
      console.error(err);
      toastError('حدث خطأ أثناء الحفظ');
    }
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!levelFormData && !classFormData.levelId) {
         toastError("يرجى اختيار المستوى");
         return;
      }
      await saveClassInDb(isEdit, currentId, classFormData);
      success(isEdit ? 'تم تحديث الفصل بنجاح' : 'تم إضافة الفصل بنجاح');
      setIsClassModalOpen(false);
    } catch (err) {
      console.error(err);
      toastError('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDeleteLevel = (id: number) => {
    triggerConfirmation('تأكيد الحذف', 'هل أنت متأكد من حذف هذا المستوى؟ سيتم فقدان ارتباط الفصول به.', async () => {
      try {
        await deleteLevelFromDb(id);
        success('تم حذف المستوى بنجاح');
      } catch (err) {
        toastError('فشل حذف المستوى');
      }
    });
  };

  const handleDeleteClass = (id: number) => {
    triggerConfirmation('تأكيد الحذف', 'هل أنت متأكد من حذف هذا الفصل؟', async () => {
      try {
        await deleteClassFromDb(id);
        success('تم حذف الفصل بنجاح');
      } catch (err) {
        toastError('فشل حذف الفصل');
      }
    });
  };

  const getClassStudentsCount = (classId: number) => students.filter(s => s.classroomId === classId).length;
  
  const getLevelName = (levelId: number) => levels.find(l => l.id === levelId)?.name || 'غير محدد';

  const handleOpenClassProfile = (clsId: number) => {
    setSelectedClassId(clsId);
    setProfileTab('info');
    setIsClassProfileOpen(true);
  };
  
  const selectedClass = classesList.find(c => c.id === selectedClassId);
  const classStudents = students.filter(s => s.classroomId === selectedClassId);
  const selectedLevel = levels.find(l => l.id === selectedClass?.levelId);

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudentsToTransfer(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
  };
  
  const handleSelectAllStudents = () => {
    if (selectedStudentsToTransfer.length === classStudents.length) {
      setSelectedStudentsToTransfer([]);
    } else {
      setSelectedStudentsToTransfer(classStudents.map(s => s.id!));
    }
  };

  const executeTransfer = async () => {
      if (!transferTargetClass || selectedStudentsToTransfer.length === 0) return;
      try {
         await transferStudentsInDb(selectedStudentsToTransfer, transferTargetClass);
         success("تم نقل الأطفال بنجاح");
         setTransferModalOpen(false);
         setSelectedStudentsToTransfer([]);
      } catch(err) {
         console.error(err);
         toastError("فشل نقل الأطفال");
      }
  };

  const handlePromoteStudents = (levelId: number) => {
    const lvl = levels.find(l => l.id === levelId);
    if (!lvl) return;
    
    const nextLvlOrder = Number(lvl.sortOrder) + 1;
    const nextLvl = levels.find(l => Number(l.sortOrder) === nextLvlOrder);
    
    if (!nextLvl) {
      toastError("لا يوجد مستوى تعليمي تالي للترقية إليه! يرجى التأكد من (الترتيب الدراسي) للمستويات.");
      return;
    }
    
    const studsToPromote = students.filter(s => s.levelId === levelId);
    if (studsToPromote.length === 0) {
      toastError("لا يوجد أطفال في هذا المستوى للترقية.");
      return;
    }

    triggerConfirmation(
      'ترقية الأطفال',
      `هل أنت متأكد من ترقية جميع أطفال هذا المستوى للعام الدراسي القادم؟ سيتم ترقية ${studsToPromote.length} طفل إلى ${nextLvl.name}.`,
      async () => {
        try {
          await promoteStudentsInDb(studsToPromote, nextLvl.id!);
          success(`تم ترقية ${studsToPromote.length} طفل إلى ${nextLvl.name} بنجاح.`);
        } catch (e) {
          console.error(e);
          toastError("فشل ترقية الأطفال");
        }
      }
    );
  };

  return {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    isLevelModalOpen,
    setIsLevelModalOpen,
    isClassModalOpen,
    setIsClassModalOpen,
    isEdit,
    currentId,
    isClassProfileOpen,
    setIsClassProfileOpen,
    selectedClassId,
    setSelectedClassId,
    profileTab,
    setProfileTab,
    transferModalOpen,
    setTransferModalOpen,
    selectedStudentsToTransfer,
    setSelectedStudentsToTransfer,
    transferTargetClass,
    setTransferTargetClass,
    isConfirmOpen,
    setIsConfirmOpen,
    confirmConfig,
    levelFormData,
    setLevelFormData,
    classFormData,
    setClassFormData,
    levels,
    classesList,
    students,
    filteredLevels,
    filteredClasses,
    handleOpenLevelModal,
    handleOpenClassModal,
    handleSaveLevel,
    handleSaveClass,
    handleDeleteLevel,
    handleDeleteClass,
    getClassStudentsCount,
    getLevelName,
    handleOpenClassProfile,
    selectedClass,
    classStudents,
    selectedLevel,
    toggleStudentSelection,
    handleSelectAllStudents,
    executeTransfer,
    handlePromoteStudents
  };
};
