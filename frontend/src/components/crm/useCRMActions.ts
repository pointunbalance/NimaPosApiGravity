import { useState } from 'react';
import { db } from '../../db';
import { Lead } from '../../types';
import { exportToExcel } from '../../utils/excel';
import { format } from 'date-fns';
import { DropResult } from '@hello-pangea/dnd';

const STAGES = [
  { id: 'new', title: 'جديد' },
  { id: 'contacted', title: 'تم التواصل' },
  { id: 'qualified', title: 'مؤهل' },
  { id: 'proposal', title: 'عرض سعر' },
  { id: 'won', title: 'تم البيع' },
  { id: 'lost', title: 'مفقود' },
];

export const useCRMActions = (
  leads: Lead[] | undefined,
  users: any[] | undefined,
  success: (msg: string) => void,
  error: (msg: string) => void
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [leadToDeleteId, setLeadToDeleteId] = useState<number | null>(null);

  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'new',
    value: 0,
    expectedCloseDate: undefined,
    assignedTo: undefined,
    notes: ''
  });

  const handleExport = () => {
    if (!leads || leads.length === 0) {
      error('لا يوجد عملاء محتملين للتصدير');
      return;
    }
    const exportData = leads.map(l => ({
      'الاسم': l.name,
      'الشركة': l.company || '',
      'رقم الهاتف': l.phone || '',
      'البريد الإلكتروني': l.email || '',
      'المرحلة': STAGES.find(s => s.id === l.status)?.title || l.status,
      'القيمة المتوقعة': l.value || 0,
      'تاريخ الإغلاق المتوقع': l.expectedCloseDate ? format(new Date(l.expectedCloseDate), 'yyyy-MM-dd') : '',
      'تعيين إلى': users?.find(u => u.id === l.assignedTo)?.name || 'غير معين',
      'تاريخ الإضافة': format(new Date(l.createdAt), 'yyyy-MM-dd')
    }));
    exportToExcel(exportData, `Leads_${format(new Date(), 'yyyy-MM-dd')}`);
    success('تم تصدير العملاء المحتملين بنجاح');
  };

  const executeConvertToCustomer = async (lead: Lead) => {
    try {
      await db.customers.add({
        name: lead.name,
        phone: lead.phone || '',
        email: lead.email || '',
        address: lead.company || '',
        balance: 0,
        walletBalance: 0,
        creditLimit: 0,
        totalSpent: 0,
        tags: ['من المبيعات'],
        createdAt: new Date()
      });
      
      if (lead.status !== 'won') {
        await db.leads.update(lead.id!, { status: 'won', updatedAt: new Date() });
      }
      
      success('تم تحويل العميل المحتمل إلى عميل فعلي بنجاح');
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء تحويل العميل');
    } finally {
      setLeadToConvert(null);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId !== destination.droppableId) {
      const leadId = parseInt(draggableId);
      const newStatus = destination.droppableId as Lead['status'];
      
      await db.leads.update(leadId, {
        status: newStatus,
        updatedAt: new Date()
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLead && editingLead.id) {
        await db.leads.update(editingLead.id, {
          ...formData,
          updatedAt: new Date()
        });
        success('تم تعديل العميل المحتمل بنجاح');
      } else {
        await db.leads.add({
          ...formData as Lead,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        success('تم إضافة العميل المحتمل بنجاح');
      }
      
      setIsModalOpen(false);
      setEditingLead(null);
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        status: 'new',
        value: 0,
        expectedCloseDate: undefined,
        assignedTo: undefined,
        notes: ''
      });
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء حفظ البيانات');
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData(lead);
    setIsModalOpen(true);
  };

  const executeDelete = async (id: number) => {
    try {
      await db.leads.delete(id);
      success('تم حذف العميل المحتمل بنجاح');
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء الحذف');
    } finally {
      setLeadToDeleteId(null);
    }
  };

  return {
    isModalOpen,
    setIsModalOpen,
    editingLead,
    setEditingLead,
    viewingLead,
    setViewingLead,
    leadToConvert,
    setLeadToConvert,
    leadToDeleteId,
    setLeadToDeleteId,
    formData,
    setFormData,
    handleExport,
    executeConvertToCustomer,
    handleDragEnd,
    handleSave,
    handleEdit,
    executeDelete
  };
};
