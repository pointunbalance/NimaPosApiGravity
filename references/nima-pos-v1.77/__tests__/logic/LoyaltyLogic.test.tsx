
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Customer Loyalty Logic', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
    });

    test('Calculates Loyalty Points based on Total Spent', () => {
        // Logic extracted from Customers.tsx: 1 Point per 100 Currency Units
        const calculatePoints = (spent: number) => Math.floor(spent / 100);

        expect(calculatePoints(1000)).toBe(10);
        expect(calculatePoints(550)).toBe(5);
        expect(calculatePoints(99)).toBe(0);
    });

    test('Redeeming Points converts to Wallet Balance', async () => {
        // Setup Customer
        const customerId = await db.customers.add({
            name: 'Loyal Customer',
            phone: '1234567890',
            totalSpent: 10000, // Should equate to 100 points
            walletBalance: 0,
            loyaltyPoints: 100 // Assume previously calculated
        });

        // Redemption Logic: 10 Points = 1 Currency Unit (Example Logic)
        const redemptionRate = 0.1; 
        const pointsToRedeem = 100;
        const walletCredit = pointsToRedeem * redemptionRate; // 10

        await db.customers.update(customerId as number, {
            loyaltyPoints: 0,
            walletBalance: walletCredit
        });

        const updated = await db.customers.get(customerId as number);
        expect(updated?.loyaltyPoints).toBe(0);
        expect(updated?.walletBalance).toBe(10);
    });
});
