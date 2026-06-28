import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { RFQ, RFQItem } from '../../types';

export const useRFQsState = (success: (msg: string) => void, showError: (msg: string) => void) => {
  const rfqs = useLiveQuery(() => db.rfqs.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const currentUser = JSON.parse(localStorage.getItem('nima_user') || '{}');

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [editingRFQ, setEditingRFQ] = useState<RFQ | null>(null);
  
  const [formData, setFormData] = useState<Partial<RFQ>>({
    rfqNumber: `RFQ-${Date.now().toString().slice(-6)}`,
    date: new Date(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    supplierId: 0,
    items: [],
    status: 'draft',
    notes: ''
  });

  const [newItem, setNewItem] = useState<RFQItem>({ productId: 0, quantity: 1, quotedPrice: 0, notes: '' });

  const currencyCode = settings?.currencyCode || 'EGP';

  const filteredRFQs = rfqs?.filter(r => 
    r.rfqNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    suppliers?.find(s => s.id === r.supplierId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Confirm Modal state
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      showError('الرجاء اختيار المورد');
      return;
    }
    if (!formData.items || formData.items.length === 0) {
      showError('الرجاء إضافة صنف واحد على الأقل');
      return;
    }

    try {
      if (editingRFQ && editingRFQ.id) {
        await db.rfqs.update(editingRFQ.id, {
          ...formData,
          updatedAt: new Date()
        });
        success('تم تحديث عرض السعر بنجاح');
      } else {
        await db.rfqs.add({
          ...formData as RFQ,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        success('تم حفظ عرض السعر بنجaurh');
      }
      
      setIsModalOpen(false);
      setEditingRFQ(null);
      resetForm();
    } catch (err) {
      console.error('Failed to save RFQ:', err);
      showError('حدث خطأ أثناء حفظ عرض السعر.');
    }
  };

  const resetForm = () => {
    setFormData({
      rfqNumber: `RFQ-${Date.now().toString().slice(-6)}`,
      date: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      supplierId: 0,
      items: [],
      status: 'draft',
      notes: ''
    });
    setNewItem({ productId: 0, quantity: 1, quotedPrice: 0, notes: '' });
  };

  const handleDelete = (id: number) => {
    setConfirmState({
      isOpen: true,
      title: 'حذف عرض السعر',
      message: 'هل أنت متأكد من حذف عرض السعر؟ لا يمكن التراجع عن هذا الإجراء.',
      onConfirm: async () => {
        try {
          await db.rfqs.delete(id);
          success('تم حذف عرض السعر بنجاح');
        } catch (err) {
          console.error(err);
          showError('حدث خطأ أثناء الحذف');
        }
      }
    });
  };

  const handleStatusChange = async (id: number, status: RFQ['status']) => {
    await db.rfqs.update(id, {
      status,
      updatedAt: new Date()
    });
    success('تم تحديث الحالة بنجاح');
  };

  const convertToPurchaseOrder = (rfq: RFQ) => {
    setConfirmState({
      isOpen: true,
      title: 'تحويل إلى أمر شراء',
      message: 'هل أنت متأكد من تحويل عرض السعر إلى أمر شراء (Purchase Order)؟',
      onConfirm: async () => {
        try {
          await db.transaction('rw', db.rfqs, db.purchaseOrders, db.suppliers, db.products, async () => {
            const supplier = await db.suppliers.get(rfq.supplierId);
            
            const itemsWithNames = await Promise.all(rfq.items.map(async item => {
                const product = await db.products.get(item.productId);
                return {
                    productId: item.productId,
                    productName: product?.name || 'منتج غير معروف',
                    quantity: item.quantity,
                    costPrice: item.quotedPrice || 0,
                    total: item.quantity * (item.quotedPrice || 0)
                };
            }));

            const totalAmount = itemsWithNames.reduce((sum, item) => sum + item.total, 0);

            // Create PO
            await db.purchaseOrders.add({
              date: new Date(),
              supplierId: rfq.supplierId,
              supplierName: supplier?.name || 'مورد غير معروف',
              status: 'draft',
              items: itemsWithNames,
              subtotal: totalAmount,
              taxAmount: 0,
              discountAmount: 0,
              totalAmount: totalAmount,
              notes: `تم إنشاؤه من عرض السعر #${rfq.rfqNumber}`,
              createdBy: currentUser.name
            });

            // Update RFQ status
            await db.rfqs.update(rfq.id!, {
              status: 'accepted',
              updatedAt: new Date()
            });
          });
          success('تم إنشاء أمر الشراء بنجاح');
        } catch (error) {
          console.error('Error converting RFQ to PO:', error);
          showError('حدث خطأ أثناء إنشاء أمر الشراء');
        }
      }
    });
  };

  const handleAddItem = () => {
    if (newItem.productId && newItem.quantity > 0) {
      setFormData(prev => ({
        ...prev,
        items: [...(prev.items || []), newItem]
      }));
      setNewItem({ productId: 0, quantity: 1, quotedPrice: 0, notes: '' });
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items?.filter((_, i) => i !== index)
    }));
  };

  const getProductName = (id: number) => products?.find(p => p.id === id)?.name || 'منتج غير معروف';
  const getSupplierName = (id: number) => suppliers?.find(s => s.id === id)?.name || 'غير معروف';

  return {
    rfqs,
    products,
    suppliers,
    searchTerm,
    setSearchTerm,
    isModalOpen,
    setIsModalOpen,
    isCompareModalOpen,
    setIsCompareModalOpen,
    editingRFQ,
    setEditingRFQ,
    formData,
    setFormData,
    newItem,
    setNewItem,
    currencyCode,
    filteredRFQs,
    confirmState,
    setConfirmState,
    handleSave,
    resetForm,
    handleDelete,
    handleStatusChange,
    convertToPurchaseOrder,
    handleAddItem,
    handleRemoveItem,
    getProductName,
    getSupplierName,
  };
};
export default useRFQsState;
