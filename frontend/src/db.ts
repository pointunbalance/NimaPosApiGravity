import Dexie, { Table } from "dexie";
import { debug } from "./utils/debug";
import {
  Product,
  Printer,
  Order,
  Customer,
  AppSettings,
  Expense,
  Supplier,
  Purchase,
  PurchaseOrder,
  StockAdjustment,
  Shift,
  WorkShift,
  RosterAssignment,
  User,
  FinancialVoucher,
  HeldOrder,
  SchoolFee,
  SchoolStudent,
  Warehouse,
  BranchTransfer,
  InventoryCountSession,
  InventoryItem,
  CustomerPayment,
  LogEntry,
  Table as RestaurantTable,
  SavedSticker,
  FixedAsset,
  Category,
  Quotation,
  Account,
  JournalEntry,
  BankCheck,
  CostCenter,
  FiscalYear,
  BankReconciliation,
  PettyCash,
  Budget,
  Camera,
  StudioBooking,
  ProductBatch,
  ProductSerial,
  Rental,
  TailoringOrder,
  LoyaltyTransaction,
  Promotion,
  DeliveryArea,
  InstallmentPlan,
  InstallmentPayment,
  Attendance,
  PricingRule,
  Currency,
  MaintenanceOrder,
  MaintenanceRma,
  MaintenanceOutsource,
  Branch,
  SalesTarget,
  B2BInvoice,
  GiftCard,
  Subscription,
  EcommerceOrder,
  VanSalesRoute,
  Lead,
  LeaveRequest,
  Loan,
  Recipe,
  WorkOrder,
  PurchaseRequest,
  RFQ,
  Project,
  PLMProject,
  Task,
  Timesheet,
  Ticket,
  TicketComment,
  QualityCheck,
  ProductionPlan,
  JobApplication,
  PerformanceAppraisal,
  TrainingCourse,
  TrainingEnrollment,
  Vehicle,
  MaintenanceRecord,
  FuelRecord,
  Contract,
  LegalDocument,
  Campaign,
  Shipment,
  WorkCenter,
  Role,
  OnboardingProgram,
  EmployeeBenefit,
  DisciplinaryAction,
  InternalMessage,
  Document,
  ApprovalWorkflow,
  EInvoice,
  Commission,
  AssetCustody,
  POSTerminal,
  TreasuryTransaction,
  TreasuryAccount,
  DemandForecast,
  SupplierRating,
  Event,
  JobPosting,
  Property,
  RiskRecord,
  ComplianceRecord,
  WebsiteContent,
  PreventiveMaintenance,
  TaxReturn,
  AuditLog,
  PeriodicMaintenanceSchedule,
  CommodityContract,
  CommodityDelivery,
  RecycleBinItem,
  LawCase,
  CourtSession,
  FeasibilityStudy,
  RichDocument,
  MeasurementUnit,
  ProductPriceHistory,
  EmployeeSurvey,
  EmployeeSurveyResponse,
  SuccessionPlan,
  ApiKey,
  UserSession,
  VoidItemLog,
  Doctor,
  Appointment,
  MedicalRecord,
  SystemNotification,
  CustomerFeedback,
  TicketBooking,
  TicketCargo,
  TicketRoute,
  TicketTripSchedule,
  TicketSeasonPricing,
  TicketVehicle,
  TicketSeatingTemplate,
  TicketRefund,
  TicketSeatLock,
  TicketVendor,
  TicketVendorRoute,
  TicketVehicleMaintenance,
  TemporaryPartIssue,
  InventoryReservation
} from "./types";

// Define the class for the database
export interface SyncQueueItem {
  id?: number;
  operation: 'create' | 'update' | 'delete';
  tableName: string;
  data: any;
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
}

export class NimaDatabase extends Dexie {
  syncQueue!: Table<SyncQueueItem, number>;
  products!: Table<Product, number>;
  categories!: Table<Category, number>;
  orders!: Table<Order, number>;
  quotations!: Table<Quotation, number>;
  customers!: Table<Customer, number>;
  settings!: Table<AppSettings, number>;
  websiteContent!: Table<WebsiteContent, number>;
  taxReturns!: Table<TaxReturn, number>;
  auditLogs!: Table<AuditLog, number>;
  expenses!: Table<Expense, number>;
  suppliers!: Table<Supplier, number>;
  purchases!: Table<Purchase, number>;
  purchaseOrders!: Table<PurchaseOrder, number>;
  stockAdjustments!: Table<StockAdjustment, number>;
  shifts!: Table<Shift, number>;
  financialVouchers!: Table<FinancialVoucher, number>;
  workShifts!: Table<WorkShift, number>;
  rosterAssignments!: Table<RosterAssignment, number>;
  users!: Table<User, number>;
  attendance!: Table<Attendance, number>;
  heldOrders!: Table<HeldOrder, number>;
  warehouses!: Table<Warehouse, number>;
  branches!: Table<Branch, number>;
  branchTransfers!: Table<BranchTransfer, number>;
  inventoryCountSessions!: Table<InventoryCountSession, number>;
  inventory!: Table<InventoryItem, number>;
  batches!: Table<ProductBatch, number>;
  productSerials!: Table<ProductSerial, number>;
  customerPayments!: Table<CustomerPayment, number>;
  logs!: Table<LogEntry, number>;
  voidLogs!: Table<VoidItemLog, number>;
  customerFeedbacks!: Table<CustomerFeedback, number>;
  notifications!: Table<SystemNotification, number>;
  diningTables!: Table<RestaurantTable, number>;
  savedStickers!: Table<SavedSticker, number>;
  assets!: Table<FixedAsset, number>;
  recycleBin!: Table<RecycleBinItem, number>;

  // Law Office Tables
  lawCases!: Table<LawCase, number>;
  courtSessions!: Table<CourtSession, number>;

  // Accounting Tables
  accounts!: Table<Account, number>;
  journalEntries!: Table<JournalEntry, number>;
  bankChecks!: Table<BankCheck, number>;
  costCenters!: Table<CostCenter, number>;
  fiscalYears!: Table<FiscalYear, number>;
  bankReconciliations!: Table<BankReconciliation, number>;
  pettyCash!: Table<PettyCash, number>;
  budgets!: Table<Budget, number>;

  ticketBookings!: Table<TicketBooking, number>;
  ticketCargos!: Table<TicketCargo, number>;
  ticketRoutes!: Table<TicketRoute, number>;
  ticketTripSchedules!: Table<TicketTripSchedule, number>;
  ticketVendors!: Table<TicketVendor, number>;
  ticketVendorRoutes!: Table<TicketVendorRoute, number>;
  ticketSeasonPricing!: Table<TicketSeasonPricing, number>;
  ticketVehicles!: Table<TicketVehicle, number>;
  ticketVehicleMaintenance!: Table<TicketVehicleMaintenance, number>;
  ticketSeatingTemplates!: Table<TicketSeatingTemplate, number>;
  ticketRefunds!: Table<TicketRefund, number>;
  ticketSeatLocks!: Table<TicketSeatLock, number>;

  // Studio Tables
  cameras!: Table<Camera, number>;
  studioBookings!: Table<StudioBooking, number>;

  // Rentals Table
  rentals!: Table<Rental, number>;

  // Tailoring Orders
  tailoringOrders!: Table<TailoringOrder, number>;

  // Loyalty Transactions
  loyaltyTransactions!: Table<LoyaltyTransaction, number>;

  // Promotions
  promotions!: Table<Promotion, number>;

  // Installments
  installmentPlans!: Table<InstallmentPlan, number>;
  installmentPayments!: Table<InstallmentPayment, number>;

  // Smart Pricing
  pricingRules!: Table<PricingRule, number>;
  currencies!: Table<Currency, number>;
  maintenanceOrders!: Table<MaintenanceOrder, number>;
  maintenanceRmas!: Table<MaintenanceRma, number>;
  maintenanceOutsources!: Table<MaintenanceOutsource, number>;

  // Sales Features
  salesTargets!: Table<SalesTarget, number>;
  b2bInvoices!: Table<B2BInvoice, number>;
  giftCards!: Table<GiftCard, number>;
  subscriptions!: Table<Subscription, number>;
  ecommerceOrders!: Table<EcommerceOrder, number>;
  vanSalesRoutes!: Table<VanSalesRoute, number>;
  leads!: Table<Lead, number>;
  leaveRequests!: Table<LeaveRequest, number>;
  loans!: Table<Loan, number>;
  recipes!: Table<Recipe, number>;
  workOrders!: Table<WorkOrder, number>;
  purchaseRequests!: Table<PurchaseRequest, number>;
  rfqs!: Table<RFQ, number>;
  projects!: Table<Project, number>;
  feasibilityStudies!: Table<FeasibilityStudy, number>;
  richDocuments!: Table<RichDocument, number>;
  plmProjects!: Table<PLMProject, number>;
  tasks!: Table<Task, number>;
  timesheets!: Table<Timesheet, number>;

  measurementUnits!: Table<MeasurementUnit, number>;
  productPriceHistory!: Table<ProductPriceHistory, number>;
  consignments!: Table<any, number>;
  layaways!: Table<any, number>;
  // File System Handles (For Backup)
  directoryHandles!: Table<{ id: string; handle: any }, string>;

  // Helpdesk & CRM Tables
  tickets!: Table<Ticket, number>;
  ticketComments!: Table<TicketComment, number>;
  campaigns!: Table<Campaign, number>;
  qualityChecks!: Table<QualityCheck, number>;
  productionPlans!: Table<ProductionPlan, number>;

  // Advanced HR Tables
  jobApplications!: Table<JobApplication, number>;
  performanceAppraisals!: Table<PerformanceAppraisal, number>;
  trainingCourses!: Table<TrainingCourse, number>;
  trainingEnrollments!: Table<TrainingEnrollment, number>;

  // Fleet Management Tables
  vehicles!: Table<Vehicle, number>;
  maintenanceRecords!: Table<MaintenanceRecord, number>;
  fuelRecords!: Table<FuelRecord, number>;

  // Legal & Documents Tables
  contracts!: Table<Contract, number>;
  legalDocuments!: Table<LegalDocument, number>;

  // Shipping & Customs
  shipments!: Table<Shipment, number>;

  // Security & Logs
  apiKeys!: Table<ApiKey, number>;
  userSessions!: Table<UserSession, number>;
  workCenters!: Table<WorkCenter, number>;
  roles!: Table<Role, number>;
  onboardingPrograms!: Table<OnboardingProgram, number>;
  employeeBenefits!: Table<EmployeeBenefit, number>;
  disciplinaryActions!: Table<DisciplinaryAction, number>;
  messages!: Table<InternalMessage, number>;
  documents!: Table<Document, number>;
  approvalWorkflows!: Table<ApprovalWorkflow, number>;
  preventiveMaintenance!: Table<PreventiveMaintenance, number>;

  // New Advanced ERP Tables
  eInvoices!: Table<EInvoice, number>;
  commissions!: Table<Commission, number>;
  assetCustody!: Table<AssetCustody, number>;
  posTerminals!: Table<POSTerminal, number>;
  treasuryTransactions!: Table<TreasuryTransaction, number>;
  treasuryAccounts!: Table<TreasuryAccount, number>;
  demandForecasts!: Table<DemandForecast, number>;
  supplierRatings!: Table<SupplierRating, number>;
  events!: Table<Event, number>;
  jobPostings!: Table<JobPosting, number>;
  properties!: Table<Property, number>;
  risks!: Table<RiskRecord, number>;
  complianceRecords!: Table<ComplianceRecord, number>;
  powerOfAttorneys!: Table<any, number>;
  legalConsultations!: Table<any, number>;
  judgments!: Table<any, number>;
  laborInvestigations!: Table<any, number>;
  intellectualProperties!: Table<any, number>;
  corporateAffairs!: Table<any, number>;
  legalClients!: Table<any, number>;
  legalOpponents!: Table<any, number>;
  legalBillings!: Table<any, number>;
  legalDeadlines!: Table<any, number>;
  legalMemos!: Table<any, number>;
  periodicMaintenanceSchedules!: Table<PeriodicMaintenanceSchedule, number>;
  commodityContracts!: Table<CommodityContract, number>;
  commodityDeliveries!: Table<CommodityDelivery, number>;
  employeeSurveys!: Table<EmployeeSurvey, number>;
  employeeSurveyResponses!: Table<EmployeeSurveyResponse, number>;
  successionPlans!: Table<SuccessionPlan, number>;

  // New Accounting Modules
  trustAccounts!: Table<any, number>;
  letterOfCredits!: Table<any, number>;
  deferredRevenues!: Table<any, number>;
  partnerEquities!: Table<any, number>;
  zakatRecords!: Table<any, number>;
  revenueRecognitions!: Table<any, number>;
  eosbRecords!: Table<any, number>;
  wipRecords!: Table<any, number>;
  costAccounting!: Table<any, number>;
  projectAccounting!: Table<any, number>;
  temporaryPartIssues!: Table<TemporaryPartIssue, number>;
  inventoryReservations!: Table<InventoryReservation, number>;

  // Clinic Module
  doctors!: Table<Doctor, number>;
  appointments!: Table<Appointment, number>;
  medicalRecords!: Table<MedicalRecord, number>;

  schoolFees!: Table<SchoolFee, number>;
  schoolTimetable!: Table<any, number>;
  schoolTransport!: Table<any, number>;
  transportRoutes!: Table<any, number>;
  transportSubscribers!: Table<any, number>;
  transportTrips!: Table<any, number>;
  transportLogs!: Table<any, number>;
  schoolLibrary!: Table<any, number>;
  garageSpareParts!: Table<any, number>;
  garageInvoices!: Table<any, number>;
  garageAppointments!: Table<any, number>;
  gymEquipment!: Table<any, number>;
  gymStoreItems!: Table<any, number>;
  gymStoreSales!: Table<any, number>;
  gymAccessLogs!: Table<any, number>;
  hotelBilling!: Table<any, number>;
  hotelDiningOrders!: Table<any, number>;
  hotelServicesList!: Table<any, number>;

  schoolStudents!: Table<SchoolStudent, number>;
  guardians!: Table<any, number>;
  authorizedPickups!: Table<any, number>;
  educationalLevels!: Table<any, number>;
  studentSubscriptions!: Table<any, number>;
  schoolFeeTypes!: Table<any, number>;
  studentPayments!: Table<any, number>;
  studentAttendances!: Table<any, number>;
  studentEvaluations!: Table<any, number>;
  healthProfiles!: Table<any, number>;
  healthLogs!: Table<any, number>;
  communicationLogs!: Table<any, number>;
  staffTransactions!: Table<any, number>;
  payrolls!: Table<any, number>;
  schoolSubjects!: Table<any, number>;
  schoolEvaluations!: Table<any, number>;

  schoolTeachers!: Table<any, number>;
  schoolClassesList!: Table<any, number>;
  schoolAttendanceList!: Table<any, number>;
  schoolGradesList!: Table<any, number>;
  garageJobsList!: Table<any, number>;
  garageVehiclesList!: Table<any, number>;
  garageTechniciansList!: Table<any, number>;
  gymMembershipsList!: Table<any, number>;
  gymClassesList!: Table<any, number>;
  gymTrainersList!: Table<any, number>;
  hotelReservations!: Table<any, number>;
  hotelRoomsList!: Table<any, number>;
  hotelHousekeepingList!: Table<any, number>;
  supplierEvaluations!: Table<any, number>;

  clinicInvoices!: Table<any, number>;
  clinicInventoryItems!: Table<any, number>;
  clinicServicesList!: Table<any, number>;
  clinicInsuranceCompanies!: Table<any, number>;
  clinicInsuranceClaims!: Table<any, number>;
  clinicBranches!: Table<any, number>;
  appointmentLocks!: Table<any, number>;
  printers!: Table<Printer, number>;
  deliveryAreas!: Table<DeliveryArea, number>;
  
  // Salon Module Tables
  salonAppointments!: Table<any, number>;
  salonServices!: Table<any, number>;
  salonChairs!: Table<any, number>;
  salonStaff!: Table<any, number>;
  salonCommissions!: Table<any, number>;

  // Missing School Tables
  schoolAdmissions!: Table<any, number>;
  schoolParents!: Table<any, number>;
  schoolBehavior!: Table<any, number>;
  schoolHomework!: Table<any, number>;
  schoolCertificates!: Table<any, number>;
  schoolClinic!: Table<any, number>;
  schoolEvents!: Table<any, number>;
  schoolTrips!: Table<any, number>;
  schoolActivities!: Table<any, number>;
  schoolMealsSchedule!: Table<any, number>;
  schoolStudentMeals!: Table<any, number>;
  schoolStudentSleep!: Table<any, number>;
  schoolDailyReports!: Table<any, number>;
  schoolAlbums!: Table<any, number>;
  schoolPhotos!: Table<any, number>;
  schoolComplaints!: Table<any, number>;
  schoolDiscounts!: Table<any, number>;
  schoolWithdrawals!: Table<any, number>;
  schoolBehavioralTracking!: Table<any, number>;
  schoolPickupLogs!: Table<any, number>;
  schoolAdmissionRequests!: Table<any, number>;
  schoolCrmLogs!: Table<any, number>;
  schoolHostel!: Table<any, number>;
  schoolInventory!: Table<any, number>;
  schoolAlumni!: Table<any, number>;
  schoolContracts!: Table<any, number>;
  schoolExpenses!: Table<any, number>;
  schoolExams!: Table<any, number>;
  schoolExamResults!: Table<any, number>;
  academicYears!: Table<any, number>;

  // Cow Farm Module Tables
  cowFarmCows!: Table<any, number>;
  cowFarmMilkProduction!: Table<any, number>;
  cowFarmFeedStock!: Table<any, number>;
  cowFarmFeeding!: Table<any, number>;
  cowFarmHealth!: Table<any, number>;
  cowFarmBreeding!: Table<any, number>;
  cowFarmFinancials!: Table<any, number>;

  // Pharmacy Module Tables
  pharmacyMedicines!: Table<any, number>;
  pharmacyBatches!: Table<any, number>;
  pharmacyProductUnits!: Table<any, number>;
  pharmacySales!: Table<any, number>;
  pharmacyPrescriptions!: Table<any, number>;
  pharmacyPurchases!: Table<any, number>;
  pharmacyReturns!: Table<any, number>;

  constructor() {
    super("NimaPosDB");

    // Define schema
(this.version(92).stores as any)({
        temporaryPartIssues: "++id, orderId, productId, status, technicianName, issueDate",
        inventoryReservations: "++id, orderId, productId, status, reservedAt",
        voidLogs: "++id, orderId, referenceNumber, voidedByUserId, date",
        customerFeedbacks: "++id, orderId, date, waiterId",
        ticketCargos: "++id, parcelRef, tripId, senderPhone, receiverPhone, status",
        ticketBookings: "++id, bookingRef, customerId, tripId, destination, departureDate, customerName, status, createdAt",
        ticketRoutes: "++id, source, destination",
        ticketTripSchedules: "++id, tripCode, routeId, transportType",
        ticketVendors: "++id, name, transportType",
        ticketVendorRoutes: "++id, vendorId, routeName",
        ticketSeasonPricing: "++id, name, startDate, endDate",
        ticketVehicles: "++id, plateNumber, type, status",
        ticketVehicleMaintenance: "++id, vehicleId, date, type",
        ticketSeatingTemplates: "++id, name, type",
        ticketRefunds: "++id, originalBookingId, refundId, bookingRef",
        ticketSeatLocks: "++id, tripId, seatNumber, expiresAt",
        notifications: "++id, type, date, isRead",
        printers: "++id, name, type, ipAddress",
        syncQueue: "++id, operation, tableName, status, timestamp",
        products:
          "++id, name, category, barcode, stock, alertThreshold, linkedCurrencyId, isFavorite, isService",
        categories: "++id, name",
        orders: "++id, date, customerId, status, fulfillmentStatus, tableNumber, branchId",
        quotations: "++id, date, customerId, status",
        deliveryAreas: "++id, name, isActive",
        customers: "++id, name, phone, code, email",
        settings: "++id",
        websiteContent: "++id",
        taxReturns: "++id, periodStart, periodEnd, status",
        auditLogs: "++id, userId, module, action, timestamp",
        expenses: "++id, date, category, supplierId",
        suppliers: "++id, name, phone",
        purchases: "++id, date, supplierId",
        purchaseOrders: "++id, date, supplierId, status",
        stockAdjustments: "++id, date, productId, type",
        shifts: "++id, startTime, status, branchId",
        financialVouchers: "++id, voucherNumber, type, date, shiftId",
        workShifts: "++id, name, department, isActive",
        rosterAssignments: "++id, userId, date, [userId+date], workShiftId",
        users: "++id, name, pin, role, isActive, phone, jobTitle, managerId, branchId",
        attendance: "++id, userId, date, [userId+date]",
        heldOrders: "++id, date",
        warehouses: "++id, name, isMain, branchId",
        branches: "++id, name, code, status",
        branchTransfers:
          "++id, date, sourceWarehouseId, destinationWarehouseId, status",
        inventoryCountSessions: "++id, date, warehouseId, status",
        inventory: "++id, warehouseId, productId, [warehouseId+productId]",
        batches: "++id, productId, warehouseId, expiryDate",
        productSerials: "++id, serialNumber, productId, status, warehouseId",
        customerPayments: "++id, customerId, date, type",
        logs: "++id, type, date, user, referenceId, status",
        diningTables: "++id, name, zone, status",
        savedStickers: "++id, title, updatedAt",
        assets: "++id, name",
        recycleBin: "++id, originalTable, originalId, deletedAt",
        accounts: "++id, code, type, name",
        journalEntries: "++id, date, reference",
        bankChecks: "++id, number, dueDate, status, type",
        costCenters: "++id, name, code",
        fiscalYears: "++id, name, status, endDate",
        bankReconciliations: "++id, accountId, statementDate",
        pettyCash: "++id, employeeName, date, status",
        budgets: "++id, fiscalYearId, status",
        cameras: "++id, name, status",
        studioBookings: "++id, date, cameraId, [date+cameraId]",
        rentals: "++id, customerId, productId, status, pickupDate, returnDate",
        tailoringOrders: "++id, customerId, status, orderDate, deliveryDate",
        loyaltyTransactions: "++id, customerId, date, type",
        promotions:
          "++id, name, code, type, target, startDate, endDate, isActive",
        installmentPlans: "++id, customerId, orderId, status, startDate",
        installmentPayments: "++id, planId, customerId, dueDate, status",
        pricingRules: "++id, name, minCost, maxCost, isActive",
        currencies: "++id, code",
        maintenanceOrders: "++id, customerId, status, date",
        maintenanceRmas: "++id, orderId, partName, status, dateCreated, supplierId",
        maintenanceOutsources: "++id, orderId, centerName, status, sentDate",
        salesTargets: "++id, employeeId, period",
        b2bInvoices: "++id, customerId, dueDate, status",
        giftCards: "++id, code, status",
        measurementUnits: "++id, name, symbol",
        productPriceHistory: "++id, productId, changeDate, changedBy",
        subscriptions: "++id, customerId, status, nextBillingDate",
        ecommerceOrders: "++id, platform, orderNumber, status",
        vanSalesRoutes: "++id, employeeId, date, status",
        leads: "++id, name, company, status, assignedTo, createdAt",
        leaveRequests: "++id, userId, status, startDate, endDate",
        loans: "++id, userId, status, startDate",
        recipes: "++id, productId, name",
        workOrders:
          "++id, workOrderNumber, recipeId, productId, status, startDate",
        purchaseRequests: "++id, requestNumber, date, requestedBy, status",
        rfqs: "++id, rfqNumber, date, supplierId, status",
        projects: "++id, name, customerId, status",
        feasibilityStudies: "++id, projectId, status, riskLevel",
        richDocuments: "++id, title, status, createdAt, updatedAt",
        plmProjects: "++id, name, status, managerId",
        tasks: "++id, projectId, assignedTo, status",
        timesheets: "++id, userId, projectId, date",
        directoryHandles: "id",
        tickets:
          "++id, ticketNumber, status, priority, customerId, assignedTo, createdBy, createdAt",
        ticketComments: "++id, ticketId, userId, createdAt",
        campaigns: "++id, name, type, status, startDate",
        qualityChecks:
          "++id, referenceId, referenceType, date, inspectorId, status",
        productionPlans:
          "++id, workOrderId, startDate, endDate, status, assignedMachineId",
        jobApplications: "++id, position, applicantName, status, appliedDate",
        performanceAppraisals: "++id, employeeId, evaluatorId, date, period",
        trainingCourses: "++id, title, startDate, endDate, status",
        trainingEnrollments:
          "++id, courseId, employeeId, status, enrollmentDate",
        vehicles: "++id, plateNumber, status, type",
        maintenanceRecords: "++id, vehicleId, date, status",
        fuelRecords: "++id, vehicleId, driverId, date",
        contracts: "++id, title, type, partyId, status, endDate",
        legalDocuments: "++id, title, type, entityType, entityId, expiryDate",
        shipments:
          "++id, shipmentNumber, supplierId, billOfLading, status, expectedArrivalDate",
        workCenters: "++id, name, code",
        roles: "++id, name",
        onboardingPrograms: "++id, title, employeeId, status, startDate",
        employeeBenefits: "++id, name, type",
        disciplinaryActions: "++id, employeeId, type, date, status",
        messages: "++id, senderId, receiverId, timestamp, isRead",
        documents: "++id, name, category, type, date",
        approvalWorkflows: "++id, name, type, status",
        preventiveMaintenance: "++id, equipment, type, nextDate, status",
        eInvoices: "++id, orderId, status, date",
        commissions: "++id, employeeId, status, date",
        apiKeys: "++id, name, status, createdAt",
        userSessions: "++id, userId, status, loginTime, ipAddress, location",
        assetCustody: "++id, employeeId, status, issueDate",
        posTerminals: "++id, name, branchId, status",
        treasuryTransactions: "++id, type, date, category, status",
        treasuryAccounts: "++id, name, type, branchId",
        demandForecasts: "++id, productId, period",
        supplierRatings: "++id, supplierId, date",
        events: "++id, name, startDate, status",
        jobPostings: "++id, title, department, status, postedDate",
        properties: "++id, name, type, status",
        risks: "++id, title, category, status, probability, impact",
        complianceRecords: "++id, title, type, status",
        periodicMaintenanceSchedules:
          "++id, customerId, orderId, productId, status",
        commodityContracts: "++id, customerId, productId, status, contractDate",
        commodityDeliveries: "++id, contractId, date",
        employeeSurveys: "++id, title, status, startDate",
        employeeSurveyResponses: "++id, surveyId, employeeId, submittedAt",
        successionPlans: "++id, role, lastReviewed",
        lawCases: "++id, caseNumber, clientId, status",
        courtSessions: "++id, caseId, sessionDate, status",
        powerOfAttorneys: "++id, poaNumber, clientId, status, expiryDate",
        legalConsultations: "++id, clientId, consultationDate, status, type",
        judgments: "++id, caseId, judgmentDate, status",
        laborInvestigations: "++id, employeeId, incidentDate, status",
        intellectualProperties: "++id, title, type, registrationNumber, status",
        corporateAffairs: "++id, title, type, date, status",
        legalClients: "++id, name, idNumber, type",
        legalOpponents: "++id, name, type",
        legalBillings: "++id, caseId, clientId, status",
        legalDeadlines: "++id, title, caseId, dueDate",
        legalMemos: "++id, title, type",
        trustAccounts: "++id, reference, client",
        letterOfCredits: "++id, type, reference, bank",
        deferredRevenues: "++id, type, reference",
        partnerEquities: "++id, name, type",
        zakatRecords: "++id, period, type",
        revenueRecognitions: "++id, contractId, period",
        eosbRecords: "++id, employeeId, type",
        wipRecords: "++id, projectId, type",
        costAccounting: "++id, centerId, type",
        projectAccounting: "++id, projectId, status",
        consignments: "++id, type, partyId, status, date",
        layaways: "++id, customerId, status, date",
        doctors: "++id, name, specialization",
        appointments: "++id, customerId, doctorId, date, status, branchId, arrivalTime, consultationStartTime",
        medicalRecords: "++id, customerId, doctorId, date",
        schoolFees: "++id, studentId, amount, date, status",
        schoolTimetable: "++id, classId, subject, teacherId, day, time",
        schoolTransport: "++id, busNumber, driverId, route, status",
        transportRoutes: "++id, name, driverId, supervisorId, status",
        transportSubscribers: "++id, studentId, routeId, type",
        transportTrips: "++id, routeId, date, direction, status",
        transportLogs: "++id, tripId, studentId, action, time",
        schoolLibrary: "++id, title, author, isbn, status",
        garageSpareParts: "++id, name, partNumber, price, stock",
        garageInvoices: "++id, customerId, date, amount, status",
        garageAppointments: "++id, customerId, vehicleId, date, status",
        gymEquipment: "++id, name, type, status, lastMaintenance",
        gymStoreItems: "++id, name, price, stock",
        gymStoreSales: "++id, itemId, itemName, quantity, totalPrice, date, customerName, paymentMethod, journalRef",
        gymAccessLogs: "++id, memberId, timestamp, type",
        hotelBilling: "++id, reservationId, amount, date, status",
        hotelDiningOrders: "++id, roomNumber, amount, date, status",
        hotelServicesList: "++id, name, price, type, status",


        schoolStudents: "++id, code, name, nationalId, levelId, classroomId, status, branchId",
        guardians: "++id, name, primaryPhone, nationalId",
        authorizedPickups: "++id, studentId, name, phone",
        educationalLevels: "++id, name, sortOrder, isActive",
        schoolFeeTypes: "++id, name, type, isActive",
        studentSubscriptions: "++id, studentId, feeTypeId, status",
        studentPayments: "++id, receiptNumber, studentId, paymentDate",
        studentAttendances: "++id, studentId, date, status",
        studentEvaluations: "++id, studentId, classroomId, monthOrWeek",
        healthProfiles: "++id, studentId",
        healthLogs: "++id, studentId, type, date",
        communicationLogs: "++id, studentId, type, channel, date, status",
        staffTransactions: "++id, userId, type, amount, date, description",
        payrolls: "++id, userId, monthYear, status",
        schoolSubjects: "++id, name, category, applicableLevels",
        schoolEvaluations: "++id, studentId, subjectId, date, type, term",

        schoolTeachers: "++id, name, subject, phone, status",
        schoolClassesList: "++id, name, grade, capacity, teacherId",
        schoolAttendanceList: "++id, studentId, date, status",
        schoolGradesList: "++id, studentId, subject, score, term",
        garageJobsList: "++id, vehicleId, description, status, estimatedCost",
        garageVehiclesList: "++id, plateNumber, make, model, customerId",
        garageTechniciansList: "++id, name, specialization, phone, status",
        gymMembershipsList: "++id, memberId, plan, startDate, endDate, status",
        gymClassesList: "++id, name, trainerId, schedule, capacity",
        gymTrainersList: "++id, name, specialization, phone, status",
        hotelReservations: "++id, customerName, roomNumber, checkIn, checkOut, status",
        hotelRoomsList: "++id, roomNumber, type, capacity, status",
        hotelHousekeepingList: "++id, roomNumber, task, assignedTo, status",
        supplierEvaluations: "++id, supplierId, date, score, notes",
        clinicInvoices: "++id, customerId, date, status, branchId",
        clinicInventoryItems: "++id, itemName, itemCode, stockAmount, expiryDate",
        clinicServicesList: "++id, serviceName, category, price",
        clinicInsuranceCompanies: "++id, companyName, status",
        clinicInsuranceClaims: "++id, companyId, customerId, invoiceId, status, date",
        clinicBranches: "++id, name",
        appointmentLocks: "++id, [doctorId+date+time], doctorId, date, time, lockedBy, expiresAt",
        salonAppointments: "++id, customerName, service, date, status",
        salonServices: "++id, name, price, duration, status",
        salonChairs: "++id, name, status, assignedStaffId",
        salonStaff: "++id, name, specialization, phone, status",
        salonCommissions: "++id, staffName, amount, date, status",
        schoolAdmissions: "++id, studentName",
        schoolParents: "++id, name",
        schoolBehavior: "++id, studentName",
        schoolHomework: "++id, subject",
        schoolCertificates: "++id, studentName",
        schoolClinic: "++id, studentName",
        schoolEvents: "++id, name, type, date",
        schoolTrips: "++id, name, date",
        schoolActivities: "++id, type, date, classroomId",
        schoolMealsSchedule: "++id, day, weekId",
        schoolStudentMeals: "++id, studentId, date, classroomId",
        schoolStudentSleep: "++id, studentId, date, classroomId",
        schoolDailyReports: "++id, studentId, date, classroomId",
        schoolAlbums: "++id, title, date, classroomId",
        schoolPhotos: "++id, albumId, date, isShared",
        schoolComplaints: "++id, date, status, priority, type, studentId, employeeId, parentId",
        schoolDiscounts: "++id, studentId, type, status, appliesTo",
        schoolWithdrawals: "++id, studentId, date, status",
        schoolBehavioralTracking: "++id, studentId, date, priority, status",
        schoolPickupLogs: "++id, studentId, date, time",
        schoolAdmissionRequests: "++id, childName, parentName, phone, status, visitDate, createdAt",
        schoolCrmLogs: "++id, requestId, date, employeeId",
        schoolHostel: "++id, roomNumber",
        schoolInventory: "++id, name, category",
        schoolAlumni: "++id, name",
        schoolContracts: "++id, studentId, guardianId, type, status",
        schoolExpenses: "++id, title, category, date, amount, status",
        schoolExams: "++id, title, classId, subject, date, totalMarks",
        schoolExamResults: "++id, examId, studentId, marks",
        academicYears: "++id, name, isCurrent, isArchived",
        cowFarmCows: "++id, tagNumber, breed, status, gender, healthStatus, roomNumber",
        cowFarmMilkProduction: "++id, cowId, cowTag, date, shift, quantity, recordedBy",
        cowFarmFeedStock: "++id, name, stock, unit",
        cowFarmFeeding: "++id, feedId, feedName, quantity, date",
        cowFarmHealth: "++id, cowId, cowTag, date, diagnosis, safetyPeriodEnd",
        cowFarmBreeding: "++id, cowId, cowTag, inseminationDate, pregnancyStatus, expectedArrivalDate",
        cowFarmFinancials: "++id, date, type, amount, journalEntryId",
        pharmacyMedicines: "++id, name, code, category, activeIngredient, stock, expiryDate, shelfLocation, price",
        pharmacyBatches: "++id, productId, batchNumber, expiryDate, quantityAtomic, purchaseCost",
        pharmacyProductUnits: "++id, productId, unitName, conversionFactor, price",
        pharmacySales: "++id, customerName, date, total, paymentMethod, status",
        pharmacyPrescriptions: "++id, patientName, doctorName, date, status",
        pharmacyPurchases: "++id, supplierName, date, total, status",
        pharmacyReturns: "++id, supplierName, date, total, status",
      })
      .upgrade(async (tx: any) => {
        // Migrations if needed
      });
  }
}

// Create the database instance
export const db = new NimaDatabase();

// Centralized Recycle Bin: Intercept deletes across all tables
const setupRecycleBinHooks = () => {
  const excludedTables = [
    "recycleBin",
    "logs",
    "settings",
    "directoryHandles",
    "inventoryCountSessions",
  ];
  db.tables.forEach((table) => {
    if (!excludedTables.includes(table.name)) {
      table.hook("deleting", function (primKey, obj, transaction) {
        if (!obj) return;
        const tableName = table.name;
        let summary =
          obj.name ||
          obj.title ||
          obj.orderNumber ||
          obj.invoiceNumber ||
          obj.id?.toString() ||
          "سجل محذوف";
        if (typeof summary === "string" && summary.length > 100)
          summary = summary.substring(0, 100) + "...";

        // We run this after the transaction completes successfully
        transaction.on("complete", () => {
          db.recycleBin
            .add({
              originalTable: tableName,
              originalId: primKey as any,
              data: obj,
              deletedAt: Date.now(),
              summary: summary,
            })
            .catch((err) =>
              console.error("Failed to add to recycle bin:", err),
            );
        });
      });
    }
  });
};

setupRecycleBinHooks();

export const seedTreasuryAccounts = async () => {
    const count = await db.treasuryAccounts.count();
    if (count === 0) {
        await db.treasuryAccounts.bulkAdd([
            { name: "الخزينة الرئيسية", type: "safe", createdAt: new Date().toISOString() },
            { name: "الحساب البنكي", type: "bank", createdAt: new Date().toISOString() },
            { name: "درج الكاشير", type: "cashier", createdAt: new Date().toISOString() },
            { name: "العهدة النقدية", type: "petty_cash", createdAt: new Date().toISOString() }
        ]);
    }
};

export const seedAccountingData = async () => {
  const existingAccounts = await db.accounts.count();
  if (existingAccounts === 0) {
    const defaultAccounts: Account[] = [
      // Assets (1000-1999)
      { code: "1010", name: "الصندوق (الكاش)", type: "asset", isSystem: true },
      { code: "1020", name: "البنك", type: "asset", isSystem: true },
      {
        code: "1030",
        name: "العملاء (ذمم مدينة)",
        type: "asset",
        isSystem: true,
      },
      { code: "1040", name: "المخزون", type: "asset", isSystem: true },
      {
        code: "1050",
        name: "أوراق قبض (شيكات واردة)",
        type: "asset",
        isSystem: true,
      },
      { code: "1100", name: "الأصول الثابتة", type: "asset" },
      { code: "1110", name: "مجمع الإهلاك", type: "asset" },

      // Liabilities (2000-2999)
      {
        code: "2010",
        name: "الموردين (ذمم دائنة)",
        type: "liability",
        isSystem: true,
      },
      { code: "2020", name: "ضريبة مستحقة", type: "liability", isSystem: true },
      { code: "2040", name: "تأمينات مستحقة", type: "liability", isSystem: true },
      {
        code: "2030",
        name: "أوراق دفع (شيكات صادرة)",
        type: "liability",
        isSystem: true,
      },

      // Equity (3000-3999)
      { code: "3010", name: "رأس المال", type: "equity", isSystem: true },
      { code: "3020", name: "الأرباح المبقاة", type: "equity", isSystem: true },
      { code: "3030", name: "المسحوبات الشخصية", type: "equity" },

      // Revenue (4000-4999)
      { code: "4010", name: "المبيعات", type: "revenue", isSystem: true },
      { code: "4020", name: "إيرادات أخرى", type: "revenue" },
      { code: "4030", name: "خصم مكتسب", type: "revenue" },

      // Expenses (5000-5999)
      {
        code: "5010",
        name: "تكلفة البضاعة المباعة (COGS)",
        type: "expense",
        isSystem: true,
      },
      { code: "5020", name: "الإيجار", type: "expense" },
      { code: "5030", name: "الرواتب والأجور", type: "expense" },
      { code: "5040", name: "الكهرباء والماء", type: "expense" },
      { code: "5050", name: "خصم مسموح به", type: "expense" },
      { code: "5060", name: "مصروفات نثرية", type: "expense" },
      { code: "5070", name: "مصروف الإهلاك", type: "expense" },
      {
        code: "5080",
        name: "عجز/زيادة الصندوق",
        type: "expense",
        isSystem: true,
      },
    ];
    await db.accounts.bulkAdd(defaultAccounts);
  }
};

// --- SQL SCHEMA GENERATOR (For Auto-Initializing SQLite/SQL Server) ---
export const getSqlSchema = (): string[] => {
  const queries: string[] = [];

  // Helper to map generic types to SQL types
  const createTable = (name: string, columns: string[]) => {
    return `CREATE TABLE IF NOT EXISTS ${name} (${columns.join(", ")});`;
  };

  queries.push(
    createTable("Products", [
      "id INTEGER PRIMARY KEY AUTOINCREMENT",
      "name TEXT",
      "price REAL",
      "costPrice REAL",
      "category TEXT",
      "stock REAL",
      "barcode TEXT",
      "image TEXT",
      "type TEXT",
      "isFavorite INTEGER",
    ]),
  );

  queries.push(
    createTable("Categories", [
      "id INTEGER PRIMARY KEY AUTOINCREMENT",
      "name TEXT",
      "color TEXT",
      "description TEXT",
    ]),
  );

  queries.push(
    createTable("Orders", [
      "id INTEGER PRIMARY KEY AUTOINCREMENT",
      "date DATETIME",
      "totalAmount REAL",
      "subtotalAmount REAL",
      "taxAmount REAL",
      "discountAmount REAL",
      "paymentMethod TEXT",
      "status TEXT",
      "customerId INTEGER",
      "note TEXT",
    ]),
  );

  queries.push(
    createTable("Customers", [
      "id INTEGER PRIMARY KEY AUTOINCREMENT",
      "name TEXT",
      "phone TEXT",
      "balance REAL",
      "totalSpent REAL",
    ]),
  );

  queries.push(
    createTable("Users", [
      "id INTEGER PRIMARY KEY AUTOINCREMENT",
      "name TEXT",
      "pin TEXT",
      "role TEXT",
      "isActive INTEGER",
    ]),
  );

  queries.push(
    createTable("Warehouses", [
      "id INTEGER PRIMARY KEY AUTOINCREMENT",
      "name TEXT",
      "isMain INTEGER",
      "address TEXT",
    ]),
  );

  // New Accounting Tables for SQL Export
  queries.push(
    createTable("Accounts", [
      "id INTEGER PRIMARY KEY AUTOINCREMENT",
      "code TEXT",
      "name TEXT",
      "type TEXT",
    ]),
  );

  queries.push(
    createTable("JournalEntries", [
      "id INTEGER PRIMARY KEY AUTOINCREMENT",
      "date DATETIME",
      "reference TEXT",
      "description TEXT",
      "totalAmount REAL",
    ]),
  );

  return queries;
};

// --- BACKUP & EXPORT UTILITIES ---

export const exportFullDatabase = async (): Promise<Blob> => {
  const exportData: any = {};
  const tables = (db as any).tables;
  for (const table of tables) {
    if (table.name === "directoryHandles") continue; // Do not export handles
    exportData[table.name] = await table.toArray();
  }
  exportData["exportDate"] = new Date();
  exportData["version"] = "2.7.0";

  // Using Blob and FileReader to safely convert large JSON strings to Base64 without call stack issues
  const jsonStr = JSON.stringify(exportData);
  const blobData = new Blob([jsonStr], { type: "application/json" });
  const encryptedPayload = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    reader.readAsDataURL(blobData);
  });

  const finalPayload = {
     signature: "NIMA_SECURE_BACKUP_V1",
     timestamp: new Date().toISOString(),
     data: encryptedPayload
  };

  return new Blob([JSON.stringify(finalPayload, null, 2)], {
    type: "application/json",
  });
};

export const downloadBackup = (blob: Blob, filename?: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename || `NimaPos_Backup_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const restoreFullDatabase = async (jsonData: any): Promise<boolean> => {
  try {
    let parsedData = jsonData;

    // Check if it's our new encrypted format
    if (jsonData.signature === "NIMA_SECURE_BACKUP_V1" && jsonData.data) {
       // Convert back from Base64 using fetch API to avoid memory and decoding issues on large data
       const response = await fetch("data:application/json;base64," + jsonData.data);
       const jsonStr = await response.text();
       parsedData = JSON.parse(jsonStr);
    } else if (jsonData.exportDate) {
       // Old plaintext format (Backwards compatibility)
       parsedData = jsonData;
    } else {
       throw new Error("Invalid backup format or signature missing");
    }

    const tables = (db as any).tables;
    await db.transaction("rw", tables, async () => {
      for (const table of tables) {
        if (table.name === "directoryHandles") continue;
        if (parsedData[table.name]) {
          await table.clear();
          await table.bulkAdd(parsedData[table.name]);
        }
      }
    });
    return true;
  } catch (error) {
    console.error("Restore failed:", error);
    return false;
  }
};

export const clearAllData = async (): Promise<boolean> => {
  try {
    const tables = (db as any).tables;
    await db.transaction("rw", tables, async () => {
      for (const table of tables) {
        if (table.name === "directoryHandles") continue;
        await table.clear();
      }
    });
    return true;
  } catch (error) {
    console.error("Clear data failed:", error);
    return false;
  }
};

// --- FILE SYSTEM ACCESS API BACKUP ---
export const performBackupToDirectory = async () => {
  try {
    const entry = await db.directoryHandles.get("backupDir");
    if (!entry || !entry.handle) {
      throw new Error("No backup directory configured");
    }

    // Verify permission
    const handle = entry.handle;
    if ((await handle.queryPermission({ mode: "readwrite" })) !== "granted") {
      // If permission not granted, we might need to ask again,
      // but we can't do that silently on close. We skip if not granted.
      if (
        (await handle.requestPermission({ mode: "readwrite" })) !== "granted"
      ) {
        throw new Error("Permission denied");
      }
    }

    // Generate Filename
    const date = new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = days[date.getDay()];
    // Format: YYYY-MM-DD__HH-mm-ss__Day
    const dateStr = date.toISOString().split("T")[0];
    const timeStr = date.toTimeString().split(" ")[0].replace(/:/g, "-");
    const filename = `NimaBackup_${dateStr}__${timeStr}__${dayName}.json`;

    // Generate Data
    const blob = await exportFullDatabase();

    // Write File
    const fileHandle = await handle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();

    return true;
  } catch (e) {
    console.error("Auto Backup Failed:", e);
    return false;
  }
};

// --- SEEDING HELPERS ---

const getRandomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (daysBack: number) => {
  const date = new Date();
  date.setDate(date.getDate() - getRandomInt(0, daysBack));
  date.setHours(getRandomInt(9, 22), getRandomInt(0, 59), 0, 0);
  return date;
};
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- CORE DATA POPULATION LOGIC ---
const populateData = async (
  onProgress?: (label: string, percent: number) => void,
) => {
  onProgress?.("تهيئة الإعدادات...", 5);

  // 1. Settings (Only if empty, though this function is mostly for test data now)
  if ((await db.settings.count()) === 0) {
    await db.settings.add({
      storeName: "متجر نيما (تجريبي)",
      currency: "ج.م",
      currencyCode: "EGP",
      language: "ar",
      businessType: "retail",
      taxRate: 14,
      enableAccounting: true,
      address: "القاهرة، مصر الجديدة",
      phone: "01000000000",
      initialCapital: 1000000,
      dbConfig: { activeProfileId: "local", profiles: [], autoBackup: true },
    });
  }

  // 2. Warehouses
  onProgress?.("إنشاء المستودعات...", 10);
  let warehouseIds: number[] = [];
  if ((await db.warehouses.count()) === 0) {
    const w1 = await db.warehouses.add({
      name: "المعرض الرئيسي",
      address: "مصر الجديدة",
      isMain: true,
    });
    const w2 = await db.warehouses.add({
      name: "مخزن الجملة",
      address: "المنطقة الصناعية",
      isMain: false,
    });
    warehouseIds = [w1 as number, w2 as number];
  } else {
    warehouseIds = (await db.warehouses.toArray()).map((w) => w.id!);
  }

  // 3. Users
  onProgress?.("إضافة المستخدمين...", 20);
  if ((await db.users.count()) === 0) {
    await db.users.bulkAdd([
      {
        name: "مدير النظام",
        role: "admin",
        jobTitle: "Admin",
        pin: "00000000",
        isActive: true,
      },
      {
        name: "أولكسندر كوفال",
        role: "cashier",
        jobTitle: "كاشير",
        pin: "12345678",
        isActive: true,
      },
    ]);
  }

  // 4. Products & Inventory
  onProgress?.("إضافة المنتجات والمخزون...", 40);
  if ((await db.products.count()) === 0) {
    const productsToAdd = [
      {
        name: "MacBook Pro",
        price: 95000,
        costPrice: 85000,
        stock: 5,
        category: "Laptops",
        type: "simple",
      },
      {
        name: "iPhone 15",
        price: 45000,
        costPrice: 40000,
        stock: 10,
        category: "Phones",
        type: "simple",
      },
      {
        name: "AirPods Pro",
        price: 10000,
        costPrice: 8000,
        stock: 20,
        category: "Accessories",
        type: "simple",
      },
    ];

    for (const p of productsToAdd) {
      const id = await db.products.add(p as any);
      await db.inventory.add({
        warehouseId: warehouseIds[0],
        productId: id as number,
        quantity: p.stock,
      });
    }
  }

  // 5. Customers
  onProgress?.("إضافة العملاء...", 60);
  if ((await db.customers.count()) === 0) {
    await db.customers.add({
      name: "زبون نقدي",
      phone: "00000000",
      totalSpent: 0,
      balance: 0,
    });
  }

  onProgress?.("تم الانتهاء!", 100);
};

// --- PUBLIC FUNCTIONS ---

export const seedLargeDataSet = async (
  onProgress?: (label: string, percent: number) => void,
) => {
  debug("Forcing Seed Data...");
  await populateData(onProgress);
  debug("Forced Seed Complete.");
};

export const seedExtraData = async () => {
  await seedTreasuryAccounts();
  const productCount = await db.products.count();
  const customerCount = await db.customers.count();

  if (productCount === 0 || productCount === 1) {
    // 1 is maybe for a 'General' product if any
    const foodItems = [
      {
        name: "برجر لحم كلاسيك",
        price: 150,
        costPrice: 80,
        category: "الوجبات",
        stock: 100,
        barcode: "1001",
        isFavorite: 1,
        trackStock: 1,
        description: "شريحة لحم بقري صافي مع جبن شيدر وخس طازج",
        ingredients: [
          "لحم بقري",
          "خبز برجر",
          "جبن شيدر",
          "خس",
          "طماطم",
          "بصل",
          "صوص خاص",
        ],
      },
      {
        name: "شاورما دجاج",
        price: 80,
        costPrice: 40,
        category: "الوجبات",
        stock: 150,
        barcode: "1002",
        isFavorite: 0,
        trackStock: 1,
        description: "شاورما دجاج متبلة بالبهارات الشامية مع صوص الثومية",
        ingredients: [
          "دجاج مقطع",
          "خبز صاج",
          "ثومية",
          "مخلل خيار",
          "بطاطس مقلية",
        ],
      },
      {
        name: "بيتزا مارغريتا",
        price: 120,
        costPrice: 50,
        category: "المخبوزات",
        stock: 50,
        barcode: "1003",
        isFavorite: 1,
        trackStock: 1,
        description:
          "بيتزا كلاسيكية بصلصة الطماطم الغنية وجبنة الموزاريلا المذابة",
        ingredients: [
          "عجينة بيتزا",
          "صلصة طماطم",
          "جبنة موزاريلا",
          "ريحان طازج",
          "زيت زيتون",
        ],
      },
      {
        name: "بطاطس مقلية مبهّرة",
        price: 30,
        costPrice: 10,
        category: "المقبلات",
        stock: 200,
        barcode: "1004",
        isFavorite: 0,
        trackStock: 1,
        description: "أصابع بطاطس مقرمشة متبلة بخلطة البهارات الخاصة",
        ingredients: [
          "بطاطس",
          "زيت نباتي",
          "ملح",
          "بابريكا",
          "فلفل أسود",
          "بهارات مشكلة",
        ],
      },
      {
        name: "وجبة دجاج بروستد",
        price: 180,
        costPrice: 100,
        category: "الوجبات",
        stock: 80,
        barcode: "1005",
        isFavorite: 1,
        trackStock: 1,
        description: "4 قطع دجاج مقرمش مع بطاطس وثومية وخبز",
        ingredients: [
          "دجاج طازج",
          "خلطة بروستد",
          "زيت قلي",
          "بطاطس",
          "ثومية",
          "خبز",
        ],
      },
      {
        name: "عصير برتقال طازج",
        price: 40,
        costPrice: 15,
        category: "المشروبات",
        stock: 120,
        barcode: "1006",
        isFavorite: 0,
        trackStock: 1,
        description: "عصير برتقال بدون إضافات",
        ingredients: ["برتقال طازج", "ثلج (اختياري)"],
      },
      {
        name: "سلطة سيزر",
        price: 60,
        costPrice: 25,
        category: "المقبلات",
        stock: 90,
        barcode: "1007",
        isFavorite: 1,
        trackStock: 1,
        description: "سلطة السيزر المقرمشة مع الدجاج المشوي وجبن البارميزان",
        ingredients: [
          "خس كابوتشا",
          "صدر دجاج مشوي",
          "صوص سيزر",
          "خبز محمص (كروتون)",
          "جبنة بارميزان",
        ],
      },
      {
        name: "كريب نوتيلا",
        price: 70,
        costPrice: 30,
        category: "الحلويات",
        stock: 110,
        barcode: "1008",
        isFavorite: 0,
        trackStock: 1,
        description: "كريب فرنسي رقيق محشو بشوكولاتة نوتيلا الغنية",
        ingredients: [
          "عجينة كريب",
          "شوكولاتة نوتيلا",
          "مكسرات (اختياري)",
          "سكر بودرة",
        ],
      },
      {
        name: "قهوة اسبريسو",
        price: 35,
        costPrice: 10,
        category: "المشروبات",
        stock: 300,
        barcode: "1009",
        isFavorite: 1,
        trackStock: 1,
        description: "جرعة مركزة من البن الكولومبي المحمص",
        ingredients: ["بن إسبريسو", "ماء معالج"],
      },
      {
        name: "مياه غازية",
        price: 20,
        costPrice: 8,
        category: "المشروبات",
        stock: 500,
        barcode: "1010",
        isFavorite: 0,
        trackStock: 1,
        description: "مشروب غازي منعش 330 مل",
        ingredients: ["مياه مكربنة", "نكهة الكولا"],
      },
    ];

    // Also ensure categories exist
    const catPromises = [
      "الوجبات",
      "المخبوزات",
      "المقبلات",
      "المشروبات",
      "الحلويات",
    ].map(async (catName) => {
      const exists = await db.categories.where("name").equals(catName).count();
      if (!exists) {
        await db.categories.add({ name: catName });
      }
    });
    await Promise.all(catPromises);

    await db.products.bulkAdd(foodItems as any);
  }

  if (customerCount <= 1) {
    // 1 is for 'General Customer'
    const defaultCustomers = [
      {
        name: "أندري شيفتشينكو",
        phone: "01011112222",
        code: "CUS-001",
        totalSpent: 0,
        balance: 0,
      },
      {
        name: "أولغا كوفالينكو",
        phone: "01123223333",
        code: "CUS-002",
        totalSpent: 0,
        balance: 0,
      },
      {
        name: "بوهدان ميلنيك",
        phone: "01233334444",
        code: "CUS-003",
        totalSpent: 0,
        balance: 0,
      },
      {
        name: "ماريا بوندس",
        phone: "01544445555",
        code: "CUS-004",
        totalSpent: 0,
        balance: 0,
      },
      {
        name: "فولوديمير لوسينكو",
        phone: "01055556666",
        code: "CUS-005",
        totalSpent: 0,
        balance: 0,
      },
      {
        name: "كاترينا بويكو",
        phone: "01166667777",
        code: "CUS-006",
        totalSpent: 0,
        balance: 0,
      },
      {
        name: "ديمترو شفتس",
        phone: "01277778888",
        code: "CUS-007",
        totalSpent: 0,
        balance: 0,
      },
      {
        name: "سفيتلانا سافتشينكو",
        phone: "01588889999",
        code: "CUS-008",
        totalSpent: 0,
        balance: 0,
      },
      {
        name: "ميكولا كوزنيتسوف",
        phone: "01099990000",
        code: "CUS-009",
        totalSpent: 0,
        balance: 0,
      },
      {
        name: "هالينا بوبوفا",
        phone: "01100001111",
        code: "CUS-010",
        totalSpent: 0,
        balance: 0,
      },
    ];
    await db.customers.bulkAdd(defaultCustomers as any);
  }

  // Fix inventory/warehouse mismatch for seeded items
  const products = await db.products.toArray();
  let mainWarehouse = await db.warehouses.orderBy("id").first(); // Default to first warehouse
  const mainWarehousesArray = await db.warehouses.toArray();
  const explicitMain = mainWarehousesArray.find(
    (w) => w.isMain === true || (w.isMain as any) === 1,
  );
  if (explicitMain) {
    mainWarehouse = explicitMain;
  }

  if (mainWarehouse && mainWarehouse.id) {
    for (const p of products) {
      const invCount = await db.inventory
        .where("productId")
        .equals(p.id!)
        .count();
      if (invCount === 0 && p.stock > 0 && p.type !== "composite") {
        await db.inventory.add({
          productId: p.id!,
          warehouseId: mainWarehouse.id,
          quantity: p.stock,
        });
      }
    }
  }

  // --- Cow Farm Seed Data ---
  const cowCount = await db.cowFarmCows.count();
  if (cowCount === 0) {
    const defaultCows = [
      { tagNumber: "COW-101", breed: "هولشتاين (Holstein)", status: "منتج", gender: "أنثى", healthStatus: "صحي", roomNumber: "عنبر 1", weight: 620, age: 3, birthDate: "2023-01-15" },
      { tagNumber: "COW-102", breed: "جيرسي (Jersey)", status: "عشّار", gender: "أنثى", healthStatus: "صحي", roomNumber: "عنبر 1", weight: 510, age: 4, birthDate: "2022-04-10" },
      { tagNumber: "COW-103", breed: "براون سويس (Brown Swiss)", status: "جاف", gender: "أنثى", healthStatus: "تحت الملاحظة", roomNumber: "عنبر ٢", weight: 580, age: 5, birthDate: "2021-08-22" },
      { tagNumber: "COW-104", breed: "بلدي هجين", status: "عزل", gender: "أنثى", healthStatus: "مريض", roomNumber: "مستوصف العزل", weight: 450, age: 2, birthDate: "2024-02-05" }
    ];
    await db.cowFarmCows.bulkAdd(defaultCows);

    await db.cowFarmFeedStock.bulkAdd([
      { name: "برسيم حجازي مجفف", stock: 1200, unit: "كجم" },
      { name: "مركزات وتسمين 18%", stock: 950, unit: "كجم" },
      { name: "سيلاج ذرة طازج", stock: 2500, unit: "كجم" },
      { name: "نخالة رقائق قمح", stock: 600, unit: "كجم" }
    ]);

    // Seed initial milk production
    await db.cowFarmMilkProduction.bulkAdd([
      { cowId: 1, cowTag: "COW-101", date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], shift: "صباحي", quantity: 18, fatContent: 3.8, recordedBy: "مدير النظام" },
      { cowId: 1, cowTag: "COW-101", date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], shift: "مسائي", quantity: 14, fatContent: 3.9, recordedBy: "مدير النظام" },
      { cowId: 1, cowTag: "COW-101", date: new Date().toISOString().split('T')[0], shift: "صباحي", quantity: 19, fatContent: 3.7, recordedBy: "مدير النظام" }
    ]);

    // Seed breeding pregnancy record for COW-102
    await db.cowFarmBreeding.add({
      cowId: 2,
      cowTag: "COW-102",
      inseminationDate: "2025-11-20",
      pregnancyStatus: "مؤكد",
      expectedArrivalDate: "2026-08-25",
      notes: "تلقيح اصطناعي بنجاح - سلالة مستوردة"
    });

    // Seed health check for COW-104
    await db.cowFarmHealth.add({
      cowId: 4,
      cowTag: "COW-104",
      date: new Date().toISOString().split('T')[0],
      diagnosis: "التهاب ضرع خفيف وعسر هضم",
      treatment: "مضاد حيوي ومقويات جهاز هضمي",
      safetyPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      veterinarian: "د. هاني عثمان",
      cost: 450
    });
  }
};

export const seedDatabase = async () => {
  // Basic seed if needed
  if ((await db.users.count()) === 0) {
    await db.users.add({
      name: "مدير النظام",
      role: "admin",
      pin: "00000000",
      isActive: true,
    });
  }
  if ((await db.settings.count()) === 0) {
    await db.settings.add({
      storeName: "متجر نيما",
      currency: "ج.م",
      currencyCode: "EGP",
      language: "ar",
      businessType: "retail",
      taxRate: 0,
      address: "",
      phone: "",
    });
  }
  if ((await db.warehouses.count()) === 0) {
    await db.warehouses.add({ name: "المخزن الرئيسي", isMain: true });
  }
  if ((await db.customers.count()) === 0) {
    await db.customers.add({ name: "زبون عام", phone: "", totalSpent: 0 });
  }
  // School Roles Seed
  if ((await db.roles.count()) === 0) {
    await db.roles.bulkAdd([
      { name: "accountant", description: "المحاسب", isSystem: true, permissions: ['/school/cashier', '/school/fees', 'school_view_finance', 'school_edit_payment', 'school_cancel_receipt', '/reports', '/accounting/journal', '/expenses'] },
      { name: "receptionist", description: "موظف الاستقبال", isSystem: true, permissions: ['/school/students', '/school/attendance', '/school/parents', '/school', '/school/classes', '/inventory-count'] },
      { name: "teacher", description: "المعلمة", isSystem: true, permissions: ['/school/students', '/school/attendance', '/school/grades', '/school/parent-communication', '/school'] },
      { name: "bus_supervisor", description: "مشرفة الباص", isSystem: true, permissions: ['/school/transport', '/school/attendance'] },
      { name: "parent", description: "ولي الأمر", isSystem: true, permissions: ['/customer-portal'] } // Parent portal
    ]);
  }
};
