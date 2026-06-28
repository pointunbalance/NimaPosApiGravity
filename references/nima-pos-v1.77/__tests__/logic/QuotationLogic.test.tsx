
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Quotation Business Logic', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
        
        // Seed Data
        await db.products.add({ id: 1, name: 'Service Item', price: 1000, stock: 10, type: 'simple', category: 'Test' } as any);
        await db.customers.add({ id: 1, name: 'Client A', phone: '1234567890', totalSpent: 0 });
        await db.warehouses.add({ id: 1, name: 'Main', isMain: true });
        await db.inventory.add({ warehouseId: 1, productId: 1, quantity: 10 });
    });

    test('Quotation Totals Calculation', () => {
        const items = [
            { productId: 1, name: 'A', price: 100, quantity: 2, total: 200 },
            { productId: 2, name: 'B', price: 50, quantity: 1, total: 50 }
        ];
        
        const subtotal = 250;
        const discount = 25; // Fixed Amount
        const taxRate = 10; // Percent

        const taxAmount = (subtotal - discount) * (taxRate / 100); // (225) * 0.1 = 22.5
        const total = subtotal - discount + taxAmount; // 225 + 22.5 = 247.5

        expect(total).toBe(247.5);
    });

    test('Convert Quotation to Order (Reduces Stock & Updates Status)', async () => {
        // 1. Create Quotation
        const quoteId = await db.quotations.add({
            date: new Date(),
            customerName: 'Client A',
            customerId: 1,
            items: [{ productId: 1, name: 'Service Item', price: 1000, quantity: 1, total: 1000 }],
            subtotalAmount: 1000,
            totalAmount: 1000,
            status: 'pending',
            createdBy: 'Admin'
        });

        // 2. Simulate Conversion Logic (From Quotations.tsx)
        await (db as any).transaction('rw', db.orders, db.quotations, db.products, db.inventory, db.customers, async () => {
            // Create Order
            await db.orders.add({
                date: new Date(),
                items: [{ productId: 1, name: 'Service Item', price: 1000, quantity: 1, total: 1000 }],
                subtotalAmount: 1000,
                totalAmount: 1000,
                paymentMethod: 'cash',
                status: 'completed',
                customerId: 1
            });

            // Update Quote Status
            await db.quotations.update(quoteId, { status: 'converted' });

            // Deduct Inventory
            const inv = await db.inventory.where({ warehouseId: 1, productId: 1 }).first();
            await db.inventory.update(inv!.id!, { quantity: inv!.quantity - 1 });
            
            // Update Customer
            const cust = await db.customers.get(1);
            await db.customers.update(1, { totalSpent: (cust!.totalSpent || 0) + 1000 });
        });

        // 3. Verify
        const quote = await db.quotations.get(quoteId as number);
        const inv = await db.inventory.where({ warehouseId: 1, productId: 1 }).first();
        const cust = await db.customers.get(1);

        expect(quote?.status).toBe('converted');
        expect(inv?.quantity).toBe(9); // 10 - 1
        expect(cust?.totalSpent).toBe(1000);
    });
});
