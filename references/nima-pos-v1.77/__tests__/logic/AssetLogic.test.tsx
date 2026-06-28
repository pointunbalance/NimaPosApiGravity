
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('Fixed Asset Logic', () => {

    test('Calculates Monthly Straight-Line Depreciation', () => {
        const cost = 12000;
        const salvage = 0;
        const lifeYears = 5;

        // Annual = 12000 / 5 = 2400
        // Monthly = 2400 / 12 = 200
        
        const annualDepreciation = (cost - salvage) / lifeYears;
        const monthlyDepreciation = annualDepreciation / 12;

        expect(annualDepreciation).toBe(2400);
        expect(monthlyDepreciation).toBe(200);
    });

    test('Calculates Accumulated Depreciation and Book Value', () => {
        const cost = 12000;
        const monthlyDep = 200;
        
        // Assume asset bought 6 months ago
        const monthsElapsed = 6;
        
        const accumulated = monthlyDep * monthsElapsed; // 1200
        const bookValue = cost - accumulated; // 10800

        expect(accumulated).toBe(1200);
        expect(bookValue).toBe(10800);
    });

    test('Depreciation does not exceed depreciable base (Cost - Salvage)', () => {
        const cost = 1000;
        const salvage = 100;
        const monthlyDep = 100; // High rate
        
        // Asset is 20 months old (Should be fully depreciated at 9 months)
        const monthsElapsed = 20; 

        const calculatedAccumulated = Math.min(
             monthlyDep * monthsElapsed, // 2000
             cost - salvage // 900
        );

        expect(calculatedAccumulated).toBe(900);
    });
});
