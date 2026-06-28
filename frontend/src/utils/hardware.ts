export class HardwareService {
  private port1: any = null; // SerialPort
  private port2: any = null; // Secondary SerialPort

  async connectReceiptPrinter(isSecondary = false) {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API غير مدعوم في هذا المتصفح. يرجى استخدام Google Chrome أو Edge.');
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 }); // Default baud rate for many thermal printers
      
      if (isSecondary) {
        this.port2 = port;
      } else {
        this.port1 = port;
      }
      return true;
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      throw error;
    }
  }

  async disconnect(isSecondary = false) {
    if (isSecondary) {
      if (this.port2) {
        await this.port2.close();
        this.port2 = null;
      }
    } else {
      if (this.port1) {
        await this.port1.close();
        this.port1 = null;
      }
    }
  }

  isConnected(isSecondary = false) {
    return isSecondary ? this.port2 !== null : this.port1 !== null;
  }

  async openCashDrawer() {
    // Only open drawer on primary printer
    if (!this.port1) {
      throw new Error('الطابعة الأساسية غير متصلة');
    }
    try {
      const writer = this.port1.writable.getWriter();
      // ESC p 0 25 250 (Open Drawer 1)
      const data = new Uint8Array([0x1B, 0x70, 0x00, 0x19, 0xFA]);
      await writer.write(data);
      writer.releaseLock();
    } catch (error) {
      console.error('Failed to open cash drawer:', error);
      throw error;
    }
  }

  private async _printToPort(port: any, text: string) {
    const writer = port.writable.getWriter();
    const encoder = new TextEncoder();
    
    // Init printer (ESC @)
    await writer.write(new Uint8Array([0x1B, 0x40]));
    
    // Write text
    await writer.write(encoder.encode(text));
    
    // Feed and cut (GS V A)
    await writer.write(new Uint8Array([0x0A, 0x0A, 0x0A, 0x0A, 0x1D, 0x56, 0x41, 0x10]));
    
    writer.releaseLock();
  }

  async printText(text: string, dualPrint = false) {
    if (!this.port1 && !this.port2) {
        throw new Error('لا توجد طابعات متصلة');
    }
    
    try {
      if (this.port1) {
        await this._printToPort(this.port1, text);
        
        // If dual print is enabled but no second printer exists, print a second copy on the first printer
        if (dualPrint && !this.port2) {
          await new Promise(resolve => setTimeout(resolve, 500)); // Delay between prints
          await this._printToPort(this.port1, "\n--- نسخة إضافية ---\n\n" + text);
        }
      }

      // If dual print is enabled AND a second printer is connected, print to it
      if (dualPrint && this.port2) {
        await this._printToPort(this.port2, "\n--- نسخة للمطابخ / إضافية ---\n\n" + text);
      }
    } catch (error) {
      console.error('Failed to print:', error);
      throw error;
    }
  }
  async sendToPaymentTerminal(amount: number): Promise<boolean> {
    try {
      console.log(`Sending amount ${amount} to payment terminal via local IP/Serial...`);
      // Simulating terminal processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true; // Simulate approved
    } catch (error) {
      console.error('Terminal error:', error);
      throw error;
    }
  }

  async readScale(): Promise<number> {
    // محاكاة قراءة الميزان
    try {
        console.log('Reading from scale...');
        await new Promise(resolve => setTimeout(resolve, 800));
        const randomWeight = (Math.random() * 5 + 0.1).toFixed(3); // Random weight between 0.1 and 5.1 kg
        return Number(randomWeight);
    } catch (error) {
        console.error('Scale error:', error);
        throw new Error('فشل في قراءة الميزان');
    }
  }
}

export const hardwareService = new HardwareService();
