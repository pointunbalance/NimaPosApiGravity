import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { User, Role } from '../types';
import { useToast } from '../context/ToastContext';
import EmployeesHeader from '../components/employees/EmployeesHeader';
import EmployeesGrid from '../components/employees/EmployeesGrid';
import EmployeeModal, { EmployeeFormData } from '../components/employees/EmployeeModal';
import EmployeeDetailsModal from '../components/employees/EmployeeDetailsModal';
import { exportToExcel } from '../utils/excel';
import ConfirmModal from '../components/ui/ConfirmModal';

const Employees: React.FC = () => {
  const { showToast } = useToast();
  const users = useLiveQuery(() => db.users.toArray(), []);
  const roles = useLiveQuery(() => db.roles.toArray(), []);
  const workShifts = useLiveQuery(() => db.workShifts.toArray(), []) || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [employeeToDeleteId, setEmployeeToDeleteId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(u => {
      const matchesSearch = 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.jobTitle && u.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (u.phone && u.phone.includes(searchTerm));
        
      const matchesStatus = 
        statusFilter === 'all' ? true : 
        statusFilter === 'active' ? u.isActive !== false : 
        u.isActive === false;
        
      const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
    } else {
      setEditingUser(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleViewDetails = (user: User) => {
    setViewingUser(user);
    setIsDetailsModalOpen(true);
  };

  const handleToggleStatus = async (user: User) => {
    try {
      if (user.isActive !== false) {
        // Attempting to deactivate - check active assets
        const activeAssets = await db.assetCustody.where('employeeId').equals(user.id!).filter(a => a.status === 'active').toArray();
        if (activeAssets.length > 0) {
          showToast(`لا يمكن إيقاف الموظف، لديه عهد غير مستردة (${activeAssets.length} عهدة). يرجى استلام العهد أولاً.`, 'warning');
          return;
        }
      }
      await db.users.update(user.id!, { isActive: !(user.isActive ?? true) });
      showToast(user.isActive === false ? 'تم تفعيل الموظف بنجاح' : 'تم إيقاف الموظف بنجاح', 'success');
    } catch (error) {
      console.error('Error toggling status:', error);
      showToast('حدث خطأ أثناء تغيير حالة الموظف', 'error');
    }
  };

  const handleExportCSV = () => {
    if (!filteredUsers.length) {
      showToast('لا يوجد بيانات لتصديرها', 'error');
      return;
    }

    const exportData = filteredUsers.map(u => ({
      'الاسم': u.name,
      'المسمى الوظيفي': u.jobTitle || '-',
      'رقم الهاتف': u.phone || '-',
      'البريد الإلكتروني': u.email || '-',
      'الدور': roles?.find(r => r.name === u.role)?.name || u.role || '-',
      'الراتب الأساسي': u.baseSalary ? `${u.baseSalary} د.ع` : '-',
      'تاريخ المباشرة': u.startDate ? new Date(u.startDate).toLocaleDateString('ar-IQ') : '-',
      'تاريخ انتهاء العقد': u.contractEndDate ? new Date(u.contractEndDate).toLocaleDateString('ar-IQ') : '-',
      'الحالة': u.isActive !== false ? 'نشط' : 'غير نشط'
    }));

    exportToExcel(exportData, 'Employees_List');
    showToast('تم تصدير قائمة الموظفين بنجاح', 'success');
  };

  const handleSaveEmployee = async (data: EmployeeFormData) => {
    try {
      const userData: any = {
        ...data,
        baseSalary: Number(data.baseSalary) || 0,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : undefined,
      };

      if (editingUser?.id) {
        await db.users.update(editingUser.id, userData);
        showToast('تم تحديث بيانات الموظف بنجاح', 'success');
      } else {
        await db.users.add(userData as User);
        showToast('تم إضافة الموظف بنجاح', 'success');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving employee:', error);
      showToast('حدث خطأ أثناء حفظ البيانات', 'error');
    }
  };

  const handleDelete = (id: number) => {
    setEmployeeToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDeleteEmployee = async () => {
    if (!employeeToDeleteId) return;
    try {
      const activeAssets = await db.assetCustody.where('employeeId').equals(employeeToDeleteId).filter(a => a.status === 'active').toArray();
      if (activeAssets.length > 0) {
        showToast(`لا يمكن حذف الموظف، لديه عهد غير مستردة (${activeAssets.length} عهدة). يرجى استلام العهد أولاً.`, 'warning');
        setIsDeleteConfirmOpen(false);
        setEmployeeToDeleteId(null);
        return;
      }

      await db.users.delete(employeeToDeleteId);
      showToast('تم حذف الموظف بنجاح', 'success');
      
      // Adjust pagination if needed
      if (paginatedUsers.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      showToast('حدث خطأ أثناء الحذف', 'error');
    } finally {
      setIsDeleteConfirmOpen(false);
      setEmployeeToDeleteId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 min-h-screen font-['Tajawal'] rounded-2xl" dir="rtl">
      <EmployeesHeader 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        roles={roles || []}
        onAddEmployee={() => handleOpenModal()}
        onExportCSV={handleExportCSV}
      />

      <EmployeesGrid 
        users={paginatedUsers}
        searchTerm={searchTerm}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        onViewDetails={handleViewDetails}
        onToggleStatus={handleToggleStatus}
      />

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            السابق
          </button>
          <span className="text-slate-600 font-medium">
            صفحة {currentPage} من {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            التالي
          </button>
        </div>
      )}

      <EmployeeModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingUser={editingUser}
        onSave={handleSaveEmployee}
        workShifts={workShifts}
      />

      {viewingUser && (
        <EmployeeDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setViewingUser(null);
          }}
          user={viewingUser}
          roles={roles || []}
        />
      )}

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="تأكيد حذف الموظف"
        message="هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسح كافة البيانات المرتبطة."
        onConfirm={executeDeleteEmployee}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setEmployeeToDeleteId(null);
        }}
        confirmText="نعم، احذف الموظف"
        cancelText="تراجع"
      />
    </div>
  );
};

export default Employees;
