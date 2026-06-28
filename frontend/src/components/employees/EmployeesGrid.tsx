import React from 'react';
import { User } from '../../types';
import { 
  CircleUser, Edit, Trash2, Phone, Briefcase, Calendar, Banknote, Eye, Power, PowerOff
} from 'lucide-react';

interface EmployeesGridProps {
  users: User[];
  searchTerm: string;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
  onViewDetails: (user: User) => void;
  onToggleStatus: (user: User) => void;
}

const EmployeesGrid: React.FC<EmployeesGridProps> = ({
  users,
  searchTerm,
  onEdit,
  onDelete,
  onViewDetails,
  onToggleStatus
}) => {
  const getContractStatus = (endDate?: Date) => {
    if (!endDate) return { label: 'غير محدد', color: 'text-slate-500 bg-slate-100' };
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'منتهي', color: 'text-red-700 bg-red-100' };
    if (diffDays <= 30) return { label: `ينتهي خلال ${diffDays} يوم`, color: 'text-amber-700 bg-amber-100' };
    return { label: 'ساري', color: 'text-emerald-700 bg-emerald-100' };
  };

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
        <CircleUser className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-700 mb-2">لا يوجد موظفين</h3>
        <p className="text-slate-500 max-w-md mx-auto">
          {searchTerm ? 'لم يتم العثور على نتائج مطابقة للبحث.' : 'قم بإضافة ملفات الموظفين لتتبع معلوماتهم وعقودهم.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map(user => {
        const contract = getContractStatus(user.contractEndDate);
        const isActive = user.isActive ?? true;
        
        return (
          <div key={user.id} className={`bg-white rounded-2xl border ${isActive ? 'border-slate-200' : 'border-red-200 opacity-75'} overflow-hidden hover:shadow-md transition-shadow relative`}>
            {!isActive && (
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            )}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${isActive ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold ${isActive ? 'text-slate-800' : 'text-slate-500 line-through'}`}>{user.name}</h3>
                    {!isActive && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">موقوف</span>}
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <Briefcase className="w-3 h-3" />
                    {user.jobTitle || 'غير محدد'}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onViewDetails(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="عرض التفاصيل">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => onEdit(user)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors" title="تعديل">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => onToggleStatus(user)} className={`p-2 rounded-lg transition-colors ${isActive ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'}`} title={isActive ? 'إيقاف الموظف' : 'تفعيل الموظف'}>
                  {isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                </button>
                <button onClick={() => onDelete(user.id!)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500 block mb-1 text-xs">رقم الهاتف</span>
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span dir="ltr">{user.phone || '-'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1 text-xs">الراتب الأساسي</span>
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Banknote className="w-4 h-4 text-slate-400" />
                    {user.baseSalary ? `${user.baseSalary.toLocaleString()} د.ع` : '-'}
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">حالة العقد:</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${contract.color}`}>
                  {contract.label}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EmployeesGrid;
