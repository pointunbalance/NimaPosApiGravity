import React, { useState, useMemo } from 'react';
import { UserCheck, Plus, Search, Edit, Trash2, Shield, Save, X, CheckSquare, Square, Users, AlertTriangle, Layers } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Role } from '../../types';
import { AVAILABLE_PAGES } from '../../components/settings/settingsUtils';
import { Toaster, toast } from 'react-hot-toast';
import ConfirmModal from '../../components/ui/ConfirmModal';

const PERMISSION_GROUPS = [
  {
    id: 'dashboard',
    name: 'لوحة القيادة',
    permissions: [
      { id: 'view_dashboard', name: 'عرض لوحة القيادة' }
    ]
  },
  {
    id: 'users_roles',
    name: 'المستخدمين والأدوار',
    permissions: [
      { id: 'manage_users', name: 'إدارة المستخدمين' },
      { id: 'manage_roles', name: 'إدارة الصلاحيات' }
    ]
  },
  {
    id: 'inventory',
    name: 'المخزون',
    permissions: [
      { id: 'view_inventory', name: 'عرض المخزون' },
      { id: 'manage_inventory', name: 'إدارة المخزون' }
    ]
  },
  {
    id: 'sales',
    name: 'المبيعات',
    permissions: [
      { id: 'view_sales', name: 'عرض المبيعات' },
      { id: 'manage_sales', name: 'إدارة المبيعات' }
    ]
  },
  {
    id: 'purchases',
    name: 'المشتريات',
    permissions: [
      { id: 'view_purchases', name: 'عرض المشتريات' },
      { id: 'manage_purchases', name: 'إدارة المشتريات' }
    ]
  },
  {
    id: 'manufacturing',
    name: 'التصنيع',
    permissions: [
      { id: 'view_manufacturing', name: 'عرض التصنيع' },
      { id: 'manage_manufacturing', name: 'إدارة التصنيع' }
    ]
  },
  {
    id: 'hr',
    name: 'الموارد البشرية',
    permissions: [
      { id: 'view_hr', name: 'عرض الموارد البشرية' },
      { id: 'manage_hr', name: 'إدارة الموارد البشرية' }
    ]
  },
  {
    id: 'shifts',
    name: 'الورديات',
    permissions: [
      { id: 'view_shifts', name: 'عرض الورديات' },
      { id: 'manage_shifts', name: 'إدارة الورديات' },
      { id: 'shift_confirm', name: 'تأكيد استلام نقدية الوردية' },
      { id: 'shift_expenses', name: 'تسجيل مصروفات من الدرج' }
    ]
  },
  {
    id: 'reports_settings',
    name: 'التقارير والإعدادات',
    permissions: [
      { id: 'view_reports', name: 'عرض التقارير' },
      { id: 'manage_settings', name: 'إدارة الإعدادات' }
    ]
  }
];

const RoleManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<Role> | null>(null);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const roles = useLiveQuery(() => db.roles.toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];

  const filteredRoles = useMemo(() => {
    return roles.filter(role =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  const getUserCountForRole = (roleName: string) => {
    return users.filter(u => u.role === roleName || u.role === roleName.toLowerCase()).length;
  };

  const logAction = async (action: string, details: string) => {
    try {
      await db.logs.add({
        type: 'user',
        action,
        details,
        user: 'مدير النظام', // Should be dynamic based on logged-in user
        date: new Date(),
        status: 'success',
        module: 'إدارة الصلاحيات'
      });
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole?.name) return;

    if (editingRole.isSystem || editingRole.name.toLowerCase() === 'admin') {
       toast.error('لا يمكن تعديل الصلاحيات لأدوار النظام الأساسية لضمان استقرار النظام (Privilege Security).');
       return;
    }

    const roleData: any = {
      name: editingRole.name,
      description: editingRole.description,
      permissions: editingRole.permissions || [],
      isSystem: editingRole.isSystem || false
    };

    try {
      if (editingRole.id) {
        await db.roles.update(editingRole.id, roleData);
        await logAction('تحديث دور', `تم تحديث صلاحيات الدور: ${roleData.name}`);
        toast.success(`تم تحديث صلاحيات الدور "${roleData.name}" بنجاح.`);
      } else {
        await db.roles.add(roleData);
        await logAction('إضافة دور', `تم إضافة دور جديد: ${roleData.name}`);
        toast.success(`تم إضافة الدور الجديد "${roleData.name}" بنجاح.`);
      }
      setIsModalOpen(false);
      setEditingRole(null);
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('حدث خطأ أثناء حفظ الدور.');
    }
  };

  const handleDelete = (role: Role) => {
    if (role.isSystem || role.name.toLowerCase() === 'admin') {
      toast.error('لا يمكن حذف أدوار النظام الأساسية.');
      return;
    }

    const userCount = getUserCountForRole(role.name);
    if (userCount > 0) {
      toast.error(`لا يمكن حذف هذا الدور لأنه مرتبط بـ ${userCount} مستخدم(ين). يرجى تغيير أدوارهم أولاً.`);
      return;
    }

    setRoleToDelete(role);
    setIsDeleteConfirmOpen(true);
  };

  const executeDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await db.roles.delete(roleToDelete.id!);
      await logAction('حذف دور', `تم حذف الدور: ${roleToDelete.name}`);
      toast.success(`تم حذف الدور "${roleToDelete.name}" بنجاح.`);
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('حدث خطأ أثناء حذف الدور.');
    } finally {
      setIsDeleteConfirmOpen(false);
      setRoleToDelete(null);
    }
  };

  const openModal = (role?: Role) => {
    if (role) {
      setEditingRole({ ...role });
    } else {
      setEditingRole({
        name: '',
        description: '',
        permissions: [],
        isSystem: false
      });
    }
    setIsModalOpen(true);
  };

  const togglePermission = (permissionId: string) => {
    if (!editingRole) return;
    
    const currentPermissions = editingRole.permissions || [];
    const newPermissions = currentPermissions.includes(permissionId)
      ? currentPermissions.filter(p => p !== permissionId)
      : [...currentPermissions, permissionId];
      
    setEditingRole({ ...editingRole, permissions: newPermissions });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-indigo-600" />
            إدارة الصلاحيات والأدوار
          </h1>
          <p className="text-slate-500 mt-1">تخصيص صلاحيات الوصول لكل دور في النظام</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          إضافة دور جديد
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث في الأدوار..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRoles.map(role => {
          const userCount = getUserCountForRole(role.name);
          const isProtected = role.isSystem || role.name.toLowerCase() === 'admin';

          return (
            <div key={role.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isProtected ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      {role.name}
                      {isProtected && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-bold">أساسي</span>}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{role.description || 'لا يوجد وصف'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => openModal(role)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="تعديل"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {!isProtected && (
                    <button 
                      onClick={() => handleDelete(role)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">المستخدمين</span>
                  </div>
                  <span className="font-bold text-slate-800">{userCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-600">
                    <CheckSquare className="w-4 h-4 text-slate-400" />
                    <span className="text-sm">الصلاحيات</span>
                  </div>
                  <span className="font-bold text-slate-800">{role.permissions.length}</span>
                </div>
              </div>
              
              <button 
                onClick={() => openModal(role)}
                className="w-full py-2.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                عرض وتعديل الصلاحيات
              </button>
            </div>
          );
        })}

        {filteredRoles.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <UserCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-lg font-medium text-slate-600">لا توجد أدوار مطابقة للبحث</p>
            <p className="text-sm mt-1">جرب استخدام كلمات بحث مختلفة أو أضف دوراً جديداً.</p>
          </div>
        )}
      </div>

      {isModalOpen && editingRole && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-600" />
                {editingRole.id ? 'تعديل الدور' : 'إضافة دور جديد'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="role-form" onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">اسم الدور <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      disabled={editingRole.isSystem || editingRole.name?.toLowerCase() === 'admin'}
                      value={editingRole.name || ''}
                      onChange={e => setEditingRole({...editingRole, name: e.target.value})}
                      placeholder="مثال: مدير المبيعات"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60"
                    />
                    {(editingRole.isSystem || editingRole.name?.toLowerCase() === 'admin') && (
                      <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        لا يمكن تغيير اسم هذا الدور لأنه أساسي في النظام.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">الوصف</label>
                    <input
                      type="text"
                      value={editingRole.description || ''}
                      onChange={e => setEditingRole({...editingRole, description: e.target.value})}
                      placeholder="وصف مختصر لمهام هذا الدور..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-lg font-bold text-slate-800">صلاحيات الوصول (الصفحات)</label>
                    <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      {editingRole.permissions?.length || 0} صفحة محددة
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from(new Set(AVAILABLE_PAGES.map(p => p.section))).map(section => {
                      const sectionPages = AVAILABLE_PAGES.filter(p => p.section === section);
                      const isFullySelected = sectionPages.every(p => editingRole.permissions?.includes(p.path));
                      const isPartiallySelected = sectionPages.some(p => editingRole.permissions?.includes(p.path)) && !isFullySelected;
                      
                      return (
                        <div key={section} className="border border-slate-200 rounded-2xl overflow-hidden">
                          <div 
                            className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => {
                                const currentPermissions = editingRole.permissions || [];
                                const sectionPaths = sectionPages.map(p => p.path);
                                const allSelected = sectionPaths.every(id => currentPermissions.includes(id));
                                
                                let newPermissions;
                                if (allSelected) {
                                  newPermissions = currentPermissions.filter(id => !sectionPaths.includes(id));
                                } else {
                                  const toAdd = sectionPaths.filter(id => !currentPermissions.includes(id));
                                  newPermissions = [...currentPermissions, ...toAdd];
                                }
                                setEditingRole({ ...editingRole, permissions: newPermissions });
                            }}
                          >
                            <span className="font-bold text-slate-700">{section}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">
                                {sectionPages.filter(p => editingRole.permissions?.includes(p.path)).length} / {sectionPages.length}
                              </span>
                              {isFullySelected ? (
                                <CheckSquare className="w-5 h-5 text-indigo-600" />
                              ) : isPartiallySelected ? (
                                <div className="w-5 h-5 rounded border-2 border-indigo-600 flex items-center justify-center bg-indigo-50">
                                  <div className="w-2.5 h-0.5 bg-indigo-600 rounded-full" />
                                </div>
                              ) : (
                                <Square className="w-5 h-5 text-slate-300" />
                              )}
                            </div>
                          </div>
                          <div className="p-2 bg-white">
                            {sectionPages.map((permission, idx) => (
                              <label 
                                key={`${permission.path}-${idx}`} 
                                className="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={(editingRole.permissions || []).includes(permission.path)}
                                  onChange={() => togglePermission(permission.path)}
                                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-slate-700">
                                  {permission.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors font-medium"
              >
                إلغاء
              </button>
              <button
                type="submit"
                form="role-form"
                className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors font-medium flex items-center gap-2 shadow-sm"
              >
                <Save className="w-5 h-5" />
                حفظ التغييرات
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteConfirmOpen}
        title="حذف دور الصلاحية"
        message={`هل أنت متأكد من رغبتك في حذف الدور المالي/الوظيفي "${roleToDelete?.name || ''}" نهائياً من النظام؟ لا يمكن التراجع عن هذا الإجراء.`}
        onConfirm={executeDeleteRole}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setRoleToDelete(null);
        }}
        confirmText="نعم، احذف"
        cancelText="تراجع"
      />

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

export default RoleManagement;
