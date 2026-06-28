
import React from 'react';
import '@testing-library/jest-dom';
import { db } from '../db';

// Mock Dexie Hooks
declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => {
    try { return fn(); } catch(e) { return []; }
  }
}));

describe('Full Application Integration Tests', () => {
  
  // Reset DB before tests
  beforeEach(async () => {
    await (db as any).open();
    await db.products.clear();
    await db.customers.clear();
    await db.warehouses.clear();
    await db.inventory.clear();
    
    // Seed Minimal Context
    await db.warehouses.add({ id: 1, name: 'Main', isMain: true });
    await db.warehouses.add({ id: 2, name: 'Secondary', isMain: false });
  });

  // --- PRODUCTS & INVENTORY TESTS ---
  test('Product Creation & Stock Initialization', async () => {
      // 1. Create Product
      const newProd = {
          name: 'Integration Test Laptop',
          price: 1500,
          costPrice: 1000,
          category: 'Electronics',
          stock: 50,
          type: 'simple' as const
      };
      
      const id = await db.products.add(newProd);
      
      // 2. Simulate Logic in Products.tsx (Auto add to Main Warehouse)
      const mainWh = await db.warehouses.get(1);
      if(mainWh) {
          await db.inventory.add({
              warehouseId: mainWh.id!,
              productId: id as number,
              quantity: newProd.stock
          });
      }

      // 3. Verify
      const savedProd = await db.products.get(id as number);
      const inventoryItem = await db.inventory.where({ warehouseId: 1, productId: id }).first();

      expect(savedProd).toBeDefined();
      expect(savedProd?.name).toBe('Integration Test Laptop');
      expect(inventoryItem?.quantity).toBe(50);
  });

  // --- WAREHOUSE TRANSFER TEST ---
  test('Warehouse Transfer Logic', async () => {
      // Setup
      const pId = await db.products.add({ name: 'Transfer Item', price: 10, stock: 100, category: 'Test' } as any);
      await db.inventory.add({ warehouseId: 1, productId: pId as number, quantity: 100 });

      // Transfer 20 from WH 1 to WH 2
      const transferQty = 20;
      
      await (db as any).transaction('rw', db.inventory, async () => {
          // Deduct Source
          const source = await db.inventory.where({ warehouseId: 1, productId: pId }).first();
          await db.inventory.update(source!.id!, { quantity: source!.quantity - transferQty });

          // Add Target
          await db.inventory.add({ warehouseId: 2, productId: pId as number, quantity: transferQty });
      });

      // Verify
      const sourceAfter = await db.inventory.where({ warehouseId: 1, productId: pId }).first();
      const targetAfter = await db.inventory.where({ warehouseId: 2, productId: pId }).first();

      expect(sourceAfter?.quantity).toBe(80);
      expect(targetAfter?.quantity).toBe(20);
  });

  // --- CUSTOMER & LEDGER TEST ---
  test('Customer Debt & Payment', async () => {
      // Setup
      const cId = await db.customers.add({ name: 'Test Customer', phone: '123', balance: 5000, totalSpent: 0 });

      // Simulate Payment (Partial)
      const paymentAmount = 2000;
      
      await (db as any).transaction('rw', db.customers, db.customerPayments, async () => {
          const c = await db.customers.get(cId as number);
          await db.customers.update(cId, { balance: (c!.balance || 0) - paymentAmount });
          
          await db.customerPayments.add({
              customerId: cId as number,
              amount: paymentAmount,
              date: new Date(),
              type: 'debt_payment'
          });
      });

      // Verify
      const cAfter = await db.customers.get(cId as number);
      const payments = await db.customerPayments.where('customerId').equals(cId).toArray();

      expect(cAfter?.balance).toBe(3000); // 5000 - 2000
      expect(payments.length).toBe(1);
      expect(payments[0].amount).toBe(2000);
  });

});
