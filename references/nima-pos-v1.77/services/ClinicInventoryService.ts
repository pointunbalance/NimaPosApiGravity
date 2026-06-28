import { db } from "../db";

export class ClinicInventoryService {
    /**
     * Consume inventory based on service's Bill of Materials (BOM)
     * Applies a wastage logic percentage (e.g. 5% natural wastage)
     */
    static async consumeForService(serviceId: number, multiplier: number = 1, wastagePercentage: number = 5) {
        return await db.transaction('rw', [db.clinicServicesList, db.clinicInventoryItems, db.auditLogs], async () => {
            const service = await db.clinicServicesList.get(serviceId);
            if (!service || !service.bom || !Array.isArray(service.bom)) return;

            for (const item of service.bom) {
                const inventoryItem = await db.clinicInventoryItems.get(item.itemId);
                if (inventoryItem) {
                    // Calculate exact quantity
                    const exactQty = item.quantity * multiplier;
                    // Add wastage percentage
                    const totalQtyWithWastage = exactQty + (exactQty * (wastagePercentage / 100));
                    
                    const newStock = Math.max(0, inventoryItem.stockAmount - totalQtyWithWastage);
                    
                    await db.clinicInventoryItems.update(inventoryItem.id!, {
                        stockAmount: newStock
                    });

                    // Log the consumption
                    await db.auditLogs.add({
                        userId: 1, // Can pass down based on context
                        action: 'INVENTORY_CONSUMPTION',
                        module: 'ClinicInventory',
                        timestamp: new Date().toISOString(),
                        details: `تم خصم ${totalQtyWithWastage.toFixed(2)} وحدة من ${inventoryItem.itemName} لخدمة ${service.serviceName} (تشمل نسبة هالك ${wastagePercentage}%)`
                    });
                }
            }
        });
    }

    /**
     * Set the BOM (Bill of Materials) for a specific service
     */
    static async setServiceBOM(serviceId: number, bom: { itemId: number, quantity: number, unit: string }[]) {
         await db.clinicServicesList.update(serviceId, { bom });
    }
}
