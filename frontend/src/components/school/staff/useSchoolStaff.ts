import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db';
import { useToast } from '../../../context/ToastContext';
import { AccountingEngine } from '../../../services/AccountingEngine';

export const rolesList = ["معلم/ة", "إداري", "مشرف دور", "أمن", "عامل نظافة", "محاسب", "أخصائي اجتماعي", "سائق حافلة"];

export const useSchoolStaff = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'directory' | 'transactions' | 'payroll'>('directory');

  // Directory Data
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', role: rolesList[0] || 'موظف', pin: '123456785678', baseSalary: 0, isActive: true,
  });

  // Transactions Data
  const [transModalOpen, setTransModalOpen] = useState(false);
  const [transFormData, setTransFormData] = useState({
    userId: 0, type: 'bonus', amount: 0, date: new Date().toISOString().split('T')[0], description: ''
  });

  // Dynamic Centralized Confirm Modal State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  // Lists
  const staff = useLiveQuery(() => db.users.filter(u => u.department === 'school').toArray()) || [];
  const classes = useLiveQuery(() => db.schoolClassesList?.toArray()) || [];
  const transactions = useLiveQuery(() => db.staffTransactions?.toArray()) || [];
  const payrolls = useLiveQuery(() => db.payrolls?.toArray()) || [];

  // Filtered Staff
  const filteredStaff = staff.filter(emp => {
    const matchesSearch = emp.name.includes(search) || (emp.phone && emp.phone.includes(search));
    const matchesRole = selectedRole ? emp.role === selectedRole : true;
    return matchesSearch && matchesRole;
  });

  const activeStaffCount = staff.filter(s => s.isActive).length;

  // Handlers
  const handleOpenModal = (isEditMode = false, emp: any = null) => {
    setIsEdit(isEditMode);
    if (isEditMode && emp) {
      setCurrentId(emp.id!);
      setFormData({ name: emp.name, phone: emp.phone || '', role: emp.role, pin: emp.pin || '1234', baseSalary: emp.baseSalary || 0, isActive: emp.isActive });
    } else {
      setCurrentId(null);
      setFormData({ name: '', phone: '', role: rolesList[0], pin: '1234', baseSalary: 0, isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...formData, baseSalary: Number(formData.baseSalary), department: 'school' };
      if (isEdit && currentId) {
        await db.users.update(currentId, payload);
        success('تم تعديل بيانات الموظف بنجاح');
      }
      else {
        await db.users.add(payload);
        success('تم تسجيل الموظف الجديد بنجاح');
      }
      setIsModalOpen(false);
    } catch (err) { error('حدث خطأ أثناء الحفظ'); }
  };

  const handleSaveTrans = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.staffTransactions.add({
        ...transFormData,
        amount: Number(transFormData.amount),
        userId: Number(transFormData.userId)
      });
      setTransModalOpen(false);
      success('تم تسجيل المعاملة المالية للموظف بنجاح');
    } catch(e) { error('خطأ في التسجيل'); }
  };

  const initiatePayrollGeneration = (monthYear: string) => {
    openConfirm(
      'توليد مسير الرواتب',
      `هل تريد توليد رواتب شهر ${monthYear} لجميع الموظفين المستحقين؟`,
      () => executeGeneratePayroll(monthYear)
    );
  };

  const executeGeneratePayroll = async (monthYear: string) => {
    try {
      let processed = 0;
      for (let emp of staff) {
        if(!emp.id) continue;
        const exists = await db.payrolls.where({ userId: emp.id, monthYear }).first();
        if(exists) continue;

        // get transactions for this month
        const empTrans = transactions.filter(t => t.userId === emp.id && t.date.startsWith(monthYear));
        let totalBonuses = 0, totalDeductions = 0, totalAdvances = 0;

        empTrans.forEach(t => {
          if (t.type === 'bonus') totalBonuses += t.amount;
          if (t.type === 'deduction' || t.type === 'lateness' || t.type === 'absence') totalDeductions += t.amount;
          if (t.type === 'advance') totalAdvances += t.amount;
        });

        const netSalary = (emp.baseSalary || 0) + totalBonuses - totalDeductions - totalAdvances;

        await db.payrolls.add({
          userId: emp.id,
          monthYear,
          baseSalary: emp.baseSalary || 0,
          totalBonuses,
          totalDeductions,
          totalAdvances,
          netSalary,
          status: 'pending'
        });
        processed++;
      }
      success(`تم معالجة وتوليد الرواتب بنجاح (${processed} موظف).`);
    } catch (err) {
      error('حدث خطأ أثناء توليد الرواتب');
    }
  };

  const printSlip = (slip: any, empName: string, role: string) => {
    const printWindow = window.open('', '_blank');
    if(!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>إيصال راتب - ${empName}</title>
          <style>
            body { font-family: Tahoma, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            h1 { color: #1e3a8a; text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 30px;}
            .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .row { display: flex; justify-content: space-between; border-bottom: 1px dashed #e5e7eb; padding: 10px 0; }
            .row:last-child { border-bottom: none; }
            .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 15px; margin-top: 10px; color: #15803d; }
            .footer { text-align: center; margin-top: 30px; font-size: 0.9em; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="box">
            <h1>إيصال استلام راتب</h1>
            <div class="row"><span>الموظف:</span> <strong>${empName}</strong></div>
            <div class="row"><span>الوظيفة:</span> <strong>${role}</strong></div>
            <div class="row"><span>عن شهر:</span> <strong>${slip.monthYear}</strong></div>
            
            <div class="row" style="margin-top: 20px;"><span>الراتب الأساسي:</span> <span>${slip.baseSalary} ج.م</span></div>
            <div class="row"><span>إضافي / مكافآت:</span> <span style="color: #15803d">+ ${slip.totalBonuses} ج.م</span></div>
            <div class="row"><span>جزاءات وخصومات:</span> <span style="color: #b91c1c">- ${slip.totalDeductions} ج.م</span></div>
            <div class="row"><span>سلف مسددة:</span> <span style="color: #b91c1c">- ${slip.totalAdvances} ج.م</span></div>
            
            <div class="row total">
              <span>صافي الراتب المستحق:</span> <span>${slip.netSalary} ج.م</span>
            </div>
            
            <div style="margin-top: 40px; display: flex; justify-content: space-between;">
              <div>توقيع الموظف:<br>....................</div>
              <div>توقيع المحاسب/الإدارة:<br>....................</div>
            </div>
            <div class="footer">تم إنشاء هذا الإيصال آلياً من النظام.</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    selectedRole,
    setSelectedRole,
    isModalOpen,
    setIsModalOpen,
    isEdit,
    formData,
    setFormData,
    transModalOpen,
    setTransModalOpen,
    transFormData,
    setTransFormData,
    confirmState,
    setConfirmState,
    staff,
    classes,
    transactions,
    payrolls,
    filteredStaff,
    activeStaffCount,
    handleOpenModal,
    handleSave,
    handleSaveTrans,
    initiatePayrollGeneration,
    printSlip,
    openConfirm,
  };
};
export { rolesList as useSchoolStaffRoles };
