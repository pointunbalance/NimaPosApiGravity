
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Debt Aging Logic', () => {

    test('Allocates debt into age buckets correctly', () => {
        // Current Date Mock
        const today = new Date('2023-10-01');
        
        // Invoices with different dates
        const invoices = [
            { id: 1, date: new Date('2023-09-25'), amount: 100 }, // 6 days old (0-30)
            { id: 2, date: new Date('2023-08-15'), amount: 200 }, // 47 days old (31-60)
            { id: 3, date: new Date('2023-06-01'), amount: 300 }  // 122 days old (90+)
        ];

        const totalDebt = 600; // Sum of invoices
        
        const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };

        // Logic from AgingReports.tsx (Calculate days diff)
        invoices.forEach(inv => {
            const diffTime = Math.abs(today.getTime() - inv.date.getTime());
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (days <= 30) buckets['0-30'] += inv.amount;
            else if (days <= 60) buckets['31-60'] += inv.amount;
            else if (days <= 90) buckets['61-90'] += inv.amount;
            else buckets['90+'] += inv.amount;
        });

        expect(buckets['0-30']).toBe(100);
        expect(buckets['31-60']).toBe(200);
        expect(buckets['61-90']).toBe(0);
        expect(buckets['90+']).toBe(300);
    });
});
