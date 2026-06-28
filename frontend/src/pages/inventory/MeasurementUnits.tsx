import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MeasurementUnit } from '../../types';
import { Scale, Plus, Trash2, Edit2, ShieldAlert } from 'lucide-react';

export default function MeasurementUnits() {
  const units = useLiveQuery(() => db.measurementUnits.toArray()) || [];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<MeasurementUnit | null>(null);
  const [formData, setFormData] = useState<Partial<MeasurementUnit>>({
    name: '',
    symbol: '',
    baseUnit: 'قطعة',
    factor: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUnit && editingUnit.id) {
        await db.measurementUnits.update(editingUnit.id, formData);
    } else {
        await db.measurementUnits.add({
            ...formData,
            createdAt: new Date()
        } as MeasurementUnit);
    }
    setIsModalOpen(false);
    setEditingUnit(null);
    setFormData({ name: '', symbol: '', baseUnit: 'قطعة', factor: 1 });
  };

  const handleEdit = (u: MeasurementUnit) => {
      setEditingUnit(u);
      setFormData(u);
      setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
      if (confirm('هل أنت متأكد من حذف هذه الوحدة؟ إذا كانت مستخدمة في المنتجات قد يؤثر ذلك على طريقة العرض.')) {
          await db.measurementUnits.delete(id);
      }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Scale className="text-indigo-600" />
            إدارة الوحدات القياسية العالمية (Global UoM)
          </h1>
          <p className="text-slate-500 text-sm mt-1">إعداد الوحدات القياسية بشكل موحد لمنع الإدخالات الخاطئة ولمعاملات التحويل الدقيقة.</p>
        </div>
        <button
          onClick={() => {
            setEditingUnit(null);
            setFormData({ name: '', symbol: '', baseUnit: 'قطعة', factor: 1 });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
        >
          <Plus size={20} />
          <span>إضافة وحدة جديدة</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">اسم الوحدة</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">الرمز الخاص</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">الوحدة الأساسية</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">معامل التحويل (كم يحتوي من الأساسية؟)</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-600">إجراءات</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {units.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                            لا توجد وحدات مضافة بعد. قم بإضافة وحداتك القياسية لتسهيل عمل الموظفين.
                        </td>
                    </tr>
                ) : (
                    units.map(unit => (
                        <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <span className="font-bold text-slate-800">{unit.name}</span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded font-mono text-sm">
                                    {unit.symbol}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                                {unit.baseUnit}
                            </td>
                            <td className="px-6 py-4">
                                <span className="font-bold text-indigo-600">{unit.factor}</span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEdit(unit)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => unit.id && handleDelete(unit.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
          <ShieldAlert className="shrink-0" />
          <div className="text-sm">
              <strong className="block mb-1">لماذا هذه الصفحة مهمة؟</strong>
              <p>منعاً للأخطاء البشرية القاتلة عند إدخال معاملات تحويل خاطئة (مثل إدخال كرتونة بـ 120 بدل 12 قطعة مما يؤدي لكارثة في مخزون القيمة). هذه القاعدة البيانية تجعل الإدخال موحداً لجميع المنتجات بضغطة زر واحدة.</p>
          </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800">
                        {editingUnit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}
                    </h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <Plus size={24} className="rotate-45" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Form fields here */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">اسم الوحدة (عربي)</label>
                        <input
                            type="text"
                            required
                            placeholder="مثال: كرتونة"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">الرمز (إنجليزي أو كود)</label>
                        <input
                            type="text"
                            required
                            placeholder="مثال: CTN"
                            value={formData.symbol}
                            onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">الوحدة الأساسية المرجعية</label>
                            <input
                                type="text"
                                required
                                placeholder="مثال: قطعة"
                                value={formData.baseUnit}
                                onChange={(e) => setFormData({...formData, baseUnit: e.target.value})}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">كمية التحويل (متى تساوي الأساسية؟)</label>
                            <input
                                type="number"
                                required
                                min="0.01"
                                step="any"
                                value={formData.factor}
                                onChange={(e) => setFormData({...formData, factor: Number(e.target.value)})}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-5 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition shadow-sm"
                        >
                            حفظ الوحدة
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}
