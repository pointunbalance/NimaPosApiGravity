import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { ArrowLeftRight, Search, Plus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../context/ToastContext';

export const SupplierReturns: React.FC = () => {
    const { success } = useToast();
    const defaultData = useLiveQuery(() => db.products.toArray()) || [];
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <ArrowLeftRight className="w-6 h-6 text-rose-500" />
                        مرتجعات الموردين
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">تتبع وإدارة الأصناف المرتجعة للموردين (Purchase Returns / Debit Notes)</p>
                </div>
                <button
                    className="bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 transition"
                    onClick={() => success('هذه الميزة في قيد التطوير (إصدار لاحق). تسمح بإنشاء إشعار مدين للمورد وخصم المخزون.')}
                >
                    <Plus className="w-5 h-5" /> جديد
                </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-bold text-slate-600">لا توجد حركات إرجاع للموردين حالياً.</h3>
                <p className="text-slate-500 max-w-md mx-auto mt-2 text-sm leading-relaxed">
                    من خلال هذه الصفحة ستتمكن من تسجيل الأصناف التالفة أو الزائدة وردّها للمورد، ليتم اقتطاع قيمتها من المديونية آلياً وتخفيض الكمية من المستودع.
                </p>
                <button className="mt-6 px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200">
                    تحديث البيانات
                </button>
            </div>
        </div>
    );
};

export default SupplierReturns;
