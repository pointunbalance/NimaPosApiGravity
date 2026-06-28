import React from 'react';
import { Clock, ShoppingCart, UserPlus, FileText, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface ActivityItem {
    id: string;
    type: 'order' | 'customer' | 'expense' | 'alert';
    title: string;
    description: string;
    timestamp: Date;
    amount?: number;
}

interface DashboardRecentActivityProps {
    activities: ActivityItem[];
    formatCurrency: (amount: number) => string;
}

export const DashboardRecentActivity: React.FC<DashboardRecentActivityProps> = ({ activities, formatCurrency }) => {
    const getIcon = (type: string) => {
        switch (type) {
            case 'order': return <ShoppingCart className="w-5 h-5 text-indigo-600" />;
            case 'customer': return <UserPlus className="w-5 h-5 text-emerald-600" />;
            case 'expense': return <FileText className="w-5 h-5 text-rose-600" />;
            case 'alert': return <AlertCircle className="w-5 h-5 text-amber-600" />;
            default: return <Clock className="w-5 h-5 text-slate-600" />;
        }
    };

    const getBgColor = (type: string) => {
        switch (type) {
            case 'order': return 'bg-indigo-50 border-indigo-100';
            case 'customer': return 'bg-emerald-50 border-emerald-100';
            case 'expense': return 'bg-rose-50 border-rose-100';
            case 'alert': return 'bg-amber-50 border-amber-100';
            default: return 'bg-slate-50 border-slate-100';
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                    أحدث النشاطات
                </h3>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">عرض الكل</button>
            </div>
            
            {activities.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    لا توجد نشاطات حديثة
                </div>
            ) : (
                <div className="space-y-4">
                    {activities.map((activity, index) => (
                        <motion.div 
                            key={activity.id} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
                        >
                            <div className={`p-3 rounded-xl border ${getBgColor(activity.type)} shrink-0 group-hover:scale-110 transition-transform`}>
                                {getIcon(activity.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-bold text-slate-800 truncate">
                                        {activity.title}
                                    </h4>
                                    {activity.amount !== undefined && (
                                        <span className={`text-sm font-bold whitespace-nowrap mr-4 ${activity.type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {activity.type === 'expense' ? '-' : '+'}{formatCurrency(activity.amount)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 truncate mb-2">
                                    {activity.description}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: ar })}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
