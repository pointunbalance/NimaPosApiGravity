import React, { useState } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, X, DollarSign, Calendar, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { AccountingEngine } from '../../services/AccountingEngine';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export const SalonAppointments = () => {
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Deletion confirm states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    customerName: "",
    service: "قص شعر وتصفيف",
    date: new Date().toISOString().split('T')[0],
    status: "مؤكد",
    price: 350,
    paymentMethod: "cash" as "cash" | "bank_transfer"
  });

  const records = useLiveQuery(() => db.salonAppointments.toArray()) || [];

  const filteredRecords = records.filter((item: any) => {
    return (
      item.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      item.service?.toLowerCase().includes(search.toLowerCase()) ||
      item.status?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({
        customerName: item.customerName || "",
        service: item.service || "قص شعر وتصفيف",
        date: item.date || new Date().toISOString().split('T')[0],
        status: item.status || "مؤكد",
        price: Number(item.price) || 350,
        paymentMethod: item.paymentMethod || "cash"
      });
    } else {
      setCurrentId(null);
      // Compliance with Ukrainian Christian name policy for default placeholder
      setFormData({
        customerName: "كاترينا ملنيك", // Olga, Kateryna, Svitlana, Andriy, Roman
        service: "قص شعر وتصفيف",
        date: new Date().toISOString().split('T')[0],
        status: "مؤكد",
        price: 350,
        paymentMethod: "cash"
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedPrice = Number(formData.price) || 0;
      
      let savedId = currentId;
      if (isEdit && currentId) {
        await db.salonAppointments.update(currentId, {
          ...formData,
          price: parsedPrice
        });
        success('تم تحديث موعد الصالون بنجاح');
      } else {
        const addedId = await db.salonAppointments.add({
          ...formData,
          price: parsedPrice
        });
        savedId = addedId as number;
        success('تم حجز موعد جديد في الصالون');

        // Automatic Accounting Ledger entry posting for salon revenue!
        if (parsedPrice > 0) {
          try {
            let debitAccountCode = '1010'; // Cash
            if (formData.paymentMethod === 'bank_transfer') debitAccountCode = '1020'; // Bank

            const debitAccount = await db.accounts.where('code').equals(debitAccountCode).first();
            const salesAccount = await db.accounts.where('code').equals('4010').first(); // Sales/Service Revenues

            if (debitAccount && salesAccount) {
              await AccountingEngine.postEntry({
                date: new Date(formData.date),
                reference: `SALON-APT-${savedId}`,
                description: `إيراد حجز صالون تلقائي - العميل: ${formData.customerName} - الخدمة: ${formData.service}`,
                lines: [
                  {
                    accountId: debitAccount.id!,
                    accountName: debitAccount.name,
                    debit: parsedPrice,
                    credit: 0,
                    description: `استلام قيمة خدمة صالون (${formData.service})`
                  },
                  {
                    accountId: salesAccount.id!,
                    accountName: salesAccount.name,
                    debit: 0,
                    credit: parsedPrice,
                    description: `إيرادات خدمات مركز تجميل - العميل ${formData.customerName}`
                  }
                ],
                ignoreClosedPeriod: true
              });
              success('تم تدوين القيد المحاسبي وحفظ المعاملة المالية في الأستاذ العام');
            }
          } catch (acctErr) {
            console.error("Failed to post automatic journal entry for salon appointment registration:", acctErr);
          }
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء حفظ موعد الصالون');
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await db.salonAppointments.delete(deleteId);
      success('تم إلغاء وحذف موعد الصالون بنجاح');
    } catch (err) {
      error('حدث خطأ أثناء الحذف');
    }
    setDeleteId(null);
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <span>نظام حجز مواعيد وإيرادات الصالون</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium">جدولة الجلسات وتصفيف الشعر مع مزامنة لحظية في المالية العامة وحساب الأرباح</p>
        </div>
        
        <button 
          onClick={() => handleOpenModal(false)}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-600/15"
        >
          <Plus className="w-5 h-5" />
          <span>حجز موعد جديد</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="البحث باسم العميل، الخدمة أو حالة الحجز..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition font-bold text-slate-700"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="px-6 py-4">رقم الحجز</th>
                <th className="px-6 py-4">اسم العميل</th>
                <th className="px-6 py-4">الخدمة المطلوبة</th>
                <th className="px-6 py-4">تاريخ الموعد</th>
                <th className="px-6 py-4">سعر الخدمة</th>
                <th className="px-6 py-4">وسيلة الدفع</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-bold text-lg">
                    لا يوجد أي مواعيد حجز صالون مسجلة.
                  </td>
                </tr>
              ) : filteredRecords.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 font-mono font-bold text-slate-400">#APT-{item.id}</td>
                  <td className="px-6 py-4 font-extrabold text-slate-900">{item.customerName}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{item.service}</td>
                  <td className="px-6 py-4 font-mono font-bold text-slate-500">{item.date}</td>
                  <td className="px-6 py-4 font-black text-slate-900 text-base">{item.price || 0} ج.م</td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                      {item.paymentMethod === 'bank_transfer' ? 'تحويل بنكي / كارت' : 'نقداً'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {item.status || 'مؤكد'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleOpenModal(true, item)} 
                        className="p-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/70 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id!)} 
                        className="p-2 text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100/70 rounded-lg transition"
                      >
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

      {/* Modal form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>{isEdit ? 'تعديل موعد صالون قائم' : 'إضافة حجز صالون جديد'}</span>
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم العميل (اسم أوكراني مسيحي)</label>
                <input 
                  type="text" 
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  required
                  placeholder="مثال: كاترينا شفتشينكو"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">الخدمة المطلوبة</label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({...formData, service: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                >
                  <option value="قص شعر وتصفيف">قص شعر وتصفيف</option>
                  <option value="صبغ وتلوين شعر كامل">صبغ وتلوين شعر كامل</option>
                  <option value="جلسة العناية بالبشرة والترطيب">جلسة العناية بالبشرة والترطيب</option>
                  <option value="باديكير ومانيكير كلاسيكي">باديكير ومانيكير كلاسيكي</option>
                  <option value="تصفيف ومكياج للمناسبات السعيدة">تصفيف ومكياج للمناسبات السعيدة</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 font-mono">تاريخ الموعد</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                  >
                    <option value="مؤكد">مؤكد</option>
                    <option value="قيد الانتظار">قيد الانتظار</option>
                    <option value="مكتمل">مكتمل ومستلم</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">مبلغ الخدمة (ج.م)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="number" 
                      min="0"
                      value={formData.price || ''}
                      onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                      required
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition font-black text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">طريقة الدفع</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                  >
                    <option value="cash">نقدي (خزينة رئيسية / كاش)</option>
                    <option value="bank_transfer">تحويل بنكي / كارت شبكة</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-200 font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 font-bold text-white rounded-xl hover:bg-indigo-700 transition"
                >
                  حفظ الحجز والمزامنة دفترياً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom non-native delete confirmation */}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="تأكيد إلغاء وحذف الموعد"
        message="هل أنت متأكد من رغبتك في إلغاء وحذف حجز هذا الموعد من الصالون بشكل نهائي؟"
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        confirmText="نعم، حذف الحجز"
        cancelText="تراجع"
      />
    </div>
  );
};

export default SalonAppointments;
