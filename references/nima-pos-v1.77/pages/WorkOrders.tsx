import { AccountingEngine } from '../services/AccountingEngine';
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { WorkOrder, Recipe, Product } from '../types';
import { Factory, Search, Plus, Edit2, Trash2, CheckCircle, XCircle, Clock, Save, X, Settings, Play } from 'lucide-react';
import { format } from 'date-fns';

export const WorkOrders: React.FC = () => {
  const workOrders = useLiveQuery(() => db.workOrders.toArray(), []);
  const recipes = useLiveQuery(() => db.recipes.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const users = useLiveQuery(() => db.users.toArray(), []);
  const currentUser = JSON.parse(localStorage.getItem('nima_user') || '{}');

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);
  
  const [formData, setFormData] = useState<Partial<WorkOrder>>({
    workOrderNumber: `WO-${Date.now().toString().slice(-6)}`,
    recipeId: 0,
    productId: 0,
    plannedQuantity: 1,
    status: 'planned',
    startDate: new Date(),
    assignedTo: currentUser.id,
    notes: ''
  });

  const filteredOrders = workOrders?.filter(wo => 
    wo.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    products?.find(p => p.id === wo.productId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.recipeId || !formData.productId) {
      alert('الرجاء اختيار الوصفة والمنتج');
      return;
    }

    if (editingOrder && editingOrder.id) {
      await db.workOrders.update(editingOrder.id, {
        ...formData,
        updatedAt: new Date()
      });
    } else {
      await db.workOrders.add({
        ...formData as WorkOrder,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    setIsModalOpen(false);
    setEditingOrder(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      workOrderNumber: `WO-${Date.now().toString().slice(-6)}`,
      recipeId: 0,
      productId: 0,
      plannedQuantity: 1,
      status: 'planned',
      startDate: new Date(),
      assignedTo: currentUser.id,
      notes: ''
    });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف أمر التشغيل؟')) {
      await db.workOrders.delete(id);
    }
  };

  const handleStart = async (wo: WorkOrder) => {
    if (!window.confirm('هل أنت متأكد من البدء في أمر التشغيل؟ سيتم خصم المواد الخام من المخزن.')) {
      return;
    }

    const recipe = recipes?.find(r => r.id === wo.recipeId);
    if (!recipe) {
      alert('الوصفة غير موجودة!');
      return;
    }

    // Checking availability
    const multiplier = wo.plannedQuantity / recipe.yieldQuantity;
    const shortages: string[] = [];
    
    for (const item of recipe.items) {
       const rawMaterial = products?.find(p => p.id === item.productId);
       if (!rawMaterial) {
           shortages.push(`مادة خام غير معرفة (ID: ${item.productId})`);
           continue;
       }
       const consumedQty = item.quantity * multiplier;
       if (rawMaterial.stock < consumedQty) {
           shortages.push(`${rawMaterial.name}: مطلوب ${consumedQty} متاح ${rawMaterial.stock}`);
       }
    }

    if (shortages.length > 0) {
       alert(`خطأ: لا يوجد مخزون كافي للبدء!\n\nالنواقص:\n${shortages.join('\n')}`);
       return;
    }

    try {
      await (db as any).transaction('rw', db.workOrders, db.products, db.stockAdjustments, db.journalEntries, db.accounts, async () => {
        let totalCost = 0;
        
        for (const item of recipe.items) {
          const rawMaterial = await db.products.get(item.productId);
          if (rawMaterial) {
            const consumedQty = item.quantity * multiplier;
            await db.products.update(rawMaterial.id!, {
              stock: rawMaterial.stock - consumedQty
            });
            // Accrue cost
            if (rawMaterial.costPrice) {
                totalCost += (rawMaterial.costPrice * consumedQty);
            }
            
            // Log adjustment
            await db.stockAdjustments.add({
              productId: rawMaterial.id!,
              productName: rawMaterial.name,
              type: 'decrease',
              quantity: consumedQty,
              reason: 'other',
              notes: `استهلاك أمر تشغيل #${wo.workOrderNumber}`,
              date: new Date()
            });
          }
        }

        // Auto Accounting Integration (Journal Entry) for Raw Material issuance
        if (totalCost > 0) {
            try {
                const inventoryAccount = await db.accounts.where('code').equals('1040').first(); 
                
                await AccountingEngine.postEntry({
                    date: new Date(),
                    reference: `WO-${wo.workOrderNumber}`,
                    description: `قيمة المواد المستهلكة في أمر التشغيل #${wo.workOrderNumber}`,
                    lines: [
                        { accountId: inventoryAccount?.id || 1, accountName: inventoryAccount?.name || 'المخزون', debit: totalCost, credit: 0, description: `التشغيل والعمليات (WIP)` },
                        { accountId: inventoryAccount?.id || 1, accountName: inventoryAccount?.name || 'المخزون', debit: 0, credit: totalCost, description: `استهلاك مواد خام` }
                    ],
                });
            } catch (err) {
                 console.error("Failed to post automatic journal entry for Work Order:", err);
            }
        }

        await db.workOrders.update(wo.id!, {
          status: 'in-progress',
          updatedAt: new Date(),
          cost: totalCost // We need to store this total cost here, so let's use actualQuantity field to store something or we can just compute it. Actually, we can store it in wo.cost if it exists.
        });
      });
      alert('تم إطلاق أمر التشغيل وخصم المواد الخام!');
    } catch (error) {
      console.error('Error starting work order:', error);
      alert('حدث خطأ أثناء البدء بأمر التشغيل');
    }
  };

  const handleComplete = async (wo: WorkOrder) => {
    if (!window.confirm('هل أنت متأكد من إكمال أمر التشغيل؟ سيتم إضافة المنتج النهائي للمخزون.')) {
      return;
    }

    const recipe = recipes?.find(r => r.id === wo.recipeId);
    if (!recipe) {
      alert('الوصفة غير موجودة!');
      return;
    }

    try {
      await (db as any).transaction('rw', db.workOrders, db.products, db.stockAdjustments, db.journalEntries, db.accounts, async () => {
        // Calculate cost again just in case, or we could retrieve it.
        const multiplier = wo.plannedQuantity / recipe.yieldQuantity;
        let totalCost = 0;
        for (const item of recipe.items) {
          const rawMaterial = await db.products.get(item.productId);
          if (rawMaterial && rawMaterial.costPrice) {
              totalCost += (rawMaterial.costPrice * (item.quantity * multiplier));
          }
        }

        // 2. Add finished goods
        const finishedGood = await db.products.get(wo.productId);
        if (finishedGood) {
          // Update unit cost of finished good if total cost was calculated
          const unitCost = totalCost > 0 ? (totalCost / wo.plannedQuantity) : (finishedGood.costPrice || 0);
          await db.products.update(finishedGood.id!, {
            stock: (finishedGood.stock || 0) + wo.plannedQuantity,
            costPrice: unitCost
          });
          // Log adjustment
          await db.stockAdjustments.add({
            productId: finishedGood.id!,
            productName: finishedGood.name,
            type: 'increase',
            quantity: wo.plannedQuantity,
            reason: 'other',
            notes: `إنتاج أمر تشغيل #${wo.workOrderNumber}`,
            date: new Date()
          });
        }

        // 4. Update Work Order status
        await db.workOrders.update(wo.id!, {
          status: 'completed',
          actualQuantity: wo.plannedQuantity,
          cost: totalCost,
          endDate: new Date(),
          updatedAt: new Date()
        });
      });
      alert('تم إكمال أمر التشغيل بنجاح وتحديث المخزون');
    } catch (error) {
      console.error('Error completing work order:', error);
      alert('حدث خطأ أثناء إكمال أمر التشغيل');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1"><CheckCircle size={12}/> مكتمل</span>;
      case 'in-progress': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center gap-1"><Settings size={12} className="animate-spin"/> جاري العمل</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1"><XCircle size={12}/> ملغي</span>;
      default: return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1"><Clock size={12}/> مخطط</span>;
    }
  };

  const getProductName = (id: number) => products?.find(p => p.id === id)?.name || 'منتج غير معروف';
  const getRecipeName = (id: number) => recipes?.find(r => r.id === id)?.name || 'وصفة غير معروفة';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Factory className="w-6 h-6 text-indigo-500" />
            أوامر التشغيل والإنتاج
          </h1>
          <p className="text-slate-500 text-sm mt-1">إدارة عمليات التصنيع والإنتاج</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          أمر تشغيل جديد
        </button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="البحث برقم الأمر أو اسم المنتج..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">رقم الأمر</th>
                <th className="p-4 text-sm font-semibold text-slate-600">المنتج النهائي</th>
                <th className="p-4 text-sm font-semibold text-slate-600">الوصفة (BOM)</th>
                <th className="p-4 text-sm font-semibold text-slate-600">الكمية المطلوبة</th>
                <th className="p-4 text-sm font-semibold text-slate-600">تاريخ البدء</th>
                <th className="p-4 text-sm font-semibold text-slate-600">الحالة</th>
                <th className="p-4 text-sm font-semibold text-slate-600">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map(wo => (
                <tr key={wo.id} className="hover:bg-slate-50">
                  <td className="p-4 text-sm font-medium text-indigo-600">
                    {wo.workOrderNumber}
                  </td>
                  <td className="p-4 text-sm text-slate-800 font-bold">
                    {getProductName(wo.productId)}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {getRecipeName(wo.recipeId)}
                  </td>
                  <td className="p-4 text-sm text-slate-600 font-bold">
                    {wo.plannedQuantity}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {format(new Date(wo.startDate), 'yyyy-MM-dd')}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(wo.status)}
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    {wo.status === 'planned' && (
                      <button 
                        onClick={() => handleStart(wo)} 
                        className="text-blue-600 hover:text-blue-800 bg-blue-50 p-1.5 rounded-lg"
                        title="البدء (يخصم المواد الخام)"
                      >
                        <Play size={16} />
                      </button>
                    )}
                    {wo.status === 'in-progress' && (
                      <button 
                        onClick={() => handleComplete(wo)} 
                        className="text-green-600 hover:text-green-800 bg-green-50 p-1.5 rounded-lg"
                        title="إكمال الأمر واعتماد المخزون (منتج نهائي)"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    {(wo.status === 'planned' || wo.status === 'in-progress') && (
                      <button 
                        onClick={() => {
                        setEditingOrder(wo);
                        setFormData(wo);
                        setIsModalOpen(true);
                      }}
                      className="text-slate-400 hover:text-indigo-600 bg-slate-50 p-1.5 rounded-lg "
                    >
                      <Edit2 size={16} />
                    </button>
                    )}
                    <button 
                      onClick={() => handleDelete(wo.id!)}
                      className="text-slate-400 hover:text-red-600 bg-slate-50 p-1.5 rounded-lg "
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    لا توجد أوامر تشغيل
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-900">
                {editingOrder ? 'تعديل أمر التشغيل' : 'أمر تشغيل جديد'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 ">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الأمر *</label>
                  <input
                    type="text"
                    required
                    value={formData.workOrderNumber || ''}
                    onChange={e => setFormData({...formData, workOrderNumber: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الوصفة (BOM) *</label>
                  <select
                    required
                    value={formData.recipeId || ''}
                    onChange={e => {
                      const rId = parseInt(e.target.value);
                      const recipe = recipes?.find(r => r.id === rId);
                      setFormData({
                        ...formData, 
                        recipeId: rId,
                        productId: recipe ? recipe.productId : 0
                      });
                    }}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  >
                    <option value="">اختر الوصفة...</option>
                    {recipes?.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({getProductName(r.productId)})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الكمية المطلوبة للإنتاج *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.plannedQuantity || 1}
                    onChange={e => setFormData({...formData, plannedQuantity: parseFloat(e.target.value)})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                  <select
                    value={formData.status || 'planned'}
                    onChange={e => setFormData({...formData, status: e.target.value as WorkOrder['status']})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  >
                    <option value="planned">مخطط</option>
                    <option value="in-progress">جاري العمل</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ البدء</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate ? format(new Date(formData.startDate), 'yyyy-MM-dd') : ''}
                    onChange={e => setFormData({...formData, startDate: new Date(e.target.value)})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المسؤول</label>
                  <select
                    value={formData.assignedTo || ''}
                    onChange={e => setFormData({...formData, assignedTo: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                  >
                    <option value="">اختر الموظف...</option>
                    {users?.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                <textarea
                  rows={3}
                  value={formData.notes || ''}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 "
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg "
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Save size={20} />
                  حفظ الأمر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrders;
