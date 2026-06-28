import React from 'react';
import { db } from '../db';
import { describe, test, expect, beforeEach } from 'vitest';

describe('POS New Features Integration Tests', () => {
  
  beforeEach(async () => {
    await (db as any).open();
    await db.products.clear();
    await db.orders.clear();
    await db.customers.clear();
    await db.quotations.clear();
  });

  test('Delivery Details: Order saves delivery address, phone, and fee', async () => {
    const orderId = await db.orders.add({
        date: new Date(),
        subtotalAmount: 100,
        totalAmount: 120, // 100 + 20 fee
        paymentMethod: 'cash',
        status: 'completed',
        orderType: 'delivery',
        deliveryAddress: '123 Main St',
        deliveryPhone: '555-1234',
        deliveryFee: 20,
        items: []
    });

    const order = await db.orders.get(orderId as number);
    expect(order?.orderType).toBe('delivery');
    expect(order?.deliveryAddress).toBe('123 Main St');
    expect(order?.deliveryPhone).toBe('555-1234');
    expect(order?.deliveryFee).toBe(20);
    expect(order?.totalAmount).toBe(120);
  });

  test('Quick Customer Add: Adds customer to DB', async () => {
    const customerId = await db.customers.add({
        name: 'John Doe',
        phone: '01000000000',
        totalSpent: 0,
        balance: 0
    });

    const customer = await db.customers.get(customerId as number);
    expect(customer?.name).toBe('John Doe');
    expect(customer?.phone).toBe('01000000000');
  });

  test('Save as Quotation: Saves cart as quotation instead of order', async () => {
    const quotationId = await db.quotations.add({
        date: new Date(),
        customerName: 'Test Customer',
        items: [{ productId: 1, name: 'Item 1', price: 50, quantity: 2, total: 100 }],
        subtotalAmount: 100,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: 100,
        status: 'pending',
        createdBy: 'Admin'
    });

    const quotation = await db.quotations.get(quotationId as number);
    expect(quotation?.customerName).toBe('Test Customer');
    expect(quotation?.totalAmount).toBe(100);
    expect(quotation?.status).toBe('pending');
    
    const orders = await db.orders.toArray();
    expect(orders.length).toBe(0); // No order should be created
  });

  test('Loyalty Points: Deducts points and applies discount', async () => {
    const customerId = await db.customers.add({
        name: 'Loyal Customer',
        phone: '123',
        totalSpent: 1000,
        balance: 0,
        loyaltyPoints: 100 // 100 points
    });

    // Assume 1 point = 1 currency unit
    const pointsUsed = 50;
    const discountAmount = pointsUsed * 1; 

    const orderId = await db.orders.add({
        date: new Date(),
        customerId: customerId as number,
        subtotalAmount: 200,
        totalAmount: 200 - discountAmount, // 150
        paymentMethod: 'cash',
        status: 'completed',
        loyaltyPointsUsed: pointsUsed,
        items: []
    });

    // Update customer points
    const customer = await db.customers.get(customerId as number);
    if (customer && customer.loyaltyPoints) {
        await db.customers.update(customerId as number, {
            loyaltyPoints: customer.loyaltyPoints - pointsUsed
        });
    }

    const updatedCustomer = await db.customers.get(customerId as number);
    expect(updatedCustomer?.loyaltyPoints).toBe(50); // 100 - 50

    const order = await db.orders.get(orderId as number);
    expect(order?.loyaltyPointsUsed).toBe(50);
    expect(order?.totalAmount).toBe(150);
  });

  test('Credit Sales: Saves due date', async () => {
    const dueDate = new Date('2026-12-31');
    const orderId = await db.orders.add({
        date: new Date(),
        subtotalAmount: 500,
        totalAmount: 500,
        paymentMethod: 'credit',
        status: 'completed',
        dueDate: dueDate,
        items: []
    });

    const order = await db.orders.get(orderId as number);
    expect(order?.paymentMethod).toBe('credit');
    expect(order?.dueDate).toEqual(dueDate);
  });

  test('Maintenance/Received Products: Saves device serial, issue, and attachments', async () => {
    const orderId = await db.orders.add({
        date: new Date(),
        subtotalAmount: 0,
        totalAmount: 0,
        paymentMethod: 'cash',
        status: 'completed',
        orderType: 'receive',
        deviceSerial: 'SN-123456',
        issueDescription: 'Screen broken',
        deviceAttachments: 'Charger, Box',
        items: []
    });

    const order = await db.orders.get(orderId as number);
    expect(order?.orderType).toBe('receive');
    expect(order?.deviceSerial).toBe('SN-123456');
    expect(order?.issueDescription).toBe('Screen broken');
    expect(order?.deviceAttachments).toBe('Charger, Box');
  });

});
