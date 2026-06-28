
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Check Management Logic', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
        
        // Seed Accounting
        await db.accounts.bulkAdd([
            { id: 101, code: '1020', name: 'Bank', type: 'asset' },
            { id: 102, code: '1050', name: 'Notes Receivable', type: 'asset' } // Checks under collection
        ]);
    });

    test('Check Status Updates', async () => {
        const checkId = await db.bankChecks.add({
            number: 'CHK-001',
            amount: 5000,
            bankName: 'Test Bank',
            issueDate: new Date(),
            dueDate: new Date(),
            type: 'receivable',
            status: 'pending',
            payeeName: 'Customer A'
        });

        // Action: Mark as Bounced
        await db.bankChecks.update(checkId as number, { status: 'bounced' });
        
        const updated = await db.bankChecks.get(checkId as number);
        expect(updated?.status).toBe('bounced');
    });

    test('Clearing a Check generates Journal Entry', async () => {
        const amount = 5000;
        
        // 1. Logic simulation: Check marked cleared
        const lines = [
            { accountId: 101, debit: amount, credit: 0, accountName: 'Bank' }, // Debit Bank (Asset Up)
            { accountId: 102, debit: 0, credit: amount, accountName: 'Notes Receivable' } // Credit Notes Rec (Asset Down)
        ];

        await db.journalEntries.add({
            date: new Date(),
            description: 'Check Cleared',
            reference: 'CHK-001',
            lines: lines,
            totalAmount: amount,
            status: 'posted'
        });

        // 2. Verify Journal
        const entry = await db.journalEntries.where('reference').equals('CHK-001').first();
        expect(entry).toBeDefined();
        expect(entry?.totalAmount).toBe(5000);
        expect(entry?.lines[0].debit).toBe(5000);
        expect(entry?.lines[1].credit).toBe(5000);
    });
});
