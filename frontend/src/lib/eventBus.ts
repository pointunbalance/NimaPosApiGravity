type EventCallback = (payload: any) => void | Promise<void>;

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  subscribe(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

// Support for async observers (awaiting them isn't strict but useful for atomic transactions)
  async publish(event: string, payload?: any) {
    if (this.listeners.has(event)) {
      const callbacks = Array.from(this.listeners.get(event)!);
      for (const callback of callbacks) {
        // We let the error bubble up so Dexie can Rollback the transaction
        await callback(payload);
      }
    }
  }
}

export const appEventBus = new EventBus();
