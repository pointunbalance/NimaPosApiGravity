
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Fulfillment & Kitchen Logic', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
    });

    test('Filters Active Orders correctly', async () => {
        await db.orders.bulkAdd([
            { id: 1, status: 'completed', fulfillmentStatus: 'pending', orderType: 'delivery', subtotalAmount: 100, totalAmount: 100, paymentMethod: 'cash', items: [], date: new Date() },
            { id: 2, status: 'completed', fulfillmentStatus: 'ready', orderType: 'takeaway', subtotalAmount: 50, totalAmount: 50, paymentMethod: 'cash', items: [], date: new Date() },
            { id: 3, status: 'completed', fulfillmentStatus: 'served', orderType: 'dine-in', subtotalAmount: 200, totalAmount: 200, paymentMethod: 'cash', items: [], date: new Date() }, // History
            { id: 4, status: 'refunded', fulfillmentStatus: 'pending', orderType: 'delivery', subtotalAmount: 100, totalAmount: 100, paymentMethod: 'cash', items: [], date: new Date() } // Refunded should be ignored ideally
        ]);

        const allOrders = await db.orders.toArray();
        
        // Logic from Fulfillment.tsx
        const activeOrders = allOrders.filter(o => 
            (o.fulfillmentStatus === 'pending' || o.fulfillmentStatus === 'ready') && 
            o.status !== 'refunded'
        );

        expect(activeOrders.length).toBe(2); // IDs 1 and 2
        
        const pendingDelivery = activeOrders.filter(o => o.fulfillmentStatus === 'pending' && o.orderType === 'delivery');
        expect(pendingDelivery.length).toBe(1);
        expect(pendingDelivery[0].id).toBe(1);
    });
});
