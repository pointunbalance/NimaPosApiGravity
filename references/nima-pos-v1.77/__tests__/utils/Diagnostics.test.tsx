
import { runSystemDiagnostics } from '../../utils/diagnostics';
import { db } from '../../db';
import 'fake-indexeddb/auto';

declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

describe('System Diagnostics Utility', () => {

    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
    });

    test('Diagnostics detects missing configuration', async () => {
        // Run without seeding settings
        const results = await runSystemDiagnostics();
        
        const configCheck = results.find(r => r.id === 'config');
        const warehouseCheck = results.find(r => r.id === 'wh');

        expect(configCheck?.status).toBe('fail');
        expect(warehouseCheck?.status).toBe('fail');
    });

    test('Diagnostics passes with valid configuration', async () => {
        await db.settings.add({ storeName: 'Test Store' } as any);
        await db.warehouses.add({ name: 'Main', isMain: true });

        const results = await runSystemDiagnostics();
        
        const configCheck = results.find(r => r.id === 'config');
        const warehouseCheck = results.find(r => r.id === 'wh');

        expect(configCheck?.status).toBe('pass');
        expect(warehouseCheck?.status).toBe('pass');
    });

    test('Diagnostics detects orphaned inventory', async () => {
        await db.settings.add({} as any);
        await db.warehouses.add({ isMain: true } as any);
        
        // Inventory item pointing to non-existent product
        await db.inventory.add({ warehouseId: 1, productId: 999, quantity: 10 });

        const results = await runSystemDiagnostics();
        const integrityCheck = results.find(r => r.id === 'inv_orphaned');
        
        expect(integrityCheck?.status).not.toBe('pass');
        expect(integrityCheck?.status).toBe('warning');
    });
    
    test('Diagnostics detects negative stock', async () => {
        await db.settings.add({} as any);
        await db.warehouses.add({ isMain: true } as any);
        await db.products.add({ id: 1, name: 'Item A', stock: -5 } as any);
        
        // Negative inventory
        await db.inventory.add({ warehouseId: 1, productId: 1, quantity: -5 });

        const results = await runSystemDiagnostics();
        const negStockCheck = results.find(r => r.id === 'inv_negative');
        
        expect(negStockCheck?.status).toBe('warning');
    });
});
