
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Shift Reconciliation Logic', () => {

    test('Calculates Expected Cash in Drawer', () => {
        const startCash = 500;
        const cashSales = 1200;
        const cardSales = 500; // Should be ignored for physical drawer count
        const cashExpenses = 200; // Taken from drawer

        // Formula: Start + Cash Sales - Cash Expenses
        const expected = startCash + cashSales - cashExpenses;

        expect(expected).toBe(1500); // 500 + 1200 - 200
    });

    test('Calculates Difference (Shortage/Overage)', () => {
        const expected = 1500;
        const actualCount = 1450; // Physical count

        const difference = actualCount - expected;

        expect(difference).toBe(-50); // Shortage of 50
    });

    test('Shift Status transition Open -> Closed', async () => {
        await (db as any).delete();
        await (db as any).open();

        const shiftId = await db.shifts.add({
            startTime: new Date(),
            startCash: 100,
            cashSales: 0,
            cardSales: 0,
            expectedCash: 100,
            status: 'open'
        });

        // Close Shift
        await db.shifts.update(shiftId as number, {
            endTime: new Date(),
            actualCash: 100,
            difference: 0,
            status: 'closed'
        });

        const closedShift = await db.shifts.get(shiftId as number);
        expect(closedShift?.status).toBe('closed');
        expect(closedShift?.endTime).toBeDefined();
    });
});
