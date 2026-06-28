import React, { useMemo, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, Layers } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { pageKeyFeatures, allNavItems } from './navigationConfig';
import { SyncIndicator } from '../ui/SyncIndicator';
import { PrinterMonitor } from '../ui/PrinterMonitor';
import { t } from '../../utils/i18n';
import { LicenseContext } from '../ActivationGuard';

// Modular Subcomponents
import { GlobalSearch } from './GlobalSearch';
import { ThemeSelector } from './ThemeSelector';
import { NotificationsDropdown } from './NotificationsDropdown';

interface HeaderProps {
    user: any;
    roles: any[];
    settings: any;
    lang: string;
    dir: string;
    businessType: string;
    accountingEnabled: boolean;
    currentMode: string;
    isModuleAllowed: (sectionId?: string) => boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
    user, roles, settings, lang, dir, businessType, accountingEnabled, currentMode, isModuleAllowed 
}) => {
    const { theme, setTheme } = useTheme();
    const location = useLocation();
    const { featuresMask } = useContext(LicenseContext);
    
    // Date
    const currentDate = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-US', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    }).format(new Date());

    const flattenedPages = useMemo(() => {
        const list: { path: string; label: string; sectionLabel: string }[] = [];
        allNavItems.forEach(group => {
            const sectionLabel = group.label || group.section;
            group.items.forEach(item => {
                if (!list.some(p => p.path === item.path)) {
                    list.push({
                        path: item.path,
                        label: item.label,
                        sectionLabel: sectionLabel
                    });
                }
            });
        });
        return list;
    }, []);

    const currentPageInfo = useMemo(() => {
        const path = location.pathname;
        let idx = flattenedPages.findIndex(p => p.path === path);
        if (idx === -1) {
            let bestIdx = -1;
            let maxLen = 0;
            flattenedPages.forEach((p, index) => {
                if (p.path !== '/' && path.startsWith(p.path)) {
                    if (p.path.length > maxLen) {
                        maxLen = p.path.length;
                        bestIdx = index;
                    }
                }
            });
            idx = bestIdx;
        }

        const total = flattenedPages.length;
        if (idx === -1) {
            return {
                number: 1,
                total,
                label: lang === 'ar' ? 'لوحة القيادة' : 'Dashboard',
                sectionLabel: lang === 'ar' ? 'الرئيسية' : 'Main'
            };
        }

        const curPage = flattenedPages[idx];
        const localizedLabel = t(curPage.label as any, lang as any) || curPage.label;
        const localizedSection = t(curPage.sectionLabel as any, lang as any) || curPage.sectionLabel;

        return {
            number: idx + 1,
            total,
            label: localizedLabel,
            sectionLabel: localizedSection
        };
    }, [location.pathname, flattenedPages, lang]);

    const totalPages = allNavItems.reduce((acc, section) => acc + section.items.length, 0);

    // Search Logic
    const searchablePages = useMemo(() => {
        const pages: { path: string, label: string, icon: any, section: string, isVisible: boolean, features: string[] }[] = [];
        allNavItems.filter(group => isModuleAllowed(group.section)).forEach(group => {
            const sectionName = group.label || group.section;
            group.items.forEach(item => {
                const role = user?.role || 'cashier';
                const userRoleObj = roles.find(r => r.name === role);
                const rolePermissions = userRoleObj?.permissions || [];
                const allPermissions = Array.from(new Set([...(user?.permissions || []), ...rolePermissions]));

                const isAdmin = role === 'admin' || allPermissions.includes('all');
                const hasPermission = isAdmin || allPermissions.includes(item.path) || allPermissions.includes('/');
                let conditionCheck = true;
                if ((item as any).condition === 'accountingEnabled') conditionCheck = accountingEnabled;
                else if ((item as any).condition !== undefined) conditionCheck = (item as any).condition === true;

                if (hasPermission && conditionCheck) {
                    pages.push({
                        path: item.path,
                        label: t(item.label as any, lang as any) || item.label,
                        icon: item.icon,
                        section: sectionName,
                        isVisible: true,
                        features: pageKeyFeatures[item.path] || []
                    });
                }
            });
        });
        return pages;
    }, [allNavItems, lang, user, roles, businessType, currentMode, settings, accountingEnabled, featuresMask]);

    return (
        <header id="top-header" className="relative h-16 px-8 flex items-center justify-between z-30 shrink-0 bg-dark-950 text-white border-b border-white/5">
            <div className="flex-1 flex items-center gap-4">
                {/* Page Number & Navigation Tracking Badge */}
                <div 
                    id="page-number-indicator"
                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-2xl border border-white/10 text-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-sm shrink-0 font-medium select-none transition-all duration-250 cursor-default"
                    title={`الصفحة رقم ${currentPageInfo.number} من أصل ${currentPageInfo.total} صفحة مخصصة بالنظام`}
                >
                    <div 
                        className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-600 text-white font-mono font-black text-xs shadow-sm ring-4 ring-brand-500/20 flex-shrink-0 transition-transform duration-200 hover:scale-105"
                        style={{ contentVisibility: 'auto' }}
                    >
                        #{currentPageInfo.number}
                    </div>
                    <div className={`flex flex-col justify-center leading-tight ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
                        <span className="text-xs font-extrabold text-white max-w-[130px] sm:max-w-[180px] truncate">
                            {currentPageInfo.label}
                        </span>
                        <span className="text-[10px] text-white/55 font-bold mt-0.5">
                            {currentPageInfo.sectionLabel}
                        </span>
                    </div>
                    <div className="border-r border-white/10 h-5 mx-1 hidden min-[400px]:block"></div>
                    <div className="hidden min-[400px]:flex items-center gap-1" dir={dir}>
                        <span className="font-mono text-xs font-extrabold text-brand-300 bg-brand-950/40 border border-brand-500/20 px-2 py-0.5 rounded-lg shadow-inner shrink-0 leading-none">
                            {currentPageInfo.number}
                        </span>
                        <span className="text-white/40 text-[10px] font-bold px-0.5 select-none shrink-0">
                            {lang === 'ar' ? 'من' : 'of'}
                        </span>
                        <span className="font-mono text-xs font-extrabold text-white/70 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg shrink-0 leading-none">
                            {currentPageInfo.total}
                        </span>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-2 text-white/60 shrink-0">
                   <span className="text-sm font-bold text-white/80 bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-400" />
                    {currentDate}
                   </span>
                   <span className="text-xs font-bold text-white/80 bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center gap-1" title="عدد الصفحات المتاحة">
                    <Layers className="w-4 h-4 text-brand-400" />
                    {totalPages}
                   </span>
                   <PrinterMonitor />
                   <SyncIndicator />
                </div>

                {/* Global Search Component */}
                <GlobalSearch searchablePages={searchablePages} dir={dir} />
            </div>

            <div className="flex items-center gap-4 relative shrink-0">
                {/* Theme Selector Component */}
                <ThemeSelector theme={theme} setTheme={setTheme} dir={dir} />

                {/* Notification Dropdown Component */}
                <NotificationsDropdown lang={lang} dir={dir} />
            </div>
        </header>
    );
};
