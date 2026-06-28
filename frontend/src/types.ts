export type AppMode = "starter" | "standard" | "service" | "enterprise";

export interface ReceiptSection {
  id: string;
  label: string;
  visible: boolean;
  type:
    | "logo"
    | "store_name"
    | "header"
    | "customer"
    | "divider"
    | "items"
    | "totals"
    | "qr"
    | "footer"
    | "barcode";
}

export interface DatabaseProfile {
  id: string;
  name: string;
  provider: "local" | "sqlserver" | "mysql" | "postgres" | "sqlite";
  connectionString?: string;
  filePath?: string;
  host?: string;
  port?: string;
  databaseName?: string;
  username?: string;
  password?: string;
}

export interface DatabaseConfig {
  activeProfileId: string;
  profiles: DatabaseProfile[];
  autoBackup: boolean;
  lastBackupDate?: Date;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  multiplier: number; // e.g., 1.5x points earning
  color: string;
}

export interface LoyaltySettings {
  enabled: boolean;
  pointsPerCurrency: number; // How much currency spent to earn 1 point
  currencyPerPoint: number; // How much currency 1 point is worth when redeeming
  minPointsToRedeem: number;
  welcomeBonus: number;
  enableTiers: boolean;
  tiers: LoyaltyTier[];
}

export interface WebsiteContent {
  id?: number;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  aboutUs: string;
  services: { id: string; title: string; description: string; icon: string }[];
  projects?: {
    id: string;
    title: string;
    description: string;
    image: string;
    category: string;
  }[];
  blogPosts?: {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    image: string;
    date: string;
    author: string;
  }[];
  testimonials?: {
    id: string;
    name: string;
    role: string;
    content: string;
    avatar: string;
  }[];
  faqs?: { id: string; question: string; answer: string }[];
  team?: { id: string; name: string; role: string; image: string }[];
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: { platform: string; url: string }[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  isDraft?: boolean;
}

export interface MaintenanceSettings {
  deviceTypes: string[];
  deviceBrands: string[];
  deviceModels: string[];
  maintenanceTypes: string[];
}

export interface AuditLog {
  id?: number;
  userId: string | number;
  userName?: string;
  action: string;
  module: string;
  details?: string;
  timestamp: string | Date;
  oldValue?: any;
  newValue?: any;
  recordId?: number;
  targetId?: number;
}

export interface AppSettings {
  id?: number;
  storeName: string;
  logo?: string;
  initialCapital?: number;
  taxNumber?: string;

  // Database & Backup
  dbConfig?: DatabaseConfig;
  autoBackupOnClose?: boolean;
  backupDirectoryLabel?: string;

  // Localization
  language: "ar" | "en";
  currency: string;
  currencyCode?: string;

  // Printing & Templates
  printHeaderLogo?: string;
  printStoreName?: string;
  printAddress?: string;
  printStamp?: string;
  printSignature?: string;
  printTermsText?: string;
  printManagerName?: string;

  // Sequences
  sequenceConfig?: {
    [tableName: string]: {
      prefix: string;
      suffix?: string;
      includeYearMonth: boolean;
      padding: number;
    };
  };

  barcodeConfig?: {
    mode: "random" | "sequential" | "advanced";
    customPadding: number;
    advancedFormat: string; // e.g. "PREFIX-SEQ-PRICE-EXP"
    includePrice: boolean;
    includeCost: boolean;
    includeExpiry: boolean;
    productSequences?: {
      targetId: string; // can be Category ID or Product ID
      targetType: "category" | "product";
      prefix: string;
      currentSequence: number;
    }[];
  };

  // Customization
  posSidebarState?: "visible" | "collapsed" | "hidden";

  // ZATCA Integration
  zatca?: {
    enabled: boolean;
    environment: "sandbox" | "simulation" | "production";
    csid?: string;
    privateKey?: string;
    apiSecret?: string;
  };

  // Business Logic
  businessType: string;
  appMode?: AppMode;
  customerSettings?: {
    showLoyaltyPoints?: boolean;
    showCreditBalance?: boolean;
    collectB2BData?: boolean;
    enableMeasurements?: boolean;
    activeMeasurementFields?: string[];
  };
  taxRate: number;
  payrollTaxRate?: number;
  socialInsuranceRate?: number;
  enableAccounting?: boolean;

  // Contact
  address: string;
  phone: string;

  // Printing & Compliance
  receiptHeader?: string;
  receiptFooter?: string;
  termsAndConditions?: string;
  printerWidth?: "58mm" | "80mm";
  autoPrint?: boolean;
  enableQr?: boolean;
  receiptLayout?: ReceiptSection[];
  useHardwarePrinter?: boolean; // New: Use Web Serial API for direct printing
  enableDualPrinting?: boolean; // Print to two printers (i.e. print twice)

  // Custom Printer Devices
  thermalPrinterName?: string;
  barcodePrinterName?: string;

  // Additional Backup configurations
  backupType?: "local" | "cloud";
  backupServerUrl?: string;
  backupAutoInterval?: "manual" | "daily" | "weekly" | "hourly";

  // Security & Behavior
  requirePinForRefund?: boolean;
  enableSounds?: boolean;

  // Loyalty
  loyaltySettings?: LoyaltySettings;

  // Smart Pricing
  enableSmartPricing?: boolean;

  // UI Settings
  hiddenPages?: string[];

  // POS Settings
  posSettings?: {
    allowNegativeStock?: boolean;
    showBarcodeScanner?: boolean;
    showHoldBill?: boolean;
    showReturns?: boolean;
    showCashDrawer?: boolean;
    showSplitPayment?: boolean;
    showPrintBill?: boolean;
    showQuickDiscount?: boolean;
    showPriceListSwitcher?: boolean;
    showCustomPrice?: boolean;
    showSalespersonSelect?: boolean;
    defaultSalespersonId?: number;
    showWeightScale?: boolean;
    dineInServiceChargeRate?: number;
    showSendToKitchen?: boolean;
    wholesaleShowPrices?: boolean;
    rememberCustomerPrices?: boolean;
  };

  // Maintenance Settings
  maintenanceSettings?: MaintenanceSettings;

  // Customer Display Settings
  cdsSettings?: {
    welcomeTitle?: string;
    welcomeMessage?: string;
    bgColor?: string;
    primaryColor?: string;
    textColor?: string;
    logoUrl?: string;
  };
}

export interface LeadActivity {
  id: string;
  type: "call" | "email" | "meeting" | "note";
  date: Date;
  description: string;
  userId: number;
}

export interface Lead {
  id?: number;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  value?: number;
  expectedCloseDate?: Date;
  assignedTo?: number; // userId
  notes?: string;
  activities?: LeadActivity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveRequest {
  id?: number;
  userId: number;
  type: "annual" | "sick" | "unpaid" | "other" | "excuse";
  startDate: Date;
  endDate: Date;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: number;
  createdAt: Date;
}

export interface JobApplication {
  id?: number;
  jobId?: number;
  position: string;
  applicantName: string;
  email?: string;
  phone?: string;
  resumeUrl?: string;
  status:
    | "applied"
    | "screening"
    | "interview"
    | "offered"
    | "hired"
    | "rejected";
  appliedDate: Date;
  notes?: string;
}

export interface PerformanceAppraisal {
  id?: number;
  employeeId: number;
  evaluatorId: number;
  date: Date;
  period: string; // e.g., 'Q1 2026'
  kpis: { name: string; score: number; maxScore: number; comments?: string }[];
  overallScore: number;
  comments?: string;
  bonusAmount?: number;
  status?: "draft" | "final";
}

export interface TrainingCourse {
  id?: number;
  title: string;
  description?: string;
  instructor?: string;
  startDate: Date;
  endDate: Date;
  status: "upcoming" | "ongoing" | "completed";
}

export interface TrainingEnrollment {
  id?: number;
  courseId: number;
  employeeId: number;
  enrollmentDate: Date;
  status: "enrolled" | "in_progress" | "completed" | "failed";
  progress: number; // 0-100
  notes?: string;
}

export interface Loan {
  id?: number;
  userId: number;
  amount: number;
  reason?: string;
  installmentMonths: number;
  monthlyDeduction: number;
  startDate: Date;
  status: "pending" | "approved" | "rejected" | "paid";
  paidAmount?: number;
  approvedBy?: number;
  createdAt: Date;
}

export interface RecipeItem {
  productId: number; // Raw material ID
  quantity: number;
  unit?: string;
}

export interface Recipe {
  id?: number;
  productId: number; // Finished good ID
  name: string; // Recipe name
  items: RecipeItem[];
  yieldQuantity: number; // How much finished good is produced
  estimatedCost?: number;
  instructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkOrder {
  id?: number;
  workOrderNumber: string;
  recipeId: number; // The BOM to use
  productId: number; // The finished good
  plannedQuantity: number; // Total finished goods quantity planned
  actualQuantity?: number; // Actual produced quantity
  status: "planned" | "in-progress" | "completed" | "cancelled";
  startDate: Date;
  endDate?: Date;
  assignedTo?: number; // User ID
  notes?: string;
  cost?: number; // Total cost of production
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseRequestItem {
  productId: number;
  quantity: number;
  notes?: string;
}

export interface PurchaseRequest {
  id?: number;
  requestNumber: string;
  date: Date;
  requestedBy: number; // User ID
  department?: string;
  items: PurchaseRequestItem[];
  status: "pending" | "approved" | "rejected" | "ordered" | "in_workflow";
  approvalStepIndex?: number; // Current workflow step
  activeWorkflowId?: number; // The workflow being followed
  approvalHistory?: {
    stepName: string;
    approverId: number;
    action: "approved" | "rejected";
    date: string;
    notes?: string;
  }[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RFQItem {
  productId: number;
  quantity: number;
  quotedPrice?: number;
  notes?: string;
}

export interface RFQ {
  id?: number;
  rfqNumber: string;
  date: Date;
  dueDate: Date;
  supplierId: number;
  items: RFQItem[];
  status: "draft" | "sent" | "received" | "accepted" | "rejected";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PLMProject {
  id?: number;
  name: string;
  description?: string;
  status:
    | "concept"
    | "design"
    | "prototyping"
    | "testing"
    | "production"
    | "retired";
  startDate: Date;
  targetLaunchDate?: Date;
  managerId?: number;
  budget?: number;
  documents?: { name: string; url: string; type: string }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FeasibilityStudy {
  id?: number;
  projectId?: number; // Optional link to a project
  title: string;
  description?: string;
  expectedCost: number;
  expectedRevenue: number;
  roi?: number; // Return on investment percentage
  paybackPeriod?: number; // in months
  status: "draft" | "under_review" | "approved" | "rejected";
  riskLevel: "low" | "medium" | "high";
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface Project {
  id?: number;
  name: string;
  customerId?: number;
  startDate: Date;
  endDate?: Date;
  budget?: number;
  actualCost?: number;
  progress?: number;
  status: "planning" | "active" | "on-hold" | "completed";
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Timesheet {
  id?: number;
  userId: number;
  projectId: number;
  date: string;
  hours: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id?: number;
  projectId: number;
  title: string;
  description?: string;
  assignedTo?: number;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Currency {
  id?: number;
  code: string;
  name: string;
  exchangeRate: number; // e.g., 50 (1 USD = 50 Base Currency)
  isBaseCurrency?: boolean;
  lastUpdated: Date;
}

export interface ModifierOption {
  name: string;
  price: number;
}

export interface ProductModifier {
  name: string;
  required: boolean;
  multiple: boolean;
  options: ModifierOption[];
}

export interface ProductUnit {
  name: string;
  conversionFactor: number;
  price: number;
  costPrice?: number;
  barcode?: string;
}

export interface ProductPriceTier {
  minQuantity: number;
  price: number;
}

export interface ProductBogoTier {
  buyQuantity: number;
  getQuantity: number;
}

export interface Product {
  id?: number;
  name: string;
  price: number; // Retail price
  wholesalePrice?: number; // Wholesale price

  // Advanced Pricing
  retailDiscount?: number;
  retailDiscountType?: "percentage" | "fixed";
  wholesaleDiscount?: number;
  wholesaleDiscountType?: "percentage" | "fixed";

  isService?: boolean;
  priceTiers?: ProductPriceTier[]; // Tiered pricing based on quantity
  bogoRules?: ProductBogoTier[]; // Buy N Get M Free

  category: string;
  brand?: string;
  image?: string; // Main Thumbnail
  images?: string[]; // Gallery
  parts?: string[]; // e.g., ['Jacket', 'Pants', 'Vest']
  stock: number;
  alertThreshold?: number;
  barcode?: string;
  costPrice?: number;
  averageCost?: number; // moving average cost of stock
  type?: "simple" | "composite" | "service";
  composition?: { productId: number; quantity: number }[];
  isFavorite?: number;
  variants?: { name: string; price: number }[];
  units?: ProductUnit[];
  trackSerial?: boolean;
  linkedCurrencyId?: number;
  foreignCost?: number;
  modifiers?: ProductModifier[]; // For Restaurant POS
  description?: string;
  ingredients?: string[];
  requiresPeriodicMaintenance?: boolean;
  maintenancePeriodDays?: number;
}

export interface PeriodicMaintenanceSchedule {
  id?: number;
  customerId: number;
  orderId?: number;
  productId: number;
  productSerial?: string;
  purchaseDate: Date;
  nextMaintenanceDate: Date;
  lastMaintenanceDate?: Date;
  maintenanceIntervalDays: number;
  status: "upcoming" | "due" | "overdue" | "completed";
  notes?: string;
  maintenanceType?: string; // e.g. "Oil Change", "Filter Replacement", "General Checkup"
  assignedTech?: string; // Name or ID of the technician assigned
  estimatedCost?: number; // Estimated cost of the maintenance
}

export interface ProductSerial {
  id?: number;
  productId: number;
  serialNumber: string;
  status: "available" | "sold" | "returned" | "damaged" | "under_maintenance";
  warehouseId: number;
  purchaseId?: number;
  orderId?: number;
  dateAdded: Date;
}

export interface Printer {
  id?: number;
  name: string;
  type: "usb" | "network" | "bluetooth" | "system";
  ipAddress?: string; // For network
  macAddress?: string; // For bluetooth
  paperWidth?: 58 | 80;
  isDefault?: boolean;
}

export interface Category {
  id?: number;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  defaultMargin?: number;
  targetPrinterId?: number;
  printerBuzzerType?: "long" | "short" | "none";
}

export interface PricingRule {
  id?: number;
  name: string;
  minCost: number;
  maxCost: number;
  marginPercentage: number;
  isActive: boolean;
}

export interface MeasurementUnit {
  id?: number;
  name: string; // e.g. "Box"
  symbol: string; // e.g. "BX"
  baseUnit: string; // e.g. "Piece"
  factor: number; // e.g. 12
  createdAt: Date;
}

export interface ProductPriceHistory {
  id?: number;
  productId: number;
  oldPrice: number;
  newPrice: number;
  oldCost: number;
  newCost: number;
  changeDate: Date;
  changedBy: string;
  reason?: string;
}

export interface CartItem extends Product {
  quantity: number;
  cartItemId?: string;
  itemDiscount?: number;
  itemNote?: string;
  variantName?: string;
  selectedUnit?: ProductUnit;
  selectedUnitName?: string;
  serials?: string[];
  costPrice?: number;
  originalPrice?: number;
  isManuallyPriced?: boolean;
  offerAppliedNote?: string;
  selectedModifiers?: {
    modifierName: string;
    optionName: string;
    price: number;
  }[];
  customerPriceInfo?: {
    price: number;
    unitName?: string;
    date: Date | string;
    orderId: number;
    orderTotal: number;
  };
}

export interface OrderItem {
  productId: number;
  name: string;
  price: number;
  costPrice?: number;
  quantity: number;
  total: number;
  discount?: number;
  note?: string;
  variantName?: string;
  unitName?: string;
  conversionFactor?: number;
  serials?: string[];
  selectedModifiers?: {
    modifierName: string;
    optionName: string;
    price: number;
  }[];
  refundQuantity?: number;
}

export type MaintenanceStatus =
  | "received"
  | "diagnosing"
  | "waiting_parts"
  | "repairing"
  | "ready"
  | "delivered"
  | "cancelled"
  | "waiting_approval"
  | "abandoned";

export interface MaintenancePart {
  productId?: number;
  name: string;
  quantity: number;
  price: number;
  cost?: number;
  serialNumber?: string;
  supplierId?: number;
  supplierName?: string;
  warrantyDays?: number;
}

export interface PreventiveMaintenance {
  id?: number;
  equipment: string;
  type: string;
  frequency: string;
  lastDate?: string;
  nextDate: string;
  status: "pending" | "completed" | "overdue";
  assignedTo?: string;
  estimatedCost?: number;
  notes?: string;
  checklist?: { id: string; task: string; completed: boolean }[];
}

export interface MaintenanceOrder {
  id?: number;
  date: Date;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerAltPhone?: string;
  deviceType: string;
  deviceBrand?: string;
  deviceModel: string;
  deviceSerial?: string;
  devicePassword?: string;
  maintenanceType?: string;
  specifications?: string;
  issueDescription: string;
  receptionistInspection?: string;
  deviceCondition?: string;
  deviceAttachments?: string;
  expectedCost: number;
  actualCost?: number;
  deposit: number;
  parts: MaintenancePart[];
  status: MaintenanceStatus;
  technicianName?: string;
  expectedDeliveryDate?: Date;
  deliveredDate?: Date;
  notes?: string;
  orderId?: number;
  shelfCode?: string;
  disposalStatus?: 'none' | 'scrap' | 'sold';
  disposalRevenue?: number;
  disposalNotes?: string;
  disposalDate?: string;
  isDeadOnArrival?: boolean;
  isExpress?: boolean;
  expressActionDetails?: string;
  preCheckChecklist?: {
    power?: 'ok' | 'fail' | 'not_tested';
    charging?: 'ok' | 'fail' | 'not_tested';
    camera?: 'ok' | 'fail' | 'not_tested';
    audio?: 'ok' | 'fail' | 'not_tested';
    wifi?: 'ok' | 'fail' | 'not_tested';
    fingerprint?: 'ok' | 'fail' | 'not_tested';
  };
}

export interface MaintenanceRma {
  id?: number;
  orderId?: number;
  partName: string;
  partSerial: string;
  defectDescription: string;
  supplierId?: number;
  supplierName?: string;
  cost?: number;
  dateCreated: string;
  status: 'waiting_supplier' | 'replaced' | 'refunded' | 'rejected';
  claimDocumentId?: string;
  notes?: string;
}

export interface MaintenanceOutsource {
  id?: number;
  orderId?: number;
  customerName: string;
  customerPhone: string;
  deviceBrand?: string;
  deviceModel: string;
  deviceSerial?: string;
  centerName: string;
  sentDate: string;
  expectedReturnDate?: string;
  externalCost: number;
  customerCharge: number;
  status: 'sent' | 'returned_repaired' | 'returned_unrepaired' | 'delivered';
  notes?: string;
  resolvedDate?: string;
}

export interface TemporaryPartIssue {
  id?: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  technicianName: string;
  status: 'under_test' | 'sold' | 'returned_used';
  conditionOnReturn?: string;
  issueDate: string;
  resolveDate?: string;
}

export interface InventoryReservation {
  id?: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  status: 'reserved' | 'completed' | 'cancelled';
  reservedAt: string;
  resolvedAt?: string;
}

export type OrderType =
  | "dine-in"
  | "takeaway"
  | "delivery"
  | "direct"
  | "receive"
  | "deliver"
  | "maintenance"
  | "reservation";

export interface CustomerFeedback {
  id?: number;
  orderId: number;
  date: Date;
  foodRating: number; // 1-5
  serviceRating: number; // 1-5
  cleanlinessRating: number; // 1-5
  comment?: string;
  waiterId?: number;
  waiterName?: string;
  tableNumber?: string;
}

export interface Order {
  id?: number;
  referenceNumber?: string;
  date: Date;
  branchId?: number; // Added for multi-branch handling
  completedAt?: Date;
  items: OrderItem[];
  subtotalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  serviceChargeAmount?: number; // Service charge for dine in
  totalAmount: number;
  tipAmount?: number;
  paymentMethod: "cash" | "card" | "credit" | "wallet" | "split";
  splitDetails?: { cash: number; card: number };
  status:
    | "completed"
    | "refunded"
    | "partial_refund"
    | "draft"
    | "cancelled"
    | "pending";
  fulfillmentStatus?:
    | "pending"
    | "preparing"
    | "ready"
    | "served"
    | "cancelled";
  customerId?: number;
  cashierName?: string;
  userId?: number; // Added to standardise who made the order
  warehouseId?: number;
  salespersonId?: number; // Salesperson tracking
  courierId?: number;
  courierSettled?: boolean;
  note?: string;
  orderType?: OrderType;
  tableNumber?: string;
  parentOrderId?: number;
  isReturn?: boolean;
  deliveryAddress?: string;
  deliveryPhone?: string;
  deliveryFee?: number;
  dueDate?: Date;
  deviceSerial?: string;
  issueDescription?: string;
  deviceAttachments?: string;
  loyaltyPointsUsed?: number;
  appliedPromotions?: Promotion[];
  paidAmount?: number;
  isReservation?: boolean;
  reservationDetails?: {
    depositAmount: number;
    remainingAmount: number;
    dueDate?: Date | string;
    deliveryStatus: "not_delivered" | "partially_delivered" | "fully_delivered";
    deliveredItems: { productId: number; quantity: number }[];
  };
}

export interface Quotation {
  id?: number;
  referenceNumber?: string;
  date: Date;
  expiryDate?: Date;
  customerName: string;
  customerId?: number;
  items: OrderItem[];
  subtotalAmount: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  status: "pending" | "accepted" | "rejected" | "converted";
  notes?: string;
  createdBy: string;
}

export interface DeliveryArea {
  id?: number;
  name: string;
  deliveryFee: number;
  isActive: boolean;
  notes?: string;
}

export interface Customer {
  id?: number;
  name: string;
  code?: string;
  phone: string;
  phone2?: string;
  email?: string;
  birthDate?: string;
  address?: string;
  notes?: string;
  companyName?: string;
  taxNumber?: string;
  totalSpent: number;
  balance?: number;
  walletBalance?: number;
  creditLimit?: number;
  loyaltyPoints?: number;
  tags?: string[];
  createdAt?: Date;
  measurements?: CustomerMeasurements;
  lastPurchasedPrices?: Record<
    number,
    {
      price: number;
      unitName?: string;
      date: Date | string;
      orderId: number;
      orderTotal: number;
    }
  >;
  nationalId?: string;
  documents?: string[];
  dues?: number;
  group?: string;
  status?: string;
  rating?: number; // 1-5 customer rating
  isBanned?: boolean;
  banReason?: string;
  allergies?: string[];
}

export interface CustomerMeasurements {
  length?: number; // الطول
  shoulder?: number; // الكتف
  sleeveLength?: number; // طول الكم
  sleeveWidth?: number; // وسع الكم
  neck?: number; // الرقبة
  chest?: number; // الصدر
  waist?: number; // الوسط/الخصر
  hips?: number; // الحوض/الأرداف
  bottomWidth?: number; // وسع أسفل
  cuff?: number; // الكبك / المعصم
  pantsLength?: number; // طول البنطلون
  pantsWaist?: number; // خصر البنطلون
  thigh?: number; // الفخذ
  knee?: number; // الركبة
  legOpening?: number; // وسع الرجل من أسفل
  notes?: string;
  lastUpdated?: Date;
}

export interface CustomerPayment {
  id?: number;
  customerId: number;
  amount: number;
  date: Date;
  type?: "debt_payment" | "wallet_deposit";
  note?: string;
  recordedBy?: string;
}

export interface LoyaltyTransaction {
  id?: number;
  customerId: number;
  date: Date;
  points: number; // Positive for earn/add, Negative for redeem/deduct
  type:
    | "earn"
    | "redeem"
    | "manual_add"
    | "manual_deduct"
    | "welcome"
    | "refund";
  orderId?: number;
  note?: string;
}

export type PromotionType = "percentage" | "fixed_amount" | "bogo" | "combo";
export type PromotionTarget =
  | "order"
  | "product"
  | "category"
  | "customer_tier"
  | "customer_segment"; // Support segments like VIP, Employee

export interface Promotion {
  id?: number;
  name: string;
  code?: string; // Optional promo code
  description?: string;
  type: PromotionType;
  value: number; // e.g., 20 for 20%, 10 for 10 currency. For BOGO, could be the discount percentage on the 'get' item (e.g., 100 for free)

  // BOGO specific
  buyQuantity?: number;
  getQuantity?: number;

  // Combo specific
  comboBuyProducts?: number[]; // Required product IDs in cart
  comboGetProducts?: number[]; // Discounted/free product IDs

  // Happy Hour specific
  startTime?: string; // "14:00"
  endTime?: string; // "18:00"
  daysOfWeek?: number[]; // 0 (Sun) to 6 (Sat)

  target: PromotionTarget;
  targetIds?: number[] | string[]; // Array of product IDs, category IDs, or tier IDs (or segments)

  minOrderValue?: number;

  startDate: Date;
  endDate?: Date;

  usageLimit?: number; // Total times this can be used
  usedCount: number;

  isActive: boolean;
  createdAt: Date;
}

export interface Supplier {
  id?: number;
  name: string;
  phone: string;
  contactPerson?: string;
  email?: string;
  address?: string;
  notes?: string;
  balance?: number;
  bankName?: string;
  bankAccount?: string;
  iban?: string;
  category?: string;
}

export interface Expense {
  id?: number;
  title: string;
  amount: number;
  category: string;
  date: Date;
  notes?: string;
  paymentMethod?: "cash" | "card" | "bank";
  attachment?: string;
  supplierId?: number;
  employeeId?: number;
  referenceNumber?: string;
  vendor?: string;
  taxAmount?: number;
  projectId?: number;
  status?: "pending" | "approved" | "rejected";
  approvedBy?: number;
}

export interface PurchaseItem {
  productId: number;
  name: string;
  costPrice: number;
  quantity: number;
  bonusQuantity?: number;
  total: number;
  expiryDate?: Date;
  serials?: string[];
}

export interface PurchaseOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  receivedQuantity?: number;
  costPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id?: number;
  date: Date;
  supplierId: number;
  supplierName: string;
  expectedDeliveryDate?: Date;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: "draft" | "sent" | "partially_received" | "received" | "cancelled";
  notes?: string;
  createdBy: string;
}

export interface Purchase {
  id?: number;
  supplierId: number;
  supplierName: string;
  date: Date;
  items: PurchaseItem[];
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  invoiceNumber?: string;
  notes?: string;
  attachment?: string;
}

export interface ProductBatch {
  id?: number;
  productId: number;
  productName: string;
  warehouseId: number;
  quantity: number;
  expiryDate?: Date;
  batchNumber?: string;
  receivedDate: Date;
  costPrice: number;
}

export interface StockAdjustment {
  id?: number;
  productId: number;
  productName: string;
  type: "increase" | "decrease";
  quantity: number;
  reason:
    | "damage"
    | "theft"
    | "correction"
    | "gift"
    | "wastage"
    | "shortage"
    | "wrong_entry"
    | "inventory_count"
    | "other"
    | string;
  date: Date;
  notes?: string;
  warehouseId?: number;
  warehouseName?: string;
}

export interface ShiftExpense {
  id: string;
  amount: number;
  description: string;
  timestamp: Date;
  isConfirmed: boolean;
  confirmedByUserId?: number;
  category?: string;
}

export interface Shift {
  id?: number;
  startTime: Date;
  branchId?: number; // Added for multi-branch handling
  endTime?: Date;
  startCash: number;
  cashSales: number;
  cardSales: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  status: "open" | "pending_confirmation" | "closed";
  notes?: string;
  confirmedAt?: Date;
  confirmedByUserId?: number;
  shiftExpenses?: ShiftExpense[];
  userId?: number;
  userName?: string;
}

export interface FinancialVoucher {
  id?: number;
  voucherNumber: string;
  type: "receipt" | "payment"; // قبض أو صرف
  amount: number;
  date: Date;
  description: string;
  category?: string;
  partyName?: string; // اسم المستلم / المسدد
  paymentMethod: "cash" | "card" | "bank" | "cheque";
  referenceNumber?: string;
  createdByUserId?: number;
  createdByName?: string;
  shiftId?: number;
}

export interface User {
  id?: number;
  name: string;
  pin: string;
  role: string;
  isActive: boolean;
  department?: string;
  branchId?: number; // Added for multi-branch handling
  permissions?: string[]; // Allowed paths
  canRefund?: boolean;
  phone?: string;
  email?: string;
  address?: string;
  idCardImage?: string;
  jobTitle?: string;
  bankAccount?: string;
  startDate?: Date;
  contractEndDate?: Date;
  notes?: string;
  baseSalary?: number;
  paymentMethod?: "cash" | "bank";
  managerId?: number;
  annualLeaveBalance?: number;
  usedLeaves?: number;
  workShiftId?: number;
  shiftStartTime?: string; // HH:mm format
  shiftEndTime?: string; // HH:mm format
}

export interface WorkShift {
  id?: number;
  name: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  gracePeriodMinutes: number;
  department?: string;
  daysOff: number[]; // Array of days of the week (0 = Sunday, 1 = Monday, etc.)
  isActive: boolean;
}

export interface RosterAssignment {
  id?: number;
  userId: number;
  date: string; // YYYY-MM-DD format
  workShiftId?: number;
  isDayOff?: boolean;
}

export interface Attendance {
  id?: number;
  userId: number;
  date: string; // YYYY-MM-DD format
  checkInTime?: string; // HH:mm format
  checkOutTime?: string; // HH:mm format
  photoIn?: string; // Base64 image
  photoOut?: string; // Base64 image
  status: "present" | "absent" | "late" | "excused";
  notes?: string;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
}

export interface HeldOrder {
  id?: number;
  date: Date;
  items: CartItem[];
  customerId?: number | null;
  note?: string;
  orderType?: string;
  tableId?: string | null;
}

export interface Branch {
  id?: number;
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  email?: string;
  manager?: string;
  taxNumber?: string;
  commercialRegister?: string;
  type?: "main" | "sub" | "warehouse" | "kiosk";
  workingHours?: string;
  status: "active" | "inactive";
  createdAt?: Date;
}

export interface Warehouse {
  id?: number;
  name: string;
  address?: string;
  isMain: boolean;
  branchId?: number;
}

export interface BranchTransferItem {
  productId: number;
  productName: string;
  quantity: number;
}

export interface BranchTransfer {
  id?: number;
  date: Date;
  sourceWarehouseId: number;
  destinationWarehouseId: number;
  items: BranchTransferItem[];
  status: "pending" | "in_transit" | "completed" | "cancelled";
  notes?: string;
  createdBy: string;
}

export interface InventoryCountItem {
  productId: number;
  productName: string;
  systemQuantity: number;
  actualQuantity: number | null;
  difference: number;
  costPrice?: number;
  adjustmentReason?:
    | "wastage"
    | "shortage"
    | "wrong_entry"
    | "inventory_count"
    | null;
  notes?: string;
}

export interface InventoryCountSession {
  id?: number;
  date: Date;
  countType?: "comprehensive" | "spot" | "cycle";
  warehouseId: number;
  status: "draft" | "in_progress" | "completed" | "cancelled";
  items: InventoryCountItem[];
  notes?: string;
  createdBy: string;
  completedAt?: Date;
  totalLoss?: number;
  totalGain?: number;
}

export interface InventoryItem {
  id?: number;
  warehouseId: number;
  productId: number;
  quantity: number;
}

export interface Table {
  id?: number;
  name: string;
  zone: string;
  seats?: number;
  status: "available" | "occupied" | "reserved" | "requesting_bill";
  reservedAt?: Date;
  completedAt?: Date;
  shape?: "circle" | "square" | "rectangle";
}

export interface FixedAsset {
  id?: number;
  name: string;
  cost: number;
  value: number; // Current Value
  salvageValue?: number;
  purchaseDate: Date;
  lifeInYears: number;
  accumulatedDepreciation?: number;
  note?: string;
  category?: string;
  serialNumber?: string;
  location?: string; // Room or Department
  custodianId?: number; // Employee entrusted with the asset
  status?: "active" | "needs_maintenance" | "under_maintenance" | "retired";
  usageCount?: number;
  maintenanceIntervalUses?: number; // E.g., maintain every 500 uses
  lastMaintenanceDate?: string;
}

export interface VoidItemLog {
  id?: number;
  orderId?: number; // Only if an order was already saved
  referenceNumber?: string;
  itemId: number;
  itemName: string;
  quantity: number;
  voidReason: string;
  voidedByUserId: number;
  voidedByUserName: string;
  approvedByManagerId?: number;
  approvedByManagerName?: string;
  date: Date;
  amount: number;
}

export interface SystemNotification {
  id?: number;
  title: string;
  message: string;
  type: "warning" | "error" | "info" | "success";
  date: Date;
  isRead: boolean;
  link?: string;
}

export interface SchoolContract {
  id?: number;
  studentId: number;
  guardianId: number;
  type: string;
  signedDate?: string;
  fileUrl?: string; // Base64 PDF or image
  status: "signed" | "unsigned" | "expired";
  notes?: string;
}

export type LogType =
  | "sale"
  | "refund"
  | "purchase"
  | "payment"
  | "expense"
  | "adjustment"
  | "shift"
  | "customer"
  | "user"
  | "system"
  | "security"
  | "performance"
  | "network"
  | "rental"
  | "tailoring"
  | "students"
  | "studentSubscriptions"
  | "studentPayments"
  | "studentEvaluations"
  | "schoolFees"
  | "other";

// --- Tailoring Types ---
export type TailoringStatus =
  | "fabric_selection"
  | "cutting"
  | "first_fitting"
  | "finishing"
  | "ready_for_delivery"
  | "delivered"
  | "cancelled";

export interface TailoringOrder {
  id?: number;
  customerId: number;
  customerName: string;
  orderDate: Date;
  deliveryDate: Date;
  status: TailoringStatus;
  fabricType?: string;
  fabricSource?: "customer" | "store";
  measurements?: CustomerMeasurements; // Snapshotted measurements
  designNotes?: string;
  price: number;
  deposit: number;
  assignedTailorId?: number;
  fittings?: FittingAppointment[];
}

export type FittingStatus = "scheduled" | "completed" | "cancelled";

export interface FittingAppointment {
  id?: number;
  tailoringOrderId?: number;
  customerId: number;
  customerName: string;
  date: Date;
  notes?: string;
  status: FittingStatus;
}
export type LogStatus = "success" | "warning" | "error";

export interface ApiKey {
  id?: number;
  name: string;
  keyPart: string;
  keyFullHash?: string; // Storing hash instead of full key
  createdAt: Date;
  expiresAt?: Date;
  lastUsed?: Date;
  status: "active" | "revoked";
}

export interface UserSession {
  id?: number;
  userId: number;
  userName: string;
  loginTime: Date;
  logoutTime?: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  status: "active" | "expired" | "revoked";
  deviceType?: "Desktop" | "Mobile" | "Tablet";
}

export interface LogEntry {
  id?: number;
  type: LogType;
  action: string;
  details?: string;
  amount?: number;
  user: string;
  date: Date;
  referenceId?: number;
  status: LogStatus;
  ipAddress?: string;
  module?: string;
  oldValue?: any;
  newValue?: any;
}

export interface SavedSticker {
  id?: number;
  title: string;
  data: {
    model: string;
    cpu: string;
    ram: string;
    ssd: string;
    hdd: string;
    gpuIntegrated: string;
    gpuDiscrete: string;
    os: string;
    battery: string;
    price: string;
    originalPrice: string;
  };
  config: {
    width: number;
    height: number;
    unit: string;
    fontScale: number;
    designType: "modern" | "minimal" | "technical" | "geometric";
    borderRadius: number;
    borderWidth: number;
  };
  updatedAt: Date;
}

// --- Accounting Types ---
export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

export interface Account {
  id?: number;
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  balance?: number;
  isSystem?: boolean;
}

export interface CostCenter {
  id?: number;
  name: string;
  code: string;
  description?: string;
  budget?: number;
}

export interface JournalEntryLine {
  accountId: number;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
  costCenterId?: number;
}

export interface JournalEntry {
  id?: number;
  date: Date;
  reference?: string;
  description: string;
  lines: JournalEntryLine[];
  totalAmount: number;
  status: "posted" | "draft";
  createdBy?: string;
}

export interface BankCheck {
  id?: number;
  number: string;
  amount: number;
  bankName: string;
  issueDate: Date;
  dueDate: Date;
  type: "receivable" | "payable";
  status: "pending" | "deposited" | "cleared" | "bounced" | "returned";
  payeeName: string;
  payeeId?: number;
  notes?: string;
  image?: string;
}

export interface FiscalYear {
  id?: number;
  name: string;
  startDate: Date;
  endDate: Date;
  status: "open" | "closed";
  closedAt?: Date;
}

export interface BankReconciliation {
  id?: number;
  accountId: number;
  statementDate: Date;
  statementBalance: number;
  reconciledEntryIds: number[];
  status: "draft" | "finalized";
  createdAt: Date;
}

export interface PettyCashExpense {
  id: string;
  date: Date;
  amount: number;
  description: string;
  receiptImage?: string;
  accountId?: number; // Added for journal entry integration
}

export interface PettyCash {
  id?: number;
  employeeName: string;
  amount: number;
  date: Date;
  description: string;
  status: "active" | "closed";
  expenses: PettyCashExpense[];
  closedAt?: Date;
  sourceAccountId?: number; // Added for journal entry integration
  pettyCashAccountId?: number; // Added for journal entry integration
}

export interface BudgetLine {
  accountId: number;
  costCenterId?: number;
  amount: number;
}

export interface Budget {
  id?: number;
  name: string;
  fiscalYearId: number;
  lines: BudgetLine[];
  status: "draft" | "active" | "closed";
  createdAt: Date;
  updatedAt?: Date;
}

// --- Studio Types ---
export interface Camera {
  id?: number;
  name: string;
  model?: string;
  serialNumber?: string;
  hourlyRate?: number;
  dailyRate?: number;
  sessionRate?: number;
  photoRate?: number;
  status: "active" | "maintenance" | "retired";
}

export type ShiftType = "full" | "morning" | "night";
export type VenueType = "home" | "hall" | "outdoor" | "studio" | "other";
export type PricingType = "hourly" | "daily" | "session" | "photo";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface StudioBooking {
  id?: number;
  cameraId: number;
  cameraName?: string;
  date: string;
  shift: ShiftType;
  status: BookingStatus;
  pricingType: PricingType;
  quantity: number;
  unitPrice: number;
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  technicianName?: string;
  city?: string;
  venueType?: VenueType;
  address?: string;
  price: number;
  deposit: number;
  remaining: number;
  isPaid: boolean;
  notes?: string;
  createdAt: Date;
  shootingDuration?: number; // Duration in hours
  startTime?: string; // Time in HH:mm
}

// --- Rental Types (Clothing/Wedding) ---
export type RentalStatus =
  | "reserved"
  | "active"
  | "in_laundry"
  | "returned"
  | "late"
  | "cancelled";

export interface Rental {
  id?: number;
  customerId: number;
  customerName: string;
  customerPhone?: string;

  // Identity Verification
  customerIDFront?: string;
  customerIDBack?: string;

  productId: number;
  productName: string;
  productImage?: string;
  bookingDate: Date; // Date of reservation
  pickupDate: Date; // Scheduled pickup
  returnDate: Date; // Scheduled return
  actualReturnDate?: Date;
  status: RentalStatus;
  price: number;
  deposit: number; // Insurance amount
  isDepositReturned: boolean;
  lateFee?: number;
  damageFee?: number;
  notes?: string; // Alterations, measurements, etc.
  size?: string;
  returnedParts?: string[];
}

// --- Installment Types ---
export interface InstallmentPlan {
  id?: number;
  customerId: number;
  orderId?: number;
  principalAmount: number; // Original amount before interest
  totalAmount: number; // Principal + Interest - DownPayment
  downPayment: number;
  remainingAmount: number;
  installmentCount: number;
  installmentAmount: number;
  startDate: Date;
  status: "active" | "completed" | "defaulted";
  notes?: string;
  createdAt: Date;

  // Interest Settings
  interestType: "none" | "fixed" | "declining";
  interestRate: number; // Annual percentage
  totalInterestAmount: number;

  // Late Fee Settings
  lateFeeEnabled: boolean;
  lateFeeType: "fixed" | "percentage";
  lateFeeAmount: number;
  gracePeriodDays: number;
}

export interface InstallmentPayment {
  id?: number;
  planId: number;
  customerId: number;
  amount: number;
  principalPart: number;
  interestPart: number;
  dueDate: Date;
  paidDate?: Date;
  status: "pending" | "paid" | "overdue";
  lateFeeApplied?: number;
  notes?: string;
}

export interface SalesTarget {
  id?: number;
  employeeId: number;
  targetAmount: number;
  achievedAmount: number;
  commissionRate: number;
  period: string;
  notes?: string;
}

export interface B2BInvoicePayment {
  id: string;
  amount: number;
  date: Date;
  method: "cash" | "card" | "transfer" | "check";
  notes?: string;
}

export interface B2BInvoice {
  id?: number;
  referenceNumber?: string;
  customerId: number;
  totalAmount: number;
  paidAmount: number;
  dueDate: Date;
  status: "paid" | "partial" | "unpaid";
  items: any[];
  notes?: string;
  payments?: B2BInvoicePayment[];
  createdAt: Date;
}

export interface GiftCard {
  id?: number;
  code: string;
  initialBalance: number;
  currentBalance: number;
  expiryDate: Date;
  status: "active" | "used" | "expired";
}

export interface Subscription {
  id?: number;
  customerId: number;
  planName: string;
  amount: number;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: Date;
  status: "active" | "cancelled" | "past_due";
}

export interface EcommerceOrder {
  id?: number;
  platform: "salla" | "zid" | "shopify" | "woocommerce";
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  shippingAddress?: string;
  items?: { name: string; quantity: number; price: number; sku?: string }[];
  total: number;
  subtotal?: number;
  tax?: number;
  shippingFee?: number;
  paymentMethod?: string;
  shippingMethod?: string;
  notes?: string;
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  createdAt: Date;
}

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";

export interface Ticket {
  id?: number;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  customerId?: number;
  assignedTo?: number; // userId
  createdBy: number; // userId
  createdAt: Date;
  updatedAt: Date;
  slaDueDate?: Date; // Auto-generated based on priority
  resolvedAt?: Date;
  closedAt?: Date; // Recorded when auto-closed
}

export interface TicketComment {
  id?: number;
  ticketId: number;
  userId: number;
  content: string;
  createdAt: Date;
  isInternal: boolean;
}

export interface Campaign {
  id?: number;
  name: string;
  type: "email" | "sms" | "social" | "other";
  status: "draft" | "active" | "completed" | "cancelled";
  startDate: Date;
  endDate: Date;
  budget: number;
  spent: number;
  targetAudience?: string;
  expectedROI?: number;
  actualROI?: number;
  createdAt: Date;
}

export interface QualityCheck {
  id?: number;
  referenceId: number; // WorkOrderId or PurchaseOrderId
  referenceType: "work_order" | "purchase_order";
  date: Date;
  inspectorId: number;
  status: "passed" | "failed" | "pending";
  notes?: string;
  criteria: { name: string; passed: boolean; notes?: string }[];
}

export interface ProductionPlan {
  id?: number;
  workOrderId: number;
  startDate: Date;
  endDate: Date;
  status: "scheduled" | "in_progress" | "completed" | "delayed";
  assignedMachineId?: number;
  notes?: string;
}

export interface VanSalesRoute {
  id?: number;
  employeeId: number;
  vehicleId?: number;
  routeName: string;
  date: string;
  status: "planned" | "in_progress" | "completed";
  stops: number[];
}

export interface Vehicle {
  id?: number;
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  type: "car" | "van" | "truck" | "motorcycle";
  status: "active" | "maintenance" | "inactive";
  assignedDriverId?: number;
  licenseExpiry: Date;
  insuranceExpiry: Date;
  currentMileage: number;
  notes?: string;
  inventory?: { productId: number; quantity: number }[];
}

export interface MaintenanceRecord {
  id?: number;
  vehicleId: number;
  date: Date;
  type: "routine" | "repair" | "inspection";
  description: string;
  cost: number;
  mileage: number;
  provider: string;
  nextDueDate?: Date;
  nextDueMileage?: number;
  status: "scheduled" | "completed" | "cancelled";
}

export interface FuelRecord {
  id?: number;
  vehicleId: number;
  driverId: number;
  date: Date;
  amount: number; // in Liters/Gallons
  cost: number;
  mileage: number;
  receiptUrl?: string;
  notes?: string;
}

export interface Contract {
  id?: number;
  title: string;
  type: "supplier" | "customer" | "employee" | "other";
  partyId?: number; // ID of the supplier, customer, or employee
  partyName: string;
  startDate: Date;
  endDate: Date;
  status: "active" | "expired" | "terminated" | "pending";
  value?: number;
  documentUrl?: string;
  notes?: string;
  clauses?: { title: string; content: string }[];
}

export interface LegalDocument {
  id?: number;
  title: string;
  type:
    | "id_card"
    | "commercial_register"
    | "tax_card"
    | "contract"
    | "license"
    | "insurance"
    | "other";
  entityType: "customer" | "supplier" | "employee" | "company";
  entityId?: number;
  entityName: string;
  uploadDate: Date;
  expiryDate?: Date;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  fileData?: string;
  notes?: string;
}

export interface LegalOpponent {
  id?: number;
  name: string;
  type: string;
  idNumber?: string;
  contact?: string;
  notes?: string;
}

export interface LawCase {
  id?: number;
  caseNumber: string;
  title: string;
  clientId: number;
  courtName: string;
  opponentName?: string;
  opponentLawyer?: string;
  status: "active" | "suspended" | "closed" | "won" | "lost";
  openedAt: string;
  closedAt?: string;
  lawyerId?: number;
  notes?: string;
  totalFees?: number;
  paidAmount?: number;
}

export interface CourtSession {
  id?: number;
  caseId: number;
  sessionDate: string;
  sessionTime?: string;
  courtName: string;
  decision?: string;
  requirements?: string;
  status: "upcoming" | "completed" | "postponed" | "cancelled";
  notes?: string;
}

export interface PowerOfAttorney {
  id?: number;
  poaNumber: string;
  clientId: number;
  caseId?: number;
  type: "general" | "special";
  description?: string;
  issueDate: string;
  expiryDate?: string;
  status: "active" | "expired" | "revoked";
  notes?: string;
  fileUrl?: string;
}

export interface LegalConsultation {
  id?: number;
  clientId?: number;
  clientNameStr?: string; // For unregistered clients
  topic: string;
  isConfidential?: boolean;
  type: "in-person" | "phone" | "online" | "written";
  consultationDate: string;
  fees?: number;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  recommendations?: string;
}

export interface Judgment {
  id?: number;
  caseId: number;
  judgmentDate: string;
  appealDeadline?: string;
  courtName: string;
  judgmentText: string;
  status: "pending_execution" | "executed" | "appealed";
  executionDate?: string;
  notes?: string;
}

export interface WorkCenter {
  id?: number;
  name: string;
  code: string;
  workingHours: number;
  hourlyCost: number;
  notes?: string;
}

export interface Role {
  id?: number;
  name: string;
  description?: string;
  permissions: string[];
  isSystem?: boolean;
}

export interface OnboardingTask {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  isRequired?: boolean;
  dayOffset?: number;
}

export interface OnboardingProgram {
  id?: number;
  title: string;
  description?: string;
  role?: string;
  employeeId: number;
  status: "pending" | "in_progress" | "completed";
  tasks: OnboardingTask[];
  startDate: Date;
  completedAt?: Date;
}

export interface EmployeeBenefit {
  id?: number;
  name: string;
  description?: string;
  type: "health_insurance" | "allowance" | "other" | "health";
  monthlyCost: number;
  costToCompany?: number;
  costToEmployee?: number;
  eligibilityRules?: string;
  employeeIds: number[];
}

export interface DisciplinaryAction {
  id?: number;
  employeeId: number;
  employeeName: string;
  type:
    | "verbal_warning"
    | "written_warning"
    | "warning"
    | "deduction"
    | "suspension"
    | "termination";
  date: string;
  reason: string;
  actionTaken?: string;
  status:
    | "pending"
    | "active"
    | "resolved"
    | "applied"
    | "appealed"
    | "cancelled";
  notes?: string;
}

export interface InternalMessage {
  id?: number;
  senderId: number;
  receiverId?: number; // Optional if it's a group or channel message
  channelId?: string; // For group chats
  content: string;
  timestamp: Date;
  isRead: boolean;
  attachmentUrl?: string;
  attachmentType?: "image" | "document" | "video" | "audio";
  attachmentName?: string;
  encryptedKey?: string; // For e2e simulation or simple securing
}

export interface ApprovalWorkflow {
  id?: number;
  name: string;
  type: string;
  description?: string;
  steps: string[];
  conditions?: {
    field: string;
    operator: string;
    value: string;
  }[];
  status: "active" | "inactive";
}

export interface RichDocument {
  id?: number;
  title: string;
  content: string; // HTML content
  createdAt: Date;
  updatedAt: Date;
  status: "draft" | "final";
}

export interface Document {
  id?: number;
  name: string;
  category: string;
  type: string;
  size: string;
  date: string;
  url?: string;
  fileData?: string;
  uploadedBy?: string;
  description?: string;
  version?: number;
  isArchived?: boolean;
  folderId?: string;
  permissions?: { roles: string[]; users: number[] };
  originalFileName?: string;
  digitalSignature?: { signedBy: number; timestamp: Date; hash: string }[];
}

export interface ShipmentItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number; // FOB price
  totalPrice: number;
}

export interface Container {
  containerNumber: string;
  type: "20ft" | "40ft" | "40ft HC" | "LCL";
  sealNumber?: string;
  weight?: number;
}

export interface Shipment {
  id?: number;
  shipmentNumber: string; // e.g., SHP-2026-001
  supplierId: number;
  supplierName: string;
  billOfLading: string; // بوليصة الشحن
  originPort: string;
  destinationPort: string;
  departureDate?: Date;
  expectedArrivalDate?: Date;
  actualArrivalDate?: Date;
  status:
    | "pending"
    | "in_transit"
    | "arrived"
    | "customs"
    | "cleared"
    | "delivered";
  containers: Container[];
  items: ShipmentItem[];

  // Logistics & Import configuration
  incoterm?: string;
  currency?: string;
  exchangeRate?: number;

  // Costs for Landed Cost Calculation (in local currency after conversion)
  goodsValueForeign?: number; // Value in foreign currency
  goodsValue: number; // Total value of goods (local currency)
  shippingCost: number; // Freight cost
  insuranceCost: number;
  customsDuties: number;
  clearanceFees: number;
  otherCosts: number;
  totalLandedCost: number; // Calculated: goodsValue + shipping + insurance + customs + clearance + other

  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxReturn {
  id?: number;
  periodStart: string;
  periodEnd: string;
  filingDate: string;
  totalSalesNet: number;
  totalOutputTax: number;
  totalPurchasesNet: number;
  totalInputTax: number;
  netTaxPayable: number;
  status: "draft" | "filed" | "paid";
  referenceNumber?: string;
}

export interface EInvoice {
  id?: number;
  orderId: number;
  status: "pending" | "submitted" | "accepted" | "rejected";
  zatcaHash?: string;
  uuid?: string;
  date: string;
  amount: number;
  customerName: string;
}

export interface Commission {
  id?: number;
  employeeId: number;
  amount: number;
  date: string;
  status: "pending" | "paid";
  relatedOrderId?: number;
  notes?: string;
}

export interface AssetCustody {
  id?: number;
  employeeId: number;
  assetName: string;
  serialNumber: string;
  issueDate: string;
  returnDate?: string;
  status: "active" | "returned";
  condition: string;
}

export interface POSTerminal {
  id?: number;
  name: string;
  branchId: number;
  status: "online" | "offline" | "maintenance";
  lastSeen: string;
  ipAddress?: string;
  macAddress?: string;
  deviceType?: "desktop" | "tablet" | "mobile" | "kiosk";
  pairingCode?: string;
}

export interface TreasuryAccount {
  id?: number;
  name: string;
  type: "safe" | "bank" | "petty_cash" | "cashier" | "representative" | "other";
  balance?: number;
  branchId?: number;
  createdAt: string;
}

export interface TreasuryTransaction {
  id?: number;
  type: "inflow" | "outflow" | "transfer";
  amount: number;
  date: string;
  description: string;
  category:
    | "sales"
    | "expenses"
    | "loan"
    | "investment"
    | "operational"
    | "transfer"
    | "other";
  sourceAccountId?: number;
  destinationAccountId?: number;
  sourceAccount?: string; // Legacy support
  destinationAccount?: string; // Legacy support
  paymentMethod: "cash" | "bank_transfer" | "check" | "card";
  referenceNumber?: string;
  receiptNumber?: string;
  supplierId?: number;
  studentId?: number;
  employeeId?: number;
  status: "completed" | "pending" | "cancelled";
}

export interface DemandForecast {
  id?: number;
  productId: number;
  expectedDemand: number;
  confidenceScore: number;
  period: string;
  generatedAt: string;
}

export interface SupplierRating {
  id?: number;
  supplierId: number;
  qualityScore: number;
  deliveryScore: number;
  priceScore: number;
  overallScore: number;
  date: string;
  notes?: string;
}

export interface Event {
  id?: number;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  status: "planning" | "active" | "completed" | "cancelled";
  budget: number;
}

export interface JobPosting {
  id?: number;
  title: string;
  department: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "remote";
  status: "open" | "closed" | "draft";
  postedDate: string;
  requirements?: string;
}

export interface Property {
  id?: number;
  name: string;
  type: "building" | "villa" | "apartment" | "land" | "commercial";
  address: string;
  unitsCount: number;
  occupancyRate: number;
  status: "active" | "maintenance" | "inactive";
  rentalValue: number;
  manager?: string;
  notes?: string;
  createdAt: string;
}

export interface RiskRecord {
  id?: number;
  title: string;
  description: string;
  category:
    | "financial"
    | "operational"
    | "strategic"
    | "compliance"
    | "reputational";
  probability: "low" | "medium" | "high" | "critical";
  impact: "low" | "medium" | "high" | "critical";
  status: "identified" | "assessed" | "mitigated" | "closed";
  mitigationPlan?: string;
  owner?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ComplianceRecord {
  id?: number;
  title: string;
  description?: string;
  type: string;
  status: string;
  dueDate?: string;
  lastReviewedDate?: Date | string;
  nextReviewDate?: Date | string;
  responsibleOfficer?: string;
  reviewer?: string;
  notes?: string;
  createdAt: string | Date;
}

export interface CommodityContract {
  id?: number;
  customerId: number;
  productId: number;
  contractDate: number;
  expectedDeliveryDate?: number; // Added: Expected delivery time
  bookedQuantity: number;
  deliveredQuantity: number;
  bookingUnitPrice: number; // Price per unit locked at booking
  totalValue: number; // bookedQuantity * bookingUnitPrice
  amountPaid: number; // How much the customer paid in advance/installments
  paymentMethod?: string; // Added: Cash, Bank, etc.
  additionalFees?: number; // Added: Storage fees, administration fees
  status: "active" | "completed" | "cancelled";
  notes?: string;
}

export interface RecycleBinItem {
  id?: number;
  originalTable: string;
  originalId: string | number;
  data: any;
  deletedAt: number;
  summary: string;
}

export interface CommodityDelivery {
  id?: number;
  contractId: number;
  date: number;
  quantity: number;
  marketPriceAtDelivery: number; // Actual value of the item today
  driverName?: string;
  vehiclePlate?: string; // Logistics tracking
  deliveryCost?: number; // Nolon/Delivery fee
  deliveryMethod?: "pickup" | "fleet" | "external";
  deliveryLocation?: string;
  weighbridgeTicket?: string;
  qualityGrade?: string;
  handlingFees?: number;
  notes?: string;
}

export interface EmployeeSurvey {
  id?: number;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: "draft" | "active" | "completed";
  questions: {
    id: string;
    text: string;
    type: "rating" | "text" | "boolean";
  }[];
  createdAt: string;
}

export interface EmployeeSurveyResponse {
  id?: number;
  surveyId: number;
  employeeId?: number;
  answers: {
    questionId: string;
    value: string | number | boolean;
  }[];
  submittedAt: string;
}

export interface SuccessionPlan {
  id?: number;
  role: string;
  occupantId?: number;
  successors: {
    employeeId: number;
    readiness: number;
    flightRisk: number;
    notes?: string;
  }[];
  lastReviewed: string;
}

export interface LayawayItem {
  productId: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Layaway {
  id?: number;
  customerId: number;
  customerName: string;
  date: string;
  dueDate: string;
  items: LayawayItem[];
  totalValue: number;
  deposit: number;
  remainingAmount: number;
  payments: { amount: number; date: string }[];
  status: "active" | "completed" | "cancelled";
  notes?: string;
}

export interface ConsignmentItem {
  productId: number;
  name: string;
  quantity: number;
  soldQuantity: number;
  returnedQuantity: number;
  agreedPrice: number;
}

export interface Consignment {
  id?: number;
  type: "inward" | "outward"; // inward: from supplier, outward: to customer
  partyId: number;
  partyName: string;
  referenceNumber: string;
  date: string;
  status: "active" | "completed" | "cancelled";
  items: ConsignmentItem[];
  totalValue: number;
  notes?: string;
  createdAt?: string;
}

export interface Doctor {
  id?: number;
  name: string;
  specialization: string;
  phone: string;
  email?: string;
  workingHours: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  consultationFee: number;
}

export interface Appointment {
  id?: number;
  customerId: number;
  doctorId: number;
  branchId?: number;
  date: string;
  time: string;
  arrivalTime?: string | Date;
  status:
    | "scheduled"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show"
    | "checked_in"
    | "waiting_lab"
    | "needs_rescheduling";
  state?: string;
  type?: "new" | "consultation" | "operation" | "urgent";
  notes?: string;
  symptoms?: string;
  amount?: number;
  vitals?: any;
  actualStartTime?: string;
  actualEndTime?: string;
  consentFile?: string; // Base64 of signature or uploaded doc
}

export interface MedicalRecord {
  id?: number;
  customerId: number;
  doctorId: number;
  date: Date;
  diagnosis: string;
  prescription: string;
  attachments?: string[];
  medicalHistory?: string;
  labTests?: string;
  imaging?: string;
  icd10Code?: string;
  height?: number;
  weight?: number;
  bmi?: number;
  isArchived?: boolean;
  supersededByRecordId?: number;
  auditTrail?: {
    date: string;
    action?: string;
    previousDiagnosis?: string;
    previousPrescription?: string;
    updatedBy?: string;
    oldValue?: any;
    newValue?: any;
  }[];
  version?: number;
  drugWarningOverride?: any;
}

export interface AcademicYear {
  id?: number;
  name: string; // e.g. 2025/2026
  startDate: string;
  endDate: string;
  term1Start: string;
  term1End: string;
  term2Start: string;
  term2End: string;
  workingDays: string[]; // e.g. ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
  weekendDays: string[]; // e.g. ['Friday', 'Saturday']
  holidays: { date: string; name: string }[];
  isCurrent: boolean;
  isArchived: boolean;
}

export interface SchoolStudent {
  id?: number;
  code: string;
  name: string;
  englishName?: string;
  nationalId: string;
  birthDate: string;
  dateOfBirth?: string;
  dob?: string;
  joinDate: string;
  levelId: number;
  classroomId: number;
  gender: "ذكر" | "أنثى";
  nationality: string;
  religion: string;
  address: string;
  photoUrl?: string;
  status: "نشط" | "متوقف" | "منسحب" | "متخرج";
  branchId?: number; // Added for multi-branch handling
  notes?: string;
  guardianId?: number;
  parentPhone?: string;
  photographyAllowed?: boolean;
  publishingAllowed?: boolean;
  busSubscription?: string;
  allergies?: string;
  dietaryNotes?: string;
  parentsData?: {
    fatherName?: string;
    fatherPhone?: string;
    fatherQualification?: string;
    fatherJob?: string;
    motherName?: string;
    motherPhone?: string;
    motherQualification?: string;
    motherJob?: string;
  };
  medicalProfile?: {
    foodAllergies?: string;
    medicineAllergies?: string;
    chronicDiseases?: string;
    dailyMedications?: string;
    allowNurseryToGiveMeds?: boolean;
    doctorName?: string;
    doctorPhone?: string;
    preferredHospital?: string;
    extraEmergencyPhone?: string;
    bloodType?: string;
    dietaryNotes?: string;
    psychologicalOrBehavioralNotes?: string;
  };
  behavioralProfile?: {
    isShy?: boolean;
    criesALot?: boolean;
    isAggressive?: boolean;
    needsSpeechFollowUp?: boolean;
    needsMovementFollowUp?: boolean;
    difficultyIntegrating?: boolean;
    firstWeekNotes?: string;
    acclimatizationPlan?: string;
  };
  administrativeChecklist?: {
    bagDelivered?: boolean;
    uniformDelivered?: boolean;
    booksDelivered?: boolean;
    birthCertificateReceived?: boolean;
    guardianIdCopyReceived?: boolean;
    subscriptionContractSigned?: boolean;
    tripConsentSigned?: boolean;
    photographyConsentSigned?: boolean;
  };
}

export interface Guardian {
  id?: number;
  name: string;
  relation: string;
  primaryPhone: string;
  whatsappPhone?: string;
  whatsappPhone2?: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  jobTitle?: string;
  nationalId?: string;
  idCardPhotoUrl?: string;
  notes?: string;

  isPrimary?: boolean;
  isFinancialResponsible?: boolean;
  isPickupResponsible?: boolean;
  isAllowedToPickup?: boolean;
  isAllowedToSeeFinancials?: boolean;
  isAllowedToReceiveNotifications?: boolean;

  communicationStatus?: "active" | "no-reply" | "invalid-number";
  complaints?: {
    id?: string;
    date: string;
    title: string;
    notes: string;
    status: "pending" | "resolved";
  }[];
  meetings?: {
    id?: string;
    date: string;
    title: string;
    notes: string;
    status: "scheduled" | "completed" | "cancelled";
  }[];
  adminNotes?: string;
}

export interface AuthorizedPickup {
  id?: number;
  studentId: number;
  name: string;
  relation: string;
  phone: string;
  nationalId?: string;
  photoUrl?: string;
  idCardPhotoUrl?: string;
  isAllowed: boolean;
  notes?: string;
}

export interface EducationalLevel {
  id?: number;
  name: string;
  sortOrder: number;
  ageFrom: number;
  ageTo: number;
  isActive: boolean;
}

export interface Classroom {
  id?: number;
  name: string;
  levelId: number;
  maxCapacity: number;
  teacherId?: number;
  assistantId?: number;
  status: "متاح" | "ممتلئ" | "مغلق";
  notes?: string;
}

export interface SchoolFeeType {
  id?: number;
  name: string;
  type:
    | "monthly"
    | "quarterly"
    | "semi_annual"
    | "annual"
    | "registration"
    | "bus"
    | "uniform"
    | "books"
    | "meals"
    | "activities"
    | "trips"
    | "other";
  amount: number;
  levelId?: number;
  isRecurring: boolean;
  recurrencePeriod?: string;
  isActive: boolean;
}

export interface StudentSubscription {
  id?: number;
  studentId: number;
  feeTypeId: number;
  startDate: string;
  endDate: string;
  baseAmount: number;
  discount: number;
  discountReason?: string;
  totalRequired: number;
  totalPaid: number;
  remainingAmount: number;
  status: "paid" | "partial" | "late" | "cancelled";
}

export interface StudentPayment {
  id?: number;
  receiptNumber: string;
  studentId: number;
  guardianId?: number;
  subscriptionId?: number;
  amount: number;
  paymentMethod:
    | "cash"
    | "vodafone_cash"
    | "instapay"
    | "bank_transfer"
    | "visa"
    | "other";
  paymentDate: string;
  userId: number;
  notes?: string;
  attachmentUrl?: string;
}

export interface StudentAttendance {
  id?: number;
  studentId: number;
  date: string; // YYYY-MM-DD
  status: "present" | "absent" | "late" | "early_leave";
  absenceReason?: string;
  checkInTime?: string;
  checkOutTime?: string;
  pickedUpById?: number; // from AuthorizedPickup
  notes?: string;
}

export interface StudentEvaluation {
  id?: number;
  studentId: number;
  classroomId: number;
  monthOrWeek: string;
  skillName: string; // Arabic, English, Colors, etc.
  scoreOrColor: string;
  teacherNotes?: string;
  userId: number;
  date: string;
}

export interface HealthProfile {
  id?: number;
  studentId: number;
  bloodType?: string;
  allergies?: string;
  chronicDiseases?: string;
  forbiddenMedicines?: string;
  allowedMedicines?: string;
  foodRestrictions?: string;
  doctorName?: string;
  doctorPhone?: string;
  emergencyPhone?: string;
  notes?: string;
}

export interface HealthLog {
  id?: number;
  studentId: number;
  type: "incident" | "injury" | "fever" | "medicine_given" | "note";
  date: string;
  time: string;
  userId: number;
  isParentNotified: boolean;
  notes: string;
  attachmentUrl?: string;
}

export interface SchoolFee {
  id?: number;
  studentId: number;
  amount: number;
  description: string;
  date: string;
  status: "pending" | "paid";
  transactionId?: string;
  paymentMethod?: "cash" | "card" | "bank";
}

export interface TicketPaymentSplit {
  method: "cash" | "card" | "wallet" | "transfer";
  amount: number;
  reference?: string; // Gateway_Transaction_Ref
}

export interface TicketCargo {
  id?: number;
  parcelRef: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  tripId: number;
  weightKg: number;
  dimensions?: string;
  codAmount?: number;
  status: "received" | "in_transit" | "ready_for_pickup" | "delivered";
  price: number;
  insuranceFee?: number;
  totalAmount: number;
  createdAt: string;
  notes?: string;
}

export interface TicketBooking {
  id?: number;
  bookingRef: string;
  customerId?: number;
  customerName: string;
  customerPhone?: string;
  identityNumber?: string;
  isStudent?: boolean;
  transportType?: "bus" | "train" | "airplane" | "ship" | "limo";
  seatNumber?: string;
  tripId?: number; // Added reference
  vendorId?: number; // Related to external vendor/brokerage
  vendorName?: string;
  expectedCommission?: number;
  luggageWeight?: number; // Extra luggage weight
  luggageFee?: number; // Extra luggage fee
  checkInStatus?: "pending" | "boarded" | "did_not_attend" | "cancelled";
  destination: string;
  departureDate: string;
  departureTime?: string;
  ticketType: "standard" | "vip" | "student" | "child";
  passengers: number;
  pricePerTicket: number;
  discountAmount?: number;
  taxAmount?: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod?: "cash" | "card" | "wallet" | "transfer" | "split";
  paymentSplits?: TicketPaymentSplit[];
  status: "confirmed" | "pending" | "cancelled" | "refunded";
  refundAmount?: number;
  cancellationPenalty?: number;
  branchId?: number; // Added for agent breakdown
  createdBy?: string;
  ancillaryTotal?: number;
  selectedServices?: { id: string; name: string; price: number }[];
  expiresAt?: string; // For pending bookings
  cancellationFee?: number;
  refundedAmount?: number;
  refundMethod?: "cash" | "card" | "wallet" | "transfer";
  notes?: string;
  createdAt: string;
}

export interface TicketRefund {
  id?: number;
  refundId: string;
  originalBookingId: number;
  bookingRef: string;
  cancellationTime: string;
  deductedFees: number;
  refundedAmount: number;
  refundMethod: "cash" | "card" | "wallet" | "transfer";
  customerName: string;
  notes?: string;
}

export interface TicketSeatLock {
  id?: number;
  tripId: number;
  seatNumber: string;
  lockedAt: string;
  expiresAt: string;
  lockedByUserId?: number;
}

export interface TicketRoute {
  id?: number;
  source: string;
  destination: string;
  distance?: number;
  stops?: string;
}

export interface TicketTripSchedule {
  id?: number;
  departureDate?: string;
  tripCode: string;
  routeId: number;
  departureTime: string;
  expectedArrivalTime?: string;
  transportType: "bus" | "train" | "airplane" | "ship";
  transportDetails?: string;
  basePrice: number;
  recurringDays?: string; // JSON array of numbers e.g. [0, 1, 2] for Sun, Mon, Tue
  schedulePattern?: "daily" | "workdays" | "weekly" | "custom";
  driver1Id?: number;
  driver2Id?: number;
  vehicleId?: number;
  estimatedFuelCost?: number;
  isActive?: boolean;
}

export interface TicketVendor {
  id?: number;
  vendorCode?: string;
  name: string;
  phone: string;
  contactPerson?: string;
  transportType: "bus" | "train" | "airplane" | "ship" | "limo";
  commissionType: "percentage" | "fixed";
  commissionValue: number;
}

export interface TicketVendorRoute {
  id?: number;
  vendorId: number;
  routeName: string;
  officialPrice: number;
  dailySeatQuota: number;
}

export interface TicketSeasonPricing {
  id?: number;
  name: string;
  adjustmentType: "increase" | "decrease";
  adjustmentValue: number;
  isPercentage: boolean;
  startDate: string;
  endDate: string;
}

export interface TicketVehicle {
  id?: number;
  plateNumber: string;
  model: string;
  type: "bus" | "train" | "airplane" | "ship";
  capacity: number;
  status: "ready" | "maintenance" | "on_trip";
  layoutTemplateId?: number;
  odometer?: number;
  nextServiceOdometer?: number;
}

export interface TicketVehicleMaintenance {
  id?: number;
  vehicleId: number;
  date: string;
  odometer: number;
  type: "routine" | "breakdown" | "repair";
  description: string;
  replacedParts?: string;
  technicianName?: string;
  cost?: number;
}

export interface TicketSeatData {
  seatNumber: string;
  isSpace: boolean;
  seatType?: "standard" | "window" | "aisle" | "vip";
  extraFee?: number;
}

export interface TicketSeatingTemplate {
  id?: number;
  name: string;
  type: "bus" | "train" | "airplane" | "ship";
  rows: number;
  columns: number;
  layoutData?: string; // JSON representation of the seating grid, mapping row/col to SeatLayoutInfo
}

// Type aliases for backward compatibility
export type Settings = AppSettings;
export type Student = SchoolStudent;
export type Staff = User;
