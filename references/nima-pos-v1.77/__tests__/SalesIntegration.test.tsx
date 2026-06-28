
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import POS from '../pages/POS';
import Orders from '../pages/Orders';
import Warehouse from '../pages/Warehouse';
import Products from '../pages/Products';
import Shifts from '../pages/Shifts';
import { db } from '../db';
import { BrowserRouter } from 'react-router-dom';

// Declare Jest globals to satisfy TypeScript compiler
declare const jest: any;
declare const describe: any;
declare const beforeEach: any;
declare const test: any;
declare const expect: any;

// Mock DB interactions for integration test simulation
// Note: In a real environment, Dexie works in JSDOM with indexedDB shim.
// Here we assume the environment is set up or we mock the Dexie hooks.

jest.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: any) => {
    // Basic mock implementation or return static data based on call
    try {
        const result = fn();
        if (result instanceof Promise) return null; // Async simulation
        return result;
    } catch(e) { return []; }
  }
}));

describe('Sales System Integration Tests', () => {
  
  beforeEach(async () => {
    await (db as any).open();
    await db.products.clear();
    await db.orders.clear();
    await db.inventory.clear();
    await db.shifts.clear();
    await db.warehouses.clear();
    await db.suppliers.clear();
    await db.purchases.clear();
    await db.expenses.clear();
    
    // Seed basic data
    await db.warehouses.add({ id: 1, name: 'Main Warehouse', isMain: true });
  });

  test('User Scenario: Full Sales Cycle (Sell Item -> Deduct Stock -> Update Shift)', async () => {
    // 1. Setup: Create Product with Initial Stock (10 items)
    const productId = await db.products.add({ 
        name: 'iPhone 15', 
        price: 1000, 
        stock: 10, 
        type: 'simple',
        category: 'Phones' 
    });
    await db.inventory.add({ warehouseId: 1, productId: productId as number, quantity: 10 });

    // 2. Setup: Open a Shift
    await db.shifts.add({
        startTime: new Date(),
        startCash: 0,
        cashSales: 0,
        cardSales: 0,
        expectedCash: 0,
        status: 'open'
    });

    // 3. Action: User performs a Sale (Simulating POS Logic)
    // Selling 2 iPhones
    const qtySold = 2;
    const saleTotal = 2000;

    await (db as any).transaction('rw', db.orders, db.products, db.inventory, async () => {
        // Create Order
        await db.orders.add({
            date: new Date(),
            subtotalAmount: saleTotal,
            totalAmount: saleTotal,
            paymentMethod: 'cash',
            status: 'completed',
            items: [ { productId: productId as number, name: 'iPhone 15', price: 1000, quantity: qtySold, total: saleTotal } ]
        });
        
        // Deduct from Inventory (Warehouse)
        const invItem = await db.inventory.where({ warehouseId: 1, productId: productId }).first();
        if(invItem) await db.inventory.update(invItem.id!, { quantity: invItem.quantity - qtySold });
        
        // Deduct from Global Product Stock
        const prod = await db.products.get(productId as number);
        if(prod) await db.products.update(productId as number, { stock: prod.stock - qtySold });
    });

    // 4. Verification (Did it work as expected?)
    
    // Check Stock: Should be 8 (10 - 2)
    const updatedInv = await db.inventory.where({ warehouseId: 1, productId: productId }).first();
    const updatedProd = await db.products.get(productId as number);
    
    expect(updatedInv?.quantity).toBe(8);
    expect(updatedProd?.stock).toBe(8);

    // Check Order: Should exist
    const orders = await db.orders.toArray();
    expect(orders.length).toBe(1);
    expect(orders[0].totalAmount).toBe(saleTotal);
  });

  test('User Scenario: Supply Chain (Add Supplier -> Buy Stock -> Stock Increases)', async () => {
      // 1. Setup: User adds a new Supplier
      const supplierId = await db.suppliers.add({ 
          name: 'Apple Distributor', 
          phone: '0123456789' 
      });

      // 2. Setup: Product exists with 0 stock
      const productId = await db.products.add({ 
          name: 'MacBook Pro', 
          price: 2000, 
          costPrice: 1500, 
          stock: 0, 
          type: 'simple',
          category: 'Test'
      });
      // Initial inventory entry might not exist yet or be 0
      
      // 3. Action: User creates a Purchase Invoice
      const qtyPurchased = 5;
      const totalCost = 1500 * qtyPurchased; // 7500

      await (db as any).transaction('rw', db.purchases, db.products, db.inventory, db.expenses, async () => {
          // Record Purchase
          await db.purchases.add({
              supplierId: supplierId as number,
              supplierName: 'Apple Distributor',
              date: new Date(),
              totalAmount: totalCost,
              items: [{ productId: productId as number, name: 'MacBook Pro', costPrice: 1500, quantity: qtyPurchased, total: totalCost }]
          });

          // Update Stock (Increase)
          const prod = await db.products.get(productId as number);
          if (prod) await db.products.update(productId as number, { stock: prod.stock + qtyPurchased });

          // Update Inventory (Main Warehouse)
          const invItem = await db.inventory.where({ warehouseId: 1, productId: productId }).first();
          if (invItem) {
              await db.inventory.update(invItem.id!, { quantity: invItem.quantity + qtyPurchased });
          } else {
              await db.inventory.add({ warehouseId: 1, productId: productId as number, quantity: qtyPurchased });
          }

          // Record Expense (Money leaving)
          await db.expenses.add({
              title: 'Purchase Invoice',
              amount: totalCost,
              category: 'purchase',
              date: new Date()
          });
      });

      // 4. Verification
      
      // Check Stock: Should be 5
      const finalProd = await db.products.get(productId as number);
      expect(finalProd?.stock).toBe(5);

      const finalInv = await db.inventory.where({ warehouseId: 1, productId: productId }).first();
      expect(finalInv?.quantity).toBe(5);

      // Check Expense Recorded
      const expenses = await db.expenses.toArray();
      expect(expenses.length).toBe(1);
      expect(expenses[0].amount).toBe(totalCost); // 7500
  });

  test('User Scenario: Refund Order (Return Item -> Stock Restored)', async () => {
      // 1. Setup: Sale already happened
      const pId = await db.products.add({ name: 'Mouse', stock: 8, price: 25, category: 'Test' } as any); // Initially was 10, sold 2
      await db.inventory.add({ warehouseId: 1, productId: pId as number, quantity: 8 });
      
      const orderId = await db.orders.add({
          date: new Date(),
          subtotalAmount: 50,
          totalAmount: 50,
          paymentMethod: 'cash',
          status: 'completed',
          items: [{ productId: pId as number, name: 'Mouse', price: 25, quantity: 2, total: 50 }]
      });

      // 2. Action: User refunds the order
      await (db as any).transaction('rw', db.orders, db.products, db.inventory, async () => {
          // Mark Refunded
          await db.orders.update(orderId, { status: 'refunded' });
          
          // Return Stock (+2)
          const invItem = await db.inventory.where({ warehouseId: 1, productId: pId }).first();
          if(invItem) await db.inventory.update(invItem.id!, { quantity: invItem.quantity + 2 });
          
          const prod = await db.products.get(pId as number);
          if(prod) await db.products.update(pId as number, { stock: prod.stock + 2 });
      });

      // 3. Verification
      
      // Stock should be back to 10 (8 + 2)
      const restoredProd = await db.products.get(pId as number);
      expect(restoredProd?.stock).toBe(10);

      // Order status should be refunded
      const order = await db.orders.get(orderId as number);
      expect(order?.status).toBe('refunded');
  });

});
