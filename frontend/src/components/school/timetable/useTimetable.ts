import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';

export const useTimetable = () => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    classId: '',
    subject: '',
    teacherId: '',
    day: 'الأحد',
    time: '08:00 ص'
  });

  const records = useLiveQuery(() => db.schoolTimetable.toArray()) || [];
  const classes = useLiveQuery(() => db.schoolClassesList.toArray()) || [];
  const employees = useLiveQuery(() => db.users.filter(u => u.department === 'school' || u.role === 'admin').toArray()) || [];

  const getClassName = (id: string | number) => {
    const c = classes.find(cls => cls.id === Number(id));
    return c ? c.name : 'محذوف';
  };

  const getTeacherName = (id: string | number) => {
    const emp = employees.find(e => e.id === Number(id));
    return emp ? emp.name : 'غير معروف';
  };

  const filteredRecords = records.filter((item: any) => {
    const className = getClassName(item.classId).toLowerCase();
    const teacherName = getTeacherName(item.teacherId).toLowerCase();
    const s = search.toLowerCase();
    return (
      className.includes(s) ||
      teacherName.includes(s) ||
      item.subject.toLowerCase().includes(s) ||
      item.day.toLowerCase().includes(s)
    );
  });

  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({ ...item });
    } else {
      setCurrentId(null);
      setFormData({
        classId: '',
        subject: '',
        teacherId: '',
        day: 'الأحد',
        time: '08:00 ص'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && currentId) {
        await db.schoolTimetable.update(currentId, formData);
      } else {
        await db.schoolTimetable.add(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      await db.schoolTimetable.delete(id);
    }
  };

  return {
    search,
    setSearch,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    formData,
    setFormData,
    classes,
    employees,
    filteredRecords,
    getClassName,
    getTeacherName,
    handleOpenModal,
    handleSave,
    handleDelete,
  };
};
export default useTimetable;
