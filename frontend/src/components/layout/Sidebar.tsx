import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Store, ChevronDown, ChevronRight, Sparkles, Power, Layers, ChevronLeft, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  location: ReturnType<typeof useLocation>;
  settings: any;
  dir: string;
  lang: string;
  user: any;
  filteredNavItems: any[];
  expandedGroups: Record<string, boolean>;
  toggleGroup: (groupLabel: string) => void;
  handleLogoutClick: () => void;
  modeInfo: { color: string; label: string; icon: any };
  t: (key: string, lang: string) => string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  location,
  settings,
  dir,
  lang,
  user,
  filteredNavItems,
  expandedGroups,
  toggleGroup,
  handleLogoutClick,
  modeInfo,
  t
}) => {
  const ModeIcon = modeInfo.icon;
  
  const [userCollapsed, setUserCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const [isHovered, setIsHovered] = useState(false);

  const toggleSidebar = () => {
    const newState = !userCollapsed;
    setUserCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };
  
  useEffect(() => {
    const handleResize = () => {
        if (window.innerWidth < 1024) {
            setUserCollapsed(true);
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isPosPage = location.pathname.includes('/pos') || 
                    location.pathname.includes('/wholesale-pos') || 
                    location.pathname.includes('/restaurant-pos') || 
                    location.pathname.includes('/kitchen') || 
                    location.pathname.includes('/tables') || 
                    location.pathname.includes('/waiter');

  const isActuallyCollapsed = (userCollapsed || (isPosPage && settings?.posSidebarState === 'collapsed')) && !isHovered;

  return (
    <motion.aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isActuallyCollapsed ? 80 : 280 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="bg-dark-950 text-white flex flex-col z-30 shadow-2xl relative overflow-hidden shrink-0 h-full"
    >
      {/* Decorative Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-brand-600/20 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-[200px] h-[200px] bg-purple-600/10 rounded-full blur-[60px]"></div>
      </div>

      {/* Brand Area */}
      <div 
        className="h-24 flex items-center justify-center px-4 relative z-10 border-b border-white/5 cursor-pointer group"
        onClick={toggleSidebar}
        title={userCollapsed ? "تثبيت القائمة" : "طي القائمة تلقائيا"}
      >
        <div className="flex items-center w-full">
          {settings?.logo ? (
            <div className={`w-10 h-10 shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-glow overflow-hidden p-1 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] ${isActuallyCollapsed ? 'mx-auto' : ''}`}>
              <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className={`w-10 h-10 shrink-0 bg-gradient-to-br from-brand-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-glow border border-white/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] ${isActuallyCollapsed ? 'mx-auto' : (dir === 'rtl' ? 'ml-3' : 'mr-3')}`}>
              <Store className="w-5 h-5 text-white" />
            </div>
          )}
          
          <motion.div 
            animate={{ 
              width: isActuallyCollapsed ? 0 : 'auto', 
              opacity: isActuallyCollapsed ? 0 : 1,
              marginLeft: isActuallyCollapsed ? 0 : (dir === 'rtl' ? 0 : 12),
              marginRight: isActuallyCollapsed ? 0 : (dir === 'rtl' ? 12 : 0)
            }}
            transition={{ duration: 0.2 }}
            className="flex flex-col justify-center overflow-hidden whitespace-nowrap min-w-0 flex-1"
          >
            <h1 className="font-extrabold text-xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 truncate transition-colors group-hover:text-white" title={settings?.storeName}>
              {settings?.storeName || 'Nima POS'}
            </h1>
            <div className="mt-1">
              <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded border inline-flex ${modeInfo.color}`}>
                <ModeIcon className="w-3 h-3 shrink-0" />
                <p className="text-[9px] uppercase tracking-wide font-bold">{modeInfo.label}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-700 relative z-10 overflow-x-hidden">
        {filteredNavItems.map((group, idx) => {
          const groupLabel = group.label || group.section;
          const isGroupCollapsed = !expandedGroups[groupLabel];
          const isGroupActive = group.items.some((item: any) => 
            location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path + '/'))
          );
          const shouldHighlightGroup = isGroupActive && !isGroupCollapsed;
          
          return (
            <div key={idx} className="mb-2">
              <motion.div 
                animate={{ 
                  height: isActuallyCollapsed ? 0 : 'auto', 
                  opacity: isActuallyCollapsed ? 0 : 1,
                  marginBottom: isActuallyCollapsed ? 0 : 4
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(groupLabel)}
                  className={`w-full px-3 py-2 text-xs font-black uppercase tracking-wide flex items-center justify-between transition-colors rounded-xl whitespace-nowrap min-w-0 transition-all ${
                    shouldHighlightGroup 
                      ? 'text-purple-300 bg-white/5 font-extrabold' 
                      : 'text-slate-300 font-bold hover:bg-white/[0.03] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {group.label ? group.label : (
                      <>
                        {group.section === 'main' && (lang === 'en' ? 'Main' : 'الرئيسية')}
                        {group.section === 'sales' && (lang === 'en' ? 'Sales' : 'المبيعات')}
                        {group.section === 'inventory' && (lang === 'en' ? 'Inventory' : 'المخزون')}
                        {group.section === 'finance' && (lang === 'en' ? 'Finance' : 'المالية')}
                        {group.section === 'admin' && (lang === 'en' ? 'System' : 'النظام')}
                      </>
                    )}
                  </span>
                  <div className="shrink-0 flex items-center justify-center w-5 h-5">
                    <motion.span
                      animate={{ rotate: isGroupCollapsed ? 0 : (dir === 'rtl' ? -90 : 90) }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-center scale-100"
                    >
                      {dir === 'rtl' ? <ChevronLeft className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    </motion.span>
                  </div>
                </button>
              </motion.div>
              
              <motion.div 
                animate={{ 
                  height: isActuallyCollapsed ? 12 : 0, 
                  opacity: isActuallyCollapsed ? 1 : 0
                }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden flex items-center"
              >
                <div className="w-full h-px bg-white/10"></div>
              </motion.div>

              <AnimatePresence initial={false}>
                {(!isGroupCollapsed || isActuallyCollapsed) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="space-y-1 overflow-hidden"
                  >
                    {group.items.map((item: any, itemIdx: number) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
                      
                      return (
                        <NavLink
                          key={`${group.label}-${item.path}-${itemIdx}`}
                          to={item.path}
                          end
                          title={t(item.label as any, lang) || item.label}
                          className={({ isActive: itemActive }) =>
                            `flex items-center px-3 py-2.5 rounded-xl text-base font-medium transition-all duration-300 group relative overflow-hidden ${
                              itemActive
                                ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm border border-white/10 font-bold'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`
                          }
                        >
                          {({ isActive: itemActive }) => (
                             <>
                               {itemActive && (
                                 <motion.div 
                                   layoutId="sidebar-active-indicator"
                                   className={`absolute top-0 bottom-0 w-1 bg-brand-500 rounded-l-xl ${dir === 'rtl' ? 'left-0' : 'right-0'}`}
                                   transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                 />
                               )}
                               <Icon className={`w-5 h-5 shrink-0 transition-colors ${itemActive ? 'text-brand-300' : 'text-slate-500 group-hover:text-white'}`} />
                               <motion.div 
                                 animate={{ 
                                   width: isActuallyCollapsed ? 0 : '100%', 
                                   opacity: isActuallyCollapsed ? 0 : 1,
                                   marginLeft: isActuallyCollapsed ? 0 : (dir === 'rtl' ? 0 : 12),
                                   marginRight: isActuallyCollapsed ? 0 : (dir === 'rtl' ? 12 : 0)
                                 }}
                                 transition={{ duration: 0.2 }}
                                 className="overflow-hidden flex items-center whitespace-nowrap min-w-0 flex-1 relative"
                               >
                                 <span className="truncate">
                                   {t(item.label as any, lang) || item.label}
                                 </span>
                                 {itemActive && (
                                   <motion.span 
                                     initial={{ opacity: 0, scale: 0.6 }}
                                     animate={{ opacity: 0.5, scale: 1 }}
                                     className={`shrink-0 absolute ${dir === 'rtl' ? 'left-0' : 'right-0'}`}
                                   >
                                     <Sparkles className="w-3 h-3 text-brand-400" />
                                   </motion.span>
                                 )}
                               </motion.div>
                             </>
                          )}
                        </NavLink>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 mt-4 relative z-10 border-t border-white/5 bg-black/20 backdrop-blur-md transition-all overflow-hidden shrink-0">
        <div className={`flex ${isActuallyCollapsed ? 'flex-col items-center gap-2' : 'flex-row items-center justify-between'}`}>
          <div className="flex items-center gap-3 w-full min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex flex-col items-center justify-center text-slate-200 font-bold border border-white/10 shadow-inner">
              {user.name ? user.name[0] : 'U'}
            </div>
            
            <motion.div 
              animate={{ 
                width: isActuallyCollapsed ? 0 : '100%', 
                opacity: isActuallyCollapsed ? 0 : 1,
                marginLeft: isActuallyCollapsed ? 0 : (dir === 'rtl' ? 0 : 10),
                marginRight: isActuallyCollapsed ? 0 : (dir === 'rtl' ? 10 : 0)
              }}
              transition={{ duration: 0.2 }}
              className="flex flex-col justify-center overflow-hidden whitespace-nowrap flex-1 min-w-0"
            >
              <p className="text-sm font-bold text-white truncate">{user.name || 'المستخدم'}</p>
              <p className="text-sm text-slate-400 truncate capitalize">
                {user.role === 'admin' ? 'مدير' : user.role === 'warehouse' ? 'مخزن' : 'كاشير'}
              </p>
            </motion.div>
          </div>
          
          <button
            type="button"
            onClick={handleLogoutClick}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors shrink-0"
            title={t('logout', lang)}
          >
            <Power className="w-5 h-5 shrink-0" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
};
