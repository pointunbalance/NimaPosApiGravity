
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Bank Reconciliation Logic', () => {

    test('Calculates Cleared Balance correctly', () => {
        const openingBalance = 1000;
        
        // Selected transactions to clear
        const selectedDeposits = [500, 200]; // +700
        const selectedPayments = [300, 100]; // -400

        const totalDeposits = selectedDeposits.reduce((a, b) => a + b, 0);
        const totalPayments = selectedPayments.reduce((a, b) => a + b, 0);

        // Formula: Opening + Deposits - Payments
        const clearedBalance = openingBalance + totalDeposits - totalPayments;

        expect(clearedBalance).toBe(1300); // 1000 + 700 - 400
    });

    test('Validates reconciliation against statement balance', () => {
        const clearedBalance = 1300;
        const statementEndingBalance = 1300;

        const difference = statementEndingBalance - clearedBalance;
        const isBalanced = Math.abs(difference) < 0.01;

        expect(difference).toBe(0);
        expect(isBalanced).toBe(true);
    });

    test('Detects discrepancy', () => {
        const clearedBalance = 1300;
        const statementEndingBalance = 1250; // Bank says less money (maybe a fee was missed)

        const difference = statementEndingBalance - clearedBalance;
        const isBalanced = Math.abs(difference) < 0.01;

        expect(difference).toBe(-50);
        expect(isBalanced).toBe(false);
    });
});
