import React from "react";

const CostAllocationTab: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 font-bold">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">أسس وإعدادات توزيع التكاليف</h2>
      </div>
      <div className="p-6">
        <p className="text-slate-500 mb-6 font-normal">
          قم بإعداد القواعد التي سيتم بناءً عليها توزيع التكاليف غير المباشرة على مراكز التكلفة
          والمنتجات.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-700">توزيع إيجار المصنع</h3>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-bold">
                نشط
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-3 font-normal">
              يتم التوزيع بناءً على المساحة المشغولة (المتر المربع) لكل خط إنتاج.
            </p>
            <div className="flex gap-2">
              <button className="text-sm text-indigo-600 hover:underline transition-all">
                تعديل القاعدة
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-700">توزيع فاتورة الكهرباء</h3>
              <span className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded-full font-bold">
                مسودة
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-3 font-normal">
              يتم التوزيع بناءً على ساعات تشغيل الآلات والمعدات المباشرة.
            </p>
            <div className="flex gap-2">
              <button className="text-sm text-indigo-600 hover:underline transition-all">
                تعديل القاعدة
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-bold text-sm shadow">
            إضافة قاعدة توزيع جديدة
          </button>
        </div>
      </div>
    </div>
  );
};

export default CostAllocationTab;
