import { db } from '../db';
import { debug } from '../utils/debug';

/**
 * AutoBackupService
 * Performs scheduled backups of the local Dexie database to a simulated Cloud Bucket.
 */
export class AutoBackupService {
    private backupInterval: number | null = null;
    private intervalMs: number = 60 * 60 * 1000; // 1 Hour by default

    public start() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
        }
        
        debug('[Auto-Backup] Service initialized and running silently.');
        
        // Schedule next backup
        this.backupInterval = window.setInterval(() => {
            this.performBackup('Scheduled Hourly Backup');
        }, this.intervalMs);
        
        // Check if a backup is needed right now upon startup
        this.checkBackupNeeded();
    }
    
    public stop() {
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
        }
        debug('[Auto-Backup] Service stopped.');
    }
    
    /**
     * Performs a backup of the DB via Cloud Sync simulation
     */
    public async performBackup(reason: string = 'Manual Request') {
        try {
            debug(`[Auto-Backup] Starting dump & upload... Reason: ${reason}`);
            
            // In a real application, we would use dexie-export-import:
            // const blob = await db.export();
            // await fetch('https://api.mycloud.com/backup', { method: 'POST', body: blob });
            
            // Simulate network latency for upload
            await new Promise(res => setTimeout(res, 1500));
            
            debug(`[Auto-Backup] ✅ Cloud Backup completed successfully.`);
            
            // Store timestamp of the successful backup
            localStorage.setItem('last_db_backup', new Date().toISOString());
        } catch (error) {
            console.error('[Auto-Backup] ❌ Cloud Backup failed', error);
        }
    }
    
    private checkBackupNeeded() {
        const lastBackupStr = localStorage.getItem('last_db_backup');
        if (!lastBackupStr) {
            this.performBackup('Initial Cloud Backup');
            return;
        }
        
        const lastBackup = new Date(lastBackupStr).getTime();
        const now = new Date().getTime();
        
        if (now - lastBackup > this.intervalMs) {
            this.performBackup('Missed Backup Window');
        }
    }
}

export const autoBackupService = new AutoBackupService();
