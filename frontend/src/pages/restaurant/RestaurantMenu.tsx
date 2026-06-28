import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Product } from '../../types';
import { compressImage } from '../../utils/imageCompression';
import { 
    Printer, Image as ImageIcon, Settings, Type, Palette, 
    Columns, LayoutTemplate, Coffee, Check, X, MousePointerClick 
} from 'lucide-react';

const MenuItemImage: React.FC<{ product: Product; theme: string; imageFrame: string }> = ({ product, theme, imageFrame }) => {
    const [isError, setIsError] = useState(false);
    
    const name = (product.name || '').toLowerCase();
    const cat = (product.category || '').toLowerCase();
    
    const getFallbackIcon = () => {
        if (name.includes('برجر') || name.includes('burger')) {
            return (
                <svg className="w-8 h-8 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 12h20M2 15h20M2 18a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4M3 12a9 9 0 0 1 18 0" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        }
        if (name.includes('بيتزا') || name.includes('pizza')) {
            return (
                <svg className="w-8 h-8 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M15 11h.01M11 15h.01M16 16h.01M12 11h.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5Z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M3 13.5h18" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            );
        }
        if (name.includes('دجاج') || name.includes('لحم') || name.includes('شاورما') || name.includes('وجب') || name.includes('كباب') || name.includes('تكة') || name.includes('بروستد')) {
            return (
                <svg className="w-8 h-8 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2v10M12 12a4 4 0 0 0-4-4H4v12h16V8h-4a4 4 0 0 0-4 4Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        }
        if (name.includes('مقبل') || name.includes('سلط') || name.includes('بطاطس') || name.includes('ثوم') || name.includes('حمص')) {
            return (
                <svg className="w-8 h-8 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    <path d="M2.5 9h19" />
                    <path d="M2.5 15h19" />
                </svg>
            );
        }
        if (name.includes('عصير') || name.includes('كولا') || name.includes('مشروب') || name.includes('بيبسي') || name.includes('ماء') || name.includes('قهوة') || name.includes('شاي') || cat.includes('مشروب') || cat.includes('عصائر')) {
            return (
                <svg className="w-8 h-8 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            );
        }
        return (
            <svg className="w-8 h-8 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    };

    let fallbackBg = "bg-amber-50 text-[#9E7A28]";
    if (theme === 'modern') fallbackBg = "bg-zinc-900 text-emerald-400";
    if (theme === 'rustic') fallbackBg = "bg-[#EADEBE] text-[#9A4C20]";

    const isImageValid = product.image && (
        product.image.startsWith('http://') || 
        product.image.startsWith('https://') || 
        product.image.startsWith('data:image/') || 
        product.image.startsWith('/')
    );

    if (isImageValid && !isError) {
        return (
            <div className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden ${imageFrame}`}>
                <img 
                    src={product.image} 
                    alt={product.name}
                    onError={() => setIsError(true)}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                />
            </div>
        );
    }

    return (
        <div className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 overflow-hidden flex items-center justify-center border border-dashed border-amber-500/10 ${imageFrame} ${fallbackBg}`}>
            {getFallbackIcon()}
        </div>
    );
};

const CornerOrnament: React.FC<{ theme: string }> = ({ theme }) => {
    if (theme !== 'classic') return null;
    return (
        <>
            {/* Top Right Corner */}
            <svg className="absolute top-8 right-8 w-12 h-12 text-[#9E7A28]/35 pointer-events-none z-10" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 10 H80 V80" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 22 H68 V68" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="22" cy="22" r="3.5" fill="currentColor" />
            </svg>
            {/* Top Left Corner */}
            <svg className="absolute top-8 left-8 w-12 h-12 text-[#9E7A28]/35 pointer-events-none z-10" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M90 10 H20 V80" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M78 22 H32 V68" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="78" cy="22" r="3.5" fill="currentColor" />
            </svg>
            {/* Bottom Right Corner */}
            <svg className="absolute bottom-8 right-8 w-12 h-12 text-[#9E7A28]/35 pointer-events-none z-10" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 90 H80 V20" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 78 H68 V32" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="22" cy="78" r="3.5" fill="currentColor" />
            </svg>
            {/* Bottom Left Corner */}
            <svg className="absolute bottom-8 left-8 w-12 h-12 text-[#9E7A28]/35 pointer-events-none z-10" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M90 90 H20 V20" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M78 78 H32 V32" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="78" cy="78" r="3.5" fill="currentColor" />
            </svg>
        </>
    );
};

const normalizeCategory = (p: Product): string => {
    const nameStr = (p.name || '').trim().toLowerCase();
    const categoryStr = (p.category || '').trim();
    
    // 1. Move pizza items to 'البيتزا والمعجنات'
    if (nameStr.includes('بيتزا') || nameStr.includes('pizza')) {
        return 'البيتزا والمعجنات';
    }
    // 2. Fix unnamed or empty categories
    if (!categoryStr || categoryStr === '' || categoryStr === 'غير مسمى' || categoryStr.toLowerCase() === 'unassigned') {
        if (nameStr.includes('بطاطس') || nameStr.includes('سلط') || nameStr.includes('مقبل') || nameStr.includes('سيزر') || nameStr.includes('برجر')) {
            return 'وجبات خفيفة ومقبلات';
        }
        return 'أطباق جانبية';
    }
    
    if (categoryStr === 'المخبوزات') {
        return 'البيتزا والمعجنات';
    }
    
    return categoryStr;
};

const RestaurantMenu: React.FC = () => {
    // State
    const [theme, setTheme] = useState<'classic' | 'modern' | 'rustic'>('classic');
    const [font, setFont] = useState<'tajawal' | 'cairo' | 'amiri'>('tajawal');
    const [columns, setColumns] = useState<1 | 2>(2);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [activeProductId, setActiveProductId] = useState<number | null>(null);
    const [showImages, setShowImages] = useState(true);
    const [menuTitle, setMenuTitle] = useState('قائمة الطعام'); // Subtitle/Title
    const [restaurantName, setRestaurantName] = useState('اسم المطعم');
    const [logoUrl, setLogoUrl] = useState('');
    const [menuFooter, setMenuFooter] = useState('نتمنى لكم وجبة هنيئة!');

    const [isPrinting, setIsPrinting] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    // Initial load from settings
    const settings = useLiveQuery(() => db.settings.toCollection().first());
    useEffect(() => {
        if (settings) {
            if (settings.storeName) setRestaurantName(settings.storeName);
            if (settings.logo) setLogoUrl(settings.logo);
        }
    }, [settings]);

    // Image Helper
    const getProductImage = (product: Product) => {
        if (product.image) return product.image;
        
        const nameStr = product.name || '';
        if (nameStr.includes('برجر')) return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2394a3b8'%3Eصورة%3C/text%3E%3C/svg%3E`;
    };

    // Data
    const allProducts = useLiveQuery(() => db.products.toArray(), []) || [];
    const allCategories = useLiveQuery(() => db.categories.toArray(), []) || [];

    // Filters & Mapping
    const uniqueCategories = useMemo(() => {
        const set = new Set<string>();
        allProducts.forEach(p => {
            if (p.type !== 'composite') {
                set.add(normalizeCategory(p));
            }
        });
        
        // Add categories from categories table
        allCategories.forEach(cat => {
            if (cat.name) {
                const normalized = cat.name.trim();
                if (normalized === 'المخبوزات') {
                    set.add('البيتزا والمعجنات');
                } else if (normalized !== 'غير مسمى' && normalized !== '') {
                    set.add(normalized);
                }
            }
        });
        
        return Array.from(set).filter(c => c && c !== 'غير مسمى' && c !== '');
    }, [allProducts, allCategories]);

    useEffect(() => {
        if (uniqueCategories.length > 0 && selectedCategories.length === 0) {
            // Select top categories on load by default
            setSelectedCategories(uniqueCategories.slice(0, 5));
        }
    }, [uniqueCategories, selectedCategories]);

    const handleCategoryToggle = (cat: string) => {
        setSelectedCategories(prev => 
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 100);
    };

    // Theme Styles
    const s = useMemo(() => {
        switch (theme) {
            case 'modern':
                return {
                    bg: 'bg-[#0B0C10]',
                    text: 'text-zinc-100',
                    primary: 'text-emerald-400',
                    border: 'border-zinc-800',
                    categoryBg: 'bg-zinc-900',
                    fontName: font === 'tajawal' ? 'font-tajawal' : font === 'cairo' ? 'font-cairo' : 'font-amiri',
                    dots: 'border-zinc-800',
                    frame: 'outline outline-1 outline-offset-[-12px] outline-zinc-800',
                    pill: 'bg-zinc-900 text-emerald-400 border border-zinc-800',
                    imageFrame: 'rounded-xl shadow-[0_0_0_1px_rgba(255,255,255,0.1)]'
                };
            case 'rustic':
                return {
                    bg: 'bg-[#FAF2E1]', // Soft parchment craft feel
                    text: 'text-[#4A3B32]',
                    primary: 'text-[#9A4C20]',
                    border: 'border-[#D9C8A9]',
                    categoryBg: 'bg-[#EADEBE]',
                    fontName: font === 'tajawal' ? 'font-tajawal' : font === 'cairo' ? 'font-cairo' : 'font-amiri',
                    dots: 'border-[#9A4C20]/40',
                    frame: 'outline outline-2 outline-offset-[-20px] outline-[#D9C8A9]',
                    pill: 'bg-[#EADEBE] text-[#9A4C20] border border-[#D9C8A9]',
                    imageFrame: 'rounded-md shadow-[4px_4px_0px_0px_rgba(154,76,32,0.15)] border-2 border-[#D9C8A9]'
                };
            case 'classic':
            default:
                return {
                    bg: 'bg-[#FAF8F5]', // High grade textured card cream
                    text: 'text-[#2B251A]',
                    primary: 'text-[#9E7A28]', // Regal golden gold leaf shade
                    border: 'border-[#9E7A28]/35',
                    categoryBg: 'bg-white',
                    fontName: font === 'tajawal' ? 'font-tajawal' : font === 'cairo' ? 'font-cairo' : 'font-amiri',
                    dots: 'border-[#9E7A28]/35',
                    frame: 'outline outline-2 outline-offset-[-24px] outline-[#9E7A28]/25 outline-double',
                    pill: 'bg-white text-[#9E7A28] border border-[#9E7A28]/30',
                    imageFrame: 'rounded-full border-[3px] border-white shadow-[0_6px_20px_-3px_rgba(158,122,40,0.15)] ring-1 ring-[#9E7A28]/30 object-cover p-0.5'
                };
        }
    }, [theme, font]);

    // Chunking the menu to multi-pages correctly
    const pagesList = useMemo(() => {
        let allItems: { type: 'header' | 'item', category?: string, product?: Product }[] = [];
        const grouped: { [key: string]: Product[] } = {};
        
        // Normalize categories for all products dynamically
        const availableProducts = allProducts
            .filter(p => p.type !== 'composite')
            .map(p => ({
                ...p,
                category: normalizeCategory(p)
            }))
            .filter(p => selectedCategories.includes(p.category));
        
        selectedCategories.forEach(cat => {
            // Deduplicate items in the same category by normalized name to prevent duplicates
            const seen = new Set<string>();
            const uniqueItems: Product[] = [];
            availableProducts.forEach(p => {
                if (p.category === cat) {
                    const normName = (p.name || '').trim().toLowerCase();
                    if (!seen.has(normName)) {
                        seen.add(normName);
                        uniqueItems.push(p);
                    }
                }
            });
            if (uniqueItems.length > 0) grouped[cat] = uniqueItems;
        });

        // Flatten to prepare for pagination
        Object.entries(grouped).forEach(([cat, items]) => {
            allItems.push({ type: 'header', category: cat });
            items.forEach(product => {
                allItems.push({ type: 'item', product });
            });
        });

        const pages = [];
        let currentPage: typeof allItems = [];
        let currentWeight = 0;
        let currentPageIndex = 0;
        
        allItems.forEach((element, index) => {
            const isFirst = currentPageIndex === 0;
            
            // Available space in "weight units" (1 unit ~ 40px)
            // Header: ~100px (2.5 units)
            // Item (No Image): ~52px (1.3 units)
            // Item (Image): ~88px (2.2 units)
            const weight = element.type === 'header' ? 2.5 : (showImages ? 2.2 : 1.3);
            
            // For a single column, how many units fit?
            // Page 1: ~560px available = 14 units (leaving massive safety padding at the bottom for main headers & frame)
            // Page 2+: ~760px available = 19 units (extremely leak-proof height limit!)
            const unitsPerColumn = isFirst ? 14 : 19;
            const maxWeight = columns === 2 ? unitsPerColumn * 2 : unitsPerColumn;

            let willOverflow = currentWeight + weight > maxWeight;

            // Orphan check: If it's a header and fits, but the NEXT item would cause overflow, 
            // break NOW so header starts on the next page.
            if (!willOverflow && element.type === 'header' && index + 1 < allItems.length) {
                const nextWeight = showImages ? 2.2 : 1.3;
                if (currentWeight + weight + nextWeight > maxWeight) {
                    willOverflow = true; 
                }
            }

            if (willOverflow && currentPage.length > 0) {
                pages.push(currentPage);
                currentPage = [];
                currentWeight = 0;
                currentPageIndex++;
            }
            
            currentPage.push(element);
            currentWeight += weight;
        });
        
        if (currentPage.length > 0) pages.push(currentPage);
        
        // Remove trailing headers from pages if any (extreme edge case)
        pages.forEach(page => {
           while(page.length > 0 && page[page.length - 1].type === 'header') {
               page.pop();
           }
         });

        return pages.length > 0 ? pages : [[]]; // ensure at least one empty page exists
    }, [allProducts, selectedCategories, columns, showImages]);

    // Render a single menu item
    const renderMenuItem = (product: Product) => (
        <div 
            key={product.id} 
            dir="rtl"
            className="group cursor-pointer relative flex flex-row items-start gap-4 mb-6 print:mb-4 text-right w-full"
            style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
            onClick={() => setActiveProductId(activeProductId === product.id ? null : product.id!)}
        >
            {showImages && (
                <div className="transition-transform duration-500 group-hover:scale-105 shrink-0">
                    <MenuItemImage product={product} theme={theme} imageFrame={s.imageFrame} />
                </div>
            )}
            
            <div className="flex-1 flex flex-col justify-center text-right">
                <div className="flex justify-between items-baseline mb-1 relative">
                    <h3 className={`text-base sm:text-lg font-extrabold bg-opacity-100 inline-block pl-3 z-10 tracking-wide shrink-0 ${theme === 'modern' ? 'bg-[#0B0C10]' : theme === 'rustic' ? 'bg-[#FAF2E1]' : 'bg-[#FAF8F5]'}`}>
                        {product.name}
                    </h3>
                    <div className={`flex-1 border-b-[2px] border-dotted hidden sm:block mx-1 relative top-[-4px] ${s.dots} opacity-40 z-0`}></div>
                    <div className={`text-lg font-black pl-1 pr-3 z-10 shrink-0 text-left min-w-[85px] whitespace-nowrap ${s.primary} ${theme === 'modern' ? 'bg-[#0B0C10]' : theme === 'rustic' ? 'bg-[#FAF2E1]' : 'bg-[#FAF8F5]'}`}>
                        <span className="font-mono">{product.price}</span>
                        <span className="text-xs font-bold opacity-70 mr-1.5 inline-block w-7 text-center">ج.م</span>
                    </div>
                </div>

                {(product.description || (product.ingredients && product.ingredients.length > 0)) ? (
                    <p className={`text-[12px] font-light leading-relaxed max-w-[92%] transition-all mt-1 ${
                        theme === 'classic' ? 'italic text-slate-500/80' : 
                        theme === 'modern' ? 'text-zinc-400 font-light' : 'text-[#615043]'
                    } ${activeProductId === product.id ? 'line-clamp-none opacity-100 font-normal' : 'line-clamp-2'}`}>
                        {product.description || product.ingredients?.join('، ')}
                    </p>
                ) : (
                    <p className={`text-[12px] font-light mt-1 ${
                        theme === 'classic' ? 'italic text-slate-400' : 
                        theme === 'modern' ? 'text-zinc-500' : 'text-[#8A7969]'
                    }`}>صنف مميز من مطبخنا</p>
                )}

                {/* Interactive Ingredients Popup/Expand state */}
                {activeProductId === product.id && product.ingredients && product.ingredients.length > 0 && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300 print:hidden">
                        <div className="flex flex-wrap gap-2 justify-start">
                            {product.ingredients.map((ing, idx) => (
                                <span key={idx} className={`text-xs px-3 py-1.5 rounded-md font-medium shadow-sm transition-colors ${s.pill}`}>
                                    {ing}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row h-full w-full overflow-hidden bg-slate-100">
            {/* --- Left / Main: Menu Preview Area --- */}
            <div className="flex-1 overflow-y-auto py-8 lg:py-12 flex flex-col items-center custom-scrollbar" style={{ direction: 'rtl' }}>
                
                <div ref={printRef} className="flex flex-col items-center gap-12 print:gap-0 print:block">
                    {/* Render Pages */}
                    {pagesList.map((pageContent, pageIndex) => (
                        <div 
                            key={`page-${pageIndex}`}
                            dir="rtl"
                            className={`w-[210mm] h-[297mm] max-h-[297mm] shadow-2xl print:shadow-none print:m-0 shrink-0 transition-colors duration-500 relative overflow-hidden text-right ${s.bg} ${s.text} ${s.fontName} p-10 pt-12 pb-16 flex flex-col justify-between`}
                            style={{ 
                                pageBreakAfter: pageIndex < pagesList.length - 1 ? 'always' : 'auto',
                                breakAfter: pageIndex < pagesList.length - 1 ? 'page' : 'auto'
                            }}
                        >
                            {/* Paper Inner Frame for borders */}
                            <div className={`absolute inset-3 sm:inset-4 pointer-events-none z-0 ${s.frame}`}></div>
                            <CornerOrnament theme={theme} />
                            
                            <div className="flex-1 flex flex-col justify-start overflow-hidden">
                                {/* Menu Header: Shown only on the first page */}
                                {pageIndex === 0 && (
                                    <div className="text-center mb-8 pt-6 pb-2 relative z-10 print:mb-4 print:pt-4 animate-in fade-in slide-in-from-top-4 duration-700 flex flex-col items-center">
                                        <div className="inline-flex items-center justify-center mb-2 mt-2">
                                            {logoUrl ? (
                                                <img src={logoUrl} alt={restaurantName} className="w-16 h-16 object-contain" />
                                            ) : (
                                                <UtensilsIcon className={`w-12 h-12 ${s.primary} opacity-90`} />
                                            )}
                                        </div>
                                        <h1 className={`text-4xl sm:text-5xl font-black mb-1 ${s.primary} uppercase tracking-wider leading-tight w-full truncate px-4`}>{restaurantName}</h1>
                                        <h2 className="text-lg font-bold opacity-60 mb-1">{menuTitle}</h2>
                                        <div className="flex items-center justify-center gap-4 mt-2 opacity-60 w-3/4 mx-auto">
                                            <div className={`h-px flex-1 border-t-2 ${s.border}`} />
                                            <StarIcon className={`w-3 h-3 ${s.primary}`} />
                                            <div className={`h-px flex-1 border-t-2 ${s.border}`} />
                                        </div>
                                    </div>
                                )}

                                {/* Menu Content Grid */}
                                {(() => {
                                    // Group elements of pageContent into category sections
                                    const catGroups: { category: string, items: Product[] }[] = [];
                                    let currentGroup: { category: string, items: Product[] } | null = null;
                                    
                                    pageContent.forEach(el => {
                                        if (el.type === 'header') {
                                            currentGroup = { category: el.category!, items: [] };
                                            catGroups.push(currentGroup);
                                        } else if (el.product) {
                                            if (!currentGroup) {
                                                const catName = normalizeCategory(el.product);
                                                currentGroup = { category: `تابع ${catName}`, items: [] };
                                                catGroups.push(currentGroup);
                                            }
                                            currentGroup.items.push(el.product);
                                        }
                                    });

                                    if (columns === 1) {
                                        return (
                                            <div className="relative z-10 flex-1 mt-4 flex flex-col gap-y-4">
                                                {catGroups.map((group, gIdx) => (
                                                    <div key={`group-${gIdx}`} className="w-full">
                                                        <div className="w-full mt-2 mb-4">
                                                            <h2 className={`text-xl font-black pb-1.5 border-b-[2px] ${s.border} ${s.primary} flex items-center gap-3`}>
                                                                {group.category}
                                                            </h2>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            {group.items.map(item => renderMenuItem(item))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    } else {
                                        // columns === 2: Greedy Height Balancing into Right and Left columns
                                        const rightColumnGroups: typeof catGroups = [];
                                        const leftColumnGroups: typeof catGroups = [];
                                        let rightWeight = 0;
                                        let leftWeight = 0;

                                        catGroups.forEach(group => {
                                            const groupWeight = 2.5 + (group.items.length * (showImages ? 2.2 : 1.3));
                                            if (rightWeight <= leftWeight) {
                                                rightColumnGroups.push(group);
                                                rightWeight += groupWeight;
                                            } else {
                                                leftColumnGroups.push(group);
                                                leftWeight += groupWeight;
                                            }
                                        });

                                        return (
                                            <div className="relative z-10 flex-1 mt-4 flex flex-row gap-x-10">
                                                {/* Right Column (First Column in RTL) */}
                                                <div className="flex-1 flex flex-col gap-y-4">
                                                    {rightColumnGroups.map((group, gIdx) => (
                                                        <div key={`right-group-${gIdx}`} className="w-full">
                                                            <div className="w-full mt-2 mb-4">
                                                                <h2 className={`text-xl font-black pb-1.5 border-b-[2px] ${s.border} ${s.primary} flex items-center gap-2`}>
                                                                    {group.category}
                                                                </h2>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                {group.items.map(item => renderMenuItem(item))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Left Column (Second Column in RTL) */}
                                                <div className="flex-1 flex flex-col gap-y-4">
                                                    {leftColumnGroups.map((group, gIdx) => (
                                                        <div key={`left-group-${gIdx}`} className="w-full">
                                                            <div className="w-full mt-2 mb-4">
                                                                <h2 className={`text-xl font-black pb-1.5 border-b-[2px] ${s.border} ${s.primary} flex items-center gap-2`}>
                                                                    {group.category}
                                                                </h2>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                {group.items.map(item => renderMenuItem(item))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }
                                })()}

                                {/* Empty state handling (only on first page if empty) */}
                                {pageIndex === 0 && pageContent.length === 0 && (
                                    <div className="h-64 flex flex-col items-center justify-center opacity-40">
                                        <LayoutTemplate className="w-16 h-16 mb-4" />
                                        <p className="text-xl">يرجى تحديد التصنيفات من الإعدادات لإظهارها في المنيو</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Footer decoration: Shown only on the last page */}
                            {pageIndex === pagesList.length - 1 && (
                                <div className="mt-4 pt-6 border-t-[2px] border-dotted opacity-50 text-center relative z-10 print:pt-4" style={{ breakInside: 'avoid' }}>
                                    <p className="text-base font-bold">{menuFooter}</p>
                                </div>
                            )}

                            {/* Page Number (Subtle) */}
                            {pagesList.length > 1 && (
                                <div className="absolute bottom-6 left-0 right-0 text-center opacity-30 text-xs font-bold">
                                    {pageIndex + 1}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- Right: Settings / Controls Sidebar --- */}
            <div className="w-full lg:w-80 bg-white border-l border-slate-200 shadow-xl flex flex-col h-full z-20 shrink-0 print:hidden overflow-y-auto custom-scrollbar" style={{ direction: 'rtl' }}>
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Settings className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800">إعدادات المنيو</h2>
                        <p className="text-xs text-slate-500">صمم هويتك المطبعية والرقمية</p>
                    </div>
                </div>

                <div className="p-5 space-y-8">
                    {/* Customize Text & Branding */}
                    <div className="space-y-4 border-b border-slate-100 pb-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500">اسم المطعم</label>
                            <input 
                                type="text" 
                                value={restaurantName}
                                onChange={(e) => setRestaurantName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500">موضّح القائمة (العنوان الفرعي)</label>
                            <input 
                                type="text" 
                                value={menuTitle}
                                onChange={(e) => setMenuTitle(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500">نص التذييل (نهاية المنيو)</label>
                            <input 
                                type="text" 
                                value={menuFooter}
                                onChange={(e) => setMenuFooter(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                            />
                        </div>

                        <div className="space-y-2 pt-2">
                            <label className="text-xs font-bold text-slate-500">شعار المطعم (في صفحة الغلاف)</label>
                            {logoUrl ? (
                                <div className="relative group w-24 h-24 border border-slate-200 rounded-xl overflow-hidden">
                                     <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                     <button onClick={() => setLogoUrl('')} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                         <X className="w-6 h-6" />
                                     </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                                        <ImageIcon className="w-6 h-6 mb-2 text-slate-400" />
                                        <p className="text-xs font-semibold">ارفع شعار المطعم</p>
                                    </div>
                                    <input 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                compressImage(file).then(result => setLogoUrl(result));
                                            }
                                        }}
                                    />
                                </label>
                            )}
                        </div>

                        <label className="flex items-center gap-3 p-3 mt-4 bg-indigo-50 border border-indigo-100 rounded-xl cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={showImages}
                                onChange={(e) => setShowImages(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded bg-white border-indigo-300 focus:ring-indigo-500"
                            />
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm font-bold text-indigo-900">عرض صور الأطباق المعبرة</span>
                            </div>
                        </label>
                    </div>

                    {/* Theme */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-sm text-slate-500 flex items-center gap-2">
                            <Palette className="w-4 h-4" /> تصميم المظهر
                        </h3>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setTheme('classic')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'classic' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 hover:border-slate-200'}`}>
                                <div className="w-8 h-8 rounded-full bg-[#fdfbf7] border border-slate-200"></div>
                                <span className="text-xs font-bold">كلاسيك</span>
                            </button>
                            <button onClick={() => setTheme('modern')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'modern' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:border-slate-200'}`}>
                                <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700"></div>
                                <span className="text-xs font-bold">مودرن</span>
                            </button>
                            <button onClick={() => setTheme('rustic')} className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'rustic' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-100 hover:border-slate-200'}`}>
                                <div className="w-8 h-8 rounded-full bg-[#e4d4ac] border border-[#d4c49c]"></div>
                                <span className="text-xs font-bold">ريفي</span>
                            </button>
                        </div>
                    </div>

                    {/* Font */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-sm text-slate-500 flex items-center gap-2">
                            <Type className="w-4 h-4" /> نوع الخط
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setFont('tajawal')} className={`px-4 py-2 rounded-lg border text-sm transition-all font-tajawal ${font === 'tajawal' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>خط تجوال</button>
                            <button onClick={() => setFont('cairo')} className={`px-4 py-2 rounded-lg border text-sm transition-all font-cairo ${font === 'cairo' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>خط كايرو</button>
                            <button onClick={() => setFont('amiri')} className={`px-4 py-2 rounded-lg border text-sm transition-all font-amiri ${font === 'amiri' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>خط أميري</button>
                        </div>
                    </div>

                    {/* Layout */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-sm text-slate-500 flex items-center gap-2">
                            <Columns className="w-4 h-4" /> التخطيط والإعمدة
                        </h3>
                        <div className="flex bg-slate-100 rounded-xl p-1">
                            <button onClick={() => setColumns(1)} className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${columns === 1 ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                عمود واحد
                            </button>
                            <button onClick={() => setColumns(2)} className={`flex-1 py-2 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${columns === 2 ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                                عمودين
                            </button>
                        </div>
                    </div>

                    {/* Selection */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-sm text-slate-500 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Check className="w-4 h-4" /> التصنيفات المعروضة
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {uniqueCategories.map(cat => (
                                <label key={cat} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent transition-all group">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedCategories.includes(cat) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 group-hover:border-indigo-400'}`}>
                                        {selectedCategories.includes(cat) && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className={`text-sm font-medium ${selectedCategories.includes(cat) ? 'text-slate-800' : 'text-slate-500'}`}>{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    
                    {/* Info */}
                    <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3 text-indigo-800">
                        <MousePointerClick className="w-5 h-5 shrink-0 text-indigo-500 mt-0.5" />
                        <p className="text-xs leading-relaxed font-medium">جرب الضغط على أي طبق في المنيو لعرض مكوناته وتفاصيله الدقيقة. هذه الميزة مفيدة جداً عند عرض المنيو على تابلت رقمي.</p>
                    </div>

                </div>

                <div className="p-5 mt-auto border-t border-slate-100 bg-white">
                    <button 
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <div className="flex items-center gap-2">
                            <Printer className="w-5 h-5" /> 
                            <span>{isPrinting ? 'جاري التجهيز...' : 'طباعة المنيو'}</span>
                        </div>
                        <span className="text-xs font-normal text-slate-400">PDF تصدير كـ أو طباعة ورقية</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// Lucide Icon Helpers
const UtensilsIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
    <path d="M7 2v20"/>
    <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
  </svg>
);
const StarIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

export default RestaurantMenu;
