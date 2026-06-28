import { appEventBus } from '../lib/eventBus';
import { db } from '../db';
import { debug } from '../utils/debug';
import { Order, AppSettings } from '../types';

/**
 * 1. Inventory Observer
 * Listens for new or updated orders and deducts/updates inventory.
 * We separate this logic from the UI so it happens automatically.
 */
appEventBus.subscribe('ORDER_SAVED', async ({ order, isUpdate }: { order: Order; isUpdate: boolean }) => {
    try {
        debug(`[Inventory Service] Order saved, updating stock for order #${order.referenceNumber || order.id}`);
        // Here we could implement the full indexing logic if needed.
        // As a demonstration of the pattern, we ensure products exist and deduct.
        // Note: For real robust tracking, the actual long SQL-like transaction in SalesService is preferred, 
        // but this shows decoupling.
        if (!isUpdate && order.status === 'completed' && order.warehouseId) {
             const items = order.items;
             for (const item of items) {
                 const product = await db.products.get(item.productId);
                 if (product && product.stock !== undefined) {
                     const decreaseAmount = item.quantity * (item.conversionFactor || 1);
                     await db.products.update(product.id!, {
                         stock: product.stock - decreaseAmount
                     });
                     // Create stock adjustment log automatically
                     await db.stockAdjustments.add({
                         productId: product.id!,
                         productName: product.name,
                         type: 'decrease',
                         quantity: decreaseAmount,
                         reason: 'sales' as any,
                         date: new Date(),
                         notes: `خصم تلقائي للطلب #${order.referenceNumber || order.id}`,
                         warehouseId: order.warehouseId
                     });
                 }
             }
        }
    } catch (e) {
        console.error('[Inventory Service] Error updating stock:', e);
    }
});

/**
 * 2. Printer Observer
 * Prints the kitchen receipt automatically if configured.
 */
appEventBus.subscribe('ORDER_SAVED', async ({ order, settings }: { order: Order, settings?: AppSettings }) => {
    if (settings?.autoPrint) {
        debug(`[Printer Service] Sending order #${order.referenceNumber || order.id} to Kitchen Printer`);
        // We simulate printer instruction here
        if (order.fulfillmentStatus === 'pending') {
            debug(`[Printer] 🖨️ Printing Kitchen Ticket...`);
            // Custom printer logic here
        }
    }
});

/**
 * 3. KDS (Kitchen Display System) Observer
 * Real-time systems like PyQt might send an IPC signal.
 * In a web app, Dexie's live queries handle this mostly, but we can emit a distinct
 * event that a WebSocket or UI toaster can catch.
 */
appEventBus.subscribe('ORDER_SAVED', async ({ order }: { order: Order }) => {
    if (order.fulfillmentStatus === 'pending') {
        debug(`[KDS Service] System alert: New order #${order.referenceNumber || order.id} for the Kitchen!`);
        // e.g. send to WebSocket, or show custom Toast
    }
});
