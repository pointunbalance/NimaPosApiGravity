import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Contract } from '../../types';
import { FileSignature, Plus, Search, Filter } from 'lucide-react';
import { addDays } from 'date-fns';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { ContractModal } from '../../components/legal/ContractModal';
import { ContractsTable } from '../../components/legal/ContractsTable';

export const ContractManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Partial<Contract> | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const contracts = useLiveQuery(() => db.contracts?.toArray() || []) || [];

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.partyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesType = filterType === 'all' || c.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContract?.title || !editingContract?.partyName || !editingContract?.startDate || !editingContract?.endDate) return;

    const contractData = {
      title: editingContract.title,
      type: editingContract.type as any || 'other',
      partyName: editingContract.partyName,
      startDate: new Date(editingContract.startDate),
      endDate: new Date(editingContract.endDate),
      status: editingContract.status as any || 'active',
      value: editingContract.value ? Number(editingContract.value) : undefined,
      notes: editingContract.notes || '',
      clauses: editingContract.clauses || []
    };

    if (editingContract.id) {
      await db.contracts?.update(editingContract.id, contractData);
    } else {
      await db.contracts?.add(contractData as Contract);
    }

    setIsModalOpen(false);
    setEditingContract(null);
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const openModal = (contract?: Contract) => {
    if (contract) {
      setEditingContract({ ...contract });
    } else {
      setEditingContract({
        title: '',
        type: 'supplier',
        partyName: '',
        startDate: new Date(),
        endDate: addDays(new Date(), 365),
        status: 'active',
        value: 0,
        notes: '',
        clauses: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCopyVersion = (contract: Contract) => {
    const newVersion = { ...contract };
    delete newVersion.id;
    newVersion.title = newVersion.title + ' (نسخة جديدة)';
    setEditingContract(newVersion);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <FileSignature size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">إدارة العقود</h1>
            <p className="text-slate-500 mt-1">متابعة وتجديد عقود الموظفين والعملاء والموردين</p>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={20} />
          <span>عقد جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="البحث في العقود (العنوان، الطرف الثاني)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white text-slate-700 font-medium"
              >
                <option value="all">كل الأنواع</option>
                <option value="supplier">مورد</option>
                <option value="customer">عميل</option>
                <option value="employee">موظف</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 font-medium"
            >
              <option value="all">كل الحالات</option>
              <option value="active">ساري</option>
              <option value="pending">قيد الانتظار</option>
              <option value="expired">منتهي</option>
              <option value="terminated">ملغى</option>
            </select>
          </div>
        </div>

        <ContractsTable
          filteredContracts={filteredContracts}
          onCopyVersion={handleCopyVersion}
          onEdit={openModal}
          onDelete={handleDelete}
        />
      </div>

      <ContractModal
        isOpen={isModalOpen}
        editingContract={editingContract}
        setEditingContract={setEditingContract}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={deleteId !== null}
        title="تأكيد حذف العقد"
        message="هل أنت متأكد من حذف هذا العقد؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={async () => {
          if (deleteId !== null) {
            await db.contracts?.delete(deleteId);
            setDeleteId(null);
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

export default ContractManagement;