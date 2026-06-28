
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Expense Analytics Logic', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
    });

    test('Aggregates Expenses by Category within Date Range', async () => {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);

        await db.expenses.bulkAdd([
            { title: 'Rent', amount: 1000, category: 'rent', date: today },
            { title: 'Salary A', amount: 500, category: 'salary', date: today },
            { title: 'Salary B', amount: 500, category: 'salary', date: today },
            { title: 'Old Rent', amount: 1000, category: 'rent', date: lastMonth } // Should be filtered out if looking at "today" range
        ]);

        // Logic: Filter by date (Today)
        const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(); endOfDay.setHours(23,59,59,999);

        const allExpenses = await db.expenses.toArray();
        const filtered = allExpenses.filter(e => {
            const d = new Date(e.date).getTime();
            return d >= startOfDay.getTime() && d <= endOfDay.getTime();
        });

        // Logic: Group by Category
        const categoryTotals: Record<string, number> = {};
        filtered.forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        });

        expect(filtered.length).toBe(3);
        expect(categoryTotals['rent']).toBe(1000);
        expect(categoryTotals['salary']).toBe(1000); // 500 + 500
    });
});
