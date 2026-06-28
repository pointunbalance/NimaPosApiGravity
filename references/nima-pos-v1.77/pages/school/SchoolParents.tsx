import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Phone, Users, User, CreditCard, MessageCircle, FileText, Briefcase, MapPin, AlertTriangle, CalendarDays } from 'lucide-react';
import { ParentFormModal } from '../../components/school/parents/ParentFormModal';
import { ParentProfileDrawer } from '../../components/school/parents/ParentProfileDrawer';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';


import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

export const SchoolParents = () => {
  const { success, error: toastError } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);

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
  
  const [formData, setFormData] = useState<any>({
    name: "",
    relation: "أب",
    primaryPhone: "",
    whatsappPhone: "",
    whatsappPhone2: "",
    secondaryPhone: "",
    address: "",
    job: "",
    nationalId: "",
    notes: "",
    adminNotes: "",
    communicationStatus: "active",
    isPrimary: false,
    isFinancialResponsible: false,
    isPickupResponsible: false,
    isAllowedToPickup: true,
    isAllowedToSeeFinancials: false,
    isAllowedToReceiveNotifications: true,
  });

  const guardians = useLiveQuery(() => db.guardians.toArray()) || [];
  const students = useLiveQuery(() => db.schoolStudents.toArray()) || [];
  const allPayments = useLiveQuery(() => db.studentPayments.toArray()) || [];

  const filteredRecords = guardians.filter((item: any) => {
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setSelectedParentId(item.id!);
      setFormData({
        name: item.name || '',
        relation: item.relation || 'أب',
        primaryPhone: item.primaryPhone || '',
        whatsappPhone: item.whatsappPhone || '',
        whatsappPhone2: item.whatsappPhone2 || '',
        secondaryPhone: item.secondaryPhone || '',
        address: item.address || '',
        job: item.job || '',
        nationalId: item.nationalId || '',
        notes: item.notes || '',
        adminNotes: item.adminNotes || '',
        communicationStatus: item.communicationStatus || 'active',
        isPrimary: item.isPrimary || false,
        isFinancialResponsible: item.isFinancialResponsible || false,
        isPickupResponsible: item.isPickupResponsible || false,
        isAllowedToPickup: item.isAllowedToPickup ?? true,
        isAllowedToSeeFinancials: item.isAllowedToSeeFinancials || false,
        isAllowedToReceiveNotifications: item.isAllowedToReceiveNotifications ?? true,
      });
    } else {
      setSelectedParentId(null);
      setFormData({
        name: "",
        relation: "أب",
        primaryPhone: "",
        whatsappPhone: "",
        whatsappPhone2: "",
        secondaryPhone: "",
        address: "",
        job: "",
        nationalId: "",
        notes: "",
        adminNotes: "",
        communicationStatus: "active",
        isPrimary: false,
        isFinancialResponsible: false,
        isPickupResponsible: false,
        isAllowedToPickup: true,
        isAllowedToSeeFinancials: false,
        isAllowedToReceiveNotifications: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenProfile = (id: number) => {
    setSelectedParentId(id);
    setActiveTab('info');
    setIsProfileOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && selectedParentId) {
        await db.guardians.update(selectedParentId, formData);
        success('تم تحديث بيانات ولي الأمر بنجاح');
      } else {
        await db.guardians.add(formData);
        success('تم إضافة ولي الأمر بنجاح');
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
        await db.guardians.delete(id);
        success('تم حذف السجل بنجاح');
      } catch (err) {
        toastError('فشل حذف السجل');
      }
    });
  };

  const selectedParent = guardians.find(g => g.id === selectedParentId);
  const parentChildren = students.filter((s: any) => s.guardianId === selectedParentId);
  const parentChildrenIds = parentChildren.map(c => c.id);
  const parentPayments = allPayments.filter((p: any) => parentChildrenIds.includes(p.studentId));

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة أولياء الأمور</h1>
          <p className="text-slate-500 mt-1">سجل أولياء الأمور والبيانات الخاصة بالتواصل والمدفوعات</p>
        </div>
        <button 
          onClick={() => handleOpenModal(false)}
          className="bg-brand-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-brand-700 transition-colors font-bold shadow-sm">
          <Plus className="w-5 h-5" />
          <span>إضافة ولي أمر جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم، رقم الجوال، أو الرقم القومي..." 
              className="w-full pr-10 pl-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
              <tr>
                <th className="px-6 py-4">الاسم الرباعي والصفة</th>
                <th className="px-6 py-4">أرقام التواصل</th>
                <th className="px-6 py-4">الرقم القومي / الهوية</th>
                <th className="px-6 py-4">الأبناء المسجلين</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                     لا توجد سجلات. أضف سجل جديد للبدء.
                   </td>
                 </tr>
              ) : filteredRecords.map((item: any) => {
                const guardianChildren = students.filter((s: any) => s.guardianId === item.id);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                       <div className="font-bold text-slate-800">{item.name}</div>
                       <div className="text-xs text-slate-500 mt-1">{item.relation || 'أب'}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700" dir="ltr">
                      <div className="flex items-center justify-end gap-2 text-sm">
                        <span>{item.primaryPhone}</span>
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">{item.nationalId || '-'}</td>
                    <td className="px-6 py-4">
                      {guardianChildren.length > 0 ? (
                         <div className="flex flex-col gap-1">
                            {guardianChildren.map((c: any) => (
                               <span key={c.id} className="text-xs px-2 py-1 bg-brand-50 text-brand-700 rounded-md font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] inline-block">{c.name}</span>
                            ))}
                         </div>
                      ) : (
                         <span className="text-slate-400 text-xs">لا يوجد أبناء مرتبطين</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center flex-wrap gap-2">
                         <button onClick={() => handleOpenProfile(item.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors outline-none" title="ملف ولي الأمر">
                            <User className="w-4 h-4" />
                         </button>
                         <button onClick={() => handleOpenModal(true, item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors outline-none" title="تعديل البيانات الأساسية">
                            <Edit2 className="w-4 h-4" />
                         </button>
                         <button onClick={() => handleDelete(item.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors outline-none" title="حذف">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ParentFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEdit={isEdit}
        formData={formData}
        setFormData={setFormData}
        handleSave={handleSave}
      />

      {/* Profile Modal */}
      {isProfileOpen && selectedParent && (
        <ParentProfileDrawer 
          selectedParent={selectedParent}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setIsProfileOpen(false)}
          parentChildren={parentChildren}
          parentPayments={parentPayments}
          students={students}
        />
      )}

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

export default SchoolParents;

