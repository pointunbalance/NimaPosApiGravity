import React from 'react';
import { FileText, Download, ExternalLink, Edit, Trash2, FolderOpen, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { format, isBefore, addDays } from 'date-fns';
import { LegalDocument } from '../../types';

interface DocumentsTableProps {
  filteredDocuments: LegalDocument[];
  onEdit: (doc: LegalDocument) => void;
  onDelete: (id: number) => void;
}

export const DocumentsTable: React.FC<DocumentsTableProps> = ({
  filteredDocuments,
  onEdit,
  onDelete,
}) => {
  const now = new Date();
  const thirtyDaysFromNow = addDays(now, 30);

  const getStatusColor = (expiryDate?: Date) => {
    if (!expiryDate) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    const exp = new Date(expiryDate);
    if (isBefore(exp, now)) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (isBefore(exp, thirtyDaysFromNow)) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  const getStatusLabel = (expiryDate?: Date) => {
    if (!expiryDate) return 'صالح دائماً';
    const exp = new Date(expiryDate);
    if (isBefore(exp, now)) return 'منتهي';
    if (isBefore(exp, thirtyDaysFromNow)) return 'ينتهي قريباً';
    return 'ساري';
  };

  const getStatusIcon = (expiryDate?: Date) => {
    if (!expiryDate) return <CheckCircle className="w-3.5 h-3.5" />;
    const exp = new Date(expiryDate);
    if (isBefore(exp, now)) return <AlertTriangle className="w-3.5 h-3.5" />;
    if (isBefore(exp, thirtyDaysFromNow)) return <Clock className="w-3.5 h-3.5" />;
    return <CheckCircle className="w-3.5 h-3.5" />;
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'id_card': return 'هوية شخصية';
      case 'commercial_register': return 'سجل تجاري';
      case 'tax_card': return 'بطاقة ضريبية';
      case 'contract': return 'عقد';
      case 'license': return 'ترخيص';
      case 'insurance': return 'وثيقة تأمين';
      case 'other': return 'أخرى';
      default: return type;
    }
  };

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'customer': return 'عميل';
      case 'supplier': return 'مورد';
      case 'employee': return 'موظف';
      case 'company': return 'الشركة';
      default: return type;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-right">
        <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
          <tr>
            <th className="p-4 font-semibold text-sm">اسم المستند</th>
            <th className="p-4 font-semibold text-sm">النوع</th>
            <th className="p-4 font-semibold text-sm">يخص (الجهة/الشخص)</th>
            <th className="p-4 font-semibold text-sm">تاريخ الرفع</th>
            <th className="p-4 font-semibold text-sm">تاريخ الانتهاء</th>
            <th className="p-4 font-semibold text-sm">الحالة</th>
            <th className="p-4 font-semibold text-sm">الإجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredDocuments.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-12 text-center text-slate-500">
                <FolderOpen size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-lg font-medium text-slate-700 mb-1">لا توجد مستندات</p>
                <p>لم يتم العثور على مستندات مطابقة للبحث أو الفلاتر.</p>
              </td>
            </tr>
          ) : (
            filteredDocuments.map(doc => (
              <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                      <FileText size={16} />
                    </div>
                    <span className="font-medium text-slate-800">{doc.title}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {getDocumentTypeLabel(doc.type)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-slate-800 font-medium">{doc.entityName}</span>
                    <span className="text-xs text-slate-500">{getEntityTypeLabel(doc.entityType)}</span>
                  </div>
                </td>
                <td className="p-4 text-slate-600 text-sm">
                  {format(new Date(doc.uploadDate), 'yyyy-MM-dd')}
                </td>
                <td className="p-4 text-slate-600 text-sm font-medium">
                  {doc.expiryDate ? format(new Date(doc.expiryDate), 'yyyy-MM-dd') : <span className="text-slate-400">-</span>}
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.expiryDate)}`}>
                    {getStatusIcon(doc.expiryDate)}
                    {getStatusLabel(doc.expiryDate)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {doc.fileData && (
                      <a
                        href={doc.fileData}
                        download={doc.fileName || 'document.pdf'}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="تحميل الملف المرفق"
                      >
                        <Download size={18} />
                      </a>
                    )}
                    {doc.fileUrl && !doc.fileData && (
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="عرض رابط المرفق"
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}
                    <button
                      onClick={() => onEdit(doc)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => doc.id && onDelete(doc.id)}
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
