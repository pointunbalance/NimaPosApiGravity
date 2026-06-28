
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Warehouse Inventory Valuation', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
        await db.warehouses.add({ id: 1, name: 'Main', isMain: true });
    });

    test('Calculates Total Cost and Retail Value correctly', async () => {
        // 1. Setup Products
        const p1 = await db.products.add({ name: 'Item A', price: 200, costPrice: 100, stock: 0, category: 'Test' } as any); // Margin 100
        const p2 = await db.products.add({ name: 'Item B', price: 50, costPrice: 30, stock: 0, category: 'Test' } as any);   // Margin 20

        // 2. Setup Inventory
        await db.inventory.bulkAdd([
            { warehouseId: 1, productId: p1 as number, quantity: 5 },  // 5 * 100 = 500 Cost, 1000 Retail
            { warehouseId: 1, productId: p2 as number, quantity: 10 }  // 10 * 30 = 300 Cost, 500 Retail
        ]);

        // 3. Logic Simulation (from Warehouse.tsx)
        const inventoryItems = await db.inventory.toArray();
        const products = await db.products.toArray();
        
        let totalCostValue = 0;
        let totalRetailValue = 0;

        inventoryItems.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
                totalCostValue += item.quantity * (product.costPrice || 0);
                totalRetailValue += item.quantity * product.price;
            }
        });

        expect(totalCostValue).toBe(800); // 500 + 300
        expect(totalRetailValue).toBe(1500); // 1000 + 500
    });
});
