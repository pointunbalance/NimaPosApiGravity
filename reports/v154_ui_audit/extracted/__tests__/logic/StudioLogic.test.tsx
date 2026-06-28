
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Studio Booking Logic', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
    });

    test('Calculates Booking Total and Remaining Balance', () => {
        // Scenario: Hourly booking
        const qty = 4; // 4 hours
        const unitPrice = 100; // 100 per hour
        const deposit = 150; 

        const total = qty * unitPrice; // 400
        const remaining = Math.max(0, total - deposit); // 250
        const isPaid = total > 0 && deposit >= total;

        expect(total).toBe(400);
        expect(remaining).toBe(250);
        expect(isPaid).toBe(false);
    });

    test('Calculates Fully Paid Status', () => {
        const qty = 1;
        const unitPrice = 500;
        const deposit = 500;

        const total = qty * unitPrice;
        const remaining = Math.max(0, total - deposit);
        const isPaid = total > 0 && deposit >= total;

        expect(remaining).toBe(0);
        expect(isPaid).toBe(true);
    });

    test('Prevents Double Booking on Same Day for Daily Pricing', async () => {
        // Setup existing booking
        const date = '2023-10-01';
        const cameraId = 101;
        
        await db.studioBookings.add({
            date: date,
            cameraId: cameraId,
            pricingType: 'daily',
            customerName: 'Customer A',
            shift: 'full',
            status: 'confirmed',
            quantity: 1,
            unitPrice: 0,
            price: 0,
            deposit: 0,
            remaining: 0,
            isPaid: false,
            createdAt: new Date()
        });

        // Check Logic (Simulation of handleSaveBooking check)
        const checkConflict = async (newDate: string, newCamId: number) => {
            const existing = await db.studioBookings
                .where({ date: newDate, cameraId: newCamId })
                .toArray();
            return existing.length > 0;
        };

        const hasConflict = await checkConflict(date, cameraId);
        const noConflict = await checkConflict('2023-10-02', cameraId);

        expect(hasConflict).toBe(true);
        expect(noConflict).toBe(false);
    });
});
