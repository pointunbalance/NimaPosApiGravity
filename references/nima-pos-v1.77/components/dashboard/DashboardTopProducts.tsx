import React from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardTopProductsProps {
    topProducts: any[];
    formatCurrency: (amount: number) => string;
}

export const DashboardTopProducts: React.FC<DashboardTopProductsProps> = ({ 
    topProducts, 
    formatCurrency 
}) => {
    return (
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-amber-500 rounded-full"></span>
                المنتجات الأكثر مبيعاً
            </h3>
            {topProducts.length > 0 ? (
                <div className="space-y-4 flex-1">
                    {topProducts.map((product, idx) => (
                        <motion.div 
                            key={idx} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: idx * 0.1 }}
                            className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                                    {idx + 1}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{product.name}</p>
                                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                                        {product.qty} وحدة مباعة
                                    </p>
                                </div>
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-indigo-600 text-lg">{formatCurrency(product.revenue)}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 text-slate-500 h-full flex items-center justify-center">لا توجد مبيعات في هذه الفترة</div>
            )}
        </div>
    );
};
