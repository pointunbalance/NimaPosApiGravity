import React from 'react';
import { ArrowRightLeft, Edit, Trash2 } from 'lucide-react';
import { ProductSerial } from '../../types';

interface SerialsTableProps {
    serials: ProductSerial[];
    getWarehouseName: (id: number) => string;
    getProductName: (id: number) => string;
    onTransferClick: (serial: ProductSerial) => void;
    onEditClick: (serial: ProductSerial) => void;
    onDeleteClick: (id: number) => void;
}

export const SerialsTable: React.FC<SerialsTableProps> = ({
    serials,
    getWarehouseName,
    getProductName,
    onTransferClick,
    onEditClick,
    onDeleteClick
}) => {
    const getSerialStatusLabel = (status: string) => {
        switch (status) {
            case 'available': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">متاح</span>;
            case 'sold': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">مباع</span>;
            case 'returned': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold">مرتجع</span>;
            case 'damaged': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">تالف</span>;
            default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-4 text-sm font-bold text-slate-600">الرقم التسلسلي (S/N)</th>
                            <th className="p-4 text-sm font-bold text-slate-600">المنتج</th>
                            <th className="p-4 text-sm font-bold text-slate-600">المستودع الحالي</th>
                            <th className="p-4 text-sm font-bold text-slate-600">الحالة</th>
                            <th className="p-4 text-sm font-bold text-slate-600">تاريخ الإضافة</th>
                            <th className="p-4 text-sm font-bold text-slate-600">تتبع المسار</th>
                            <th className="p-4 text-sm font-bold text-slate-600">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {serials.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-slate-500 font-bold">لا توجد أرقام تسلسلية مطابقة للبحث</td>
                            </tr>
                        ) : (
                            serials.map(serial => (
                                <tr key={serial.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono font-bold text-indigo-600">{serial.serialNumber}</td>
                                    <td className="p-4 font-bold text-slate-800">{getProductName(serial.productId)}</td>
                                    <td className="p-4 text-sm text-slate-600">{getWarehouseName(serial.warehouseId)}</td>
                                    <td className="p-4">{getSerialStatusLabel(serial.status)}</td>
                                    <td className="p-4 text-sm text-slate-600">{new Date(serial.dateAdded).toLocaleDateString('ar-EG')}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1 text-xs text-slate-500 font-medium">
                                            {serial.purchaseId && <span>فاتورة شراء: #{serial.purchaseId}</span>}
                                            {serial.orderId && <span>فاتورة بيع: #{serial.orderId}</span>}
                                            {!serial.purchaseId && !serial.orderId && <span>إضافة يدوية / تسوية</span>}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onTransferClick(serial)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                                                title="نقل لمستودع آخر"
                                            >
                                                <ArrowRightLeft className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onEditClick(serial)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                                                title="تعديل"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => onDeleteClick(serial.id!)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
