import React from 'react';
import { Globe, Activity } from 'lucide-react';

const MarketMonitorHeader: React.FC = () => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Globe className="w-8 h-8 text-indigo-600" />
          مراقبة السوق والتنبؤات (AI)
        </h1>
        <p className="text-gray-500 mt-1">
          نظام ذكي لمراقبة الأسواق العالمية والمحلية وربطها بالمبيعات والتنبؤ بتغيرات الأسعار.
        </p>
      </div>
      <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg border border-indigo-100">
        <Activity className="w-5 h-5 animate-pulse" />
        <span className="font-medium">النظام متصل ويراقب البيانات</span>
      </div>
    </div>
  );
};

export default MarketMonitorHeader;
