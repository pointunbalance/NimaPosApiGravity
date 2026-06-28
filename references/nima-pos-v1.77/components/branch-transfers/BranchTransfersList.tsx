import React from 'react';
import { BranchTransfer } from '../../types';
import { ArrowLeftRight, Building2, Package, Calendar, Eye, Clock, Truck, CheckCircle2, XCircle } from 'lucide-react';

interface BranchTransfersListProps {
  filteredTransfers: BranchTransfer[];
  getWarehouseName: (id: number) => string;
  onViewTransfer: (transfer: BranchTransfer) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return (
        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Clock className="w-3 h-3" /> قيد الانتظار
        </span>
      );
    case 'in_transit':
      return (
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <Truck className="w-3 h-3" /> في الطريق
        </span>
      );
    case 'completed':
      return (
        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> مكتمل
        </span>
      );
    case 'cancelled':
      return (
        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
          <XCircle className="w-3 h-3" /> ملغي
        </span>
      );
    default:
      return null;
  }
};

const BranchTransfersList: React.FC<BranchTransfersListProps> = ({
  filteredTransfers,
  getWarehouseName,
  onViewTransfer,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      {filteredTransfers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTransfers.map((transfer) => (
            <div
              key={transfer.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-black tracking-wider">
                  TRN-{transfer.id?.toString().padStart(4, '0')}
                </div>
                {getStatusBadge(transfer.status)}
              </div>

              <div className="flex items-center gap-3 mb-6 relative">
                <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">من</p>
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {getWarehouseName(transfer.sourceWarehouseId)}
                  </p>
                </div>
                <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center shrink-0 z-10 border border-indigo-100">
                  <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-bold mb-1 uppercase">إلى</p>
                  <p className="font-bold text-slate-800 text-sm truncate">
                    {getWarehouseName(transfer.destinationWarehouseId)}
                  </p>
                </div>
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-[2px] bg-slate-100 -z-0 -translate-y-1/2"></div>
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500 mb-6 font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {new Date(transfer.date).toLocaleDateString('ar-EG')}
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  {transfer.items.reduce((acc, item) => acc + item.quantity, 0)} قطعة
                </div>
              </div>

              <button
                onClick={() => onViewTransfer(transfer)}
                className="w-full py-3 bg-slate-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white"
              >
                <Eye className="w-4 h-4" />
                عرض التفاصيل
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
            <Building2 className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-700 mb-2">لا توجد تحويلات</h3>
          <p className="text-slate-500 max-w-md text-center">
            لم يتم العثور على أي تحويلات مطابقة للبحث أو الفلتر الحالي.
          </p>
        </div>
      )}
    </div>
  );
};

export default BranchTransfersList;
