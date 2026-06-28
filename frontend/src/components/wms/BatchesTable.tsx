import React from 'react';
import { ArrowRightLeft, Edit, Trash2, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { ProductBatch } from '../../types';

interface BatchesTableProps {
    batches: ProductBatch[];
    getWarehouseName: (id: number) => string;
    onTransferClick: (batch: ProductBatch) => void;
    onEditClick: (batch: ProductBatch) => void;
    onDeleteClick: (id: number) => void;
}

export const BatchesTable: React.FC<BatchesTableProps> = ({
    batches,
    getWarehouseName,
    onTransferClick,
    onEditClick,
    onDeleteClick
}) => {
    const getExpiryStatus = (expiryDate?: Date) => {
        if (!expiryDate) return { label: 'لا يوجد', color: 'text-slate-500', bg: 'bg-slate-100', icon: null };
        const today = new Date();
        const exp = new Date(expiryDate);
        const diffTime = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'منتهي الصلاحية', color: 'text-red-700', bg: 'bg-red-100', icon: <ShieldAlert className="w-4 h-4" /> };
        if (diffDays <= 30) return { label: `ينتهي قريباً (${diffDays} يوم)`, color: 'text-orange-700', bg: 'bg-orange-100', icon: <AlertTriangle className="w-4 h-4" /> };
        return { label: 'صالح', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <CheckCircle className="w-4 h-4" /> };
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-4 text-sm font-bold text-slate-600">المنتج</th>
                            <th className="p-4 text-sm font-bold text-slate-600">رقم التشغيلة (Batch)</th>
                            <th className="p-4 text-sm font-bold text-slate-600">المستودع</th>
                            <th className="p-4 text-sm font-bold text-slate-600">الكمية المتبقية</th>
                            <th className="p-4 text-sm font-bold text-slate-600">تاريخ الاستلام</th>
                            <th className="p-4 text-sm font-bold text-slate-600">تاريخ الصلاحية</th>
                            <th className="p-4 text-sm font-bold text-slate-600">الحالة</th>
                            <th className="p-4 text-sm font-bold text-slate-600">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {batches.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-slate-500 font-bold">لا توجد تشغيلات مطابقة للبحث</td>
                            </tr>
                        ) : (
                            batches.map(batch => {
                                const status = getExpiryStatus(batch.expiryDate);
                                return (
                                    <tr key={batch.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-bold text-slate-800">{batch.productName}</td>
                                        <td className="p-4 font-mono text-sm text-slate-600">{batch.batchNumber || '-'}</td>
                                        <td className="p-4 text-sm text-slate-600">{getWarehouseName(batch.warehouseId)}</td>
                                        <td className="p-4 font-bold text-indigo-600">{batch.quantity}</td>
                                        <td className="p-4 text-sm text-slate-600">{new Date(batch.receivedDate).toLocaleDateString('ar-EG')}</td>
                                        <td className="p-4 text-sm text-slate-600">{batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('ar-EG') : '-'}</td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${status.bg} ${status.color}`}>
                                                {status.icon}
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => onTransferClick(batch)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                                                    title="نقل لمستودع آخر"
                                                >
                                                    <ArrowRightLeft className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onEditClick(batch)}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
                                                    title="تعديل"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDeleteClick(batch.id!)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
