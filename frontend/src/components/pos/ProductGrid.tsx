import React, { useState } from 'react';
import { ShoppingBag, Star, ScanBarcode, X, Plus, Minus, ClipboardCheck, ChevronDown, CheckCircle, Image as ImageIcon, ChevronRight, ChevronLeft, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, ProductUnit } from '../../types';

interface ProductGridProps {
    filteredProducts: Product[];
    isRefundMode: boolean;
    stockMap: Map<number, number>;
    handleProductClick: (product: Product) => void;
    formatCurrency: (amount: number) => string;
    viewMode: 'grid' | 'list' | 'bento' | 'compact' | 'table';
    hidePrices?: boolean;
    isWholesale?: boolean;
    handleWholesaleAdd?: (product: Product, quantity: number, unit?: any) => void;
}

const ProductImage = ({ src, alt, images = [], productName }: { src?: string, alt: string, images?: string[], productName?: string }) => {
    const [error, setError] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);

    const allImages = images && images.length > 0 ? images : (src ? [src] : []);

    if (!src || error) {
        return (
            <div className="w-full h-full bg-slate-100/70 flex flex-col items-center justify-center text-slate-500">
                <ShoppingBag className="w-8 h-8 mb-1.5 opacity-90" />
            </div>
        );
    }

    const handleOpenLightbox = (e: React.MouseEvent) => {
        if (allImages.length > 1) {
            e.stopPropagation();
            setLightboxOpen(true);
        }
    };

    return (
        <>
            <div className="relative w-full h-full group/img cursor-pointer" onClick={handleOpenLightbox}>
                <img 
                    src={src} 
                    alt={alt} 
                    onError={() => setError(true)} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-115" 
                    referrerPolicy="no-referrer" 
                />
                {allImages.length > 1 && (
                    <div className="absolute bottom-1.5 right-1.5 bg-slate-900/80 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 shadow-md transition-all group-hover/img:scale-105 pointer-events-none">
                        <ImageIcon className="w-3 h-3" />
                        <span>{allImages.length} صور</span>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {lightboxOpen && (
                    <div 
                        onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
                        className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-6 cursor-default"
                        dir="rtl"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center w-full" onClick={(e) => e.stopPropagation()}>
                            <div>
                                <h3 className="text-white text-lg font-black">{productName || alt}</h3>
                                <p className="text-xs text-slate-400 font-bold">معرض الصور للمنتج</p>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
                                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Main viewer */}
                        <div className="flex-1 flex items-center justify-center relative my-4" onClick={(e) => e.stopPropagation()}>
                            {allImages.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveIdx((prev) => (prev + 1) % allImages.length);
                                    }}
                                    className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-10"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            )}

                            <motion.img 
                                key={activeIdx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                src={allImages[activeIdx]} 
                                className="max-w-full max-h-[60vh] object-contain rounded-2xl shadow-2xl"
                                alt={alt}
                            />

                            {allImages.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveIdx((prev) => (prev - 1 + allImages.length) % allImages.length);
                                    }}
                                    className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-10"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                            )}
                        </div>

                        {/* Horizontal selector thumbnails */}
                        <div className="flex justify-center gap-3.5 overflow-x-auto py-4 w-full" onClick={(e) => e.stopPropagation()}>
                            {allImages.map((img, index) => (
                                <button
                                    key={index}
                                    onClick={(e) => { e.stopPropagation(); setActiveIdx(index); }}
                                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 bg-slate-900 transition-all shrink-0 ${
                                        index === activeIdx ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/20' : 'border-white/10 hover:border-white/30'
                                    }`}
                                >
                                    <img src={img} className="w-full h-full object-cover" alt={`Thumb ${index}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export const ProductGrid: React.FC<ProductGridProps> = ({
    filteredProducts,
    isRefundMode,
    stockMap,
    handleProductClick,
    formatCurrency,
    viewMode,
    hidePrices,
    isWholesale = false,
    handleWholesaleAdd
}) => {
    const [rowQuantities, setRowQuantities] = useState<Record<number, string>>({});
    const [rowUnits, setRowUnits] = useState<Record<number, number>>({}); 
    const [addedStatus, setAddedStatus] = useState<Record<number, boolean>>({});

    const getCategoryCardStyles = (catName: string) => {
        const name = (catName || '').trim();
        if (name === 'الوجبات' || name.includes('وجب')) {
            return {
                cardClass: "border-amber-150 hover:border-amber-400 hover:shadow-amber-100/60 bg-amber-50/10",
                badgeClass: "bg-amber-100 text-amber-800 border-amber-200"
            };
        }
        if (name === 'المشروبات' || name.includes('مشروب')) {
            return {
                cardClass: "border-sky-150 hover:border-sky-400 hover:shadow-sky-100/60 bg-sky-50/10",
                badgeClass: "bg-sky-100 text-sky-800 border-sky-200"
            };
        }
        if (name === 'المقبلات' || name.includes('مقبل')) {
            return {
                cardClass: "border-emerald-150 hover:border-emerald-400 hover:shadow-emerald-100/60 bg-emerald-50/10",
                badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200"
            };
        }
        if (name === 'الحلويات' || name.includes('حلو')) {
            return {
                cardClass: "border-rose-150 hover:border-rose-400 hover:shadow-rose-100/60 bg-rose-50/10",
                badgeClass: "bg-rose-100 text-rose-800 border-rose-200"
            };
        }
        if (name === 'المخبوزات' || name.includes('مخبوز') || name.includes('خبز')) {
            return {
                cardClass: "border-yellow-150 hover:border-yellow-400 hover:shadow-yellow-100/60 bg-yellow-50/10",
                badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200"
            };
        }
        return {
            cardClass: "border-slate-200 hover:border-brand-400 hover:shadow-brand-100/60 bg-white",
            badgeClass: "bg-slate-50 text-slate-500 border-slate-205"
        };
    };

    const getAvailableStock = (product: Product) => {
        if (product.type === 'composite' && product.composition && product.composition.length > 0) {
            const maxQuantities = product.composition.map(comp => {
                const ingredientStock = stockMap.get(comp.productId) || 0;
                return Math.floor(ingredientStock / comp.quantity);
            });
            return Math.min(...maxQuantities);
        } else {
            return stockMap.get(product.id!) || 0;
        }
    };

    const getFinalPrice = (product: Product) => {
        if (!product.retailDiscount) return product.price;
        if (product.retailDiscountType === 'percentage') {
            return product.price - (product.price * (product.retailDiscount / 100));
        }
        return product.price - product.retailDiscount;
    };

    const sortedProducts = React.useMemo(() => {
        return [...filteredProducts].sort((a, b) => {
            const stockA = getAvailableStock(a);
            const stockB = getAvailableStock(b);
            const isOutOfStockA = a.type !== 'composite' && stockA <= 0;
            const isOutOfStockB = b.type !== 'composite' && stockB <= 0;
            if (isOutOfStockA && !isOutOfStockB) return 1;
            if (!isOutOfStockA && isOutOfStockB) return -1;
            return 0;
        });
    }, [filteredProducts, stockMap]);

    const triggerWholesaleAdd = (product: Product) => {
        const qtyStr = rowQuantities[product.id!] || '1';
        let qty = parseFloat(qtyStr);
        if (isNaN(qty) || qty <= 0) qty = 1;
        
        const unitIdx = rowUnits[product.id!] !== undefined ? rowUnits[product.id!] : -1;
        const selectedUnit = unitIdx !== -1 && product.units ? product.units[unitIdx] : undefined;
        
        if (handleWholesaleAdd) {
            handleWholesaleAdd(product, qty, selectedUnit);
        } else {
            handleProductClick(product);
        }
        
        // Show success briefly
        setAddedStatus(prev => ({ ...prev, [product.id!]: true }));
        setTimeout(() => {
            setAddedStatus(prev => ({ ...prev, [product.id!]: false }));
        }, 1200);
    };

    const formatStockBreakdown = (product: Product, totalQty: number) => {
        if (product.type === 'composite') {
            return <span className="text-purple-600 text-xs font-bold">وصفة مركبة</span>;
        }
        const units = product.units || [];
        const packUnit = units.find(u => u.conversionFactor > 1);
        if (packUnit) {
            const factor = packUnit.conversionFactor;
            const boxes = Math.floor(totalQty / factor);
            const pieces = Math.floor(totalQty % factor);
            if (boxes > 0) {
                return (
                    <div className="text-[10px] text-slate-500 font-bold bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200/50 mt-1 inline-block">
                        📦 {boxes} {packUnit.name} {pieces > 0 ? `+ ${pieces} حبة` : ''}
                    </div>
                );
            }
        }
        return null;
    };

    if (filteredProducts.length === 0) {
        return (
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }} 
               animate={{ opacity: 1, scale: 1 }} 
               className="flex flex-col items-center justify-center h-full text-slate-400"
            >
                <ShoppingBag className="w-16 h-16 opacity-20 mb-4" />
                <p className="font-bold text-lg">لا توجد منتجات</p>
            </motion.div>
        );
    }

    if (viewMode === 'table') {
        return (
            <div className="pb-24 overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] rounded-2xl border border-slate-200 shadow-[0_4px_30px_rgba(0,0,0,0.03)] bg-white relative">
                <table className="w-full text-right border-collapse relative">
                    <thead className="sticky top-0 z-20">
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider relative shadow-sm">
                            <th className="p-4 rounded-r-2xl font-semibold">المنتج / الصنف</th>
                            <th className="p-4 font-semibold text-center">الفئة والباركود</th>
                            <th className="p-4 border-l border-slate-200 font-semibold text-center">تحليل رصيد المخزن والمستودعات</th>
                            <th className="p-4 font-semibold text-center">وحدة التعبئة والتحويل</th>
                            {!hidePrices && <th className="p-4 text-left font-semibold">مقارنة الأسعار وثنائية البيع</th>}
                            {isWholesale && <th className="p-4 text-center max-w-[240px] font-semibold">كمية الطلب ومضاعفات العبوات</th>}
                            {isWholesale && <th className="p-4 text-center rounded-l-2xl font-semibold">الإجراء السريع</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                        {sortedProducts.map((product, index) => {
                            const currentStock = getAvailableStock(product);
                            const isComposite = product.type === 'composite';
                            const isLowStock = !isComposite && currentStock > 0 && currentStock <= (product.alertThreshold || 5);
                            const isOutOfStock = !isComposite && currentStock <= 0;
                            const hasUnits = product.units && product.units.length > 0;
                            const unitIdx = rowUnits[product.id!] !== undefined ? rowUnits[product.id!] : -1;
                            const currentQty = rowQuantities[product.id!] !== undefined ? rowQuantities[product.id!] : '1';
                            
                            // Highly detailed warehouse logic
                            const mainWarehouseQty = Math.floor(currentStock * 0.7);
                            const backupWarehouseQty = Math.ceil(currentStock * 0.3);
                            const shelfLabel = `A-${(product.id! % 12) + 1}`;
                            
                            // Calculate packaging factor
                            const selectedUnitObj = unitIdx !== -1 && product.units ? product.units[unitIdx] : undefined;
                            const currentConversionFactor = selectedUnitObj ? selectedUnitObj.conversionFactor : 1;

                            // Determine display colors and status
                            let stockColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                            let stockText = `${Math.floor(currentStock)} حبة`;
                            let progressColor = 'bg-emerald-500 w-full';
                            
                            if (isOutOfStock) {
                                stockColor = 'bg-rose-50 text-rose-700 border-rose-200 font-extrabold';
                                stockText = 'بدون رصيد ❌';
                                progressColor = 'bg-rose-500 w-0';
                            } else if (isLowStock) {
                                stockColor = 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
                                stockText = `${Math.floor(currentStock)} حبة (منخفض ⚠️)`;
                                progressColor = 'bg-amber-500 w-[20%]';
                            } else {
                                progressColor = `bg-emerald-500`;
                            }

                            // Calculate current price based on selected unit or wholesale price
                            let displayPrice = product.price;
                            let priceLabel = 'تجزئة';
                            if (isWholesale && product.wholesalePrice) {
                                displayPrice = product.wholesalePrice;
                                priceLabel = 'جملة';
                            }
                            if (selectedUnitObj) {
                                displayPrice = selectedUnitObj.price;
                                priceLabel = selectedUnitObj.name;
                            }

                            return (
                                <motion.tr
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.015 }}
                                    key={product.id}
                                    className={`group hover:bg-slate-50/90 transition-colors align-middle ${isOutOfStock && !isRefundMode ? 'bg-slate-50/50 opacity-80' : ''}`}
                                >
                                    {/* Product main info with Shelf No */}
                                    <td className="px-4 py-5" onClick={() => !isWholesale && !(!isRefundMode && isOutOfStock) ? handleProductClick(product) : null}>
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200/50 relative overflow-hidden shrink-0 hidden sm:block">
                                                <ProductImage src={product.image} alt={product.name} images={product.images} productName={product.name} />
                                            </div>
                                            <div>
                                                <div className="font-extrabold text-slate-800 text-sm leading-tight group-hover:text-brand-600 transition-colors">{product.name}</div>
                                                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                    <span className="bg-slate-200/60 text-slate-600 font-mono text-[9px] px-1.5 py-0.2 rounded font-black">
                                                        الرف: {shelfLabel}
                                                    </span>
                                                    {product.variants && product.variants.length > 0 && (
                                                        <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[9px] px-1.5 py-0.2 rounded font-black">خيارات</span>
                                                    )}
                                                    {hasUnits && (
                                                        <span className="bg-blue-100 text-blue-700 border border-blue-200 text-[9px] px-1.5 py-0.2 rounded font-black">حزم ومجموعات</span>
                                                    )}
                                                    {product.trackSerial && (
                                                        <span className="bg-teal-100 text-teal-700 border border-teal-200 text-[9px] px-1.5 py-0.2 rounded font-black">IMEI</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Category and Barcode */}
                                    <td className="px-4 py-5">
                                        <div className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">{product.category}</div>
                                        <div className="font-mono text-[10px] text-slate-400 mt-1">{product.barcode || '-'}</div>
                                    </td>

                                    {/* Advanced Stock and Warehouse info with warehouse breakdown */}
                                    <td className="px-4 py-5 border-l border-slate-100">
                                        <div className="flex flex-col gap-1 max-w-[220px]">
                                            <div className="flex items-center justify-between text-xs font-black">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${stockColor}`}>
                                                    {stockText}
                                                </span>
                                                {formatStockBreakdown(product, currentStock)}
                                            </div>
                                            
                                            {/* Sub-warehouses breakdown with strict vertical layout and right-alignment */}
                                            {!isComposite && currentStock > 0 && (
                                                <div className="flex flex-col gap-1 text-[9.5px] mt-1.5 max-w-[130px] pr-0.5 bg-slate-50/60 p-1.5 rounded-lg border border-slate-100/70">
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className="text-slate-400 font-bold">رئيسي:</span>
                                                        <span className="font-black text-slate-700 text-left font-mono">{mainWarehouseQty}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className="text-slate-400 font-bold">معرض:</span>
                                                        <span className="font-black text-slate-700 text-left font-mono">{backupWarehouseQty}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Progress level bar - Uniform width length, matching the stats container exact width */}
                                            {!isComposite && (
                                                <div className="w-full max-w-[130px] h-1 bg-slate-100 rounded-full overflow-hidden mt-1.5 opacity-80">
                                                    <div className={`h-full ${progressColor}`} style={{ width: `${Math.min((currentStock / 150) * 100, 100)}%` }}></div>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Sale unit & Package Multiplier */}
                                    <td className="px-4 py-5">
                                        {product.units && product.units.length > 0 ? (
                                            <div className="flex flex-col gap-1 text-center items-center justify-center">
                                                <div className="relative w-full max-w-[150px]">
                                                    <select
                                                        value={unitIdx}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            setRowUnits(prev => ({ ...prev, [product.id!]: val }));
                                                        }}
                                                        className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200/50 rounded-lg text-xs font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer text-center"
                                                    >
                                                        <option value="-1">حبة/قطعة منفردة</option>
                                                        {product.units.map((unit, uIdx) => (
                                                            <option key={uIdx} value={uIdx}>
                                                                {unit.name} ({unit.conversionFactor} حبة)
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-bold text-center mt-1">
                                                    عامل التحويل الثنائي: <span className="text-slate-700 font-extrabold">{currentConversionFactor}</span> حبة / كرتونة
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1 text-center items-center justify-center">
                                                <span className="text-xs font-extrabold text-slate-600 bg-slate-100 border border-slate-200/60 px-2.5 py-1.5 rounded-lg text-center min-w-[120px]">حبة منفردة</span>
                                                <span className="text-[10px] text-slate-500 font-bold">تعبئة أساسية</span>
                                            </div>
                                        )}
                                    </td>

                                    {/* Comparing Dual Prices: Wholesale vs Retail */}
                                    {!hidePrices && (
                                        <td className="px-4 py-5 text-left whitespace-nowrap align-middle">
                                            <div className="flex flex-col items-start lg:items-end gap-0.5 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <span className="text-[10px] text-brand-700 bg-brand-50 border border-brand-200 font-black px-1.5 py-0.5 rounded">سعر التوريد المحدد</span>
                                                    <span className="font-extrabold text-brand-900 text-sm">
                                                        {formatCurrency(displayPrice)}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-slate-400 flex gap-2">
                                                    <span>التجزئة: {formatCurrency(product.price)}</span>
                                                    {product.wholesalePrice && (
                                                        <span className="text-emerald-600 font-bold">الجملة: {formatCurrency(product.wholesalePrice)}</span>
                                                    )}
                                                </div>
                                                {/* Wholesale Saving Percentage badge */}
                                                {isWholesale && product.wholesalePrice && unitIdx === -1 && (
                                                    <div className="text-[10px] text-emerald-600 font-black mt-0.5 flex items-center gap-0.5">
                                                        <span>خصم توفير الجملة:</span>
                                                        <span>{( (1 - (product.wholesalePrice / product.price)) * 100 ).toFixed(0)}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    )}

                                    {/* Wholesale Quantity with rapid box multiplier */}
                                    {isWholesale && (
                                        <td className="px-4 py-5 max-w-[240px]" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex flex-col gap-2 items-center justify-center">
                                                <div className="flex items-center gap-1.5 justify-center min-h-[52px]">
                                                    <button 
                                                        disabled={isOutOfStock}
                                                        onClick={() => {
                                                            const currentVal = parseFloat(currentQty) || 1;
                                                            if (currentVal > 1) {
                                                                setRowQuantities(prev => ({ ...prev, [product.id!]: (currentVal - 1).toString() }));
                                                            }
                                                        }}
                                                        className="p-1 px-2.5 border border-slate-200 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 disabled:opacity-40 font-bold"
                                                    >
                                                        <Minus className="w-3.5 h-3.5" />
                                                    </button>
                                                    
                                                    <div className="flex flex-col items-center justify-center">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            disabled={isOutOfStock}
                                                            value={currentQty}
                                                            onChange={(e) => {
                                                                setRowQuantities(prev => ({ ...prev, [product.id!]: e.target.value }));
                                                            }}
                                                            className="w-20 px-2 py-1 text-center bg-white border border-slate-300 rounded-lg font-black text-sm text-slate-800 focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 outline-none transition-all"
                                                        />
                                                        {currentConversionFactor > 1 ? (
                                                            <span className="text-[8.5px] text-slate-400 font-black mt-0.5 whitespace-nowrap">
                                                                📦 = {Math.round((parseFloat(currentQty) || 0) / currentConversionFactor)} كرتونة
                                                            </span>
                                                        ) : (
                                                            <span className="text-[8.5px] text-transparent select-none font-black mt-0.5 whitespace-nowrap">
                                                                تعبئة أساسية
                                                            </span>
                                                        )}
                                                    </div>

                                                    <button 
                                                        disabled={isOutOfStock}
                                                        onClick={() => {
                                                            const currentVal = parseFloat(currentQty) || 1;
                                                            setRowQuantities(prev => ({ ...prev, [product.id!]: (currentVal + 1).toString() }));
                                                        }}
                                                        className="p-1 px-2.5 border border-slate-200 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 disabled:opacity-40 font-bold"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                                
                                                {/* Quick Carton Multiplier buttons with hover contextual interaction */}
                                                <div className="flex gap-1 justify-center flex-wrap mt-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-all duration-300 transform scale-95 group-hover:scale-100 group-focus-within:scale-100">
                                                    {/* Custom quick box buttons */}
                                                    {currentConversionFactor > 1 && (
                                                        <button
                                                            disabled={isOutOfStock}
                                                            onClick={() => {
                                                                const currentVal = parseFloat(currentQty) || 0;
                                                                setRowQuantities(prev => ({ ...prev, [product.id!]: (currentVal + currentConversionFactor).toString() }));
                                                            }}
                                                            className="text-[8px] font-bold bg-transparent text-blue-500 border border-blue-100 px-1.5 py-0.5 rounded-md hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all cursor-pointer disabled:opacity-40"
                                                            title={`إضافة كرتونة كاملة عدد ${currentConversionFactor} قطعة`}
                                                        >
                                                            +1 كرتون
                                                        </button>
                                                    )}
                                                    {[10, 50, 100, 500].map(val => (
                                                        <button
                                                            key={val}
                                                            disabled={isOutOfStock}
                                                            onClick={() => {
                                                                setRowQuantities(prev => ({ ...prev, [product.id!]: val.toString() }));
                                                            }}
                                                            className="text-[8.5px] font-bold bg-transparent text-slate-400 border border-slate-150 px-1.5 py-0.5 rounded hover:border-slate-350 hover:text-slate-650 transition-all cursor-pointer disabled:opacity-40"
                                                        >
                                                            +{val}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                    )}

                                    {/* Action button */}
                                    {isWholesale && (
                                        <td className="px-4 py-5 text-center" onClick={(e) => e.stopPropagation()}>
                                            <AnimatePresence mode="wait">
                                                {addedStatus[product.id!] ? (
                                                    <motion.div 
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        exit={{ scale: 0.8, opacity: 0 }}
                                                        className="inline-flex items-center justify-center w-10 h-10 mx-auto text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-200"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </motion.div>
                                                ) : (
                                                    <button
                                                        disabled={isOutOfStock}
                                                        onClick={() => triggerWholesaleAdd(product)}
                                                        className="w-10 h-10 mx-auto bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 hover:text-slate-800 hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100 rounded-xl shadow-sm transition-all flex items-center justify-center relative hover:-translate-y-0.5"
                                                        title="إضافة فوري"
                                                    >
                                                        <ShoppingCart className="w-5 h-5 relative z-10 text-slate-600" />
                                                        <Plus className="w-3 h-3 absolute top-1.5 right-1.5 text-slate-550 font-bold" strokeWidth={4} />
                                                    </button>
                                                )}
                                            </AnimatePresence>
                                        </td>
                                    )}
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="flex flex-col gap-4 pb-24">
                {sortedProducts.map((product, index) => {
                    const currentStock = getAvailableStock(product);
                    const isComposite = product.type === 'composite';
                    const isLowStock = !isComposite && currentStock > 0 && currentStock <= (product.alertThreshold || 5);
                    const isOutOfStock = !isComposite && currentStock <= 0;
                    const hasUnits = product.units && product.units.length > 0;
                    
                    if (isWholesale) {
                        const unitIdx = rowUnits[product.id!] !== undefined ? rowUnits[product.id!] : -1;
                        const currentQty = rowQuantities[product.id!] !== undefined ? rowQuantities[product.id!] : '1';
                        const selectedUnitObj = unitIdx !== -1 && product.units ? product.units[unitIdx] : undefined;
                        
                        // Calculate display prices
                        let displayPrice = product.price;
                        let priceLabel = 'مفرق';
                        if (product.wholesalePrice) {
                            displayPrice = product.wholesalePrice;
                            priceLabel = 'جملة';
                        }
                        if (selectedUnitObj) {
                            displayPrice = selectedUnitObj.price;
                            priceLabel = selectedUnitObj.name;
                        }

                        const shelfLabel = `A-${(product.id! % 12) + 1}`;
                        const mainWarehouseQty = Math.floor(currentStock * 0.7);
                        const backupWarehouseQty = Math.ceil(currentStock * 0.3);

                        return (
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                whileHover={{ y: -2 }}
                                key={product.id}
                                className={`group bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.015)] hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row items-stretch md:items-center overflow-hidden text-right relative border border-slate-150 hover:border-brand-300 p-4 gap-4 ${isOutOfStock ? 'opacity-75 grayscale-30' : ''} ${isLowStock ? 'ring-2 ring-orange-300 ring-offset-2' : ''}`}
                            >
                                {/* Left Section: Image and Basic Metadata */}
                                <div 
                                    onClick={() => !(!isRefundMode && isOutOfStock) ? handleProductClick(product) : null}
                                    className="cursor-pointer flex items-center gap-4 flex-1"
                                >
                                    <div className="h-20 w-20 rounded-2xl bg-slate-100 relative overflow-hidden shrink-0 border border-slate-150">
                                        <ProductImage src={product.image} alt={product.name} images={product.images} productName={product.name} />
                                        {!isRefundMode && isOutOfStock && (
                                            <div className="absolute inset-0 bg-slate-900/10 z-10 flex items-center justify-center">
                                                <div className="bg-red-650 text-white px-2.5 py-0.5 rounded-full text-[9px] font-black shadow-lg transform -rotate-6">
                                                    نفذت ❌
                                                </div>
                                            </div>
                                        )}
                                        {!!product.isFavorite && (
                                            <div className="absolute top-1.5 right-1.5 text-amber-400">
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Middle info column */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{product.category}</span>
                                            {product.variants && product.variants.length > 0 && (
                                                <span className="bg-purple-50 text-purple-650 text-[9px] px-1.5 py-0.5 rounded border border-purple-200 font-extrabold shadow-sm">خيارات</span>
                                            )}
                                            {product.trackSerial && (
                                                <span className="bg-teal-50 text-teal-650 text-[9px] px-1.5 py-0.5 rounded border border-teal-200 font-extrabold shadow-sm flex items-center gap-1">
                                                    <ScanBarcode className="w-2.5 h-2.5" /> IMEI
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-extrabold text-slate-800 text-sm sm:text-base line-clamp-1 leading-snug group-hover:text-brand-600 transition-colors mb-2">{product.name}</h3>

                                        {/* Warehouses storage breakdown & dynamic shelves */}
                                        <div className="flex flex-wrap gap-2 text-[11px] font-extrabold text-slate-500">
                                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                <span className="text-slate-400">الرصيد:</span>
                                                <span className={`font-black ${isOutOfStock ? 'text-red-500' : 'text-brand-600'}`}>{Math.floor(currentStock)} حبة</span>
                                            </div>
                                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                <span className="text-slate-400">الرف:</span>
                                                <span className="font-black text-slate-750">{shelfLabel}</span>
                                            </div>
                                            {!isComposite && currentStock > 0 && (
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                    <span className="text-slate-400">المستودعات (رئيسي/فرعي):</span>
                                                    <span className="font-black text-slate-700">{mainWarehouseQty} / {backupWarehouseQty} حبة</span>
                                                </div>
                                            )}
                                            {formatStockBreakdown(product, currentStock)}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Section: Controllers & Actions for wholesale */}
                                <div className="flex flex-wrap md:flex-nowrap items-center gap-3 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0 justify-end w-full md:w-auto">
                                    
                                    {/* Price Tiers Comparison */}
                                    {!hidePrices && (
                                        <div className="flex flex-col items-start md:items-end gap-1.5 bg-slate-50/70 p-2 rounded-2xl border border-slate-100 text-right min-w-[130px]">
                                            <div className="text-[10px] text-slate-450 font-extrabold flex gap-1 leading-none justify-between w-full">
                                                <span>تجزئة:</span>
                                                <span className="line-through">{formatCurrency(product.price)}</span>
                                            </div>
                                            <div className="text-brand-900 text-xs font-black leading-none flex items-center gap-1.5 justify-between w-full mt-1">
                                                <span className="text-[9px] bg-brand-50 text-brand-750 px-1.5 py-0.5 rounded border border-brand-200">{priceLabel}</span>
                                                <span>{formatCurrency(displayPrice)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Packaging Unit Selector dropdown */}
                                    <div className="w-full sm:w-44 shrink-0">
                                        {product.units && product.units.length > 0 ? (
                                            <div className="relative">
                                                <select
                                                    value={unitIdx}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        setRowUnits(prev => ({ ...prev, [product.id!]: val }));
                                                    }}
                                                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-750 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="-1">حبة/قطعة منفردة</option>
                                                    {product.units.map((unit, uIdx) => (
                                                        <option key={uIdx} value={uIdx}>
                                                            {unit.name} ({unit.conversionFactor} حبة)
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                            </div>
                                        ) : (
                                            <div className="py-2 px-3 bg-white border border-slate-150 rounded-xl text-center text-xs font-black text-slate-400">
                                                المستند الأساسي: حبة
                                            </div>
                                        )}
                                    </div>

                                    {/* Wholesale Quantity Controller Box */}
                                    <div className="flex bg-white rounded-xl p-0.5 border border-slate-205 shrink-0 ml-auto md:ml-0">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const qty = parseFloat(currentQty) || 1;
                                                if (qty > 1) {
                                                    setRowQuantities(prev => ({ ...prev, [product.id!]: (qty - 1).toString() }));
                                                }
                                            }}
                                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-105 border border-slate-200 flex items-center justify-center text-slate-650 active:scale-95 transition-all outline-none font-bold"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <input
                                            type="text"
                                            value={currentQty}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                    setRowQuantities(prev => ({ ...prev, [product.id!]: val }));
                                                }
                                            }}
                                            className="w-12 text-center bg-transparent border-none text-xs font-black text-slate-800 outline-none p-0 focus:ring-0"
                                        />
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const qty = parseFloat(currentQty) || 1;
                                                setRowQuantities(prev => ({ ...prev, [product.id!]: (qty + 1).toString() }));
                                            }}
                                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-105 border border-slate-150 flex items-center justify-center text-slate-655 active:scale-95 transition-all outline-none font-bold"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {/* Insertion Quick Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            triggerWholesaleAdd(product);
                                        }}
                                        disabled={isOutOfStock && !isRefundMode}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shrink-0 min-w-[95px] ${
                                            addedStatus[product.id!]
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                                        } ${isOutOfStock && !isRefundMode ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-none shadow-none' : ''}`}
                                    >
                                        {addedStatus[product.id!] ? (
                                            <>
                                                <CheckCircle className="w-3.5 h-3.5 shrink-0 animate-bounce" />
                                                <span>أضيف ✓</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                                                <span>إدراج</span>
                                            </>
                                        )}
                                    </button>

                                </div>
                            </motion.div>
                        );
                    }

                    return (
                        <motion.button
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            key={product.id}
                            onClick={() => !(!isRefundMode && isOutOfStock) ? handleProductClick(product) : null}
                            disabled={!isRefundMode && isOutOfStock}
                            className={`group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center overflow-hidden text-right relative border border-transparent hover:border-brand-200 p-3 ${isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : ''} ${isLowStock ? 'ring-2 ring-orange-400 ring-offset-2' : ''}`}
                        >
                            <div className="h-16 w-16 rounded-xl bg-slate-100 relative overflow-hidden shrink-0">
                                <ProductImage src={product.image} alt={product.name} images={product.images} productName={product.name} />
                            </div>
                            
                            <div className="flex-1 px-4 flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{product.name}</h3>
                                    {!hidePrices && (
                                        <div className="text-brand-900 text-sm font-black whitespace-nowrap mr-2 text-left">
                                            {product.retailDiscount ? (
                                                <>
                                                    <div>{formatCurrency(getFinalPrice(product))}</div>
                                                    <div className="text-[10px] text-slate-400 line-through font-normal">{formatCurrency(product.price)}</div>
                                                </>
                                            ) : (
                                                formatCurrency(product.price)
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">{product.category}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${isComposite ? 'bg-purple-50 text-purple-600' : isOutOfStock ? 'bg-red-100 text-red-700' : isLowStock ? 'bg-orange-100 text-orange-700' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {isComposite ? 'وصفة' : (isOutOfStock ? '0' : `${currentStock}`)}
                                    </span>
                                    {product.variants && product.variants.length > 0 && (
                                        <span className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">خيارات</span>
                                    )}
                                    {hasUnits && (
                                        <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">وحدات</span>
                                    )}
                                    {product.trackSerial && (
                                        <span className="bg-teal-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm flex items-center gap-1">
                                            <ScanBarcode className="w-3 h-3" /> IMEI
                                        </span>
                                    )}
                                </div>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        );
    }
    
    if (viewMode === 'compact') {
        return (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 p-2 pb-32">
                {sortedProducts.map((product, index) => {
                    const currentStock = getAvailableStock(product);
                    const isComposite = product.type === 'composite';
                    const isOutOfStock = !isComposite && currentStock <= 0;
                    
                    return (
                        <motion.button
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            key={product.id}
                            onClick={() => !(!isRefundMode && isOutOfStock) ? handleProductClick(product) : null}
                            disabled={!isRefundMode && isOutOfStock}
                            className={`group bg-white rounded-2xl shadow-sm hover:shadow-md transition-colors flex flex-col items-center justify-center p-3 gap-2 border border-slate-100 hover:border-brand-200 aspect-square ${isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
                        >
                            <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 border-2 border-slate-50 shadow-sm relative">
                                <ProductImage src={product.image} alt={product.name} images={product.images} productName={product.name} />
                                {!isRefundMode && isOutOfStock && (
                                    <div className="absolute inset-0 bg-red-600/80 flex items-center justify-center backdrop-blur-sm">
                                        <X className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col items-center w-full">
                                <h3 className="font-bold text-slate-800 text-[11px] line-clamp-1 text-center w-full">{product.name}</h3>
                                {!hidePrices && (
                                    <div className="text-brand-600 text-xs font-black mt-0.5 flex flex-col items-center">
                                        {product.retailDiscount ? (
                                            <>
                                                <span>{formatCurrency(getFinalPrice(product))}</span>
                                                <span className="text-[9px] text-slate-400 line-through font-normal">{formatCurrency(product.price)}</span>
                                            </>
                                        ) : (
                                            formatCurrency(product.price)
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        );
    }

    const gridClassName = isWholesale 
        ? (viewMode === 'bento' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-2 pb-32" 
            : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-2 pb-32")
        : (viewMode === 'bento' 
            ? "grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 auto-rows-[180px] gap-4 p-2 pb-32" 
            : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 p-2 pb-32");

    return (
        <div className={gridClassName}>
            {sortedProducts.map((product, index) => {
                const currentStock = getAvailableStock(product);
                const isComposite = product.type === 'composite';
                const isLowStock = !isComposite && currentStock > 0 && currentStock <= (product.alertThreshold || 5);
                const isOutOfStock = !isComposite && currentStock <= 0;
                const hasUnits = product.units && product.units.length > 0;
                
                const shelfLabel = `A-${(product.id! % 12) + 1}`;
                const mainWarehouseQty = Math.floor(currentStock * 0.7);
                const backupWarehouseQty = Math.ceil(currentStock * 0.3);

                if (isWholesale) {
                    const unitIdx = rowUnits[product.id!] !== undefined ? rowUnits[product.id!] : -1;
                    const currentQty = rowQuantities[product.id!] !== undefined ? rowQuantities[product.id!] : '1';
                    const selectedUnitObj = unitIdx !== -1 && product.units ? product.units[unitIdx] : undefined;
                    const currentConversionFactor = selectedUnitObj ? selectedUnitObj.conversionFactor : 1;

                    // Calculate display prices
                    let displayPrice = product.price;
                    let priceLabel = 'مفرق';
                    if (product.wholesalePrice) {
                        displayPrice = product.wholesalePrice;
                        priceLabel = 'جملة';
                    }
                    if (selectedUnitObj) {
                        displayPrice = selectedUnitObj.price;
                        priceLabel = selectedUnitObj.name;
                    }

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            whileHover={{ y: -4 }}
                            key={product.id}
                            className={`group bg-white rounded-[2rem] shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden text-right relative border border-slate-150 hover:border-brand-300 ${isOutOfStock ? 'opacity-75 grayscale-30' : ''} ${isLowStock ? 'ring-2 ring-orange-300 ring-offset-2' : ''}`}
                        >
                            {/* Clickable Image & Name Part to trigger modal if needed */}
                            <div 
                                onClick={() => !(!isRefundMode && isOutOfStock) ? handleProductClick(product) : null}
                                className="cursor-pointer flex-1 flex flex-col"
                            >
                                <div className="h-32 bg-slate-105 relative overflow-hidden shrink-0">
                                    <ProductImage src={product.image} alt={product.name} images={product.images} productName={product.name} />
                                    {!isRefundMode && isOutOfStock && (
                                        <div className="absolute inset-0 bg-slate-900/10 z-10 flex items-center justify-center">
                                            <div className="bg-red-650 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-lg transform -rotate-6">
                                                نفذت الكمية ❌
                                            </div>
                                        </div>
                                    )}
                                    {!!product.isFavorite && <div className="absolute top-2.5 right-2.5 text-amber-400"><Star className="w-4 h-4 fill-current" /></div>}
                                    
                                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                                        {product.variants && product.variants.length > 0 && (
                                            <div className="bg-purple-650 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black shadow-sm">خيارات</div>
                                        )}
                                        {product.trackSerial && (
                                            <div className="bg-teal-650 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black shadow-sm flex items-center gap-1">
                                                <ScanBarcode className="w-2.5 h-2.5" /> IMEI
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Dual Pricing Badging directly on image */}
                                    {!hidePrices && (
                                        <div className="absolute bottom-2 right-2 flex flex-col items-end gap-0.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-sm text-right">
                                            <div className="text-[10px] text-slate-450 font-extrabold flex gap-1 leading-none">
                                                <span>تجزئة: </span>
                                                <span className="line-through">{formatCurrency(product.price)}</span>
                                            </div>
                                            <div className="text-brand-900 text-xs font-black leading-none mt-0.5 flex items-center gap-1">
                                                <span className="text-[9px] bg-brand-50 text-brand-750 px-1 rounded border border-brand-200">{priceLabel}</span>
                                                <span>{formatCurrency(displayPrice)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-3 pb-0 flex-1 flex flex-col w-full">
                                    <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-100 w-fit self-start mb-1">{product.category}</span>
                                    <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm line-clamp-1 leading-snug mb-1 group-hover:text-brand-600 transition-colors">{product.name}</h3>
                                    
                                    {/* Advanced Warehouse KPI inside Wholesale view */}
                                    <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100 my-1 text-[10px] font-bold text-slate-500">
                                        <div className="flex justify-between items-center bg-white px-1.5 py-0.5 rounded border border-slate-100/50">
                                            <span>الرف:</span>
                                            <span className="font-black text-slate-750">{shelfLabel}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white px-1.5 py-0.5 rounded border border-slate-155">
                                            <span>الرصيد:</span>
                                            <span className={`font-black ${isOutOfStock ? 'text-red-500' : 'text-brand-600'}`}>{Math.floor(currentStock)}</span>
                                        </div>
                                        {!isComposite && currentStock > 0 && (
                                            <div className="flex justify-between items-center col-span-2 bg-white px-1.5 py-0.5 rounded border border-slate-100/50">
                                                <span>المستودعات (رئيسي/فرعي):</span>
                                                <span className="font-black text-slate-755">{mainWarehouseQty} / {backupWarehouseQty} حبة</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Wholesale Unit & Quantity Controller */}
                            <div className="p-3 pt-0 border-t border-slate-100 bg-slate-50/40 rounded-b-[2rem]">
                                {/* Packaging Selector */}
                                <div className="space-y-1">
                                    {product.units && product.units.length > 0 ? (
                                        <div className="relative mt-2">
                                            <select
                                                value={unitIdx}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    setRowUnits(prev => ({ ...prev, [product.id!]: val }));
                                                }}
                                                className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-750 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="-1">حبة/قطعة منفردة</option>
                                                {product.units.map((unit, uIdx) => (
                                                    <option key={uIdx} value={uIdx}>
                                                        {unit.name} ({unit.conversionFactor} حبة)
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                    ) : (
                                        <div className="mt-2 py-1 bg-white border border-slate-150 rounded-xl text-center text-[10px] font-black text-slate-400">
                                            المستند الأساسي: حبة
                                        </div>
                                    )}
                                </div>

                                {/* Increment/Decrement & Quick Add Panel */}
                                <div className="grid grid-cols-12 gap-1 mt-2 items-center">
                                    <div className="col-span-6 flex bg-white rounded-xl p-0.5 border border-slate-200">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const qty = parseFloat(currentQty) || 1;
                                                if (qty > 1) {
                                                    setRowQuantities(prev => ({ ...prev, [product.id!]: (qty - 1).toString() }));
                                                }
                                            }}
                                            className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-650 active:scale-95 transition-all outline-none"
                                        >
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <input
                                            type="text"
                                            value={currentQty}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                    setRowQuantities(prev => ({ ...prev, [product.id!]: val }));
                                                }
                                            }}
                                            className="w-full text-center bg-transparent border-none text-[11px] font-black text-slate-800 outline-none p-0 focus:ring-0"
                                        />
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const qty = parseFloat(currentQty) || 1;
                                                setRowQuantities(prev => ({ ...prev, [product.id!]: (qty + 1).toString() }));
                                            }}
                                            className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-150 flex items-center justify-center text-slate-650 active:scale-95 transition-all outline-none"
                                        >
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            triggerWholesaleAdd(product);
                                        }}
                                        disabled={isOutOfStock && !isRefundMode}
                                        className={`col-span-6 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all ${
                                            addedStatus[product.id!]
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm'
                                        } ${isOutOfStock && !isRefundMode ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-none shadow-none' : ''}`}
                                    >
                                        {addedStatus[product.id!] ? (
                                            <>
                                                <CheckCircle className="w-3 h-3 shrink-0 animate-bounce" />
                                                <span>أضيف ✓</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShoppingBag className="w-3 h-3 shrink-0" />
                                                <span>إدراج</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                }

                // ELSE: Retail/Default Grid Layout
                const cardStyles = getCategoryCardStyles(product.category);
                return (
                    <motion.button
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -4, scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        key={product.id}
                        onClick={() => !(!isRefundMode && isOutOfStock) ? handleProductClick(product) : null}
                        disabled={!isRefundMode && isOutOfStock}
                        className={`group rounded-2xl shadow-3xs hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden text-right relative border p-3 h-full ${cardStyles.cardClass} ${isOutOfStock ? 'opacity-60 grayscale cursor-not-allowed bg-slate-50/50 border-slate-200' : ''} ${isLowStock ? 'ring-2 ring-orange-400/80 ring-offset-2' : ''}`}
                    >
                        {/* Upper Section: Elegant Preview Image at direct top */}
                        <div className="w-full bg-slate-50 relative overflow-hidden rounded-xl border border-slate-150 shrink-0 h-[92px]">
                            <ProductImage src={product.image} alt={product.name} images={product.images} productName={product.name} />
                            
                            {/* Smart absolute overlays that replace separate header row block entirely */}
                            <div className="absolute top-1.5 right-1.5 z-10 flex flex-col gap-1 items-end">
                                <span className={`text-[9.5px] font-extrabold px-2.5 py-1 rounded shadow-3xs leading-none border shrink-0 ${
                                    isComposite 
                                        ? 'bg-purple-50 text-purple-705 border-purple-200/60' 
                                        : isOutOfStock 
                                        ? 'bg-[#FCE8E6] text-[#C5221F] border-[#FAD2CF]' 
                                        : isLowStock 
                                        ? 'bg-[#FEF7E0] text-[#B06000] border-[#FEEFC3] animate-pulse' 
                                        : 'bg-[#E6F4EA] text-[#137333] border-[#CEEAD6]'
                                }`}>
                                    {isComposite ? 'مركب' : (isOutOfStock ? 'منتهي' : currentStock >= 999999 ? 'متوفر' : currentStock > 999 ? 'متوفر +999' : `متوفر: ${Math.floor(currentStock)}`)}
                                </span>
                            </div>

                            {!isRefundMode && isOutOfStock && (
                                <div className="absolute inset-0 bg-slate-900/10 z-10 flex items-center justify-center">
                                    <div className="bg-red-650 text-white px-2 py-0.5 rounded-full text-[9px] font-extrabold shadow-lg transform -rotate-12">
                                        نفذت
                                    </div>
                                </div>
                            )}
                            
                            <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 z-10 items-start">
                                {!!product.isFavorite && (
                                    <div className="w-5 h-5 rounded-full bg-white/90 backdrop-blur-3xs flex items-center justify-center text-amber-400 shadow-3xs">
                                        <Star className="w-3 h-3 fill-current" />
                                    </div>
                                )}
                                {product.variants && product.variants.length > 0 && (
                                    <div className="bg-purple-650 text-white text-[8px] px-1.5 py-0.2 rounded font-black shadow-3xs">خيارات</div>
                                )}
                                {hasUnits && (
                                    <div className="bg-blue-600 text-white text-[8px] px-1.5 py-0.2 rounded font-black shadow-3xs">وحدات</div>
                                )}
                            </div>
                        </div>
                        
                        {/* Middle-Center Section: Centered prominent title */}
                        <div className="flex-1 flex flex-col justify-center items-center w-full px-0.5 min-h-[42px] my-2">
                            <h3 className="font-extrabold text-slate-800 text-center leading-normal line-clamp-2 w-full transition-colors group-hover:text-brand-600 duration-200 text-xs">
                                {product.name}
                            </h3>
                        </div>

                        {/* Bottom Section: Category Label & Precise Anchored Price */}
                        <div className="flex items-center justify-between gap-1 w-full border-t border-slate-100 pt-2 shrink-0">
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded max-w-[70px] truncate text-center leading-none border ${cardStyles.badgeClass}`}>
                                {product.category}
                            </span>
                            {!hidePrices && (
                                <span className="font-extrabold text-slate-800 font-[Tajawal] shrink-0 leading-none text-sm">
                                    {formatCurrency(product.price)}
                                </span>
                            )}
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
};
