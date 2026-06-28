
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Tax Reporting Logic', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
    });

    test('Calculates Net Tax Payable (Output - Input)', async () => {
        // 1. Sales (Output Tax)
        await db.orders.add({
            date: new Date(),
            totalAmount: 110,
            subtotalAmount: 100,
            taxAmount: 10, // Collected from customer
            paymentMethod: 'cash',
            items: [],
            status: 'completed'
        });

        // 2. Purchases (Input Tax)
        await db.purchases.add({
            date: new Date(),
            supplierId: 1,
            supplierName: 'Sup',
            totalAmount: 55,
            subtotal: 50,
            taxAmount: 5, // Paid to supplier (Deductible)
            items: []
        });

        // 3. Logic
        const orders = await db.orders.toArray();
        const purchases = await db.purchases.toArray();

        const totalOutputTax = orders.reduce((sum, o) => sum + (o.taxAmount || 0), 0);
        const totalInputTax = purchases.reduce((sum, p) => sum + (p.taxAmount || 0), 0);

        const netPayable = totalOutputTax - totalInputTax;

        expect(totalOutputTax).toBe(10);
        expect(totalInputTax).toBe(5);
        expect(netPayable).toBe(5);
    });
});
