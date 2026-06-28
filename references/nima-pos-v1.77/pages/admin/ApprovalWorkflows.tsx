import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Settings, Plus, Search, CheckCircle, Clock, XCircle, ArrowRight, Edit, Trash2, X, Save, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { ApprovalWorkflow } from '../../types';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';

const PREDEFINED_TYPES = [
  { value: 'purchase_order', label: 'طلب شراء (Purchase Order)' },
  { value: 'expense_claim', label: 'مطالبة مصروفات (Expense Claim)' },
  { value: 'leave_request', label: 'طلب إجازة (Leave Request)' },
  { value: 'discount_approval', label: 'اعتماد خصم (Discount Approval)' },
  { value: 'custom', label: 'مخصص (Custom)' }
];

const PREDEFINED_ROLES = [
  'المدير المباشر',
  'مدير القسم',
  'المدير المالي',
  'مدير الموارد البشرية',
  'المدير العام',
  'الرئيس التنفيذي'
];

export const ApprovalWorkflows: React.FC = () => {
  const { success, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Partial<ApprovalWorkflow> | null>(null);
  const [newStep, setNewStep] = useState('');
  const [isCustomType, setIsCustomType] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; id: number } | null>(null);

  const workflows = useLiveQuery(() => db.approvalWorkflows?.toArray() || []) || [];

  const filteredWorkflows = workflows.filter(w => 
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkflow?.name || !editingWorkflow?.type || !editingWorkflow.steps || editingWorkflow.steps.length === 0) {
      showError('يرجى ملء جميع الحقول الإلزامية وإضافة خطوة اعتماد واحدة على الأقل');
      return;
    }

    try {
      const workflowData = {
        name: editingWorkflow.name,
        type: editingWorkflow.type,
        description: editingWorkflow.description || '',
        steps: editingWorkflow.steps,
        conditions: editingWorkflow.conditions || [],
        status: editingWorkflow.status || 'active',
      };

      if (editingWorkflow.id) {
        await db.approvalWorkflows?.update(editingWorkflow.id, workflowData);
        success('تم تحديث مسار الاعتماد بنجاح');
      } else {
        await db.approvalWorkflows?.add(workflowData as ApprovalWorkflow);
        success('تم إضافة مسار الاعتماد بنجاح');
      }

      setIsModalOpen(false);
      setEditingWorkflow(null);
    } catch (err) {
      console.error(err);
      showError('حدث خطأ أثناء حفظ مسار الاعتماد');
    }
  };

  const handleDelete = async () => {
    if (!confirmConfig) return;
    try {
      await db.approvalWorkflows?.delete(confirmConfig.id);
      success('تم حذف مسار الاعتماد بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل في حذف مسار الاعتماد');
    }
    setConfirmConfig(null);
  };

  const openModal = (workflow?: ApprovalWorkflow) => {
    if (workflow) {
      setEditingWorkflow({ ...workflow });
      setIsCustomType(!PREDEFINED_TYPES.find(t => t.value === workflow.type));
    } else {
      setEditingWorkflow({
        name: '',
        type: PREDEFINED_TYPES[0].value,
        description: '',
        steps: [],
        conditions: [],
        status: 'active'
      });
      setIsCustomType(false);
    }
    setNewStep('');
    setIsModalOpen(true);
  };

  const addStep = () => {
    if (newStep.trim() && editingWorkflow) {
      setEditingWorkflow({
        ...editingWorkflow,
        steps: [...(editingWorkflow.steps || []), newStep.trim()]
      });
      setNewStep('');
    }
  };

  const removeStep = (index: number) => {
    if (editingWorkflow && editingWorkflow.steps) {
      const updatedSteps = [...editingWorkflow.steps];
      updatedSteps.splice(index, 1);
      setEditingWorkflow({
        ...editingWorkflow,
        steps: updatedSteps
      });
    }
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (editingWorkflow && editingWorkflow.steps) {
      const updatedSteps = [...editingWorkflow.steps];
      if (direction === 'up' && index > 0) {
        [updatedSteps[index - 1], updatedSteps[index]] = [updatedSteps[index], updatedSteps[index - 1]];
      } else if (direction === 'down' && index < updatedSteps.length - 1) {
        [updatedSteps[index + 1], updatedSteps[index]] = [updatedSteps[index], updatedSteps[index + 1]];
      }
      setEditingWorkflow({
        ...editingWorkflow,
        steps: updatedSteps
      });
    }
  };

  const addCondition = () => {
    if (editingWorkflow) {
      setEditingWorkflow({
        ...editingWorkflow,
        conditions: [...(editingWorkflow.conditions || []), { field: '', operator: '==', value: '' }]
      });
    }
  };

  const updateCondition = (index: number, key: string, value: string) => {
    if (editingWorkflow && editingWorkflow.conditions) {
      const updatedConditions = [...editingWorkflow.conditions];
      updatedConditions[index] = { ...updatedConditions[index], [key]: value };
      setEditingWorkflow({
        ...editingWorkflow,
        conditions: updatedConditions
      });
    }
  };

  const removeCondition = (index: number) => {
    if (editingWorkflow && editingWorkflow.conditions) {
      const updatedConditions = [...editingWorkflow.conditions];
      updatedConditions.splice(index, 1);
      setEditingWorkflow({
        ...editingWorkflow,
        conditions: updatedConditions
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-full bg-gradient-to-tr from-sky-50/60 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-950 flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-xs border border-indigo-100">
              <Settings className="w-8 h-8 animate-spin-slow" />
            </div>
            مسارات الاعتماد (Approval Workflows)
          </h1>
          <p className="text-slate-500 mt-2 font-medium">إدارة وتخصيص مسارات الموافقة للعمليات المالية والإدارية المختلفة</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 font-bold shadow-md"
        >
          <Plus className="w-5 h-5" />
          إضافة مسار جديد
        </button>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/30">
          <div className="relative md:w-1/3">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في مسارات الاعتماد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
              <tr className="text-sm">
                <th className="p-4 font-semibold">اسم المسار</th>
                <th className="p-4 font-semibold">النوع</th>
                <th className="p-4 font-semibold">الشروط</th>
                <th className="p-4 font-semibold">خطوات الاعتماد</th>
                <th className="p-4 font-semibold">الحالة</th>
                <th className="p-4 font-semibold">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredWorkflows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Settings className="w-12 h-12 text-gray-300 animate-pulse" />
                      <p>لا توجد مسارات اعتماد مطابقة أو مضافة حالياً.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWorkflows.map(workflow => (
                  <tr key={workflow.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{workflow.name}</div>
                      {workflow.description && <div className="text-xs text-slate-500 mt-1">{workflow.description}</div>}
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {PREDEFINED_TYPES.find(t => t.value === workflow.type)?.label || workflow.type}
                    </td>
                    <td className="p-4">
                      {workflow.conditions && workflow.conditions.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {workflow.conditions.map((cond, idx) => (
                            <span key={idx} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-100 w-fit font-mono font-medium">
                              {cond.field} {cond.operator} {cond.value}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">بدون شروط (دائماً)</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        {workflow.steps.map((step: string, index: number) => (
                          <React.Fragment key={index}>
                            <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-xs font-bold text-slate-700">{step}</span>
                            {index < workflow.steps.length - 1 && <ArrowRight className="w-4 h-4 text-indigo-500" />}
                          </React.Fragment>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        workflow.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {workflow.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openModal(workflow)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => workflow.id && setConfirmConfig({ isOpen: true, id: workflow.id })}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && editingWorkflow && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Settings className="w-6 h-6 text-indigo-600" />
                {editingWorkflow.id ? 'تعديل مسار الاعتماد' : 'إضافة مسار جديد'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="workflow-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">اسم المسار *</label>
                    <input
                      type="text"
                      required
                      value={editingWorkflow.name || ''}
                      onChange={e => setEditingWorkflow({...editingWorkflow, name: e.target.value})}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="مثال: اعتماد طلبات الشراء الكبيرة"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">نوع العملية *</label>
                    <select
                      value={isCustomType ? 'custom' : (editingWorkflow.type || PREDEFINED_TYPES[0].value)}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setIsCustomType(true);
                          setEditingWorkflow({...editingWorkflow, type: ''});
                        } else {
                          setIsCustomType(false);
                          setEditingWorkflow({...editingWorkflow, type: val});
                        }
                      }}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all mb-2 bg-white"
                    >
                      {PREDEFINED_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    {isCustomType && (
                      <input
                        type="text"
                        required
                        value={editingWorkflow.type || ''}
                        onChange={e => setEditingWorkflow({...editingWorkflow, type: e.target.value})}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="أدخل نوع العملية المخصص"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">وصف المسار</label>
                  <textarea
                    value={editingWorkflow.description || ''}
                    onChange={e => setEditingWorkflow({...editingWorkflow, description: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                    placeholder="وصف مختصر لمتى يتم استخدام هذا المسار..."
                    rows={2}
                  />
                </div>

                {/* Conditions Section */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200/60">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Filter className="w-4 h-4 text-indigo-500 animate-pulse" />
                      شروط تطبيق المسار (اختياري)
                    </label>
                    <button
                      type="button"
                      onClick={addCondition}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> إضافة شرط
                    </button>
                  </div>
                  
                  {editingWorkflow.conditions && editingWorkflow.conditions.length > 0 ? (
                    <div className="space-y-3">
                      {editingWorkflow.conditions.map((cond, index) => (
                        <div key={index} className="flex flex-wrap md:flex-nowrap gap-2 items-center">
                          <input
                            type="text"
                            placeholder="الحقل (مثال: amount)"
                            value={cond.field}
                            onChange={(e) => updateCondition(index, 'field', e.target.value)}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-mono"
                          />
                          <select
                            value={cond.operator}
                            onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                            className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-mono"
                          >
                            <option value="==">يساوي (==)</option>
                            <option value="!=">لا يساوي (!=)</option>
                            <option value=">">أكبر من (&gt;)</option>
                            <option value=">=">أكبر أو يساوي (&gt;=)</option>
                            <option value="<">أصغر من (&lt;)</option>
                            <option value="<=">أصغر أو يساوي (&lt;=)</option>
                          </select>
                          <input
                            type="text"
                            placeholder="القيمة (مثال: 5000)"
                            value={cond.value}
                            onChange={(e) => updateCondition(index, 'value', e.target.value)}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => removeCondition(index)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-2 font-medium">سيتم تطبيق هذا المسار دائماً لعدم وجود شروط.</p>
                  )}
                </div>

                {/* Steps Section */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">خطوات الاعتماد بالترتيب *</label>
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newStep}
                        onChange={(e) => setNewStep(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="أضف خطوة أو اختر من القائمة..."
                        list="roles-list"
                      />
                      <datalist id="roles-list">
                        {PREDEFINED_ROLES.map((role, idx) => (
                           <option key={idx} value={role} />
                        ))}
                      </datalist>
                    </div>
                    <button
                      type="button"
                      onClick={addStep}
                      disabled={!newStep.trim()}
                      className="px-5 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-xl hover:bg-indigo-100 transition-colors disabled:opacity-50 font-bold"
                    >
                      إضافة خطوة
                    </button>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 min-h-[120px]">
                    {!editingWorkflow.steps || editingWorkflow.steps.length === 0 ? (
                      <p className="text-center text-slate-500 text-sm py-6 font-medium">لم يتم إضافة خطوات بعد. أضف الخطوة الأولى لتبدأ.</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {editingWorkflow.steps.map((step: string, index: number) => (
                          <div key={index} className="flex items-center gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-xs group">
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => moveStep(index, 'up')}
                                disabled={index === 0}
                                className="text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveStep(index, 'down')}
                                disabled={index === (editingWorkflow.steps?.length || 0) - 1}
                                className="text-slate-400 hover:text-indigo-600 disabled:opacity-30"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                              {index + 1}
                            </div>
                            
                            <span className="text-sm font-bold text-slate-700 flex-1">{step}</span>
                            
                            <button
                              type="button"
                              onClick={() => removeStep(index)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                              title="حذف الخطوة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">الحالة</label>
                  <select
                    value={editingWorkflow.status || 'active'}
                    onChange={e => setEditingWorkflow({...editingWorkflow, status: e.target.value as 'active' | 'inactive'})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                  </select>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 font-semibold">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="workflow-form"
                disabled={!editingWorkflow.steps || editingWorkflow.steps.length === 0}
                className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                حفظ المسار
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title="حذف مسار الاعتماد والاعتمادات"
          message="هل أنت متأكد من حذف مسار الاعتماد هذا نهائياً من النظام؟ لن تتأثر الطلبات التي اعتمدت مسبقاً، ولكن لن يتسنى للنظام تطبيق هذا المسار على الطلبات اللاحقة."
          onConfirm={handleDelete}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default ApprovalWorkflows;
