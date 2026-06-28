import React from 'react';
import { TrendingUp, AlertTriangle, Globe, Activity, ArrowUpRight } from 'lucide-react';

const MarketMonitorKPIs: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">مؤشر أسعار الشحن</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">+15.2%</h3>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
          <ArrowUpRight className="w-4 h-4" />
          تأثير سلبي على التكلفة
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">الطلب على المواد الأساسية</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">+8.5%</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
        </div>
        <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
          <ArrowUpRight className="w-4 h-4" />
          فرصة لزيادة المبيعات
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">مؤشر استقرار العملة</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">متذبذب</h3>
          </div>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Activity className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        <p className="text-sm text-yellow-600 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          ينصح بتحديث الأسعار يومياً
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">توقعات التضخم</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">4.2%</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
          <ArrowUpRight className="w-4 h-4" />
          خلال الربع القادم
        </p>
      </div>
    </div>
  );
};

export default MarketMonitorKPIs;
