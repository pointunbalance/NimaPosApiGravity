import React from 'react';
import { Plus, XCircle, Save } from 'lucide-react';
import { Customer } from '../../types';

interface InstallmentPlanModalProps {
  showNewModal: boolean;
  setShowNewModal: (show: boolean) => void;
  formData: any;
  setFormData: (data: any) => void;
  customers: Customer[];
  calculatedSchedule: any;
  currency: string;
  onCreatePlan: (e: React.FormEvent) => void;
}

const InstallmentPlanModal: React.FC<InstallmentPlanModalProps> = ({
  showNewModal,
  setShowNewModal,
  formData,
  setFormData,
  customers,
  calculatedSchedule,
  currency,
  onCreatePlan,
}) => {
  if (!showNewModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Plus className="w-6 h-6 text-brand-500" />
            إنشاء خطة أقساط جديدة
          </h2>
          <button
            onClick={() => setShowNewModal(false)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="planForm" onSubmit={onCreatePlan} className="space-y-8">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">
                المعلومات الأساسية
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">العميل *</label>
                  <select
                    required
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="">اختر العميل...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">
                    تاريخ استحقاق أول قسط *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">
                    إجمالي المبلغ (قبل الفوائد) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      onFocus={(e) => e.target.select()}
                      required
                      min="1"
                      step="0.01"
                      value={formData.principalAmount}
                      onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      {currency}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">الدفعة المقدمة</label>
                  <div className="relative">
                    <input
                      type="number"
                      onFocus={(e) => e.target.select()}
                      min="0"
                      step="0.01"
                      value={formData.downPayment}
                      onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      {currency}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration & Interest */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">
                المدة والفوائد
              </h3>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700">
                  مدة التقسيط (بالأشهر) *
                </label>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, installmentCount: '6' })}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                      formData.installmentCount === '6'
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    6 أشهر
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, installmentCount: '12' })}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                      formData.installmentCount === '12'
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    سنة (12)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, installmentCount: '24' })}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                      formData.installmentCount === '24'
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    سنتين (24)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, installmentCount: '36' })}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                      formData.installmentCount === '36'
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    3 سنوات (36)
                  </button>
                  <div className="flex-1 min-w-[150px]">
                    <input
                      type="number"
                      onFocus={(e) => e.target.select()}
                      required
                      min="1"
                      max="120"
                      value={formData.installmentCount}
                      onChange={(e) => setFormData({ ...formData, installmentCount: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="مخصص..."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">نوع الفائدة</label>
                  <select
                    value={formData.interestType}
                    onChange={(e) => setFormData({ ...formData, interestType: e.target.value as any })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="none">بدون فوائد</option>
                    <option value="fixed">فائدة ثابتة (سنوية)</option>
                    <option value="declining">فائدة متناقصة (سنوية)</option>
                  </select>
                </div>

                {formData.interestType !== 'none' && (
                  <div className="space-y-2 animate-in fade-in">
                    <label className="block text-sm font-bold text-slate-700">
                      نسبة الفائدة السنوية *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        onFocus={(e) => e.target.select()}
                        required
                        min="0"
                        step="0.1"
                        value={formData.interestRate}
                        onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        %
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Late Fees */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">
                غرامات التأخير
              </h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.lateFeeEnabled}
                    onChange={(e) => setFormData({ ...formData, lateFeeEnabled: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                </div>
                <span className="font-bold text-slate-700">تفعيل غرامات التأخير</span>
              </label>

              {formData.lateFeeEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-amber-50 rounded-xl border border-amber-100 animate-in fade-in">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">نوع الغرامة</label>
                    <select
                      value={formData.lateFeeType}
                      onChange={(e) => setFormData({ ...formData, lateFeeType: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                    >
                      <option value="fixed">مبلغ ثابت</option>
                      <option value="percentage">نسبة من القسط</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">قيمة الغرامة</label>
                    <div className="relative">
                      <input
                        type="number"
                        onFocus={(e) => e.target.select()}
                        required
                        min="0"
                        step="0.1"
                        value={formData.lateFeeAmount}
                        onChange={(e) => setFormData({ ...formData, lateFeeAmount: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                      />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        {formData.lateFeeType === 'fixed' ? currency : '%'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      فترة السماح (أيام)
                    </label>
                    <input
                      type="number"
                      onFocus={(e) => e.target.select()}
                      required
                      min="0"
                      value={formData.gracePeriodDays}
                      onChange={(e) => setFormData({ ...formData, gracePeriodDays: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Summary Preview */}
            <div className="bg-slate-800 rounded-xl p-6 text-white grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-slate-400 text-sm mb-1">المبلغ الممول</div>
                <div className="text-xl font-bold">
                  {(calculatedSchedule?.financedAmount || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">إجمالي الفوائد</div>
                <div className="text-xl font-bold text-amber-400">
                  {(calculatedSchedule?.totalInterest || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">إجمالي المستحق</div>
                <div className="text-xl font-bold text-emerald-400">
                  {(calculatedSchedule?.totalAmount || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-slate-400 text-sm mb-1">القسط الشهري التقريبي</div>
                <div className="text-xl font-bold text-blue-400">
                  {(
                    (calculatedSchedule?.totalAmount || 0) / (parseInt(formData?.installmentCount) || 1)
                  ).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">ملاحظات</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none h-20"
                placeholder="أي تفاصيل إضافية..."
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setShowNewModal(false)}
            className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            form="planForm"
            className="px-6 py-2.5 bg-brand-600 text-white font-bold hover:bg-brand-700 rounded-xl transition-colors flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            حفظ وإنشاء الخطة
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallmentPlanModal;
