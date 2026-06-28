import React, { useState } from 'react';
import { Plus, Search, UserCircle, Briefcase, FileText, Check, Edit2, Trash2, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import RealEstateStaffModal from '../components/properties/RealEstateStaffModal';

export const RealEstateStaff: React.FC = () => {
  const { success, error: showError } = useToast();
  const rolesList = ["مدير أملاك", "مسوق عقاري", "محصل إيجارات", "موظف استقبال", "مشرف صيانة", "محاسب", "مندوب قانوني"];
  
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; staffId: number } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: rolesList[0] || 'موظف',
    pin: '1234',
    baseSalary: 0,
    isActive: true,
  });

  const staff = useLiveQuery(() => 
    db.users.filter(u => u.department === 'realestate').toArray()
  ) || [];

  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const currencySymbol = settings?.currency || 'IQD';

  const filteredStaff = staff.filter(emp => {
    const matchesSearch = emp.name.includes(search) || (emp.phone && emp.phone.includes(search));
    const matchesRole = selectedRole ? emp.role === selectedRole : true;
    return matchesSearch && matchesRole;
  });

  const activeStaff = filteredStaff.filter(s => s.isActive).length;

  const handleOpenModal = (isEditMode = false, emp: any = null) => {
    setIsEdit(isEditMode);
    if (isEditMode && emp) {
      setCurrentId(emp.id!);
      setFormData({
        name: emp.name,
        phone: emp.phone || '',
        role: emp.role,
        pin: emp.pin || '1234',
        baseSalary: emp.baseSalary || 0,
        isActive: emp.isActive,
      });
    } else {
      setCurrentId(null);
      setFormData({
        name: '',
        phone: '',
        role: rolesList[0] || 'موظف',
        pin: '1234',
        baseSalary: 0,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (updatedData: typeof formData) => {
    try {
      const payload = {
        ...updatedData,
        baseSalary: Number(updatedData.baseSalary),
        department: 'realestate',
      };
      
      if (isEdit && currentId) {
        await db.users.update(currentId, payload);
        success('تم تحديث بيانات الموظف بنجاح');
      } else {
        await db.users.add(payload);
        success('تم إضافة الموظف بنجاح');
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حفظ بيانات الموظف');
    }
  };

  const confirmDeleteStaff = (id: number) => {
    setConfirmConfig({ isOpen: true, staffId: id });
  };

  const handleDelete = async () => {
    if (!confirmConfig) return;
    const id = confirmConfig.staffId;
    try {
      await db.users.delete(id);
      success('تم حذف حساب الموظف بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل حذف حساب الموظف');
    }
    setConfirmConfig(null);
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal'] min-h-screen rounded-2xl animate-in fade-in duration-350" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة موظفي العقارات</h1>
          <p className="text-slate-500 font-bold text-sm mt-1">سجل حسابات، رواتب، أداء، وتخصصات طاقم العمل العقاري</p>
        </div>
        <button 
          onClick={() => handleOpenModal(false)}
          className="w-full sm:w-auto bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 font-black transition-all cursor-pointer active:scale-95 text-sm"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>إضافة موظف عقاري جديد</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-indigo-100/30 flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
            <UserCircle className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">إجمالي الموظفين</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{staff.length}</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-indigo-100/30 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <Briefcase className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">الموظفين النشطين</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{activeStaff}</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-indigo-100/30 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <FileText className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500">موقوف / مجاز</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">{staff.length - activeStaff}</p>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-indigo-100/30 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-indigo-50/50 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/40">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 stroke-[2]" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث باسم الموظف أو الهاتف..." 
              className="w-full bg-white border border-indigo-100/60 py-2.5 pr-10 pl-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-800"
            />
          </div>
          <div className="w-full sm:w-auto">
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-white border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all text-slate-700 cursor-pointer"
            >
              <option value="">جميع التخصصات</option>
              {rolesList.map((role, idx) => (
                <option key={idx} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-indigo-50/50">
                <th className="p-4 text-slate-500 font-black text-xs">الرقم الوظيفي</th>
                <th className="p-4 text-slate-500 font-black text-xs">الموظف</th>
                <th className="p-4 text-slate-500 font-black text-xs">التخصص / المسمى</th>
                <th className="p-4 text-slate-500 font-black text-xs">الحالة</th>
                <th className="p-4 text-slate-500 font-black text-xs">الراتب الأساسي</th>
                <th className="p-4 text-slate-500 font-black text-xs text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50/30">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <UserCircle size={56} className="mx-auto mb-4 text-indigo-200 animate-pulse" />
                    <h3 className="text-base font-black text-slate-700 mb-1">لا توجد سجلات حالياً</h3>
                    <p className="text-slate-500 text-xs font-bold">اضغط على زر "إضافة موظف" لبدء إدخال طاقمك العقاري</p>
                  </td>
                </tr>
              ) : filteredStaff.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-xs font-mono font-black text-slate-500">EMP-{1000 + (emp.id || 0)}</td>
                  <td className="p-4">
                    <div className="text-sm font-black text-slate-800">{emp.name}</div>
                    <div className="text-xs text-slate-500 font-bold mt-0.5">{emp.phone || '-'}</div>
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-700">{emp.role}</td>
                  <td className="p-4">
                    {emp.isActive ? (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-black rounded-full flex items-center w-max gap-1">
                        <Check className="w-3 h-3 stroke-[2.5]" /> نشط
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 border border-slate-200/50 text-xs font-black rounded-full flex items-center w-max gap-1">
                        <X className="w-3 h-3 stroke-[2.5]" /> موقوف
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm font-black text-slate-800">{(emp.baseSalary || 0).toLocaleString()} {currencySymbol}</td>
                  <td className="p-4">
                    <div className="flex justify-center items-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(true, emp)} 
                        className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 border border-sky-100 rounded-lg transition-colors cursor-pointer"
                        title="تعديل"
                      >
                        <Edit2 className="w-4 h-4 stroke-[2]" />
                      </button>
                      <button 
                        onClick={() => confirmDeleteStaff(emp.id!)} 
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg transition-colors cursor-pointer"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4 stroke-[2]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <RealEstateStaffModal 
        isOpen={isModalOpen}
        isEdit={isEdit}
        rolesList={rolesList}
        initialData={formData}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title="حذف حساب الموظف"
          message="هل أنت متأكد من حذف حساب هذا الموظف العقاري نهائياً؟ سيتم إيقاف صلاحياته وحذف بياناته المباشرة من النظام فوراً."
          onConfirm={handleDelete}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default RealEstateStaff;
