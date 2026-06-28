import { db } from "../db";
import { SystemNotification } from "../types";

class NotificationService {
  private playChimeSound() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      // First pleasant tone (C5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.start(now);
      osc1.stop(now + 0.35);
      
      // Second pleasant tone (E5 to G5) slightly delayed
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.28);
      gain2.gain.setValueAtTime(0.1, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn("Web Audio Notification chime failed:", e);
    }
  }

  async addNotification(title: string, message: string, type: SystemNotification["type"] = "info", link?: string) {
    const notif: SystemNotification = {
      title,
      message,
      type,
      date: new Date(),
      isRead: false,
      link
    };
    
    try {
      // Save to local db
      await db.notifications.add(notif);
    } catch (e) {
      console.error("Failed to add notification to database:", e);
    }

    // Play offline in-app audio notification chime
    this.playChimeSound();

    // Browser Push Notification (if allowed and in background/supported)
    try {
      this.sendBrowserNotification(title, message);
    } catch (e) {
      console.warn("sendBrowserNotification failed:", e);
    }

    // Toast via global event
    try {
      window.dispatchEvent(new CustomEvent('global-toast', {
         detail: { message: `${title}\n${message}`, type }
      }));
    } catch (e) {
      console.warn("dispatchEvent failed:", e);
    }
  }

  private sendBrowserNotification(title: string, body: string) {
    try {
      if (!("Notification" in window)) return;
      
      // Accessing Notification.permission in some sandboxed iframes throws a SecurityError
      const permission = Notification.permission;
      
      if (permission === "granted") {
        new Notification(title, { body, icon: '/vite.svg' }); // Optional icon
      } else if (permission !== "denied" && typeof Notification.requestPermission === "function") {
        Notification.requestPermission().then(permissionResult => {
          if (permissionResult === "granted") {
            new Notification(title, { body, icon: '/vite.svg' });
          }
        }).catch(err => {
          console.warn("Browser Notification request permission failed:", err);
        });
      }
    } catch (e) {
      console.warn("Browser Notifications are not supported or blocked (e.g. sandboxed iframe):", e);
    }
  }

  async markAsRead(id: number) {
    try {
      await db.notifications.update(id, { isRead: true });
    } catch (e) {
      console.error("Failed to mark notification as read:", e);
    }
  }

  async markAllAsRead() {
    try {
      const all = await db.notifications.toArray();
      const updates = all.filter(n => !n.isRead).map(n => ({ ...n, isRead: true }));
      await db.notifications.bulkPut(updates);
    } catch (e) {
      console.error("Failed to mark all notifications as read:", e);
    }
  }
}

export const notificationService = new NotificationService();

