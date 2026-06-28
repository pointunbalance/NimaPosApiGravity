import React, { useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { AccountingEngine } from '../../services/AccountingEngine';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const SalonCommissions = () => {
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Deletion confirm states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    staffName: "",
    amount: "0",
    date: new Date().toISOString().split('T')[0],
    status: "غير مدفوع"
  });

  const records = useLiveQuery(() => db.salonCommissions.toArray()) || [];

  const filteredRecords = records.filter((item: any) => {
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({
        staffName: item.staffName || "",
        amount: String(item.amount || "0"),
        date: item.date || new Date().toISOString().split('T')[0],
        status: item.status || "غير مدفوع"
      });
    } else {
      setCurrentId(null);
      setFormData({
        staffName: "أولغا بتروفا", // Compliance with Ukrainian Christian names policy
        amount: "150",
        date: new Date().toISOString().split('T')[0],
        status: "غير مدفوع"
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const numericAmount = Number(formData.amount) || 0;
      const parsedData = {
        ...formData,
        amount: numericAmount
      };

      let savedId = currentId;
      if (isEdit && currentId) {
        await db.salonCommissions.update(currentId, parsedData);
        success('تم تحديث عمولة الصالون بنجاح');
      } else {
        const addedId = await db.salonCommissions.add(parsedData);
        savedId = addedId as number;
        success('تم إضافة سجل عمولة جديد بالصالون');
      }

      // Accounting link when commission is registered or marked as paid (مدفوع)
      if (formData.status === 'مدفوع' && numericAmount > 0) {
        try {
          const cashAcc = await db.accounts.where('code').equals('1010').first();
          const bonusAcc = await db.accounts.where('code').equals('5030').first(); // عمولات ورواتب

          if (cashAcc && bonusAcc) {
            await AccountingEngine.postEntry({
              date: new Date(formData.date),
              reference: `SALON-COM-${savedId}`,
              description: `صرف عمولة صالون تلقائي - الموظف: ${formData.staffName}`,
              lines: [
                {
                  accountId: bonusAcc.id!,
                  accountName: bonusAcc.name,
                  debit: numericAmount,
                  credit: 0,
                  description: `مصروف عمولة صالون المستحقة`
                },
                {
                  accountId: cashAcc.id!,
                  accountName: cashAcc.name,
                  debit: 0,
                  credit: numericAmount,
                  description: `صرف نقدي بقيمة العمولة من الصندوق`
                }
              ],
              ignoreClosedPeriod: true
            });
            success('تم إثبات صرف عمولة الموظف دفترياً باليومية العامة');
          }
        } catch (acctErr) {
          console.error("Accounting error on posting salon commission entry:", acctErr);
        }
      }

      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء حفظ عمولة الموظف');
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await db.salonCommissions.delete(deleteId);
      success('تم حذف سجل العمولة بنجاح');
    } catch (err) {
      error('تعذر الحذف');
    }
    setDeleteId(null);
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">حساب العمولات</h1>
          <p className="text-slate-500 mt-1">إدارة سجلات حساب العمولات</p>
        </div>
        <button 
          onClick={() => handleOpenModal(false)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors font-medium">
          <Plus className="w-5 h-5" />
          <span>إضافة جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 bg-slate-50">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في حساب العمولات..." 
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-right">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">المعرف</th>
                <th className="px-6 py-4 font-semibold text-slate-600">اسم الموظف</th>
                <th className="px-6 py-4 font-semibold text-slate-600">العمولة المستحقة</th>
                <th className="px-6 py-4 font-semibold text-slate-600">التاريخ</th>
                <th className="px-6 py-4 font-semibold text-slate-600">حالة الدفع</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                 <tr>
                   <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                     لا توجد سجلات. أضف سجل جديد للبدء.
                   </td>
                 </tr>
              ) : filteredRecords.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-600">#{item.id}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{item.staffName}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{item.amount}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{item.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{item.status}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center flex-wrap gap-2">
                       <button onClick={() => handleOpenModal(true, item)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleDelete(item.id)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {isEdit ? 'تعديل السجل' : 'إضافة سجل جديد'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">اسم الموظف</label>
                <input 
                  type="text" 
                  value={formData.staffName}
                  onChange={(e) => setFormData({...formData, staffName: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">العمولة المستحقة</label>
                <input 
                  type="number" 
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">التاريخ</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">حالة الدفع</label>
                <input 
                  type="text" 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-200 font-medium text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 font-medium text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom non-native delete confirmation */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="تأكيد حذف العمولة"
        message="هل أنت متأكد من حذف سجل هذه العمولة بنجاح؟ لن يمكنك استرجاع السجل."
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        confirmText="نعم، احذف السجل"
        cancelText="إلغاء"
      />
    </div>
  );
};
