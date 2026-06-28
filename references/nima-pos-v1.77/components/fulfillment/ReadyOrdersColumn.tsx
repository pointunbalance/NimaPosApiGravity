import React from 'react';
import { CheckCircle, Timer, Check, RotateCcw } from 'lucide-react';
import { Order } from '../../types';

interface ReadyOrdersColumnProps {
  orders: Order[];
  updateStatus: (orderId: number, status: 'pending' | 'ready' | 'served') => void;
  getElapsedTime: (dateString: Date) => number;
}

const ReadyOrdersColumn: React.FC<ReadyOrdersColumnProps> = ({
  orders,
  updateStatus,
  getElapsedTime
}) => {
  return (
    <div className="flex flex-col bg-emerald-50/30 rounded-3xl border border-emerald-100 overflow-hidden min-w-[300px] shadow-sm">
      <div className="px-5 py-4 bg-emerald-50/80 backdrop-blur-md border-b border-emerald-100 flex justify-between items-center z-10 sticky top-0">
        <h2 className="text-xl font-black text-emerald-800 flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-500" />
          جاهز للتسليم
        </h2>
        <span className="bg-emerald-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm">
          {orders.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all border border-emerald-100/50 relative group overflow-hidden">
            <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-400"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <span className="font-mono font-black text-xl text-slate-800">#{order.id}</span>
                  {order.orderType === 'dine-in' && (
                    <span className="text-xs font-bold bg-purple-50 px-2.5 py-1 rounded-lg text-purple-700 border border-purple-100">
                      استلام مباشر
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Timer className="w-4 h-4 text-emerald-400" />
                  <span>انتظار: {getElapsedTime(order.date)} دقيقة</span>
                </div>
              </div>
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1.5 rounded-lg border border-emerald-100">
                <Check className="w-4 h-4" /> جاهز
              </span>
            </div>

            {order.note && (
              <p className="text-sm font-bold text-amber-700 bg-amber-50 p-3 rounded-xl mb-4 border border-amber-100 flex items-start gap-2">
                <span className="leading-relaxed">{order.note}</span>
              </p>
            )}

            <div className="space-y-2 mb-5 pl-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-slate-600 text-sm items-center">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-700">{item.name}</span>
                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        {item.selectedModifiers.map(m => m.optionName).join('، ')}
                      </span>
                    )}
                    {item.note && (
                      <span className="text-[11px] font-bold text-red-400">
                        * {item.note}
                      </span>
                    )}
                  </div>
                  <span className="font-black bg-slate-50 px-2 py-1 rounded-lg text-slate-700 text-xs shrink-0 h-fit border border-slate-100">x{item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => updateStatus(order.id!, 'pending')}
                className="p-3 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-500 rounded-xl transition-all shadow-sm focus:ring-2 focus:ring-slate-200 focus:outline-none"
                title="إعادة للتجهيز"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button 
                onClick={() => updateStatus(order.id!, 'served')}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                <CheckCircle className="w-5 h-5" />
                تم التسليم
              </button>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-emerald-800/40">
            <div className="w-24 h-24 bg-emerald-100/50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            <p className="text-xl font-black text-emerald-700/60 mb-2">لا توجد طلبات جاهزة</p>
            <p className="text-sm font-medium text-emerald-600/50">في انتظار تجهيز الطلبات</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadyOrdersColumn;
