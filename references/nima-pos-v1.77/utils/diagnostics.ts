import { db } from '../db';

export interface DiagnosticResult {
    id: string;
    label: string;
    status: 'pass' | 'fail' | 'warning';
    message?: string;
}

export const runSystemDiagnostics = async (): Promise<DiagnosticResult[]> => {
    const results: DiagnosticResult[] = [];

    // --- 1. Database Connectivity & Core Config ---
    try {
        await (db as any).open();
        results.push({ id: 'db_conn', label: 'اتصال قاعدة البيانات (IndexedDB)', status: 'pass' });
    } catch (e) {
        return [{ id: 'db_conn', label: 'اتصال قاعدة البيانات', status: 'fail', message: 'تعذر الاتصال بقاعدة البيانات' }];
    }

    const settings = await db.settings.toCollection().first();
    if (settings) results.push({ id: 'config', label: 'ملف إعدادات النظام', status: 'pass' });
    else results.push({ id: 'config', label: 'ملف إعدادات النظام', status: 'fail', message: 'الإعدادات مفقودة' });

    const warehouses = await db.warehouses.toArray();
    if (warehouses.some(w => w.isMain)) results.push({ id: 'wh', label: 'تعريف المستودع الرئيسي', status: 'pass' });
    else results.push({ id: 'wh', label: 'تعريف المستودع الرئيسي', status: 'fail', message: 'لا يوجد مستودع رئيسي معرف' });

    // --- 2. Data Integrity - Inventory ---
    const products = await db.products.toArray();
    const inventory = await db.inventory.toArray();
    
    // Check 2a: Orphaned Stock (Inventory items for deleted products)
    let orphanedStock = 0;
    inventory.forEach(i => {
        if (!products.find(p => p.id === i.productId)) orphanedStock++;
    });

    if (orphanedStock === 0) {
        results.push({ id: 'inv_orphaned', label: 'سلامة روابط المخزون (Orphans)', status: 'pass' });
    } else {
        results.push({ id: 'inv_orphaned', label: 'سلامة روابط المخزون', status: 'warning', message: `وجد ${orphanedStock} سجلات مخزون لمنتجات محذوفة` });
    }

    // Check 2b: Negative Stock
    const negativeStockItems = inventory.filter(i => i.quantity < 0);
    if (negativeStockItems.length === 0) {
        results.push({ id: 'inv_negative', label: 'الرصيد السالب للمخزون', status: 'pass' });
    } else {
         results.push({ id: 'inv_negative', label: 'الرصيد السالب للمخزون', status: 'warning', message: `يوجد ${negativeStockItems.length} صنف برصيد سالب` });
    }

    // Check 2c: Sync between Global Product Stock and Warehouse Inventory sum
    let syncErrors = 0;
    const simpleProducts = products.filter(p => p.type === 'simple');
    simpleProducts.forEach(p => {
        const warehouseTotal = inventory.filter(i => i.productId === p.id).reduce((sum, i) => sum + i.quantity, 0);
        // Allow tiny floating point diff
        if (Math.abs(warehouseTotal - p.stock) > 0.001) syncErrors++;
    });

    if (syncErrors === 0) {
        results.push({ id: 'inv_sync', label: 'مزامنة المخزون (Global vs Warehouses)', status: 'pass' });
    } else {
        results.push({ id: 'inv_sync', label: 'مزامنة المخزون', status: 'fail', message: `يوجد ${syncErrors} منتج غير متطابق الكمية بين الملف والجدول` });
    }

    // --- 3. Customer & Order Integrity ---
    const orders = await db.orders.orderBy('id').reverse().limit(200).toArray(); // Check last 200 orders
    const customers = await db.customers.toArray();
    const customerIds = new Set(customers.map(c => c.id));
    let orphanedOrders = 0;
    
    orders.forEach(o => {
        if (o.customerId && !customerIds.has(o.customerId)) orphanedOrders++;
    });

    if (orphanedOrders === 0) {
        results.push({ id: 'cust_integrity', label: 'رابط العملاء بالفواتير', status: 'pass' });
    } else {
        results.push({ id: 'cust_integrity', label: 'رابط العملاء بالفواتير', status: 'warning', message: `وجد ${orphanedOrders} فاتورة لعملاء محذوفين` });
    }

    // --- 4. Financial Math Integrity ---
    let mathErrors = 0;
    orders.forEach(o => {
        if (o.status === 'refunded') return;
        
        let calculatedSubtotal = 0;
        o.items.forEach(item => {
            const expectedLine = (item.price * item.quantity) - (item.discount || 0);
            if (Math.abs(expectedLine - item.total) > 0.1) mathErrors++;
            calculatedSubtotal += expectedLine;
        });

        const expectedTotal = calculatedSubtotal - (o.discountAmount || 0) + (o.taxAmount || 0);
        if (Math.abs(expectedTotal - o.totalAmount) > 0.1) mathErrors++;
    });

    if (mathErrors === 0) {
        results.push({ id: 'fin_math', label: 'دقة حسابات الفواتير (آخر 200)', status: 'pass' });
    } else {
        results.push({ id: 'fin_math', label: 'دقة حسابات الفواتير', status: 'warning', message: `وجد ${mathErrors} تضارب في حسابات الفواتير` });
    }

    // --- 5. Accounting Ledger Balance (If enabled) ---
    if (settings?.enableAccounting) {
        const journals = await db.journalEntries.toArray();
        let unbalancedJournals = 0;
        journals.forEach(j => {
            const dr = j.lines.reduce((s, l) => s + l.debit, 0);
            const cr = j.lines.reduce((s, l) => s + l.credit, 0);
            if (Math.abs(dr - cr) > 0.01) unbalancedJournals++;
        });

        if (unbalancedJournals === 0) {
             results.push({ id: 'acc_balance', label: 'توازن قيود اليومية', status: 'pass' });
        } else {
             results.push({ id: 'acc_balance', label: 'توازن قيود اليومية', status: 'fail', message: `يوجد ${unbalancedJournals} قيد محاسبي غير متوازن` });
        }
    }

    // --- 6. Storage Usage ---
    if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        const usage = estimate.usage || 0;
        const quota = estimate.quota || 1;
        const percent = (usage / quota) * 100;
        
        if (percent > 90) {
            results.push({ id: 'storage', label: 'مساحة التخزين', status: 'warning', message: 'مساحة التخزين ممتلئة تقريباً' });
        } else {
            results.push({ id: 'storage', label: 'مساحة التخزين المتوفرة', status: 'pass' });
        }
    }

    return results;
};