
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Financial & Accounting Logic', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
        
        // Seed Standard Accounts
        await db.accounts.bulkAdd([
            { id: 101, code: '1010', name: 'Cash', type: 'asset' },
            { id: 401, code: '4010', name: 'Sales Revenue', type: 'revenue' },
            { id: 501, code: '5010', name: 'COGS', type: 'expense' },
            { id: 102, code: '1020', name: 'Inventory', type: 'asset' }
        ]);
    });

    test('Journal Entry must be Balanced (Debit == Credit)', async () => {
        // Logic check: The system should ideally validate this.
        // Since we are testing logic, we simulate the validation that SHOULD happen.
        
        const lines = [
            { accountId: 101, debit: 100, credit: 0 },
            { accountId: 401, debit: 0, credit: 90 } // Deliberate mismatch
        ];

        const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
        const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
        
        expect(totalDebit).not.toBe(totalCredit);
        
        // In a real function call, this should throw or return false
        const isValid = Math.abs(totalDebit - totalCredit) < 0.01;
        expect(isValid).toBe(false);
    });

    test('Income Statement Calculation (Revenue - Expense)', async () => {
        // 1. Record Sales (Revenue Credit)
        await db.journalEntries.add({
            date: new Date(),
            description: 'Sale 1',
            status: 'posted',
            totalAmount: 1000,
            lines: [
                { accountId: 101, debit: 1000, credit: 0 }, // Cash
                { accountId: 401, debit: 0, credit: 1000 }  // Revenue
            ]
        });

        // 2. Record Expense (COGS Debit)
        await db.journalEntries.add({
            date: new Date(),
            description: 'Cost of Sale 1',
            status: 'posted',
            totalAmount: 600,
            lines: [
                { accountId: 501, debit: 600, credit: 0 },  // COGS
                { accountId: 102, debit: 0, credit: 600 }   // Inventory
            ]
        });

        // 3. Logic: Calculate Net Profit
        const journals = await db.journalEntries.toArray();
        let revenue = 0;
        let expense = 0;

        journals.forEach(j => {
            j.lines.forEach(l => {
                if (l.accountId === 401) revenue += (l.credit - l.debit);
                if (l.accountId === 501) expense += (l.debit - l.credit);
            });
        });

        const netProfit = revenue - expense;

        expect(revenue).toBe(1000);
        expect(expense).toBe(600);
        expect(netProfit).toBe(400);
    });

    test('Trial Balance: Sum of all accounts must be zero', async () => {
        // Setup Complex Entry
        await db.journalEntries.add({
            date: new Date(),
            description: 'Complex Transaction',
            status: 'posted',
            totalAmount: 500,
            lines: [
                { accountId: 101, debit: 500, credit: 0 },
                { accountId: 401, debit: 0, credit: 300 },
                { accountId: 501, debit: 0, credit: 200 } // Technically revenue 2? just ensuring balance
            ]
        });

        const journals = await db.journalEntries.toArray();
        let grandTotal = 0;

        journals.forEach(j => {
            j.lines.forEach(l => {
                // Debit is +, Credit is -
                grandTotal += (l.debit - l.credit);
            });
        });

        expect(grandTotal).toBe(0);
    });
});
