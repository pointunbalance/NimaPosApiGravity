import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Edit2, Trash2, X, AlertOctagon, Timer, TriangleAlert } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { useToast } from '../../context/ToastContext';

export const ClinicInventory = () => {
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
  "itemName": "",
  "category": "",
  "stockAmount": "0",
  "minStockLevel": "10",
  "expiryDate": "",
  "batches": [] as { batchNumber: string, quantity: number, expiryDate: string }[]
});

  const records = useLiveQuery(() => db.clinicInventoryItems.toArray()) || [];

  const filteredRecords = records.filter((item: any) => {
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    );
  });

  const lowStockItems = records.filter(item => Number(item.stockAmount) <= Number(item.minStockLevel || 10));
  const expiringItems = records.filter(item => {
    if (!item.expiryDate) return false;
    const expDate = new Date(item.expiryDate);
    const now = new Date();
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  });

  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({
        itemName: item.itemName,
        category: item.category,
        stockAmount: String(item.stockAmount),
        minStockLevel: String(item.minStockLevel || 10),
        expiryDate: item.expiryDate || '',
        batches: item.batches || []
      });
    } else {
      setCurrentId(null);
      setFormData({"itemName":"","category":"","stockAmount":"0","minStockLevel":"10","expiryDate":"","batches":[]});
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate total stock and earliest expiry from batches if any
      let totalStock = Number(formData.stockAmount);
      let earliestExpiry = formData.expiryDate;
      if (formData.batches && formData.batches.length > 0) {
          totalStock = formData.batches.reduce((sum, b) => sum + Number(b.quantity), 0);
          const validBatches = formData.batches.filter(b => b.quantity > 0 && b.expiryDate);
          if (validBatches.length > 0) {
              const sorted = validBatches.sort((a,b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
              earliestExpiry = sorted[0].expiryDate;
          }
      }

      if (isEdit && currentId) {
        await db.clinicInventoryItems.update(currentId, {
          ...formData,
          stockAmount: totalStock,
          minStockLevel: Number(formData.minStockLevel),
          expiryDate: earliestExpiry
        });
      } else {
        await db.clinicInventoryItems.add({
          ...formData,
          stockAmount: totalStock,
          minStockLevel: Number(formData.minStockLevel),
          expiryDate: earliestExpiry
        });
      }
      setIsModalOpen(false);
      success('تم الحفظ بنجاح');
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء الحفظ');
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
       await db.clinicInventoryItems.delete(deleteId);
       setDeleteId(null);
       success('تم الحذف بنجاح');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">المستلزمات الطبية (المخزن)</h1>
          <p className="text-slate-500">إدارة سجلات المستلزمات الطبية (المخزن)</p>
        </div>
        <button 
          onClick={() => handleOpenModal(false)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus className="w-5 h-5" />
          <span>إضافة جديد</span>
        </button>
      </div>

      {(lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockItems.length > 0 && (
             <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                <div className="bg-red-100 p-2 rounded-lg text-red-600"><TriangleAlert className="w-5 h-5" /></div>
                <div>
                   <h3 className="font-bold text-red-800">تنبيه: أصناف وصلت لحد الأمان</h3>
                   <p className="text-red-700 text-sm mt-1">يوجد <strong>{lowStockItems.length}</strong> أصناف قاربت على النفاذ، يُرجى مراجعة المخزون.</p>
                </div>
             </div>
          )}
          {expiringItems.length > 0 && (
             <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start gap-3">
                <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><Timer className="w-5 h-5" /></div>
                <div>
                   <h3 className="font-bold text-orange-800">تنبيه: صلاحيات قاربت على الانتهاء</h3>
                   <p className="text-orange-700 text-sm mt-1">يوجد <strong>{expiringItems.length}</strong> أصناف ستنتهي صلاحيتها قريباً (خلال 30 يوم أو أقل).</p>
                </div>
             </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في المستلزمات الطبية (المخزن)..." 
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 text-right">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">المعرف</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">اسم الصنف</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">التصنيف</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الكمية المتوفرة</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">تاريخ الصلاحية</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">حد الأمان</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                     لا توجد سجلات. أضف سجل جديد للبدء.
                   </td>
                 </tr>
              ) : filteredRecords.map((item: any) => {
                const stock = Number(item.stockAmount) || 0;
                const minStock = Number(item.minStockLevel) || 10;
                const isLowStock = stock <= minStock;
                
                let isExpiringSoon = false;
                let isExpired = false;
                if (item.expiryDate) {
                   const expDate = new Date(item.expiryDate);
                   const now = new Date();
                   const diffTime = expDate.getTime() - now.getTime();
                   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                   if (diffDays <= 0) isExpired = true;
                   else if (diffDays <= 30) isExpiringSoon = true;
                }

                return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">#{item.id}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                         {item.itemName}
                         {isExpired && <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold"><AlertOctagon className="w-3 h-3"/> منتهي</span>}
                         {isExpiringSoon && <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold"><Timer className="w-3 h-3"/> قارب الانتهاء</span>}
                      </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.category}</td>
                  <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-md font-bold text-xs flex items-center w-fit gap-1 ${isLowStock ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                          {isLowStock && <TriangleAlert className="w-3 h-3" />}
                          {item.stockAmount}
                      </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-medium ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-slate-800'}`}>
                      {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('ar-EG') : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{item.minStockLevel || 10}</td>
                  <td className="px-6 py-4 p-0">
                    <div className="flex justify-center items-center gap-2">
                       <button onClick={() => handleOpenModal(true, item)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => setDeleteId(item.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {isEdit ? 'تعديل السجل' : 'إضافة سجل جديد'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم الصنف</label>
                <input 
                  type="text" 
                  value={formData.itemName}
                  onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">التصنيف</label>
                <input 
                  type="text" 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">الكمية المتوفرة (الإجمالي)</label>
                   <input 
                     type="number" 
                     value={formData.stockAmount}
                     onChange={(e) => setFormData({...formData, stockAmount: e.target.value})}
                     disabled={formData.batches.length > 0}
                     className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الصلاحية (الأقرب)</label>
                   <input 
                     type="date" 
                     value={formData.expiryDate}
                     onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                     disabled={formData.batches.length > 0}
                     className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100"
                   />
                 </div>
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">حد الأمان للتنبيه</label>
                 <input 
                   type="number" 
                   value={formData.minStockLevel}
                   onChange={(e) => setFormData({...formData, minStockLevel: e.target.value})}
                   required
                   className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                 />
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <h3 className="font-bold text-slate-800 mb-3 text-sm">أرقام التشغيلات (Batch Tracking)</h3>
                <div className="space-y-3">
                  {formData.batches.map((b: any, index: number) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input 
                         type="text"
                         value={b.batchNumber}
                         onChange={(e) => {
                            const newArr = [...formData.batches];
                            newArr[index].batchNumber = e.target.value;
                            setFormData({...formData, batches: newArr});
                         }}
                         placeholder="رقم التشغيلة (Batch ID)"
                         className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none text-xs"
                      />
                      <input 
                         type="number"
                         value={b.quantity}
                         onChange={(e) => {
                            const newArr = [...formData.batches];
                            newArr[index].quantity = Number(e.target.value);
                            setFormData({...formData, batches: newArr});
                         }}
                         placeholder="الكمية"
                         className="w-20 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none text-xs"
                      />
                      <input 
                         type="date"
                         value={b.expiryDate}
                         onChange={(e) => {
                            const newArr = [...formData.batches];
                            newArr[index].expiryDate = e.target.value;
                            setFormData({...formData, batches: newArr});
                         }}
                         className="w-32 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none text-xs"
                      />
                      <button 
                         type="button"
                         onClick={() => {
                            const newArr = formData.batches.filter((_, i) => i !== index);
                            setFormData({...formData, batches: newArr});
                         }}
                         className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg shrink-0"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, batches: [...formData.batches, { batchNumber: '', quantity: 1, expiryDate: '' }]})}
                    className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 flex items-center gap-1"
                  >
                     <Plus className="w-3 h-3" /> إضافة تشغيلة (Batch)
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
       )}
       
       <ConfirmModal
          isOpen={deleteId !== null}
          title="تأكيد الحذف"
          message="هل أنت متأكد من الحذف؟"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
          confirmText="تأكيد الحذف"
       />
    </div>
  );
};
