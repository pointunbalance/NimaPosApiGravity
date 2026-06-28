
import React, { useEffect } from 'react';
import { db } from '../db';
import { useToast } from '../context/ToastContext';
import { logActivity } from '../utils/logger';

/**
 * Smart Auditor: "The Silent Guardian"
 * Runs periodically to verify mathematical integrity of orders and inventory synchronization.
 */
const SmartAuditor: React.FC = () => {
  const { warning } = useToast();

  useEffect(() => {
    const runAudit = async () => {
      console.log('🕵️ Smart Auditor: Starting background check...');
      
      try {
        await auditRecentOrders();
        await auditInventorySync();
      } catch (e) {
        console.error('Smart Auditor crashed:', e);
      }
    };

    // Run immediately on mount, then every 5 minutes
    runAudit();
    const interval = setInterval(runAudit, 5 * 60 * 1000); 

    return () => clearInterval(interval);
  }, []);

  // 1. Audit Order Math (Price * Qty - Discount = Total)
  const auditRecentOrders = async () => {
    // Check last 20 orders only to save performance
    const recentOrders = await db.orders.orderBy('id').reverse().limit(20).toArray();
    
    for (const order of recentOrders) {
      if (order.status === 'refunded') continue; // Skip full refunds logic for now

      let calculatedSubtotal = 0;
      let anomalies = [];

      // A. Line Item Check
      for (const item of order.items) {
        // Expected: (Price * Qty) - Discount
        const expectedLineTotal = (item.price * item.quantity) - (item.discount || 0);
        
        // Allow for tiny floating point differences
        if (Math.abs(expectedLineTotal - item.total) > 0.05) {
          anomalies.push(`Item ${item.name}: Expected ${expectedLineTotal}, Found ${item.total}`);
        }
        calculatedSubtotal += expectedLineTotal;
      }

      // B. Header Total Check
      // Expected: Subtotal - OrderDiscount + Tax
      const expectedGrandTotal = calculatedSubtotal - (order.discountAmount || 0) + (order.taxAmount || 0);

      if (Math.abs(expectedGrandTotal - order.totalAmount) > 0.05) {
        anomalies.push(`Grand Total: Expected ${expectedGrandTotal}, Found ${order.totalAmount}`);
      }

      // If anomalies found, Log it
      if (anomalies.length > 0) {
        await reportIssue(
          'تضارب حسابي في الفاتورة', 
          `Invoice #${order.id} has math errors: ${anomalies.join(', ')}`,
          order.id
        );
      }
    }
  };

  // 2. Audit Inventory Sync (Product Stock vs Warehouse Records)
  const auditInventorySync = async () => {
    const products = await db.products.toArray();
    
    for (const product of products) {
      if (product.type === 'composite') continue; // Skip recipes

      const inventoryRecords = await db.inventory.where('productId').equals(product.id!).toArray();
      const warehouseTotal = inventoryRecords.reduce((sum, inv) => sum + inv.quantity, 0);

      if (warehouseTotal !== product.stock) {
        // Serious Issue: Global stock doesn't match warehouse distribution
        await reportIssue(
          'عدم تطابق المخزون',
          `Product "${product.name}" (#${product.id}): Global Stock (${product.stock}) !== Warehouses Total (${warehouseTotal}).`,
          product.id
        );
      }
    }
  };

  // Helper to log and notify (with debounce to avoid spamming logs)
  const reportIssue = async (title: string, details: string, refId?: number) => {
    // Check if we logged this recently to avoid spam
    const existingLog = await db.logs
      .where('referenceId').equals(refId!)
      .and(l => l.status === 'warning' && l.action === title)
      .last();
    
    // Only log if not logged in the last 24 hours
    const oneDay = 24 * 60 * 60 * 1000;
    if (!existingLog || (new Date().getTime() - new Date(existingLog.date).getTime() > oneDay)) {
        
        console.warn(`AUDIT ALERT: ${title}`, details);
        
        await logActivity(
            'system', 
            `[المراجع الذكي] ${title}`, 
            details, 
            0, 
            refId, 
            'warning'
        );

        warning(`تنبيه نظام: ${title} (راجع السجل)`);
    }
  };

  return null; // Invisible component
};

export default SmartAuditor;
