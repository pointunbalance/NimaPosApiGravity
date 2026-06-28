import React, { useState } from 'react';
import { Plus, Search, UserCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

// Modular components
import { GymStaffMetrics } from '../../components/gym/GymStaffMetrics';
import { GymStaffTable } from '../../components/gym/GymStaffTable';
import { GymStaffFormModal } from '../../components/gym/GymStaffFormModal';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const GymStaff = () => {
  const rolesList = ["مدير فرع", "كابتن صالة", "كابتن شخصي", "موظف استقبال", "أخصائي تغذية", "أخصائي علاج طبيعي", "عامل نظافة"];
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  // Custom dialog state for deleting staff (to avoid window.confirm)
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const currency = settings?.currency || 'ج.م';
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: rolesList[0] || 'موظف',
    pin: '12345678',
    baseSalary: 0,
    isActive: true,
  });

  const staff = useLiveQuery(() => 
    db.users.filter(u => u.department === 'gym').toArray()
  ) || [];

  const filteredStaff = staff.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) || 
                          (emp.phone && emp.phone.includes(search));
    const matchesRole = selectedRole ? emp.role === selectedRole : true;
    return matchesSearch && matchesRole;
  });

  const activeStaff = staff.filter(s => s.isActive).length;
  const suspendedStaff = staff.length - activeStaff;

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        baseSalary: Number(formData.baseSalary),
        department: 'gym',
      };
      
      if (isEdit && currentId) {
        await db.users.update(currentId, payload);
      } else {
        await db.users.add(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const askDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      await db.users.delete(deleteId);
      setIsDeleteOpen(false);
      setDeleteId(null);
    }
  };
  
  return (
    <div className="p-6 space-y-6 text-right font-sans" dir="rtl">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex-row-reverse text-right">
        <button 
          onClick={() => handleOpenModal(false)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-all font-extrabold text-xs shadow-md cursor-pointer self-stretch md:self-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موظف جديد لأسرتنا</span>
        </button>
        <div>
          <div className="flex items-center gap-2 justify-end flex-row-reverse text-right">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <UserCircle className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">إدارة شؤون موظفي النادي الرياضي</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            سجل وحسابات رواتب وأداء طاقم النادي الرياضي المعتمدين محلياً.
          </p>
        </div>
      </div>

      {/* Metrics Card Row */}
      <GymStaffMetrics
        totalStaffCount={staff.length}
        activeStaff={activeStaff}
        suspendedStaff={suspendedStaff}
      />

      {/* Directory filtering & table list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50 flex-row-reverse">
          <div className="flex gap-2 w-full md:w-auto flex-row-reverse">
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border border-slate-200 rounded-xl px-4 py-2 focus:outline-none text-xs font-bold bg-white text-right"
            >
              <option value="">جميع التخصصات والمهام</option>
              {rolesList.map((role, idx) => (
                <option key={idx} value={role}>{role}</option>
              ))}
            </select>
          </div>
          
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم الموظف أو الهاتف..." 
              className="w-full pr-9 pl-4 py-2 border border-slate-205 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold text-right"
            />
          </div>
        </div>
        
        {/* Isolated Table component */}
        <GymStaffTable
          filteredStaff={filteredStaff}
          currency={currency}
          onEdit={(emp) => handleOpenModal(true, emp)}
          onDelete={askDelete}
        />
      </div>

      {/* Dialog Form for adding employee */}
      <GymStaffFormModal
        isOpen={isModalOpen}
        isEdit={isEdit}
        rolesList={rolesList}
        formData={formData}
        setFormData={setFormData}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {/* Custom dialog to guarantee iframe-compatible confirm workflow */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        title="تأكيد حذف وفصل ملف الموظف"
        message="هل أنت متأكد تماماً من حذف هذا الموظف وسجلاته؟ سيتم إلغاء صلاحية الـ PIN الخاصة به فوراً."
        confirmText="تأكيد الشطب نهائياً"
        cancelText="تراجع وإلغاء شطب"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />

    </div>
  );
};

export default GymStaff;
