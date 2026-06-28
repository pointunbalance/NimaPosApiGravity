import React from 'react';

interface LineItemEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingCartItemId: string | null;
    lineItemDiscount: string;
    setLineItemDiscount: (val: string) => void;
    lineItemPriceOverride: string;
    setLineItemPriceOverride: (val: string) => void;
    lineItemNote: string;
    setLineItemNote: (val: string) => void;
    saveLineItemChanges: () => void;
}

export const LineItemEditModal: React.FC<LineItemEditModalProps> = ({
    isOpen, onClose, editingCartItemId,
    lineItemDiscount, setLineItemDiscount,
    lineItemPriceOverride, setLineItemPriceOverride,
    lineItemNote, setLineItemNote,
    saveLineItemChanges
}) => {
    if (!isOpen || !editingCartItemId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="font-bold text-xl mb-4 text-center text-gray-800">تعديل العنصر</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">خصم (مبلغ)</label>
                        <input type="number" onFocus={(e) => e.target.select()} className="w-full border p-3 rounded-xl outline-none focus:border-indigo-500" value={lineItemDiscount} onChange={e => setLineItemDiscount(e.target.value)} placeholder="0" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">سعر مخصص (Override)</label>
                        <input type="number" onFocus={(e) => e.target.select()} className="w-full border p-3 rounded-xl outline-none focus:border-indigo-500" value={lineItemPriceOverride} onChange={e => setLineItemPriceOverride(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">ملاحظة</label>
                        <input type="text" className="w-full border p-3 rounded-xl outline-none focus:border-indigo-500" value={lineItemNote} onChange={e => setLineItemNote(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">إلغاء</button>
                        <button onClick={saveLineItemChanges} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">حفظ</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
