import React, { useEffect, useState } from 'react';
import { db } from '../../db';
import { Customer, Order } from '../../types';
import { PhoneCall, User, MapPin, Clock, X, Check } from 'lucide-react';

interface CallerIdNotificationProps {
    onAcceptCall: (customer: Customer) => void;
}

export const CallerIdNotification: React.FC<CallerIdNotificationProps> = ({ onAcceptCall }) => {
    const [incomingCall, setIncomingCall] = useState<{ customer: Customer, lastOrders: Order[] } | null>(null);
    const formatCurrency = (amount: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);


    // Simulate an incoming call randomly or via global event
    useEffect(() => {
        const handleSimulateCall = async () => {
            const customers = await db.customers.toArray();
            if (customers.length > 0) {
                const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
                
                // Fetch last orders
                const orders = await db.orders
                    .where('customerId')
                    .equals(randomCustomer.id!)
                    .reverse()
                    .limit(3)
                    .toArray();
                    
                setIncomingCall({ customer: randomCustomer, lastOrders: orders });
            }
        };

        // We listen for a custom event or a window function
        (window as any).simulateIncomingCall = handleSimulateCall;

        return () => {
             delete (window as any).simulateIncomingCall;
        };
    }, []);

    if (!incomingCall) return null;

    return (
        <div className="absolute top-8 left-8 z-[50] w-96 max-w-[calc(100vw-4rem)] bg-white rounded-2xl shadow-2xl border-4 border-emerald-500 overflow-hidden transition-all duration-300 transform hover:scale-[1.01]">
            <div className="bg-emerald-500 p-4 text-white flex justify-between items-start">
                <div className="flex gap-3">
                    <div className="bg-white/20 p-3 rounded-full animate-pulse">
                        <PhoneCall className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl drop-shadow-md">مكالمة واردة...</h3>
                        <p className="text-emerald-100 font-mono text-lg" dir="ltr">{incomingCall.customer.phone || 'رقم غير معروف'}</p>
                    </div>
                </div>
                <button onClick={() => setIncomingCall(null)} className="text-white hover:bg-white/20 p-1 rounded-full bg-white/10">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <User className="w-5 h-5 text-slate-400" />
                    <div>
                        <div className="font-black text-slate-800 text-lg">{incomingCall.customer.name}</div>
                        {incomingCall.customer.group && <div className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full inline-block mt-1">{incomingCall.customer.group}</div>}
                    </div>
                </div>
                
                <div className="flex items-start gap-3 mb-4">
                    <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-600 line-clamp-2">
                        {incomingCall.customer.address || 'العنوان غير مسجل'}
                    </div>
                </div>
                
                {incomingCall.lastOrders.length > 0 && (
                    <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1"><Clock className="w-4 h-4" /> آخر طلبات</div>
                        <div className="space-y-2">
                            {incomingCall.lastOrders.map(order => (
                                <div key={order.id} className="flex justify-between items-center text-sm border-b border-white last:border-0 pb-1 last:pb-0">
                                    <span className="text-slate-700">{new Date(order.date).toLocaleDateString('ar-EG')}</span>
                                    <span className="font-bold text-emerald-600">{formatCurrency(order.totalAmount)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            onAcceptCall(incomingCall.customer);
                            setIncomingCall(null);
                        }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" />
                        قبول وبدء طلب
                    </button>
                    <button 
                        onClick={() => setIncomingCall(null)}
                        className="flex-1 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2"
                    >
                        <X className="w-5 h-5" />
                        رفض
                    </button>
                </div>
            </div>
        </div>
    );
};
