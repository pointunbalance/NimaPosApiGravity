import { Rental } from '../../types';

export const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('ar-EG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const printContract = (rental: Rental, rentalItems: any[], settings: any, formatCurrency: (amount: number) => string) => {
  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) return;

  const productDetails = rentalItems?.find((p) => p.id === rental.productId);

  const html = `
    <html dir="rtl" lang="ar">
    <head><title>عقد تأجير #${rental.id}</title>
    <style>
        body { font-family: 'Tahoma', sans-serif; padding: 20px; border: 2px solid #333; margin: 10px; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px; }
        .label { font-weight: bold; width: 150px; }
        .parts { margin: 10px 0; padding: 10px; background: #f0f0f0; font-size: 12px; }
        .footer { margin-top: 50px; display: flex; justify-content: space-between; }
    </style>
    </head>
    <body>
        <div class="header">
            <h2>${settings?.storeName || 'متجر التأجير'}</h2>
            <h3>عقد تأجير ملابس</h3>
            <p>رقم العقد: #${rental.id}</p>
        </div>
        <div class="row"><span class="label">العميل:</span><span>${rental.customerName}</span></div>
        <div class="row"><span class="label">رقم الهاتف:</span><span>${rental.customerPhone || '-'}</span></div>
        <div class="row"><span class="label">القطعة:</span><span>${rental.productName}</span></div>
        
        ${
          productDetails?.parts && productDetails.parts.length > 0
            ? `
        <div class="parts">
            <strong>مكونات القطعة (يجب إرجاعها بالكامل):</strong><br/>
            ${productDetails.parts.join(' - ')}
        </div>
        `
            : ''
        }

        <div class="row"><span class="label">تاريخ الاستلام:</span><span>${formatDate(rental.pickupDate)}</span></div>
        <div class="row"><span class="label">تاريخ الإرجاع:</span><span>${formatDate(rental.returnDate)}</span></div>
        
        <div class="row" style="margin-top: 20px;">
            <span class="label">قيمة الإيجار:</span>
            <b>${formatCurrency(rental.price)}</b>
        </div>
        <div class="row">
            <span class="label">التأمين (مسترد):</span>
            <b>${formatCurrency(rental.deposit)}</b>
        </div>

        <div class="footer">
            <div>توقيع العميل: .................</div>
            <div>توقيع المتجر: .................</div>
        </div>
        <script>window.print();</script>
    </body></html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};

export const sendWhatsApp = (rental: Rental) => {
  if (!rental.customerPhone) return;
  const phone = rental.customerPhone.replace(/[^0-9]/g, '');
  const text = `مرحبا ${rental.customerName}، تذكير بموعد إرجاع ${rental.productName} بتاريخ ${formatDate(rental.returnDate)}.`;
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
};
