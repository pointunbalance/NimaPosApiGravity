import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Package, AlertTriangle, ChefHat, Plus, Utensils, Pencil, Trash2, Search, SlidersHorizontal } from 'lucide-react';
import ProductFormModal from '../../components/products/ProductFormModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { Product } from '../../types';

export const RestaurantInventory: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'menu' | 'inventory'>('menu');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Custom confirm dialog state
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [productIdToDelete, setProductIdToDelete] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Categories and Products
    const allCategories = useLiveQuery(async () => {
        const cats = await db.categories.toArray();
        const uniqueNames = new Set(cats.map(c => c.name));
        return Array.from(uniqueNames).filter(Boolean);
    }, []) || [];

    const allProducts = useLiveQuery(() => db.products.toArray(), []) || [];
    
    // Deduplicated items of active menu categories to display as filters
    const menuCategories = useMemo(() => {
        const cats = new Set<string>();
        allProducts.forEach(p => {
            if (p.type === 'composite' || (p.category && (p.category.includes('مطعم') || p.category.includes('قائمة') || p.category.includes('وجبات')))) {
                if (p.category) {
                    cats.add(p.category.trim());
                }
            }
        });
        return Array.from(cats).filter(Boolean);
    }, [allProducts]);

    // 1. Deduplicated lists of products to completely solve duplicate card issue
    const deduplicatedMenuItems = useMemo(() => {
        const seen = new Set<string>();
        const unique: Product[] = [];
        
        const rawMenuItems = allProducts.filter(p => 
            p.type === 'composite' || 
            (p.category && (p.category.includes('مطعم') || p.category.includes('قائمة') || p.category.includes('وجبات')))
        );
        
        for (const item of rawMenuItems) {
            const key = item.name.trim().toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
            }
        }
        return unique;
    }, [allProducts]);

    const deduplicatedInventoryItems = useMemo(() => {
        const seen = new Set<string>();
        const unique: Product[] = [];
        const rawInventory = allProducts.filter(p => p.type === 'simple');
        for (const item of rawInventory) {
            const key = item.name.trim().toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
            }
        }
        return unique;
    }, [allProducts]);

    // Apply filters dynamic state
    const filteredMenuItems = useMemo(() => {
        return deduplicatedMenuItems.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || (item.category && item.category.trim() === selectedCategory);
            return matchesSearch && matchesCategory;
        });
    }, [deduplicatedMenuItems, searchQuery, selectedCategory]);

    const filteredInventoryItems = useMemo(() => {
        return deduplicatedInventoryItems.filter(item => {
            return item.name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [deduplicatedInventoryItems, searchQuery]);

    const lowStockItems = useMemo(() => {
        return deduplicatedInventoryItems.filter(p => p.stock <= (p.alertThreshold || 5));
    }, [deduplicatedInventoryItems]);

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setProductIdToDelete(id);
        setIsDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (productIdToDelete !== null) {
            try {
                await db.products.delete(productIdToDelete);
            } catch (error) {
                console.error(error);
                setErrorMessage("حدث خطأ أثناء محاولة حذف العنصر.");
            }
            setProductIdToDelete(null);
        }
    };

    const handleSaveProduct = async (data: any) => {
        try {
            if (editingProduct?.id) {
                await db.products.update(editingProduct.id, {
                    ...data,
                    updatedAt: new Date()
                });
            } else {
                await db.products.add({
                    ...data,
                    type: data.type || (activeTab === 'menu' ? 'composite' : 'simple'), 
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            closeModal();
        } catch (error) {
            console.error(error);
            setErrorMessage("حدث خطأ أثناء حفظ البيانات. يرجى التحقق من صحتها والمحاولة مجدداً.");
        }
    };

    return (
        <div className="p-6 space-y-6 text-right" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200">
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <Utensils className="w-8 h-8 text-orange-600 shrink-0" />
                    إدارة المنيو والمخزون
                </h1>
                
                {/* Clean responsive tabs with better active layout visual pops */}
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-max self-start">
                    <button
                        onClick={() => { setActiveTab('menu'); setSearchQuery(''); setSelectedCategory('all'); }}
                        className={`px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 ${
                            activeTab === 'menu' 
                                ? 'bg-white text-orange-600 shadow-md border border-orange-100/30 scale-[1.02]' 
                                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                    >
                        <ChefHat className="w-4.5 h-4.5" />
                        المنيو والوصفات
                    </button>
                    <button
                        onClick={() => { setActiveTab('inventory'); setSearchQuery(''); setSelectedCategory('all'); }}
                        className={`px-5 py-2.5 rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 ${
                            activeTab === 'inventory' 
                                ? 'bg-white text-emerald-600 shadow-md border border-emerald-100/30 scale-[1.02]' 
                                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                    >
                        <Package className="w-4.5 h-4.5" />
                        خامات المطبخ
                    </button>
                </div>
            </div>

            {/* Content Based on Tab */}
            {activeTab === 'menu' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                        <div className="space-y-1">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <ChefHat className="w-5.5 h-5.5 text-orange-600 shrink-0" />
                                أصناف المنيو
                            </h2>
                            <p className="text-xs font-bold text-slate-400">تعديل وإضافة الأصناف المركبة (مثل البرجر والوجبات) وربطها بالخامات</p>
                        </div>
                        
                        {/* Unified Search, Category Filters and Action Row */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                            {/* Category Filter Chips for Menu */}
                            {menuCategories.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-start sm:justify-end" dir="rtl">
                                    <button
                                        onClick={() => setSelectedCategory('all')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                            selectedCategory === 'all'
                                                ? 'bg-orange-600 text-white shadow-sm'
                                                : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        الكل
                                    </button>
                                    {menuCategories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                                                selectedCategory === cat
                                                    ? 'bg-orange-600 text-white shadow-sm'
                                                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Search box with magnifying glass aligned on the right for RTL layout */}
                            <div className="relative w-full sm:max-w-xs">
                                <input
                                    type="text"
                                    placeholder="البحث بالاسم في المنيو..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-right"
                                    dir="rtl"
                                />
                                <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-405">
                                    <Search className="w-4 h-4" />
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                                className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-black px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:bg-orange-705 active:scale-95 w-full sm:w-auto"
                            >
                                <Plus className="w-4 h-4 shrink-0" />
                                إضافة صنف للمنيو
                            </button>
                        </div>
                    </div>

                    {/* Responsive auto-fit Grid with template column constraint */}
                    <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                        {filteredMenuItems.map(item => (
                            <div key={item.id} className="bg-white border flex flex-col border-slate-200 p-5 rounded-3xl shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-300">
                                
                                {/* RTL layout header of the card - Thumbnail Image/Fork Knife on Right, Actions on Left */}
                                <div className="flex flex-row justify-between items-start mb-4" dir="rtl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100 shadow-inner">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-2xl" referrerPolicy="no-referrer" />
                                            ) : (
                                                <Utensils className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[11px] font-black text-orange-600 bg-orange-50/70 border border-orange-100 px-2 py-0.5 rounded-lg w-max shadow-sm">
                                                {item.category || 'غير محدد'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-1.5">
                                        <button 
                                            onClick={() => handleEdit(item)} 
                                            className="p-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-slate-100 hover:border-indigo-200 shadow-sm active:scale-95"
                                            title="تعديل"
                                        >
                                            <Pencil className="w-4.5 h-4.5" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(item.id!)} 
                                            className="p-2.5 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all border border-slate-100 hover:border-rose-200 shadow-sm active:scale-95"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-4.5 h-4.5" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="font-extrabold text-slate-800 text-base mb-3 leading-snug line-clamp-2 min-h-[2.5rem] text-right">
                                    {item.name}
                                </h3>
                                
                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100" dir="rtl">
                                    <div className="text-orange-600 font-extrabold text-xl font-mono flex items-center">
                                        <span>{item.price.toLocaleString()}</span>
                                        <span className="text-xs font-bold text-slate-400 mr-1.5">ج.م</span>
                                    </div>
                                    
                                    {item.type === 'composite' && item.composition && item.composition.length > 0 ? (
                                        <span className="text-[11px] font-black px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl flex items-center gap-1.5 shadow-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            {item.composition.length} خامات (وصفة)
                                        </span>
                                    ) : (
                                        <span className="text-[11px] font-black px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl flex items-center gap-1.5 shadow-sm">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                            غير مرتبط بخامات
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        {filteredMenuItems.length === 0 && (
                            <div className="col-span-full py-16 text-center text-slate-500 font-bold bg-white rounded-3xl border-dashed border-2 border-slate-200 shadow-sm">
                                <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-lg text-slate-600">لم يتم العثور على أي أصناف مطابقة للبحث والتصفية.</p>
                                <p className="text-xs text-slate-400 font-medium mt-1">يرجى تغيير الكلمات الدليلية أو إضافة صنف جديد للمنيو.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'inventory' && (
                <div className="space-y-6 animate-in fade-in">
                    {lowStockItems.length > 0 && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div className="text-right">
                                <h3 className="font-extrabold text-rose-800 text-base mb-1">نواقص الخامات!</h3>
                                <p className="text-rose-600 font-medium text-sm">تنبيه: يوجد {lowStockItems.length} أصناف أوشكت على النفاد من مخزن المطبخ.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                        <div className="space-y-1">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Package className="w-5.5 h-5.5 text-emerald-600 shrink-0" />
                                الخامات والمخزون
                            </h2>
                            <p className="text-xs font-bold text-slate-400">الكميات الخاصة بالمواد الخام المستخدمة في تجهيز عناصر المنيو</p>
                        </div>
                        
                        {/* Unified Search and Action Row */}
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                            {/* Search box with magnifying glass aligned on the right for RTL layout */}
                            <div className="relative w-full sm:max-w-xs">
                                <input
                                    type="text"
                                    placeholder="البحث بالاسم في الخامات..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-right"
                                    dir="rtl"
                                />
                                <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                                    <Search className="w-4 h-4" />
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all hover:bg-emerald-605 active:scale-95 w-full sm:w-auto"
                            >
                                <Plus className="w-4 h-4 shrink-0" />
                                إضافة خامة للمخزن
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right" dir="rtl">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 select-none">
                                        <th className="p-4 font-black text-slate-600 text-sm w-[30%]">اسم الخامة</th>
                                        <th className="p-4 font-black text-slate-600 text-sm w-[15%]">الرصيد الحالي</th>
                                        <th className="p-4 font-black text-slate-600 text-sm w-[15%]">سعر التكلفة</th>
                                        <th className="p-4 font-black text-slate-600 text-sm w-[15%]">حد التنبيه</th>
                                        <th className="p-4 font-black text-slate-600 text-sm w-[12%]">الحالة</th>
                                        <th className="p-4 font-black text-slate-600 text-sm text-center w-[13%]">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInventoryItems.map(p => (
                                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-extrabold text-slate-800 w-[30%]">{p.name}</td>
                                            <td className="p-4 font-black text-indigo-600 font-mono w-[15%]">{p.stock}</td>
                                            <td className="p-4 font-bold font-mono text-slate-500 w-[15%]">{p.costPrice?.toLocaleString() || 0} ج.م</td>
                                            <td className="p-4 font-bold font-mono text-slate-400 w-[15%]">{p.alertThreshold || 0}</td>
                                            <td className="p-4 w-[12%]">
                                                {p.stock <= (p.alertThreshold || 0) ? (
                                                    <span className="px-2.5 py-1 bg-rose-100 text-rose-700 text-xs font-black rounded-lg border border-rose-200">ناقص</span>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-black rounded-lg border border-emerald-200">متوفر</span>
                                                )}
                                            </td>
                                            <td className="p-4 flex gap-2 justify-center w-[13%]">
                                                <button onClick={() => handleEdit(p)} className="p-2 bg-white border border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 rounded-xl transition-all shadow-sm active:scale-95" title="تعديل">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteClick(p.id!)} className="p-2 bg-white border border-slate-200 hover:border-red-300 text-slate-500 hover:text-red-600 rounded-xl transition-all shadow-sm active:scale-95" title="حذف">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredInventoryItems.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-slate-500 bg-white">
                                                <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4">
                                                    <Package className="w-14 h-14 text-slate-300 opacity-40 shrink-0 stroke-[1.25]" />
                                                    <div className="space-y-1">
                                                        <p className="text-base font-extrabold text-slate-700">لا توجد خامات مسجلة متوافقة مع البحث</p>
                                                        <p className="text-xs font-bold text-slate-400">يرجى التحقق من العبارة المدخلة أو البدء بتسجيل عنصر جديد.</p>
                                                    </div>
                                                    <button
                                                        onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
                                                        className="mt-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200/50 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                        إضافة أول خامة الآن
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <ProductFormModal 
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    product={editingProduct}
                    uniqueCategories={allCategories}
                    simpleProducts={deduplicatedInventoryItems}
                    onSave={handleSaveProduct}
                />
            )}

            {/* Custom confirmation modal adhering to iframe design requirements */}
            <ConfirmModal 
                isOpen={isDeleteConfirmOpen}
                title="تأكيد حذف العنصر"
                message="هل أنت متأكد من رغبتك في حذف هذا العنصر نهائياً من قاعدة البيانات المحلية؟ لا يمكن التراجع عن هذه الخطوة."
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setIsDeleteConfirmOpen(false);
                    setProductIdToDelete(null);
                }}
                confirmText="نعم، حذف نهائي"
                cancelText="تراجع"
            />

            {/* Error notifications using custom modal instead of system alerts */}
            {errorMessage && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in animate-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95">
                        <div className="flex items-center gap-3 mb-4 text-rose-600">
                            <div className="p-2 bg-rose-100 rounded-full">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="font-extrabold text-xl text-slate-800">تنبيه بالخطأ</h3>
                        </div>
                        <p className="text-slate-600 mb-6 font-bold text-sm leading-relaxed">{errorMessage}</p>
                        <div className="flex justify-end">
                            <button
                                onClick={() => setErrorMessage(null)}
                                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors w-full sm:w-auto"
                            >
                                فهمت وموافق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
