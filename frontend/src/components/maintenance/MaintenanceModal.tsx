import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Settings, Trash2 } from 'lucide-react';
import { MaintenanceOrder, MaintenanceStatus, MaintenancePart, User, MaintenanceSettings } from '../../types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import MaintenanceSettingsModal from './MaintenanceSettingsModal';

const maintenanceSchema = z.object({
  customerName: z.string().min(1, 'اسم العميل مطلوب'),
  customerPhone: z.string().min(1, 'رقم الهاتف مطلوب'),
  deviceType: z.string().min(1, 'نوع الجهاز مطلوب'),
  deviceBrand: z.string().optional(),
  deviceModel: z.string().min(1, 'الموديل مطلوب'),
  deviceSerial: z.string().optional(),
  devicePassword: z.string().optional(),
  maintenanceType: z.string().optional(),
  specifications: z.string().optional(),
  issueDescription: z.string().min(1, 'وصف العطل مطلوب'),
  deviceAttachments: z.string().optional(),
  expectedCost: z.number().min(0, 'التكلفة يجب أن تكون 0 أو أكثر').optional(),
  actualCost: z.number().min(0, 'التكلفة يجب أن تكون 0 أو أكثر').optional(),
  deposit: z.number().min(0, 'العربون يجب أن يكون 0 أو أكثر').optional(),
  status: z.enum(['received', 'diagnosing', 'waiting_parts', 'repairing', 'ready', 'delivered', 'cancelled', 'waiting_approval', 'abandoned']),
  technicianName: z.string().optional(),
  notes: z.string().optional(),
});

export type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface MaintenanceModalProps {
  editingOrder: MaintenanceOrder | null;
  onClose: () => void;
  onSave: (data: MaintenanceFormData) => Promise<void>;
  statusMap: Record<MaintenanceStatus, { label: string; color: string; icon: React.ReactNode }>;
  orderParts: MaintenancePart[];
  newPart: Partial<MaintenancePart>;
  setNewPart: (part: Partial<MaintenancePart>) => void;
  handleAddPart: () => void;
  handleRemovePart: (index: number) => void;
  users?: User[];
}

const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  editingOrder,
  onClose,
  onSave,
  statusMap,
  orderParts,
  newPart,
  setNewPart,
  handleAddPart,
  handleRemovePart,
  users = []
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const settings = useLiveQuery(() => db.settings.toArray());
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const maintenanceSettings = settings?.[0]?.maintenanceSettings || {
    deviceTypes: ['موبايل', 'لابتوب', 'تابلت', 'ساعة ذكية'],
    deviceBrands: ['Apple', 'Samsung', 'Huawei', 'Xiaomi', 'Oppo', 'HP', 'Dell', 'Lenovo'],
    deviceModels: [],
    maintenanceTypes: ['تغيير شاشة', 'تغيير بطارية', 'سوفت وير', 'صيانة بوردة', 'تنظيف', 'أخرى']
  };

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      customerName: '',
      customerPhone: '',
      deviceType: '',
      deviceBrand: '',
      deviceModel: '',
      deviceSerial: '',
      devicePassword: '',
      maintenanceType: '',
      specifications: '',
      issueDescription: '',
      deviceAttachments: '',
      expectedCost: 0,
      actualCost: 0,
      deposit: 0,
      status: 'received',
      technicianName: '',
      notes: ''
    }
  });

  useEffect(() => {
    if (editingOrder) {
      reset({
        customerName: editingOrder.customerName,
        customerPhone: editingOrder.customerPhone,
        deviceType: editingOrder.deviceType,
        deviceBrand: editingOrder.deviceBrand || '',
        deviceModel: editingOrder.deviceModel,
        deviceSerial: editingOrder.deviceSerial || '',
        devicePassword: editingOrder.devicePassword || '',
        maintenanceType: editingOrder.maintenanceType || '',
        specifications: editingOrder.specifications || '',
        issueDescription: editingOrder.issueDescription,
        deviceAttachments: editingOrder.deviceAttachments || '',
        expectedCost: editingOrder.expectedCost || 0,
        actualCost: editingOrder.actualCost || 0,
        deposit: editingOrder.deposit || 0,
        status: editingOrder.status,
        technicianName: editingOrder.technicianName || '',
        notes: editingOrder.notes || ''
      });
    } else {
      reset({
        customerName: '',
        customerPhone: '',
        deviceType: '',
        deviceBrand: '',
        deviceModel: '',
        deviceSerial: '',
        devicePassword: '',
        maintenanceType: '',
        specifications: '',
        issueDescription: '',
        deviceAttachments: '',
        expectedCost: 0,
        actualCost: 0,
        deposit: 0,
        status: 'received',
        technicianName: '',
        notes: ''
      });
    }
  }, [editingOrder, reset]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-slate-800">
              {editingOrder ? 'تعديل أمر صيانة' : 'استلام جهاز جديد'}
            </h2>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              title="إعدادات خيارات الصيانة"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Info */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 border-b pb-2">بيانات العميل</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم العميل *</label>
                <input 
                  type="text" 
                  {...register('customerName')}
                  className={`w-full px-4 py-2 border ${errors.customerName ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-brand-500 outline-none`}
                />
                {errors.customerName && <p className="text-red-500 text-xs mt-1">{errors.customerName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف *</label>
                <input 
                  type="tel" 
                  {...register('customerPhone')}
                  className={`w-full px-4 py-2 border ${errors.customerPhone ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-brand-500 outline-none`}
                />
                {errors.customerPhone && <p className="text-red-500 text-xs mt-1">{errors.customerPhone.message}</p>}
              </div>
            </div>

            {/* Device Info */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-700 border-b pb-2">بيانات الجهاز</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">نوع الجهاز *</label>
                  <select
                    {...register('deviceType')}
                    className={`w-full px-4 py-2 border ${errors.deviceType ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-brand-500 outline-none`}
                  >
                    <option value="">اختر نوع الجهاز...</option>
                    {maintenanceSettings.deviceTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.deviceType && <p className="text-red-500 text-xs mt-1">{errors.deviceType.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الشركة المصنعة</label>
                  <select
                    {...register('deviceBrand')}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="">اختر الشركة...</option>
                    {maintenanceSettings.deviceBrands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الموديل *</label>
                  <input 
                    type="text" 
                    list="deviceModels"
                    {...register('deviceModel')}
                    className={`w-full px-4 py-2 border ${errors.deviceModel ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-brand-500 outline-none`}
                  />
                  <datalist id="deviceModels">
                    {maintenanceSettings.deviceModels.map(model => (
                      <option key={model} value={model} />
                    ))}
                  </datalist>
                  {errors.deviceModel && <p className="text-red-500 text-xs mt-1">{errors.deviceModel.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الرقم التسلسلي (اختياري)</label>
                  <input 
                    type="text" 
                    {...register('deviceSerial')}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الرقم السري للجهاز</label>
                <input 
                  type="text" 
                  {...register('devicePassword')}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Issue Details */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="font-bold text-slate-700 border-b pb-2">تفاصيل الصيانة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">نوع الصيانة</label>
                  <select
                    {...register('maintenanceType')}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="">اختر نوع الصيانة...</option>
                    {maintenanceSettings.maintenanceTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المواصفات</label>
                  <input 
                    type="text" 
                    placeholder="لون، سعة التخزين، الرام..."
                    {...register('specifications')}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">وصف العطل *</label>
                <textarea 
                  rows={3}
                  {...register('issueDescription')}
                  className={`w-full px-4 py-2 border ${errors.issueDescription ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none`}
                ></textarea>
                {errors.issueDescription && <p className="text-red-500 text-xs mt-1">{errors.issueDescription.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">المرفقات المستلمة مع الجهاز</label>
                <input 
                  type="text" 
                  placeholder="شاحن، حقيبة، كابل..."
                  {...register('deviceAttachments')}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Financials & Status */}
            <div className="space-y-4 md:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">التكلفة المتوقعة</label>
                  <input 
                    type="number" 
                    step="any"
                    {...register('expectedCost', { valueAsNumber: true })}
                    className={`w-full px-4 py-2 border ${errors.expectedCost ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-brand-500 outline-none`}
                  />
                  {errors.expectedCost && <p className="text-red-500 text-xs mt-1">{errors.expectedCost.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المدفوع (عربون)</label>
                  <input 
                    type="number" 
                    step="any"
                    {...register('deposit', { valueAsNumber: true })}
                    className={`w-full px-4 py-2 border ${errors.deposit ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-brand-500 outline-none`}
                  />
                  {errors.deposit && <p className="text-red-500 text-xs mt-1">{errors.deposit.message}</p>}
                </div>
                {editingOrder && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">التكلفة الفعلية</label>
                      <input 
                        type="number" 
                        step="any"
                        {...register('actualCost', { valueAsNumber: true })}
                        className={`w-full px-4 py-2 border ${errors.actualCost ? 'border-red-500' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-brand-500 outline-none`}
                      />
                      {errors.actualCost && <p className="text-red-500 text-xs mt-1">{errors.actualCost.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">اسم الفني</label>
                      <select 
                        {...register('technicianName')}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                      >
                        <option value="">-- اختر الفني --</option>
                        {users.map(user => (
                          <option key={user.id} value={user.name}>{user.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {editingOrder && (
            <>
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 border-b pb-2">حالة الطلب</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2">
                  {Object.entries(statusMap).map(([key, value]) => (
                    <label 
                      key={key}
                      className={`
                        flex flex-col items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all text-center
                        has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50
                        hover:bg-slate-50
                      `}
                    >
                      <input 
                        type="radio" 
                        value={key}
                        {...register('status')}
                        className="sr-only"
                      />
                      <div className={`text-${value.color.split(' ')[1]} mb-1`}>
                        {value.icon}
                      </div>
                      <span className="text-xs font-bold text-slate-700">{value.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 border-b pb-2">قطع الغيار المستخدمة</h3>
                
                {/* Add Part Form */}
                <div className="flex gap-2 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-500 mb-1">اسم القطعة (اختر من المخزون)</label>
                    <input 
                      type="text" 
                      list="inventoryProducts"
                      value={newPart.name || ''}
                      onChange={e => {
                         const val = e.target.value;
                         const matchingProduct = products?.find(p => p.name === val);
                         if (matchingProduct) {
                             setNewPart({...newPart, name: val, price: matchingProduct.price});
                         } else {
                             setNewPart({...newPart, name: val});
                         }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                    />
                    <datalist id="inventoryProducts">
                       {products?.map(p => <option key={p.id} value={p.name} />)}
                    </datalist>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-slate-500 mb-1">الكمية</label>
                    <input 
                      type="number" 
                      min="1"
                      value={newPart.quantity || ''}
                      onChange={e => setNewPart({...newPart, quantity: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium text-slate-500 mb-1">السعر</label>
                    <input 
                      type="number" 
                      min="0"
                      value={newPart.price || ''}
                      onChange={e => setNewPart({...newPart, price: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-brand-500"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                        handleAddPart();
                        const currentCost = getValues('actualCost') || 0;
                        const partCost = (newPart.price || 0) * (newPart.quantity || 1);
                        setValue('actualCost', currentCost + partCost);
                    }}
                    disabled={!newPart.name || !newPart.price || !newPart.quantity}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    إضافة
                  </button>
                </div>

                {/* Parts List */}
                {orderParts.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm text-right">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-2 font-medium">القطعة</th>
                          <th className="px-4 py-2 font-medium w-24">الكمية</th>
                          <th className="px-4 py-2 font-medium w-24">السعر</th>
                          <th className="px-4 py-2 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {orderParts.map((part, index) => (
                          <tr key={index} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-medium text-slate-700">{part.name}</td>
                            <td className="px-4 py-2 text-slate-600">{part.quantity}</td>
                            <td className="px-4 py-2 text-slate-600">{part.price}</td>
                            <td className="px-4 py-2">
                              <button 
                                type="button"
                                onClick={() => {
                                  const currentCost = getValues('actualCost') || 0;
                                  const removedPartCost = (part.price || 0) * (part.quantity || 1);
                                  setValue('actualCost', Math.max(0, currentCost - removedPartCost));
                                  handleRemovePart(index);
                                }}
                                className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات الفني (داخلية)</label>
                <textarea 
                  rows={2}
                  {...register('notes')}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? <Settings className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {editingOrder ? 'حفظ التغييرات' : 'استلام الجهاز'}
            </button>
          </div>
        </form>
      </div>
      {showSettings && (
        <MaintenanceSettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default MaintenanceModal;
