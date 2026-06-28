
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

// Declare Jest globals
declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

// --- Mocks Setup ---

// 1. Mock Recharts
jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => <div className="recharts-mock">{children}</div>,
  };
});

// 2. Mock JsBarcode
jest.mock('jsbarcode', () => () => {});

// 3. Mock Data Entities
const mockSettings = {
    id: 1,
    storeName: 'Test Store',
    currency: 'IQD',
    language: 'ar',
    taxRate: 0,
    initialCapital: 1000,
    dbConfig: { activeProfileId: 'local', profiles: [], autoBackup: false }
};

const mockUser = {
    id: 1,
    name: 'Test Admin',
    pin: '1234',
    role: 'admin',
    isActive: true
};

const mockProduct = {
    id: 1,
    name: 'Laptop X',
    price: 1000,
    costPrice: 800,
    stock: 10,
    category: 'Electronics',
    type: 'simple',
    barcode: '123456'
};

const mockCategory = {
    id: 1,
    name: 'Electronics',
    color: '#000000',
    description: 'Tech stuff'
};

const mockOrder = {
    id: 101,
    date: new Date(),
    totalAmount: 1000,
    paymentMethod: 'cash',
    status: 'completed',
    items: [{ productId: 1, name: 'Laptop X', quantity: 1, total: 1000 }],
    fulfillmentStatus: 'pending', // Important for Kitchen tests
    tableNumber: 'T-01',
    orderType: 'dine-in'
};

const mockCustomer = {
    id: 1,
    name: 'John Doe',
    phone: '07700000000',
    totalSpent: 5000,
    balance: 0
};

const mockSupplier = {
    id: 1,
    name: 'Tech Supplier',
    phone: '07900000000',
    balance: 0
};

const mockExpense = {
    id: 1,
    title: 'Electricity',
    amount: 50,
    category: 'utilities',
    date: new Date()
};

const mockShift = {
    id: 1,
    startTime: new Date(),
    status: 'open',
    startCash: 100,
    cashSales: 0,
    expectedCash: 100
};

const mockTable = {
    id: 1,
    name: 'T-01',
    zone: 'indoor',
    status: 'available',
    seats: 4
};

const mockLog = {
    id: 1,
    action: 'Login',
    user: 'Test Admin',
    date: new Date(),
    type: 'system'
};

// 4. Mock Database Module (Comprehensive)
jest.mock('../db', () => ({
  db: {
    settings: { 
        toCollection: () => ({ first: () => mockSettings }), 
        put: jest.fn(), 
        update: jest.fn() 
    },
    users: { toArray: () => [mockUser], count: () => 1, add: jest.fn(), update: jest.fn(), delete: jest.fn() },
    products: { toArray: () => [mockProduct], add: jest.fn(), update: jest.fn(), delete: jest.fn(), get: () => mockProduct },
    categories: { toArray: () => [mockCategory], add: jest.fn(), update: jest.fn(), delete: jest.fn() },
    orders: { toArray: () => [mockOrder], add: jest.fn(), update: jest.fn() },
    customers: { toArray: () => [mockCustomer], add: jest.fn(), update: jest.fn(), get: () => mockCustomer },
    warehouses: { toArray: () => [{id: 1, name: 'Main', isMain: true}], count: () => 1, add: jest.fn(), delete: jest.fn() },
    inventory: { 
        where: () => ({ equals: () => ({ toArray: () => [{id: 1, productId: 1, quantity: 10, warehouseId: 1}], first: () => ({quantity: 10}) }) }),
        toArray: () => [{id: 1, productId: 1, quantity: 10, warehouseId: 1}]
    },
    expenses: { toArray: () => [mockExpense], add: jest.fn(), delete: jest.fn() },
    suppliers: { toArray: () => [mockSupplier], add: jest.fn(), update: jest.fn(), delete: jest.fn() },
    purchases: { toArray: () => [], add: jest.fn() },
    stockAdjustments: { toArray: () => [], add: jest.fn() },
    shifts: { toArray: () => [mockShift], add: jest.fn(), update: jest.fn() },
    logs: { toArray: () => [mockLog], add: jest.fn() },
    diningTables: { toArray: () => [mockTable], add: jest.fn(), update: jest.fn(), delete: jest.fn() },
    savedStickers: { toArray: () => Promise.resolve([]) },
    assets: { toArray: () => [] },
    heldOrders: { toArray: () => [] },
    attendance: { toArray: () => [], where: () => ({ equals: () => ({ toArray: () => [], first: () => null }) }) },
    customerPayments: { where: () => ({ equals: () => ({ reverse: () => ({ toArray: () => [] }) }) }) },
    branchTransfers: { toArray: () => [] },
    inventoryCountSessions: { toArray: () => [] },
    batches: { toArray: () => [] },
    productSerials: { toArray: () => [] },
    accounts: { toArray: () => [] },
    journalEntries: { toArray: () => [] },
    bankChecks: { toArray: () => [] },
    costCenters: { toArray: () => [] },
    fiscalYears: { toArray: () => [] },
    bankReconciliations: { toArray: () => [] },
    cameras: { toArray: () => [] },
    studioBookings: { toArray: () => [] },
    rentals: { toArray: () => [] },
    loyaltyTransactions: { toArray: () => [] },
    promotions: { toArray: () => [] },
    installmentPlans: { toArray: () => [] },
    installmentPayments: { toArray: () => [] },
    quotations: { toArray: () => [] },
    purchaseOrders: { toArray: () => [] },
    directoryHandles: { toArray: () => [] },
    transaction: (mode: any, tables: any, fn: any) => fn(),
  },
  getSqlSchema: () => ['CREATE TABLE MOCK ...'],
  seedLargeDataSet: jest.fn()
}));

// 5. Mock Dexie Hooks
jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => {
      try {
          return fn();
      } catch (e) {
          return undefined;
      }
  }
}));

// --- Page Imports ---
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import POS from '../pages/POS';
import Products from '../pages/Products';
import Categories from '../pages/Categories';
import Customers from '../pages/Customers';
import Orders from '../pages/Orders';
import Settings from '../pages/Settings';
import About from '../pages/About';
import Suppliers from '../pages/Suppliers';
import Purchases from '../pages/Purchases';
import Expenses from '../pages/Expenses';
import Warehouse from '../pages/Warehouse';
import UsersPage from '../pages/Users';
import Employees from '../pages/Employees';
import Attendance from '../pages/Attendance';
import Payroll from '../pages/Payroll';
import Shifts from '../pages/Shifts';
import Reports from '../pages/Reports';
import Kitchen from '../pages/restaurant/Kitchen';
import Fulfillment from '../pages/Fulfillment';
import Tables from '../pages/restaurant/Tables';
import StockAdjustments from '../pages/StockAdjustments';
import BarcodePrinter from '../pages/BarcodePrinter';
import StickerPrinting from '../pages/StickerPrinting';
import Logbook from '../pages/Logbook';
import Capital from '../pages/Capital';

import BranchTransfers from '../pages/BranchTransfers';
import Branches from '../pages/Branches';
import Delivery from '../pages/Delivery';
import Installments from '../pages/Installments';
import InventoryCount from '../pages/InventoryCount';
import Loyalty from '../pages/Loyalty';
import Maintenance from '../pages/Maintenance';
import NotFound from '../pages/NotFound';
import Promotions from '../pages/Promotions';
import PurchaseOrders from '../pages/PurchaseOrders';
import Quotations from '../pages/Quotations';
import Recipes from '../pages/Recipes';
import Rentals from '../pages/Rentals';
import Returns from '../pages/Returns';
import SetupWizard from '../pages/SetupWizard';
import StudioScheduler from '../pages/StudioScheduler';

describe('Application Pages Coverage', () => {
    
    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
        window.alert = jest.fn();
        window.print = jest.fn();
        window.open = jest.fn();
    });

    // --- Core Pages ---

    test('Login Page Renders', () => {
        render(<MemoryRouter><Login onLogin={jest.fn()} /></MemoryRouter>);
        expect(screen.getByText(/Test Admin/i)).toBeInTheDocument();
    });

    test('Dashboard Renders', () => {
        localStorage.setItem('nima_user', JSON.stringify(mockUser));
        render(<MemoryRouter><Dashboard /></MemoryRouter>);
        expect(screen.getByText(/مرحباً/i)).toBeInTheDocument();
    });

    test('POS Renders', () => {
        localStorage.setItem('nima_user', JSON.stringify(mockUser));
        render(<MemoryRouter><POS /></MemoryRouter>);
        expect(screen.getByText('Laptop X')).toBeInTheDocument();
    });

    // --- Inventory & Products ---

    test('Products Page Renders & Modal Opens', () => {
        render(<MemoryRouter><Products /></MemoryRouter>);
        expect(screen.getByText('Laptop X')).toBeInTheDocument();
        fireEvent.click(screen.getByText(/منتج جديد/i));
        expect(screen.getByPlaceholderText(/اسم المنتج/i)).toBeInTheDocument();
    });

    test('Categories Page Renders', () => {
        render(<MemoryRouter><Categories /></MemoryRouter>);
        expect(screen.getByText('تصنيفات المنتجات')).toBeInTheDocument();
        expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    test('Warehouse Page Renders & Transfer Logic', () => {
        render(<MemoryRouter><Warehouse /></MemoryRouter>);
        expect(screen.getByText('Main')).toBeInTheDocument();
        // Inventory list
        expect(screen.getAllByText('Laptop X').length).toBeGreaterThan(0);
        // Check for Add Warehouse Button
        expect(screen.getByTitle('إضافة مخزن')).toBeInTheDocument();
    });

    test('Stock Adjustments Page Renders', () => {
        render(<MemoryRouter><StockAdjustments /></MemoryRouter>);
        expect(screen.getByText('تسوية المخزون')).toBeInTheDocument();
        expect(screen.getByText('جلسة جرد جديدة')).toBeInTheDocument();
    });

    test('Barcode Printer Page Renders', () => {
        render(<MemoryRouter><BarcodePrinter /></MemoryRouter>);
        expect(screen.getByText('المنتجات')).toBeInTheDocument();
        expect(screen.getByText('القائمة (0)')).toBeInTheDocument();
    });

    test('Sticker Printing Page Renders', () => {
        render(<MemoryRouter><StickerPrinting /></MemoryRouter>);
        expect(screen.getByText('مصمم الملصقات')).toBeInTheDocument();
        expect(screen.getByText('بيانات الجهاز')).toBeInTheDocument();
    });

    // --- Commercial Operations ---

    test('Suppliers Page Renders & Add Modal', () => {
        render(<MemoryRouter><Suppliers /></MemoryRouter>);
        expect(screen.getByText('Tech Supplier')).toBeInTheDocument();
        // Find Add Button (it has a Plus icon)
        const buttons = screen.getAllByRole('button');
        const addButton = buttons.find(b => b.className.includes('bg-indigo-600'));
        if(addButton) fireEvent.click(addButton);
        expect(screen.getByText('مورد جديد')).toBeInTheDocument();
    });

    test('Purchases Page Renders', () => {
        render(<MemoryRouter><Purchases /></MemoryRouter>);
        expect(screen.getByText('إدارة المشتريات')).toBeInTheDocument();
        expect(screen.getByText('فاتورة شراء جديدة')).toBeInTheDocument();
    });

    test('Expenses Page Renders', () => {
        render(<MemoryRouter><Expenses /></MemoryRouter>);
        expect(screen.getByText('المصروفات والتكاليف')).toBeInTheDocument();
        expect(screen.getByText('Electricity')).toBeInTheDocument();
    });

    test('Orders (Sales History) Renders', () => {
        render(<MemoryRouter><Orders /></MemoryRouter>);
        expect(screen.getByText('سجل المبيعات')).toBeInTheDocument();
        expect(screen.getByText('#101')).toBeInTheDocument();
    });

    test('Customers Page Renders', () => {
        render(<MemoryRouter><Customers /></MemoryRouter>);
        expect(screen.getByText('قاعدة العملاء')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // --- HR & Admin ---

    test('Users Page Renders', () => {
        render(<MemoryRouter><UsersPage /></MemoryRouter>);
        expect(screen.getByText('إدارة الموظفين')).toBeInTheDocument();
        expect(screen.getByText('Test Admin')).toBeInTheDocument();
    });

    test('Employees Page Renders', () => {
        render(<MemoryRouter><Employees /></MemoryRouter>);
        expect(screen.getByText('ملفات الموظفين')).toBeInTheDocument();
        expect(screen.getByText('Test Admin')).toBeInTheDocument();
    });

    test('Attendance Page Renders', () => {
        render(<MemoryRouter><Attendance /></MemoryRouter>);
        expect(screen.getByText('الحضور والانصراف')).toBeInTheDocument();
        expect(screen.getByText('Test Admin')).toBeInTheDocument();
    });

    test('Payroll Page Renders', () => {
        render(<MemoryRouter><Payroll /></MemoryRouter>);
        expect(screen.getByText('الرواتب والأجور')).toBeInTheDocument();
        expect(screen.getByText('Test Admin')).toBeInTheDocument();
    });

    test('Shifts Page Renders', () => {
        render(<MemoryRouter><Shifts /></MemoryRouter>);
        expect(screen.getByText('إدارة الصندوق (الورديات)')).toBeInTheDocument();
        expect(screen.getByText('الوردية الحالية نشطة')).toBeInTheDocument();
    });

    test('Logbook Page Renders', () => {
        render(<MemoryRouter><Logbook /></MemoryRouter>);
        expect(screen.getByText('سجل العمليات (Logbook)')).toBeInTheDocument();
        expect(screen.getByText('Login')).toBeInTheDocument();
    });

    test('Reports Page Renders', () => {
        render(<MemoryRouter><Reports /></MemoryRouter>);
        expect(screen.getByText('التقارير والتحليلات')).toBeInTheDocument();
        expect(screen.getByText('المالية والمبيعات')).toBeInTheDocument();
    });

    test('Capital Page Renders', () => {
        render(<MemoryRouter><Capital /></MemoryRouter>);
        expect(screen.getByText('المركز المالي')).toBeInTheDocument();
        // Check input for capital
        expect(screen.getByDisplayValue('1000')).toBeInTheDocument();
    });

    test('Settings Page Renders', () => {
        render(<MemoryRouter><Settings /></MemoryRouter>);
        expect(screen.getByText('هوية المتجر')).toBeInTheDocument();
        expect(screen.getByText('Test Store')).toBeInTheDocument();
    });

    test('About Page Renders', () => {
        render(<MemoryRouter><About /></MemoryRouter>);
        expect(screen.getByText(/Nima POS Enterprise/i)).toBeInTheDocument();
    });

    // --- Restaurant Specific Pages ---

    test('Tables Page Renders', () => {
        render(<MemoryRouter><Tables /></MemoryRouter>);
        expect(screen.getByText('إدارة الطاولات')).toBeInTheDocument();
        expect(screen.getByText('T-01')).toBeInTheDocument();
    });

    test('Kitchen Display Renders', () => {
        render(<MemoryRouter><Kitchen /></MemoryRouter>);
        expect(screen.getByText('شاشة المطبخ')).toBeInTheDocument();
        // Check for pending order
        expect(screen.getByText('طلب #101')).toBeInTheDocument();
    });

    test('Fulfillment Page Renders', () => {
        render(<MemoryRouter><Fulfillment /></MemoryRouter>);
        // Looks for filter tabs
        expect(screen.getByText('سفري')).toBeInTheDocument();
        expect(screen.getByText('محلي')).toBeInTheDocument();
    });

    // --- Newly Added Pages ---

    test('BranchTransfers Page Renders', () => {
        render(<MemoryRouter><BranchTransfers /></MemoryRouter>);
        expect(screen.getByText('التحويلات بين الفروع')).toBeInTheDocument();
    });

    test('Branches Page Renders', () => {
        render(<MemoryRouter><Branches /></MemoryRouter>);
        expect(screen.getByText('إدارة الفروع')).toBeInTheDocument();
    });

    test('Delivery Page Renders', () => {
        render(<MemoryRouter><Delivery /></MemoryRouter>);
        expect(screen.getByText('إدارة التوصيل')).toBeInTheDocument();
    });

    test('Installments Page Renders', () => {
        render(<MemoryRouter><Installments /></MemoryRouter>);
        expect(screen.getByText('نظام التقسيط')).toBeInTheDocument();
    });

    test('InventoryCount Page Renders', () => {
        render(<MemoryRouter><InventoryCount /></MemoryRouter>);
        expect(screen.getByText('جرد المخزون')).toBeInTheDocument();
    });

    test('Loyalty Page Renders', () => {
        render(<MemoryRouter><Loyalty /></MemoryRouter>);
        expect(screen.getByText('نظام الولاء والمكافآت')).toBeInTheDocument();
    });

    test('Maintenance Page Renders', () => {
        render(<MemoryRouter><Maintenance /></MemoryRouter>);
        expect(screen.getByText('إدارة الصيانة')).toBeInTheDocument();
    });

    test('NotFound Page Renders', () => {
        render(<MemoryRouter><NotFound /></MemoryRouter>);
        expect(screen.getByText('الصفحة غير موجودة')).toBeInTheDocument();
    });

    test('Promotions Page Renders', () => {
        render(<MemoryRouter><Promotions /></MemoryRouter>);
        expect(screen.getByText('العروض والخصومات')).toBeInTheDocument();
    });

    test('PurchaseOrders Page Renders', () => {
        render(<MemoryRouter><PurchaseOrders /></MemoryRouter>);
        expect(screen.getByText('أوامر الشراء')).toBeInTheDocument();
    });

    test('Quotations Page Renders', () => {
        render(<MemoryRouter><Quotations /></MemoryRouter>);
        expect(screen.getByText('عروض الأسعار')).toBeInTheDocument();
    });

    test('Recipes Page Renders', () => {
        render(<MemoryRouter><Recipes /></MemoryRouter>);
        expect(screen.getByText('إدارة الوصفات (Recipes)')).toBeInTheDocument();
    });

    test('Rentals Page Renders', () => {
        render(<MemoryRouter><Rentals /></MemoryRouter>);
        expect(screen.getByText('إدارة التأجير')).toBeInTheDocument();
    });

    test('Returns Page Renders', () => {
        render(<MemoryRouter><Returns /></MemoryRouter>);
        expect(screen.getByText('المرتجعات')).toBeInTheDocument();
    });

    test('SetupWizard Page Renders', () => {
        render(<MemoryRouter><SetupWizard onComplete={jest.fn()} /></MemoryRouter>);
        expect(screen.getByText('مرحباً بك في Nima POS')).toBeInTheDocument();
    });

    test('StudioScheduler Page Renders', () => {
        render(<MemoryRouter><StudioScheduler /></MemoryRouter>);
        expect(screen.getByText('جدولة الاستوديو')).toBeInTheDocument();
    });

});
