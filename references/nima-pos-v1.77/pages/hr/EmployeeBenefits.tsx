import React, { useState } from 'react';
import { HeartHandshake, Plus, Search, Edit, Trash2, ShieldPlus, Save, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { EmployeeBenefit } from '../../types';
import ConfirmModal from '../../components/ui/ConfirmModal';

const EmployeeBenefits: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Partial<EmployeeBenefit> | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [benefitToDeleteId, setBenefitToDeleteId] = useState<number | null>(null);

  const benefits = useLiveQuery(() => db.employeeBenefits.toArray());

  const filteredBenefits = benefits?.filter(benefit =>
    benefit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    benefit.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

    const users = useLiveQuery(() => db.users.where('isActive').equals(1).toArray());

    const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBenefit?.name || !editingBenefit?.type) return;

    const benefitData: any = {
      name: editingBenefit.name,
      type: editingBenefit.type as any,
      description: editingBenefit.description,
      eligibilityRules: editingBenefit.eligibilityRules || '',
      costToCompany: Number(editingBenefit.costToCompany) || 0,
      costToEmployee: Number(editingBenefit.costToEmployee) || 0,
      monthlyCost: Number(editingBenefit.costToCompany) || 0,
      employeeIds: editingBenefit.employeeIds || [],
    };

    if (editingBenefit.id) {
      await db.employeeBenefits.update(editingBenefit.id, benefitData);
    } else {
      await db.employeeBenefits.add(benefitData);
    }

    setIsModalOpen(false);
    setEditingBenefit(null);
  };

  const handleDeleteClick = (id: number) => {
    setBenefitToDeleteId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (benefitToDeleteId) {
      await db.employeeBenefits.delete(benefitToDeleteId);
      setBenefitToDeleteId(null);
    }
    setIsDeleteConfirmOpen(false);
  };

  const openModal = (benefit?: EmployeeBenefit) => {
    if (benefit) {
      setEditingBenefit(benefit);
    } else {
      setEditingBenefit({
        name: '',
        type: 'health',
        description: '',
        eligibilityRules: '',
        costToCompany: 0,
        costToEmployee: 0
      });
    }
    setIsModalOpen(true);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'health': return 'تأمين صحي';
      case 'financial': return 'مالية';
      case 'time_off': return 'إجازات';
      case 'other': return 'أخرى';
      default: return type;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <HeartHandshake className="w-8 h-8 text-indigo-600" />
            المزايا والبدلات
          </h1>
          <p className="text-slate-500 mt-1">إدارة مزايا الموظفين، التأمين الطبي، والبدلات</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          إضافة ميزة جديدة
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث في المزايا والبدلات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBenefits?.map(benefit => (
          <div key={benefit.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <ShieldPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{benefit.name}</h3>
                  <p className="text-xs text-slate-500">{getTypeLabel(benefit.type)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => openModal(benefit)}
                  className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => benefit.id && handleDeleteClick(benefit.id)}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {benefit.description && (
              <p className="text-sm text-slate-600 mb-4">{benefit.description}</p>
            )}

            <div className="space-y-2 mb-4 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">تكلفة الشركة (شهرياً)</span>
                <span className="font-medium text-slate-700">{benefit.costToCompany} ريال</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">تكلفة الموظف (شهرياً)</span>
                <span className="font-medium text-slate-700">{benefit.costToEmployee} ريال</span>
              </div>
              {benefit.eligibilityRules && (
                <div className="mt-3 pt-3 border-t border-slate-50">
                  <span className="block text-xs text-slate-500 mb-1">شروط الاستحقاق:</span>
                  <span className="text-sm text-slate-700">{benefit.eligibilityRules}</span>
                </div>
              )}
            </div>
            <button 
              onClick={() => openModal(benefit)}
              className="w-full py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              تعديل التفاصيل
            </button>
          </div>
        ))}
        
        {filteredBenefits?.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-100">
            <HeartHandshake className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            لا توجد مزايا مطابقة للبحث
          </div>
        )}
      </div>

      {isModalOpen && editingBenefit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingBenefit.id ? 'تعديل الميزة' : 'إضافة ميزة جديدة'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="benefit-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">اسم الميزة *</label>
                  <input
                    type="text"
                    required
                    value={editingBenefit.name || ''}
                    onChange={e => setEditingBenefit({...editingBenefit, name: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">النوع *</label>
                  <select
                    required
                    value={editingBenefit.type || 'health'}
                    onChange={e => setEditingBenefit({...editingBenefit, type: e.target.value as any})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="health">تأمين صحي</option>
                    <option value="financial">مالية</option>
                    <option value="time_off">إجازات</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الوصف</label>
                  <textarea
                    rows={2}
                    value={editingBenefit.description || ''}
                    onChange={e => setEditingBenefit({...editingBenefit, description: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">شروط الاستحقاق</label>
                  <textarea
                    rows={2}
                    value={editingBenefit.eligibilityRules || ''}
                    onChange={e => setEditingBenefit({...editingBenefit, eligibilityRules: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                    placeholder="مثال: بعد اجتياز فترة التجربة"
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">تكلفة الشركة</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingBenefit.costToCompany || ''}
                      onChange={e => setEditingBenefit({...editingBenefit, costToCompany: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">تكلفة الموظف</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingBenefit.costToEmployee || ''}
                      onChange={e => setEditingBenefit({...editingBenefit, costToEmployee: Number(e.target.value)})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">الموظفون المشمولون</label>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50">
                    {users?.map(user => (
                        <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                          <input 
                            type="checkbox" 
                            checked={editingBenefit.employeeIds?.includes(user.id!) || false}
                            onChange={(e) => {
                                const currentIds = editingBenefit.employeeIds || [];
                                if (e.target.checked) {
                                    setEditingBenefit({...editingBenefit, employeeIds: [...currentIds, user.id!]});
                                } else {
                                    setEditingBenefit({...editingBenefit, employeeIds: currentIds.filter(id => id !== user.id)});
                                }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-slate-700">{user.name}</span>
                          <span className="text-xs text-slate-500 mr-auto">{user.role}</span>
                        </label>
                    ))}
                    {(!users || users.length === 0) && (
                        <div className="text-center text-sm text-slate-500 py-2">لا يوجد موظفين نشطين</div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2 px-1">
                      <span className="text-xs text-slate-500">تم اختيار {editingBenefit.employeeIds?.length || 0} موظف</span>
                      <button 
                        type="button" 
                        onClick={() => {
                            if (editingBenefit.employeeIds?.length === users?.length) {
                                setEditingBenefit({...editingBenefit, employeeIds: []});
                            } else {
                                setEditingBenefit({...editingBenefit, employeeIds: users?.map(u => u.id!) || []});
                            }
                        }}
                        className="text-xs text-indigo-600 font-medium hover:underline"
                      >
                          {editingBenefit.employeeIds?.length === users?.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                      </button>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-medium"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="benefit-form"
                className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors font-medium flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={executeDelete}
        title="حذف الميزة"
        message="هل أنت متأكد من رغبتك في حذف هذه الميزة والبدل المخصص للموظفين؟ لا يمكن التراجع عن هذا الإجراء."
      />
    </div>
  );
};

export default EmployeeBenefits;
