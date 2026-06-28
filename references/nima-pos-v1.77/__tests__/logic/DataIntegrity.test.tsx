
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Data Integrity (Smart Auditor)', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
    });

    test('Detects Mathematical Error in Order Total', async () => {
        // 1. Insert Corrupt Data (Manual DB manipulation simulating a bug or data corruption)
        // Item total is 100, but Order total says 500
        await db.orders.add({
            date: new Date(),
            status: 'completed',
            totalAmount: 500, // <--- INCORRECT (Should be 100)
            subtotalAmount: 500,
            paymentMethod: 'cash',
            items: [
                { productId: 1, name: 'Item A', price: 100, quantity: 1, total: 100 }
            ]
        });

        // 2. Run Auditor Logic
        const orders = await db.orders.toArray();
        const anomalies: string[] = [];

        for (const order of orders) {
            let calculatedSubtotal = 0;
            for (const item of order.items) {
                // Expected Line Calc
                const expectedLine = item.price * item.quantity; 
                calculatedSubtotal += expectedLine;
            }
            
            // Allow small float margin
            if (Math.abs(calculatedSubtotal - order.totalAmount) > 0.05) {
                anomalies.push(`Order #${order.id}`);
            }
        }

        // 3. Verify detection
        expect(anomalies.length).toBe(1);
        expect(anomalies[0]).toContain('Order');
    });

    test('Detects Inventory Desynchronization', async () => {
        // 1. Setup Data
        const pId = await db.products.add({ name: 'Sync Test Item', stock: 50, price: 10, category: 'Test' } as any);
        
        // 2. Create Mismatch: Warehouse says 30, Product says 50
        await db.inventory.add({ warehouseId: 1, productId: pId as number, quantity: 30 }); 

        // 3. Run Auditor Logic
        const products = await db.products.toArray();
        const issues: string[] = [];

        for (const p of products) {
            const invRecords = await db.inventory.where('productId').equals(p.id!).toArray();
            const warehouseTotal = invRecords.reduce((sum, i) => sum + i.quantity, 0);

            if (warehouseTotal !== p.stock) {
                issues.push(`Product ${p.id}`);
            }
        }

        // 4. Verify detection
        expect(issues.length).toBe(1);
    });
});
