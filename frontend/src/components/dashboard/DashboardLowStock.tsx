import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Package, PackageCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardLowStockProps {
    lowStockProducts: any[];
}

export const DashboardLowStock: React.FC<DashboardLowStockProps> = ({ lowStockProducts }) => {
    const navigate = useNavigate();

    return (
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-rose-500 rounded-full"></span>
                    نقص المخزون
                </h3>
                <button onClick={() => navigate('/purchases')} className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                    + طلب شراء
                </button>
            </div>
            <div className="space-y-3 flex-1">
                {lowStockProducts.map((p, idx) => (
                    <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                        className="flex justify-between items-center p-3 rounded-2xl border border-rose-50 bg-rose-50/30 hover:bg-rose-50 transition-all group"
                    >
                        <div className="flex items-center gap-3 w-full">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-500 font-bold shadow-sm border border-rose-50 group-hover:scale-110 transition-transform shrink-0">
                                <Package className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, (p.stock / (p.alertThreshold || 5)) * 100)}%` }}></div>
                                    </div>
                                    <p className="text-[10px] text-rose-600 font-bold whitespace-nowrap">متبقي: {p.stock}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
                {lowStockProducts.length === 0 && (
                    <div className="text-center py-10 h-full flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <PackageCheck className="w-8 h-8 text-emerald-500" />
                        </div>
                        <span className="font-bold text-slate-700">المخزون ممتاز</span>
                    </div>
                )}
            </div>
        </div>
    );
};
