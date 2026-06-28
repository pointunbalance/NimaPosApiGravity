import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Shirt, ArrowLeft, Utensils } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardInsightsProps {
    businessType: string;
    maintenanceOrders: any[];
    rentals: any[];
    diningTables?: any[];
}

export const DashboardInsights: React.FC<DashboardInsightsProps> = ({ 
    businessType, 
    maintenanceOrders, 
    rentals,
    diningTables = []
}) => {
    const navigate = useNavigate();

    return (
        <>
            {businessType === 'restaurant' && diningTables.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-l from-orange-600 to-orange-800 p-6 md:p-8 rounded-3xl shadow-lg mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="p-4 bg-white/20 backdrop-blur-sm text-white rounded-2xl shadow-inner">
                            <Utensils className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">إشغال الطاولات (Dining Status)</h3>
                            <p className="text-orange-100 text-sm md:text-base">يوجد <span className="font-bold text-white text-lg mx-1">{diningTables.filter(t => t.status === 'occupied').length}</span> طاولة مشغولة حالياً من أصل {diningTables.length}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/tables')} 
                        className="w-full md:w-auto px-8 py-3 bg-white text-orange-700 rounded-xl font-bold hover:bg-orange-50 transition-colors shadow-sm flex items-center justify-center gap-2 relative z-10 group"
                    >
                        إدارة الصالة
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            )}
            {businessType === 'service' && maintenanceOrders && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-l from-blue-600 to-blue-800 p-6 md:p-8 rounded-3xl shadow-lg mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="p-4 bg-white/20 backdrop-blur-sm text-white rounded-2xl shadow-inner">
                            <Wrench className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">أوامر الصيانة النشطة</h3>
                            <p className="text-blue-100 text-sm md:text-base">لديك <span className="font-bold text-white text-lg mx-1">{maintenanceOrders.filter(o => o.status === 'pending' || o.status === 'in_progress').length}</span> طلب صيانة قيد التنفيذ حالياً</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/maintenance')} 
                        className="w-full md:w-auto px-8 py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-sm flex items-center justify-center gap-2 relative z-10 group"
                    >
                        عرض الطلبات
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            )}

            {businessType === 'clothing' && rentals && (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-gradient-to-l from-purple-600 to-purple-800 p-6 md:p-8 rounded-3xl shadow-lg mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="p-4 bg-white/20 backdrop-blur-sm text-white rounded-2xl shadow-inner">
                            <Shirt className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">حجوزات الملابس النشطة</h3>
                            <p className="text-purple-100 text-sm md:text-base">لديك <span className="font-bold text-white text-lg mx-1">{rentals.filter(r => r.status === 'active' || r.status === 'pending').length}</span> حجز نشط حالياً</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/rentals')} 
                        className="w-full md:w-auto px-8 py-3 bg-white text-purple-700 rounded-xl font-bold hover:bg-purple-50 transition-colors shadow-sm flex items-center justify-center gap-2 relative z-10 group"
                    >
                        إدارة الحجوزات
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            )}
        </>
    );
};
