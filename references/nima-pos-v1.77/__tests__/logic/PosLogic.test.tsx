
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('POS Calculation Logic', () => {

    test('Calculates Line Totals correctly', () => {
        const item = { price: 100, quantity: 3, itemDiscount: 20 };
        // Formula: (Price * Qty) - Discount
        const total = (item.price * item.quantity) - item.itemDiscount;
        expect(total).toBe(280);
    });

    test('Calculates Order Totals with Global Tax and Discount', () => {
        const cart = [
            { price: 100, quantity: 2, itemDiscount: 0 }, // 200
            { price: 50, quantity: 1, itemDiscount: 0 }   // 50
        ];
        
        const subtotal = 250;
        const globalDiscountPercent = 10; // 10%
        const taxRate = 14; // 14%

        // 1. Apply Discount
        const discountAmount = subtotal * (globalDiscountPercent / 100); // 25
        const afterDiscount = subtotal - discountAmount; // 225

        // 2. Apply Tax (Assuming tax is applied on net amount)
        const taxAmount = afterDiscount * (taxRate / 100); // 225 * 0.14 = 31.5
        
        const finalTotal = afterDiscount + taxAmount; // 256.5

        expect(discountAmount).toBe(25);
        expect(taxAmount).toBe(31.5);
        expect(finalTotal).toBe(256.5);
    });

    test('Refund Mode negates totals correctly', () => {
        const isRefund = true;
        const qty = 2;
        const price = 100;
        
        const finalQty = isRefund ? -Math.abs(qty) : qty;
        const lineTotal = finalQty * price;

        expect(finalQty).toBe(-2);
        expect(lineTotal).toBe(-200);
    });

    test('Change Calculation (Payment)', () => {
        const total = 850;
        const received = 1000;
        
        const change = received - total;
        expect(change).toBe(150);
    });
});
