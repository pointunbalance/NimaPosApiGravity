import { Suspense, lazy, type ComponentType, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";

import { ReferenceModulePage } from "../pages/ReferenceModulePage";
import { routeCatalog, toChildPath } from "./config/routeCatalog";
import { useI18n } from "./providers/I18nProvider";
import { AppShell } from "./shell/AppShell";

function lazyPage<TModule extends Record<string, unknown>, TKey extends keyof TModule & string>(
  loader: () => Promise<TModule>,
  exportName: TKey
) {
  return lazy(async () => {
    const module = await loader();
    return { default: module[exportName] as ComponentType<any> };
  });
}

function RouteFallback() {
  const { messages } = useI18n();

  return (
    <div className="surface-panel">
      <span className="eyebrow">{messages.router.loadingEyebrow}</span>
      <h3>{messages.router.loadingTitle}</h3>
      <p>{messages.router.loadingMessage}</p>
    </div>
  );
}

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

const DashboardPage = lazyPage(() => import("../pages/DashboardPage"), "DashboardPage");
const AboutPage = lazyPage(() => import("../pages/AboutPage"), "AboutPage");
const AgingReportsPage = lazyPage(() => import("../pages/AgingReportsPage"), "AgingReportsPage");
const AssetsPage = lazyPage(() => import("../pages/AssetsPage"), "AssetsPage");
const AttendancePage = lazyPage(() => import("../pages/AttendancePage"), "AttendancePage");
const AdvancedWmsPage = lazyPage(() => import("../pages/AdvancedWmsPage"), "AdvancedWmsPage");
const BiDashboardsPage = lazyPage(() => import("../pages/BiDashboardsPage"), "BiDashboardsPage");
const BankReconciliationPage = lazyPage(() => import("../pages/BankReconciliationPage"), "BankReconciliationPage");
const B2BSalesPage = lazyPage(() => import("../pages/B2BSalesPage"), "B2BSalesPage");
const BarcodePage = lazyPage(() => import("../pages/BarcodePage"), "BarcodePage");
const BomPage = lazyPage(() => import("../pages/BomPage"), "BomPage");
const BudgetsPage = lazyPage(() => import("../pages/BudgetsPage"), "BudgetsPage");
const BranchesPage = lazyPage(() => import("../pages/BranchesPage"), "BranchesPage");
const BranchTransfersPage = lazyPage(() => import("../pages/BranchTransfersPage"), "BranchTransfersPage");
const CapitalPage = lazyPage(() => import("../pages/CapitalPage"), "CapitalPage");
const CategoriesPage = lazyPage(() => import("../pages/CategoriesPage"), "CategoriesPage");
const ChartOfAccountsPage = lazyPage(() => import("../pages/ChartOfAccountsPage"), "ChartOfAccountsPage");
const ChecksPage = lazyPage(() => import("../pages/ChecksPage"), "ChecksPage");
const CostCentersPage = lazyPage(() => import("../pages/CostCentersPage"), "CostCentersPage");
const CrmCampaignsPage = lazyPage(() => import("../pages/CrmCampaignsPage"), "CrmCampaignsPage");
const CrmPage = lazyPage(() => import("../pages/CrmPage"), "CrmPage");
const CrmTicketsPage = lazyPage(() => import("../pages/CrmTicketsPage"), "CrmTicketsPage");
const CustomReportsPage = lazyPage(() => import("../pages/CustomReportsPage"), "CustomReportsPage");
const CustomerPaymentsPage = lazyPage(() => import("../pages/CustomerPaymentsPage"), "CustomerPaymentsPage");
const CustomersPage = lazyPage(() => import("../pages/CustomersPage"), "CustomersPage");
const CurrenciesPage = lazyPage(() => import("../pages/CurrenciesPage"), "CurrenciesPage");
const DeliveryPage = lazyPage(() => import("../pages/DeliveryPage"), "DeliveryPage");
const EmployeesPage = lazyPage(() => import("../pages/EmployeesPage"), "EmployeesPage");
const EmployeePortalPage = lazyPage(() => import("../pages/EmployeePortalPage"), "EmployeePortalPage");
const EcommercePage = lazyPage(() => import("../pages/EcommercePage"), "EcommercePage");
const ExpensesPage = lazyPage(() => import("../pages/ExpensesPage"), "ExpensesPage");
const FleetPage = lazyPage(() => import("../pages/FleetPage"), "FleetPage");
const FinancialReportsPage = lazyPage(() => import("../pages/FinancialReportsPage"), "FinancialReportsPage");
const FiscalClosingPage = lazyPage(() => import("../pages/FiscalClosingPage"), "FiscalClosingPage");
const GeneralLedgerPage = lazyPage(() => import("../pages/GeneralLedgerPage"), "GeneralLedgerPage");
const HeldOrdersPage = lazyPage(() => import("../pages/HeldOrdersPage"), "HeldOrdersPage");
const InventoryCountPage = lazyPage(() => import("../pages/InventoryCountPage"), "InventoryCountPage");
const InvoicePrintPage = lazyPage(() => import("../pages/InvoicePrintPage"), "InvoicePrintPage");
const InstallmentsPage = lazyPage(() => import("../pages/InstallmentsPage"), "InstallmentsPage");
const JournalEntriesPage = lazyPage(() => import("../pages/JournalEntriesPage"), "JournalEntriesPage");
const KitchenPage = lazyPage(() => import("../pages/KitchenPage"), "KitchenPage");
const LogbookPage = lazyPage(() => import("../pages/LogbookPage"), "LogbookPage");
const LoyaltyPage = lazyPage(() => import("../pages/LoyaltyPage"), "LoyaltyPage");
const MaintenancePage = lazyPage(() => import("../pages/MaintenancePage"), "MaintenancePage");
const MarketMonitorPage = lazyPage(() => import("../pages/MarketMonitorPage"), "MarketMonitorPage");
const NotificationsPage = lazyPage(() => import("../pages/NotificationsPage"), "NotificationsPage");
const OnboardingPage = lazyPage(() => import("../pages/OnboardingPage"), "OnboardingPage");
const OrgChartPage = lazyPage(() => import("../pages/OrgChartPage"), "OrgChartPage");
const OrdersPage = lazyPage(() => import("../pages/OrdersPage"), "OrdersPage");
const PayrollPage = lazyPage(() => import("../pages/PayrollPage"), "PayrollPage");
const PettyCashPage = lazyPage(() => import("../pages/PettyCashPage"), "PettyCashPage");
const PosTerminalsPage = lazyPage(() => import("../pages/PosTerminalsPage"), "PosTerminalsPage");
const PosPage = lazyPage(() => import("../pages/PosPage"), "PosPage");
const PricingRulesPage = lazyPage(() => import("../pages/PricingRulesPage"), "PricingRulesPage");
const ProductionPlanningPage = lazyPage(() => import("../pages/ProductionPlanningPage"), "ProductionPlanningPage");
const ProductsPage = lazyPage(() => import("../pages/ProductsPage"), "ProductsPage");
const ProjectsPage = lazyPage(() => import("../pages/ProjectsPage"), "ProjectsPage");
const PurchaseOrdersPage = lazyPage(() => import("../pages/PurchaseOrdersPage"), "PurchaseOrdersPage");
const PurchasesPage = lazyPage(() => import("../pages/PurchasesPage"), "PurchasesPage");
const QuotationsPage = lazyPage(() => import("../pages/QuotationsPage"), "QuotationsPage");
const RecruitmentPage = lazyPage(() => import("../pages/RecruitmentPage"), "RecruitmentPage");
const ReportsPage = lazyPage(() => import("../pages/ReportsPage"), "ReportsPage");
const RiskCompliancePage = lazyPage(() => import("../pages/RiskCompliancePage"), "RiskCompliancePage");
const QualityControlPage = lazyPage(() => import("../pages/QualityControlPage"), "QualityControlPage");
const RentalsPage = lazyPage(() => import("../pages/RentalsPage"), "RentalsPage");
const ReturnsPage = lazyPage(() => import("../pages/ReturnsPage"), "ReturnsPage");
const RoleManagementPage = lazyPage(() => import("../pages/RoleManagementPage"), "RoleManagementPage");
const SearchPage = lazyPage(() => import("../pages/SearchPage"), "SearchPage");
const SettingsPage = lazyPage(() => import("../pages/SettingsPage"), "SettingsPage");
const ShiftsPage = lazyPage(() => import("../pages/ShiftsPage"), "ShiftsPage");
const ShippingPage = lazyPage(() => import("../pages/ShippingPage"), "ShippingPage");
const StudioPage = lazyPage(() => import("../pages/StudioPage"), "StudioPage");
const StockAdjustmentsPage = lazyPage(() => import("../pages/StockAdjustmentsPage"), "StockAdjustmentsPage");
const SuppliersPage = lazyPage(() => import("../pages/SuppliersPage"), "SuppliersPage");
const SubscriptionsPage = lazyPage(() => import("../pages/SubscriptionsPage"), "SubscriptionsPage");
const StickerPrintingPage = lazyPage(() => import("../pages/StickerPrintingPage"), "StickerPrintingPage");
const SystemBackupsPage = lazyPage(() => import("../pages/SystemBackupsPage"), "SystemBackupsPage");
const TablesPage = lazyPage(() => import("../pages/TablesPage"), "TablesPage");
const TasksPage = lazyPage(() => import("../pages/TasksPage"), "TasksPage");
const TaxReportsPage = lazyPage(() => import("../pages/TaxReportsPage"), "TaxReportsPage");
const TimesheetsPage = lazyPage(() => import("../pages/TimesheetsPage"), "TimesheetsPage");
const TrainingPage = lazyPage(() => import("../pages/TrainingPage"), "TrainingPage");
const TreasuryPage = lazyPage(() => import("../pages/TreasuryPage"), "TreasuryPage");
const UsersPage = lazyPage(() => import("../pages/UsersPage"), "UsersPage");
const VendorPortalPage = lazyPage(() => import("../pages/VendorPortalPage"), "VendorPortalPage");
const WarehousePage = lazyPage(() => import("../pages/WarehousePage"), "WarehousePage");
const WorkCentersPage = lazyPage(() => import("../pages/WorkCentersPage"), "WorkCentersPage");
const WorkOrdersPage = lazyPage(() => import("../pages/WorkOrdersPage"), "WorkOrdersPage");

const implementedRoutes: Record<string, ReactNode> = {
  "/": withSuspense(<DashboardPage />),
  "/about": withSuspense(<AboutPage />),
  "/accounting/aging": withSuspense(<AgingReportsPage />),
  "/accounting/assets": withSuspense(<AssetsPage />),
  "/accounting/bank-reconciliation": withSuspense(<BankReconciliationPage />),
  "/accounting/budgeting": withSuspense(<BudgetsPage />),
  "/accounting/checks": withSuspense(<ChecksPage />),
  "/accounting/closing": withSuspense(<FiscalClosingPage />),
  "/accounting/coa": withSuspense(<ChartOfAccountsPage />),
  "/accounting/cost-centers": withSuspense(<CostCentersPage />),
  "/accounting/general-ledger": withSuspense(<GeneralLedgerPage />),
  "/accounting/journal": withSuspense(<JournalEntriesPage />),
  "/accounting/petty-cash": withSuspense(<PettyCashPage />),
  "/accounting/reports": withSuspense(<FinancialReportsPage />),
  "/accounting/tax": withSuspense(<TaxReportsPage />),
  "/accounting/treasury": withSuspense(<TreasuryPage />),
  "/advanced-wms": withSuspense(<AdvancedWmsPage />),
  "/admin/pos-terminals": withSuspense(<PosTerminalsPage />),
  "/attendance": withSuspense(<AttendancePage />),
  "/audit-logs": withSuspense(<LogbookPage title="سجلات التدقيق" subtitle="مراجعة العمليات الحساسة وتتبع الحالات والبحث داخل السجل." defaultType="audit" />),
  "/b2b-sales": withSuspense(<B2BSalesPage />),
  "/barcodes": withSuspense(<BarcodePage />),
  "/bom": withSuspense(<BomPage />),
  "/branches": withSuspense(<BranchesPage />),
  "/branch-transfers": withSuspense(<BranchTransfersPage />),
  "/capital": withSuspense(<CapitalPage />),
  "/categories": withSuspense(<CategoriesPage />),
  "/crm": withSuspense(<CrmPage />),
  "/crm/campaigns": withSuspense(<CrmCampaignsPage />),
  "/crm/tickets": withSuspense(<CrmTicketsPage />),
  "/currencies": withSuspense(<CurrenciesPage />),
  "/custom-reports": withSuspense(<CustomReportsPage />),
  "/customer-payments": withSuspense(<CustomerPaymentsPage />),
  "/customers": withSuspense(<CustomersPage />),
  "/delivery": withSuspense(<DeliveryPage />),
  "/employee-portal": withSuspense(<EmployeePortalPage />),
  "/employees": withSuspense(<EmployeesPage />),
  "/ecommerce": withSuspense(<EcommercePage />),
  "/expenses": withSuspense(<ExpensesPage />),
  "/fleet": withSuspense(<FleetPage />),
  "/held-orders": withSuspense(<HeldOrdersPage />),
  "/internal-communication": withSuspense(<NotificationsPage />),
  "/inventory-count": withSuspense(<InventoryCountPage />),
  "/installments": withSuspense(<InstallmentsPage />),
  "/kitchen": withSuspense(<KitchenPage />),
  "/logbook": withSuspense(<LogbookPage />),
  "/loyalty": withSuspense(<LoyaltyPage />),
  "/maintenance": withSuspense(<MaintenancePage />),
  "/market-monitor": withSuspense(<MarketMonitorPage />),
  "/onboarding": withSuspense(<OnboardingPage />),
  "/org-chart": withSuspense(<OrgChartPage />),
  "/orders": withSuspense(<OrdersPage />),
  "/payroll": withSuspense(<PayrollPage />),
  "/pos": withSuspense(<PosPage />),
  "/pricing-rules": withSuspense(<PricingRulesPage />),
  "/production-planning": withSuspense(<ProductionPlanningPage />),
  "/products": withSuspense(<ProductsPage />),
  "/projects": withSuspense(<ProjectsPage />),
  "/purchase-orders": withSuspense(<PurchaseOrdersPage />),
  "/purchases": withSuspense(<PurchasesPage />),
  "/quality-control": withSuspense(<QualityControlPage />),
  "/quotations": withSuspense(<QuotationsPage />),
  "/recruitment": withSuspense(<RecruitmentPage />),
  "/rentals": withSuspense(<RentalsPage />),
  "/reports": withSuspense(<ReportsPage />),
  "/reports/bi-dashboards": withSuspense(<BiDashboardsPage />),
  "/returns": withSuspense(<ReturnsPage />),
  "/role-management": withSuspense(<RoleManagementPage />),
  "/admin/risk-compliance": withSuspense(<RiskCompliancePage />),
  "/search": withSuspense(<SearchPage />),
  "/settings": withSuspense(<SettingsPage />),
  "/shifts": withSuspense(<ShiftsPage />),
  "/shipping": withSuspense(<ShippingPage />),
  "/studio": withSuspense(<StudioPage />),
  "/stock-adjustments": withSuspense(<StockAdjustmentsPage />),
  "/sticker-printing": withSuspense(<StickerPrintingPage />),
  "/subscriptions": withSuspense(<SubscriptionsPage />),
  "/suppliers": withSuspense(<SuppliersPage />),
  "/system-backups": withSuspense(<SystemBackupsPage />),
  "/tables": withSuspense(<TablesPage />),
  "/tasks": withSuspense(<TasksPage />),
  "/timesheets": withSuspense(<TimesheetsPage />),
  "/training": withSuspense(<TrainingPage />),
  "/hr/lms": withSuspense(<TrainingPage mode="lms" />),
  "/users": withSuspense(<UsersPage />),
  "/vendor-portal": withSuspense(<VendorPortalPage />),
  "/warehouse": withSuspense(<WarehousePage />),
  "/work-centers": withSuspense(<WorkCentersPage />),
  "/work-orders": withSuspense(<WorkOrdersPage />)
};

export const router = createBrowserRouter([
  {
    path: "/orders/:invoiceId/print",
    element: withSuspense(<InvoicePrintPage />)
  },
  {
    path: "/",
    element: <AppShell />,
    children: routeCatalog.map((route) =>
      route.path === "/"
        ? { index: true, element: implementedRoutes[route.path] ?? <ReferenceModulePage /> }
        : {
            path: toChildPath(route.path),
            element: implementedRoutes[route.path] ?? <ReferenceModulePage />
          }
    )
  }
]);
