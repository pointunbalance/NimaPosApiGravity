import React from 'react';
import { X, Shirt, CheckCircle2, Ruler, Scissors, User, CreditCard, DollarSign, Printer, Trash2 } from 'lucide-react';
import { Rental, Product, Customer } from '../../types';

interface RentalBookingModalProps {
    editingRental: Rental | null;
    setIsBookingModalOpen: (isOpen: boolean) => void;
    rentalForm: Partial<Rental>;
    setRentalForm: React.Dispatch<React.SetStateAction<Partial<Rental>>>;
    rentalItems: Product[] | undefined;
    customers: Customer[] | undefined;
    handleIDUpload: (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => void;
    handleSaveRental: () => void;
    printContract: (rental: Rental) => void;
    handleDeleteRental: (id: number) => void;
}

export const RentalBookingModal: React.FC<RentalBookingModalProps> = ({
    editingRental, setIsBookingModalOpen, rentalForm, setRentalForm, rentalItems, customers,
    handleIDUpload, handleSaveRental, printContract, handleDeleteRental
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b bg-slate-50 flex justify-between items-center rounded-t-3xl shrink-0">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800">{editingRental ? 'تعديل الحجز' : 'حجز جديد'}</h3>
                        <p className="text-xs text-slate-500 font-medium">بيانات العميل، المقاسات، والتواريخ</p>
                    </div>
                    <button onClick={() => setIsBookingModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full"><X/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Left: Details */}
                        <div className="flex-1 space-y-6">
                            <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                                <h4 className="font-bold text-indigo-900 mb-4 text-sm flex items-center gap-2">
                                    <Shirt className="w-4 h-4" /> تفاصيل القطعة
                                </h4>
                                
                                <label className="block text-xs font-bold text-slate-500 mb-1">اختر القطعة</label>
                                <select 
                                    className="w-full p-3 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold mb-4"
                                    value={rentalForm.productId || ''}
                                    onChange={e => {
                                        const id = Number(e.target.value);
                                        const item = rentalItems?.find(p => p.id === id);
                                        setRentalForm(prev => ({
                                            ...prev, 
                                            productId: id, 
                                            price: item?.price || 0,
                                            productName: item?.name
                                        }));
                                    }}
                                >
                                    <option value="">اختر...</option>
                                    {rentalItems?.map(item => (
                                        <option key={item.id} value={item.id}>{item.name} (السعر: {item.price})</option>
                                    ))}
                                </select>

                                {/* Show Parts Checklist if available */}
                                {rentalForm.productId && (
                                    <div className="mb-4 bg-white p-3 rounded-xl border border-indigo-100">
                                        <p className="text-xs font-bold text-slate-500 mb-2">مكونات القطعة (للمراجعة):</p>
                                        <div className="flex flex-wrap gap-2">
                                            {rentalItems?.find(i => i.id === rentalForm.productId)?.parts?.map((part: string, idx: number) => (
                                                <span key={idx} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200 flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> {part}
                                                </span>
                                            ))}
                                            {(!rentalItems?.find(i => i.id === rentalForm.productId)?.parts?.length) && <span className="text-xs text-slate-400 italic">لا توجد مكونات محددة</span>}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الاستلام</label>
                                        <input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={rentalForm.pickupDate ? new Date(rentalForm.pickupDate).toISOString().split('T')[0] : ''} onChange={e => setRentalForm({...rentalForm, pickupDate: new Date(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الإرجاع</label>
                                        <input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={rentalForm.returnDate ? new Date(rentalForm.returnDate).toISOString().split('T')[0] : ''} onChange={e => setRentalForm({...rentalForm, returnDate: new Date(e.target.value)})} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-200">
                                <h4 className="font-bold text-gray-800 mb-4 text-sm flex items-center gap-2">
                                    <Ruler className="w-4 h-4" /> المقاسات والتعديلات
                                </h4>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">المقاس (Size)</label>
                                        <input 
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold"
                                            placeholder="42, XL, ..."
                                            value={rentalForm.size || ''}
                                            onChange={e => setRentalForm({...rentalForm, size: e.target.value})}
                                        />
                                    </div>
                                    <div className="flex items-center pt-5">
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Scissors className="w-3 h-3" /> مطلوب تعديل؟ (اكتب في الملاحظات)
                                        </span>
                                    </div>
                                </div>
                                <textarea 
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm resize-none"
                                    placeholder="ملاحظات التعديل (تضييق، تقصير...)"
                                    rows={2}
                                    value={rentalForm.notes || ''}
                                    onChange={e => setRentalForm({...rentalForm, notes: e.target.value})}
                                />
                            </div>
                        </div>

                        {/* Right: Customer & Finance */}
                        <div className="flex-1 space-y-6">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                <h4 className="font-bold text-slate-700 mb-4 text-sm flex items-center gap-2">
                                    <User className="w-4 h-4" /> بيانات العميل
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">الاسم</label>
                                        <input 
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                                            value={rentalForm.customerName}
                                            onChange={e => {
                                                const name = e.target.value;
                                                const existingCustomer = customers?.find(c => c.name === name);
                                                setRentalForm({
                                                    ...rentalForm, 
                                                    customerName: name,
                                                    customerId: existingCustomer?.id || 0,
                                                    customerPhone: existingCustomer ? existingCustomer.phone : rentalForm.customerPhone
                                                });
                                            }}
                                            list="cust-list"
                                        />
                                        <datalist id="cust-list">{customers?.map(c => <option key={c.id} value={c.name} />)}</datalist>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">رقم الهاتف</label>
                                        <input 
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={rentalForm.customerPhone}
                                            onChange={e => setRentalForm({...rentalForm, customerPhone: e.target.value})}
                                        />
                                    </div>
                                    
                                    {/* ID Card Uploads */}
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">صورة البطاقة (وجه)</label>
                                            <label className="h-20 bg-white border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-400 overflow-hidden relative group">
                                                {rentalForm.customerIDFront ? (
                                                    <img src={rentalForm.customerIDFront} className="w-full h-full object-cover" />
                                                ) : (
                                                    <CreditCard className="w-6 h-6 text-slate-300" />
                                                )}
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleIDUpload(e, 'front')} />
                                            </label>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">صورة البطاقة (ظهر)</label>
                                            <label className="h-20 bg-white border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-400 overflow-hidden relative group">
                                                {rentalForm.customerIDBack ? (
                                                    <img src={rentalForm.customerIDBack} className="w-full h-full object-cover" />
                                                ) : (
                                                    <CreditCard className="w-6 h-6 text-slate-300" />
                                                )}
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleIDUpload(e, 'back')} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                                <h4 className="font-bold text-emerald-800 mb-4 text-sm flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" /> الحساب والتأمين
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">سعر التأجير</label>
                                        <input type="number" onFocus={(e) => e.target.select()} className="w-full p-3 bg-white border border-emerald-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-lg text-emerald-700" value={rentalForm.price} onChange={e => setRentalForm({...rentalForm, price: Number(e.target.value)})} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">مبلغ التأمين (Deposit - مسترد)</label>
                                        <input type="number" onFocus={(e) => e.target.select()} className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none font-bold text-red-500" value={rentalForm.deposit} onChange={e => setRentalForm({...rentalForm, deposit: Number(e.target.value)})} />
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleSaveRental} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all text-lg">
                                تأكيد وحفظ
                            </button>

                            {editingRental && (
                                <div className="flex gap-2">
                                    <button onClick={() => printContract(editingRental)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2">
                                        <Printer className="w-4 h-4" /> طباعة العقد
                                    </button>
                                    <button onClick={() => handleDeleteRental(editingRental.id!)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
