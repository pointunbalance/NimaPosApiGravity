import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Branch } from '../types';
import BranchesHeader from '../components/branches/BranchesHeader';
import BranchesGrid from '../components/branches/BranchesGrid';
import BranchModal from '../components/branches/BranchModal';
import { Building2, CheckCircle2, XCircle, Store } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

const Branches: React.FC = () => {
  const { success, error: showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const branches = useLiveQuery(() => db.branches.toArray(), []);

  const filteredBranches = branches?.filter(branch => 
    branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.code?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setEditingBranch(branch);
    } else {
      setEditingBranch(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
  };

  const handleSave = async (formData: Partial<Branch>) => {
    try {
      if (editingBranch?.id) {
        await db.branches.update(editingBranch.id, formData);
        success('تم تحديث بيانات الفرع بنجاح');
      } else {
        await db.branches.add({
          ...formData as Branch,
          createdAt: new Date()
        });
        success('تمت إضافة الفرع بنجاح');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving branch:', error);
      showError('حدث خطأ أثناء حفظ الفرع');
    }
  };

  const handleDelete = async (id: number) => {
    // 1. Dependency check
    const tiedTerminals = await db.posTerminals.where('branchId').equals(id).count();
    const tiedWarehouses = await db.warehouses.where('branchId').equals(id).count();
    
    if (tiedTerminals > 0 || tiedWarehouses > 0) {
        showError(`لا يمكن حذف الفرع! مرتبط بـ ${tiedTerminals} أجهزة نقاط بيع، و ${tiedWarehouses} مستودعات. الرجاء نقلها أو حذفها أولاً.`);
        return;
    }

    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId !== null) {
      try {
        await db.branches.delete(deleteId);
        success('تم حذف الفرع بنجاح');
        
        // Log to Audit
        let currentUser = 'system';
        try {
            const userStr = localStorage.getItem('nima_user');
            if (userStr) currentUser = JSON.parse(userStr).name;
        } catch(e){}
        await db.auditLogs.add({
            userId: currentUser,
            userName: currentUser,
            action: 'delete',
            module: 'settings',
            details: `تم حذف بيانات الفرع ID: ${deleteId}`,
            timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error deleting branch:', error);
        showError('حدث خطأ أثناء حذف الفرع');
      } finally {
        setDeleteId(null);
      }
    }
  };

  const toggleStatus = async (branch: Branch) => {
    try {
      await db.branches.update(branch.id!, {
        status: branch.status === 'active' ? 'inactive' : 'active'
      });
    } catch (error) {
      console.error('Error updating branch status:', error);
    }
  };

  const stats = {
    total: branches?.length || 0,
    active: branches?.filter(b => b.status === 'active').length || 0,
    inactive: branches?.filter(b => b.status === 'inactive').length || 0,
    main: branches?.filter(b => b.type === 'main').length || 0,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <BranchesHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddBranch={() => handleOpenModal()}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-lg"><Building2 className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">إجمالي الفروع</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">فروع نشطة</p>
            <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg"><XCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">فروع غير نشطة</p>
            <p className="text-2xl font-bold text-slate-800">{stats.inactive}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Store className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">فروع رئيسية</p>
            <p className="text-2xl font-bold text-slate-800">{stats.main}</p>
          </div>
        </div>
      </div>

      <BranchesGrid 
        branches={filteredBranches}
        searchTerm={searchTerm}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        onToggleStatus={toggleStatus}
        onAddFirstBranch={() => handleOpenModal()}
      />

      <BranchModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingBranch={editingBranch}
      />

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="تأكيد حذف الفرع"
        message="هل أنت متأكد من حذف هذا الفرع بشكل نهائي؟ (تنبيه: سيتم مسح السجلات المرتبطة إذا لم تكن مقيدة)"
      />
    </div>
  );
};

export default Branches;
