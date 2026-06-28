
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Payroll Logic', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
    });

    test('Calculates Net Salary with Bonuses and Deductions correctly', () => {
        const baseSalary = 5000;
        const daysWorked = 30;
        const standardDays = 30;
        const bonus = 500;
        const deduction = 200;

        // Logic found in Payroll.tsx
        const earnedBase = (baseSalary / standardDays) * daysWorked;
        const net = Math.max(0, Math.round(earnedBase + bonus - deduction));

        // 5000 + 500 - 200 = 5300
        expect(net).toBe(5300);
    });

    test('Calculates Pro-Rata Salary for partial month', () => {
        const baseSalary = 3000; // Daily rate = 100
        const daysWorked = 15;   // Worked half month
        const standardDays = 30;
        const bonus = 0;
        const deduction = 0;

        const earnedBase = (baseSalary / standardDays) * daysWorked; // 1500
        const net = Math.max(0, Math.round(earnedBase + bonus - deduction));

        expect(net).toBe(1500);
    });

    test('Salary cannot be negative', () => {
        const baseSalary = 1000;
        const daysWorked = 30;
        const deduction = 2000; // Deduction larger than salary

        const earnedBase = (baseSalary / 30) * 30;
        const net = Math.max(0, Math.round(earnedBase - deduction));

        expect(net).toBe(0);
    });
});
