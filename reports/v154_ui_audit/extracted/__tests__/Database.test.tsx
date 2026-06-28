
import { db, seedDatabase, exportFullDatabase, seedLargeDataSet, getSqlSchema } from '../db';
import 'fake-indexeddb/auto'; // Requirement for Dexie in Jest

// Declare globals for TypeScript
declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;
declare const jest: any;

describe('Database Core Tests', () => {
    
    // Reset Database before each test
    beforeEach(async () => {
        await (db as any).delete();
        await (db as any).open();
    });

    test('Database initializes with empty tables', async () => {
        const productCount = await db.products.count();
        const userCount = await db.users.count();
        expect(productCount).toBe(0);
        expect(userCount).toBe(0);
    });

    test('seedDatabase populates default settings', async () => {
        await seedDatabase();
        
        const settings = await db.settings.toArray();
        expect(settings.length).toBe(1);
        expect(settings[0].storeName).toBe('متجر نيما');
        expect(settings[0].currency).toBe('ج.م'); // Changed to EGP symbol
    });

    test('seedDatabase creates default admin user', async () => {
        await seedDatabase();
        
        const users = await db.users.toArray();
        const admin = users.find(u => u.role === 'admin');
        
        expect(admin).toBeDefined();
        expect(admin?.name).toBe('مدير النظام');
        expect(admin?.pin).toBe('0000');
    });

    test('seedDatabase creates default warehouse and customer', async () => {
        await seedDatabase();
        
        const warehouses = await db.warehouses.toArray();
        const customers = await db.customers.toArray();
        
        expect(warehouses.length).toBeGreaterThan(0);
        expect(warehouses[0].isMain).toBe(true);
        
        expect(customers.length).toBeGreaterThan(0);
        expect(customers[0].name).toContain('زبون');
    });

    test('seedLargeDataSet populates extensive test data', async () => {
        // Mock console.log to keep test output clean
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
        
        // Mock progress callback
        const onProgress = jest.fn();
        
        await seedLargeDataSet(onProgress);
        
        const productCount = await db.products.count();
        const orderCount = await db.orders.count();
        const customerCount = await db.customers.count();
        
        expect(productCount).toBeGreaterThan(50); // Expecting significant data
        expect(orderCount).toBeGreaterThan(50);
        expect(customerCount).toBeGreaterThan(10);
        expect(onProgress).toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    }, 10000); // Increase timeout for large seed

    test('exportFullDatabase generates valid backup JSON', async () => {
        // Setup some data
        await db.products.add({ name: 'Export Item', price: 100, stock: 5, category: 'Test' });
        await db.settings.add({ storeName: 'Export Store', language: 'en' } as any);
        
        const blob = await exportFullDatabase();
        expect(blob).toBeDefined();
        expect(blob.type).toBe('application/json');
        
        const text = await blob.text();
        const json = JSON.parse(text);
        
        expect(json.version).toBeDefined();
        expect(json.exportDate).toBeDefined();
        expect(json.products).toHaveLength(1);
        expect(json.products[0].name).toBe('Export Item');
        expect(json.settings).toBeDefined();
    });

    test('CRUD Operations: Product Lifecycle', async () => {
        // Create
        const id = await db.products.add({
            name: 'CRUD Product',
            price: 500,
            stock: 10,
            category: 'General'
        });
        
        // Read
        const product = await db.products.get(id as number);
        expect(product?.name).toBe('CRUD Product');
        
        // Update
        await db.products.update(id, { price: 600 });
        const updated = await db.products.get(id as number);
        expect(updated?.price).toBe(600);
        
        // Delete
        await db.products.delete(id);
        const deleted = await db.products.get(id as number);
        expect(deleted).toBeUndefined();
    });

    test('getSqlSchema generates valid CREATE TABLE statements', () => {
        const queries = getSqlSchema();
        expect(queries).toBeInstanceOf(Array);
        expect(queries.length).toBeGreaterThan(0);
        
        // Check for specific tables existence
        const tablesToCheck = ['Products', 'Orders', 'Customers', 'Users', 'Warehouses'];
        tablesToCheck.forEach(table => {
            const hasTable = queries.some(q => q.includes(`CREATE TABLE IF NOT EXISTS ${table}`));
            expect(hasTable).toBe(true);
        });

        // Check for specific columns in Products table
        const productQuery = queries.find(q => q.includes('CREATE TABLE IF NOT EXISTS Products'));
        expect(productQuery).toContain('id INTEGER PRIMARY KEY');
        expect(productQuery).toContain('name TEXT');
        expect(productQuery).toContain('price REAL');
    });
});
