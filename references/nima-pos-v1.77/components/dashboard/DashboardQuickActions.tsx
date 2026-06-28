import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, ChefHat, Wrench, Users, Shirt, Package, Wallet, Receipt } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardQuickActionsProps {
    businessType: string;
}

export const DashboardQuickActions: React.FC<DashboardQuickActionsProps> = ({ businessType }) => {
    const navigate = useNavigate();

    const getActions = () => {
        const commonActions = [
            { icon: <Wallet className="w-5 h-5" />, label: 'تسجيل مصروف', path: '/expenses', color: 'rose' },
            { icon: <Receipt className="w-5 h-5" />, label: 'المبيعات السابقة', path: '/orders', color: 'amber' }
        ];

        switch (businessType) {
            case 'restaurant':
                return [
                    { icon: <LayoutGrid className="w-5 h-5" />, label: 'إدارة الطاولات', path: '/tables', color: 'indigo' },
                    { icon: <ChefHat className="w-5 h-5" />, label: 'شاشة المطبخ', path: '/kitchen', color: 'orange' },
                    ...commonActions
                ];
            case 'service':
                return [
                    { icon: <Wrench className="w-5 h-5" />, label: 'أوامر الصيانة', path: '/maintenance', color: 'blue' },
                    { icon: <Users className="w-5 h-5" />, label: 'إضافة عميل', path: '/customers', color: 'emerald' },
                    ...commonActions
                ];
            case 'clothing':
                return [
                    { icon: <Shirt className="w-5 h-5" />, label: 'حجوزات الملابس', path: '/rentals', color: 'purple' },
                    { icon: <Package className="w-5 h-5" />, label: 'إضافة منتج', path: '/products', color: 'indigo' },
                    ...commonActions
                ];
            default:
                return [
                    { icon: <Package className="w-5 h-5" />, label: 'إضافة منتج', path: '/products', color: 'indigo' },
                    { icon: <Users className="w-5 h-5" />, label: 'إضافة عميل', path: '/customers', color: 'emerald' },
                    ...commonActions
                ];
        }
    };

    const actions = getActions();

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'indigo': return 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:border-indigo-300';
            case 'orange': return 'bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300';
            case 'blue': return 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300';
            case 'emerald': return 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300';
            case 'purple': return 'bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300';
            case 'rose': return 'bg-rose-50 text-rose-600 border-rose-100 hover:border-rose-300';
            case 'amber': return 'bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300';
            default: return 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300';
        }
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {actions.map((action, index) => {
                const colorClasses = getColorClasses(action.color);
                const bgClass = colorClasses.split(' ')[0];
                const darkBgClass = colorClasses.split(' ')[1];
                const textClass = colorClasses.split(' ')[2];
                const darkTextClass = colorClasses.split(' ')[3];
                const borderClass = colorClasses.split(' ')[4];
                const darkBorderClass = colorClasses.split(' ')[5];
                const hoverBorderClass = colorClasses.split(' ')[6];
                const darkHoverBorderClass = colorClasses.split(' ')[7];

                return (
                    <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        onClick={() => navigate(action.path)}
                        className={`bg-white p-4 rounded-2xl shadow-sm border ${borderClass} ${darkBorderClass} ${hoverBorderClass} ${darkHoverBorderClass} flex items-center gap-3 hover:shadow-md transition-all group`}
                    >
                        <div className={`p-3 rounded-xl transition-all duration-300 ${bgClass} ${darkBgClass} ${textClass} ${darkTextClass} group-hover:scale-110 group-hover:shadow-sm`}>
                            {action.icon}
                        </div>
                        <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{action.label}</span>
                    </motion.button>
                );
            })}
        </div>
    );
};
