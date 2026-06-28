import { db } from '../db';
import { JournalEntry, JournalEntryLine } from '../types';

export class AccountingEngine {
    /**
     * Validates and posts a journal entry to ensure double-entry accounting integrity.
     * Prevents unbalanced entries, negative amounts, and ensures consistency.
     */
    static async postEntry(entryDetails: {
        date?: Date;
        reference?: string;
        description: string;
        lines: Omit<JournalEntryLine, 'id'>[];
        createdBy?: string;
        ignoreClosedPeriod?: boolean;
    }): Promise<number> {
        const entryDate = entryDetails.date || new Date();

        // Validate fiscal year closing
        if (!entryDetails.ignoreClosedPeriod) {
            const fiscalYears = await db.fiscalYears.toArray();
            const isClosed = fiscalYears.some(fy => {
                const start = new Date(fy.startDate).setHours(0, 0, 0, 0);
                const end = new Date(fy.endDate).setHours(23, 59, 59, 999);
                return entryDate.getTime() >= start && entryDate.getTime() <= end && fy.status === "closed";
            });

            if (isClosed) {
                throw new Error("AccountingEngine: Cannot post entry to a closed fiscal year.");
            }
        }

        let totalDebit = 0;
        let totalCredit = 0;

        const sanitizedLines: JournalEntryLine[] = [];

        for (const line of entryDetails.lines) {
            const deb = Number(line.debit) || 0;
            const cred = Number(line.credit) || 0;

            if (deb < 0 || cred < 0) {
                throw new Error(`AccountingEngine: Negative values are not permitted in journal entries. Account: ${line.accountName || line.accountId}`);
            }

            // Only add lines with non-zero amounts
            if (deb > 0 || cred > 0) {
                totalDebit += deb;
                totalCredit += cred;

                sanitizedLines.push({
                    accountId: line.accountId,
                    accountName: line.accountName,
                    debit: deb,
                    credit: cred,
                    description: line.description || '',
                    costCenterId: line.costCenterId
                });
            }
        }

        // Float precision fix for comparison
        const diff = Math.abs(totalDebit - totalCredit);
        if (diff > 0.001) {
            throw new Error(`AccountingEngine: Unbalanced journal entry. Total Debit: ${totalDebit.toFixed(2)}, Total Credit: ${totalCredit.toFixed(2)}`);
        }

        if (sanitizedLines.length === 0) {
             console.warn("AccountingEngine: Ignoring zero-value journal entry.");
             return -1; // Return -1 or 0 to indicate no entry was created
        }

        const entry: JournalEntry = {
            date: entryDate,
            reference: entryDetails.reference,
            description: entryDetails.description,
            lines: sanitizedLines,
            totalAmount: Number(totalDebit.toFixed(2)),
            status: 'posted',
            createdBy: entryDetails.createdBy
        };

        try {
            const entryId = await db.journalEntries.add(entry);
            
            await db.auditLogs.add({
                userId: entryDetails.createdBy || "1",
                userName: "النظام / مدير",
                action: "create",
                module: "journal",
                details: `إنشاء قيد محاسبي برقم #${entryId} بقيمة ${totalDebit}`,
                timestamp: new Date().toISOString()
            });

            return entryId as number;
        } catch (error) {
            console.error("AccountingEngine: Failed to post journal entry", error);
            throw new Error("حدث خطأ أثناء حفظ قيد اليومية");
        }
    }

    /**
     * Helper to quickly create a line object
     */
    static createLine(
        accountId: number, 
        accountName: string, 
        type: 'debit' | 'credit', 
        amount: number, 
        description?: string,
        costCenterId?: number
    ): Omit<JournalEntryLine, 'id'> {
        return {
            accountId,
            accountName,
            debit: type === 'debit' ? amount : 0,
            credit: type === 'credit' ? amount : 0,
            description: description || '',
            costCenterId
        };
    }
}
