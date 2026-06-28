import { db } from '../db';
import { debug } from '../utils/debug';

class OfflineSyncService {
    private isOnline: boolean = navigator.onLine;
    private listeners: ((online: boolean, pendingCount: number) => void)[] = [];

    constructor() {
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);
        
        // Initial setup
        this.checkPendingSyncs();
    }

    private handleOnline = async () => {
        this.isOnline = true;
        this.notifyListeners();
        await this.syncPendingData();
    };

    private handleOffline = () => {
        this.isOnline = false;
        this.notifyListeners();
    };

    /**
     * Call this whenever a local db change happens that needs syncing
     */
    public async queueChange(operation: 'create' | 'update' | 'delete', tableName: string, data: any) {
        await db.syncQueue.add({
            operation,
            tableName,
            data,
            timestamp: new Date().toISOString(),
            status: 'pending'
        });
        
        this.notifyListeners();

        if (this.isOnline) {
            await this.syncPendingData();
        }
    }

    private async syncPendingData() {
        if (!this.isOnline) return;

        try {
            const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();
            
            if (pendingItems.length === 0) return;

            // Simulate network request to cloud server
            debug(`[Sync] Starting synchronization of ${pendingItems.length} items to cloud...`);
            
            // We simulate a cloud request delay
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mark as synced
            for (const item of pendingItems) {
                // Here is where actual conflict resolution / bidirectional merge logic would happen
                // For demonstration, we just mark them as synced.
                await db.syncQueue.update(item.id!, { status: 'synced' });
            }

            debug(`[Sync] Successfully synchronized ${pendingItems.length} items.`);
            this.notifyListeners();
        } catch (error) {
            console.error('[Sync] Synchronization failed:', error);
            // Will retry later
        }
    }

    private async checkPendingSyncs() {
        this.notifyListeners();
        if (this.isOnline) {
            await this.syncPendingData();
        }
    }

    public subscribe(callback: (online: boolean, pendingCount: number) => void) {
        this.listeners.push(callback);
        this.notifyListeners(); // Send initial state
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    private async notifyListeners() {
        try {
             const pendingCount = await db.syncQueue.where('status').equals('pending').count();
             this.listeners.forEach(cb => cb(this.isOnline, pendingCount));
        } catch {
             this.listeners.forEach(cb => cb(this.isOnline, 0));
        }
    }

    public async simulateCloudIncomingPush(tableName: string, data: any) {
        // Simulates an event where the server pushes new data to the local DB (Bidirectional)
        if (!this.isOnline) return;
        
        debug(`[Sync] Received incoming cloud push for ${tableName}... merging data.`);
        
        // Let's pretend it's a new appointment
        if (tableName === 'appointments') {
            await db.appointments.put(data);
        }
    }
}

export const syncService = new OfflineSyncService();
