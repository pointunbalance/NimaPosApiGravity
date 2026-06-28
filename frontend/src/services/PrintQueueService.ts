import { Order, AppSettings } from '../types';
import { printKitchenReceipt, printReceipt } from '../utils/printing';
import { notificationService } from '../utils/notifications';

interface PrintJob {
  id: string;
  type: 'kitchen' | 'receipt';
  order: Order;
  settings: AppSettings;
  status: 'pending' | 'processing' | 'failed';
  retries: number;
}

class PrintQueueManager {
  private queue: PrintJob[] = [];
  private isProcessing = false;

  addJob(job: Omit<PrintJob, 'id' | 'status' | 'retries'>) {
    const newJob: PrintJob = {
      ...job,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      status: 'pending',
      retries: 0
    };
    this.queue.push(newJob);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    const jobIndex = this.queue.findIndex(j => j.status === 'pending');
    if (jobIndex === -1) return; // No pending jobs

    this.isProcessing = true;
    const job = this.queue[jobIndex];
    job.status = 'processing';

    try {
      // Execute the print job efficiently in the background
      if (job.type === 'kitchen') {
        await printKitchenReceipt(job.order, job.settings);
      } else {
        await printReceipt(job.order, job.settings);
      }
      
      // Completion
      this.queue.splice(jobIndex, 1);
    } catch (e: any) {
      console.error(`Print job ${job.id} failed:`, e);
      job.status = 'failed';
      job.retries++;
      
      if (job.retries >= 3) {
        notificationService.addNotification("فشل الطباعة للطابعة المطبخ", `فشل الطباعة للطلب #${job.order.id || 'جديد'}. تم الإلغاء.`, "error");
        this.queue.splice(jobIndex, 1); // Give up
      } else {
        notificationService.addNotification("تأجيل الطباعة", `فشل الطباعة للطلب #${job.order.id || 'جديد'}، ستتم إعادة المحاولة لاحقاً...`, "warning");
        // Retry after 30 seconds
        setTimeout(() => {
          const failedJob = this.queue.find(j => j.id === job.id);
          if (failedJob) {
            failedJob.status = 'pending';
            this.processQueue();
          }
        }, 30000); 
      }
    } finally {
      this.isProcessing = false;
      // Process next job
      setTimeout(() => this.processQueue(), 500); 
    }
  }
}

export const printQueue = new PrintQueueManager();
