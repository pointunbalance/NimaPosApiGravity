import React from 'react';
import { User, Role } from '../../types';
import { CircleUser, X, Phone, Mail, MapPin, Briefcase, Calendar, Banknote, Shield, FileText, CheckCircle2, XCircle } from 'lucide-react';

interface EmployeeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  roles: Role[];
}

const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({
  isOpen,
  onClose,
  user,
  roles
}) => {
  if (!isOpen) return null;

  const roleName = roles.find(r => r.name === user.role)?.name || user.role || 'غير محدد';
  const isActive = user.isActive ?? true;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CircleUser className="w-6 h-6 text-brand-600" />
            تفاصيل الموظف
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Header Info */}
          <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-3xl ${isActive ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800">{user.name}</h3>
              <p className="text-slate-500 flex items-center gap-2 mt-1">
                <Briefcase className="w-4 h-4" />
                {user.jobTitle || 'بدون مسمى وظيفي'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {isActive ? (
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> نشط
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1 font-medium">
                    <XCircle className="w-3 h-3" /> موقوف
                  </span>
                )}
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center gap-1 font-medium">
                  <Shield className="w-3 h-3" /> {roleName}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 flex items-center gap-2">
                <Phone className="w-5 h-5 text-slate-400" />
                معلومات الاتصال
              </h4>
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">رقم الهاتف</span>
                  <p className="text-slate-800 font-medium" dir="ltr">{user.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">البريد الإلكتروني</span>
                  <p className="text-slate-800 font-medium" dir="ltr">{user.email || '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">العنوان</span>
                  <p className="text-slate-800 font-medium flex items-start gap-1">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    {user.address || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Info */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-slate-400" />
                المعلومات المالية
              </h4>
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">الراتب الأساسي</span>
                  <p className="text-slate-800 font-medium">{user.baseSalary ? `${user.baseSalary.toLocaleString()} د.ع` : '-'}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">طريقة الدفع</span>
                  <p className="text-slate-800 font-medium">
                    {user.paymentMethod === 'bank' ? 'تحويل بنكي' : 'نقدي'}
                  </p>
                </div>
                {user.paymentMethod === 'bank' && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-1">رقم الحساب / IBAN</span>
                    <p className="text-slate-800 font-medium" dir="ltr">{user.bankAccount || '-'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contract Info */}
            <div className="space-y-4 md:col-span-2">
              <h4 className="font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-slate-400" />
                معلومات العقد
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">تاريخ المباشرة</span>
                  <p className="text-slate-800 font-medium">
                    {user.startDate ? new Date(user.startDate).toLocaleDateString('ar-IQ') : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-1">تاريخ انتهاء العقد</span>
                  <p className="text-slate-800 font-medium">
                    {user.contractEndDate ? new Date(user.contractEndDate).toLocaleDateString('ar-IQ') : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {user.notes && (
              <div className="space-y-4 md:col-span-2">
                <h4 className="font-bold text-slate-700 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-400" />
                  ملاحظات
                </h4>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-amber-800 whitespace-pre-wrap">
                  {user.notes}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;
