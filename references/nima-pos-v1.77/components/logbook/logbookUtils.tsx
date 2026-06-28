import React from 'react';
import { LogType, LogStatus } from '../../types';
import { 
  ShoppingCart, RotateCcw, Truck, CreditCard, Wallet, 
  Users, User, AlertTriangle, Store, FileText 
} from 'lucide-react';

export const getLogIcon = (type: LogType) => {
    switch(type) {
        case 'sale': return <ShoppingCart className="w-4 h-4" />;
        case 'refund': return <RotateCcw className="w-4 h-4" />;
        case 'purchase': return <Truck className="w-4 h-4" />;
        case 'payment': return <CreditCard className="w-4 h-4" />;
        case 'expense': return <Wallet className="w-4 h-4" />;
        case 'customer': return <Users className="w-4 h-4" />;
        case 'user': return <User className="w-4 h-4" />;
        case 'adjustment': return <AlertTriangle className="w-4 h-4" />;
        case 'shift': return <Store className="w-4 h-4" />;
        default: return <FileText className="w-4 h-4" />;
    }
};

export const getLogTypeLabel = (type: LogType) => {
    switch(type) {
        case 'sale': return 'مبيعات';
        case 'refund': return 'مرتجع';
        case 'purchase': return 'مشتريات';
        case 'payment': return 'دفعات مالية';
        case 'expense': return 'مصروفات';
        case 'adjustment': return 'تسوية مخزون';
        case 'shift': return 'صندوق وورديات';
        case 'customer': return 'إدارة عملاء';
        case 'user': return 'موظفين';
        case 'system': return 'نظام';
        default: return 'عام';
    }
};

export const getLogColorStyle = (type: LogType, status?: LogStatus) => {
    if (status === 'error') return 'bg-red-50 text-red-600 border-red-200';
    if (status === 'warning') return 'bg-amber-50 text-amber-600 border-amber-200';

    switch(type) {
        case 'sale': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'refund': return 'bg-rose-50 text-rose-600 border-rose-100';
        case 'purchase': return 'bg-blue-50 text-blue-600 border-blue-100';
        case 'payment': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        case 'expense': return 'bg-orange-50 text-orange-600 border-orange-100';
        case 'customer': return 'bg-purple-50 text-purple-600 border-purple-100';
        case 'user': return 'bg-gray-100 text-gray-600 border-gray-200';
        case 'adjustment': return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'shift': return 'bg-cyan-50 text-cyan-600 border-cyan-100';
        default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
};

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
};
