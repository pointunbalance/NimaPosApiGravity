import { db } from "../db";

/**
 * Generates a unified, sequential reference number for documents/invoices.
 * Format: PREFIX-YYMM-000N
 * Example: INV-2605-0001
 * 
 * @param tableName The name of the Dexie table (e.g., 'orders', 'consignments', 'purchases')
 * @param prefix The module prefix (e.g., 'INV', 'POS', 'CSG', 'PO', 'RFN')
 * @returns A formatted string
 */
export const generateReferenceNumber = async (tableName: string, defaultPrefix: string): Promise<string> => {
    try {
        const table = (db as any)[tableName];
        if (!table) {
            console.warn(`Table ${tableName} not found for reference generation. Falling back to timestamp.`);
            return `${defaultPrefix}-${Date.now().toString().slice(-6)}`;
        }
        
        let prefix = defaultPrefix;
        let includeYearMonth = true;
        let padding = 4;
        let suffix = "";

        const settings = await db.settings.toCollection().first();
        if (settings?.sequenceConfig && settings.sequenceConfig[tableName]) {
            const config = settings.sequenceConfig[tableName];
            prefix = config.prefix || prefix;
            includeYearMonth = config.includeYearMonth !== undefined ? config.includeYearMonth : includeYearMonth;
            padding = config.padding || padding;
            suffix = config.suffix || "";
        }
        
        // Get the highest ID by fetching the last item
        const lastItem = await table.orderBy('id').last();
        const nextId = lastItem && lastItem.id ? lastItem.id + 1 : 1;
        
        let customRef = prefix;

        if (includeYearMonth) {
            const date = new Date();
            const year = date.getFullYear().toString().slice(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            customRef += `-${year}${month}`;
        }
        
        customRef += `-${nextId.toString().padStart(padding, '0')}`;
        
        if (suffix) {
            customRef += `-${suffix}`;
        }

        return customRef;
    } catch (e) {
        console.error("Error generating reference number:", e);
        return `${defaultPrefix}-${Date.now().toString().slice(-6)}`;
    }
};
