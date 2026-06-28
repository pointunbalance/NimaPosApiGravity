import React from 'react';
import { CreditCard, History } from 'lucide-react';

const GiftCardsSidebar: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          التحقق من الرصيد
        </h3>
        <p className="text-indigo-100 text-sm mb-4">
          قم بمسح أو إدخال رقم البطاقة للتحقق من رصيدها الحالي.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="رقم البطاقة"
            className="w-full px-4 py-2 bg-white/20 border border-white/30 text-white placeholder-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-white flex-1"
          />
          <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-slate-50 font-medium transition-colors">
            تحقق
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-500" />
          النشاط الأخير
        </h3>
        <div className="space-y-4">
          <p className="text-sm text-slate-500 text-center py-4">لا يوجد نشاط أخير</p>
        </div>
      </div>
    </div>
  );
};

export default GiftCardsSidebar;
