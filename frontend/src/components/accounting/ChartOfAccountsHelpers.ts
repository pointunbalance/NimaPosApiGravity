import { Wallet, Building2, Landmark, TrendingUp, TrendingDown } from 'lucide-react';
import { AccountType } from '../../types';

export const getTypeLabel = (type: AccountType) => {
    switch(type) {
        case 'asset': return { label: 'أصول', icon: Wallet, color: 'text-emerald-700 bg-emerald-50 ' };
        case 'liability': return { label: 'خصوم', icon: Building2, color: 'text-red-700 bg-red-50 ' };
        case 'equity': return { label: 'حقوق ملكية', icon: Landmark, color: 'text-blue-700 bg-blue-50 ' };
        case 'revenue': return { label: 'إيرادات', icon: TrendingUp, color: 'text-green-700 bg-green-50 ' };
        case 'expense': return { label: 'مصروفات', icon: TrendingDown, color: 'text-orange-700 bg-orange-50 ' };
    }
};

export const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US').format(amount);

export const getIndentLevel = (code: string) => {
    if (code.length <= 4) return 0;
    if (code.length <= 6) return 1;
    return 2;
};
