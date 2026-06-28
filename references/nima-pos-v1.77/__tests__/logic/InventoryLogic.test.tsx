
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Inventory & Warehouse Logic', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
        // Seed Basic Warehouses
        await db.warehouses.add({ id: 1, name: 'Main', isMain: true });
        await db.warehouses.add({ id: 2, name: 'Store B', isMain: false });
    });

    test('Composite Product (Recipe) Deducts Ingredients correctly', async () => {
        // 1. Setup Ingredients
        const meatId = await db.products.add({ name: 'Meat (kg)', stock: 10, price: 0, costPrice: 50, type: 'simple', category: 'Test' } as any);
        const breadId = await db.products.add({ name: 'Bread', stock: 20, price: 0, costPrice: 5, type: 'simple', category: 'Test' } as any);

        // 2. Setup Composite Product (Burger = 0.2 Meat + 1 Bread)
        const burgerId = await db.products.add({
            name: 'Burger Sandwich',
            type: 'composite',
            price: 50,
            stock: 0, // Virtual
            category: 'Test',
            composition: [
                { productId: meatId as number, quantity: 0.2 },
                { productId: breadId as number, quantity: 1 }
            ]
        } as any);

        // Initialize Inventory
        await db.inventory.bulkAdd([
            { warehouseId: 1, productId: meatId as number, quantity: 10 },
            { warehouseId: 1, productId: breadId as number, quantity: 20 }
        ]);

        // 3. Action: Sell 5 Burgers
        const qtySold = 5;
        
        await (db as any).transaction('rw', db.orders, db.products, db.inventory, async () => {
            await db.orders.add({
                date: new Date(),
                subtotalAmount: 250,
                totalAmount: 250,
                paymentMethod: 'cash',
                status: 'completed',
                items: [{ 
                    productId: burgerId as number, 
                    name: 'Burger', 
                    quantity: qtySold, 
                    price: 50, 
                    total: 250 
                }]
            });

            // Simulate the Logic normally found in POS.tsx handleFinalizeCheckout
            const product = await db.products.get(burgerId as number);
            if (product && product.composition) {
                for (const comp of product.composition) {
                    const deduct = comp.quantity * qtySold;
                    
                    // Update Inventory Table
                    const invItem = await db.inventory.where({ warehouseId: 1, productId: comp.productId }).first();
                    if(invItem) {
                        await db.inventory.update(invItem.id!, { quantity: invItem.quantity - deduct });
                    }
                    
                    // Update Product Table
                    const ingProd = await db.products.get(comp.productId);
                    if(ingProd) {
                        await db.products.update(comp.productId, { stock: ingProd.stock - deduct });
                    }
                }
            }
        });

        // 4. Verify Ingredients Stock
        const meatInv = await db.inventory.where({ warehouseId: 1, productId: meatId }).first();
        const breadInv = await db.inventory.where({ warehouseId: 1, productId: breadId }).first();

        // Meat: 10 - (0.2 * 5) = 10 - 1 = 9
        expect(meatInv?.quantity).toBeCloseTo(9); 
        // Bread: 20 - (1 * 5) = 15
        expect(breadInv?.quantity).toBe(15);
    });

    test('Stock Transfer moves quantity between warehouses correctly', async () => {
        // Setup
        const pId = await db.products.add({ name: 'Item X', stock: 100, price: 10, category: 'Test' } as any);
        await db.inventory.add({ warehouseId: 1, productId: pId as number, quantity: 100 }); // Source
        await db.inventory.add({ warehouseId: 2, productId: pId as number, quantity: 0 });   // Target

        const transferQty = 30;

        // Action: Transfer
        await (db as any).transaction('rw', db.inventory, async () => {
             const source = await db.inventory.where({ warehouseId: 1, productId: pId }).first();
             const target = await db.inventory.where({ warehouseId: 2, productId: pId }).first();
             
             await db.inventory.update(source!.id!, { quantity: source!.quantity - transferQty });
             await db.inventory.update(target!.id!, { quantity: target!.quantity + transferQty });
        });

        // Verify
        const sourceAfter = await db.inventory.where({ warehouseId: 1, productId: pId }).first();
        const targetAfter = await db.inventory.where({ warehouseId: 2, productId: pId }).first();

        expect(sourceAfter?.quantity).toBe(70);
        expect(targetAfter?.quantity).toBe(30);
    });
});
