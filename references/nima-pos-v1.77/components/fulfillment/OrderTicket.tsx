import React from 'react';
import { Order } from '../../types';

interface OrderTicketProps {
  order: Order | null;
  printRef: React.RefObject<HTMLDivElement>;
}

const OrderTicket: React.FC<OrderTicketProps> = ({ order, printRef }) => {
  if (!order) return null;
  
  return (
    <div className="hidden">
      <div ref={printRef} className="p-4 bg-white text-black font-mono w-[80mm] mx-auto text-sm" dir="rtl">
        <div className="text-center border-b-2 border-black pb-2 mb-2">
          <h2 className="text-2xl font-bold">M#{order.id}</h2>
          <p className="text-xs mt-1">{new Date(order.date).toLocaleTimeString()}</p>
          <div className="mt-2 font-bold text-xl border-2 border-black p-1 uppercase">
            {order.orderType === 'dine-in' ? 'استلام مباشر' : 
             order.orderType === 'delivery' ? 'شحن وتوصيل' : 'تجهيز عميل'}
          </div>
        </div>
        <div className="mb-2 font-bold">
          {order.note && (
            <div className="mt-2 bg-black text-white p-2 text-center text-lg mb-2">
              ** {order.note} **
            </div>
          )}
        </div>
        <div className="border-b-2 border-black pb-2 mb-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="py-2 border-b border-dashed border-gray-400 last:border-0">
              <div className="flex justify-between items-start text-lg">
                <span className="font-bold w-[70%]">{item.name}</span>
                <span className="font-black text-xl bg-black text-white px-2 rounded-full">{item.quantity}</span>
              </div>
              {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                <div className="text-sm mt-1 text-gray-700">
                  {item.selectedModifiers.map(m => m.optionName).join('، ')}
                </div>
              )}
              {item.note && (
                <div className="text-sm mt-1 font-bold text-black border border-black p-1 inline-block">
                  * {item.note}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center text-xs mt-4">--- نهاية التذكرة ---</div>
      </div>
    </div>
  );
};

export default OrderTicket;
