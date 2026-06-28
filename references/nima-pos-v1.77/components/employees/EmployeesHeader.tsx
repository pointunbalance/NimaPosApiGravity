import React from 'react';
import { Users, Search, Plus, Filter, Download } from 'lucide-react';
import { Role } from '../../types';

interface EmployeesHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: 'all' | 'active' | 'inactive';
  setStatusFilter: (status: 'all' | 'active' | 'inactive') => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  roles: Role[];
  onAddEmployee: () => void;
  onExportCSV: () => void;
}

const EmployeesHeader: React.FC<EmployeesHeaderProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  roleFilter,
  setRoleFilter,
  roles,
  onAddEmployee,
  onExportCSV
}) => {
  return (
    <div className="flex flex-col gap-6 font-['Tajawal']">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
              <Users className="w-8 h-8 stroke-[2]" />
            </div>
            ملفات الموظفين
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">إدارة بيانات الموظفين، الرواتب، والعقود والعهد المستلمة</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={onExportCSV}
            className="bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 border border-sky-200/80 px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-sm cursor-pointer active:scale-95 text-sm"
          >
            <Download className="w-5 h-5 stroke-[2]" />
            تصدير CSV
          </button>
          <button 
            onClick={onAddEmployee}
            className="bg-gradient-to-br from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-750 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-indigo-500/20 font-black transition-all cursor-pointer active:scale-95 text-sm"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            إضافة موظف
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-indigo-100/10 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 stroke-[2]" />
          <input 
            type="text" 
            placeholder="بحث بالاسم، المسمى الوظيفي، أو رقم الهاتف..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/85 border border-indigo-100/60 py-2.5 pr-10 pl-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 flex-1 md:flex-initial">
            <Filter className="w-5 h-5 text-indigo-400 stroke-[2]" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white/85 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-sm text-slate-700 appearance-none cursor-pointer flex-1 md:w-48"
            >
              <option value="all">جميع الأدوار</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white/85 border border-indigo-100/60 py-2.5 px-4 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-sm text-slate-700 appearance-none cursor-pointer flex-1 md:w-36"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default EmployeesHeader;
