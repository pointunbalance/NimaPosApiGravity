import React, { useState } from 'react';
import { Building2, Plus, Search, MapPin, DollarSign, Users, Home, Edit, Trash2, CheckCircle2, XCircle, Wrench } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Property } from '../types';
import PropertyModal from '../components/properties/PropertyModal';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';

export const PropertyManagement: React.FC = () => {
  const { success, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; propertyId: number } | null>(null);

  const properties = useLiveQuery(() => db.properties.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const currencySymbol = settings?.currency || 'IQD';

  const filteredProperties = properties.filter(p => 
    p.name.includes(searchTerm) || (p.address && p.address.includes(searchTerm))
  );

  const handleOpenModal = (property?: Property) => {
    if (property) {
      setEditingProperty(property);
    } else {
      setEditingProperty(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProperty(null);
  };

  const handleSave = async (formData: Partial<Property>) => {
    try {
      if (editingProperty?.id) {
        await db.properties.update(editingProperty.id, formData);
        success('تم تحديث بيانات العقار بنجاح');
      } else {
        await db.properties.add({
          ...formData as Property,
          createdAt: new Date().toISOString()
        });
        success('تم إضافة العقار الجديد بنجاح');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving property:', error);
      showError('حدث خطأ أثناء حفظ العقار');
    }
  };

  const confirmDeleteProperty = (id: number) => {
    setConfirmConfig({ isOpen: true, propertyId: id });
  };

  const handleDelete = async () => {
    if (!confirmConfig) return;
    const id = confirmConfig.propertyId;
    try {
      await db.properties.delete(id);
      success('تم حذف العقار بنجاح');
    } catch (error) {
      console.error('Error deleting property:', error);
      showError('حدث خطأ أثناء حذف العقار');
    }
    setConfirmConfig(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': 
        return <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-black flex items-center gap-1 w-fit"><CheckCircle2 className="w-3.5 h-3.5" /> نشط</span>;
      case 'inactive': 
        return <span className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-full text-xs font-black flex items-center gap-1 w-fit"><XCircle className="w-3.5 h-3.5" /> غير نشط</span>;
      case 'maintenance': 
        return <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full text-xs font-black flex items-center gap-1 w-fit"><Wrench className="w-3.5 h-3.5" /> صيانة</span>;
      default: 
        return null;
    }
  };

  const getPropertyTypeName = (type: string) => {
    switch (type) {
      case 'building': return 'عمارة';
      case 'villa': return 'فيلا';
      case 'apartment': return 'شقة';
      case 'commercial': return 'تجاري';
      case 'land': return 'أرض';
      default: return 'عقار';
    }
  };

  const stats = {
    total: properties.length,
    totalUnits: properties.reduce((sum, p) => sum + (p.unitsCount || 0), 0),
    totalRentalValue: properties.reduce((sum, p) => sum + (p.rentalValue || 0), 0),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal'] min-h-screen rounded-2xl animate-in fade-in duration-350" dir="rtl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-xl border border-teal-100 shadow-sm">
            <Building2 className="w-8 h-8 stroke-[2]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">إدارة الممتلكات والعقارات</h1>
            <p className="text-slate-500 font-bold text-sm mt-1">تتبع العقارات، الإيجارات، وصيانة المباني وتوزيع نسب الإشغال</p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 font-black transition-all cursor-pointer active:scale-95 text-sm"
        >
          <Plus size={20} className="stroke-[2.5]" />
          <span>إضافة عقار جديد</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-indigo-100/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-500">إجمالي العقارات</p>
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
              <Home className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{stats.total}</h3>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-indigo-100/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-500">إجمالي الوحدات</p>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Users className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalUnits}</h3>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl shadow-sm border border-indigo-100/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-slate-500">إجمالي الإيرادات التقديرية</p>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <DollarSign className="w-5 h-5 stroke-[2]" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800 tracking-tight">
            {stats.totalRentalValue.toLocaleString()} <span className="text-sm text-slate-500 font-bold">{currencySymbol}</span>
          </h3>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-indigo-100/30 overflow-hidden">
        <div className="p-4 border-b border-indigo-50/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-500 stroke-[2]" size={18} />
            <input
              type="text"
              placeholder="البحث باسم العقار أو الموقع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-indigo-100/60 py-2.5 pr-10 pl-4 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm font-bold transition-all text-slate-800"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-indigo-50/50">
                <th className="p-4 text-slate-500 font-black text-xs">اسم العقار</th>
                <th className="p-4 text-slate-500 font-black text-xs">الموقع</th>
                <th className="p-4 text-slate-500 font-black text-xs">النوع</th>
                <th className="p-4 text-slate-500 font-black text-xs">الوحدات</th>
                <th className="p-4 text-slate-500 font-black text-xs">نسبة الإشغال</th>
                <th className="p-4 text-slate-500 font-black text-xs">الحالة</th>
                <th className="p-4 text-slate-500 font-black text-xs text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50/30">
              {filteredProperties.map((property) => {
                return (
                  <tr key={property.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg border border-teal-100">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <span className="font-black text-slate-800 text-sm">{property.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-bold text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{property.address || 'غير محدد'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black">
                        {getPropertyTypeName(property.type)}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-black text-sm">{property.unitsCount}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/40">
                          <div 
                            className={`h-full rounded-full ${property.occupancyRate > 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : property.occupancyRate > 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-rose-500 to-pink-500'}`}
                            style={{ width: `${property.occupancyRate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-600 font-black">{property.occupancyRate}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {getStatusBadge(property.status)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenModal(property)}
                          className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-lg border border-sky-100 transition-colors cursor-pointer"
                          title="تعديل"
                        >
                          <Edit className="w-4 h-4 stroke-[2]" />
                        </button>
                        <button 
                          onClick={() => confirmDeleteProperty(property.id!)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100 transition-colors cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4 stroke-[2]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProperties.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <Building2 size={56} className="mx-auto mb-4 text-teal-200 animate-pulse" />
                    <h3 className="text-base font-black text-slate-700 mb-1">لا توجد عقارات مسجلة حالياً</h3>
                    <p className="text-slate-500 text-xs font-bold">اضغط على "إضافة عقار جديد" للبدء بالبناء والتشغيل</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PropertyModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingProperty={editingProperty}
      />

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title="حذف العقار"
          message="هل أنت متأكد من حذف هذا العقار نهائياً؟ سيتم حذف جميع البيانات والوحدات التابعة له فوراً ولا يمكن استعادة هذه البيانات."
          onConfirm={handleDelete}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default PropertyManagement;
