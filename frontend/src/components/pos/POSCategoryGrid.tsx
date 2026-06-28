import React from 'react';
import { Category } from '../../types';
import { iconMap } from '../../utils/categoryIcons';
import { Folder } from 'lucide-react';
import { motion } from 'framer-motion';

interface POSCategoryGridProps {
    categories: string[];
    dbCategories?: Category[];
    onSelectCategory: (category: string) => void;
}

export const POSCategoryGrid: React.FC<POSCategoryGridProps> = ({ categories, dbCategories, onSelectCategory }) => {
    // Filter out "الكل" as we don't want a card for "All" when viewing categories
    const displayCategories = categories.filter(c => c !== 'الكل');

    const getCategoryCardStyle = (catName: string) => {
        const name = catName.trim();
        if (name === 'الوجبات' || name.includes('وجب')) return {
            card: "from-amber-50/80 to-orange-50/60 border-amber-200 hover:border-amber-400 hover:shadow-amber-100/50",
            iconContainer: "bg-amber-100 text-amber-700"
        };
        if (name === 'المشروبات' || name.includes('مشروب')) return {
            card: "from-sky-50/80 to-cyan-50/60 border-sky-200 hover:border-sky-400 hover:shadow-sky-100/50",
            iconContainer: "bg-sky-100 text-sky-700"
        };
        if (name === 'المقبلات' || name.includes('مقبل')) return {
            card: "from-emerald-50/80 to-teal-50/60 border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100/50",
            iconContainer: "bg-emerald-100 text-emerald-700"
        };
        if (name === 'الحلويات' || name.includes('حلو')) return {
            card: "from-rose-50/80 to-pink-50/60 border-rose-200 hover:border-rose-400 hover:shadow-rose-100/50",
            iconContainer: "bg-rose-100 text-rose-700"
        };
        if (name === 'المخبوزات' || name.includes('مخبوز') || name.includes('خبز')) return {
            card: "from-yellow-50/80 to-amber-50/50 border-yellow-200 hover:border-yellow-400 hover:shadow-yellow-100/50",
            iconContainer: "bg-yellow-100 text-yellow-700"
        };
        return {
            card: "from-purple-50/80 to-indigo-50/60 border-purple-200 hover:border-purple-400 hover:shadow-purple-100/50",
            iconContainer: "bg-purple-100 text-purple-700"
        };
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-24">
            {displayCategories.map((catName, index) => {
                const dbCat = dbCategories?.find(c => (c.name || '').trim() === catName.trim());
                const Icon = dbCat?.icon ? iconMap[dbCat.icon] : Folder;
                const styles = getCategoryCardStyle(catName);
                
                return (
                    <motion.button
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -4, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        key={`${catName}-${index}`}
                        onClick={() => onSelectCategory(catName)}
                        className={`group bg-gradient-to-br ${styles.card} rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-center gap-4 border aspect-square`}
                    >
                        <div className={`w-16 h-16 rounded-2xl ${styles.iconContainer} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                            {Icon && <Icon className="w-8 h-8" />}
                        </div>
                        <span className="font-bold text-slate-800 text-center line-clamp-2">
                            {catName}
                        </span>
                    </motion.button>
                );
            })}
        </div>
    );
};
