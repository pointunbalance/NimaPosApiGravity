import React from 'react';
import { Shirt, Edit, Trash2, Tag, DollarSign, Box } from 'lucide-react';
import { Product } from '../../types';

interface RentalItemsListProps {
    items: Product[];
    formatCurrency: (amount: number) => string;
    onEdit: (item: Product) => void;
    onDelete: (id: number) => void;
    onBook?: (item: Product) => void;
    onGenerateSamples?: () => void;
}

export const RentalItemsList: React.FC<RentalItemsListProps> = ({
    items, formatCurrency, onEdit, onDelete, onBook, onGenerateSamples
}) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {items.map(item => (
                <div key={item.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                    <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden p-2">
                        {item.image ? (
                            <img 
                                src={item.image} 
                                className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700" 
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='500' viewBox='0 0 400 500'%3E%3Crect width='400' height='500' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='24' fill='%2394a3b8'%3Eخطأ في الصورة%3C/text%3E%3C/svg%3E";
                                }}
                            />
                        ) : (
                            <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center">
                                <Shirt className="w-16 h-16 text-slate-300" />
                            </div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 shadow-sm">
                            {item.category}
                        </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="font-bold text-slate-800 text-lg mb-2 line-clamp-2 leading-tight" title={item.name}>{item.name}</h3>
                        
                        <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-500 mb-4">
                            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100"><Tag className="w-3 h-3 text-slate-400"/> {item.barcode || 'بدون باركود'}</span>
                            <span className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1.5 rounded-lg text-indigo-700 border border-indigo-100"><Box className="w-3 h-3"/> المخزون: {item.stock}</span>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">سعر التأجير</span>
                                <span className="font-black text-slate-800 flex items-center gap-1 text-lg">
                                    {formatCurrency(item.price)}
                                </span>
                            </div>
                            
                            <div className="flex gap-2">
                                {onBook && (
                                    <button onClick={() => onBook(item)} className="p-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-colors" title="إضافة حجز">
                                        حجز
                                    </button>
                                )}
                                <button onClick={() => onEdit(item)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors" title="تعديل">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDelete(item.id!)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors" title="حذف">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {items.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Shirt className="w-12 h-12 text-slate-300" />
                    </div>
                    <h3 className="font-bold text-2xl text-slate-800 mb-2">لا توجد أصناف تأجير</h3>
                    <p className="text-slate-500 font-medium max-w-sm mx-auto mb-6">قم بإضافة أصناف جديدة للبدء في إدارة وتأجير الملابس الخاصة بك</p>
                    {onGenerateSamples && (
                        <button onClick={onGenerateSamples} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold transition-colors">
                            إضافة منتجات افتراضية للتأجير
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
