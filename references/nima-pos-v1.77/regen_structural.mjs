import fs from 'fs';
import path from 'path';

const pages = [
  { path: 'pages/gym/AccessControl.tsx', table: 'gymAccessLogs', title: 'سجل الدخول', icon: 'ShieldCheck', fields: [
    { name: 'memberId', label: 'معرف العضو', type: 'text' },
    { name: 'timestamp', label: 'التاريخ/الوقت', type: 'date' },
    { name: 'type', label: 'النوع (دخول/خروج)', type: 'text' }
  ] },
  { path: 'pages/gym/Equipment.tsx', table: 'gymEquipment', title: 'صيانة الأجهزة', icon: 'Wrench', fields: [
    { name: 'name', label: 'اسم الجهاز', type: 'text' },
    { name: 'type', label: 'النوع', type: 'text' },
    { name: 'status', label: 'الحالة', type: 'text' },
    { name: 'lastMaintenance', label: 'آخر صيانة', type: 'date' }
  ] },
  { path: 'pages/gym/GymStore.tsx', table: 'gymStoreItems', title: 'مبيعات الجيم', icon: 'ShoppingCart', fields: [
    { name: 'name', label: 'الاسم', type: 'text' },
    { name: 'price', label: 'السعر', type: 'number' },
    { name: 'stock', label: 'المخزون', type: 'number' }
  ] },
  { path: 'pages/school/Library.tsx', table: 'schoolLibrary', title: 'المكتبة المدرسية', icon: 'BookOpen', fields: [
    { name: 'title', label: 'العنوان', type: 'text' },
    { name: 'author', label: 'المؤلف', type: 'text' },
    { name: 'isbn', label: 'رقم الايداع', type: 'text' },
    { name: 'status', label: 'الحالة', type: 'text' }
  ] },
  { path: 'pages/school/Transport.tsx', table: 'schoolTransport', title: 'حافلات المدرسة', icon: 'Truck', fields: [
    { name: 'busNumber', label: 'رقم الحافلة', type: 'text' },
    { name: 'driverId', label: 'معرف السائق', type: 'text' },
    { name: 'route', label: 'المسار', type: 'text' },
    { name: 'status', label: 'الحالة', type: 'text' }
  ] },
  { path: 'pages/school/Timetable.tsx', table: 'schoolTimetable', title: 'الجدول الدراسي', icon: 'CalendarDays', fields: [
    { name: 'classId', label: 'رقم الفصل', type: 'text' },
    { name: 'subject', label: 'المادة', type: 'text' },
    { name: 'teacherId', label: 'معرف المعلم', type: 'text' },
    { name: 'day', label: 'اليوم', type: 'text' },
    { name: 'time', label: 'الوقت', type: 'text' }
  ] },
  { path: 'pages/hotel/HotelBilling.tsx', table: 'hotelBilling', title: 'فواتير النزلاء', icon: 'FileText', fields: [
    { name: 'reservationId', label: 'رقم الحجز', type: 'text' },
    { name: 'amount', label: 'المبلغ', type: 'number' },
    { name: 'date', label: 'التاريخ', type: 'date' },
    { name: 'status', label: 'الحالة (paid/pending)', type: 'text' }
  ], hasFinance: true },
  { path: 'pages/hotel/HotelDining.tsx', table: 'hotelDiningOrders', title: 'مطعم الفندق', icon: 'Coffee', fields: [
    { name: 'roomNumber', label: 'رقم الغرفة', type: 'text' },
    { name: 'amount', label: 'المبلغ', type: 'number' },
    { name: 'date', label: 'التاريخ', type: 'date' },
    { name: 'status', label: 'الحالة (paid/pending)', type: 'text' }
  ], hasFinance: true },
  { path: 'pages/hotel/HotelServices.tsx', table: 'hotelServicesList', title: 'الخدمات الإضافية', icon: 'Settings', fields: [
    { name: 'name', label: 'الاسم', type: 'text' },
    { name: 'price', label: 'السعر', type: 'number' },
    { name: 'type', label: 'النوع', type: 'text' },
    { name: 'status', label: 'الحالة', type: 'text' }
  ] },
  { path: 'pages/garage/GarageInvoices.tsx', table: 'garageInvoices', title: 'فواتير الصيانة', icon: 'FileText', fields: [
    { name: 'customerId', label: 'رقم العميل', type: 'text' },
    { name: 'date', label: 'التاريخ', type: 'date' },
    { name: 'amount', label: 'المبلغ', type: 'number' },
    { name: 'status', label: 'الحالة (paid/pending)', type: 'text' }
  ], hasFinance: true },
  { path: 'pages/garage/GarageAppointments.tsx', table: 'garageAppointments', title: 'حجز المواعيد', icon: 'CalendarClock', fields: [
    { name: 'customerId', label: 'رقم العميل', type: 'text' },
    { name: 'vehicleId', label: 'رقم السيارة', type: 'text' },
    { name: 'date', label: 'التاريخ', type: 'date' },
    { name: 'status', label: 'الحالة', type: 'text' }
  ] },
  { path: 'pages/garage/SpareParts.tsx', table: 'garageSpareParts', title: 'قطع الغيار', icon: 'Settings', fields: [
    { name: 'name', label: 'الاسم', type: 'text' },
    { name: 'partNumber', label: 'رقم القطعة', type: 'text' },
    { name: 'price', label: 'السعر', type: 'number' },
    { name: 'stock', label: 'الكمية', type: 'number' }
  ] },
];

for (const p of pages) {
  const componentName = path.basename(p.path, '.tsx');
  
  const stateInitialFields = p.fields.reduce((acc, f) => {
     if(f.name === 'status' && p.hasFinance) acc[f.name] = "'paid'";
     else if(f.type === 'number') acc[f.name] = 0;
     else acc[f.name] = "''";
     return acc;
  }, {});
  
  const financeImports = p.hasFinance ? `\nimport { AccountingEngine } from '../../services/AccountingEngine';` : '';
  const financeLogic = p.hasFinance ? `
      // Effect on Accounting System
      if (formData.status === 'paid' && Number(formData.amount) > 0) {
        const cashAcc = await db.accounts.where('code').equals('1010').first(); // Cash
        const revenueAcc = await db.accounts.where('code').equals('4010').first(); // Revenue Defaults
        if (cashAcc && revenueAcc) {
          await AccountingEngine.postEntry({
            date: new Date(),
            reference: \`AUTH-\${Math.floor(Math.random()*10000)}\`,
            description: \`تسوية مالية (\${formData.status}) - قسم ${componentName}\`,
            lines: [
              { accountId: cashAcc.id!, accountName: cashAcc.name, debit: Number(formData.amount), credit: 0, description: 'تحصيل' },
              { accountId: revenueAcc.id!, accountName: revenueAcc.name, debit: 0, credit: Number(formData.amount), description: 'إيراد' }
            ]
          });
        }
      }
` : '';

  const content = `import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Edit2, Trash2, X, ${p.icon} } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';${financeImports}

export const ${componentName} = () => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    ${Object.entries(stateInitialFields).map(([k, v]) => `${k}: ${v}`).join(',\n    ')}
  });

  const records = useLiveQuery(() => db.${p.table}.toArray()) || [];

  const filteredRecords = records.filter((item: any) => {
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleOpenModal = (editMode = false, item: any = null) => {
    setIsEdit(editMode);
    if (editMode && item) {
      setCurrentId(item.id!);
      setFormData({...item});
    } else {
      setCurrentId(null);
      setFormData({
        ${Object.entries(stateInitialFields).map(([k, v]) => `${k}: ${v}`).join(',\n        ')}
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && currentId) {
        await db.${p.table}.update(currentId, formData);
      } else {
        await db.${p.table}.add(formData);
        ${financeLogic.replace(/\n      /g, '\n        ')}
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      await db.${p.table}.delete(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">${p.title}</h1>
          <p className="text-slate-500">إدارة سجلات ${p.title}</p>
        </div>
        <button 
          onClick={() => handleOpenModal(false)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus className="w-5 h-5" />
          <span>إضافة جديد</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في ${p.title}..." 
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 text-right">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">المعرف</th>
                ${p.fields.map(f => `<th className="px-6 py-4 text-sm font-semibold text-slate-600">${f.label}</th>`).join('\n                ')}
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length === 0 ? (
                 <tr>
                   <td colSpan={${p.fields.length + 2}} className="px-6 py-8 text-center text-slate-500">
                     لا توجد سجلات. أضف سجل جديد للبدء.
                   </td>
                 </tr>
              ) : filteredRecords.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-600">#{item.id}</td>
                  ${p.fields.map(f => `<td className="px-6 py-4 text-sm text-slate-800">{item.${f.name}}</td>`).join('\n                  ')}
                  <td className="px-6 py-4 p-0">
                    <div className="flex justify-center items-center gap-2">
                       <button onClick={() => handleOpenModal(true, item)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">
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
                {isEdit ? 'تعديل السجل' : 'إضافة سجل جديد'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              ${p.fields.map(f => `<div>
                <label className="block text-sm font-medium text-slate-700 mb-1">${f.label}</label>
                <input 
                  type="${f.type}" 
                  ${f.type === 'number' ? 'min="0" step="0.01"' : ''}
                  value={formData.${f.name}}
                  onChange={(e) => setFormData({...formData, ${f.name}: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>`).join('\n              ')}
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
`;
  
  fs.writeFileSync(p.path, content);
}
