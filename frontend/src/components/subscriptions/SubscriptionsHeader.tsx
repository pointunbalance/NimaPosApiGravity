import React from 'react';
import { Repeat, Plus, RefreshCw } from 'lucide-react';

interface SubscriptionsHeaderProps {
  onOpenModal: () => void;
  onProcessRenewals?: () => void;
}

const SubscriptionsHeader: React.FC<SubscriptionsHeaderProps> = ({ onOpenModal, onProcessRenewals }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <Repeat size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الاشتراكات</h1>
          <p className="text-slate-500 text-sm mt-1">إدارة اشتراكات العملاء المتكررة</p>
        </div>
      </div>
      <div className="flex gap-2">
        {onProcessRenewals && (
           <button
             onClick={onProcessRenewals}
             className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
           >
             <RefreshCw className="w-4 h-4" />
             تجديد المستحق
           </button>
        )}
        <button
          onClick={onOpenModal}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          إضافة اشتراك
        </button>
      </div>
    </div>
  );
};

export default SubscriptionsHeader;
