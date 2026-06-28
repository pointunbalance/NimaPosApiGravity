import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { InventoryCountSession, InventoryCountItem } from '../types';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

import InventoryCountHeader from '../components/inventory-count/InventoryCountHeader';
import InventoryCountList from '../components/inventory-count/InventoryCountList';
import NewSessionModal from '../components/inventory-count/NewSessionModal';
import ActiveSessionModal from '../components/inventory-count/ActiveSessionModal';

const InventoryCount: React.FC = () => {
  const { success, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'in_progress' | 'completed' | 'cancelled'>('all');
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<InventoryCountSession | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [isUncountedConfirmOpen, setIsUncountedConfirmOpen] = useState(false);

  // New Session State
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | ''>('');
  const [countType, setCountType] = useState<'comprehensive' | 'spot' | 'cycle'>('comprehensive');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Active Session State
  const [activeItems, setActiveItems] = useState<InventoryCountItem[]>([]);

  // Data Fetching
  const sessions = useLiveQuery(() => db.inventoryCountSessions.reverse().sortBy('date'), []);
  const warehouses = useLiveQuery(() => db.warehouses.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const currentUser = useLiveQuery(() => db.users.where('isActive').equals(1).first());

  // Derived Data
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    return sessions.filter(s => {
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const warehouseName = warehouses?.find(w => w.id === s.warehouseId)?.name || '';
      const matchesSearch = warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.id?.toString().includes(searchTerm);
      return matchesStatus && matchesSearch;
    });
  }, [sessions, statusFilter, searchTerm, warehouses]);

  // Handlers
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseId) {
      showError('يرجى اختيار المخزن.');
      return;
    }

    try {
      // Fetch current inventory for the selected warehouse
      const inventory = await db.inventory.where('warehouseId').equals(Number(selectedWarehouseId)).toArray();
      
      let targetProducts = products || [];

      if (countType === 'cycle') {
        if (!selectedCategoryId) {
          showError('يرجى اختيار التصنيف للجرد الدوري.');
          return;
        }
        const selectedCategory = categories?.find(c => c.id === Number(selectedCategoryId));
        if (selectedCategory) {
          targetProducts = targetProducts.filter(p => p.category === selectedCategory.name);
        }
      } else if (countType === 'spot') {
        // Randomly select 5 products
         const shuffled = [...targetProducts].sort(() => 0.5 - Math.random());
         targetProducts = shuffled.slice(0, 5);
      }

      const items: InventoryCountItem[] = targetProducts.map(product => {
         const inv = inventory.find(i => i.productId === product.id);
         return {
            productId: product.id!,
            productName: product.name,
            systemQuantity: inv ? inv.quantity : 0,
            actualQuantity: null,
            difference: 0,
            costPrice: product.costPrice || 0
         };
      });

      if (items.length === 0) {
        showError('لا يوجد منتجات مطابقة لعملية الجرد المحددة.');
        return;
      }

      await db.inventoryCountSessions.add({
        date: new Date(),
        warehouseId: Number(selectedWarehouseId),
        countType,
        status: 'draft',
        items: items,
        notes: notes,
        createdBy: currentUser?.name || 'مستخدم غير معروف'
      });

      setIsNewModalOpen(false);
      setSelectedWarehouseId('');
      setCountType('comprehensive');
      setSelectedCategoryId('');
      setNotes('');
      success('تم بدء جلسة الجرد بنجاح.');
    } catch (error) {
      console.error("Failed to create session", error);
      showError('حدث خطأ أثناء إنشاء جلسة الجرد.');
    }
  };

  const openSession = (session: InventoryCountSession) => {
    setSelectedSession(session);
    setActiveItems(session.items);
    setIsSessionModalOpen(true);
  };

  const handleUpdateActualQuantity = (productId: number, value: string) => {
    const actualQty = value === '' ? null : Number(value);
    setActiveItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return {
          ...item,
          actualQuantity: actualQty,
          difference: actualQty !== null ? actualQty - item.systemQuantity : 0
        };
      }
      return item;
    }));
  };

  const handleUpdateItemNotes = (productId: number, notes: string) => {
    setActiveItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, notes };
      }
      return item;
    }));
  };

  const handleUpdateAdjustmentReason = (productId: number, reason: any) => {
    setActiveItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, adjustmentReason: reason };
      }
      return item;
    }));
  };

  const handleSaveDraft = async () => {
    if (!selectedSession?.id) return;
    try {
      await db.inventoryCountSessions.update(selectedSession.id, {
        items: activeItems,
        status: 'in_progress'
      });
      success('تم حفظ الجرد كمسودة بنجاح.');
      setIsSessionModalOpen(false);
    } catch (error) {
      console.error("Failed to save draft", error);
      showError('حدث خطأ أثناء الحفظ.');
    }
  };

  const handleCompleteSession = async () => {
    if (!selectedSession?.id) return;
    
    // Check if all items have been counted
    const uncountedItems = activeItems.filter(i => i.actualQuantity === null);
    if (uncountedItems.length > 0) {
        setIsUncountedConfirmOpen(true);
        return;
    }

    await submitCompletedSession();
  };

  const submitCompletedSession = async () => {
    if (!selectedSession?.id) return;

    const itemsWithDifferences = activeItems.filter(i => {
       const qty = i.actualQuantity === null ? 0 : i.actualQuantity;
       return (qty - i.systemQuantity) !== 0;
    });

    const unreasonedItems = itemsWithDifferences.filter(i => !i.adjustmentReason);
    if (unreasonedItems.length > 0) {
        showError(`يرجى تحديد سبب التسوية لـ ${unreasonedItems.length} صنف بها فروقات (اختر "عرض الفروقات وأسباب التسوية").`);
        return;
    }

    try {
      await (db as any).transaction('rw', db.inventory, db.products, db.inventoryCountSessions, db.stockAdjustments, db.expenses, async () => {
        const finalItems = activeItems.map(item => ({
            ...item,
            actualQuantity: item.actualQuantity === null ? 0 : item.actualQuantity,
            difference: (item.actualQuantity === null ? 0 : item.actualQuantity) - item.systemQuantity
        }));

        let totalLoss = 0;
        let totalGain = 0;

        for (const item of finalItems) {
          if (item.difference !== 0) {
            const cost = item.costPrice || 0;
            if (item.difference > 0) {
                totalGain += (item.difference * cost);
            } else {
                const lossValue = Math.abs(item.difference) * cost;
                totalLoss += lossValue;

                let expenseCategory = 'تسويات جردية';
                if (item.adjustmentReason === 'wastage') {
                    expenseCategory = 'مصروفات هالك وتالف';
                } else if (item.adjustmentReason === 'shortage') {
                    expenseCategory = 'خسائر عجز مخزون غير مبرر';
                } else if (item.adjustmentReason === 'wrong_entry') {
                    expenseCategory = 'تسويات أخطاء إدخال';
                }

                if (lossValue > 0) {
                    await db.expenses.add({
                        title: `تسوية جرد المنتجات - ${item.productName}`,
                        amount: lossValue,
                        category: expenseCategory,
                        date: new Date(),
                        notes: `تسوية جردية - الجلسة رقم ${selectedSession.id} - ${item.adjustmentReason === 'wastage' ? 'هالك' : item.adjustmentReason === 'shortage' ? 'فقد/سرقة' : item.adjustmentReason === 'wrong_entry' ? 'خطأ إدخال' : 'أخرى'}`,
                    });
                }
            }

            // Update Inventory
            const invItem = await db.inventory.where({ warehouseId: selectedSession.warehouseId, productId: item.productId }).first();
            if (invItem) {
                await db.inventory.update(invItem.id!, { quantity: item.actualQuantity });
            } else {
                await db.inventory.add({ warehouseId: selectedSession.warehouseId, productId: item.productId, quantity: item.actualQuantity! });
            }

            // Update Global Product Stock (simplified, ideally should recalculate from all warehouses)
            const product = await db.products.get(item.productId);
            if (product) {
                await db.products.update(item.productId, { stock: product.stock + item.difference });
            }

            // Log Adjustment
            const whName = warehouses?.find(w => w.id === selectedSession.warehouseId)?.name;
            await db.stockAdjustments.add({
                productId: item.productId,
                productName: item.productName,
                type: item.difference > 0 ? 'increase' : 'decrease',
                quantity: Math.abs(item.difference),
                reason: item.adjustmentReason || 'inventory_count',
                date: new Date(),
                notes: `تسوية جرد ${selectedSession.countType === 'cycle' ? 'دوري' : selectedSession.countType === 'spot' ? 'مفاجئ' : 'شامل'} (رقم الجلسة: ${selectedSession.id}) ${item.notes ? '- ' + item.notes : ''}`,
                warehouseId: selectedSession.warehouseId,
                warehouseName: whName
            });
          }
        }
        
        await db.inventoryCountSessions.update(selectedSession.id, { 
            status: 'completed',
            items: finalItems,
            completedAt: new Date(),
            totalLoss,
            totalGain
        });
      });
      
      success('تم إكمال الجرد وتسوية المخزون بنجاح.');
      setIsSessionModalOpen(false);
    } catch (error: any) {
      console.error("Session completion failed", error);
      showError(error.message || 'حدث خطأ أثناء إكمال الجرد.');
    }
  };

  const handleCancelSession = () => {
      if (!selectedSession?.id) return;
      setIsCancelConfirmOpen(true);
  };

  const executeCancelSession = async () => {
      if (!selectedSession?.id) return;
      await db.inventoryCountSessions.update(selectedSession.id, { status: 'cancelled' });
      success('تم إلغاء جلسة الجرد.');
      setIsSessionModalOpen(false);
      setIsCancelConfirmOpen(false);
  };

  const getWarehouseName = (id: number) => warehouses?.find(w => w.id === id)?.name || 'غير معروف';

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] font-sans transition-colors">
      
      <InventoryCountHeader 
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onNewSessionClick={() => setIsNewModalOpen(true)}
      />

      <InventoryCountList 
        filteredSessions={filteredSessions}
        getWarehouseName={getWarehouseName}
        onOpenSession={openSession}
      />

      <NewSessionModal 
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        warehouses={warehouses}
        categories={categories}
        selectedWarehouseId={selectedWarehouseId}
        setSelectedWarehouseId={setSelectedWarehouseId}
        countType={countType}
        setCountType={setCountType}
        selectedCategoryId={selectedCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        notes={notes}
        setNotes={setNotes}
        handleCreateSession={handleCreateSession}
      />

      <ActiveSessionModal 
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        selectedSession={selectedSession}
        activeItems={activeItems}
        getWarehouseName={getWarehouseName}
        handleUpdateActualQuantity={handleUpdateActualQuantity}
        handleUpdateItemNotes={handleUpdateItemNotes}
        handleUpdateAdjustmentReason={handleUpdateAdjustmentReason}
        handleCancelSession={handleCancelSession}
        handleSaveDraft={handleSaveDraft}
        handleCompleteSession={handleCompleteSession}
      />

      <ConfirmModal 
        isOpen={isCancelConfirmOpen}
        title="تأكيد إلغاء جلسة الجرد"
        message="هل أنت متأكد من إلغاء جلسة الجرد هذه؟ لن يتم حفظ التغييرات كما لن يتم تحديث رصيد أي منتجات في النظام."
        onConfirm={executeCancelSession}
        onCancel={() => setIsCancelConfirmOpen(false)}
        confirmText="نعم، إلغاء الجلسة"
        cancelText="تراجع"
      />

      <ConfirmModal 
        isOpen={isUncountedConfirmOpen}
        title="منتجات غير مجرودة"
        message="هناك منتجات متبقية في هذه الجلسة لم يتم تحديد كمياتها الفعلية بعد. هل ترغب في المتابعة واعتبار رصيدها الفعلي صفراً وتصفيتها؟"
        onConfirm={() => {
          setIsUncountedConfirmOpen(false);
          submitCompletedSession();
        }}
        onCancel={() => setIsUncountedConfirmOpen(false)}
        confirmText="نعم، أكمل مع الرصيد صفر"
        cancelText="تراجع لتحديث الكميات"
      />

    </div>
  );
};

export default InventoryCount;
