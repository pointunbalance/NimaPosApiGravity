const fs = require('fs');
const path = require('path');

const generateCrudPage = (title, moduleName, tableName, fields) => {
  const initialData = {};
  fields.forEach(f => {
    if (f.default !== undefined) initialData[f.name] = f.default;
  });

  return `import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Edit2, Trash2, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

export const ${moduleName} = () => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState(${JSON.stringify(initialData, null, 2)});

  const records = useLiveQuery(() => db.${tableName}.toArray()) || [];

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
      setFormData(${JSON.stringify(initialData)});
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEdit && currentId) {
        await db.${tableName}.update(currentId, formData);
      } else {
        await db.${tableName}.add(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('هل أنت متأكد من الحذف؟')) {
      await db.${tableName}.delete(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">${title}</h1>
          <p className="text-slate-500">إدارة سجلات ${title}</p>
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
              placeholder="بحث في ${title}..." 
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 text-right">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">المعرف</th>
${fields.map(f => `                <th className="px-6 py-4 text-sm font-semibold text-slate-600">${f.label}</th>`).join('\n')}
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length === 0 ? (
                 <tr>
                   <td colSpan={${fields.length + 2}} className="px-6 py-8 text-center text-slate-500">
                     لا توجد سجلات. أضف سجل جديد للبدء.
                   </td>
                 </tr>
              ) : filteredRecords.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-600">#{item.id}</td>
${fields.map(f => `                  <td className="px-6 py-4 text-sm text-slate-800">{item.${f.name}}</td>`).join('\n')}
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
${fields.map(f => `              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">${f.label}</label>
                <input 
                  type="${f.type}" 
                  value={formData.${f.name}}
                  onChange={(e) => setFormData({...formData, ${f.name}: e.target.value})}
                  required
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>`).join('\n')}
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
};

const pagesToUpdate = [
  { dir: 'clinics', name: 'ClinicBilling', title: 'فواتير العيادة', table: 'clinicInvoices', fields: [ {name: 'patientName', label: 'اسم المريض', type: 'text', default: ''}, {name: 'service', label: 'الخدمة الطبية', type: 'text', default: ''}, {name: 'amount', label: 'المبلغ', type: 'number', default: '0'}, {name: 'date', label: 'التاريخ', type: 'date', default: ''}, {name: 'status', label: 'الحالة', type: 'text', default: 'مدفوع'} ] },
  { dir: 'clinics', name: 'ClinicInventory', title: 'المستلزمات الطبية (المخزن)', table: 'clinicInventoryItems', fields: [ {name: 'itemName', label: 'اسم الصنف', type: 'text', default: ''}, {name: 'category', label: 'التصنيف', type: 'text', default: ''}, {name: 'stockAmount', label: 'الكمية المتوفرة', type: 'number', default: '0'}, {name: 'expiryDate', label: 'تاريخ الصلاحية', type: 'date', default: ''} ] },
  { dir: 'clinics', name: 'ClinicServices', title: 'الخدمات والأسعار', table: 'clinicServicesList', fields: [ {name: 'name', label: 'اسم الخدمة', type: 'text', default: ''}, {name: 'category', label: 'القسم', type: 'text', default: ''}, {name: 'price', label: 'السعر', type: 'number', default: '0'}, {name: 'status', label: 'الحالة', type: 'text', default: 'متاح'} ] },
  { dir: 'clinics', name: 'ClinicInsurance', title: 'شركات التأمين', table: 'clinicInsuranceCompanies', fields: [ {name: 'name', label: 'اسم الشركة', type: 'text', default: ''}, {name: 'contactPerson', label: 'مسؤول التواصل', type: 'text', default: ''}, {name: 'phone', label: 'رقم الهاتف', type: 'text', default: ''}, {name: 'discountRate', label: 'نسبة الخصم / التحمل (%)', type: 'number', default: '0'} ] },
];

for (const p of pagesToUpdate) {
   const dirPath = path.join(__dirname, 'pages', p.dir);
   const filePath = path.join(dirPath, p.name + '.tsx');
   
   const content = generateCrudPage(p.title, p.name, p.table, p.fields);
   fs.writeFileSync(filePath, content);
}

console.log('Successfully created clinic structural pages!');
