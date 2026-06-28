const fs = require('fs');
const path = require('path');

const generateCrudPage = (title, moduleName, tableName, fields) => {
  const initialData = {};
  fields.forEach(f => initialData[f.name] = f.default);

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
    // Basic search across all string values
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
  // School
  { dir: 'school', name: 'Students', title: 'شؤون الطلاب', table: 'schoolStudents', fields: [ {name: 'name', label: 'اسم الطالب', type: 'text', default: ''}, {name: 'grade', label: 'المرحلة/الصف', type: 'text', default: ''}, {name: 'parentPhone', label: 'ولي الأمر', type: 'text', default: ''}, {name: 'status', label: 'الحالة', type: 'text', default: 'منتظم'} ] },
  { dir: 'school', name: 'Teachers', title: 'المعلمون', table: 'schoolTeachers', fields: [ {name: 'name', label: 'اسم المعلم', type: 'text', default: ''}, {name: 'subject', label: 'التخصص', type: 'text', default: ''}, {name: 'phone', label: 'الهاتف', type: 'text', default: ''}, {name: 'status', label: 'الحالة', type: 'text', default: 'نشط'} ] },
  { dir: 'school', name: 'Classes', title: 'إدارة الفصول', table: 'schoolClassesList', fields: [ {name: 'name', label: 'اسم الفصل', type: 'text', default: ''}, {name: 'grade', label: 'المرحلة', type: 'text', default: ''}, {name: 'capacity', label: 'السعة', type: 'number', default: '30'}, {name: 'teacherId', label: 'معلم الفصل (رائد)', type: 'text', default: ''} ] },
  { dir: 'school', name: 'Attendance', title: 'سجل الحضور', table: 'schoolAttendanceList', fields: [ {name: 'studentId', label: 'اسم الطالب', type: 'text', default: ''}, {name: 'date', label: 'التاريخ', type: 'date', default: ''}, {name: 'status', label: 'الحالة (حاضر / غائب)', type: 'text', default: 'حاضر'} ] },
  { dir: 'school', name: 'Grades', title: 'النتائج والدرجات', table: 'schoolGradesList', fields: [ {name: 'studentId', label: 'اسم الطالب', type: 'text', default: ''}, {name: 'subject', label: 'المادة', type: 'text', default: ''}, {name: 'score', label: 'الدرجة', type: 'number', default: '0'}, {name: 'term', label: 'الفصل الدراسي', type: 'text', default: 'الأول'} ] },

  // Garage
  { dir: 'garage', name: 'Jobs', title: 'أوامر الشغل', table: 'garageJobsList', fields: [ {name: 'vehicleId', label: 'رقم اللوحة', type: 'text', default: ''}, {name: 'description', label: 'وصف العطل', type: 'text', default: ''}, {name: 'estimatedCost', label: 'التكلفة التقديرية', type: 'number', default: '0'}, {name: 'status', label: 'الحالة', type: 'text', default: 'قيد الانتظار'} ] },
  { dir: 'garage', name: 'Vehicles', title: 'سجل المركبات', table: 'garageVehiclesList', fields: [ {name: 'plateNumber', label: 'رقم اللوحة', type: 'text', default: ''}, {name: 'make', label: 'الشركة', type: 'text', default: ''}, {name: 'model', label: 'الموديل', type: 'text', default: ''}, {name: 'customerId', label: 'العميل', type: 'text', default: ''} ] },
  { dir: 'garage', name: 'Technicians', title: 'الفنيون', table: 'garageTechniciansList', fields: [ {name: 'name', label: 'اسم الفني', type: 'text', default: ''}, {name: 'specialization', label: 'التخصص', type: 'text', default: ''}, {name: 'phone', label: 'رقم الجوال', type: 'text', default: ''}, {name: 'status', label: 'الحالة', type: 'text', default: 'متاح'} ] },

  // Gym
  { dir: 'gym', name: 'Memberships', title: 'إدارة الاشتراكات', table: 'gymMembershipsList', fields: [ {name: 'memberId', label: 'اسم المشترك', type: 'text', default: ''}, {name: 'plan', label: 'نوع الاشتراك', type: 'text', default: 'شهري'}, {name: 'startDate', label: 'تاريخ البدء', type: 'date', default: ''}, {name: 'endDate', label: 'تاريخ الانتهاء', type: 'date', default: ''}, {name: 'status', label: 'الحالة', type: 'text', default: 'فعال'} ] },
  { dir: 'gym', name: 'Classes', title: 'حصص التدريب', table: 'gymClassesList', fields: [ {name: 'name', label: 'اسم الحصة', type: 'text', default: ''}, {name: 'trainerId', label: 'اسم المدرب', type: 'text', default: ''}, {name: 'schedule', label: 'الموعد', type: 'text', default: ''}, {name: 'capacity', label: 'السعة القصوى', type: 'number', default: '20'} ] },
  { dir: 'gym', name: 'Trainers', title: 'المدربون', table: 'gymTrainersList', fields: [ {name: 'name', label: 'اسم المدرب', type: 'text', default: ''}, {name: 'specialization', label: 'التخصص', type: 'text', default: ''}, {name: 'phone', label: 'الهاتف', type: 'text', default: ''}, {name: 'status', label: 'الحالة', type: 'text', default: 'متاح'} ] },

  // Hotel
  { dir: 'hotel', name: 'Reservations', title: 'الحجوزات', table: 'hotelReservations', fields: [ {name: 'customerName', label: 'اسم النزيل', type: 'text', default: ''}, {name: 'roomNumber', label: 'رقم الغرفة', type: 'text', default: ''}, {name: 'checkIn', label: 'تسجيل الدخول', type: 'date', default: ''}, {name: 'checkOut', label: 'تسجيل الخروج', type: 'date', default: ''}, {name: 'status', label: 'الحالة', type: 'text', default: 'مؤكد'} ] },
  { dir: 'hotel', name: 'Rooms', title: 'إدارة الغرف', table: 'hotelRoomsList', fields: [ {name: 'roomNumber', label: 'رقم الغرفة', type: 'text', default: ''}, {name: 'type', label: 'نوع الغرفة', type: 'text', default: 'مفردة'}, {name: 'capacity', label: 'السعة', type: 'number', default: '1'}, {name: 'status', label: 'حالة الغرفة', type: 'text', default: 'متاحة'} ] },
  { dir: 'hotel', name: 'Housekeeping', title: 'إدارة النظافة', table: 'hotelHousekeepingList', fields: [ {name: 'roomNumber', label: 'رقم الغرفة', type: 'text', default: ''}, {name: 'task', label: 'المهمة', type: 'text', default: 'تنظيف يومي'}, {name: 'assignedTo', label: 'الموظف المسؤول', type: 'text', default: ''}, {name: 'status', label: 'الحالة', type: 'text', default: 'قيد التنفيذ'} ] },
  
  // Purchases
  { dir: 'purchases', name: 'SupplierEvaluation', title: 'تقييم الموردين', table: 'supplierEvaluations', fields: [ {name: 'supplierId', label: 'اسم المورد', type: 'text', default: ''}, {name: 'date', label: 'التاريخ', type: 'date', default: ''}, {name: 'score', label: 'التقييم (من 10)', type: 'number', default: '10'}, {name: 'notes', label: 'ملاحظات', type: 'text', default: ''} ] },
];

for (const p of pagesToUpdate) {
   const dirPath = path.join(__dirname, 'pages', p.dir);
   const filePath = path.join(dirPath, p.name + '.tsx');
   
   if (fs.existsSync(filePath)) {
      const content = generateCrudPage(p.title, p.name, p.table, p.fields);
      fs.writeFileSync(filePath, content);
   } else {
      console.log('Skipping missing file: ' + filePath);
   }
}

console.log('Successfully upgraded rest of structural pages 2!');
