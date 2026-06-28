import React, { useState } from 'react';
import { Plus, Search, Activity, Stethoscope, HeartPulse, Edit2, Trash2, Heart, ShieldAlert, PhoneCall } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { ClinicVisitModal } from '../../components/school/ClinicVisitModal';
import { ClinicProfileModal } from '../../components/school/ClinicProfileModal';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const SchoolClinic = () => {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState<'logs' | 'profiles'>('logs');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Student Health Profile States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<any>(null);

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

  const logs = useLiveQuery(() => db.healthLogs.toArray()) || [];
  const students = useLiveQuery(() => db.schoolStudents.toArray()) || [];
  const healthProfiles = useLiveQuery(() => db.healthProfiles.toArray()) || [];

  const filteredLogs = logs.filter((item: any) => {
    const student = students.find(s => s.id === item.studentId);
    return (
      (student?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (item.reason || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const filteredStudents = students.filter((s: any) => {
    return (s.name || '').toLowerCase().includes(search.toLowerCase());
  });

  const getStudentName = (id: number) => {
     return students.find(s => s.id === id)?.name || 'غير معروف';
  };

  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleOpenProfileModal = (student: any) => {
    setSelectedStudentForProfile(student);
    setIsProfileModalOpen(true);
  };

  const handleSave = async (payload: any) => {
    try {
      if (isEdit && selectedItem?.id) {
        await db.healthLogs.update(selectedItem.id, payload);
        success('تم تحديث البيانات بنجاح');
      } else {
        await db.healthLogs.add(payload);
        success('تم تسجيل الزيارة بنجاح');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toastError('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = (id: number) => {
    triggerConfirmation('تأكيد الحذف', 'هل أنت متأكد من الحذف؟', async () => {
      try {
        await db.healthLogs.delete(id);
        success('تم حذف السجل بنجاح');
      } catch (err) {
        toastError('فشل حذف السجل');
      }
    });
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">العيادة والصحة</h1>
          <p className="text-slate-500 mt-1">إدارة السجلات الطبية والزيارات اليومية لعيادة الحضانة</p>
        </div>
        <button 
          onClick={() => handleOpenModal(false)}
          className="bg-rose-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-rose-700 transition-colors font-bold shadow-sm">
          <Plus className="w-5 h-5" />
          <span>تسجيل زيارة للعيادة</span>
        </button>
      </div>

      <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
            activeTab === 'logs' 
            ? 'bg-rose-50 text-rose-700' 
            : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <Activity className="w-5 h-5" />
          سجل الزيارات
        </button>
        <button
          onClick={() => setActiveTab('profiles')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition-all ${
            activeTab === 'profiles' 
            ? 'bg-rose-50 text-rose-700' 
            : 'text-slate-500 hover:bg-slate-50'
          }`}
        >
          <HeartPulse className="w-5 h-5" />
          الملفات الطبية للطلاب
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في سجلات العيادة..." 
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium transition-all"
            />
          </div>
        </div>
        
        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-600">التاريخ</th>
                  <th className="px-6 py-4 font-bold text-slate-600">اسم الطفل</th>
                  <th className="px-6 py-4 font-bold text-slate-600">طبيعة الزيارة / التشخيص</th>
                  <th className="px-6 py-4 font-bold text-slate-600">الحرارة</th>
                  <th className="px-6 py-4 font-bold text-slate-600">الإجراء الطبي المتخذ</th>
                  <th className="px-6 py-4 font-bold text-slate-600 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium border-dashed border-2 border-slate-100 rounded-xl m-4">
                       لا توجد زيارات حديثة.
                     </td>
                   </tr>
                ) : filteredLogs.map((item: any) => (
                  <tr key={item.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{item.date}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{getStudentName(item.studentId)}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{item.reason}</td>
                    <td className="px-6 py-4 font-mono text-rose-600 font-bold">{item.temperature ? `${item.temperature} °C` : '-'}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                       <span className="px-3 py-1 bg-slate-100 rounded-lg text-slate-700 inline-block">
                         {item.action || 'لا يوجد إجراء'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center flex-wrap gap-2">
                         <button onClick={() => handleOpenModal(true, item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors outline-none">
                            <Edit2 className="w-4 h-4" />
                         </button>
                         <button onClick={() => handleDelete(item.id!)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors outline-none">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'profiles' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-600">اسم الطفل</th>
                  <th className="px-6 py-4 font-bold text-slate-600">فصيلة الدم</th>
                  <th className="px-6 py-4 font-bold text-slate-600">الحساسية</th>
                  <th className="px-6 py-4 font-bold text-slate-600">الأمراض المزمنة</th>
                  <th className="px-6 py-4 font-bold text-slate-600">التحصينات / التطعيمات</th>
                  <th className="px-6 py-4 font-bold text-slate-600">اتصال الطوارئ</th>
                  <th className="px-6 py-4 font-bold text-slate-600 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                      لا يوجد طلاب مطابقين للبحث.
                    </td>
                  </tr>
                ) : filteredStudents.map((student: any) => {
                  const profile = healthProfiles.find(p => p.studentId === student.id);
                  return (
                    <tr key={student.id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{student.name}</div>
                        <div className="text-xs text-slate-400 font-mono">كود: {student.code || student.id}</div>
                      </td>
                      <td className="px-6 py-4 font-black">
                        {profile?.bloodType ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full text-xs font-black">
                            <Heart className="w-3.5 h-3.5 fill-rose-600" />
                            {profile.bloodType}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-bold">غير محدد</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {profile?.allergies ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-xs">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {profile.allergies}
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-xs bg-emerald-50 px-2.5 py-1 rounded-lg">سليم (لا يوجد)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold">
                        {profile?.chronicDiseases ? (
                          <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg text-xs">
                            {profile.chronicDiseases}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs font-medium">لا يوجد</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">
                        {profile?.vaccines ? (
                          <span className="text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-xs font-bold">
                            {profile.vaccines}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">غير مسجل</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">
                        {profile?.emergencyContact ? (
                          <span className="inline-flex items-center gap-1">
                            <PhoneCall className="w-3 h-3 text-slate-400" />
                            {profile.emergencyContact}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-sans">لا يوجد رقم</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleOpenProfileModal(student)}
                            className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center gap-1"
                          >
                            <HeartPulse className="w-4 h-4" />
                            تحديث الملف الطبي
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

      <ClinicVisitModal
        isOpen={isModalOpen}
        isEdit={isEdit}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        students={students}
        initialData={selectedItem}
      />

      <ClinicProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedStudentForProfile(null);
        }}
        student={selectedStudentForProfile}
        initialProfile={
          selectedStudentForProfile
            ? healthProfiles.find(p => p.studentId === selectedStudentForProfile.id)
            : null
        }
        onSave={() => {}}
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

export default SchoolClinic;
