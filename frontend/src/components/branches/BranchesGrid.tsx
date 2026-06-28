import React from 'react';
import { Branch } from '../../types';
import { Building, MapPin, Edit, Trash2, CheckCircle2, XCircle, Phone, Mail, Clock, FileText, Store, Warehouse, MonitorSmartphone } from 'lucide-react';

interface BranchesGridProps {
  branches: Branch[];
  searchTerm: string;
  onEdit: (branch: Branch) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (branch: Branch) => void;
  onAddFirstBranch: () => void;
}

const BranchesGrid: React.FC<BranchesGridProps> = ({
  branches,
  searchTerm,
  onEdit,
  onDelete,
  onToggleStatus,
  onAddFirstBranch
}) => {
  if (branches.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center animate-in zoom-in-95 duration-500">
        <MapPin className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-700 mb-2">
          {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد فروع مسجلة'}
        </h3>
        <p className="text-slate-500 max-w-md mx-auto">
          {searchTerm ? 'حاول استخدام كلمات بحث مختلفة.' : 'قم بإضافة فروع جديدة لإدارة أعمالك في مواقع مختلفة.'}
        </p>
        {!searchTerm && (
          <button 
            onClick={onAddFirstBranch}
            className="mt-6 text-brand-600 font-medium hover:text-brand-700 transition-colors"
          >
            + إضافة أول فرع
          </button>
        )}
      </div>
    );
  }

  const getBranchIcon = (type?: string) => {
    switch (type) {
      case 'main': return <Building className="w-6 h-6" />;
      case 'warehouse': return <Warehouse className="w-6 h-6" />;
      case 'kiosk': return <MonitorSmartphone className="w-6 h-6" />;
      default: return <Store className="w-6 h-6" />;
    }
  };

  const getBranchTypeName = (type?: string) => {
    switch (type) {
      case 'main': return 'فرع رئيسي';
      case 'warehouse': return 'مستودع';
      case 'kiosk': return 'نقطة بيع مصغرة';
      default: return 'فرع فرعي';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {branches.map((branch, index) => (
        <div 
          key={branch.id} 
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 animate-in slide-in-from-bottom-4 flex flex-col"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="p-6 flex-1">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${branch.status === 'active' ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-400'}`}>
                  {getBranchIcon(branch.type)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{branch.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {branch.code && <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{branch.code}</span>}
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{getBranchTypeName(branch.type)}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onToggleStatus(branch)}
                className={`p-1.5 rounded-lg transition-colors ${branch.status === 'active' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                title={branch.status === 'active' ? 'نشط' : 'غير نشط'}
              >
                {branch.status === 'active' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600 mt-6">
              {branch.manager && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                    <span className="text-slate-500 font-bold">{branch.manager.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">المدير</p>
                    <p className="font-medium text-slate-700">{branch.manager}</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                {branch.phone && (
                  <div className="flex items-center gap-2 text-slate-500 bg-slate-50 p-2 rounded-lg">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span dir="ltr" className="font-medium truncate">{branch.phone}</span>
                  </div>
                )}
                {branch.workingHours && (
                  <div className="flex items-center gap-2 text-slate-500 bg-slate-50 p-2 rounded-lg">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span className="font-medium truncate">{branch.workingHours}</span>
                  </div>
                )}
              </div>

              {branch.email && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="w-4 h-4 shrink-0" />
                  <span className="truncate">{branch.email}</span>
                </div>
              )}
              
              {branch.address && (
                <div className="flex items-start gap-2 text-slate-500">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{branch.address}</span>
                </div>
              )}

              {(branch.taxNumber || branch.commercialRegister) && (
                <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                  {branch.taxNumber && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">الرقم الضريبي:</span>
                      <span className="font-mono text-slate-700">{branch.taxNumber}</span>
                    </div>
                  )}
                  {branch.commercialRegister && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">السجل التجاري:</span>
                      <span className="font-mono text-slate-700">{branch.commercialRegister}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end gap-2 mt-auto">
            <button 
              onClick={() => onEdit(branch)}
              className="p-2 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <Edit className="w-4 h-4" /> تعديل
            </button>
            <button 
              onClick={() => onDelete(branch.id!)}
              className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" /> حذف
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BranchesGrid;
