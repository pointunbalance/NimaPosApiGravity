import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Database, Settings, LayoutGrid, TerminalSquare, Search, Trash2, Play, Code
} from 'lucide-react';
import { allNavItems, pageKeyFeatures } from '../components/layout/navigationConfig';
import { db, seedLargeDataSet, getSqlSchema } from '../db';
import ConfirmModal from '../components/ui/ConfirmModal';

// Imported modular sub-components and constants
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { DashboardSidebarMenu } from '../components/dashboard/DashboardSidebarMenu';
import { DashboardDevTools } from '../components/dashboard/DashboardDevTools';
import { DashboardTableStatus } from '../components/dashboard/DashboardTableStatus';
import { TABS, CATEGORY_MAP } from '../components/dashboard/constants';
import { SchemaModal } from '../components/dashboard/SchemaModal';
import { DeveloperToolsCard } from '../components/dashboard/DeveloperToolsCard';
import { ModuleCard } from '../components/dashboard/ModuleCard';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [tableCounts, setTableCounts] = useState<{name: string, count: number}[]>([]);
    const [isSeeding, setIsSeeding] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    
    // Developer tool modals
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
    const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
    const [messageBox, setMessageBox] = useState<{message: string, isError?: boolean} | null>(null);
    const [activeTab, setActiveTab] = useState('all');

    const fetchCounts = async () => {
        const counts = await Promise.all(
            db.tables.map(async (table) => {
                const count = await table.count();
                return { name: table.name, count };
            })
        );
        setTableCounts(counts.sort((a,b) => b.count - a.count));
    };

    useEffect(() => {
        fetchCounts();
    }, []);

    const performClearData = async () => {
        setIsClearing(true);
        try {
            const tablesToClear = db.tables.filter(t => !['settings', 'users'].includes(t.name));
            await Promise.all(tablesToClear.map(t => t.clear()));
            await fetchCounts();
            setMessageBox({ message: 'تم تفريغ البيانات بنجاح!' });
        } catch(e) {
            console.error(e);
            setMessageBox({ message: 'حدث خطأ أثناء التفريغ', isError: true });
        } finally {
            setIsClearing(false);
            setIsClearModalOpen(false);
        }
    };

    const performSeedData = async () => {
        setIsSeeding(true);
        try {
            await seedLargeDataSet();
            await fetchCounts();
            setMessageBox({ message: 'تم توليد البيانات الوهمية بنجاح!' });
        } catch(e) {
            console.error(e);
            setMessageBox({ message: 'حدث خطأ أثناء التوليد', isError: true });
        } finally {
            setIsSeeding(false);
            setIsSeedModalOpen(false);
        }
    };

    const totalPages = useMemo(() => {
        return allNavItems.reduce((acc, section) => acc + section.items.length, 0);
    }, []);

    const filteredSections = useMemo(() => {
        let sectionsToFilter = allNavItems;
        
        if (activeTab !== 'all') {
            sectionsToFilter = allNavItems.filter(section => CATEGORY_MAP[section.label] === activeTab);
        }

        if (!searchQuery) return sectionsToFilter;
        const q = searchQuery.toLowerCase();
        
        return sectionsToFilter.map(section => {
            const matchedItems = section.items.filter(item => 
                item.label.toLowerCase().includes(q) || 
                (pageKeyFeatures[item.path] && pageKeyFeatures[item.path].some(kw => kw.toLowerCase().includes(q)))
            );
            if (matchedItems.length > 0 || section.label.toLowerCase().includes(q)) {
                return { ...section, items: matchedItems.length > 0 ? matchedItems : section.items };
            }
            return null;
        }).filter(Boolean) as typeof allNavItems;
    }, [searchQuery, activeTab]);

    const getTabCount = (tabId: string) => {
        if(tabId === 'all') return allNavItems.length;
        return allNavItems.filter(section => CATEGORY_MAP[section.label] === tabId).length;
    };

    return (
        <div id="dashboard-layout-container" className="p-4 md:p-6 space-y-6 bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 min-h-[calc(100vh-64px)] font-['Tajawal']" dir="rtl">
            
            {/* Header & Main Stats Summary */}
            <DashboardHeader 
                totalPages={totalPages} 
                sectionsCount={allNavItems.length} 
                tablesCount={db.tables.length} 
            />

            <div className="flex flex-col xl:flex-row gap-6 items-start">
                
                {/* Right Sidebar - Widgets and Filters */}
                <div className="w-full xl:w-1/4 space-y-4 xl:sticky xl:top-4">
                    
                    {/* Search Field */}
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200">
                        <div className="relative">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                              id="dashboard-search-input"
                              type="text" 
                              placeholder='ابحث عن شاشة أو قسم...' 
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm font-medium text-slate-700 outline-none"
                          />
                        </div>
                    </div>

                    {/* Categories Navigation Card */}
                    <DashboardSidebarMenu 
                        tabs={TABS} 
                        activeTab={activeTab} 
                        setActiveTab={setActiveTab} 
                        getTabCount={getTabCount} 
                    />

                    {/* Integrated Developer Tools Sidebar Card */}
                    <DashboardDevTools 
                        onOpenSchema={() => setIsSchemaModalOpen(true)}
                        onOpenSeed={() => setIsSeedModalOpen(true)}
                        onOpenClear={() => setIsClearModalOpen(true)}
                        isSeeding={isSeeding}
                        isClearing={isClearing}
                    />

                    {/* Mobile Tabs (Horizontal Scroll) */}
                    <div className="md:hidden flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
                        {TABS.map(tab => {
                            const TabIcon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    id={`tab-btn-mobile-${tab.id}`}
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                                        isActive 
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <TabIcon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Database Table Status List */}
                    <DashboardTableStatus tableCounts={tableCounts} />

                </div>
                
                {/* Left Content Column: Modules and Cards Grid */}
                <div className="w-full xl:w-3/4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-5 items-stretch">
                        {filteredSections.map((section, idx) => {
                            if (section.section === 'developer') {
                                return (
                                    <DeveloperToolsCard 
                                        key={idx}
                                        items={section.items}
                                        navigate={navigate}
                                        setIsSchemaModalOpen={setIsSchemaModalOpen}
                                        setIsSeedModalOpen={setIsSeedModalOpen}
                                        setIsClearModalOpen={setIsClearModalOpen}
                                        isSeeding={isSeeding}
                                        isClearing={isClearing}
                                    />
                                );
                            }
                            return (
                                <ModuleCard 
                                    key={idx}
                                    label={section.label}
                                    items={section.items}
                                    navigate={navigate}
                                />
                            );
                        })}

                        {filteredSections.length === 0 && (
                            <div className="col-span-full py-16 text-center bg-white/60 backdrop-blur-md rounded-2xl border border-indigo-100 shadow-md shadow-indigo-100/10 flex flex-col items-center justify-center gap-3">
                                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-full flex items-center justify-center shadow-md shadow-indigo-150/20 border border-indigo-200">
                                    <TerminalSquare className="w-8 h-8 text-indigo-600 stroke-[1.8] animate-pulse" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-base font-extrabold text-slate-700 mb-1">لا توجد نتائج مطابقة</h3>
                                    <p className="text-xs text-slate-500 font-bold">جرب البحث بكلمات مفتاحية أخرى</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={isClearModalOpen}
                title="تفريغ النظام (إعادة تعيين)"
                message="تحذير: سيتم مسح جميع البيانات من الجداول ما عدا الإعدادات والمستخدمين. هذه العملية لا يمكن التراجع عنها. هل أنت متأكد؟"
                confirmText={isClearing ? 'جاري التفريغ...' : 'نعم، قم بتفريغ البيانات'}
                cancelText="تراجع"
                onConfirm={performClearData}
                onCancel={() => setIsClearModalOpen(false)}
            />

            <ConfirmModal
                isOpen={isSeedModalOpen}
                title="توليد بيانات تجريبية ضخمة"
                message="تحذير: النظام سيقوم بإنشاء آلاف السجلات الوهمية في كافة الأقسام لاختبار الأداء والوظائف. هل ترغب في المتابعة؟"
                confirmText={isSeeding ? 'جاري التوليد...' : 'توليد البيانات'}
                cancelText="تراجع"
                onConfirm={performSeedData}
                onCancel={() => setIsSeedModalOpen(false)}
            />

            {messageBox && (
                <ConfirmModal
                    isOpen={true}
                    title={messageBox.isError ? "خطأ" : "رسالة النظام"}
                    message={messageBox.message}
                    confirmText="حسناً"
                    onConfirm={() => setMessageBox(null)}
                    onCancel={() => setMessageBox(null)}
                />
            )}

            <SchemaModal
                isOpen={isSchemaModalOpen}
                onClose={() => setIsSchemaModalOpen(false)}
            />

        </div>
    );
};

export default Dashboard;
