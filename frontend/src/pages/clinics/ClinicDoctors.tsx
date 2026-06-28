import React, { useState } from 'react';
import { Briefcase, Plus, Search, User, Edit, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';
import { DoctorFormModal } from '../../components/clinics/DoctorFormModal';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function ClinicDoctors() {
    const { success, error } = useToast();
    const doctors = useLiveQuery(() => db.doctors.toArray(), []) || [];
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<any>(null);
    const [doctorToDelete, setDoctorToDelete] = useState<number | null>(null);

    const handleAddClick = () => {
        setEditingDoctor(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (doctor: any) => {
        setEditingDoctor(doctor);
        setIsFormOpen(true);
    };

    const confirmDeleteDoctor = async () => {
        if (!doctorToDelete) return;
        try {
            await db.doctors.delete(doctorToDelete);
            success('تم حذف الطبيب بنجاح');
        } catch (err) {
            error('حدث خطأ أثناء الحذف');
            console.error(err);
        } finally {
            setDoctorToDelete(null);
        }
    };

    const handleDeleteDoctor = (id: number) => {
        setDoctorToDelete(id);
    };

    const handleSaveDoctor = async (data: any) => {
        try {
            if (data.id) {
                await db.doctors.update(data.id, data);
                success('تم تحديث بيانات الطبيب بنجاح');
            } else {
                await db.doctors.add(data);
                success('تم إضافة الطبيب بنجاح');
            }
            setIsFormOpen(false);
        } catch (err) {
            error('حدث خطأ أثناء حفظ البيانات');
            console.error(err);
        }
    };

    return (
        <div className="h-full flex flex-col relative overflow-hidden bg-slate-50">
            <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <Briefcase className="w-8 h-8 text-brand-600" />
                    الأطباء والمواعيد
                    </h1>
                    <p className="text-sm font-bold text-slate-500">
                    إدارة الأطباء وساعات العمل والورديات
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleAddClick} className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl shadow-brand-500/30 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        إضافة طبيب
                    </button>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                {doctors.length === 0 ? (
                 <div className="max-w-7xl mx-auto text-center py-20 flex flex-col items-center">
                      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <User className="w-10 h-10 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">قائمة الأطباء فارغة</h3>
                      <p className="text-slate-500 max-w-md">قم بإضافة الأطباء لتعيين مواعيد العمل واستقبال الحجوزات</p>
                 </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        {doctors.map(doctor => (
                            <div key={doctor.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group">
                                <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                                    <button onClick={() => handleEditClick(doctor)} className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors shadow-sm">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteDoctor(doctor.id!)} className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors shadow-sm">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                                    <User className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-1">د. {doctor.name}</h3>
                                <p className="text-brand-600 font-bold mb-4">{doctor.specialization}</p>
                                <div className="space-y-2 text-sm text-slate-600 font-medium">
                                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                        <span>قيمة الكشف:</span>
                                        <span className="font-bold text-slate-800">{doctor.consultationFee} ج.م</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-slate-100">
                                        <span>رقم الهاتف:</span>
                                        <span className="font-bold text-slate-800" dir="ltr">{doctor.phone}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <DoctorFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSave={handleSaveDoctor}
                initialData={editingDoctor}
            />

            <ConfirmModal
                isOpen={doctorToDelete !== null}
                title="تأكيد الحذف"
                message="هل أنت متأكد من حذف بيانات هذا الطبيب؟"
                confirmText="حذف"
                onConfirm={confirmDeleteDoctor}
                onCancel={() => setDoctorToDelete(null)}
            />
        </div>
    )
}
