
import React, { useMemo, useState, useEffect, useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, performBackupToDirectory } from '../db';
import { User, AppMode } from '../types';
import { t } from '../utils/i18n';
import { useToast } from '../context/ToastContext';
import { allNavItems, getModeBadge } from './layout/navigationConfig';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';
import { LicenseContext } from './ActivationGuard';
import { motion, AnimatePresence } from 'framer-motion';
import { SECTION_TO_BIT } from './layout/layoutConstants';
import { LogoutConfirmModal } from './layout/LogoutConfirmModal';
import { useCurrentUser } from '../hooks/useCurrentUser';

interface LayoutProps {
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
  const location = useLocation();
  const isPosPage = location.pathname.includes('/pos') || 
                    location.pathname.includes('/wholesale-pos') || 
                    location.pathname.includes('/restaurant-pos') || 
                    location.pathname.includes('/kitchen') || 
                    location.pathname.includes('/tables') || 
                    location.pathname.includes('/waiter');
                    
  const { success, error, showToast } = useToast();
  const { featuresMask } = useContext(LicenseContext);
  
  const sessionUser = useCurrentUser();
  const dbUser = useLiveQuery(() => sessionUser?.id ? db.users.get(sessionUser.id) : undefined);
  const user = dbUser || sessionUser;

  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const roles = useLiveQuery(() => db.roles.toArray()) || [];
  const lang = settings?.language || 'ar';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const businessType = settings?.businessType || 'retail';
  const accountingEnabled = settings?.enableAccounting || false;
  const currentMode: AppMode = settings?.appMode || 'enterprise'; 
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Dynamic overlay detection to prevent POS modals/dialogs from rendering behind layout Sidebar (z-30)
  const [hasOpenModal, setHasOpenModal] = useState(false);

  useEffect(() => {
    const checkModalInDOM = () => {
      // Any element representing a modal/overlay/backdrop backdrop
      const modalElements = document.querySelectorAll('.fixed.inset-0');
      let count = 0;
      modalElements.forEach(el => {
        // Exclude the logout confirm dialog since it manages its own layout stacking
        if (el.closest('.layout-logout-modal')) return;
        count++;
      });
      setHasOpenModal(count > 0);
    };

    const observer = new MutationObserver(() => {
      checkModalInDOM();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });

    // Run first check
    checkModalInDOM();

    return () => {
      observer.disconnect();
    };
  }, [location.pathname]);

  const isModuleAllowed = (sectionId?: string) => {
    if (featuresMask === 0xFFFF) return true;
    if (!sectionId) return true;
    
    const bit = SECTION_TO_BIT[sectionId];
    if (bit === undefined) return true; // Settings, Admin, System, Reports

    return (featuresMask & (1 << bit)) !== 0;
  };

  const filteredNavItems = useMemo(() => {
    const role = user.role || 'cashier';
    const userRoleObj = roles.find(r => r.name === role);
    const rolePermissions = userRoleObj?.permissions || [];
    const allPermissions = Array.from(new Set([...(user.permissions || []), ...rolePermissions]));
    
    const isAdmin = role === 'admin' || allPermissions.includes('all');

    return allNavItems
      .filter(section => isModuleAllowed(section.section))
      .map(section => ({
      ...section,
      items: section.items.filter(item => {
          // Role/Permission Check
          const hasPermission = isAdmin || allPermissions.includes(item.path) || allPermissions.includes('/');
          // Business Type Check
          const typeMatch = !(item as any).businessTypes || (item as any).businessTypes.includes(businessType);
          // Module Enabled Check
          let conditionCheck = true;
          if ((item as any).condition === 'accountingEnabled') {
              conditionCheck = accountingEnabled;
          } else if ((item as any).condition !== undefined) {
              conditionCheck = (item as any).condition === true;
          }
          // Mode Check
          const modeCheck = item.modes.includes(currentMode);
          // Hidden Pages Check
          const isHidden = settings?.hiddenPages?.includes(item.path) || false;
          
          return hasPermission && typeMatch && conditionCheck && modeCheck && !isHidden;
      })
    })).filter(section => section.items.length > 0);
  }, [user.role, user.permissions, roles, allNavItems, businessType, accountingEnabled, currentMode, settings?.hiddenPages, featuresMask]);

  const toggleGroup = (groupLabel: string) => {
    setExpandedGroups(prev => {
      if (prev[groupLabel]) {
        return {};
      } else {
        return { [groupLabel]: true };
      }
    });
  };

  useEffect(() => {
    for (const group of filteredNavItems) {
      const groupLabel = group.label || group.section;
      const isActive = group.items.some(item => 
        location.pathname === item.path || 
        (item.path !== '/' && location.pathname.startsWith(item.path + '/'))
      );
      if (isActive) {
        setExpandedGroups(prev => {
          if (prev[groupLabel] && Object.keys(prev).length === 1) {
            return prev;
          }
          return { [groupLabel]: true };
        });
        break;
      }
    }
  }, [location.pathname, filteredNavItems]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setIsBackingUp(true);
    
    // Auto Backup Logic
    if (settings?.autoBackupOnClose) {
        try {
            showToast('جاري النسخ الاحتياطي...', 'info');
            const result = await performBackupToDirectory();
            if (result) success('تم النسخ الاحتياطي بنجاح');
            else error('تعذر الوصول لمجلد النسخ. تحقق من الإعدادات.');
        } catch (e) {
            console.error("Backup failed", e);
        }
    }
    
    localStorage.removeItem('nima_user');
    setIsBackingUp(false);
    setShowLogoutConfirm(false);
    
    if (onLogout) {
        onLogout();
    } else {
        window.location.reload();
    }
  };

  const modeInfo = getModeBadge(currentMode);
  const ModeIcon = modeInfo.icon;

  const totalPages = allNavItems.reduce((acc, section) => acc + section.items.length, 0);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-['Tajawal'] transition-colors duration-300" dir={dir} id="main-app-container">
      
      {/* Logout/Exit Confirmation Modal */}
      <LogoutConfirmModal 
        isOpen={showLogoutConfirm}
        isBackingUp={isBackingUp}
        autoBackupOnClose={!!settings?.autoBackupOnClose}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={confirmLogout}
      />

      {/* Sidebar */}
      {!(isPosPage && settings?.posSidebarState === 'hidden') && (
        <Sidebar 
          location={location}
          settings={settings}
          dir={dir}
          lang={lang}
          user={user}
          filteredNavItems={filteredNavItems}
          expandedGroups={expandedGroups}
          toggleGroup={toggleGroup}
          handleLogoutClick={handleLogoutClick}
          modeInfo={modeInfo}
          t={t}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50 transition-colors duration-300">
        {!isPosPage && (
          <Header 
              user={user}
              roles={roles}
              settings={settings}
              lang={lang}
              dir={dir}
              businessType={businessType}
              accountingEnabled={accountingEnabled}
              currentMode={currentMode}
              isModuleAllowed={isModuleAllowed}
          />
        )}

        {/* Content Viewport */}
        <div 
          data-testid="content-viewport"
          className={`flex-1 overflow-hidden relative ${isPosPage ? (hasOpenModal ? 'z-40' : 'z-10') : 'z-10'} bg-slate-50 shadow-[inset_0_4px_20px_rgba(0,0,0,0.02)]`}
        >
             <div className={`absolute inset-0 ${isPosPage ? 'overflow-hidden' : 'overflow-y-auto'} scroll-smooth`}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ 
                      type: 'spring',
                      stiffness: 380,
                      damping: 32,
                      mass: 0.8
                    }}
                    style={{ willChange: 'transform, opacity' }}
                    className={`w-full flex flex-col ${isPosPage ? 'h-full max-h-full overflow-hidden' : 'min-h-full'}`}
                  >
                    <Outlet />
                  </motion.div>
                </AnimatePresence>
             </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
