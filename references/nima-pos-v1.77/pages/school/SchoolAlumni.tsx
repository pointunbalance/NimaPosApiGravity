import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, GraduationCap, Users, Award, ShieldCheck } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { GraduateModal } from '../../components/school/alumni/GraduateModal';

export const SchoolAlumni = () => {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'alumni' | 'eligible'>('alumni');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Graduation States
  const [isGraduateModalOpen, setIsGraduateModalOpen] = useState(false);
  const [selectedStudentForGraduation, setSelectedStudentForGraduation] = useState<any>(null);

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
  
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    track: 'علمي',
    status: ''
  });

  const records = useLiveQuery(() => db.schoolAlumni.toArray()) || [];
  const students = useLiveQuery(() => db.schoolStudents.toArray()) || [];
  const classes = useLiveQuery(() => db.schoolClassesList.toArray()) || [];

  const filteredAlumni = records.filter((item: any) => {
    return (
      (item.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.year || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.track || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const eligibleStudents = students.filter(s => s.status !== 'متخرج');
  const filteredEligible = eligibleStudents.filter((student: any) => {
    return (
      (student.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (student.code || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({...item});
    } else {
      setCurrentId(null);
      setFormData({ name: '', year: new Date().getFullYear().toString(), track: 'عام', status: '' });
    }
    setIsModalOpen(true);
  };

  const handleOpenGraduateModal = (student: any) => {
    setSelectedStudentForGraduation(student);
    setIsGraduateModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && currentId) {
        await db.schoolAlumni.update(currentId, formData);
        success('تم تحديث البيانات بنجاح');
      } else {
        await db.schoolAlumni.add(formData);
        success('تم حفظ البيانات بنجاح');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toastError('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = (id: number) => {
    triggerConfirmation('تأكيد الحذف', 'هل أنت متأكد من حذف هذا السجل؟', async () => {
      try {
        await db.schoolAlumni.delete(id);
        success('تم حذف السجل بنجاح');
      } catch (err) {
        toastError('فشل حذف السجل');
      }
    });
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-3 rounded-2xl text-indigo-600">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">شؤون الخريجين والخرّيجين</h1>
            <p className="text-slate-500 mt-1">تتبع مسار الخريجين الأكاديمي، وإدارة حفلات ترحيل الطلاب المنتهية دراستهم</p>
          </div>
        </div>
        
        {activeTab === 'alumni' && (
          <button 
            onClick={() => handleOpenModal(false)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors font-bold shadow-sm">
            <Plus className="w-5 h-5" />
            <span>تسجيل خريج خارجي</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit">
        <button
          onClick={() => { setActiveTab('alumni'); setSearch(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
            activeTab === 'alumni' 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Award className="w-5 h-5" />
          سجل الخريجين المعتمد
        </button>
        <button
          onClick={() => { setActiveTab('eligible'); setSearch(''); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
            activeTab === 'eligible' 
            ? 'bg-indigo-50 text-indigo-700' 
            : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Users className="w-5 h-5" />
          الطلاب الحاليين للتخريج
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 bg-slate-50">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={activeTab === 'alumni' ? "بحث في سجلات الخريجين..." : "البحث عن طالب حالي لتخرجه..."}
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
            />
          </div>
        </div>
        
        {activeTab === 'alumni' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-600">الاسم</th>
                  <th className="px-6 py-4 font-bold text-slate-600">سنة التخرج</th>
                  <th className="px-6 py-4 font-bold text-slate-600">المسار الدراسي</th>
                  <th className="px-6 py-4 font-bold text-slate-600">الجامعة أو العمل</th>
                  <th className="px-6 py-4 font-bold text-slate-600 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAlumni.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                      لا توجد سجلات خريجين مطابقة.
                    </td>
                  </tr>
                ) : filteredAlumni.map((item: any) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                      <div className="p-1 bg-indigo-50 rounded text-indigo-600"><ShieldCheck className="w-4 h-4" /></div>
                      {item.name}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800 font-mono">{item.year}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{item.track}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{item.status}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center flex-wrap gap-2">
                        <button onClick={() => handleOpenModal(true, item)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-600">اسم الطالب</th>
                  <th className="px-6 py-4 font-bold text-slate-600">كود التسجيل</th>
                  <th className="px-6 py-4 font-bold text-slate-600">الفصل الدراسي الحالي</th>
                  <th className="px-6 py-4 font-bold text-slate-600">الحالة النشطة</th>
                  <th className="px-6 py-4 font-bold text-slate-600 text-center">ترقية وتخريج</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEligible.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                      لا يوجد طلاب مؤهلين للتخريج حالياً.
                    </td>
                  </tr>
                ) : filteredEligible.map((student: any) => {
                  const cls = classes.find(c => c.id === student.classroomId);
                  return (
                    <tr key={student.id} className="hover:bg-indigo-50/10 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-600">{student.code || `STD-${student.id}`}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{cls?.name || 'غير محدد'}</td>
                      <td className="px-6 py-4 font-bold">
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs">
                          {student.status || 'نشط'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleOpenGraduateModal(student)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <GraduationCap className="w-4 h-4" />
                            تخريج الطالب
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">
                {isEdit ? 'تعديل سجل الخريج' : 'إضافة سجل خريج يدوي'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الاسم بالكامل</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">سنة التخرج</label>
                <input 
                  type="text" 
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">المسار</label>
                <input 
                  type="text" 
                  value={formData.track}
                  onChange={(e) => setFormData({...formData, track: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">الجامعة / العمل الحالي</label>
                <input 
                  type="text" 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-200 font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 font-bold text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Graduate student transition modal */}
      <GraduateModal
        isOpen={isGraduateModalOpen}
        onClose={() => {
          setIsGraduateModalOpen(false);
          setSelectedStudentForGraduation(null);
        }}
        student={selectedStudentForGraduation}
        onGraduated={() => {}}
      />

      <ConfirmModal
        isOpen={isConfirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};

export default SchoolAlumni;
