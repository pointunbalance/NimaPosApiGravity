
import { Order, AppSettings, Customer, ReceiptSection } from '../types';
import { hardwareService } from './hardware';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import html2canvas from 'html2canvas';
import { db } from '../db';

export const getPaymentMethodLabel = (method: string) => {
    switch(method){
        case 'cash': return 'نقدي';
        case 'card': return 'بطاقة';
        case 'credit': return 'آجل';
        case 'wallet': return 'محفظة';
        case 'split': return 'متعدد';
        default: return method;
    }
};

export const generateReceiptText = (order: Order, settings: AppSettings, customer?: Customer | null): string => {
  const currency = settings.currencyCode || 'IQD';
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', { style: 'decimal', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(date));
  };

  const getOrderType = (type?: string) => {
      if(type === 'dine-in') return 'بيع مباشر' + (order.tableNumber ? ` (طاولة ${order.tableNumber})` : '');
      if(type === 'delivery') return 'توصيل';
      return 'سفري';
  };

  let text = '';
  
  text += `🏪 *${settings.storeName || 'Nima POS'}*\n`;
  if (settings.address) text += `📍 ${settings.address}\n`;
  if (settings.phone) text += `📞 ${settings.phone}\n`;
  if (settings.receiptHeader) text += `\n${settings.receiptHeader}\n`;
  
  text += `\n--------------------------------\n`;
  text += `🧾 رقم الفاتورة: #${order.referenceNumber || order.id}\n`;
  if (order.orderType === 'dine-in') {
      text += `📅 وقت الجلوس: ${formatDate(order.date)}\n`;
      if (order.completedAt) {
          text += `📅 وقت المغادرة: ${formatDate(order.completedAt)}\n`;
      }
  } else {
      text += `📅 التاريخ: ${formatDate(order.completedAt || order.date)}\n`;
  }
  text += `نوع الطلب: ${getOrderType(order.orderType)}\n`;
  if (order.cashierName) text += `الكاشير: ${order.cashierName}\n`;
  if (customer) text += `العميل: ${customer.name}\n`;
  text += `--------------------------------\n\n`;
  
  text += `*المنتجات:*\n`;
  order.items.forEach(item => {
      text += `▪️ ${item.name}\n`;
      if (item.selectedModifiers && item.selectedModifiers.length > 0) {
          text += `   (${item.selectedModifiers.map(m => m.optionName).join(', ')})\n`;
      }
      text += `   ${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(item.total)} ${currency}\n`;
  });
  
  text += `\n--------------------------------\n`;
  text += `المجموع الفرعي: ${formatCurrency(order.subtotalAmount || order.totalAmount)} ${currency}\n`;
  if (order.discountAmount) text += `الخصم: -${formatCurrency(order.discountAmount)} ${currency}\n`;
  if (order.taxAmount) text += `الضريبة: ${formatCurrency(order.taxAmount)} ${currency}\n`;
  if (order.deliveryFee) text += `رسوم التوصيل: ${formatCurrency(order.deliveryFee)} ${currency}\n`;
  text += `*الإجمالي: ${formatCurrency(order.totalAmount)} ${currency}*\n`;
  text += `--------------------------------\n`;
  
  if (settings.receiptFooter) text += `\n${settings.receiptFooter}\n`;
  if (order.id) {
    text += `\n🌟 امسح الكود لتقييم تجربتك أو زر الرابط التالي:\n`;
    text += `${window.location.origin}/#/feedback/${order.id}\n`;
  }
  text += `\n🙏 شكراً لزيارتكم!`;

  return text;
};

export const printKitchenReceipt = async (order: Order, settings: AppSettings) => {
  // Fetch printing routing data
  const products = await db.products.toArray();
  const categoriesDb = await db.categories.toArray();
  const printers = await db.printers.toArray();

  const productMap = new Map(products.map(p => [p.id, p]));
  const categoryMap = new Map(categoriesDb.map(c => [c.name, c]));
  
  // Group items by printer ID (null = default/no specific printer)
  const groupedItems = new Map<number | null, typeof order.items>();
  order.items.forEach(item => {
      const product = productMap.get(item.productId);
      let printerId: number | null = null;
      if (product && product.category) {
          const category = categoryMap.get(product.category);
          if (category && category.targetPrinterId) {
              printerId = category.targetPrinterId;
          }
      }
      if (!groupedItems.has(printerId)) {
          groupedItems.set(printerId, []);
      }
      groupedItems.get(printerId)!.push(item);
  });

  // For each printer group, print a separate receipt in parallel
  const printJobs = Array.from(groupedItems.entries()).map(async ([printerId, items]) => {
      const printerConfig = printerId ? printers.find(p => p.id === printerId) : null;
      
      const width = printerConfig ? `${printerConfig.paperWidth || 80}mm` : (settings.printerWidth === '58mm' ? '58mm' : '80mm');
      const fontSize = settings.printerWidth === '58mm' ? '12px' : '14px';
      const margin = settings.printerWidth === '58mm' ? '0' : '2mm';
      const printerNameStr = printerConfig ? `<div style="text-align:center; font-size: 0.9em; margin-bottom: 5px;">[توجيه: ${printerConfig.name}]</div>` : '';

      // Set up an iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      
      const doc = iframe.contentWindow?.document;
      if(!doc) return;

      const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('ar-IQ', {
          hour: '2-digit', minute: '2-digit'
        }).format(new Date(date));
      };

      const getOrderType = (type?: string) => {
          if(type === 'dine-in') return 'محلي' + (order.tableNumber ? ` (طاولة ${order.tableNumber})` : '');
          if(type === 'delivery') return 'توصيل';
          return 'سفري';
      };

      let html = `
        <html>
          <head>
            <title>Kitchen Receipt - ${printerConfig?.name || 'Default'}</title>
            <style>
              @page { size: ${width} auto; margin: 0; }
              body { 
                font-family: system-ui, -apple-system, sans-serif; 
                font-size: ${fontSize}; 
                color: black; 
                margin: ${margin};
                padding: 10px 5px;
                text-align: right;
                direction: rtl;
              }
              .title { font-size: 1.8em; font-weight: 900; text-align: center; margin-bottom: 10px; border-bottom: 3px solid black; padding-bottom: 10px;}
              .order-type-box { font-size: 2.2em; font-weight: 900; text-align: center; border: 4px solid black; padding: 10px; margin-bottom: 15px; border-radius: 8px;}
              .info { display: flex; justify-content: space-between; font-weight: 700; margin-bottom: 5px; font-size: 1.2em;}
              .item { margin-bottom: 10px; font-weight: 900; font-size: 1.6em; border-top: 2px dashed #000; padding-top: 15px;}
              .modifiers { padding-right: 20px; font-size: 1.2em; font-weight: 900; margin-bottom: 5px;}
              .note { padding-right: 20px; font-size: 1.3em; font-weight: 900; border-right: 4px solid black; margin-right: 10px; padding-right: 10px; text-decoration: underline;}
              .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 3px solid black; font-weight: 900; font-size: 1.2em; }
            </style>
          </head>
          <body>
            <div class="order-type-box">${getOrderType(order.orderType)}</div>
            <div class="title">تجهيز الطلب</div>
            ${printerNameStr}
            <div class="info" style="margin-bottom: 15px; border-bottom: 2px solid black; padding-bottom: 10px;">
              <span>الطلب #${order.id || order.referenceNumber || 'جديد'}</span>
              <span>الوقت: ${formatDate(order.date)}</span>
            </div>
            <div>
      `;

      items.forEach(item => {
          html += `<div class="item">⮜ ${item.quantity}  ×  ${item.name}</div>`;
          if (item.selectedModifiers && item.selectedModifiers.length > 0) {
              html += `<div class="modifiers">+ ${item.selectedModifiers.map(m => m.optionName).join('، ')}</div>`;
          }
          if (item.note) {
              html += `<div class="note">ملاحظة: ${item.note}</div>`;
          }
      });

      if (order.note) {
          html += `<div style="margin-top: 15px; border-top: 2px solid black; padding-top: 10px;" class="info">ملاحظة الطلب: ${order.note}</div>`;
      }

      html += `
            </div>
            <div class="footer">--- نهاية البون ---</div>
          </body>
        </html>
      `;

      doc.open();
      doc.write(html);
      doc.close();

      iframe.contentWindow?.focus();
      
      // We must wait slightly to allow the print dialogs to sequentially fire properly, 
      // although browser printing generally blocks per frame until acknowledged.
      // A small delay ensures the content is loaded securely.
      await new Promise(resolve => setTimeout(resolve, 500)); // wait for DOM

      try {
          if (iframe.contentWindow && iframe.contentWindow.document.body) {

                await iframe.contentWindow.document.fonts.ready;

                const canvas = await html2canvas(doc.body, {
                    scale: 2, // High resolution for thermal printing
                    useCORS: true,
                    logging: false
                });

                const img = doc.createElement('img');
                img.src = canvas.toDataURL('image/png');
                img.style.width = '100%';
                
                // Clear body and append only the image
                doc.body.innerHTML = '';
                doc.body.style.padding = '0';
                doc.body.style.margin = '0';
                doc.body.appendChild(img);

                // Give image a moment to render
                await new Promise(resolve => setTimeout(resolve, 100));
          }
      } catch (err) {
          console.error("Failed to rasterize receipt to image:", err);
          // Fallback to standard printing if html2canvas fails
      }

      iframe.contentWindow?.print();
      
      setTimeout(() => {
          document.body.removeChild(iframe);
      }, 500);
  });

  await Promise.all(printJobs);
};

export const printReceipt = async (order: Order, settings: AppSettings, customer?: Customer | null) => {
  const currency = settings.currency || 'IQD';
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', { style: 'decimal', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(date));
  };

  const getOrderType = (type?: string) => {
      if(type === 'dine-in') return 'بيع مباشر' + (order.tableNumber ? ` (طاولة ${order.tableNumber})` : '');
      if(type === 'delivery') return 'توصيل';
      return 'استلام';
  };

  // Check if hardware printer is enabled and connected
  if (settings.useHardwarePrinter && hardwareService.isConnected()) {
      try {
          // Open cash drawer first
          await hardwareService.openCashDrawer();

          // Build plain text receipt
          let text = '';
          const center = (str: string, width = 32) => {
              const padding = Math.max(0, Math.floor((width - str.length) / 2));
              return ' '.repeat(padding) + str + '\n';
          };
          const leftRight = (left: string, right: string, width = 32) => {
              const spaces = Math.max(1, width - left.length - right.length);
              return left + ' '.repeat(spaces) + right + '\n';
          };

          text += center(settings.storeName || 'Nima POS');
          if (settings.address) text += center(settings.address);
          if (settings.phone) text += center(settings.phone);
          if (settings.receiptHeader) text += center(settings.receiptHeader);
          
          text += '-'.repeat(32) + '\n';
          if (order.orderType === 'dine-in') {
              text += leftRight(`رقم: #${order.id}`, '');
              text += leftRight(`الجلوس:`, formatDate(order.date));
              if (order.completedAt) {
                  text += leftRight(`المغادرة:`, formatDate(order.completedAt));
              }
          } else {
              text += leftRight(`رقم: #${order.id}`, formatDate(order.completedAt || order.date));
          }
          text += leftRight(getOrderType(order.orderType), order.cashierName || 'كاشير');
          if (customer) {
              text += `العميل: ${customer.name}\n`;
          }
          text += '-'.repeat(32) + '\n';
          
          text += leftRight('الصنف', 'السعر');
          text += '-'.repeat(32) + '\n';
          
          order.items.forEach(item => {
              text += `${item.name}\n`;
              if (item.selectedModifiers && item.selectedModifiers.length > 0) {
                  text += `  (${item.selectedModifiers.map(m => m.optionName).join(', ')})\n`;
              }
              text += leftRight(`  ${item.quantity} x ${formatCurrency(item.price)}`, formatCurrency(item.total));
          });
          
          text += '-'.repeat(32) + '\n';
          text += leftRight('المجموع:', formatCurrency(order.subtotalAmount || order.totalAmount));
          if (order.discountAmount) text += leftRight('الخصم:', formatCurrency(order.discountAmount) + '-');
          if (order.taxAmount) text += leftRight('الضريبة:', formatCurrency(order.taxAmount));
          text += leftRight('الإجمالي:', `${formatCurrency(order.totalAmount)} ${currency}`);
          
          text += '-'.repeat(32) + '\n';
          text += `طريقة الدفع: ${getPaymentMethodLabel(order.paymentMethod)}\n`;
          if (order.paymentMethod === 'credit') {
              text += `المدفوع الان:  ${formatCurrency(order.paidAmount || 0)} ${currency}\n`;
              text += `المبلغ الآجل:  ${formatCurrency(order.totalAmount - (order.paidAmount || 0))} ${currency}\n`;
          }
          
          text += '-'.repeat(32) + '\n';
          if (settings.receiptFooter) text += center(settings.receiptFooter);
          text += center('شكراً لزيارتكم');
          text += '\n\n';

          await hardwareService.printText(text, settings.enableDualPrinting);
          return; // Exit, don't use browser print
      } catch (error) {
          console.error('Hardware printing failed, falling back to browser print:', error);
          // Fallback to browser print if hardware fails
      }
  }

  // 1. Create a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  
  const doc = iframe.contentWindow?.document;
  if(!doc) return;

  // 2. Prepare Data
  const width = settings.printerWidth === '58mm' ? '58mm' : '80mm';
  const fontSize = settings.printerWidth === '58mm' ? '10px' : '12px';
  const margin = settings.printerWidth === '58mm' ? '0' : '2mm';

  // Calculate Barcode and QR Images if needed
  let qrUrl = '';
  if (settings.enableQr) {
      try {
          qrUrl = await QRCode.toDataURL(String(order.id), { errorCorrectionLevel: 'M', margin: 1, width: 100 });
      } catch (err) {}
  }
  let barcodeUrl = '';
  try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, String(order.id), {
          format: "CODE128",
          width: 1.5,
          height: 30,
          displayValue: true,
          fontSize: 14,
          margin: 0
      });
      barcodeUrl = canvas.toDataURL();
  } catch (err) {}

  // 3. Define Layout Generators
  const defaultLayout: ReceiptSection[] = [
      { id: 'logo', label: 'الشعار', visible: true, type: 'logo' },
      { id: 'store_name', label: 'اسم المتجر', visible: true, type: 'store_name' },
      { id: 'header', label: 'رسالة الرأس', visible: true, type: 'header' },
      { id: 'divider1', label: 'فاصل', visible: true, type: 'divider' },
      { id: 'customer', label: 'بيانات الفاتورة والعميل', visible: true, type: 'customer' },
      { id: 'items', label: 'قائمة الأصناف', visible: true, type: 'items' },
      { id: 'divider2', label: 'فاصل', visible: true, type: 'divider' },
      { id: 'totals', label: 'المجاميع', visible: true, type: 'totals' },
      { id: 'qr', label: 'رمز QR', visible: true, type: 'qr' },
      { id: 'footer', label: 'رسالة التذييل', visible: true, type: 'footer' },
      { id: 'barcode', label: 'باركود الفاتورة', visible: false, type: 'barcode' },
  ];

  const layout = settings.receiptLayout || defaultLayout;

  const renderSection = (section: ReceiptSection): string => {
      if (!section.visible) return '';

      switch (section.type) {
          case 'logo':
              return settings.logo 
                  ? `<div style="text-align: center; margin-bottom: 5px;"><img src="${settings.logo}" style="max-width: 60%; max-height: 80px;" /></div>` 
                  : '';
          
          case 'store_name':
              return `<div style="text-align: center; font-size: 1.2em; font-weight: bold; margin-bottom: 2px;">${settings.storeName || 'Nima POS'}</div>
                      <div style="text-align: center; font-size: 0.9em;">${settings.address || ''}</div>
                      <div style="text-align: center; font-size: 0.9em;" dir="ltr">${settings.phone || ''}</div>`;
          
          case 'header':
              return settings.receiptHeader ? `<div style="text-align: center; font-size: 0.9em; margin: 5px 0;">${settings.receiptHeader}</div>` : '';

          case 'divider':
              return `<div style="border-bottom: 1px dashed black; margin: 5px 0;"></div>`;

          case 'customer':
              const dateFields = order.orderType === 'dine-in' ? `
                  <div style="display: flex; justify-content: space-between;">
                      <span>وقت الجلوس:</span>
                      <span>${formatDate(order.date)}</span>
                  </div>
                  ${order.completedAt ? `
                  <div style="display: flex; justify-content: space-between;">
                      <span>وقت المغادرة:</span>
                      <span>${formatDate(order.completedAt)}</span>
                  </div>` : ''}
              ` : `
                  <div style="display: flex; justify-content: space-between;">
                      <span>التاريخ:</span>
                      <span>${formatDate(order.completedAt || order.date)}</span>
                  </div>`;
                  
              return `
                <div style="font-size: 0.9em; margin-bottom: 5px;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>رقم: #${order.id}</span>
                    </div>
                    ${dateFields}
                    <div style="display: flex; justify-content: space-between;">
                        <span style="font-weight: bold;">${getOrderType(order.orderType)}</span>
                        <span>${order.cashierName || 'كاشير'}</span>
                    </div>
                    ${customer ? `
                    <div style="border-top: 1px dashed #ccc; margin-top: 2px; padding-top: 2px;">
                        <div>العميل: ${customer.name}</div>
                    </div>` : ''}
                </div>`;

          case 'items':
              const rows = order.items.map(item => `
                  <tr>
                      <td style="width: 55%; text-align: right; vertical-align: top;">
                          ${item.name}
                          ${item.serials && item.serials.length > 0 ? `<div style="font-size: 0.8em; color: #555;">[SN: ${item.serials.join(', ')}]</div>` : ''}
                          ${item.selectedModifiers && item.selectedModifiers.length > 0 ? `<div style="font-size: 0.8em; color: #555;">${item.selectedModifiers.map(m => m.optionName).join(', ')}</div>` : ''}
                      </td>
                      <td style="width: 15%; text-align: center; vertical-align: top;">${item.quantity}</td>
                      <td style="width: 30%; text-align: left; vertical-align: top;">${formatCurrency(item.total)}</td>
                  </tr>
              `).join('');
              
              return `
                  <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                      <thead>
                          <tr style="border-bottom: 1px solid black;">
                              <th style="text-align: right; padding-bottom: 2px;">الصنف</th>
                              <th style="text-align: center; padding-bottom: 2px;">العدد</th>
                              <th style="text-align: left; padding-bottom: 2px;">السعر</th>
                          </tr>
                      </thead>
                      <tbody>${rows}</tbody>
                  </table>`;

          case 'totals':
              return `
                  <div style="margin-top: 5px; font-size: 0.9em;">
                      <div style="display: flex; justify-content: space-between;">
                          <span>المجموع:</span>
                          <span>${formatCurrency(order.subtotalAmount || order.totalAmount)}</span>
                      </div>
                      ${order.discountAmount ? `
                      <div style="display: flex; justify-content: space-between;">
                          <span>الخصم:</span>
                          <span>${formatCurrency(order.discountAmount)}-</span>
                      </div>` : ''}
                      ${order.taxAmount ? `
                      <div style="display: flex; justify-content: space-between;">
                          <span>الضريبة:</span>
                          <span>${formatCurrency(order.taxAmount)}</span>
                      </div>` : ''}
                      <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2em; margin-top: 5px; border-top: 1px solid black; padding-top: 2px;">
                          <span>الإجمالي:</span>
                          <span>${formatCurrency(order.totalAmount)} ${currency}</span>
                      </div>
                      <div style="margin-top: 5px; font-size: 0.8em; color: #555;">
                          <div>طريقة الدفع: ${getPaymentMethodLabel(order.paymentMethod)}</div>
                          ${order.paymentMethod === 'credit' ? `
                              <div>المدفوع الان: ${formatCurrency(order.paidAmount || 0)} ${currency}</div>
                              <div>المبلغ الآجل: ${formatCurrency(order.totalAmount - (order.paidAmount || 0))} ${currency}</div>
                          ` : ''}
                      </div>
                  </div>`;

          case 'qr':
              return settings.enableQr && qrUrl
                  ? `<div style="text-align: center; margin: 10px 0;">
                       <img src="${qrUrl}" alt="QR" style="max-width: 100px; max-height: 100px;" />
                     </div>` 
                  : '';
          
          case 'footer':
              return `
                  <div style="text-align: center; font-size: 0.8em; margin-top: 10px;">
                      ${settings.receiptFooter ? `<p style="margin: 0; white-space: pre-wrap;">${settings.receiptFooter}</p>` : ''}
                      <p style="margin-top: 5px;">شكراً لزيارتكم</p>
                  </div>`;
          
          case 'barcode':
               return barcodeUrl ? `<div style="text-align: center; margin-top: 5px;"><img src="${barcodeUrl}" alt="Barcode" style="max-width: 100%;" /></div>` : '';

          default: return '';
      }
  };


  // 4. Generate HTML Content
  let contentBody = layout.map(section => renderSection(section)).join('');

  if (settings.enableDualPrinting) {
      contentBody = contentBody + `
      <div style="page-break-after: always; margin: 20px 0; border-bottom: 2px dashed #ccc;"></div>
      <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">--- نسخة إضافية ---</div>
      ` + contentBody;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>Receipt #${order.id}</title>
      <style>
        @page { margin: 0; size: auto; }
        body { 
            margin: 0; 
            padding: ${margin}; 
            font-family: system-ui, -apple-system, sans-serif; 
            font-weight: 600;
            font-size: ${fontSize};
            background-color: white;
            color: black;
            width: ${width};
        }
      </style>
    </head>
    <body>
      ${contentBody}
    </body>
    </html>
  `;

  // 5. Write & Print
  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.contentWindow?.focus();  
  // Wait for DOM
  setTimeout(async () => {
    try {
        if (iframe.contentWindow && iframe.contentWindow.document.body) {
            await iframe.contentWindow.document.fonts.ready;

            const canvas = await html2canvas(doc.body, {
                scale: 2, // High resolution for thermal printing
                useCORS: true,
                logging: false
            });

            const img = doc.createElement('img');
            img.src = canvas.toDataURL('image/png');
            img.style.width = '100%';
            
            // Clear body and append only the image
            doc.body.innerHTML = '';
            doc.body.style.padding = '0';
            doc.body.style.margin = '0';
            doc.body.appendChild(img);

            // Give image a moment to render
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    } catch (err) {
        console.error("Failed to rasterize receipt to image:", err);
    }
    
    iframe.contentWindow?.print();
      
    // Cleanup after print dialog closes (or timeout)
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 500);
  }, 400);
};
