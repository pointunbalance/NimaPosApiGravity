import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, UserCircle, Briefcase, FileText, X, Check, Edit2, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

export const HotelStaff = () => {
  const rolesList = ["مدير فندق","موظف استقبال","خدمة غرف (Housekeeping)","مدير مطعم/كافيه","طاهي","موظف أمن","حامل حقائب (Bellboy)"];
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: rolesList[0] || 'موظف',
    pin: '12345678',
    baseSalary: 0,
    isActive: true,
  });

  const staff = useLiveQuery(() => 
    db.users.filter(u => u.department === 'hotel').toArray()
  ) || [];

  const filteredStaff = staff.filter(emp => {
    const matchesSearch = emp.name.includes(search) || (emp.phone && emp.phone.includes(search));
    const matchesRole = selectedRole ? emp.role === selectedRole : true;
    return matchesSearch && matchesRole;
  });

  const activeStaff = filteredStaff.filter(s => s.isActive).length;

  const handleOpenModal = (isEditMode = false, emp: any = null) => {
    setIsEdit(isEditMode);
    if (isEditMode && emp) {
      setCurrentId(emp.id!);
      setFormData({
        name: emp.name,
        phone: emp.phone || '',
        role: emp.role,
        pin: emp.pin || '1234',
        baseSalary: emp.baseSalary || 0,
        isActive: emp.isActive,
      });
    } else {
      setCurrentId(null);
      setFormData({
        name: '',
        phone: '',
        role: rolesList[0] || 'موظف',
        pin: '1234',
        baseSalary: 0,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        baseSalary: Number(formData.baseSalary),
        department: 'hotel',
      };
      
      if (isEdit && currentId) {
        await db.users.update(currentId, payload);
      } else {
        await db.users.add(payload);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
      await db.users.delete(id);
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إدارة موظفي الفندق</h1>
          <p className="text-slate-500">سجل وحسابات رواتب وأداء طاقم الفندق</p>
        </div>
        <button 
           onClick={() => handleOpenModal(false)}
           className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus className="w-5 h-5" />
          <span>إضافة موظف فندق جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <UserCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">إجمالي الموظفين</p>
            <p className="text-xl font-bold text-slate-800">{staff.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">الموظفين النشطين</p>
            <p className="text-xl font-bold text-slate-800">{activeStaff}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">موقوف / مجاز</p>
            <p className="text-xl font-bold text-slate-800">{staff.length - activeStaff}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم الموظف أو الهاتف..." 
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">جميع التخصصات</option>
              {rolesList.map((role, idx) => (
                <option key={idx} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 text-right">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الرقم الوظيفي</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الموظف</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">التخصص / المسمى</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الحالة</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الراتب الأساسي</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    لا يوجد موظفين مسجلين في هذا القسم. اضغط على أضف جديد للبدء.
                  </td>
                </tr>
              ) : filteredStaff.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-600">EMP-{1000 + (emp.id || 0)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-800">{emp.name}</div>
                    <div className="text-sm text-slate-500">{emp.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{emp.role}</td>
                  <td className="px-6 py-4">
                    {emp.isActive ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center w-max gap-1">
                        <Check className="w-3 h-3" /> نشط
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full flex items-center w-max gap-1">
                        <X className="w-3 h-3" /> موقوف
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{emp.baseSalary || 0} ر.س</td>
                  <td className="px-6 py-4 p-0">
                    <div className="flex justify-center items-center gap-2">
                       <button onClick={() => handleOpenModal(true, emp)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleDelete(emp.id!)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {isEdit ? 'تعديل بيانات الموظف' : `إضافة موظف جديد`}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم رباعي</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                  <input 
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-right focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رمز الدخول (PIN)</label>
                  <input 
                    type="text" 
                    value={formData.pin}
                    onChange={(e) => setFormData({...formData, pin: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-center font-mono tracking-widest focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">التخصص / المسمى الوظيفي</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {rolesList.map((role, idx) => (
                      <option key={idx} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الراتب الأساسي</label>
                  <input 
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({...formData, baseSalary: Number(e.target.value)})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm text-slate-700 cursor-pointer">
                  تفعيل حساب الموظف (يمكنه تسجيل الدخول للنظام إذا كان مسموحاً)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
