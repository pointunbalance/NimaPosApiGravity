import React from 'react';
import { X, FileSignature, Plus, Trash2, Save, FileText, Copy } from 'lucide-react';
import { format } from 'date-fns';

const EGYPTIAN_LAW_TEMPLATES = [
  {
    id: 'emp_fixed',
    title: 'عقد عمل محدد المدة',
    type: 'employee',
    clauses: [
      { title: 'البند الأول: التمهيد', content: 'يعتبر التمهيد السابق جزءاً لا يتجزأ من هذا العقد ومتمماً ومكملاً له.' },
      { title: 'البند الثاني: الوظيفة ومكان العمل', content: 'يعمل الطرف الثاني لدى الطرف الأول بوظيفة [...] ويحق للطرف الأول تكليفه بأي عمل آخر يتفق مع مؤهلاته، ويكون مقر عمله في محافظة [...].' },
      { title: 'البند الثالث: مدة العقد', content: 'مدة هذا العقد سنة واحدة تبدأ من تاريخ استلام العمل وتنتهي في [...]، ويجوز تجديده لمدة أو مدد أخرى باتفاق الطرفين.' },
      { title: 'البند الرابع: الأجر', content: 'يتقاضى الطرف الثاني أجراً شهرياً شاملاً قدره [...] جنيهاً مصرياً، يصرف في نهاية كل شهر ميلادي.' },
      { title: 'البند الخامس: الإجازات', content: 'يستحق الطرف الثاني إجازة سنوية مدفوعة الأجر طبقاً لأحكام قانون العمل المصري رقم 12 لسنة 2003.' },
      { title: 'البند السادس: القانون الواجب التطبيق', content: 'يخضع هذا العقد لأحكام قانون العمل المصري رقم 12 لسنة 2003 وتعديلاته، وتختص المحاكم المصرية بنظر أي نزاع ينشأ عن تفسير أو تنفيذ هذا العقد.' }
    ]
  },
  {
    id: 'supply_goods',
    title: 'عقد توريد بضائع',
    type: 'supplier',
    clauses: [
      { title: 'البند الأول: التمهيد', content: 'يلتزم الطرف الثاني بتوريد [...] للطرف الأول وفقاً للمواصفات والكميات المتفق عليها في الملحق المرفق بهذا العقد.' },
      { title: 'البند الثاني: مدة ومكان التوريد', content: 'يلتزم الطرف الثاني بتسليم البضائع في مقر الطرف الأول في موعد أقصاه [...].' },
      { title: 'البند الثالث: القيمة وطريقة الدفع', content: 'إجمالي قيمة العقد [...] جنيهاً مصرياً، تدفع على دفعات النحو التالي: دفعة مقدمة بنسبة [...] والباقي عند الاستلام والفحص.' },
      { title: 'البند الرابع: غرامة التأخير', content: 'في حالة تأخر الطرف الثاني عن التوريد في الموعد المحدد، تطبق غرامة تأخير قدرها [...] عن كل يوم تأخير، بحد أقصى 10% من قيمة العقد.' },
      { title: 'البند الخامس: الاختصاص القضائي', content: 'يخضع هذا العقد لأحكام القانون المدني وقانون التجارة المصري، وتختص محاكم القاهرة بنظر أي نزاع ينشأ عن هذا العقد.' }
    ]
  },
  {
    id: 'service_agreement',
    title: 'عقد تقديم خدمات استشارية',
    type: 'other',
    clauses: [
      { title: 'البند الأول: موضوع العقد', content: 'يقوم الطرف الثاني بتقديم خدمات استشارية في مجال [...] للطرف الأول وفقاً لنطاق العمل المتفق عليه.' },
      { title: 'البند الثاني: التزامات الطرف الثاني', content: 'يلتزم الطرف الثاني ببذل العناية اللازمة لتقديم الخدمات بأعلى جودة ووفقاً للأصول المهنية المتعارف عليها.' },
      { title: 'البند الثالث: الأتعاب', content: 'يلتزم الطرف الأول بدفع أتعاب إجمالية قدرها [...] جنيهاً مصرياً للطرف الثاني مقابل الخدمات المقدمة.' },
      { title: 'البند الرابع: السرية', content: 'يلتزم الطرف الثاني بالحفاظ على سرية كافة المعلومات والبيانات الخاصة بالطرف الأول والتي يطلع عليها بمناسبة تنفيذ هذا العقد.' },
      { title: 'البند الخامس: القانون الحاكم', content: 'يخضع هذا العقد لأحكام القانون المصري، وتختص المحاكم المصرية بالفصل في أي نزاع.' }
    ]
  }
];

interface ContractModalProps {
  isOpen: boolean;
  editingContract: any | null;
  setEditingContract: (contract: any) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({
  isOpen,
  editingContract,
  setEditingContract,
  onClose,
  onSave,
}) => {
  if (!isOpen || !editingContract) return null;

  const loadTemplate = (templateId: string) => {
    if (!templateId) return;
    const template = EGYPTIAN_LAW_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setEditingContract({
        ...editingContract,
        title: template.title,
        type: template.type as any,
        clauses: JSON.parse(JSON.stringify(template.clauses))
      });
    }
  };

  const addClause = () => {
    const newClauses = [...(editingContract.clauses || []), { title: '', content: '' }];
    setEditingContract({ ...editingContract, clauses: newClauses });
  };

  const removeClause = (index: number) => {
    if (editingContract.clauses) {
      const newClauses = [...editingContract.clauses];
      newClauses.splice(index, 1);
      setEditingContract({ ...editingContract, clauses: newClauses });
    }
  };

  const updateClause = (index: number, field: 'title' | 'content', value: string) => {
    if (editingContract.clauses) {
      const newClauses = [...editingContract.clauses];
      newClauses[index] = { ...newClauses[index], [field]: value };
      setEditingContract({ ...editingContract, clauses: newClauses });
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-right" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-row-reverse">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 flex-row-reverse">
            <FileSignature className="w-6 h-6 text-indigo-600" />
            {editingContract.id ? 'تعديل العقد' : 'إضافة عقد جديد'}
          </h2>
          <div className="flex items-center gap-4 flex-row-reverse">
            {!editingContract.id && (
              <div className="flex items-center gap-2 flex-row-reverse">
                <Copy className="w-4 h-4 text-slate-400" />
                <select
                  onChange={(e) => loadTemplate(e.target.value)}
                  className="text-sm border-none bg-transparent text-indigo-600 font-medium focus:ring-0 cursor-pointer outline-none text-right"
                >
                  <option value="">استيراد نموذج عقد (القانون المصري)...</option>
                  {EGYPTIAN_LAW_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="contract-form" onSubmit={onSave} className="space-y-8">
            {/* Basic Info Section */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 flex-row-reverse">
                <FileText className="w-5 h-5 text-slate-400" />
                البيانات الأساسية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 text-right">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">عنوان العقد *</label>
                  <input
                    required
                    type="text"
                    value={editingContract.title || ''}
                    onChange={e => setEditingContract({ ...editingContract, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-right"
                    placeholder="مثال: عقد توريد معدات"
                  />
                </div>
                
                <div className="text-right">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">نوع العقد *</label>
                  <select
                    value={editingContract.type || 'supplier'}
                    onChange={e => setEditingContract({ ...editingContract, type: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-right"
                  >
                    <option value="supplier">مورد</option>
                    <option value="customer">عميل</option>
                    <option value="employee">موظف</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div className="text-right">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">اسم الطرف الثاني *</label>
                  <input
                    required
                    type="text"
                    value={editingContract.partyName || ''}
                    onChange={e => setEditingContract({ ...editingContract, partyName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-right"
                    placeholder="اسم الشركة أو الشخص (مثال: أندري، ميكولا، تاراس)"
                  />
                </div>

                <div className="text-right">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">تاريخ البدء *</label>
                  <input
                    required
                    type="date"
                    value={editingContract.startDate ? format(new Date(editingContract.startDate), 'yyyy-MM-dd') : ''}
                    onChange={e => setEditingContract({ ...editingContract, startDate: new Date(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-right"
                  />
                </div>

                <div className="text-right">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">تاريخ الانتهاء *</label>
                  <input
                    required
                    type="date"
                    value={editingContract.endDate ? format(new Date(editingContract.endDate), 'yyyy-MM-dd') : ''}
                    onChange={e => setEditingContract({ ...editingContract, endDate: new Date(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-right"
                  />
                </div>

                <div className="text-right">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">قيمة العقد (ر.س)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingContract.value || ''}
                    onChange={e => setEditingContract({ ...editingContract, value: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-right"
                    placeholder="0"
                  />
                </div>

                <div className="text-right">
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">الحالة *</label>
                  <select
                    value={editingContract.status || 'active'}
                    onChange={e => setEditingContract({ ...editingContract, status: e.target.value as any })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-right"
                  >
                    <option value="active">ساري</option>
                    <option value="pending">قيد الانتظار</option>
                    <option value="expired">منتهي</option>
                    <option value="terminated">ملغى</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Clauses Section */}
            <div className="pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-4 flex-row-reverse">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 flex-row-reverse">
                  <FileSignature className="w-5 h-5 text-slate-400" />
                  بنود العقد
                </h3>
                <button
                  type="button"
                  onClick={addClause}
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex-row-reverse"
                >
                  <Plus size={16} />
                  إضافة بند جديد
                </button>
              </div>
              
              <div className="space-y-4">
                {editingContract.clauses?.length === 0 && (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                    <p className="text-slate-500">لا توجد بنود مضافة لهذا العقد.</p>
                    <p className="text-sm text-slate-400 mt-1">يمكنك استيراد نموذج جاهز من الأعلى أو إضافة بنود يدوياً.</p>
                  </div>
                )}
                {editingContract.clauses?.map((clause: any, index: number) => (
                  <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-4 items-start group flex-row-reverse text-right">
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={clause.title}
                        onChange={(e) => updateClause(index, 'title', e.target.value)}
                        placeholder="عنوان البند (مثال: البند الأول: التمهيد)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 text-right"
                      />
                      <textarea
                        value={clause.content}
                        onChange={(e) => updateClause(index, 'content', e.target.value)}
                        placeholder="نص البند وتفاصيله..."
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-700 leading-relaxed text-right"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeClause(index)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="حذف البند"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes Section */}
            <div className="pt-6 border-t border-slate-100 text-right">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">ملاحظات إضافية</label>
              <textarea
                value={editingContract.notes || ''}
                onChange={e => setEditingContract({ ...editingContract, notes: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none text-right"
                placeholder="أي ملاحظات إضافية حول العقد..."
                rows={2}
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 flex-row-reverse">
          <button
            type="submit"
            form="contract-form"
            className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors font-bold flex items-center gap-2 shadow-sm"
          >
            <Save size={20} />
            حفظ العقد
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl transition-colors font-bold"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
export default ContractModal;
