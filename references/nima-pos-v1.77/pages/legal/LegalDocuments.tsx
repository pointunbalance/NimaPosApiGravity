import React, { useState } from 'react';
import { db } from '../../db';
import { LegalDocument } from '../../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { isBefore, addDays, isAfter } from 'date-fns';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, CheckCircle, 
  Clock, FileSignature, FolderOpen,
  Filter, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { DocumentModal } from '../../components/legal/DocumentModal';
import { DocumentsTable } from '../../components/legal/DocumentsTable';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function LegalDocuments() {
  const { success, error } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingDoc, setEditingDoc] = useState<Partial<LegalDocument> | null>(null);

  const documents = useLiveQuery(() => db.legalDocuments.reverse().sortBy('uploadDate')) || [];

  const now = new Date();
  const thirtyDaysFromNow = addDays(now, 30);
  
  const totalDocs = documents.length;
  const expiredDocs = documents.filter(d => d.expiryDate && isBefore(new Date(d.expiryDate), now)).length;
  const expiringSoonDocs = documents.filter(d => d.expiryDate && isAfter(new Date(d.expiryDate), now) && isBefore(new Date(d.expiryDate), thirtyDaysFromNow)).length;
  const validDocs = totalDocs - expiredDocs - expiringSoonDocs;

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || doc.entityName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesEntity = filterEntity === 'all' || doc.entityType === filterEntity;
    
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      const isExpired = doc.expiryDate && isBefore(new Date(doc.expiryDate), now);
      const isExpiringSoon = doc.expiryDate && isAfter(new Date(doc.expiryDate), now) && isBefore(new Date(doc.expiryDate), thirtyDaysFromNow);
      
      if (filterStatus === 'expired') matchesStatus = !!isExpired;
      if (filterStatus === 'expiring_soon') matchesStatus = !!isExpiringSoon;
      if (filterStatus === 'valid') matchesStatus = !isExpired && !isExpiringSoon;
    }

    return matchesSearch && matchesType && matchesEntity && matchesStatus;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc?.title || !editingDoc?.entityName) return;

    const docData = {
      title: editingDoc.title,
      type: editingDoc.type as any || 'other',
      entityType: editingDoc.entityType as any || 'company',
      entityId: editingDoc.entityId ? Number(editingDoc.entityId) : undefined,
      entityName: editingDoc.entityName,
      uploadDate: editingDoc.uploadDate ? new Date(editingDoc.uploadDate) : new Date(),
      expiryDate: editingDoc.expiryDate ? new Date(editingDoc.expiryDate) : undefined,
      fileUrl: editingDoc.fileUrl || '',
      fileName: editingDoc.fileName || '',
      fileType: editingDoc.fileType || '',
      fileSize: editingDoc.fileSize || '',
      fileData: editingDoc.fileData || undefined,
      notes: editingDoc.notes || ''
    };

    try {
      if (editingDoc.id) {
        await db.legalDocuments.update(editingDoc.id, docData);
        success('تم تحديث المستند بنجاح');
      } else {
        await db.legalDocuments.add(docData as LegalDocument);
        success('تم إضافة المستند بنجاح');
      }
      setIsModalOpen(false);
      setEditingDoc(null);
    } catch (err) {
      error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const openModal = (doc?: LegalDocument) => {
    if (doc) {
      setEditingDoc({ ...doc });
    } else {
      setEditingDoc({
        type: 'commercial_register',
        entityType: 'company',
        uploadDate: new Date(),
        entityName: 'الشركة الرئيسية'
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">الإدارة القانونية والمستندات</h1>
            <p className="text-slate-500 mt-1">أرشفة وتتبع التراخيص، السجلات، والمستندات الرسمية</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            to="/legal/contracts"
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl hover:bg-slate-50 transition-colors font-medium shadow-sm"
          >
            <FileSignature size={20} />
            <span>إدارة العقود</span>
          </Link>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            <span>أرشفة مستند</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FolderOpen size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">إجمالي المستندات</p>
            <p className="text-2xl font-bold text-slate-800">{totalDocs}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">مستندات سارية</p>
            <p className="text-2xl font-bold text-slate-800">{validDocs}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">تنتهي قريباً</p>
            <p className="text-2xl font-bold text-slate-800">{expiringSoonDocs}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">مستندات منتهية</p>
            <p className="text-2xl font-bold text-slate-800">{expiredDocs}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="البحث في المستندات (الاسم، الجهة)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white text-slate-700 font-medium text-sm"
              >
                <option value="all">كل الأنواع</option>
                <option value="commercial_register">سجل تجاري</option>
                <option value="tax_card">بطاقة ضريبية</option>
                <option value="license">ترخيص</option>
                <option value="id_card">هوية شخصية</option>
                <option value="contract">عقد</option>
                <option value="insurance">وثيقة تأمين</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 font-medium text-sm"
            >
              <option value="all">كل الجهات</option>
              <option value="company">الشركة</option>
              <option value="employee">موظف</option>
              <option value="supplier">مورد</option>
              <option value="customer">عميل</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 font-medium text-sm"
            >
              <option value="all">كل الحالات</option>
              <option value="valid">ساري</option>
              <option value="expiring_soon">ينتهي قريباً</option>
              <option value="expired">منتهي</option>
            </select>
          </div>
        </div>

        <DocumentsTable 
          filteredDocuments={filteredDocuments}
          onEdit={openModal}
          onDelete={handleDelete}
        />
      </div>

      <DocumentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingDoc={editingDoc}
        setEditingDoc={setEditingDoc}
        onSave={handleSave}
        success={success}
        error={error}
      />

      <ConfirmModal
        isOpen={deleteId !== null}
        title="تأكيد حذف المستند"
        message="هل أنت متأكد من حذف هذا المستند الرسمي؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={async () => {
          if (deleteId !== null) {
            try {
              await db.legalDocuments.delete(deleteId);
              success('تم حذف المستند بنجاح');
            } catch (err) {
              error('حدث خطأ أثناء حذف المستند');
            } finally {
              setDeleteId(null);
            }
          }
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
