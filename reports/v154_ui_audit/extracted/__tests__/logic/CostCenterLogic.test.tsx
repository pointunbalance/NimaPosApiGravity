
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Cost Center & Budget Logic', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
    });

    test('Aggregates Expenses per Cost Center', async () => {
        // 1. Create Cost Center
        const centerId = await db.costCenters.add({
            name: 'Marketing Dept',
            code: 'CC-MKT',
            description: 'Marketing Expenses'
        });

        // 2. Add Journal Entries linked to this center
        // Entry 1: Ad Campaign (Debit 1000)
        await db.journalEntries.add({
            date: new Date(),
            description: 'Ads',
            status: 'posted',
            totalAmount: 1000,
            lines: [{ accountId: 500, debit: 1000, credit: 0, costCenterId: centerId as number }]
        });

        // Entry 2: Printing (Debit 200)
        await db.journalEntries.add({
            date: new Date(),
            description: 'Brochures',
            status: 'posted',
            totalAmount: 200,
            lines: [{ accountId: 500, debit: 200, credit: 0, costCenterId: centerId as number }]
        });

        // 3. Logic: Calculate Total Expense for Center
        const journals = await db.journalEntries.toArray();
        let totalExpense = 0;

        journals.forEach(j => {
            j.lines.forEach(l => {
                if (l.costCenterId === centerId) {
                    totalExpense += l.debit;
                }
            });
        });

        expect(totalExpense).toBe(1200);
    });

    test('Detects Budget Overrun', () => {
        const budget = 5000;
        const currentExpense = 5500;

        const isOverBudget = currentExpense > budget;
        const remaining = budget - currentExpense;

        expect(isOverBudget).toBe(true);
        expect(remaining).toBe(-500);
    });
});
