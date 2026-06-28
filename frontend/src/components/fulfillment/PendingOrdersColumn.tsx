import React from 'react';
import { Clock, AlertCircle, Check, Printer, ArrowRight, Utensils, Bike, ShoppingBag, Package } from 'lucide-react';
import { Order } from '../../types';

interface PendingOrdersColumnProps {
  orders: Order[];
  checkedItems: Set<string>;
  toggleItemCheck: (orderId: number, itemIdx: number) => void;
  handlePrint: (order: Order) => void;
  updateStatus: (orderId: number, status: 'pending' | 'ready' | 'served') => void;
  getElapsedTime: (dateString: Date) => number;
  getCardStyle: (mins: number) => { border: string; bg: string; header: string };
  getTypeIcon: (type?: string) => React.ReactNode;
}

const PendingOrdersColumn: React.FC<PendingOrdersColumnProps> = ({
  orders,
  checkedItems,
  toggleItemCheck,
  handlePrint,
  updateStatus,
  getElapsedTime,
  getCardStyle,
  getTypeIcon
}) => {
  return (
    <div className="flex-1 flex flex-col rounded-3xl border border-slate-200 overflow-hidden min-w-[350px] shadow-sm bg-slate-50/50">
      <div className="px-5 py-4 bg-white/60 backdrop-blur-md border-b border-slate-200 flex justify-between items-center z-10 sticky top-0">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse"></div>
          قيد التجهيز
        </h2>
        <span className="bg-slate-900 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm">
          {orders.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        {orders.map(order => {
          const elapsed = getElapsedTime(order.date);
          const styles = getCardStyle(elapsed);
          
          return (
            <div key={order.id} className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border ${styles.border}`}>
              {/* Card Header */}
              <div className={`flex justify-between items-center px-5 py-3 border-b border-slate-100 ${styles.header}`}>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-lg text-slate-800">#{order.id}</span>
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide border ${
                    order.orderType === 'dine-in' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                    order.orderType === 'delivery' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {getTypeIcon(order.orderType)}
                    {order.orderType === 'dine-in' ? `استلام مباشر` : 
                     order.orderType === 'delivery' ? 'شحن وتوصيل' : 'تجهيز عميل'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-bold font-mono text-slate-700 bg-white/80 px-2 py-1 rounded-lg">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{elapsed}m</span>
                </div>
              </div>

              <div className="flex flex-col">
                {/* Time Progress Bar */}
                <div className="h-1.5 w-full bg-slate-100">
                  <div 
                    className={`h-full transition-all duration-1000 ${elapsed > 20 ? 'bg-red-500' : elapsed > 10 ? 'bg-amber-400' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(100, (elapsed / 25) * 100)}%` }}
                  ></div>
                </div>
                {/* Items Progress Bar */}
                {(() => {
                  const checkedCount = order.items.filter((_, idx) => checkedItems.has(`${order.id}-${idx}`)).length;
                  const totalItems = order.items.length;
                  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;
                  return (
                    <div className="h-1 w-full bg-slate-100 mt-[1px]">
                      <div 
                        className="h-full bg-indigo-500/80 transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  );
                })()}
              </div>

              <div className="p-5">
                {order.note && (
                  <div className="bg-amber-50 text-amber-900 border border-amber-200 p-3 rounded-xl mb-4 text-sm font-bold flex items-start gap-2 shadow-sm animate-pulse">
                    <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                    <span className="leading-relaxed">{order.note}</span>
                  </div>
                )}

                {/* Interactive Items List */}
                <div className="space-y-2.5 mb-5">
                  {order.items.map((item, idx) => {
                    const isChecked = checkedItems.has(`${order.id}-${idx}`);
                    return (
                      <div 
                        key={idx} 
                        onClick={() => toggleItemCheck(order.id!, idx)}
                        className={`flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all border ${
                          isChecked 
                          ? 'bg-emerald-50/50 border-emerald-200 opacity-70' 
                          : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 shadow-sm hover:shadow'
                        }`}
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'border-slate-300 bg-white'}`}>
                            {isChecked && <Check className="w-4 h-4" strokeWidth={3} />}
                          </div>
                          <div className="flex flex-col">
                            <span className={`font-bold text-base transition-colors ${isChecked ? 'text-emerald-700 line-through decoration-emerald-500/50' : 'text-slate-800'}`}>
                              {item.name}
                            </span>
                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <div className={`text-xs mt-1 transition-colors ${isChecked ? 'text-emerald-600 line-through decoration-emerald-500/50' : 'text-slate-500'}`}>
                                {item.selectedModifiers.map(m => m.optionName).join('، ')}
                              </div>
                            )}
                            {item.note && (
                              <div className={`text-xs mt-1.5 font-bold transition-colors ${isChecked ? 'text-emerald-600 line-through decoration-emerald-500/50' : 'text-red-500'}`}>
                                * {item.note}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`font-black px-3 py-1 rounded-lg border text-sm shrink-0 transition-colors ${isChecked ? 'bg-emerald-100 border-emerald-200 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-800'}`}>
                          x{item.quantity}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => handlePrint(order)}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-slate-500 transition-all shadow-sm focus:ring-2 focus:ring-slate-200 focus:outline-none"
                    title="طباعة تذكرة"
                  >
                    <Printer className="w-5 h-5" />
                  </button>
                  {(() => {
                    const checkedCount = order.items.filter((_, idx) => checkedItems.has(`${order.id}-${idx}`)).length;
                    const isAllChecked = checkedCount === order.items.length && order.items.length > 0;
                    return (
                      <button 
                        onClick={() => updateStatus(order.id!, 'ready')}
                        className={`flex-1 py-3 text-white rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] focus:outline-none ${
                          isAllChecked 
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-500 ring-offset-2 animate-pulse' 
                            : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                        }`}
                      >
                        <span>تم التجهيز</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
        
        {orders.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
              <Package className="w-12 h-12 text-slate-300" />
            </div>
            <p className="text-xl font-black mb-2 text-slate-500">لا توجد طلبات معلقة</p>
            <p className="text-sm font-medium">العمليات مكتملة حالياً</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingOrdersColumn;
