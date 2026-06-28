import React, { useState } from 'react';
import { Customer, TailoringOrder, FittingAppointment } from '../../types';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Calendar, User, Ruler, Plus, Trash2 } from 'lucide-react';

interface TailoringOrderModalProps {
    order?: TailoringOrder;
    onClose: () => void;
}

const TailoringOrderModal: React.FC<TailoringOrderModalProps> = ({ order, onClose }) => {
    const customers = useLiveQuery(() => db.customers.toArray()) || [];
    
    const [orderForm, setOrderForm] = useState<Partial<TailoringOrder>>(order || {
        orderDate: new Date(),
        deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Default +14 days
        status: 'fabric_selection',
        price: 0,
        deposit: 0,
        fabricSource: 'store',
        fittings: [],
        designNotes: ''
    });

    const [newFittingDate, setNewFittingDate] = useState('');
    const [newFittingNotes, setNewFittingNotes] = useState('');

    const handleSave = async () => {
        if (!orderForm.customerId && !orderForm.customerName) {
            alert("يرجى إدخال اسم العميل");
            return;
        }

        let customerId = orderForm.customerId;
        if (!customerId && orderForm.customerName) {
            const extCust = customers.find(c => c.name === orderForm.customerName);
            if (extCust) {
                customerId = extCust.id!;
            } else {
                customerId = await db.customers.add({ name: orderForm.customerName, phone: '', totalSpent: 0 });
            }
        }

        let measurements = orderForm.measurements || {};
        
        // If customer exists and no measurements set yet, try to load from customer
        if (customerId && Object.keys(measurements).length === 0) {
            const cust = await db.customers.get(customerId);
            if (cust?.measurements) measurements = cust.measurements;
        }

        // Save back to customer profile to keep it updated
        if (customerId && Object.keys(measurements).length > 0) {
            await db.customers.update(customerId, {
                measurements: { ...measurements, lastUpdated: new Date() }
            });
        }

        const data: TailoringOrder = {
            ...orderForm as TailoringOrder,
            customerId: customerId!,
            measurements
        };

        try {
            await (db as any).transaction('rw', db.tailoringOrders, db.customers, db.shifts, db.journalEntries, db.accounts, async () => {
                let orderId;
                if (order?.id) {
                    await db.tailoringOrders.update(order.id, data as any);
                    orderId = order.id;
                } else {
                    orderId = await db.tailoringOrders.add(data as any);
                    
                    // Track deposit on new orders
                    if (data.price > 0) {
                        const paidDeposit = data.deposit || 0;
                        if (paidDeposit > 0) {
                            const openShift = await db.shifts.where('status').equals('open').first();
                            if (openShift) {
                                await db.shifts.update(openShift.id!, {
                                    expectedCash: openShift.expectedCash + paidDeposit,
                                    cashSales: openShift.cashSales + paidDeposit
                                });
                            }
                        }

                        // Accounting Entry
                        try {
                            const cashAccount = await db.accounts.where('code').equals('1010').first(); // النقدية
                            const arAccount = await db.accounts.where('code').equals('1030').first(); // ذمم مدينة
                            const revenueAccount = await db.accounts.where('code').equals('4010').first(); // إيرادات

                            if (revenueAccount && (cashAccount || arAccount)) {
                                const lines = [];
                                
                                lines.push({ accountId: revenueAccount.id!, accountName: revenueAccount.name, debit: 0, credit: data.price, description: `إيراد طلب تفصيل مستقبلي للعميل ${data.customerName}` });
                                
                                if (paidDeposit > 0 && cashAccount) {
                                    lines.push({ accountId: cashAccount.id!, accountName: cashAccount.name, debit: paidDeposit, credit: 0, description: `عربون مستلم ${data.customerName}` });
                                }
                                
                                const creditBalance = data.price - paidDeposit;
                                if (creditBalance > 0 && arAccount) {
                                    lines.push({ accountId: arAccount.id!, accountName: arAccount.name, debit: creditBalance, credit: 0, description: `باقي مستحق طلب تفصيل ${data.customerName}` });
                                }

                                await db.journalEntries.add({
                                    date: new Date(),
                                    reference: `TLR-${orderId}`,
                                    description: `إنشاء طلب تفصيل للعميل ${data.customerName}`,
                                    lines: lines,
                                    totalAmount: data.price,
                                    status: 'posted'
                                });
                            }
                        } catch (err) {
                             console.error("Failed to post automatic journal entry for tailoring:", err);
                        }
                    }
                }
            });
            onClose();
        } catch (e) {
            console.error(e);
        }
    };

    const addFitting = () => {
        if (!newFittingDate) return;
        const newFitting: FittingAppointment = {
            id: Date.now(),
            customerId: orderForm.customerId || 0,
            customerName: orderForm.customerName || 'Unknown',
            date: new Date(newFittingDate),
            notes: newFittingNotes,
            status: 'scheduled'
        };
        setOrderForm({
            ...orderForm,
            fittings: [...(orderForm.fittings || []), newFitting]
        });
        setNewFittingDate('');
        setNewFittingNotes('');
    };

    const removeFitting = (id: number) => {
        setOrderForm({
            ...orderForm,
            fittings: orderForm.fittings?.filter(f => f.id !== id) || []
        });
    };

    const toggleFittingStatus = (id: number) => {
        setOrderForm({
            ...orderForm,
            fittings: orderForm.fittings?.map(f => f.id === id ? { ...f, status: f.status === 'completed' ? 'scheduled' : 'completed' } : f)
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0 rounded-t-3xl">
                    <h3 className="text-xl font-bold text-slate-800">{order ? 'تعديل طلب تفصيل' : 'طلب تفصيل جديد'}</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5"/></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">العميل</label>
                            <input 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none"
                                value={orderForm.customerName || ''}
                                onChange={e => {
                                    const c = customers.find(x => x.name === e.target.value);
                                    setOrderForm({
                                        ...orderForm, 
                                        customerName: e.target.value, 
                                        customerId: c?.id,
                                        measurements: c?.measurements || orderForm.measurements || {}
                                    });
                                }}
                                list="tailor-cust-list"
                            />
                            <datalist id="tailor-cust-list">{customers.map(c => <option key={c.id} value={c.name}/>)}</datalist>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">توقع التسليم</label>
                            <input 
                                type="date"
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none"
                                value={orderForm.deliveryDate ? new Date(orderForm.deliveryDate).toISOString().split('T')[0] : ''}
                                onChange={e => setOrderForm({...orderForm, deliveryDate: new Date(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">مصدر القماش</label>
                            <select 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none"
                                value={orderForm.fabricSource}
                                onChange={e => setOrderForm({...orderForm, fabricSource: e.target.value as any})}
                            >
                                <option value="store">من المحل</option>
                                <option value="customer">من العميل (قماش خارجي)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">نوع/اسم القماش</label>
                            <input 
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none"
                                value={orderForm.fabricType || ''}
                                onChange={e => setOrderForm({...orderForm, fabricType: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">السعر الإجمالي</label>
                            <input type="number" value={orderForm.price} onChange={e => setOrderForm({...orderForm, price: Number(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">العربون المدفوع</label>
                            <input type="number" value={orderForm.deposit} onChange={e => setOrderForm({...orderForm, deposit: Number(e.target.value)})} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none" />
                        </div>
                    </div>

                    {/* Measurements Section */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <Ruler className="w-4 h-4" />
                                </span>
                                مقاسات العميل كامله (سم)
                            </h4>
                            {orderForm.measurements?.lastUpdated && (
                                <span className="text-[10px] text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-100">
                                    آخر تعديل: {new Date(orderForm.measurements.lastUpdated).toLocaleDateString('ar-EG')}
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {[
                                { key: 'length', label: 'الطول الكلي' },
                                { key: 'shoulder', label: 'الكتف' },
                                { key: 'sleeveLength', label: 'طول الكم' },
                                { key: 'sleeveWidth', label: 'وسع الكم' },
                                { key: 'cuff', label: 'الكبك / المعصم' },
                                { key: 'neck', label: 'الرقبة' },
                                { key: 'chest', label: 'الصدر' },
                                { key: 'waist', label: 'الوسط/الخصر' },
                                { key: 'hips', label: 'الحوض/الأرداف' },
                                { key: 'bottomWidth', label: 'وسع أسفل' },
                                { key: 'pantsLength', label: 'طول البنطلون' },
                                { key: 'pantsWaist', label: 'خصر البنطلون' },
                                { key: 'thigh', label: 'الفخذ' },
                                { key: 'knee', label: 'الركبة' },
                                { key: 'legOpening', label: 'وسع الرجل' },
                            ].map(field => (
                                <div key={field.key} className="bg-white p-2 rounded-lg border border-slate-100">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 text-center">{field.label}</label>
                                    <input 
                                        type="number" 
                                        step="0.5"
                                        placeholder="0"
                                        className="w-full py-1.5 bg-slate-50/50 border border-slate-200 rounded-md outline-none text-sm text-center focus:border-indigo-500 focus:bg-white transition-all font-mono text-slate-800 font-bold"
                                        value={(orderForm.measurements as any)?.[field.key] || ''}
                                        onChange={e => {
                                            const val = e.target.value ? Number(e.target.value) : undefined;
                                            setOrderForm({
                                                ...orderForm,
                                                measurements: {
                                                    ...orderForm.measurements,
                                                    [field.key]: val
                                                }
                                            });
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ملاحظات التصميم والتفصيل</label>
                        <textarea 
                            rows={3} 
                            value={orderForm.designNotes || ''} 
                            onChange={e => setOrderForm({...orderForm, designNotes: e.target.value})} 
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none resize-none"
                        />
                    </div>

                    {/* Fittings */}
                    <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl">
                        <h4 className="font-bold text-indigo-900 text-sm mb-3 flex items-center gap-2">
                            <Ruler className="w-4 h-4" /> جدولة البروفات
                        </h4>
                        
                        <div className="space-y-2 mb-4">
                            {orderForm.fittings?.map(f => (
                                <div key={f.id} className={`flex items-center justify-between p-2 rounded-lg border ${f.status === 'completed' ? 'bg-emerald-50 border-emerald-100 opacity-70' : 'bg-white border-slate-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={f.status === 'completed'} onChange={() => toggleFittingStatus(f.id!)} className="w-4 h-4" />
                                        <div>
                                            <p className={`text-sm font-bold ${f.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-700'}`}>{new Date(f.date).toLocaleString('ar-EG')}</p>
                                            {f.notes && <p className="text-xs text-slate-500">{f.notes}</p>}
                                        </div>
                                    </div>
                                    <button onClick={() => removeFitting(f.id!)} className="p-1 hover:bg-red-50 text-red-500 rounded"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 items-start">
                            <div className="flex-1">
                                <input type="datetime-local" value={newFittingDate} onChange={e => setNewFittingDate(e.target.value)} className="w-full p-2 text-sm bg-white border border-indigo-200 rounded-lg outline-none mb-2" />
                                <input type="text" placeholder="ملاحظات البروفة (مثال: البروفة الأولى للبطانة)" value={newFittingNotes} onChange={e => setNewFittingNotes(e.target.value)} className="w-full p-2 text-sm bg-white border border-indigo-200 rounded-lg outline-none" />
                            </div>
                            <button onClick={addFitting} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700"><Plus className="w-5 h-5"/></button>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 shrink-0">
                    <button onClick={handleSave} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-200">
                        حفظ بيانات الطلب
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TailoringOrderModal;
