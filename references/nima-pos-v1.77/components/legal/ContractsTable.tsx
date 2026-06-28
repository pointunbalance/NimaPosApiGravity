import React from 'react';
import { FileSignature, CheckCircle, Clock, AlertCircle, Copy, Edit, Trash2 } from 'lucide-react';
import { format, isBefore, addDays } from 'date-fns';
import { Contract } from '../../types';

interface ContractsTableProps {
  filteredContracts: Contract[];
  onCopyVersion: (contract: Contract) => void;
  onEdit: (contract: Contract) => void;
  onDelete: (id: number) => void;
}

export const ContractsTable: React.FC<ContractsTableProps> = ({
  filteredContracts,
  onCopyVersion,
  onEdit,
  onDelete,
}) => {
  const getStatusColor = (status: string, endDate: Date) => {
    if (status === 'expired' || isBefore(new Date(endDate), new Date())) {
      return 'bg-rose-100 text-rose-700 border-rose-200';
    }
    if (isBefore(new Date(endDate), addDays(new Date(), 30))) {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'terminated': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'pending': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusLabel = (status: string, endDate: Date) => {
    if (status === 'expired' || isBefore(new Date(endDate), new Date())) {
      return 'منتهي';
    }
    if (isBefore(new Date(endDate), addDays(new Date(), 30))) {
      return 'ينتهي قريباً';
    }
    switch (status) {
      case 'active': return 'ساري';
      case 'terminated': return 'ملغى';
      case 'pending': return 'قيد الانتظار';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'supplier': return 'مورد';
      case 'customer': return 'عميل';
      case 'employee': return 'موظف';
      case 'other': return 'أخرى';
      default: return type;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right font-medium">
        <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
          <tr>
            <th className="p-4 font-semibold text-sm">عنوان العقد</th>
            <th className="p-4 font-semibold text-sm">النوع</th>
            <th className="p-4 font-semibold text-sm">الطرف الثاني</th>
            <th className="p-4 font-semibold text-sm">تاريخ البدء</th>
            <th className="p-4 font-semibold text-sm">تاريخ الانتهاء</th>
            <th className="p-4 font-semibold text-sm">القيمة</th>
            <th className="p-4 font-semibold text-sm">الحالة</th>
            <th className="p-4 font-semibold text-sm">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredContracts.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-12 text-center text-slate-500">
                <FileSignature size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium text-slate-700 mb-1">لا توجد عقود</p>
                <p>لم يتم العثور على عقود مطابقة للبحث أو الفلاتر.</p>
              </td>
            </tr>
          ) : (
            filteredContracts.map(contract => (
              <tr key={contract.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <span className="font-bold text-slate-800">{contract.title}</span>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                    {getTypeLabel(contract.type)}
                  </span>
                </td>
                <td className="p-4 text-slate-700">{contract.partyName}</td>
                <td className="p-4 text-slate-600 text-sm">
                  {format(new Date(contract.startDate), 'yyyy-MM-dd')}
                </td>
                <td className="p-4 text-slate-600 text-sm font-medium">
                  {format(new Date(contract.endDate), 'yyyy-MM-dd')}
                </td>
                <td className="p-4 text-slate-700 font-bold">
                  {contract.value ? `${contract.value.toLocaleString()} ر.س` : '-'}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusColor(contract.status, contract.endDate)}`}>
                    {getStatusLabel(contract.status, contract.endDate) === 'ساري' && <CheckCircle className="w-3.5 h-3.5" />}
                    {getStatusLabel(contract.status, contract.endDate) === 'ينتهي قريباً' && <Clock className="w-3.5 h-3.5" />}
                    {getStatusLabel(contract.status, contract.endDate) === 'منتهي' && <AlertCircle className="w-3.5 h-3.5" />}
                    {getStatusLabel(contract.status, contract.endDate)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onCopyVersion(contract)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="إنشاء إصدار جديد"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => onEdit(contract)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => contract.id && onDelete(contract.id)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
  );
};
