import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MapPin, Phone, History, Plus } from 'lucide-react';
import { DeliveryArea } from '../../types';

interface DeliveryAddressInputProps {
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  deliveryPhone: string;
  setDeliveryPhone: (phone: string) => void;
  deliveryFee: number;
  setDeliveryFee: (fee: number) => void;
}

export const DeliveryAddressInput: React.FC<DeliveryAddressInputProps> = ({
  deliveryAddress,
  setDeliveryAddress,
  deliveryPhone,
  setDeliveryPhone,
  deliveryFee,
  setDeliveryFee,
}) => {
  const [showHistory, setShowHistory] = useState(false);
  
  // Get active delivery areas
  const areas = useLiveQuery(() => db.deliveryAreas.where('isActive').equals(1).toArray()) || [];
  
  // Historical addresses based on phone (from past orders)
  const pastOrders = useLiveQuery(
    async () => {
      const allOrders = await db.orders.toArray();
      return allOrders.filter(order => order.orderType === 'delivery');
    },
    []
  ) || [];

  const phoneHistory = React.useMemo(() => {
    if (!deliveryPhone || deliveryPhone.length < 5) return [];
    
    const uniqueAddresses = new Map<string, any>();
    
    pastOrders.forEach(order => {
      if (order.deliveryPhone === deliveryPhone && order.deliveryAddress) {
        if (!uniqueAddresses.has(order.deliveryAddress)) {
          uniqueAddresses.set(order.deliveryAddress, {
            address: order.deliveryAddress,
            fee: order.deliveryFee || 0
          });
        }
      }
    });
    
    return Array.from(uniqueAddresses.values());
  }, [deliveryPhone, pastOrders]);

  const handleSelectArea = (area: DeliveryArea) => {
    setDeliveryFee(area.deliveryFee);
    const areaPrefix = area.name + ' - ';
    if (!deliveryAddress.includes(areaPrefix)) {
        setDeliveryAddress(areaPrefix + deliveryAddress);
    }
  };

  const handleSelectHistory = (historyItem: any) => {
      setDeliveryAddress(historyItem.address);
      setDeliveryFee(historyItem.fee);
      setShowHistory(false);
  };

  return (
    <div className="bg-indigo-50/40 p-2.5 rounded-xl mb-2 space-y-2 border border-indigo-100/70 relative" dir="rtl">
      <div className="flex items-center gap-2 relative">
        <Phone className="w-3.5 h-3.5 text-indigo-400 absolute right-3 pointer-events-none" />
        <input 
            type="text" 
            placeholder="رقم الهاتف..." 
            value={deliveryPhone}
            onChange={e => {
                setDeliveryPhone(e.target.value);
                if (e.target.value.length >= 5) setShowHistory(true);
            }}
            onFocus={() => { if (deliveryPhone.length >= 5) setShowHistory(true); }}
            className="w-full bg-white border border-indigo-100 rounded-lg pr-8 pl-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-300 font-medium text-slate-700 h-[34px]"
        />
        
        {/* Phone Address History Dropdown */}
        {showHistory && phoneHistory.length > 0 && (
            <div className="absolute top-full right-0 left-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20">
                <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-100 text-xs font-bold text-slate-500 flex items-center gap-1">
                   <History className="w-3 h-3" /> عناوين سابقة لهذا الرقم
                </div>
                {phoneHistory.map((h, i) => (
                    <button 
                       key={i}
                       type="button"
                       onClick={() => handleSelectHistory(h)}
                       className="w-full text-right px-3 py-2 text-xs hover:bg-indigo-50 border-b border-slate-50 last:border-0 transition-colors flex justify-between items-center"
                    >
                        <span className="truncate flex-1 pl-2 text-slate-700">{h.address}</span>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">{h.fee} SAR</span>
                    </button>
                ))}
            </div>
        )}
      </div>

      <div className="flex gap-2">
        <select 
            className="w-1/3 bg-white border border-indigo-100 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-200 font-medium text-slate-600 h-[34px]"
            onChange={(e) => {
                const areaId = Number(e.target.value);
                const area = areas.find(a => a.id === areaId);
                if (area) handleSelectArea(area);
            }}
            defaultValue=""
        >
            <option value="" disabled>المنطقة...</option>
            {areas.map(area => (
                <option key={area.id} value={area.id}>{area.name} ({area.deliveryFee})</option>
            ))}
        </select>
        
        <div className="flex-1 relative flex items-center">
            <input 
                type="number" 
                placeholder="رسوم التوصيل" 
                value={deliveryFee === 0 ? '' : deliveryFee}
                onChange={e => setDeliveryFee(Number(e.target.value))}
                className="w-full bg-white border border-indigo-100 rounded-lg pr-3 pl-12 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-300 font-medium text-slate-700 h-[34px]"
            />
            <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 border-r border-indigo-100 rounded-l-lg absolute left-0 top-0 bottom-0 px-2.5 flex items-center justify-center select-none h-full">SAR</span>
        </div>
      </div>

      <div className="relative">
          <MapPin className="w-3.5 h-3.5 text-indigo-400 absolute right-3 top-2.5 pointer-events-none" />
          <textarea 
              placeholder="العنوان التفصيلي (الشارع، المبنى، الشقة)..." 
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              rows={1}
              className="w-full bg-white border border-indigo-100 rounded-lg pr-8 pl-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-300 resize-none placeholder:text-slate-400 h-[34px] font-medium"
          />
      </div>

      {/* Click outside history handler cover */}
      {showHistory && (
          <div className="fixed inset-0 z-10" onClick={() => setShowHistory(false)}></div>
      )}
    </div>
  );
};
