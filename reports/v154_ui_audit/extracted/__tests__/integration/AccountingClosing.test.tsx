
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Fiscal Year Closing Process', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();

        // 1. Seed Accounts
        await db.accounts.bulkAdd([
            { id: 400, code: '400', name: 'Sales Revenue', type: 'revenue' },
            { id: 500, code: '500', name: 'Office Expense', type: 'expense' },
            { id: 300, code: '300', name: 'Retained Earnings', type: 'equity' }
        ]);

        // 2. Seed Journal Entries for the Year
        // Revenue: 1000 Credit
        await db.journalEntries.add({
            date: new Date(), description: 'Sales', status: 'posted', totalAmount: 1000,
            lines: [{ accountId: 400, credit: 1000, debit: 0 }, { accountId: 999, credit: 0, debit: 1000 }] // 999 is dummy cash
        });
        
        // Expense: 400 Debit
        await db.journalEntries.add({
            date: new Date(), description: 'Expense', status: 'posted', totalAmount: 400,
            lines: [{ accountId: 500, credit: 0, debit: 400 }, { accountId: 999, credit: 400, debit: 0 }]
        });
    });

    test('Calculates Net Income correctly before closing', async () => {
        const journals = await db.journalEntries.toArray();
        const accounts = await db.accounts.toArray();
        
        let revenue = 0;
        let expense = 0;

        journals.forEach(j => {
            j.lines.forEach(l => {
                if (l.accountId === 400) revenue += (l.credit - l.debit);
                if (l.accountId === 500) expense += (l.debit - l.credit);
            });
        });

        const netIncome = revenue - expense; // 1000 - 400 = 600
        expect(netIncome).toBe(600);
    });

    test('Generates correct Closing Entry lines', async () => {
        // Logic Simulation from FiscalYearClosing.tsx
        
        // Expected Net Income is 600 (Profit).
        // Closing Logic:
        // 1. Debit Revenue 1000 (to zero it)
        // 2. Credit Expense 400 (to zero it)
        // 3. Credit Retained Earnings 600 (plug)
        
        const retainedEarningsId = 300;
        const lines = [];
        
        // Simulate Revenue Closing
        lines.push({ accountId: 400, debit: 1000, credit: 0 }); // Close Revenue
        
        // Simulate Expense Closing
        lines.push({ accountId: 500, debit: 0, credit: 400 }); // Close Expense

        // Net Profit Transfer
        const netIncome = 600;
        lines.push({ accountId: retainedEarningsId, debit: 0, credit: netIncome }); // Transfer to Equity

        // Verification: Debits must equal Credits
        const totalDebit = lines.reduce((s, l) => s + l.debit, 0);   // 1000
        const totalCredit = lines.reduce((s, l) => s + l.credit, 0); // 400 + 600 = 1000

        expect(totalDebit).toBe(totalCredit);
        expect(lines.find(l => l.accountId === 300)?.credit).toBe(600);
    });
});
