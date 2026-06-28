const fs = require('fs');
const path = require('path');

const generateStaffPage = (title, moduleName, entityName, roles) => `import React from 'react';
import { Plus, Search, Filter, MoreHorizontal, UserCircle, Briefcase, FileText } from 'lucide-react';

export const ${moduleName} = () => {
  const rolesList = ${JSON.stringify(roles)};
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">إدارة موظفي ${title}</h1>
          <p className="text-slate-500">سجل وحسابات رواتب وأداء طاقم ${title}</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700">
          <Plus className="w-5 h-5" />
          <span>إضافة ${entityName} جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <UserCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">إجمالي الموظفين</p>
            <p className="text-xl font-bold text-slate-800">45</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">الموظفين على رأس العمل</p>
            <p className="text-xl font-bold text-slate-800">40</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">طلبات الإجازة / السلف</p>
            <p className="text-xl font-bold text-slate-800">5</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث باسم الموظف..." 
              className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select className="border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="">جميع التخصصات</option>
              {rolesList.map((role, idx) => (
                <option key={idx} value={role}>{role}</option>
              ))}
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
              <Filter className="w-5 h-5 text-slate-500" />
              <span>تصفية</span>
            </button>
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
              {[1, 2, 3, 4, 5].map((item) => (
                <tr key={item} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-600">EMP-{1000 + item}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-800">موظف تجريبي {item}</div>
                    <div className="text-sm text-slate-500">رقم الهاتف: 050000000{item}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{rolesList[item % rolesList.length]}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                      مداوم
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">4,500 ر.س</td>
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
      </div>
    </div>
  );
};
`;

const configs = [
  { moduleFolder: 'school', title: 'المدرسة', moduleName: 'SchoolStaff', entityName: 'موظف/إداري', roles: ['إداري', 'مشرف دور', 'أمن', 'عامل نظافة', 'محاسب', 'أخصائي اجتماعي', 'سائق حافلة'] },
  { moduleFolder: 'garage', title: 'الورشة', moduleName: 'GarageStaff', entityName: 'عامل/فني', roles: ['مدير ورشة', 'مهندس ميكانيكا', 'مهندس كهرباء', 'فني فحص', 'سمكري', 'مساعد فني', 'عامل غسيل'] },
  { moduleFolder: 'gym', title: 'النادي الرياضي', moduleName: 'GymStaff', entityName: 'موظف', roles: ['مدير فرع', 'كابتن صالة', 'كابتن شخصي', 'موظف استقبال', 'أخصائي تغذية', 'أخصائي علاج طبيعي', 'عامل نظافة'] },
  { moduleFolder: 'hotel', title: 'الفندق', moduleName: 'HotelStaff', entityName: 'موظف فندق', roles: ['مدير فندق', 'موظف استقبال', 'خدمة غرف (Housekeeping)', 'مدير مطعم/كافيه', 'طاهي', 'موظف أمن', 'حامل حقائب (Bellboy)'] },
  { moduleFolder: 'clinics', title: 'العيادات والمجمع الطبي', moduleName: 'ClinicStaff', entityName: 'عضو كادر طبي', roles: ['طبيب استشاري', 'طبيب أخصائي', 'طبيب عام', 'ممرض/ة', 'فني مختبر', 'أخصائي أشعة', 'موظف استقبال', 'مدير طبي'] },
  { moduleFolder: 'legal', title: 'المكتب القانوني', moduleName: 'LegalStaff', entityName: 'محامي/إداري', roles: ['محامي شريك', 'محامي متدرب', 'مستشار قانوني', 'سكرتير تنفيذي', 'مندوب محاكم', 'باحث قانوني', 'محاسب'] },
  { moduleFolder: 'manufacturing', title: 'المصنع', moduleName: 'ManufacturingStaff', entityName: 'عامل مصنع', roles: ['مدير إنتاج', 'مهندس جودة', 'مشرف وردية', 'فني صيانة آلات', 'مشغل ماكينة', 'عامل تعبئة وتغليف', 'أمين مستودع'] },
  { moduleFolder: 'restaurant', title: 'المطعم', moduleName: 'RestaurantStaff', entityName: 'طاقم المطعم', roles: ['مدير مطعم', 'شيف عمومي (Head Chef)', 'شيف قسم', 'مساعد طباخ', 'كاشير', 'مقدم طعام (Waiter)', 'عامل نظافة', 'مندوب توصيل'] },
  { moduleFolder: 'realestate', title: 'العقارات', moduleName: 'RealEstateStaff', entityName: 'موظف عقاري', roles: ['مدير أملاك', 'مسوق عقاري', 'محصل إيجارات', 'موظف استقبال', 'مشرف صيانة', 'محاسب', 'مندوب قانوني'] }
];

for (const Object_key of Object.keys(configs)) {
  const config = configs[Object_key];
  let dirPath = '';
  if (config.moduleFolder === 'restaurant' || config.moduleFolder === 'realestate') {
    dirPath = path.join(__dirname, 'pages');
  } else {
    dirPath = path.join(__dirname, 'pages', config.moduleFolder);
  }

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const fileName = config.moduleName + '.tsx';
  fs.writeFileSync(path.join(dirPath, fileName), generateStaffPage(config.title, config.moduleName, config.entityName, config.roles));

  if (config.moduleFolder !== 'restaurant' && config.moduleFolder !== 'realestate') {
    const indexPath = path.join(dirPath, 'index.tsx');
    if (fs.existsSync(indexPath)) {
      let indexContent = fs.readFileSync(indexPath, 'utf8');
      if (!indexContent.includes(config.moduleName)) {
        indexContent += `\nexport * from "./${config.moduleName}";`;
        fs.writeFileSync(indexPath, indexContent.replace(/\n\n+/g, '\n'));
      }
    } else {
      fs.writeFileSync(indexPath, `export * from "./${config.moduleName}";\n`);
    }
  }
}

console.log('Finished generating staff pages');
