const fs = require('fs');
const path = require('path');

const generatePage = (title, moduleName) => `import React from 'react';
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react';

export const ${moduleName} = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">${title}</h1>
          <p className="text-slate-500">إدارة سجلات ${title}</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
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
              placeholder="بحث في ${title}..." 
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Filter className="w-5 h-5 text-slate-500" />
            <span>تصفية النتائج</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 text-right">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">المعرف</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الاسم / البيان</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">الحالة</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">تاريخ الإضافة</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {[1].map((item) => (
                <tr key={item} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-600">#${moduleName.slice(0,3).toUpperCase()}-{item}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-800">بيانات تجريبية {item}</div>
                    <div className="text-sm text-slate-500">تفاصيل إضافية عن السجل المرجعي</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      نشط
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">2026/05/0{item}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="text-slate-400 hover:text-indigo-600">
                      <MoreHorizontal className="w-5 h-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
           <span className="text-sm text-slate-500">عرض 1 إلى 1 من أصل 50 سجل</span>
           <div className="flex gap-2">
             <button className="px-3 py-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50" disabled>السابق</button>
             <button className="px-3 py-1 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50">التالي</button>
           </div>
        </div>
      </div>
    </div>
  );
};
`;

const newPages = {
  school: {
    fees: { title: 'الرسوم المدرسية', name: 'SchoolFees' },
    timetable: { title: 'الجدول الدراسي', name: 'Timetable' },
    transport: { title: 'حافلات المدرسة', name: 'Transport' },
    library: { title: 'المكتبة المدرسية', name: 'Library' }
  },
  garage: {
    'spare-parts': { title: 'قطع الغيار', name: 'SpareParts' },
    invoices: { title: 'فواتير الصيانة', name: 'GarageInvoices' },
    appointments: { title: 'حجز المواعيد', name: 'GarageAppointments' }
  },
  gym: {
    equipment: { title: 'صيانة الأجهزة', name: 'Equipment' },
    store: { title: 'مبيعات الجيم', name: 'GymStore' },
    'access-control': { title: 'سجل الدخول والخروج', name: 'AccessControl' }
  },
  hotel: {
    billing: { title: 'فواتير النزلاء', name: 'HotelBilling' },
    dining: { title: 'مطعم الفندق', name: 'HotelDining' },
    services: { title: 'الخدمات الإضافية', name: 'HotelServices' }
  }
};

for (const moduleName of Object.keys(newPages)) {
  const modulePages = newPages[moduleName];
  const dirPath = path.join(__dirname, 'pages', moduleName);
  
  let indexContent = fs.readFileSync(path.join(dirPath, 'index.tsx'), 'utf8');

  for (const pageKey of Object.keys(modulePages)) {
    const pageData = modulePages[pageKey];
    let fileName = pageData.name + '.tsx';
    
    fs.writeFileSync(path.join(dirPath, fileName), generatePage(pageData.title, pageData.name));
    
    if (!indexContent.includes(pageData.name)) {
      indexContent += `\nexport * from "./${pageData.name}";`;
    }
  }

  fs.writeFileSync(path.join(dirPath, 'index.tsx'), indexContent.replace(/\n\n+/g, '\n'));
}

console.log('Finished completing pages');
