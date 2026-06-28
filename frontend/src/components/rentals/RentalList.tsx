import React from 'react';
import { Shirt, Phone, DollarSign, CreditCard, ArrowRightLeft, CheckCircle2, Printer, MessageCircle, Edit } from 'lucide-react';
import { Rental, RentalStatus } from '../../types';

interface RentalListProps {
    rentals: Rental[];
    formatCurrency: (amount: number) => string;
    getStatusColor: (status: RentalStatus) => string;
    getStatusLabel: (status: RentalStatus) => string;
    changeStatus: (rental: Rental, newStatus: RentalStatus) => void;
    printContract: (rental: Rental) => void;
    sendWhatsApp: (rental: Rental) => void;
    handleEditRental: (rental: Rental) => void;
}

export const RentalList: React.FC<RentalListProps> = ({
    rentals, formatCurrency, getStatusColor, getStatusLabel, changeStatus, printContract, sendWhatsApp, handleEditRental
}) => {
    return (
        <div className="space-y-4">
            {rentals.map(r => (
                <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row gap-5 items-center">
                        {/* Product Image & Info */}
                        <div className="flex items-center gap-5 flex-1 w-full">
                            <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden shrink-0 shadow-inner">
                                {r.productImage ? <img src={r.productImage} className="w-full h-full object-cover" /> : <Shirt className="w-10 h-10 text-slate-300 m-auto mt-5" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 text-lg sm:text-xl">{r.customerName}</h4>
                                <p className="text-sm text-slate-500 font-medium mt-1">{r.productName} {r.size ? <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md ml-2 border border-indigo-100">مقاس: {r.size}</span> : ''}</p>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> <span dir="ltr" className="font-medium text-slate-700">{r.customerPhone}</span></span>
                                    <span className="flex items-center gap-1 text-indigo-600 font-bold bg-indigo-50/50 px-2 py-1 rounded-md"><DollarSign className="w-3.5 h-3.5" /> {formatCurrency(r.price)}</span>
                                    {r.customerIDFront && <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-md"><CreditCard className="w-3.5 h-3.5"/> هوية مرفقة</span>}
                                    {r.lateFee ? <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md">غرامة: {formatCurrency(r.lateFee)}</span> : null}
                                    {r.damageFee ? <span className="flex items-center gap-1 text-orange-600 font-bold bg-orange-50 px-2 py-1 rounded-md">تلف: {formatCurrency(r.damageFee)}</span> : null}
                                </div>
                            </div>
                        </div>
                        {/* Dates & Status */}
                        <div className="flex flex-col gap-3 items-center md:items-end min-w-[220px]">
                            <div className="flex items-center gap-3 text-xs font-bold bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                <span className="text-emerald-600 flex items-center gap-1">خروج: {new Date(r.pickupDate).toLocaleDateString('ar-EG', {month:'short', day:'numeric'})}</span>
                                <ArrowRightLeft className="w-4 h-4 text-slate-300 mx-1" />
                                <span className="text-red-600 flex items-center gap-1">عودة: {new Date(r.returnDate).toLocaleDateString('ar-EG', {month:'short', day:'numeric'})}</span>
                            </div>
                            <span className={`text-xs px-3 py-1 rounded-lg font-bold border ${getStatusColor(r.status)}`}>
                                {getStatusLabel(r.status)}
                            </span>
                        </div>
                        {/* Actions */}
                        <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0 justify-end">
                            {r.status === 'reserved' && (
                                <button onClick={() => changeStatus(r, 'active')} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-md shadow-blue-200 flex items-center gap-2 transition-all hover:-translate-y-0.5">
                                    <CheckCircle2 className="w-4 h-4" /> تسليم
                                </button>
                            )}
                            {r.status === 'active' && (
                                <button onClick={() => changeStatus(r, 'returned')} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-200 flex items-center gap-2 transition-all hover:-translate-y-0.5">
                                    <ArrowRightLeft className="w-4 h-4" /> استلام القطعة
                                </button>
                            )}
                            {r.status === 'in_laundry' && (
                                <button onClick={() => changeStatus(r, 'returned')} className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md shadow-emerald-200 flex items-center gap-2 transition-all hover:-translate-y-0.5" title="نقل إلى الرف لتصبح جاهزة">
                                    <CheckCircle2 className="w-4 h-4" /> جاهزة للرف
                                </button>
                            )}
                            <button onClick={() => printContract(r)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 hover:text-slate-800 transition-colors border border-slate-100" title="طباعة العقد"><Printer className="w-5 h-5"/></button>
                            <button onClick={() => sendWhatsApp(r)} className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors border border-green-100" title="واتساب"><MessageCircle className="w-5 h-5"/></button>
                            <button onClick={() => handleEditRental(r)} className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100" title="تعديل"><Edit className="w-5 h-5"/></button>
                        </div>
                    </div>
                </div>
            ))}
            {rentals.length === 0 && (
                <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shirt className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">لا توجد حجوزات</h3>
                    <p className="text-slate-500">جرب البحث بكلمة مختلفة أو تغيير الفلتر</p>
                </div>
            )}
        </div>
    );
};
