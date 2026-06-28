import React, { useEffect, useState, Suspense, lazy, useRef } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SetupWizard from "./pages/SetupWizard";

// Lazy Loaded Pages
const Consignments = lazy(() => import("./pages/inventory/Consignments"));
const Layaways = lazy(() => import("./pages/sales/Layaways"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const POS = lazy(() => import("./pages/POS"));
const WholesaleLedger = lazy(() => import("./pages/WholesaleLedger"));
const WholesaleSales = lazy(() => import("./pages/WholesaleSales"));
const RestaurantPOS = lazy(() => import("./pages/restaurant/RestaurantPOS"));
const CallCenter = lazy(() => import("./pages/CallCenter"));
const ClinicDashboard = lazy(() => import("./pages/clinics/ClinicDashboard"));
const ClinicReception = lazy(() => import("./pages/clinics/ClinicReception"));
const ClinicPatients = lazy(() => import("./pages/clinics/ClinicPatients"));
const ClinicDoctors = lazy(() => import("./pages/clinics/ClinicDoctors"));
const PhysicianCockpit = lazy(() => import("./pages/clinics/PhysicianCockpit").then(m => ({ default: m.PhysicianCockpit })));
const PharmacyDashboard = lazy(() => import("./pages/pharmacy/PharmacyDashboard").then(m => ({ default: m.PharmacyDashboard })));
const RestaurantMenu = lazy(() => import("./pages/restaurant/RestaurantMenu"));
const Products = lazy(() => import("./pages/Products"));
const Categories = lazy(() => import("./pages/Categories"));
const Orders = lazy(() => import("./pages/Orders"));
const Quotations = lazy(() => import("./pages/Quotations"));
const Customers = lazy(() => import("./pages/Customers"));
const LeadsPipeline = lazy(() => import("./pages/crm/LeadsPipeline"));
const Helpdesk = lazy(() => import("./pages/crm/Helpdesk"));
const MarketingCampaigns = lazy(() => import("./pages/crm/MarketingCampaigns"));
const Settings = lazy(() => import("./pages/Settings"));
const ApprovalWorkflows = lazy(() => import("./pages/admin/ApprovalWorkflows"));
const DMS = lazy(() => import("./pages/admin/DMS"));
const DocumentEditor = lazy(() =>
  import("./pages/DocumentEditor").then((m) => ({ default: m.DocumentEditor })),
);
const InternalCommunication = lazy(
  () => import("./pages/admin/InternalCommunication"),
);
const PreventiveMaintenance = lazy(
  () => import("./pages/maintenance/PreventiveMaintenance"),
);
const Reports = lazy(() => import("./pages/Reports"));
const CustomReportBuilder = lazy(
  () => import("./pages/reports/CustomReportBuilder"),
);
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const RoleManagement = lazy(() => import("./pages/admin/RoleManagement"));
const SystemBackups = lazy(() => import("./pages/admin/SystemBackups"));
const ServerResources = lazy(() => import("./pages/admin/ServerResources"));
const ApiKeysManagement = lazy(() => import("./pages/admin/ApiKeysManagement"));
const UserSessions = lazy(() => import("./pages/admin/UserSessions"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const VendorPortal = lazy(() => import("./pages/purchases/VendorPortal"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Warehouse = lazy(() => import("./pages/Warehouse"));
const AdvancedWMS = lazy(() => import("./pages/AdvancedWMS"));
const Fulfillment = lazy(() => import("./pages/Fulfillment"));
const StockAdjustments = lazy(() => import("./pages/StockAdjustments"));
const MeasurementUnits = lazy(() => import("./pages/inventory/MeasurementUnits"));
const ProductPriceHistoryLog = lazy(() => import("./pages/inventory/ProductPriceHistoryLog"));
const ProactiveLowStockAlerts = lazy(() => import("./pages/inventory/ProactiveLowStockAlerts"));
const BranchShipmentTracking = lazy(() => import("./pages/inventory/BranchShipmentTracking").then(m => ({default: m.BranchShipmentTracking})));
const ProductExpiryManagement = lazy(() => import("./pages/inventory/ProductExpiryManagement").then(m => ({default: m.ProductExpiryManagement})));
const InventoryTurnoverDashboard = lazy(() => import("./pages/inventory/InventoryTurnoverDashboard").then(m => ({default: m.InventoryTurnoverDashboard})));
const Shifts = lazy(() => import("./pages/Shifts"));
const UsersPage = lazy(() => import("./pages/Users"));
const PricingRules = lazy(() => import("./pages/PricingRules"));
const Currencies = lazy(() => import("./pages/Currencies"));
const About = lazy(() => import("./pages/About"));
const BarcodePrinter = lazy(() => import("./pages/BarcodePrinter"));
const StickerPrinting = lazy(() => import("./pages/StickerPrinting"));
const Logbook = lazy(() => import("./pages/Logbook"));
const Capital = lazy(() => import("./pages/Capital"));
const Kitchen = lazy(() => import("./pages/restaurant/Kitchen"));
const Tables = lazy(() => import("./pages/restaurant/Tables"));
const WaiterApp = lazy(() => import("./pages/restaurant/WaiterApp"));
const StudioScheduler = lazy(() => import("./pages/StudioScheduler"));
const Rentals = lazy(() => import("./pages/Rentals"));
const Tailoring = lazy(() => import("./pages/Tailoring"));
const Payroll = lazy(() => import("./pages/Payroll"));
const CustomerDisplay = lazy(() => import("./pages/CustomerDisplay"));
const CustomerMenu = lazy(() => import("./pages/restaurant/CustomerMenu"));
const CustomerFeedback = lazy(() => import("./pages/CustomerFeedback"));

const Loyalty = lazy(() => import("./pages/Loyalty"));
const Promotions = lazy(() => import("./pages/Promotions"));
const Installments = lazy(() => import("./pages/Installments"));
const Returns = lazy(() => import("./pages/Returns"));
const BranchTransfers = lazy(() => import("./pages/BranchTransfers"));
const PurchaseOrders = lazy(() => import("./pages/PurchaseOrders"));
const InventoryCount = lazy(() => import("./pages/InventoryCount"));
const Employees = lazy(() => import("./pages/Employees"));
const Attendance = lazy(() => import("./pages/Attendance"));
const AttendanceTerminalKiosk = lazy(() => import("./pages/AttendanceTerminalKiosk").then(m => ({ default: m.AttendanceTerminalKiosk })));
const LeaveManagement = lazy(() =>
  import("./pages/LeaveManagement").then((module) => ({
    default: module.LeaveManagement,
  })),
);
const Loans = lazy(() =>
  import("./pages/Loans").then((module) => ({ default: module.Loans })),
);
const Recipes = lazy(() =>
  import("./pages/Recipes").then((module) => ({ default: module.Recipes })),
);
const WorkOrders = lazy(() =>
  import("./pages/WorkOrders").then((module) => ({
    default: module.WorkOrders,
  })),
);
const PurchaseRequests = lazy(() =>
  import("./pages/PurchaseRequests").then((module) => ({
    default: module.PurchaseRequests,
  })),
);
const RFQs = lazy(() =>
  import("./pages/RFQs").then((module) => ({ default: module.RFQs })),
);
const Projects = lazy(() =>
  import("./pages/Projects").then((module) => ({ default: module.Projects })),
);
const FeasibilityStudies = lazy(() =>
  import("./pages/projects/FeasibilityStudies").then((module) => ({
    default: module.FeasibilityStudies,
  })),
);
const ProjectKPIs = lazy(() =>
  import("./pages/projects/ProjectKPIs").then((m) => ({
    default: m.ProjectKPIs,
  })),
);
const Shipping = lazy(() =>
  import("./pages/Shipping").then((module) => ({ default: module.Shipping })),
);
const Tasks = lazy(() =>
  import("./pages/Tasks").then((module) => ({ default: module.Tasks })),
);
const EmployeePortal = lazy(() => import("./pages/EmployeePortal"));
const EmployeeAnalytics = lazy(() => import("./pages/hr/EmployeeAnalytics"));
const Delivery = lazy(() => import("./pages/Delivery"));
const FleetManagement = lazy(() => import("./pages/logistics/FleetManagement"));
const LegalDocuments = lazy(() => import("./pages/legal/LegalDocuments"));
const DigitalSignature = lazy(() => import("./pages/legal/DigitalSignature"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const ComputerMobileMaintenance = lazy(() => import("./pages/ComputerMobileMaintenance"));
const Branches = lazy(() => import("./pages/Branches"));
const MarketMonitor = lazy(() => import("./pages/MarketMonitor"));

const B2BSales = lazy(() => import("./pages/B2BSales"));
const EcommerceOrders = lazy(() => import("./pages/EcommerceOrders"));
const CommodityContracts = lazy(() =>
  import("./pages/CommodityContracts").then((module) => ({
    default: module.CommodityContracts,
  })),
);
const VanSales = lazy(() => import("./pages/VanSales"));
const GiftCards = lazy(() => import("./pages/GiftCards"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const SalesTargets = lazy(() => import("./pages/SalesTargets"));
const CRM = lazy(() =>
  import("./pages/CRM").then((module) => ({ default: module.CRM })),
);
const QualityControl = lazy(
  () => import("./pages/manufacturing/QualityControl"),
);
const ProductionPlanning = lazy(
  () => import("./pages/manufacturing/ProductionPlanning"),
);
const BillOfMaterials = lazy(
  () => import("./pages/manufacturing/BillOfMaterials"),
);
const WorkCenters = lazy(() => import("./pages/manufacturing/WorkCenters"));
const Recruitment = lazy(() => import("./pages/hr/Recruitment"));
const PerformanceAppraisals = lazy(
  () => import("./pages/hr/PerformanceAppraisals"),
);
const Training = lazy(() => import("./pages/hr/Training"));
const OrganizationalChart = lazy(
  () => import("./pages/hr/OrganizationalChart"),
);
const EmployeeBenefits = lazy(() => import("./pages/hr/EmployeeBenefits"));
const DocumentManagement = lazy(() => import("./pages/hr/DocumentManagement"));
const Payslips = lazy(() => import("./pages/hr/Payslips"));
const AnnualBonuses = lazy(() => import("./pages/hr/AnnualBonuses"));
const LaborCostAnalysis = lazy(() => import("./pages/hr/LaborCostAnalysis"));
const EmployeeTurnover = lazy(() => import("./pages/hr/EmployeeTurnover"));
const WorkShifts = lazy(() => import("./pages/hr/WorkShifts").then(m => ({ default: m.WorkShifts })));
const SkillsGapAnalysis = lazy(() => import("./pages/hr/SkillsGapAnalysis"));
const SuccessionPlanning = lazy(() => import("./pages/hr/SuccessionPlanning"));
const EmployeeSurveys = lazy(() => import("./pages/hr/EmployeeSurveys"));
const DisciplinaryActions = lazy(
  () => import("./pages/hr/DisciplinaryActions"),
);
const Onboarding = lazy(() => import("./pages/hr/Onboarding"));
const Timesheets = lazy(() => import("./pages/projects/Timesheets"));
const PeriodicMaintenance = lazy(() =>
  import("./pages/PeriodicMaintenance").then((module) => ({
    default: module.PeriodicMaintenance,
  })),
);

const SkillsManager = lazy(() => import("./pages/developer/SkillsManager"));
const ChatLogsManager = lazy(() => import("./pages/developer/ChatLogsManager"));

// Cow Farm Pages
const CowFarmDashboard = lazy(() => import("./pages/cow-farm/Dashboard"));
const CowFarmCows = lazy(() => import("./pages/cow-farm/Cows"));
const CowFarmMilk = lazy(() => import("./pages/cow-farm/Milk"));
const CowFarmBreeding = lazy(() => import("./pages/cow-farm/Breeding"));
const CowFarmHealth = lazy(() => import("./pages/cow-farm/Health"));
const CowFarmFeed = lazy(() => import("./pages/cow-farm/Feed"));
const CowFarmFinancials = lazy(() => import("./pages/cow-farm/Financials"));

import { db, exportFullDatabase, downloadBackup, seedExtraData } from "./db";
import { User } from "./types";
import { logActivity } from "./utils/logger";
import { ToastProvider } from "./context/ToastContext";
import { SystemNotifications } from "./components/SystemNotifications";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorWatcher from "./components/ErrorWatcher";
import SmartAuditor from "./components/SmartAuditor";
import SystemHealthMonitor from "./components/SystemHealthMonitor"; // Imported
import ProtectedRoute from "./components/ProtectedRoute";
import "./services/OrderObservers"; // Import observers to register them on startup


// Accounting Pages
const ChartOfAccounts = lazy(
  () => import("./pages/accounting/ChartOfAccounts"),
);
const JournalEntries = lazy(() => import("./pages/accounting/JournalEntries"));
const FinancialReports = lazy(
  () => import("./pages/accounting/FinancialReports"),
);
const GeneralLedger = lazy(() => import("./pages/accounting/GeneralLedger"));
const CheckManagement = lazy(
  () => import("./pages/accounting/CheckManagement"),
);
const CostCenters = lazy(() => import("./pages/accounting/CostCenters"));
const AssetManagement = lazy(() => import("./pages/accounting/Assets"));
const FiscalYearClosing = lazy(
  () => import("./pages/accounting/FiscalYearClosing"),
);
const AgingReports = lazy(() => import("./pages/accounting/AgingReports"));
const TaxReport = lazy(() => import("./pages/accounting/TaxReport"));
const AuditTrail = lazy(() => import("./pages/accounting/AuditTrail").then(m => ({ default: m.AuditTrail })));
const CashFlowDashboard = lazy(() => import("./pages/accounting/CashFlowDashboard").then(m => ({ default: m.CashFlowDashboard })));
const BankReconciliation = lazy(
  () => import("./pages/accounting/BankReconciliation"),
);
const PettyCash = lazy(() => import("./pages/accounting/PettyCash"));
const Budgeting = lazy(() => import("./pages/accounting/Budgeting"));
const CostAccounting = lazy(() => import("./pages/accounting/CostAccounting"));
const ProjectAccounting = lazy(() => import("./pages/accounting/ProjectAccounting"));
const PartnersEquity = lazy(() => import("./pages/accounting/PartnersEquity"));
const LetterOfCredits = lazy(() => import("./pages/accounting/LetterOfCredits"));
const DeferredRevenues = lazy(() => import("./pages/accounting/DeferredRevenues"));
const ZakatAndTaxes = lazy(() => import("./pages/accounting/ZakatAndTaxes"));
const TrustAccounts = lazy(() => import("./pages/accounting/TrustAccounts"));
const RevenueRecognition = lazy(() => import("./pages/accounting/RevenueRecognition"));
const EOSBAccounting = lazy(() => import("./pages/accounting/EOSBAccounting"));
const WIPAccounting = lazy(() => import("./pages/accounting/WIPAccounting"));

// New ERP Pages
const ContractManagement = lazy(() =>
  import("./pages/legal/ContractManagement").then((module) => ({
    default: module.ContractManagement,
  })),
);
const Judgments = lazy(() => import("./pages/legal/Judgments"));
const LaborInvestigations = lazy(() =>
  import("./pages/legal/LaborInvestigations").then((module) => ({
    default: module.LaborInvestigations,
  })),
);
const IntellectualProperty = lazy(() =>
  import("./pages/legal/IntellectualProperty").then((module) => ({
    default: module.IntellectualProperty,
  })),
);
const CorporateAffairs = lazy(() =>
  import("./pages/legal/CorporateAffairs").then((module) => ({
    default: module.CorporateAffairs,
  })),
);
const LegalCompliance = lazy(() =>
  import("./pages/legal/LegalCompliance").then((module) => ({
    default: module.LegalCompliance,
  })),
);
const LegalClients = lazy(() =>
  import("./pages/legal/LegalClients").then((module) => ({
    default: module.LegalClients,
  })),
);
const LegalAgenda = lazy(() =>
  import("./pages/legal/LegalAgenda").then((module) => ({
    default: module.LegalAgenda,
  })),
);
const LegalBilling = lazy(() =>
  import("./pages/legal/LegalBilling").then((module) => ({
    default: module.LegalBilling,
  })),
);
const LegalMemos = lazy(() =>
  import("./pages/legal/LegalMemos").then((module) => ({
    default: module.LegalMemos,
  })),
);

const TQM = lazy(() =>
  import("./pages/manufacturing/TQM").then((module) => ({
    default: module.TQM,
  })),
);
const PLM = lazy(() =>
  import("./pages/manufacturing/PLM").then((module) => ({
    default: module.PLM,
  })),
);
const CustomerPortal = lazy(() =>
  import("./pages/CustomerPortal").then((module) => ({
    default: module.CustomerPortal,
  })),
);
const ImportExport = lazy(() =>
  import("./pages/logistics/ImportExport").then((module) => ({
    default: module.ImportExport,
  })),
);
const LMS = lazy(() =>
  import("./pages/hr/LMS").then((module) => ({ default: module.LMS })),
);
const PropertyManagement = lazy(() =>
  import("./pages/PropertyManagement").then((module) => ({
    default: module.PropertyManagement,
  })),
);
const RiskCompliance = lazy(() =>
  import("./pages/admin/RiskCompliance").then((module) => ({
    default: module.RiskCompliance,
  })),
);
const LawFirm = lazy(() => import("./pages/LawFirm"));
const PowerOfAttorney = lazy(() => import("./pages/PowerOfAttorney"));
const LegalConsultations = lazy(() => import("./pages/LegalConsultations"));

// Advanced Enterprise Modules
const EInvoicing = lazy(() =>
  import("./pages/accounting/EInvoicing").then((m) => ({
    default: m.EInvoicing,
  })),
);
const Treasury = lazy(() =>
  import("./pages/accounting/Treasury").then((m) => ({ default: m.Treasury })),
);
const Commissions = lazy(() =>
  import("./pages/hr/Commissions").then((m) => ({ default: m.Commissions })),
);
const DemandForecasting = lazy(() =>
  import("./pages/inventory/DemandForecasting").then((m) => ({
    default: m.DemandForecasting,
  })),
);
const SupplierReturns = lazy(() =>
  import("./pages/purchases/SupplierReturns").then((m) => ({
    default: m.SupplierReturns,
  })),
);
const SupplierEvaluation = lazy(() =>
  import("./pages/purchases/SupplierEvaluation").then((m) => ({
    default: m.SupplierEvaluation,
  })),
);
const EventManagement = lazy(() =>
  import("./pages/events/EventManagement").then((m) => ({
    default: m.EventManagement,
  })),
);
const TicketBookings = lazy(() => import("./pages/TicketBookings"));
const TicketsDashboard = lazy(() => import("./pages/TicketsDashboard"));
const TicketRoutes = lazy(() => import("./pages/TicketRoutes"));
const TicketFleet = lazy(() => import("./pages/TicketFleet"));
const TicketCRM = lazy(() => import("./pages/TicketCRM"));
const TicketFinancials = lazy(() => import("./pages/TicketFinancials"));
const TicketCargoPage = lazy(() => import("./pages/TicketCargo"));
const TicketLiveTracking = lazy(() => import("./pages/TicketLiveTracking"));
const TicketDriverManifest = lazy(() => import("./pages/TicketDriverManifest"));
const TicketVendors = lazy(() => import("./pages/TicketVendors"));
const TicketBranches = lazy(() => import("./pages/TicketBranches"));
const TicketReports = lazy(() => import("./pages/TicketReports"));
const TicketSettings = lazy(() => import("./pages/TicketSettings"));
const POSTerminals = lazy(() =>
  import("./pages/admin/POSTerminals").then((m) => ({
    default: m.POSTerminals,
  })),
);
const SystemHealthAndLogs = lazy(() =>
  import("./pages/admin/SystemHealthAndLogs").then((m) => ({
    default: m.SystemHealthAndLogs,
  })),
);
const LicenseGenerator = lazy(() => import("./pages/admin/LicenseGenerator"));
const CareersPortal = lazy(() =>
  import("./pages/hr/CareersPortal").then((m) => ({
    default: m.CareersPortal,
  })),
);
const AssetCustody = lazy(() =>
  import("./pages/hr/AssetCustody").then((m) => ({ default: m.AssetCustody })),
);
const BIDashboards = lazy(() =>
  import("./pages/reports/BIDashboards").then((m) => ({
    default: m.BIDashboards,
  })),
);
const PublicWebsite = lazy(() => import("./pages/PublicWebsite"));

// School Models
const SchoolDashboard = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolDashboard })));
const SchoolStudents = lazy(() => import("./pages/school").then(m => ({ default: m.Students })));
const SchoolTeachers = lazy(() => import("./pages/school").then(m => ({ default: m.Teachers })));
const SchoolClasses = lazy(() => import("./pages/school").then(m => ({ default: m.Classes })));
const SchoolAttendance = lazy(() => import("./pages/school").then(m => ({ default: m.Attendance })));
const SchoolGrades = lazy(() => import("./pages/school").then(m => ({ default: m.Grades })));
const SchoolExams = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolExams })));
const SchoolFees = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolFees })));
const SchoolCashier = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolCashier })));
const SchoolTimetable = lazy(() => import("./pages/school").then(m => ({ default: m.Timetable })));
const SchoolTransport = lazy(() => import("./pages/school").then(m => ({ default: m.Transport })));
const SchoolLibrary = lazy(() => import("./pages/school").then(m => ({ default: m.Library })));
const SchoolStaff = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolStaff })));

// School Placeholders
const SchoolAdmissions = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolAdmissions })));
const SchoolParents = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolParents })));
const SchoolBehavior = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolBehavior })));
const SchoolHomework = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolHomework })));
const SchoolCertificates = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolCertificates })));
const SchoolClinic = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolClinic })));
const SchoolEvents = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolEvents })));
const SchoolParentCommunication = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolParentCommunication })));
const SchoolReports = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolReports })));
const SchoolHostel = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolHostel })));
const SchoolInventory = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolInventory })));
const SchoolSuppliers = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolSuppliers })));
const SchoolDiscounts = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolDiscounts })));
const SchoolWithdrawals = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolWithdrawals })));
const SchoolSecurePickup = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolSecurePickup })));
const SchoolAlumni = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolAlumni })));
const SchoolContracts = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolContracts })));
const SchoolAcademicYear = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolAcademicYear })));
const SchoolTrips = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolTrips })));
const SchoolActivities = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolActivities })));
const SchoolMeals = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolMeals })));
const SchoolSleep = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolSleep })));
const SchoolDailyReports = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolDailyReports })));
const SchoolGallery = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolGallery })));
const SchoolComplaints = lazy(() => import("./pages/school").then(m => ({ default: m.SchoolComplaints })));
const SchoolExpenses = lazy(() => import("./pages/school/SchoolExpenses").then(m => ({ default: m.SchoolExpenses })));
const SmartNotifications = lazy(() => import("./pages/school").then(m => ({ default: m.SmartNotifications })));

// Salon Models
const SalonDashboard = lazy(() => import("./pages/salon").then(m => ({ default: m.SalonDashboard })));
const SalonAppointments = lazy(() => import("./pages/salon").then(m => ({ default: m.SalonAppointments })));
const SalonServices = lazy(() => import("./pages/salon").then(m => ({ default: m.SalonServices })));
const SalonChairs = lazy(() => import("./pages/salon").then(m => ({ default: m.SalonChairs })));
const SalonStaff = lazy(() => import("./pages/salon").then(m => ({ default: m.SalonStaff })));
const SalonCommissions = lazy(() => import("./pages/salon").then(m => ({ default: m.SalonCommissions })));

// Garage Models
const GarageDashboard = lazy(() => import("./pages/garage").then(m => ({ default: m.GarageDashboard })));
const GarageJobs = lazy(() => import("./pages/garage").then(m => ({ default: m.Jobs })));
const GarageVehicles = lazy(() => import("./pages/garage").then(m => ({ default: m.Vehicles })));
const GarageTechnicians = lazy(() => import("./pages/garage").then(m => ({ default: m.Technicians })));
const GarageSpareParts = lazy(() => import("./pages/garage").then(m => ({ default: m.SpareParts })));
const GarageInvoices = lazy(() => import("./pages/garage").then(m => ({ default: m.GarageInvoices })));
const GarageAppointments = lazy(() => import("./pages/garage").then(m => ({ default: m.GarageAppointments })));
const GarageStaff = lazy(() => import("./pages/garage").then(m => ({ default: m.GarageStaff })));

// Gym Models
const GymDashboard = lazy(() => import("./pages/gym").then(m => ({ default: m.GymDashboard })));
const GymMemberships = lazy(() => import("./pages/gym").then(m => ({ default: m.Memberships })));
const GymClasses = lazy(() => import("./pages/gym").then(m => ({ default: m.Classes })));
const GymTrainers = lazy(() => import("./pages/gym").then(m => ({ default: m.Trainers })));
const GymEquipment = lazy(() => import("./pages/gym").then(m => ({ default: m.Equipment })));
const GymStore = lazy(() => import("./pages/gym").then(m => ({ default: m.GymStore })));
const GymAccessControl = lazy(() => import("./pages/gym").then(m => ({ default: m.AccessControl })));
const GymStaff = lazy(() => import("./pages/gym").then(m => ({ default: m.GymStaff })));

// Hotel Models
const HotelDashboard = lazy(() => import("./pages/hotel").then(m => ({ default: m.HotelDashboard })));
const HotelReservations = lazy(() => import("./pages/hotel").then(m => ({ default: m.Reservations })));
const HotelRooms = lazy(() => import("./pages/hotel").then(m => ({ default: m.Rooms })));
const HotelHousekeeping = lazy(() => import("./pages/hotel").then(m => ({ default: m.Housekeeping })));
const HotelBilling = lazy(() => import("./pages/hotel").then(m => ({ default: m.HotelBilling })));
const HotelDining = lazy(() => import("./pages/hotel").then(m => ({ default: m.HotelDining })));
const HotelServices = lazy(() => import("./pages/hotel").then(m => ({ default: m.HotelServices })));
const HotelStaff = lazy(() => import("./pages/hotel").then(m => ({ default: m.HotelStaff })));

// Additional Staff Models
const ClinicStaff = lazy(() => import("./pages/clinics/ClinicStaff").then(m => ({ default: m.ClinicStaff })));
const ClinicBilling = lazy(() => import("./pages/clinics/ClinicBilling").then(m => ({ default: m.ClinicBilling })));
const ClinicInventory = lazy(() => import("./pages/clinics/ClinicInventory").then(m => ({ default: m.ClinicInventory })));
const ClinicServices = lazy(() => import("./pages/clinics/ClinicServices").then(m => ({ default: m.ClinicServices })));
const ClinicInsurance = lazy(() => import("./pages/clinics/ClinicInsurance").then(m => ({ default: m.ClinicInsurance })));
const ClinicAssets = lazy(() => import("./pages/clinics/ClinicAssets").then(m => ({ default: m.ClinicAssets })));
const ClinicReports = lazy(() => import("./pages/clinics/ClinicReports").then(m => ({ default: m.ClinicReports })));
const LegalStaff = lazy(() => import("./pages/legal/LegalStaff").then(m => ({ default: m.LegalStaff })));
const ManufacturingStaff = lazy(() => import("./pages/manufacturing/ManufacturingStaff").then(m => ({ default: m.ManufacturingStaff })));
const RestaurantStaff = lazy(() => import("./pages/restaurant/RestaurantStaff").then(m => ({ default: m.RestaurantStaff })));
const RestaurantDashboard = lazy(() => import("./pages/restaurant/RestaurantDashboard").then(m => ({ default: m.RestaurantDashboard })));
const RestaurantAccounting = lazy(() => import("./pages/restaurant/RestaurantAccounting").then(m => ({ default: m.RestaurantAccounting })));
const RestaurantReports = lazy(() => import("./pages/restaurant/RestaurantReports").then(m => ({ default: m.RestaurantReports })));
const RestaurantInventory = lazy(() => import("./pages/restaurant/RestaurantInventory").then(m => ({ default: m.RestaurantInventory })));
const RealEstateStaff = lazy(() => import("./pages/RealEstateStaff").then(m => ({ default: m.RealEstateStaff })));

const WebsiteCMS = lazy(() => import("./pages/WebsiteCMS"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ModulesManagement = lazy(() => import("./pages/admin/ModulesManagement"));
const RecycleBin = lazy(() =>
  import("./pages/RecycleBin").then((m) => ({ default: m.RecycleBin })),
);

import { OwnerCloudLogin } from './pages/OwnerCloudLogin';
import { OwnerCloudDashboard } from './pages/OwnerCloudDashboard';
import ParentPortalRouter from './pages/school/ParentPortal';
import TeacherAppRouter from './pages/school/TeacherApp';

import { ActivationGuard } from "./components/ActivationGuard";
import { SmartAlertsManager } from "./components/SmartAlertsManager";

const NavigationMemory: React.FC<{ currentUser: any }> = ({ currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHypotheticalPath = useRef(true);

  useEffect(() => {
    if (!currentUser) return;

    // Restore path on initial load if we are on the root path '/' or dashboard
    if (location.pathname === '/' && isHypotheticalPath.current) {
      isHypotheticalPath.current = false;
      const lastPath = localStorage.getItem('nima_pos_last_path');
      if (lastPath && lastPath !== '/') {
        // Double check it's not a public/external URL in localStorage
        if (!lastPath.startsWith('/website') && !lastPath.startsWith('/parent-portal') && !lastPath.startsWith('/teacher-app')) {
          navigate(lastPath, { replace: true });
        }
      }
    } else {
      isHypotheticalPath.current = false;
    }
  }, [currentUser, navigate, location.pathname]);

  useEffect(() => {
    // Save current path to localStorage
    const path = location.pathname;
    // Don't save public routes, login page, or temporary display paths
    const isExcluded = 
      path === '/login' ||
      path === '/setup' ||
      path.startsWith('/website') ||
      path.startsWith('/parent-portal') ||
      path.startsWith('/teacher-app') ||
      path === '/customer-menu' ||
      path.startsWith('/feedback') ||
      path === '/owner-cloud' ||
      path === '/owner-cloud/dashboard' ||
      path === '/customer-display';

    if (!isExcluded && currentUser) {
      localStorage.setItem('nima_pos_last_path', path);
    }
  }, [location.pathname, currentUser]);

  return null;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);

  // --- GLOBAL BUTTON-CLICK AUDIO FEEDBACK LOGIC ---
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Check if muted
      const isMuted = localStorage.getItem('nima_login_muted') === 'true';
      if (isMuted) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Match button, link, tab, checkbox, radio, dropdown select, or label
      const clickable = target.closest(
        'button, a, [role="button"], [role="tab"], input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], select, .cursor-pointer'
      );
      if (!clickable) return;

      // Avoid playing double sound for elements in Login that already play custom sound
      if (window.location.pathname === '/' || window.location.hash === '#/' || window.location.hash === '') {
        // Since we are on Login screen, we let Login's high-fidelity sound play
        // and avoid double-playing sound for elements in the keypad area
        try {
          const isLoginKey = clickable.closest('[data-login-keypad="true"]');
          if (isLoginKey) return;
        } catch (e) {
          console.warn('Login keypad verification bypass error:', e);
        }
      }

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        const now = ctx.currentTime;

        // Elegant high-fidelity modern UI click sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5 note
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.03); // E6 note
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      } catch (err) {
        // Fail-safe to avoid blocking interaction
      }
    };

    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, []);

  // --- IDLE TIMER LOGIC ---
  useEffect(() => {
    if (!currentUser) return;
    let timeout: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timeout);
      // Lock after 15 minutes of inactivity (900000 ms)
      timeout = setTimeout(() => {
        localStorage.removeItem('nima_user');
        setCurrentUser(null);
        console.log("User locked out due to inactivity");
      }, 900000);
    };

    // Listen to user activity events
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    // Initial setting
    resetTimer();

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
    };
  }, [currentUser]);

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
            if (
              last.getDate() !== now.getDate() ||
              last.getMonth() !== now.getMonth() ||
              last.getFullYear() !== now.getFullYear()
            ) {
              shouldBackup = true;
            }
          }

          if (shouldBackup) {
            console.log("Starting Automatic Backup...");
            const blob = await exportFullDatabase();
            downloadBackup(
              blob,
              `NimaPos_AutoBackup_${now.toISOString().split("T")[0]}.json`,
            );

            await db.settings.update(settings.id!, {
              dbConfig: { ...settings.dbConfig, lastBackupDate: now },
            });

            await logActivity(
              "system",
              "نسخ احتياطي تلقائي",
              "تم إنشاء نسخة احتياطية يومية للنظام",
            );
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
        await seedExtraData(); // Seed 10 products and customers if missing
        const count = await db.settings.count();
        setIsConfigured(count > 0);

        const storedUser = localStorage.getItem("nima_user");
        if (storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser));
          } catch (e) {
            localStorage.removeItem("nima_user");
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
    const storedUser = localStorage.getItem("nima_user");
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
    <ActivationGuard>
      <ErrorBoundary>
        <ToastProvider>
        <ErrorWatcher /> {/* Global Error Listener (Crashes) */}
        <SystemNotifications />
        <SystemHealthMonitor /> {/* Runtime Code/Perf Monitor */}
        {/* Run Auditor only when logged in */}
        {currentUser && <SmartAuditor />}
        {currentUser && <SmartAlertsManager />}
        <HashRouter
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <NavigationMemory currentUser={currentUser} />
          <Suspense
            fallback={
              <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 font-sans">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium text-slate-500 animate-pulse">
                  جاري تحميل الصفحة...
                </p>
              </div>
            }
          >
            <Routes>
              {/* Public Routes */}
              <Route path="/website/*" element={<PublicWebsite />} />
              <Route path="/customer-menu" element={<CustomerMenu />} />
              <Route path="/feedback/:orderId" element={<CustomerFeedback />} />
              <Route path="/owner-cloud" element={<OwnerCloudLogin />} />
              <Route path="/owner-cloud/dashboard" element={<OwnerCloudDashboard />} />
              <Route path="/parent-portal/*" element={<ParentPortalRouter />} />
              <Route path="/teacher-app/*" element={<TeacherAppRouter />} />

              {/* Protected Routes */}
              <Route
                path="*"
                element={
                  !isConfigured ? (
                    <SetupWizard onComplete={handleSetupComplete} />
                  ) : !currentUser ? (
                    <Login onLogin={setCurrentUser} />
                  ) : (
                    <Routes>
                      <Route path="/attendance-terminal" element={<AttendanceTerminalKiosk />} />
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <Layout onLogout={() => setCurrentUser(null)} />
                          </ProtectedRoute>
                        }
                      >
                        {/* 1. Main Operation */}
                        <Route index element={<Dashboard />} />
                        <Route path="pos" element={<POS />} />
                        <Route path="wholesale-pos" element={<WholesaleSales />} />
                        <Route path="wholesale-ledger" element={<WholesaleLedger />} />
                        <Route path="call-center" element={<CallCenter />} />
                        <Route path="clinics/dashboard" element={<ClinicDashboard />} />
                        <Route path="clinics" element={<ClinicReception />} />
                        <Route path="clinics/patients" element={<ClinicPatients />} />
                        <Route path="clinics/doctors" element={<ClinicDoctors />} />
                        <Route path="clinics/cockpit" element={<PhysicianCockpit />} />
                        <Route path="pharmacy/dashboard" element={<PharmacyDashboard initialTab="dashboard" />} />
                        <Route path="pharmacy/pos" element={<PharmacyDashboard initialTab="pos" />} />
                        <Route path="pharmacy/medicines" element={<PharmacyDashboard initialTab="medicines" />} />
                        <Route path="pharmacy/prescriptions" element={<PharmacyDashboard initialTab="prescriptions" />} />
                        <Route path="pharmacy/purchases" element={<PharmacyDashboard initialTab="purchases" />} />
                        <Route path="pharmacy/reports" element={<PharmacyDashboard initialTab="reports" />} />
                        <Route
                          path="restaurant-pos"
                          element={<RestaurantPOS />}
                        />
                        <Route
                          path="restaurant-menu"
                          element={<RestaurantMenu />}
                        />
                        <Route path="rentals" element={<Rentals />} />
                        <Route path="tailoring" element={<Tailoring />} />
                        <Route path="studio" element={<StudioScheduler />} />
                        <Route path="kitchen" element={<Kitchen />} />
                        <Route path="tables" element={<Tables />} />
                        <Route path="waiter" element={<WaiterApp />} />
                        <Route path="delivery" element={<Delivery />} />
                        <Route
                          path="employee-portal"
                          element={<EmployeePortal />}
                        />
                        <Route
                          path="hr/analytics"
                          element={<EmployeeAnalytics />}
                        />
                        <Route path="fleet" element={<FleetManagement />} />
                        <Route path="legal" element={<LegalDocuments />} />
                        <Route path="legal/signature" element={<DigitalSignature />} />
                        <Route
                          path="legal/contracts"
                          element={<ContractManagement />}
                        />
                        <Route path="maintenance" element={<Maintenance />} />
                        <Route path="computer-mobile-maintenance/dashboard" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/orders" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/express" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/parts" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/technicians" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/financials" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/delivery" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/shelves" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/approvals" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/rma" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/abandoned" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/outsourcing" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/couriers" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/b2b-contracts" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/internal-tools" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance/offline-sync" element={<ComputerMobileMaintenance />} />
                        <Route path="computer-mobile-maintenance" element={<Navigate to="/computer-mobile-maintenance/dashboard" replace />} />
                        <Route
                          path="preventive-maintenance"
                          element={<PreventiveMaintenance />}
                        />

                        {/* 2. Sales & Fulfillment */}
                        <Route path="orders" element={<Orders />} />
                        <Route path="quotations" element={<Quotations />} />
                        <Route path="b2b-sales" element={<B2BSales />} />
                        <Route path="ecommerce" element={<EcommerceOrders />} />
                        <Route
                          path="commodity-contracts"
                          element={<CommodityContracts />}
                        />
                        <Route path="van-sales" element={<VanSales />} />
                        <Route path="layaways" element={<Layaways />} />
                        <Route path="customers" element={<Customers />} />
                        <Route path="crm" element={<CRM />} />
                        <Route path="crm/leads" element={<LeadsPipeline />} />
                        <Route path="crm/tickets" element={<Helpdesk />} />
                        <Route
                          path="crm/campaigns"
                          element={<MarketingCampaigns />}
                        />
                        <Route path="helpdesk" element={<Helpdesk />} />
                        <Route path="loyalty" element={<Loyalty />} />
                        <Route path="gift-cards" element={<GiftCards />} />
                        <Route
                          path="subscriptions"
                          element={<Subscriptions />}
                        />
                        <Route path="promotions" element={<Promotions />} />
                        <Route path="installments" element={<Installments />} />
                        <Route path="returns" element={<Returns />} />
                        <Route
                          path="sales-targets"
                          element={<SalesTargets />}
                        />
                        <Route path="fulfillment" element={<Fulfillment />} />
                        <Route path="shifts" element={<Shifts />} />

                        {/* 3. Inventory & Supply */}
                        <Route path="products" element={<Products />} />
                        <Route
                          path="pricing-rules"
                          element={<PricingRules />}
                        />
                        <Route path="currencies" element={<Currencies />} />
                        <Route path="categories" element={<Categories />} />
                        <Route path="recipes" element={<Recipes />} />
                        <Route path="work-orders" element={<WorkOrders />} />
                        <Route
                          path="quality-control"
                          element={<QualityControl />}
                        />
                        <Route
                          path="production-planning"
                          element={<ProductionPlanning />}
                        />
                        <Route
                          path="inventory/demand-forecasting"
                          element={<DemandForecasting />}
                        />
                        <Route path="bom" element={<BillOfMaterials />} />
                        <Route path="work-centers" element={<WorkCenters />} />
                        <Route path="manufacturing/tqm" element={<TQM />} />
                        <Route path="manufacturing/plm" element={<PLM />} />
                        <Route path="warehouse" element={<Warehouse />} />
                        <Route path="consignments" element={<Consignments />} />
                        <Route path="advanced-wms" element={<AdvancedWMS />} />
                        <Route
                          path="branch-transfers"
                          element={<BranchTransfers />}
                        />
                        <Route
                          path="stock-adjustments"
                          element={<StockAdjustments />}
                        />
                        <Route path="measurement-units" element={<MeasurementUnits />} />
                        <Route path="product-price-history" element={<ProductPriceHistoryLog />} />
                        <Route path="proactive-low-stock-alerts" element={<ProactiveLowStockAlerts />} />
                        <Route path="inventory/branch-shipments" element={<BranchShipmentTracking />} />
                        <Route path="inventory/expiry-management" element={<ProductExpiryManagement />} />
                        <Route path="inventory/turnover-dashboard" element={<InventoryTurnoverDashboard />} />
                        <Route
                          path="inventory-count"
                          element={<InventoryCount />}
                        />
                        <Route path="purchases" element={<Purchases />} />
                        <Route
                          path="purchase-orders"
                          element={<PurchaseOrders />}
                        />
                        <Route
                          path="purchase-requests"
                          element={<PurchaseRequests />}
                        />
                        <Route path="rfqs" element={<RFQs />} />
                        <Route path="projects" element={<Projects />} />
                        <Route
                          path="projects/feasibility"
                          element={<FeasibilityStudies />}
                        />
                        <Route
                          path="projects/kpis"
                          element={<ProjectKPIs />}
                        />
                        <Route path="timesheets" element={<Timesheets />} />
                        <Route path="shipping" element={<Shipping />} />
                        <Route
                          path="logistics/import-export"
                          element={<ImportExport />}
                        />
                        <Route path="tasks" element={<Tasks />} />
                        <Route path="events" element={<EventManagement />} />
                        <Route path="tickets/dashboard" element={<TicketsDashboard />} />
                        <Route path="tickets" element={<TicketBookings />} />
                        <Route path="tickets/routes" element={<TicketRoutes />} />
                        <Route path="tickets/fleet" element={<TicketFleet />} />
                        <Route path="tickets/crm" element={<TicketCRM />} />
                        <Route path="tickets/cargo" element={<TicketCargoPage />} />
                        <Route path="tickets/vendors" element={<TicketVendors />} />
                        <Route path="tickets/branches" element={<TicketBranches />} />
                        <Route path="tickets/live" element={<TicketLiveTracking />} />
                        <Route path="tickets/manifest" element={<TicketDriverManifest />} />
                        <Route path="tickets/financials" element={<TicketFinancials />} />
                        <Route path="tickets/reports" element={<TicketReports />} />
                        <Route path="tickets/settings" element={<TicketSettings />} />
                        <Route path="suppliers" element={<Suppliers />} />
                        <Route
                          path="purchases/supplier-evaluation"
                          element={<SupplierEvaluation />}
                        />
                        <Route
                          path="vendor-portal"
                          element={<VendorPortal />}
                        />
                        <Route
                          path="supplier-returns"
                          element={<SupplierReturns />}
                        />
                        <Route path="barcodes" element={<BarcodePrinter />} />
                        <Route
                          path="sticker-printing"
                          element={<StickerPrinting />}
                        />
                        <Route
                          path="periodic-maintenance"
                          element={<PeriodicMaintenance />}
                        />

                        {/* 4. Finance & HR */}
                        <Route path="expenses" element={<Expenses />} />
                        <Route path="payroll" element={<Payroll />} />
                        <Route
                          path="hr/commissions"
                          element={<Commissions />}
                        />
                        <Route path="employees" element={<Employees />} />
                        <Route
                          path="hr/asset-custody"
                          element={<AssetCustody />}
                        />
                        <Route path="attendance" element={<Attendance />} />
                        <Route path="hr/shifts" element={<WorkShifts />} />
                        <Route path="leaves" element={<LeaveManagement />} />
                        <Route path="loans" element={<Loans />} />
                        <Route path="recruitment" element={<Recruitment />} />
                        <Route
                          path="hr/careers-portal"
                          element={<CareersPortal />}
                        />
                        <Route
                          path="performance"
                          element={<PerformanceAppraisals />}
                        />
                        <Route path="training" element={<Training />} />
                        <Route path="hr/lms" element={<LMS />} />
                        <Route path="hr/skills-gap" element={<SkillsGapAnalysis />} />
                        <Route path="hr/succession-planning" element={<SuccessionPlanning />} />
                        <Route path="hr/surveys" element={<EmployeeSurveys />} />
                        <Route
                          path="org-chart"
                          element={<OrganizationalChart />}
                        />
                        <Route path="hr/documents" element={<DocumentManagement />} />
                        <Route path="hr/turnover-dashboard" element={<EmployeeTurnover />} />
                        <Route path="hr/payslips" element={<Payslips />} />
                        <Route path="hr/annual-bonuses" element={<AnnualBonuses />} />
                        <Route path="hr/labor-cost-analysis" element={<LaborCostAnalysis />} />
                        <Route path="benefits" element={<EmployeeBenefits />} />
                        <Route
                          path="disciplinary"
                          element={<DisciplinaryActions />}
                        />
                        <Route path="onboarding" element={<Onboarding />} />
                        <Route path="capital" element={<Capital />} />

                        {/* Legal & Law Firm */}
                        <Route
                          path="legal/contracts"
                          element={<ContractManagement />}
                        />
                        <Route path="law-firm" element={<LawFirm />} />
                        <Route
                          path="law-firm/clients-opponents"
                          element={<LegalClients />}
                        />
                        <Route
                          path="law-firm/billing"
                          element={<LegalBilling />}
                        />
                        <Route
                          path="law-firm/agenda"
                          element={<LegalAgenda />}
                        />
                        <Route
                          path="law-firm/memos-archive"
                          element={<LegalMemos />}
                        />
                        <Route
                          path="law-firm/power-of-attorney"
                          element={<PowerOfAttorney />}
                        />
                        <Route
                          path="law-firm/consultations"
                          element={<LegalConsultations />}
                        />
                        <Route
                          path="law-firm/judgments"
                          element={<Judgments />}
                        />
                        <Route
                          path="law-firm/investigations"
                          element={<LaborInvestigations />}
                        />
                        <Route
                          path="law-firm/ip-trademarks"
                          element={<IntellectualProperty />}
                        />
                        <Route
                          path="law-firm/corporate-affairs"
                          element={<CorporateAffairs />}
                        />
                        <Route
                          path="law-firm/compliance"
                          element={<LegalCompliance />}
                        />

                        {/* Advanced Accounting Sub-routes */}
                        <Route
                          path="accounting/coa"
                          element={<ChartOfAccounts />}
                        />
                        <Route
                          path="accounting/journal"
                          element={<JournalEntries />}
                        />
                        <Route
                          path="accounting/general-ledger"
                          element={<GeneralLedger />}
                        />
                        <Route
                          path="accounting/checks"
                          element={<CheckManagement />}
                        />
                        <Route
                          path="accounting/assets"
                          element={<AssetManagement />}
                        />
                        <Route
                          path="accounting/cost-centers"
                          element={<CostCenters />}
                        />
                        <Route
                          path="accounting/reports"
                          element={<FinancialReports />}
                        />
                        <Route
                          path="accounting/closing"
                          element={<FiscalYearClosing />}
                        />
                        <Route
                          path="accounting/aging"
                          element={<AgingReports />}
                        />
                        <Route path="accounting/tax" element={<TaxReport />} />
                        <Route path="accounting/audit-trail" element={<AuditTrail />} />
                        <Route path="accounting/cash-flow" element={<CashFlowDashboard />} />
                        <Route
                          path="accounting/e-invoicing"
                          element={<EInvoicing />}
                        />
                        <Route
                          path="accounting/cost-accounting"
                          element={<CostAccounting />}
                        />
                        <Route
                          path="accounting/project-accounting"
                          element={<ProjectAccounting />}
                        />
                        <Route
                          path="accounting/partners-equity"
                          element={<PartnersEquity />}
                        />
                        <Route
                          path="accounting/letter-of-credits"
                          element={<LetterOfCredits />}
                        />
                        <Route
                          path="accounting/deferred-revenues"
                          element={<DeferredRevenues />}
                        />
                        <Route
                          path="accounting/zakat-and-taxes"
                          element={<ZakatAndTaxes />}
                        />
                        <Route
                          path="accounting/trust-accounts"
                          element={<TrustAccounts />}
                        />
                        <Route
                          path="accounting/revenue-recognition"
                          element={<RevenueRecognition />}
                        />
                        <Route
                          path="accounting/eosb-accounting"
                          element={<EOSBAccounting />}
                        />
                        <Route
                          path="accounting/wip-accounting"
                          element={<WIPAccounting />}
                        />
                        <Route
                          path="accounting/bank-reconciliation"
                          element={<BankReconciliation />}
                        />
                        <Route
                          path="accounting/treasury"
                          element={<Treasury />}
                        />
                        <Route
                          path="accounting/petty-cash"
                          element={<PettyCash />}
                        />
                        <Route
                          path="accounting/budgeting"
                          element={<Budgeting />}
                        />

                        {/* 5. System & Admin */}
                        <Route path="reports" element={<Reports />} />
                        <Route
                          path="custom-reports"
                          element={<CustomReportBuilder />}
                        />
                        <Route
                          path="reports/bi-dashboards"
                          element={<BIDashboards />}
                        />
                        <Route
                          path="market-monitor"
                          element={<MarketMonitor />}
                        />
                        <Route
                          path="approval-workflows"
                          element={<ApprovalWorkflows />}
                        />
                        <Route path="dms" element={<DMS />} />
                        <Route
                          path="document-editor"
                          element={<DocumentEditor />}
                        />
                        <Route
                          path="internal-communication"
                          element={<InternalCommunication />}
                        />
                        <Route path="audit-logs" element={<AuditLogs />} />
                        <Route
                          path="role-management"
                          element={<RoleManagement />}
                        />
                        <Route
                          path="system-backups"
                          element={<SystemBackups />}
                        />
                        <Route
                          path="admin/server-resources"
                          element={<ServerResources />}
                        />
                        <Route
                          path="admin/api-keys"
                          element={<ApiKeysManagement />}
                        />
                        <Route
                          path="admin/user-sessions"
                          element={<UserSessions />}
                        />
                        <Route
                          path="admin/risk-compliance"
                          element={<RiskCompliance />}
                        />
                        <Route path="users" element={<UsersPage />} />
                        <Route path="branches" element={<Branches />} />
                        <Route
                          path="admin/pos-terminals"
                          element={<POSTerminals />}
                        />
                        <Route
                          path="admin/system-health"
                          element={<SystemHealthAndLogs />}
                        />
                        <Route
                          path="admin/license-generator"
                          element={<LicenseGenerator />}
                        />
                        <Route path="logbook" element={<Logbook />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="notifications" element={<NotificationsPage />} />
                        <Route path="developer/skills" element={<SkillsManager />} />
                        <Route path="developer/chat-logs" element={<ChatLogsManager />} />
                        <Route path="setup" element={<SetupWizard onComplete={() => window.location.href = '/'} isUpdate={true} />} />
                        <Route path="recycle-bin" element={<RecycleBin />} />
                        <Route path="about" element={<About />} />

                        <Route
                          path="customer-portal"
                          element={<CustomerPortal />}
                        />
                        <Route
                          path="property-management"
                          element={<PropertyManagement />}
                        />
                        <Route path="website-cms" element={<WebsiteCMS />} />
                        <Route path="modules" element={<ModulesManagement />} />
                        
                        {/* School */}
                        <Route path="school/dashboard" element={<SchoolDashboard />} />
                        <Route path="school/admissions" element={<SchoolAdmissions />} />
                        <Route path="school/academic-years" element={<SchoolAcademicYear />} />
                        <Route path="school/students" element={<SchoolStudents />} />
                        <Route path="school/trips" element={<SchoolTrips />} />
                        <Route path="school/activities" element={<SchoolActivities />} />
                        <Route path="school/meals" element={<SchoolMeals />} />
                        <Route path="school/sleep" element={<SchoolSleep />} />
                        <Route path="school/daily-reports" element={<SchoolDailyReports />} />
                        <Route path="school/gallery" element={<SchoolGallery />} />
                        <Route path="school/smart-notifications" element={<SmartNotifications />} />
                        <Route path="school/complaints" element={<SchoolComplaints />} />
                        <Route path="school/contracts" element={<SchoolContracts />} />
                        <Route path="school/parents" element={<SchoolParents />} />
                        <Route path="school/teachers" element={<SchoolTeachers />} />
                        <Route path="school/classes" element={<SchoolClasses />} />
                        <Route path="school/attendance" element={<SchoolAttendance />} />
                        <Route path="school/grades" element={<SchoolGrades />} />
                        <Route path="school/exams" element={<SchoolExams />} />
                        <Route path="school/behavior" element={<SchoolBehavior />} />
                        <Route path="school/homework" element={<SchoolHomework />} />
                        <Route path="school/certificates" element={<SchoolCertificates />} />
                        <Route path="school/fees" element={<SchoolFees />} />
                        <Route path="school/expenses" element={<SchoolExpenses />} />
                        <Route path="school/cashier" element={<SchoolCashier />} />
                        <Route path="school/timetable" element={<SchoolTimetable />} />
                        <Route path="school/transport" element={<SchoolTransport />} />
                        <Route path="school/library" element={<SchoolLibrary />} />
                        <Route path="school/clinic" element={<SchoolClinic />} />
                        <Route path="school/parent-communication" element={<SchoolParentCommunication />} />
                        <Route path="school/reports" element={<SchoolReports />} />
                        <Route path="school/events" element={<SchoolEvents />} />
                        <Route path="school/hostel" element={<SchoolHostel />} />
                        <Route path="school/inventory" element={<SchoolInventory />} />
                        <Route path="school/suppliers" element={<SchoolSuppliers />} />
                        <Route path="school/discounts" element={<SchoolDiscounts />} />
                        <Route path="school/withdrawals" element={<SchoolWithdrawals />} />
                        <Route path="school/secure-pickup" element={<SchoolSecurePickup />} />
                        <Route path="school/behavior" element={<SchoolBehavior />} />
                        <Route path="school/employees" element={<SchoolStaff />} />
                        <Route path="school/staff-attendance" element={<Attendance department="school" title="حضور طاقم المدرسة" subtitle="تتبع دوام المعلمين والموظفين" />} />
                        <Route path="school/alumni" element={<SchoolAlumni />} />

                        {/* Garage */}
                        <Route path="garage/dashboard" element={<GarageDashboard />} />
                        <Route path="garage/jobs" element={<GarageJobs />} />
                        <Route path="garage/vehicles" element={<GarageVehicles />} />
                        <Route path="garage/technicians" element={<GarageTechnicians />} />
                        <Route path="garage/spare-parts" element={<GarageSpareParts />} />
                        <Route path="garage/invoices" element={<GarageInvoices />} />
                        <Route path="garage/appointments" element={<GarageAppointments />} />
                        <Route path="garage/employees" element={<GarageStaff />} />
                        <Route path="garage/attendance" element={<Attendance department="garage" title="حضور الفنيين والعمال" subtitle="تتبع دوام فريق الصيانة والورشة" />} />

                        {/* Salon */}
                        <Route path="salon/dashboard" element={<SalonDashboard />} />
                        <Route path="salon/appointments" element={<SalonAppointments />} />
                        <Route path="salon/services" element={<SalonServices />} />
                        <Route path="salon/chairs" element={<SalonChairs />} />
                        <Route path="salon/staff" element={<SalonStaff />} />
                        <Route path="salon/commissions" element={<SalonCommissions />} />

                        {/* Gym */}
                        <Route path="gym/dashboard" element={<GymDashboard />} />
                        <Route path="gym/memberships" element={<GymMemberships />} />
                        <Route path="gym/classes" element={<GymClasses />} />
                        <Route path="gym/trainers" element={<GymTrainers />} />
                        <Route path="gym/equipment" element={<GymEquipment />} />
                        <Route path="gym/store" element={<GymStore />} />
                        <Route path="gym/access-control" element={<GymAccessControl />} />
                        <Route path="gym/employees" element={<GymStaff />} />
                        <Route path="gym/attendance" element={<Attendance department="gym" title="حضور المدربين والطاقم" subtitle="تتبع دوام المدربين وموظفي الجيم" />} />

                        {/* Hotel */}
                        <Route path="hotel/dashboard" element={<HotelDashboard />} />
                        <Route path="hotel/reservations" element={<HotelReservations />} />
                        <Route path="hotel/rooms" element={<HotelRooms />} />
                        <Route path="hotel/housekeeping" element={<HotelHousekeeping />} />
                        <Route path="hotel/billing" element={<HotelBilling />} />
                        <Route path="hotel/dining" element={<HotelDining />} />
                        <Route path="hotel/services" element={<HotelServices />} />
                        <Route path="hotel/employees" element={<HotelStaff />} />
                        <Route path="hotel/attendance" element={<Attendance department="hotel" title="حضور طاقم الفندق" subtitle="تتبع دوام عمال النظافة وموظفي الاستقبال" />} />

                        {/* Cow Farm */}
                        <Route path="cow-farm" element={<CowFarmDashboard />} />
                        <Route path="cow-farm/cows" element={<CowFarmCows />} />
                        <Route path="cow-farm/milk" element={<CowFarmMilk />} />
                        <Route path="cow-farm/breeding" element={<CowFarmBreeding />} />
                        <Route path="cow-farm/health" element={<CowFarmHealth />} />
                        <Route path="cow-farm/feed" element={<CowFarmFeed />} />
                        <Route path="cow-farm/financials" element={<CowFarmFinancials />} />

                        {/* Additional Staff Modules */}
                        <Route path="clinics/employees" element={<ClinicStaff />} />
                        <Route path="clinics/attendance" element={<Attendance department="clinics" title="حضور وانصراف الطاقم الطبي" subtitle="تتبع حضور الأطباء والممرضين" />} />
                        <Route path="clinics/billing" element={<ClinicBilling />} />
                        <Route path="clinics/inventory" element={<ClinicInventory />} />
                        <Route path="clinics/assets" element={<ClinicAssets />} />
                        <Route path="clinics/services" element={<ClinicServices />} />
                        <Route path="clinics/insurance" element={<ClinicInsurance />} />
                        <Route path="clinics/reports" element={<ClinicReports />} />
                        <Route path="legal/employees" element={<LegalStaff />} />
                        <Route path="legal/attendance" element={<Attendance department="legal" title="حضور المحامين والمستشارين" subtitle="تتبع دوام الفريق القانوني" />} />
                        <Route path="manufacturing/employees" element={<ManufacturingStaff />} />
                        <Route path="manufacturing/attendance" element={<Attendance department="manufacturing" title="حضور عمال المصنع" subtitle="تتبع دوام الفنيين والعمال" />} />
                        <Route path="restaurant/dashboard" element={<RestaurantDashboard />} />
                        <Route path="restaurant/employees" element={<RestaurantStaff />} />
                        <Route path="restaurant/attendance" element={<Attendance department="restaurant" title="حضور عمال المطعم" subtitle="تتبع دوام الطهاة والنوادل" />} />
                        <Route path="restaurant/accounting" element={<RestaurantAccounting />} />
                        <Route path="restaurant/reports" element={<RestaurantReports />} />
                        <Route path="restaurant/inventory" element={<RestaurantInventory />} />
                        <Route path="property/employees" element={<RealEstateStaff />} />
                        <Route path="property/attendance" element={<Attendance department="realestate" title="حضور موظفي العقارات" subtitle="تتبع دوام فريق إدارة الأملاك" />} />

                        <Route path="*" element={<NotFound />} />
                      </Route>

                      {/* Standalone Routes */}
                      <Route
                        path="/customer-display"
                        element={<CustomerDisplay />}
                      />
                    </Routes>
                  )
                }
              />
            </Routes>
          </Suspense>
        </HashRouter>
      </ToastProvider>
      </ErrorBoundary>
    </ActivationGuard>
  );
};

export default App;
