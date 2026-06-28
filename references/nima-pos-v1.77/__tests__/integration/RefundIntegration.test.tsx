
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Refund Integration Tests', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
        
        await db.warehouses.add({ id: 1, name: 'Main', isMain: true });
        // Product A: Stock 10
        await db.products.add({ id: 1, name: 'Item A', price: 100, stock: 10, category: 'Test' } as any);
        await db.inventory.add({ warehouseId: 1, productId: 1, quantity: 10 });
    });

    test('Partial Refund restores specific item stock', async () => {
        // 1. Initial Sale (2 Items of A)
        await db.orders.add({
            id: 1,
            date: new Date(),
            items: [{ productId: 1, name: 'Item A', price: 100, quantity: 2, total: 200 }],
            subtotalAmount: 200,
            totalAmount: 200,
            paymentMethod: 'cash',
            status: 'completed'
        });
        
        // Manually adjust stock post-sale (simulator)
        await db.inventory.update(1, { quantity: 8 }); 
        await db.products.update(1, { stock: 8 });

        // 2. Perform Refund (Return 1 Item)
        const refundQty = 1;
        
        await (db as any).transaction('rw', db.orders, db.products, db.inventory, async () => {
            // Create Return Order
            await db.orders.add({
                date: new Date(),
                isReturn: true,
                parentOrderId: 1,
                items: [{ productId: 1, name: 'Item A', price: 100, quantity: -1, total: -100 }],
                subtotalAmount: -100,
                totalAmount: -100,
                paymentMethod: 'cash',
                status: 'completed'
            });

            // Restore Stock
            const inv = await db.inventory.where({ warehouseId: 1, productId: 1 }).first();
            await db.inventory.update(inv!.id!, { quantity: inv!.quantity + refundQty });
            
            const prod = await db.products.get(1);
            await db.products.update(1, { stock: prod!.stock + refundQty });
            
            // Update Original Order Status
            await db.orders.update(1, { status: 'partial_refund' });
        });

        // 3. Verify
        const finalInv = await db.inventory.where({ warehouseId: 1, productId: 1 }).first();
        const originalOrder = await db.orders.get(1);
        const returnOrder = await db.orders.where({ isReturn: true }).first();

        expect(finalInv?.quantity).toBe(9); // 8 + 1
        expect(originalOrder?.status).toBe('partial_refund');
        expect(returnOrder?.totalAmount).toBe(-100);
    });
});
