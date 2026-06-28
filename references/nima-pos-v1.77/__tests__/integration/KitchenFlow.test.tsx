
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Kitchen Workflow Integration', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
    });

    test('Order transitions correctly through Kitchen stages', async () => {
        // 1. New Order arrives (Pending)
        const orderId = await db.orders.add({
            date: new Date(),
            items: [{ productId: 1, name: 'Burger', quantity: 1, total: 50, price: 50 }],
            subtotalAmount: 50,
            totalAmount: 50,
            paymentMethod: 'cash',
            status: 'completed', // Payment done
            fulfillmentStatus: 'pending', // Kitchen status
            orderType: 'dine-in',
            tableNumber: 'T5'
        });

        // 2. Chef marks as Ready
        await db.orders.update(orderId as number, { fulfillmentStatus: 'ready' });
        
        let order = await db.orders.get(orderId as number);
        expect(order?.fulfillmentStatus).toBe('ready');

        // 3. Waiter serves (Served)
        await db.orders.update(orderId as number, { fulfillmentStatus: 'served' });

        order = await db.orders.get(orderId as number);
        expect(order?.fulfillmentStatus).toBe('served');
    });

    test('Kitchen Query Filters Orders correctly', async () => {
        // Seed orders with different statuses
        await db.orders.bulkAdd([
            { date: new Date(), items: [], subtotalAmount: 0, totalAmount: 0, paymentMethod: 'cash', status: 'completed', fulfillmentStatus: 'pending' },
            { date: new Date(), items: [], subtotalAmount: 0, totalAmount: 0, paymentMethod: 'cash', status: 'completed', fulfillmentStatus: 'ready' },
            { date: new Date(), items: [], subtotalAmount: 0, totalAmount: 0, paymentMethod: 'cash', status: 'completed', fulfillmentStatus: 'served' },
            { date: new Date(), items: [], subtotalAmount: 0, totalAmount: 0, paymentMethod: 'cash', status: 'refunded', fulfillmentStatus: 'served' }
        ]);

        const allOrders = await db.orders.toArray();
        
        const activeKitchenOrders = allOrders.filter(o => 
            o.fulfillmentStatus === 'pending' || o.fulfillmentStatus === 'ready'
        );

        const historyOrders = allOrders.filter(o => 
            o.fulfillmentStatus === 'served'
        );

        expect(activeKitchenOrders.length).toBe(2);
        expect(historyOrders.length).toBe(2);
    });
});
