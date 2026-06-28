import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Upload, KeyRound, ShieldCheck, User as UserIcon } from 'lucide-react';
import { User, Role } from '../../types';
import { AVAILABLE_PAGES } from '../settings/settingsUtils';
import { compressImage } from '../../utils/imageCompression';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

const userSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  pin: z.string().min(8, 'رمز الدخول يجب أن يكون 8 أرقام').max(8),
  role: z.string().default('cashier'),
  isActive: z.boolean().default(true),
  phone: z.string().optional(),
  email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
  address: z.string().optional(),
  jobTitle: z.string().optional(),
  bankAccount: z.string().optional(),
  startDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  idCardImage: z.string().optional(),
  notes: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  canRefund: z.boolean().default(false),
  managerId: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined || Number.isNaN(val)) return null;
    return Number(val);
  }, z.number().nullable().optional())
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSubmit: (userData: Partial<User>) => Promise<void>;
  users: User[];
}

const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, user, onSubmit, users }) => {
  const [idCardImage, setIdCardImage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'info' | 'permissions'>('info');
  const roles = useLiveQuery(() => db.roles.toArray(), []) || [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema) as any,
    defaultValues: {
      name: '',
      pin: '',
      role: 'cashier',
      isActive: true,
      phone: '',
      email: '',
      address: '',
      jobTitle: '',
      bankAccount: '',
      startDate: '',
      contractEndDate: '',
      idCardImage: '',
      notes: '',
      permissions: [],
      canRefund: false,
      managerId: null
    }
  });

  const isActive = watch('isActive');
  const watchRole = watch('role');
  const currentPermissions = watch('permissions') || [];

  const handlePermissionToggle = (path: string) => {
      const isSelected = currentPermissions.includes(path);
      if (isSelected) {
          setValue('permissions', currentPermissions.filter(p => p !== path), { shouldDirty: true });
      } else {
          setValue('permissions', [...currentPermissions, path], { shouldDirty: true });
      }
  };

  const handleSelectAllGroup = (section: string) => {
      const sectionPaths = AVAILABLE_PAGES.filter(p => p.section === section).map(p => p.path);
      const allSelected = sectionPaths.every(p => currentPermissions.includes(p));
      
      if (allSelected) {
          setValue('permissions', currentPermissions.filter(p => !sectionPaths.includes(p)), { shouldDirty: true });
      } else {
          const newPerms = new Set([...currentPermissions, ...sectionPaths]);
          setValue('permissions', Array.from(newPerms), { shouldDirty: true });
      }
  };

  // Group pages by section
  const pagesBySection = AVAILABLE_PAGES.reduce((acc, page) => {
      if (!acc[page.section]) acc[page.section] = [];
      acc[page.section].push(page);
      return acc;
  }, {} as Record<string, typeof AVAILABLE_PAGES>);

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setIdCardImage(user.idCardImage || '');
        reset({
          name: user.name,
          pin: user.pin,
          role: user.role,
          isActive: user.isActive ?? true,
          phone: user.phone || '',
          email: user.email || '',
          address: user.address || '',
          jobTitle: user.jobTitle || '',
          bankAccount: user.bankAccount || '',
          startDate: user.startDate ? new Date(user.startDate).toISOString().split('T')[0] : '',
          contractEndDate: user.contractEndDate ? new Date(user.contractEndDate).toISOString().split('T')[0] : '',
          idCardImage: user.idCardImage || '',
          notes: user.notes || '',
          permissions: user.permissions || [],
          canRefund: user.canRefund ?? false,
          managerId: user.managerId || null
        });
      } else {
        setIdCardImage('');
        reset({
          name: '',
          pin: '',
          role: 'cashier',
          isActive: true,
          phone: '',
          email: '',
          address: '',
          jobTitle: '',
          bankAccount: '',
          startDate: '',
          contractEndDate: '',
          idCardImage: '',
          notes: '',
          permissions: [],
          canRefund: false,
          managerId: null
        });
      }
    } else {
        setActiveTab('info');
    }
  }, [user, isOpen, reset]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImage(file).then(result => {
        setIdCardImage(result);
        setValue('idCardImage', result);
      });
    }
  };

  const onFormSubmit = async (data: UserFormValues) => {
    const formattedData: Partial<User> = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : undefined,
    };
    await onSubmit(formattedData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
         <div className="flex justify-between items-center p-6 border-b bg-slate-50">
             <div className="flex items-center gap-4">
                 <h3 className="font-bold text-xl text-slate-800">
                     {user ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
                 </h3>
                 <div className="flex bg-slate-200/50 p-1 rounded-xl mr-4">
                     <button type="button" onClick={() => setActiveTab('info')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'info' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}><UserIcon className="w-4 h-4" /> البيانات</button>
                     <button type="button" onClick={() => setActiveTab('permissions')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition flex items-center gap-2 ${activeTab === 'permissions' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}><ShieldCheck className="w-4 h-4" /> الصلاحيات والوصول</button>
                 </div>
             </div>
             <button type="button" onClick={onClose} className="p-2 bg-white rounded-full hover:bg-slate-200 transition-colors"><X className="w-5 h-5"/></button>
         </div>
         
         <form onSubmit={handleSubmit(onFormSubmit)} className="flex-1 overflow-y-auto p-0 flex flex-col">
             {activeTab === 'info' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">
                 
                 {/* Image Upload */}
                 <div className="md:col-span-2 flex justify-center mb-4">
                     <label className="relative cursor-pointer group">
                         <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group-hover:border-indigo-500 transition-colors">
                             {idCardImage ? <img src={idCardImage} className="w-full h-full object-cover" alt="ID" /> : <Upload className="w-8 h-8 text-slate-400" />}
                         </div>
                         <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="text-white text-xs font-bold">تغيير الصورة</span>
                         </div>
                         <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                     </label>
                 </div>

                 <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1.5">الاسم الكامل <span className="text-red-500">*</span></label>
                     <input 
                       {...register('name')}
                       className={`w-full bg-white border ${errors.name ? 'border-red-500' : 'border-slate-200'} p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none`} 
                       placeholder="الاسم كما في الهوية" 
                     />
                     {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                 </div>
                 <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1.5">المسمى الوظيفي</label>
                     <input 
                       {...register('jobTitle')}
                       className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                       placeholder="مثال: مسؤول مبيعات" 
                     />
                 </div>

                 <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1.5">المدير المباشر</label>
                     <select 
                        {...register('managerId')}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                     >
                         <option value="">بدون مدير مباشر</option>
                         {users?.filter(u => u.id !== user?.id).map(u => (
                             <option key={u.id} value={u.id}>{u.name} ({u.jobTitle || u.role})</option>
                         ))}
                     </select>
                 </div>

                 <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1.5">رمز الدخول (PIN) <span className="text-red-500">*</span></label>
                     <div className="relative">
                         <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <input 
                            type="text" 
                            maxLength={8} 
                            {...register('pin')}
                            className={`w-full bg-white border ${errors.pin ? 'border-red-500' : 'border-slate-200'} p-3 pr-10 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono tracking-widest`} 
                            placeholder="00000000"
                         />
                     </div>
                     {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin.message}</p>}
                 </div>
                 
                 <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1.5">الدور الوظيفي</label>
                     <select 
                        {...register('role')}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                     >
                         <option value="cashier">كاشير / مبيعات (افتراضي)</option>
                         <option value="admin">مدير نظام (Admin)</option>
                         <option value="warehouse">أمين مخزن</option>
                         {roles.map(role => (
                             <option key={role.id} value={role.name}>{role.name}</option>
                         ))}
                     </select>
                     <p className="text-xs text-slate-500 mt-1">يحدد هذا الدور الصلاحيات الافتراضية، ويمكنك تخصيص المزيد من قسم "الصلاحيات والوصول".</p>
                 </div>

                 <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1.5">تاريخ انتهاء العقد</label>
                     <input 
                        type="date" 
                        {...register('contractEndDate')}
                        className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                     />
                 </div>

                 <div>
                     <label className="block text-sm font-bold text-slate-700 mb-1.5">رقم الهاتف</label>
                     <input 
                       {...register('phone')}
                       className="w-full bg-white border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                       placeholder="01xxxxxxxxx" 
                     />
                 </div>

                 <div className="md:col-span-2">
                     <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                         <input 
                            type="checkbox" 
                            {...register('isActive')}
                            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" 
                         />
                         <div>
                             <span className="font-bold text-slate-800 block text-sm">حساب نشط</span>
                             <span className="text-xs text-slate-500">يمكن للموظف تسجيل الدخول للنظام</span>
                         </div>
                     </label>
                 </div>
             </div>
             )}

             {activeTab === 'permissions' && (
                 <div className="p-8 flex-1 bg-slate-50">
                     {watchRole === 'admin' ? (
                         <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                             <ShieldCheck className="w-16 h-16 text-blue-500 mb-3" />
                             <h4 className="text-blue-900 font-bold text-lg mb-1">صلاحيات كاملة للمدير</h4>
                             <p className="text-blue-700 text-sm">هذا المستخدم مخصص كمدير نظام (Admin) ويمتلك صلاحيات الوصول المباشرة إلى كافة أقسام النظام تلقائياً.</p>
                         </div>
                     ) : (
                         <div>
                             <div className="mb-6 pb-2 border-b border-slate-200">
                                 <h4 className="text-lg font-bold text-slate-800 mb-1">تخصيص صلاحيات الوصول المحددة</h4>
                                 <p className="text-slate-500 text-sm">حدد الأقسام والصفحات التي يحق للموظف الوصول إليها. (يُمنع الموظف من رؤية العناصر غير المحددة)</p>
                             </div>
                             
                             <div className="space-y-6">
                                 <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-xl mb-4">
                                      <input 
                                          type="checkbox"
                                          {...register('canRefund')}
                                          className="w-5 h-5 text-rose-600 rounded bg-white border-rose-300 focus:ring-rose-500"
                                      />
                                      <div>
                                          <span className="font-bold text-rose-900 block text-sm">السماح بعمليات الاسترجاع والمرتجعات</span>
                                          <span className="text-xs text-rose-600">هل يحق له إرجاع فاتورة أو منتج؟</span>
                                      </div>
                                 </div>

                                 <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl mb-4">
                                      <input 
                                          type="checkbox"
                                          checked={currentPermissions.includes('all')}
                                          onChange={(e) => {
                                              if(e.target.checked) setValue('permissions', ['all'], { shouldDirty: true });
                                              else setValue('permissions', [], { shouldDirty: true });
                                          }}
                                          className="w-5 h-5 text-indigo-600 rounded bg-white border-indigo-300"
                                      />
                                      <div>
                                          <span className="font-bold text-indigo-900 block text-sm">تخويل الوصول لكافة الأقسام</span>
                                          <span className="text-xs text-indigo-600">منح الموظف وصول مطابق للمدير في الصفحات</span>
                                      </div>
                                 </div>

                                 {!currentPermissions.includes('all') && Object.entries(pagesBySection).map(([sectionName, pages]) => {
                                     const allSelected = pages.every(p => currentPermissions.includes(p.path));
                                     return (
                                     <div key={sectionName} className="bg-white border text-right border-slate-200 rounded-xl overflow-hidden">
                                         <div className="bg-slate-50 p-3 border-b flex justify-between items-center cursor-pointer hover:bg-slate-100 transition" onClick={() => handleSelectAllGroup(sectionName)}>
                                              <span className="font-bold text-slate-700 text-sm">{sectionName}</span>
                                              <input type="checkbox" className="w-4 h-4 pointer-events-none" checked={allSelected} readOnly />
                                         </div>
                                         <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                             {pages.map((page, idx) => (
                                                 <label key={`${page.path}-${idx}`} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-indigo-50 transition border ${currentPermissions.includes(page.path) ? 'border-indigo-200 bg-indigo-50/50' : 'border-transparent'}`}>
                                                     <input 
                                                         type="checkbox"
                                                         className="w-4 h-4 rounded text-indigo-600"
                                                         checked={currentPermissions.includes(page.path)}
                                                         onChange={() => handlePermissionToggle(page.path)}
                                                     />
                                                     <span className="text-sm font-medium text-slate-700 flex-1 truncate" title={page.label}>{page.label}</span>
                                                 </label>
                                             ))}
                                         </div>
                                     </div>
                                 )})}
                             </div>
                         </div>
                     )}
                 </div>
             )}

             <div className="p-6 border-t border-slate-200 flex gap-3 mt-auto shrink-0 bg-white">
                 <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50">إلغاء</button>
                 <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50">
                   {isSubmitting ? 'جاري الحفظ...' : 'حفظ البيانات'}
                 </button>
             </div>
         </form>
      </div>
    </div>
  );
};

export default UserModal;
