import React, { RefObject } from 'react';
import { Search, RotateCcw, Plus, ScanBarcode, X, PauseCircle, Clock, LayoutGrid, List, Layers, Unlock, Printer, Settings as SettingsIcon, PanelLeftClose, PanelLeft, PanelLeftOpen, Tag, Keyboard, Scale, History, LayoutPanelLeft, Grip, Minus, Table } from 'lucide-react';
import { AppSettings, Category } from '../../types';
import { iconMap } from '../../utils/categoryIcons';
import { db } from '../../db';

interface HeaderAndFiltersProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    searchInputRef: RefObject<HTMLInputElement>;
    handleSearchSubmit: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    autoFocusEnabled: boolean;
    setAutoFocusEnabled: (enabled: boolean) => void;
    isRefundMode: boolean;
    setIsRefundMode: (mode: boolean) => void;
    setIsCustomItemModalOpen: (isOpen: boolean) => void;
    setIsHeldOrdersModalOpen: (isOpen: boolean) => void;
    setIsShiftModalOpen: (isOpen: boolean) => void;
    heldOrders: any[] | undefined;
    categories: string[];
    dbCategories?: Category[];
    selectedCategory: string;
    setSelectedCategory: (category: string) => void;
    viewMode: 'grid' | 'list' | 'categories' | 'bento' | 'compact' | 'table';
    setViewMode: (mode: 'grid' | 'list' | 'categories' | 'bento' | 'compact' | 'table') => void;
    onOpenCashDrawer: () => void;
    settings?: AppSettings;
    onPrintLastBill?: () => void;
    onOpenSettings?: () => void;
    onOpenPriceCheck?: () => void;
    onOpenShortcuts?: () => void;
    onReadScale?: () => void;
    onOpenHistory?: () => void;
    uiScale?: number;
    setUiScale?: (scale: number) => void;
    isWholesale?: boolean;
}

export const HeaderAndFilters: React.FC<HeaderAndFiltersProps> = ({
    searchTerm, setSearchTerm, searchInputRef, handleSearchSubmit,
    autoFocusEnabled, setAutoFocusEnabled,
    isRefundMode, setIsRefundMode,
    setIsCustomItemModalOpen, setIsHeldOrdersModalOpen, setIsShiftModalOpen, heldOrders,
    categories, dbCategories, selectedCategory, setSelectedCategory,
    viewMode, setViewMode, onOpenCashDrawer, settings, onPrintLastBill, onOpenSettings, onOpenPriceCheck, onOpenShortcuts, onReadScale, onOpenHistory,
    uiScale = 1, setUiScale, isWholesale
}) => {
    const isEnabled = (key: keyof NonNullable<AppSettings['posSettings']>) => {
        if (!settings?.posSettings) return true;
        if (settings.posSettings[key] === undefined) return true;
        return settings.posSettings[key];
    };

    const toggleSidebar = async () => {
        const currentState = settings?.posSidebarState || 'visible';
        let nextState: 'visible' | 'collapsed' | 'hidden' = 'visible';
        
        if (currentState === 'visible') nextState = 'collapsed';
        else if (currentState === 'collapsed') nextState = 'hidden';
        else nextState = 'visible';

        try {
            await db.settings.update(1, { posSidebarState: nextState });
        } catch (error) {
            console.error("Failed to update sidebar state", error);
        }
    };

    const renderSidebarIcon = () => {
        const state = settings?.posSidebarState || 'visible';
        if (state === 'visible') return <PanelLeftClose className="w-6 h-6" />;
        if (state === 'collapsed') return <PanelLeft className="w-6 h-6" />;
        return <PanelLeftOpen className="w-6 h-6" />;
    };

    const [isListening, setIsListening] = React.useState(false);

    const handleVoiceSearch = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("البحث الصوتي غير مدعوم في هذا المتصفح.");
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.lang = 'ar-SA';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setSearchTerm(transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        
        recognition.start();
    };

    return (
        <div className={`px-4 md:px-6 py-4 flex flex-col gap-4 z-10 backdrop-blur-md transition-all duration-300 shadow-sm border-b border-indigo-100/10 ${isRefundMode ? 'bg-red-50/90' : 'bg-white/60'}`}>
          
          {/* Wholesale-Specific Premium Context Banner / KPI Strip */}
          {isWholesale && (
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-transparent">
                  <div className="flex items-center gap-3">
                      <div className="p-3 bg-brand-50 text-brand-600 rounded-2xl border border-brand-100">
                          <Layers className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                          <h2 className="font-black text-slate-800 text-base leading-tight">
                              شاشة مبيعات الجملة الكبرى والتوريدات
                          </h2>
                          <p className="text-xs text-slate-500 font-bold mt-1">
                              دعم الفواتير الضخمة • إدارة رصيد المستودعات المتعددة • البيع بالعبوة والحبة
                          </p>
                      </div>
                  </div>

                  {/* Status Indicators for Industrial Wholesale */}
                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                      {/* Indicator 1: Packaging mode */}
                      <div className="flex-1 sm:flex-none flex items-center justify-between gap-4 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-right">
                              <div className="text-[10px] text-slate-400 font-bold leading-none">تعبئة المستودع</div>
                              <div className="text-xs font-black text-slate-700 mt-1">ثنائية (كرتون / حبة)</div>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      </div>

                      {/* Indicator 2: Scanner connection */}
                      <div className="flex-1 sm:flex-none flex items-center justify-between gap-4 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-right">
                              <div className="text-[10px] text-slate-400 font-bold leading-none">القارئ السريع F4</div>
                              <div className="text-xs font-black text-slate-700 mt-1">
                                  {autoFocusEnabled ? 'متصل ونشط ⚡' : 'مسح مانيوال'}
                              </div>
                          </div>
                          <span className={`w-2 h-2 rounded-full ${autoFocusEnabled ? 'bg-indigo-500' : 'bg-amber-500'}`}></span>
                      </div>

                      {/* Indicator 3: Currency & Terminal */}
                      <div className="flex-1 sm:flex-none flex items-center justify-between gap-4 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="text-right">
                              <div className="text-[10px] text-slate-400 font-bold leading-none">جهاز الميزان</div>
                              <div className="text-xs font-black text-slate-700 mt-1">منفذ تسلسلي USB</div>
                          </div>
                          <Scale className="w-4 h-4 text-brand-500" />
                      </div>
                  </div>
              </div>
          )}

          {/* Unified Slim Workspace Bar (Combines Quick Entry & Action Icons to save vertical space) */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5 bg-white backdrop-blur-md p-3 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.04)] border border-transparent select-none">
              
              {/* Right Side (RTL): Sidebar Toggle & Quick Search/Scan input */}
              <div className="flex items-center gap-2.5 flex-grow lg:flex-grow-0 min-w-[280px] xl:max-w-md">
                  {/* Sidebar Toggle */}
                  <button 
                      onClick={toggleSidebar} 
                      className={`p-3 rounded-xl transition-all border shrink-0 ${settings?.posSidebarState === 'hidden' ? 'bg-brand-600 text-white border-brand-500 shadow-md' : 'bg-white text-gray-400 border-slate-200 hover:text-brand-600 hover:bg-slate-50'}`} 
                      title="عرض/إخفاء القائمة الإضافية"
                  >
                      {renderSidebarIcon()}
                  </button>

                  {/* Quick Entry / Barcode Search Input */}
                  <div className={`relative flex-1 shadow-sm rounded-xl ${!isEnabled('showBarcodeScanner') ? 'opacity-95' : ''}`}>
                      <Search className={`absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 ${autoFocusEnabled && isEnabled('showBarcodeScanner') ? 'text-brand-500' : 'text-gray-400'}`} />
                      <input
                          ref={searchInputRef}
                          type="text"
                          placeholder={autoFocusEnabled && isEnabled('showBarcodeScanner') ? "جاهز للمسح أو الإدخال السريع..." : "ابحث بالاسم أو الباركود..."}
                          className={`w-full pr-10 pl-20 py-2.5 bg-slate-50 border-2 rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-100/50 transition-all outline-none font-bold text-sm text-gray-750 ${autoFocusEnabled && isEnabled('showBarcodeScanner') ? 'border-brand-300 shadow-sm' : 'border-slate-150'} ${isListening ? 'bg-red-50 border-red-200' : ''}`}
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          onKeyDown={handleSearchSubmit}
                      />
                      <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button 
                              onClick={handleVoiceSearch} 
                              className={`p-1 rounded-lg transition-all flex items-center justify-center ${isListening ? 'text-red-550 bg-red-100 animate-pulse' : 'text-slate-400 hover:text-brand-600'}`}
                              title="البحث الصوتي (ميكروفون)"
                          >
                              <i className="not-italic text-xs">🎤</i>
                          </button>
                          {searchTerm && (
                              <button 
                                  onClick={() => {setSearchTerm(''); searchInputRef.current?.focus();}} 
                                  className="text-gray-450 hover:text-red-500 bg-slate-200/60 rounded-full p-0.5"
                              >
                                  <X className="w-3 h-3" />
                              </button>
                          )}
                      </div>
                  </div>
              </div>

              {/* Left Side (RTL) / Icons Group: Consolidated actions next to research search bar */}
              <div className="flex items-center gap-2 justify-start xl:justify-end overflow-x-auto pb-1.5 max-w-full hide-scrollbar shrink-0 scroll-smooth flex-nowrap">
                  
                  {/* Item 1: Barcode AutoFocus Scanning & Scaling Combined Capsule */}
                  {isEnabled('showBarcodeScanner') && (
                      <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 gap-1.5 shadow-sm h-10 shrink-0">
                          <button 
                            onClick={() => setAutoFocusEnabled(!autoFocusEnabled)}
                            className={`h-8 px-3 rounded-lg flex items-center justify-center transition-all active:scale-95 text-xs font-bold gap-1.5 shrink-0 ${autoFocusEnabled ? 'bg-brand-600 text-white shadow-sm hover:bg-brand-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                            title="تبديل القارئ السريع F4"
                          >
                              <ScanBarcode className="w-4 h-4 stroke-[2]" />
                          </button>
                          
                          {/* Scale Multiplier */}
                          <button 
                            onClick={() => {
                                if (setUiScale && uiScale) {
                                    const nextScale = uiScale >= 1.2 ? 0.9 : uiScale + 0.1;
                                    setUiScale(Number(nextScale.toFixed(1)));
                                }
                            }}
                            className="text-xs font-black select-none font-mono text-slate-500 hover:text-brand-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 px-2 py-1 rounded-lg transition-all shrink-0"
                            title="تكبير/تصغير خطوط شاشات نقاط البيع"
                          >
                              {uiScale}x
                          </button>
                      </div>
                  )}

                  {/* Item 2: Electronic Weighing Scale / جهاز الميزان الذكي */}
                  <button 
                    onClick={onReadScale} 
                    className="w-10 h-10 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 border border-emerald-200/80 hover:border-emerald-300 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                    title="الربط وجلب الوزن من الميزان الإلكتروني"
                  >
                      <Scale className="w-5 h-5 stroke-[2]" />
                  </button>

                  {/* Item 3: Free Custom Price Item / صنف حر */}
                  <button 
                    onClick={() => setIsCustomItemModalOpen(true)} 
                    className="w-10 h-10 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200/80 hover:border-blue-300 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                    title="أصناف ومبالغ حرة غير مكودة للتسجيل اليدوي"
                  >
                      <Plus className="w-5 h-5 stroke-[2]" />
                  </button>

                  {/* Item 4: Price Enquiry / شرح الأسعار */}
                  {onOpenPriceCheck && (
                      <button 
                        onClick={onOpenPriceCheck} 
                        className="w-10 h-10 bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 border border-amber-200/80 hover:border-amber-300 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                        title="محرك شرح أسعار السلع وعينات خصم الجملة"
                      >
                          <Tag className="w-5 h-5 stroke-[2]" />
                      </button>
                  )}

                  {/* Item 5: Invoice Archive History / أرشيف المبيعات */}
                  {onOpenHistory && (
                      <button 
                        onClick={onOpenHistory} 
                        className="w-10 h-10 bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-700 border border-purple-200/80 hover:border-purple-300 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                        title="أرشيف وسجلات المبيعات السابقة"
                      >
                          <History className="w-5 h-5 stroke-[2]" />
                      </button>
                  )}

                  {/* Item 6: Suspended Bills / الفواتير المعلقة */}
                  {isEnabled('showHoldBill') && (
                      <button 
                        onClick={() => setIsHeldOrdersModalOpen(true)} 
                        className="w-10 h-10 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 border border-indigo-200/80 hover:border-indigo-300 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm relative shrink-0 cursor-pointer"
                        title="قرارات تعليق الفواتير المفتوحة مؤقتاً"
                      >
                          <PauseCircle className="w-5 h-5 stroke-[2]" />
                          {heldOrders && heldOrders.length > 0 && (
                              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                          )}
                      </button>
                  )}

                  {/* Item 7: Return Mode Toggle / فواتير مرتجعة */}
                  {isEnabled('showReturns') && (
                      <button 
                        onClick={() => setIsRefundMode(!isRefundMode)} 
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm border shrink-0 cursor-pointer ${isRefundMode ? 'bg-gradient-to-br from-red-500 to-rose-600 border-red-500 text-white animate-pulse shadow-md shadow-red-500/10' : 'bg-red-50 hover:bg-red-100 border-red-200/80 hover:border-red-300 text-red-650 hover:text-red-750'}`}
                        title="تفعيل نمط الفواتير المرتجعة"
                      >
                          <RotateCcw className="w-5 h-5 stroke-[2]" />
                      </button>
                  )}

                  {/* Item 8: Print Last Bill / طباعة الفاتورة السابقة */}
                  {isEnabled('showPrintBill') && (
                      <button 
                        onClick={onPrintLastBill} 
                        className="w-10 h-10 bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 border border-sky-200/80 hover:border-sky-300 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                        title="إعادة طباعة سند التحصيل النهائي"
                      >
                          <Printer className="w-5 h-5 stroke-[2]" />
                      </button>
                  )}

                  {/* Visual Divider separating everyday sales metrics from backend management */}
                  <div className="w-px h-6 bg-slate-200 mx-1.5 hidden md:block shrink-0"></div>

                  {/* Item 9: Customer Display Monitor / شاشة العميل */}
                  <button 
                    onClick={() => {
                        window.open('/customer-display', 'CustomerDisplay', 'width=1024,height=768');
                    }}
                    className="w-10 h-10 bg-cyan-50 hover:bg-cyan-100 text-cyan-600 hover:text-cyan-700 border border-cyan-200/80 hover:border-cyan-300 rounded-xl flex items-center justify-center text-cyan-600 hover:text-cyan-700 transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                    title="إسقاط شاشة العميل الثانية والوسائط"
                  >
                      <PanelLeftOpen className="w-5 h-5 stroke-[2]" />
                  </button>

                  {/* Item 10: Cash Drawer / فتح درج الكاشير */}
                  {isEnabled('showCashDrawer') && (
                      <button 
                        onClick={onOpenCashDrawer} 
                        className="w-10 h-10 bg-teal-50 hover:bg-teal-100 text-teal-600 hover:text-teal-700 border border-teal-200/80 hover:border-teal-300 rounded-xl flex items-center justify-center text-teal-600 hover:text-teal-700 transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                        title="طرد درج الكاشير النقدي"
                      >
                          <Unlock className="w-5 h-5 stroke-[2]" />
                      </button>
                  )}

                  {/* Item 11: Shortcuts / اختصارات الكيبورد */}
                  {onOpenShortcuts && (
                      <button 
                        onClick={onOpenShortcuts} 
                        className="w-10 h-10 bg-pink-50 hover:bg-pink-100 text-pink-600 hover:text-pink-700 border border-pink-200/80 hover:border-pink-300 rounded-xl flex items-center justify-center text-pink-600 hover:text-pink-700 transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                        title="اختصارات لوحة المفاتيح السريعة"
                      >
                          <Keyboard className="w-5 h-5 stroke-[2]" />
                      </button>
                  )}

                  {/* Item 12: Shifts / الوردية الحالية */}
                  <button 
                    onClick={() => setIsShiftModalOpen(true)} 
                    className="w-10 h-10 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200/80 hover:border-rose-300 rounded-xl flex items-center justify-center text-rose-600 hover:text-rose-700 transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                    title="أعمال الوردية والمقبوضات اليومية للموظف"
                  >
                      <Clock className="w-5 h-5 stroke-[2]" />
                  </button>

                  {/* Item 13: Settings / الإعدادات الفنية للمبيعات */}
                  {onOpenSettings && (
                      <button 
                        onClick={onOpenSettings} 
                        className="w-10 h-10 bg-slate-55 hover:bg-slate-100 text-slate-600 hover:text-slate-750 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-center text-slate-650 hover:text-slate-750 transition-all active:scale-95 shadow-sm shrink-0 cursor-pointer"
                        title="إعدادات النظام والمدخلات الفنية"
                      >
                          <SettingsIcon className="w-5 h-5 stroke-[2]" />
                      </button>
                  )}

                  {/* Item 14: SIM Caller Simulator / محاكاة الهاتف بوارد كولر */}
                  <button 
                    onClick={() => (window as any).simulateIncomingCall?.()} 
                    className="w-10 h-10 bg-emerald-50 hover:bg-emerald-100 border border-emerald-155 rounded-xl flex items-center justify-center text-emerald-700 transition-all active:scale-95 shadow-sm animate-pulse shrink-0"
                    title="محاكاة اتصال هاتفي وارد كاشف رقم العميل"
                  >
                      <span className="text-base">📞</span>
                  </button>

              </div>
          </div>
          
          {/* Bottom Toolbar: Category Tabs & View Modes side-by-side (Directly above products) */}
          <div className="flex flex-col min-[850px]:flex-row min-[850px]:items-center justify-between gap-4 mt-2">
              {/* Category Tabs Pill list with premium styling */}
              {viewMode !== 'categories' ? (
                  <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide flex-1 w-full min-[850px]:w-auto px-1">
                      {categories.map(cat => {
                          const dbCat = dbCategories?.find(c => c.name === cat);
                          const Icon = dbCat?.icon ? iconMap[dbCat.icon] : null;

                          const getCategoryPillStyles = (catName: string, isSelected: boolean) => {
                              const name = catName.trim();
                              if (isSelected) {
                                  if (name === 'الكل') return 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20';
                                  if (name === 'الوجبات' || name.includes('وجب')) return 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-500 shadow-md shadow-amber-500/20';
                                  if (name === 'المشروبات' || name.includes('مشروب')) return 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white border-sky-500 shadow-md shadow-sky-500/20';
                                  if (name === 'المقبلات' || name.includes('مقبل')) return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20';
                                  if (name === 'الحلويات' || name.includes('حلو')) return 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-500 shadow-md shadow-rose-500/20';
                                  if (name === 'المخبوزات' || name.includes('مخبوز') || name.includes('خبز')) return 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-yellow-500 shadow-md shadow-yellow-500/20';
                                  return 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white border-brand-600 shadow-md shadow-brand-600/20';
                              } else {
                                  if (name === 'الكل') return 'bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border-indigo-150 text-indigo-700 hover:from-indigo-100 hover:to-blue-100';
                                  if (name === 'الوجبات' || name.includes('وجب')) return 'bg-gradient-to-r from-amber-50/80 to-orange-50/80 border-amber-150 text-amber-700 hover:from-amber-100 hover:to-orange-100';
                                  if (name === 'المشروبات' || name.includes('مشروب')) return 'bg-gradient-to-r from-sky-50/80 to-cyan-50/80 border-sky-150 text-sky-700 hover:from-sky-100 hover:to-cyan-100';
                                  if (name === 'المقبلات' || name.includes('مقبل')) return 'bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-emerald-150 text-emerald-700 hover:from-emerald-100 hover:to-teal-100';
                                  if (name === 'الحلويات' || name.includes('حلو')) return 'bg-gradient-to-r from-rose-50/80 to-pink-50/80 border-rose-150 text-rose-700 hover:from-rose-100 hover:to-pink-100';
                                  if (name === 'المخبوزات' || name.includes('مخبوز') || name.includes('خبز')) return 'bg-gradient-to-r from-yellow-50/80 to-amber-50/80 border-yellow-150 text-yellow-700 hover:from-yellow-100 hover:to-amber-100';
                                  return 'bg-gradient-to-r from-slate-50/80 to-zinc-50/80 border-slate-200 text-slate-600 hover:from-slate-100 hover:to-zinc-100 hover:text-slate-800';
                              }
                          };

                          return (
                              <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-5 py-2.5 rounded-xl text-[13px] font-extrabold whitespace-nowrap transition-all flex items-center gap-2 border ${getCategoryPillStyles(cat, selectedCategory === cat)}`}
                              >
                                  {Icon && <Icon className="w-4 h-4 shrink-0" />}
                                  <span>{cat}</span>
                              </button>
                          );
                      })}
                  </div>
              ) : (
                  <div className="text-xs text-slate-400 font-bold flex-1">
                      انقر لتصفح أي تصنيف لعرض المنتجات المسجلة فيه
                  </div>
              )}

              {/* View Modes Selector - Pure Icons, No Words (As requested) */}
              <div className="flex items-center gap-2 font-bold shrink-0 self-start min-[850px]:self-auto w-full min-[850px]:w-auto justify-end">
                  <div className="flex bg-slate-200/60 rounded-xl p-1 border border-slate-250">
                      <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-850'}`} title="شبكي">
                          <LayoutGrid className="w-4 h-4 mx-auto" />
                      </button>
                      <button onClick={() => setViewMode('bento')} className={`p-2 rounded-lg transition-all ${viewMode === 'bento' ? 'bg-white shadow-sm text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-850'}`} title="بينتو">
                          <LayoutPanelLeft className="w-4 h-4 mx-auto" />
                      </button>
                      <button onClick={() => setViewMode('compact')} className={`p-2 rounded-lg transition-all ${viewMode === 'compact' ? 'bg-white shadow-sm text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-850'}`} title="مصغر">
                          <Grip className="w-4 h-4 mx-auto" />
                      </button>
                      <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-850'}`} title="قائمة">
                          <List className="w-4 h-4 mx-auto" />
                      </button>
                      <button onClick={() => setViewMode('categories')} className={`p-2 rounded-lg transition-all ${viewMode === 'categories' ? 'bg-white shadow-sm text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-850'}`} title="تصنيفات">
                          <Layers className="w-4 h-4 mx-auto" />
                      </button>
                      <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-850'}`} title="الجدول المهني للجملة">
                          <Table className="w-4 h-4 mx-auto" />
                      </button>
                  </div>
              </div>
          </div>

        </div>
    );
};
