import React from 'react';
import { History, X, RotateCcw } from 'lucide-react';
import { Order } from '../../types';

interface FulfillmentHistoryModalProps {
  showHistory: boolean;
  setShowHistory: (show: boolean) => void;
  servedOrdersHistory: Order[];
  updateStatus: (orderId: number, status: 'pending' | 'ready' | 'served') => void;
}

const FulfillmentHistoryModal: React.FC<FulfillmentHistoryModalProps> = ({
  showHistory,
  setShowHistory,
  servedOrdersHistory,
  updateStatus
}) => {
  if (!showHistory) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh] border border-slate-200">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
          <h3 className="font-black text-xl text-slate-800 flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl text-slate-600 shadow-sm border border-slate-200">
              <History className="w-5 h-5" />
            </div>
            آخر الطلبات المكتملة
          </h3>
          <button 
            onClick={() => setShowHistory(false)} 
            className="bg-white p-2 rounded-full shadow-sm border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/30 scrollbar-thin scrollbar-thumb-slate-200">
          {servedOrdersHistory?.map(order => (
            <div key={order.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-slate-300 hover:shadow-md transition-all group">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-black text-slate-800 bg-slate-100 px-3 py-1 rounded-lg">#{order.id}</span>
                  <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md">{order.items.length} أصناف</span>
                  <span>•</span>
                  <span>{order.cashierName || 'غير محدد'}</span>
                  <span>•</span>
                  <span className={order.orderType === 'dine-in' ? 'text-purple-600' : 'text-blue-600'}>{order.orderType === 'dine-in' ? 'استلام مباشر' : order.orderType === 'delivery' ? 'شحن وتوصيل' : 'تجهيز عميل'}</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  updateStatus(order.id!, 'ready');
                  setShowHistory(false);
                }}
                className="px-4 py-2 bg-white text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-900 border border-slate-200 shadow-sm text-xs flex items-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <RotateCcw className="w-4 h-4" />
                استرجاع
              </button>
            </div>
          ))}
          {servedOrdersHistory?.length === 0 && (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <History className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-lg font-black text-slate-500 mb-1">السجل فارغ</p>
              <p className="text-sm font-medium text-slate-400">لا توجد طلبات مكتملة مؤخراً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FulfillmentHistoryModal;
