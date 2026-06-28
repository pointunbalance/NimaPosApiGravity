import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { PurchaseRequest, PurchaseRequestItem } from '../../types';

export const usePurchaseRequestsState = (success: (msg: string) => void, showError: (msg: string) => void) => {
  const requests = useLiveQuery(() => db.purchaseRequests.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const users = useLiveQuery(() => db.users.toArray(), []);
  const currentUser = JSON.parse(localStorage.getItem('nima_user') || '{}');

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PurchaseRequest | null>(null);
  
  const [formData, setFormData] = useState<Partial<PurchaseRequest>>({
    requestNumber: `PR-${Date.now().toString().slice(-6)}`,
    date: new Date(),
    requestedBy: currentUser.id,
    department: '',
    items: [],
    status: 'pending',
    notes: ''
  });

  const [newItem, setNewItem] = useState<PurchaseRequestItem>({ productId: 0, quantity: 1, notes: '' });

  // Custom Confirmation Modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    return requests.filter(r => 
      r.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requests, searchTerm]);

  const workflows = useLiveQuery(() => db.approvalWorkflows?.where('type').equals('purchase_order').toArray() || [], []);

  const evaluateConditions = (workflow: any) => {
    if (!workflow.conditions || workflow.conditions.length === 0) return true;
    const totalQty = formData.items?.reduce((a, b) => a + b.quantity, 0) || 0;
    
    for (const cond of workflow.conditions) {
      const val = parseFloat(cond.value);
      if (cond.field === 'quantity' || cond.field === 'amount') {
        if (cond.operator === '>' && !(totalQty > val)) return false;
        if (cond.operator === '<' && !(totalQty < val)) return false;
        if (cond.operator === '>=' && !(totalQty >= val)) return false;
        if (cond.operator === '<=' && !(totalQty <= val)) return false;
        if (cond.operator === '==' && !(totalQty == val)) return false;
      }
    }
    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.items || formData.items.length === 0) {
      showError('الرجاء إضافة صنف واحد على الأقل');
      return;
    }

    try {
      let initialStatus = formData.status || 'pending';
      let activeWorkflowId = formData.activeWorkflowId;
      let approvalStepIndex = formData.approvalStepIndex;

      // Apply workflow on new requests
      if (!editingRequest?.id) {
        const activeWorkflows = workflows?.filter(w => w.status === 'active') || [];
        const matched = activeWorkflows.find(w => evaluateConditions(w));
        
        if (matched && matched.steps && matched.steps.length > 0) {
          initialStatus = 'in_workflow';
          activeWorkflowId = matched.id;
          approvalStepIndex = 0;
        } else {
          initialStatus = 'pending';
        }
      }

      const updatedData = {
        ...formData,
        status: initialStatus,
        activeWorkflowId,
        approvalStepIndex,
        updatedAt: new Date()
      };

      if (editingRequest && editingRequest.id) {
        await db.purchaseRequests.update(editingRequest.id, updatedData);
        success('تم تحديث طلب الشراء بنجاح');
      } else {
        await db.purchaseRequests.add({
          ...updatedData as PurchaseRequest,
          createdAt: new Date()
        });
        success('تم حفظ طلب الشراء بنجاح');
      }
      
      setIsModalOpen(false);
      setEditingRequest(null);
      resetForm();
    } catch (err) {
      console.error('Failed to save purchase request:', err);
      showError('حدث خطأ أثناء حفظ طلب الشراء.');
    }
  };

  const resetForm = () => {
    setFormData({
      requestNumber: `PR-${Date.now().toString().slice(-6)}`,
      date: new Date(),
      requestedBy: currentUser.id,
      department: '',
      items: [],
      status: 'pending',
      notes: ''
    });
    setNewItem({ productId: 0, quantity: 1, notes: '' });
  };

  const handleDelete = (id: number) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف طلب الشراء',
      message: 'هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.',
      onConfirm: async () => {
        try {
          await db.purchaseRequests.delete(id);
          success('تم حذف طلب الشراء بنجاح');
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error(err);
          showError('حدث خطأ أثناء الحذف');
        }
      }
    });
  };

  const handleStatusChange = async (id: number, status: PurchaseRequest['status']) => {
    try {
      await db.purchaseRequests.update(id, {
        status,
        updatedAt: new Date()
      });
      success('تم تحديث حالة الطلب بنجاح');
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء تحديث الحالة');
    }
  };

  const handleWorkflowAction = async (req: PurchaseRequest, action: 'approved' | 'rejected', notes: string = '') => {
    try {
      const activeWf = workflows?.find(w => w.id === req.activeWorkflowId);
      
      const historyEntry = {
        stepName: activeWf?.steps[req.approvalStepIndex || 0] || 'Unknown',
        approverId: currentUser.id,
        action,
        date: new Date().toISOString(),
        notes
      };

      const newHistory = [...(req.approvalHistory || []), historyEntry];

      if (action === 'rejected') {
        await db.purchaseRequests.update(req.id!, {
          status: 'rejected',
          approvalHistory: newHistory,
          updatedAt: new Date()
        });
        success('تم رفض طلب الشراء');
      } else {
        // Approved step
        const isLastStep = !activeWf || (req.approvalStepIndex || 0) >= (activeWf.steps.length - 1);
        await db.purchaseRequests.update(req.id!, {
          status: isLastStep ? 'approved' : 'in_workflow',
          approvalStepIndex: isLastStep ? req.approvalStepIndex : (req.approvalStepIndex || 0) + 1,
          approvalHistory: newHistory,
          updatedAt: new Date()
        });
        success(isLastStep ? 'تم اعتماد طلب الشراء بالكامل' : 'تمت الموافقة على خطوة الاعتماد بنجاح');
      }
      
      // Log Audit
      await db.auditLogs.add({
        userId: currentUser.name || 'system',
        userName: currentUser.name || 'system',
        action: 'update',
        module: 'settings',
        details: `تم ${action === 'approved' ? 'اعتماد' : 'رفض'} خطوة في طلب الشراء ${req.requestNumber}`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء تنفيذ الإجراء المالي للموافقة/الرفض');
    }
  };

  const handleAddItem = () => {
    if (newItem.productId && newItem.quantity > 0) {
      setFormData(prev => ({
        ...prev,
        items: [...(prev.items || []), newItem]
      }));
      setNewItem({ productId: 0, quantity: 1, notes: '' });
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  const getProductName = (id: number) => products?.find(p => p.id === id)?.name || 'منتج غير معروف';
  const getUserName = (id: number) => users?.find(u => u.id === id)?.name || 'غير معروف';

  return {
    requests,
    products,
    users,
    currentUser,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    setIsModalOpen,
    editingRequest,
    setEditingRequest,
    formData,
    setFormData,
    newItem,
    setNewItem,
    filteredRequests,
    workflows,
    confirmState,
    setConfirmState,
    handleSave,
    resetForm,
    handleDelete,
    handleStatusChange,
    handleWorkflowAction,
    handleAddItem,
    handleRemoveItem,
    getProductName,
    getUserName
  };
};
