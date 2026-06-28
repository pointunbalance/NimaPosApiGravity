import React, { useState } from 'react';
import { db } from '../../db';
import { GiftCard } from '../../types';
import { Gift, Plus, Edit, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function GiftCards() {
  const { success, error: showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<GiftCard | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; id: number } | null>(null);
  const [formData, setFormData] = useState<Partial<GiftCard>>({
    code: '',
    initialBalance: 0,
    currentBalance: 0,
    expiryDate: new Date(),
    status: 'active'
  });

  const cards = useLiveQuery(() => db.giftCards.toArray());

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCard?.id) {
        await db.giftCards.update(editingCard.id, formData as GiftCard);
        success('تم تحديث قسيمة الهدية بنجاح');
      } else {
        await db.giftCards.add({ ...formData, currentBalance: formData.initialBalance } as GiftCard);
        success('تم إصدار قسيمة الهدية بنجاح');
      }
      setIsModalOpen(false);
      setEditingCard(null);
      setFormData({ code: '', initialBalance: 0, currentBalance: 0, expiryDate: new Date(), status: 'active' });
    } catch (err) {
      console.error(err);
      showError('فشل في حفظ بيانات بطاقة الهدية');
    }
  };

  const handleEdit = (card: GiftCard) => {
    setEditingCard(card);
    setFormData(card);
    setIsModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setConfirmConfig({ isOpen: true, id });
  };

  const handleDelete = async () => {
    if (!confirmConfig) return;
    try {
      await db.giftCards.delete(confirmConfig.id);
      success('تم حذف بطاقة الهدايا بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل في حذف بطاقة الهدايا');
    }
    setConfirmConfig(null);
  };

  const getStatusBadge = (status: string, expiryDate: Date) => {
    if (new Date(expiryDate) < new Date() && status !== 'used') {
      return <span className="px-2.5 py-1 bg-red-100/80 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5"/> منتهية</span>;
    }
    switch (status) {
      case 'active': return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle className="w-3.5 h-3.5"/> نشطة</span>;
      case 'used': return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><AlertCircle className="w-3.5 h-3.5"/> مستخدمة</span>;
      case 'expired': return <span className="px-2.5 py-1 bg-red-100/80 text-red-800 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5"/> منتهية</span>;
      default: return null;
    }
  };

  return (
    <div className="p-6 min-h-full bg-gradient-to-tr from-sky-50/60 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 flex items-center gap-2">
            <Gift className="w-6 h-6 text-indigo-600 animate-bounce" />
            بطاقات الهدايا والقسائم
          </h1>
          <p className="text-gray-500 mt-1">إصدار وإدارة بطاقات الهدايا مسبقة الدفع وقسائم المبيعات والخصومات</p>
        </div>
        <button
          onClick={() => {
            setEditingCard(null);
            setFormData({ code: '', initialBalance: 0, currentBalance: 0, expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), status: 'active' });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-indigo-700 shadow-md transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          إصدار بطاقة جديدة
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm border border-indigo-100/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-indigo-100/40">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600">الكود</th>
                <th className="p-4 text-sm font-semibold text-gray-600">الرصيد الأساسي</th>
                <th className="p-4 text-sm font-semibold text-gray-600">الرصيد المتبقي</th>
                <th className="p-4 text-sm font-semibold text-gray-600">تاريخ الانتهاء</th>
                <th className="p-4 text-sm font-semibold text-gray-600">الحالة</th>
                <th className="p-4 text-sm font-semibold text-gray-600">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cards?.map((card) => (
                <tr key={card.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-mono font-bold text-indigo-900 tracking-wider text-sm">{card.code}</td>
                  <td className="p-4 text-gray-600 font-mono">{card.initialBalance.toLocaleString()}</td>
                  <td className="p-4 font-bold text-indigo-600 font-mono">{card.currentBalance.toLocaleString()}</td>
                  <td className="p-4 text-gray-600 font-mono">{new Date(card.expiryDate).toLocaleDateString('ar-SA')}</td>
                  <td className="p-4">{getStatusBadge(card.status, card.expiryDate)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(card)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-all">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => card.id && confirmDelete(card.id)} className="p-1 text-red-600 hover:bg-red-50 rounded transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {cards?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Gift className="w-12 h-12 text-gray-300 animate-pulse" />
                      <p>لا توجد بطاقات هدايا مسجلة حالياً</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl border border-indigo-100/30">
            <h2 className="text-xl font-bold mb-4 text-gray-900 border-b border-gray-100 pb-2">{editingCard ? 'تعديل البطاقة' : 'إصدار بطاقة جديدة'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كود البطاقة</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-center tracking-widest text-lg font-bold bg-slate-50"
                    placeholder="XXXX-XXXX-XXXX"
                  />
                  {!editingCard && (
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 border border-indigo-200 transition-all font-semibold whitespace-nowrap"
                    >
                      توليد تلقائي
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الرصيد الابتدائي</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData({ ...formData, initialBalance: Number(e.target.value) })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  disabled={!!editingCard}
                />
              </div>
              {editingCard && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الرصيد المتبقي الحالي</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max={formData.initialBalance}
                    value={formData.currentBalance}
                    onChange={(e) => setFormData({ ...formData, currentBalance: Number(e.target.value) })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white font-bold text-indigo-600"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
                <input
                  type="date"
                  required
                  value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, expiryDate: new Date(e.target.value) })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
              {editingCard && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="active">نشطة</option>
                    <option value="used">مستخدمة</option>
                    <option value="expired">منتهية</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-6 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow"
                >
                  حفظ البطاقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title="حذف بطاقة الهدايا"
          message="هل أنت متأكد من حذف بطاقة الهدايا هذه نهائياً؟ لن يستطيع العميل استخدامها لشراء السلع أو سداد الفواتير بعد الحذف."
          onConfirm={handleDelete}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
}
