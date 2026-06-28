import React from 'react';
import { Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { PricingRule } from '../../types';

interface PricingRulesListProps {
  rules: PricingRule[];
  currency?: string;
  onEdit: (rule: PricingRule) => void;
  onDelete: (id: number) => void;
}

const PricingRulesList: React.FC<PricingRulesListProps> = ({
  rules,
  currency,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">اسم القاعدة</th>
              <th className="p-4 font-semibold text-gray-600">من تكلفة</th>
              <th className="p-4 font-semibold text-gray-600">إلى تكلفة</th>
              <th className="p-4 font-semibold text-gray-600">هامش الربح (%)</th>
              <th className="p-4 font-semibold text-gray-600">الحالة</th>
              <th className="p-4 font-semibold text-gray-600 w-24">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rules.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  لا توجد قواعد تسعير مسجلة. أضف قاعدة جديدة لتبدأ.
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{rule.name}</td>
                  <td className="p-4 text-gray-600">{rule.minCost} {currency}</td>
                  <td className="p-4 text-gray-600">{rule.maxCost} {currency}</td>
                  <td className="p-4 text-indigo-600 font-bold">{rule.marginPercentage}%</td>
                  <td className="p-4">
                    {rule.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 size={14} /> نشط
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <XCircle size={14} /> غير نشط
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(rule)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => rule.id && onDelete(rule.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
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
    </div>
  );
};

export default PricingRulesList;
