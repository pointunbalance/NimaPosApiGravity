
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import SetupWizard from './pages/SetupWizard'; 

// Lazy Loaded Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const POS = lazy(() => import('./pages/POS'));
const Products = lazy(() => import('./pages/Products'));
const Categories = lazy(() => import('./pages/Categories'));
const Orders = lazy(() => import('./pages/Orders'));
const Quotations = lazy(() => import('./pages/Quotations')); 
const Customers = lazy(() => import('./pages/Customers'));
const LeadsPipeline = lazy(() => import('./pages/crm/LeadsPipeline'));
const Helpdesk = lazy(() => import('./pages/crm/Helpdesk'));
const MarketingCampaigns = lazy(() => import('./pages/crm/MarketingCampaigns'));
const Settings = lazy(() => import('./pages/Settings'));
const ApprovalWorkflows = lazy(() => import('./pages/admin/ApprovalWorkflows'));
const DMS = lazy(() => import('./pages/admin/DMS'));
const InternalCommunication = lazy(() => import('./pages/admin/InternalCommunication'));
const PreventiveMaintenance = lazy(() => import('./pages/maintenance/PreventiveMaintenance'));
const Reports = lazy(() => import('./pages/Reports'));
const CustomReportBuilder = lazy(() => import('./pages/reports/CustomReportBuilder'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const RoleManagement = lazy(() => import('./pages/admin/RoleManagement'));
const SystemBackups = lazy(() => import('./pages/admin/SystemBackups'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const VendorPortal = lazy(() => import('./pages/purchases/VendorPortal'));
const Purchases = lazy(() => import('./pages/Purchases'));
const Warehouse = lazy(() => import('./pages/Warehouse'));
const AdvancedWMS = lazy(() => import('./pages/AdvancedWMS'));
const Fulfillment = lazy(() => import('./pages/Fulfillment')); 
const StockAdjustments = lazy(() => import('./pages/StockAdjustments'));
const Shifts = lazy(() => import('./pages/Shifts'));
const UsersPage = lazy(() => import('./pages/Users'));
const PricingRules = lazy(() => import('./pages/PricingRules'));
const Currencies = lazy(() => import('./pages/Currencies'));
const About = lazy(() => import('./pages/About'));
const BarcodePrinter = lazy(() => import('./pages/BarcodePrinter'));
const StickerPrinting = lazy(() => import('./pages/StickerPrinting')); 
const Logbook = lazy(() => import('./pages/Logbook')); 
const Capital = lazy(() => import('./pages/Capital')); 
const Kitchen = lazy(() => import('./pages/Kitchen')); 
const Tables = lazy(() => import('./pages/Tables')); 
const StudioScheduler = lazy(() => import('./pages/StudioScheduler')); 
const Rentals = lazy(() => import('./pages/Rentals')); 
const Payroll = lazy(() => import('./pages/Payroll')); 
const CustomerDisplay = lazy(() => import('./pages/CustomerDisplay'));

const Loyalty = lazy(() => import('./pages/Loyalty'));
const Promotions = lazy(() => import('./pages/Promotions'));
const Installments = lazy(() => import('./pages/Installments'));
const Returns = lazy(() => import('./pages/Returns'));
const BranchTransfers = lazy(() => import('./pages/BranchTransfers'));
const PurchaseOrders = lazy(() => import('./pages/PurchaseOrders'));
const InventoryCount = lazy(() => import('./pages/InventoryCount'));
const Employees = lazy(() => import('./pages/Employees'));
const Attendance = lazy(() => import('./pages/Attendance'));
const LeaveManagement = lazy(() => import('./pages/LeaveManagement').then(module => ({ default: module.LeaveManagement })));
const Loans = lazy(() => import('./pages/Loans').then(module => ({ default: module.Loans })));
const Recipes = lazy(() => import('./pages/Recipes').then(module => ({ default: module.Recipes })));
const WorkOrders = lazy(() => import('./pages/WorkOrders').then(module => ({ default: module.WorkOrders })));
const PurchaseRequests = lazy(() => import('./pages/PurchaseRequests').then(module => ({ default: module.PurchaseRequests })));
const RFQs = lazy(() => import('./pages/RFQs').then(module => ({ default: module.RFQs })));
const Projects = lazy(() => import('./pages/Projects').then(module => ({ default: module.Projects })));
const Shipping = lazy(() => import('./pages/Shipping').then(module => ({ default: module.Shipping })));
const Tasks = lazy(() => import('./pages/Tasks').then(module => ({ default: module.Tasks })));
const EmployeePortal = lazy(() => import('./pages/EmployeePortal'));
const Delivery = lazy(() => import('./pages/Delivery'));
const FleetManagement = lazy(() => import('./pages/logistics/FleetManagement'));
const LegalDocuments = lazy(() => import('./pages/legal/LegalDocuments'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Branches = lazy(() => import('./pages/Branches'));
const MarketMonitor = lazy(() => import('./pages/MarketMonitor'));

const B2BSales = lazy(() => import('./pages/B2BSales'));
const EcommerceOrders = lazy(() => import('./pages/EcommerceOrders'));
const VanSales = lazy(() => import('./pages/VanSales'));
const GiftCards = lazy(() => import('./pages/GiftCards'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const SalesTargets = lazy(() => import('./pages/SalesTargets'));
const CRM = lazy(() => import('./pages/CRM').then(module => ({ default: module.CRM })));
const QualityControl = lazy(() => import('./pages/manufacturing/QualityControl'));
const ProductionPlanning = lazy(() => import('./pages/manufacturing/ProductionPlanning'));
const BillOfMaterials = lazy(() => import('./pages/manufacturing/BillOfMaterials'));
const WorkCenters = lazy(() => import('./pages/manufacturing/WorkCenters'));
const Recruitment = lazy(() => import('./pages/hr/Recruitment'));
const PerformanceAppraisals = lazy(() => import('./pages/hr/PerformanceAppraisals'));
const Training = lazy(() => import('./pages/hr/Training'));
const OrganizationalChart = lazy(() => import('./pages/hr/OrganizationalChart'));
const EmployeeBenefits = lazy(() => import('./pages/hr/EmployeeBenefits'));
const DisciplinaryActions = lazy(() => import('./pages/hr/DisciplinaryActions'));
const Onboarding = lazy(() => import('./pages/hr/Onboarding'));
const Timesheets = lazy(() => import('./pages/projects/Timesheets'));

import { db, exportFullDatabase, downloadBackup } from './db'; 
import { User } from './types';
import { logActivity } from './utils/logger';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorWatcher from './components/ErrorWatcher'; 
import SmartAuditor from './components/SmartAuditor'; 
import SystemHealthMonitor from './components/SystemHealthMonitor'; // Imported

// Accounting Pages
const ChartOfAccounts = lazy(() => import('./pages/accounting/ChartOfAccounts'));
const JournalEntries = lazy(() => import('./pages/accounting/JournalEntries'));
const FinancialReports = lazy(() => import('./pages/accounting/FinancialReports'));
const GeneralLedger = lazy(() => import('./pages/accounting/GeneralLedger'));
const CheckManagement = lazy(() => import('./pages/accounting/CheckManagement'));
const CostCenters = lazy(() => import('./pages/accounting/CostCenters'));
const AssetManagement = lazy(() => import('./pages/accounting/Assets'));
const FiscalYearClosing = lazy(() => import('./pages/accounting/FiscalYearClosing'));
const AgingReports = lazy(() => import('./pages/accounting/AgingReports'));
const TaxReport = lazy(() => import('./pages/accounting/TaxReport'));
const BankReconciliation = lazy(() => import('./pages/accounting/BankReconciliation'));
const PettyCash = lazy(() => import('./pages/accounting/PettyCash'));
const Budgeting = lazy(() => import('./pages/accounting/Budgeting'));

// New ERP Pages
const ContractManagement = lazy(() => import('./pages/legal/ContractManagement').then(module => ({ default: module.ContractManagement })));
const TQM = lazy(() => import('./pages/manufacturing/TQM').then(module => ({ default: module.TQM })));
const PLM = lazy(() => import('./pages/manufacturing/PLM').then(module => ({ default: module.PLM })));
const CustomerPortal = lazy(() => import('./pages/CustomerPortal').then(module => ({ default: module.CustomerPortal })));
const ImportExport = lazy(() => import('./pages/logistics/ImportExport').then(module => ({ default: module.ImportExport })));
const LMS = lazy(() => import('./pages/hr/LMS').then(module => ({ default: module.LMS })));
const PropertyManagement = lazy(() => import('./pages/PropertyManagement').then(module => ({ default: module.PropertyManagement })));
const RiskCompliance = lazy(() => import('./pages/admin/RiskCompliance').then(module => ({ default: module.RiskCompliance })));

// Advanced Enterprise Modules
const EInvoicing = lazy(() => import('./pages/accounting/EInvoicing').then(m => ({ default: m.EInvoicing })));
const Treasury = lazy(() => import('./pages/accounting/Treasury').then(m => ({ default: m.Treasury })));
const Commissions = lazy(() => import('./pages/hr/Commissions').then(m => ({ default: m.Commissions })));
const DemandForecasting = lazy(() => import('./pages/inventory/DemandForecasting').then(m => ({ default: m.DemandForecasting })));
const SupplierEvaluation = lazy(() => import('./pages/purchases/SupplierEvaluation').then(m => ({ default: m.SupplierEvaluation })));
const EventManagement = lazy(() => import('./pages/events/EventManagement').then(m => ({ default: m.EventManagement })));
const POSTerminals = lazy(() => import('./pages/admin/POSTerminals').then(m => ({ default: m.POSTerminals })));
const CareersPortal = lazy(() => import('./pages/hr/CareersPortal').then(m => ({ default: m.CareersPortal })));
const AssetCustody = lazy(() => import('./pages/hr/AssetCustody').then(m => ({ default: m.AssetCustody })));
const BIDashboards = lazy(() => import('./pages/reports/BIDashboards').then(m => ({ default: m.BIDashboards })));
const PublicWebsite = lazy(() => import('./pages/PublicWebsite'));
const WebsiteCMS = lazy(() => import('./pages/WebsiteCMS'));

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  // --- AUTOMATIC BACKUP LOGIC ---
  useEffect(() => {
    const performAutoBackup = async () => {
        try {
            const settings = await db.settings.toCollection().first();
            
            if (settings?.dbConfig?.autoBackup) {
                const lastBackup = settings.dbConfig.lastBackupDate;
                const now = new Date();
                let shouldBackup = false;
                
                if (!lastBackup) {
                    shouldBackup = true;
                } else {
                    const last = new Date(lastBackup);
                    if (last.getDate() !== now.getDate() || last.getMonth() !== now.getMonth() || last.getFullYear() !== now.getFullYear()) {
                        shouldBackup = true;
                    }
                }

                if (shouldBackup) {
                    console.log("Starting Automatic Backup...");
                    const blob = await exportFullDatabase();
                    downloadBackup(blob, `NimaPos_AutoBackup_${now.toISOString().split('T')[0]}.json`);
                    
                    await db.settings.update(settings.id!, {
                        dbConfig: { ...settings.dbConfig, lastBackupDate: now }
                    });
                    
                    await logActivity('system', 'نسخ احتياطي تلقائي', 'تم إنشاء نسخة احتياطية يومية للنظام');
                }
            }
        } catch (e) {
            console.error("Auto Backup Failed", e);
        }
    };

    performAutoBackup();
    const interval = setInterval(performAutoBackup, 1000 * 60 * 60); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check if the system is configured (has settings)
    const checkConfig = async () => {
        try {
            const count = await db.settings.count();
            setIsConfigured(count > 0);
            
            const storedUser = localStorage.getItem('nima_user');
            if (storedUser) {
                try {
                    setCurrentUser(JSON.parse(storedUser));
                } catch (e) {
                    localStorage.removeItem('nima_user');
                }
            }
        } catch (e) {
            console.error("Config check failed", e);
        } finally {
            setIsLoading(false);
        }
    };
    checkConfig();
  }, []);

  const handleSetupComplete = () => {
      const storedUser = localStorage.getItem('nima_user');
      if (storedUser) {
          try {
              const user = JSON.parse(storedUser);
              setCurrentUser(user);
          } catch (e) {
              console.error("Failed to parse user from local storage", e);
          }
      }
      setIsConfigured(true);
  };

  if (isLoading) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="animate-pulse">Loading System...</p>
        </div>
      );
  }

  return (
    <ErrorBoundary>
        <ToastProvider>
            <ErrorWatcher /> {/* Global Error Listener (Crashes) */}
            <SystemHealthMonitor /> {/* Runtime Code/Perf Monitor */}
            
            {/* Run Auditor only when logged in */}
            {currentUser && <SmartAuditor />} 
            
            <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Suspense fallback={
                    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 font-sans">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-medium text-slate-500 animate-pulse">جاري تحميل الصفحة...</p>
                    </div>
                }>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/website/*" element={<PublicWebsite />} />
                        
                        {/* Protected Routes */}
                        <Route path="*" element={
                            !isConfigured ? (
                                <SetupWizard onComplete={handleSetupComplete} />
                            ) : !currentUser ? (
                                <Login onLogin={setCurrentUser} />
                            ) : (
                                <Routes>
                                    <Route path="/" element={<Layout onLogout={() => setCurrentUser(null)} />}>
                                        
                                        {/* 1. Main Operation */}
                                        <Route index element={<Dashboard />} />
                    <Route path="pos" element={<POS />} />
                    <Route path="rentals" element={<Rentals />} />
                    <Route path="studio" element={<StudioScheduler />} />
                    <Route path="kitchen" element={<Kitchen />} /> 
                    <Route path="tables" element={<Tables />} /> 
                    <Route path="delivery" element={<Delivery />} />
                    <Route path="employee-portal" element={<EmployeePortal />} />
                    <Route path="fleet" element={<FleetManagement />} />
                    <Route path="legal" element={<LegalDocuments />} />
                    <Route path="legal/contracts" element={<ContractManagement />} />
                    <Route path="maintenance" element={<Maintenance />} />
                    <Route path="preventive-maintenance" element={<PreventiveMaintenance />} />

                    {/* 2. Sales & Fulfillment */}
                    <Route path="orders" element={<Orders />} />
                    <Route path="quotations" element={<Quotations />} /> 
                    <Route path="b2b-sales" element={<B2BSales />} />
                    <Route path="ecommerce" element={<EcommerceOrders />} />
                    <Route path="van-sales" element={<VanSales />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="crm" element={<CRM />} />
                    <Route path="crm/leads" element={<LeadsPipeline />} />
                    <Route path="crm/tickets" element={<Helpdesk />} />
                    <Route path="crm/campaigns" element={<MarketingCampaigns />} />
                    <Route path="helpdesk" element={<Helpdesk />} />
                    <Route path="loyalty" element={<Loyalty />} />
                    <Route path="gift-cards" element={<GiftCards />} />
                    <Route path="subscriptions" element={<Subscriptions />} />
                    <Route path="promotions" element={<Promotions />} />
                    <Route path="installments" element={<Installments />} />
                    <Route path="returns" element={<Returns />} />
                    <Route path="sales-targets" element={<SalesTargets />} />
                    <Route path="fulfillment" element={<Fulfillment />} />
                    <Route path="shifts" element={<Shifts />} />

                    {/* 3. Inventory & Supply */}
                    <Route path="products" element={<Products />} />
                    <Route path="pricing-rules" element={<PricingRules />} />
                    <Route path="currencies" element={<Currencies />} />
                    <Route path="categories" element={<Categories />} />
                    <Route path="recipes" element={<Recipes />} />
                    <Route path="work-orders" element={<WorkOrders />} />
                    <Route path="quality-control" element={<QualityControl />} />
                    <Route path="production-planning" element={<ProductionPlanning />} />
                    <Route path="inventory/demand-forecasting" element={<DemandForecasting />} />
                    <Route path="bom" element={<BillOfMaterials />} />
                    <Route path="work-centers" element={<WorkCenters />} />
                    <Route path="manufacturing/tqm" element={<TQM />} />
                    <Route path="manufacturing/plm" element={<PLM />} />
                    <Route path="warehouse" element={<Warehouse />} />
                    <Route path="advanced-wms" element={<AdvancedWMS />} />
                    <Route path="branch-transfers" element={<BranchTransfers />} />
                    <Route path="stock-adjustments" element={<StockAdjustments />} />
                    <Route path="inventory-count" element={<InventoryCount />} />
                    <Route path="purchases" element={<Purchases />} />
                    <Route path="purchase-orders" element={<PurchaseOrders />} />
                    <Route path="purchase-requests" element={<PurchaseRequests />} />
                    <Route path="rfqs" element={<RFQs />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="timesheets" element={<Timesheets />} />
                    <Route path="shipping" element={<Shipping />} />
                    <Route path="logistics/import-export" element={<ImportExport />} />
                    <Route path="tasks" element={<Tasks />} />
                    <Route path="events" element={<EventManagement />} />
                    <Route path="suppliers" element={<Suppliers />} />
                    <Route path="purchases/supplier-evaluation" element={<SupplierEvaluation />} />
                    <Route path="vendor-portal" element={<VendorPortal />} />
                    <Route path="barcodes" element={<BarcodePrinter />} />
                    <Route path="sticker-printing" element={<StickerPrinting />} />

                    {/* 4. Finance & HR */}
                    <Route path="expenses" element={<Expenses />} />
                    <Route path="payroll" element={<Payroll />} />
                    <Route path="hr/commissions" element={<Commissions />} /> 
                    <Route path="employees" element={<Employees />} />
                    <Route path="hr/asset-custody" element={<AssetCustody />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="leaves" element={<LeaveManagement />} />
                    <Route path="loans" element={<Loans />} />
                    <Route path="recruitment" element={<Recruitment />} />
                    <Route path="hr/careers-portal" element={<CareersPortal />} />
                    <Route path="performance" element={<PerformanceAppraisals />} />
                    <Route path="training" element={<Training />} />
                    <Route path="hr/lms" element={<LMS />} />
                    <Route path="org-chart" element={<OrganizationalChart />} />
                    <Route path="benefits" element={<EmployeeBenefits />} />
                    <Route path="disciplinary" element={<DisciplinaryActions />} />
                    <Route path="onboarding" element={<Onboarding />} />
                    <Route path="capital" element={<Capital />} />
                    
                    {/* Advanced Accounting Sub-routes */}
                    <Route path="accounting/coa" element={<ChartOfAccounts />} />
                    <Route path="accounting/journal" element={<JournalEntries />} />
                    <Route path="accounting/general-ledger" element={<GeneralLedger />} />
                    <Route path="accounting/checks" element={<CheckManagement />} />
                    <Route path="accounting/assets" element={<AssetManagement />} />
                    <Route path="accounting/cost-centers" element={<CostCenters />} />
                    <Route path="accounting/reports" element={<FinancialReports />} />
                    <Route path="accounting/closing" element={<FiscalYearClosing />} />
                    <Route path="accounting/aging" element={<AgingReports />} />
                    <Route path="accounting/tax" element={<TaxReport />} />
                    <Route path="accounting/e-invoicing" element={<EInvoicing />} />
                    <Route path="accounting/bank-reconciliation" element={<BankReconciliation />} />
                    <Route path="accounting/treasury" element={<Treasury />} />
                    <Route path="accounting/petty-cash" element={<PettyCash />} />
                    <Route path="accounting/budgeting" element={<Budgeting />} />

                    {/* 5. System & Admin */}
                    <Route path="reports" element={<Reports />} />
                    <Route path="custom-reports" element={<CustomReportBuilder />} />
                    <Route path="reports/bi-dashboards" element={<BIDashboards />} />
                    <Route path="market-monitor" element={<MarketMonitor />} />
                    <Route path="approval-workflows" element={<ApprovalWorkflows />} />
                    <Route path="dms" element={<DMS />} />
                    <Route path="internal-communication" element={<InternalCommunication />} />
                    <Route path="audit-logs" element={<AuditLogs />} />
                    <Route path="role-management" element={<RoleManagement />} />
                    <Route path="system-backups" element={<SystemBackups />} />
                    <Route path="admin/risk-compliance" element={<RiskCompliance />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="branches" element={<Branches />} />
                    <Route path="admin/pos-terminals" element={<POSTerminals />} />
                    <Route path="logbook" element={<Logbook />} /> 
                    <Route path="settings" element={<Settings />} />
                    <Route path="about" element={<About />} />
                    
                    <Route path="customer-portal" element={<CustomerPortal />} />
                    <Route path="property-management" element={<PropertyManagement />} />
                    <Route path="website-cms" element={<WebsiteCMS />} />
                    <Route path="*" element={<NotFound />} />
                    </Route>
                    
                    {/* Standalone Routes */}
                    <Route path="/customer-display" element={<CustomerDisplay />} />
                </Routes>
                )
            } />
            </Routes>
            </Suspense>
            </HashRouter>
        </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
