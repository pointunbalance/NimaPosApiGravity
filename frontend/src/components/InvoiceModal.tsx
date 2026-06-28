
import React, { useRef } from 'react';
import { Order, AppSettings, Customer } from '../types';
import { X, Printer, MessageCircle, Smartphone } from 'lucide-react';
import { printQueue } from '../services/PrintQueueService';
import { generateReceiptText } from '../utils/printing';
import { QRCodeSVG } from 'qrcode.react';
import { generateZatcaQR } from '../utils/zatca';

interface InvoiceModalProps {
  order: Order;
  settings?: AppSettings;
  customer?: Customer;
  onClose: () => void;
  isProforma?: boolean;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, settings, customer, onClose, isProforma }) => {
  
  const handlePrint = () => {
    if (settings) {
        printQueue.addJob({ type: 'receipt', order: order, settings: settings });
    } else {
        window.print();
    }
  };

  const handleWhatsApp = () => {
      if (!settings) return;
      const text = generateReceiptText(order, settings, customer);
      const encodedText = encodeURIComponent(text);
      
      // If we have customer phone, pre-fill it. Otherwise just open WhatsApp to select contact.
      const phone = customer?.phone ? customer.phone.replace(/\D/g, '') : '';
      const url = phone ? `https://wa.me/${phone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
      
      window.open(url, '_blank');
  };

  const handleSMS = () => {
      if (!settings) return;
      const text = generateReceiptText(order, settings, customer);
      const encodedText = encodeURIComponent(text);
      
      const phone = customer?.phone ? customer.phone.replace(/\D/g, '') : '';
      const url = phone ? `sms:${phone}?body=${encodedText}` : `sms:?body=${encodedText}`;
      
      window.open(url, '_self');
  };

  const currencyCode = settings?.currencyCode || 'EGP';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long', // Use long month (يناير)
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getOrderTypeLabel = (type?: string) => {
      switch(type) {
          case 'dine-in': return 'محلي (Dine-in)';
          case 'takeaway': return 'سفري (Takeaway)';
          case 'delivery': return 'توصيل (Delivery)';
          default: return 'سفري';
      }
  };

  const qrData = generateZatcaQR(
      settings?.storeName || 'Nima Pos',
      settings?.taxNumber || '000000000000000',
      order.date || new Date(),
      order.totalAmount || 0,
      order.taxAmount || 0
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:block">
      
      {/* Print Styles Injection for Window.print fallback */}
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #invoice-modal-content, #invoice-modal-content * { visibility: visible; }
            #invoice-modal-content { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%; 
              max-width: 80mm; /* Standard Thermal Width */
              margin: 0 auto;
              padding: 10px;
              box-shadow: none;
              border: none;
              background: white;
            }
            .no-print { display: none !important; }
          }
        `}
      </style>

      <div 
        id="invoice-modal-content"
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header - No Print Close Button */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center no-print">
          <h3 className="font-bold text-gray-800">
             {isProforma ? 'معاينة الفاتورة' : `فاتورة طلب #${order.id || ''}`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 overflow-y-auto text-sm text-gray-800 font-mono leading-relaxed text-center">
            
            {/* Store Info */}
            <div className="mb-4 pb-4 border-b border-dashed border-gray-300">
                <h2 className="text-xl font-bold mb-1">{settings?.storeName || 'Nima Pos'}</h2>
                
                {settings?.receiptHeader && (
                    <p className="text-xs font-bold mb-2 mt-1">{settings.receiptHeader}</p>
                )}

                {settings?.address && <p className="text-xs text-gray-500">{settings.address}</p>}
                {settings?.phone && <p className="text-xs text-gray-500" dir="ltr">{settings.phone}</p>}
            </div>

            {/* Order Info */}
            <div className="mb-4 text-xs flex flex-col gap-1 text-gray-600">
                <div className="flex justify-between font-bold text-black text-sm border-b border-dashed pb-1 mb-1">
                    <span>{getOrderTypeLabel(order.orderType)}</span>
                    {order.tableNumber && <span>طاولة: {order.tableNumber}</span>}
                </div>
                <div className="flex justify-between">
                    <span>رقم الفاتورة: #{order.referenceNumber || order.id}</span>
                    <span>{formatDate(order.date)}</span>
                </div>
                <div className="flex justify-between">
                    <span>الكاشير: {order.cashierName || 'غير معروف'}</span>
                </div>
                {customer && (
                    <div className="flex justify-between border-t border-dashed pt-1 mt-1">
                        <span>العميل: {customer.name}</span>
                    </div>
                )}
            </div>

            {/* Items */}
            <div className="mb-4">
                <table className="w-full text-right text-xs">
                    <thead>
                        <tr className="border-b border-gray-800">
                            <th className="py-1">المنتج</th>
                            <th className="py-1 text-center">الكمية</th>
                            <th className="py-1 text-left">السعر</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {order.items.map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-1.5">
                                    <div>{item.name}</div>
                                    {item.variantName && <div className="text-[10px] text-gray-600">النوع: {item.variantName}</div>}
                                    {item.unitName && item.unitName !== 'Piece' && <div className="text-[10px] text-gray-600">الوحدة: {item.unitName}</div>}
                                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                            {item.selectedModifiers.map(m => m.optionName).join(', ')}
                                        </div>
                                    )}
                                    {item.serials && item.serials.length > 0 && (
                                        <div className="text-[9px] text-gray-400 mt-0.5">S/N: {item.serials.join(', ')}</div>
                                    )}
                                    {item.note && <div className="text-[10px] text-gray-500 mt-0.5 font-bold italic">*{item.note}</div>}
                                </td>
                                <td className="py-1.5 text-center">{item.quantity}</td>
                                <td className="py-1.5 text-left">{formatCurrency(item.total)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-gray-300 pt-3 space-y-1">
                <div className="flex justify-between text-xs">
                    <span>المجموع الفرعي</span>
                    <span>{formatCurrency(order.subtotalAmount || order.totalAmount)}</span>
                </div>
                
                {order.discountAmount && order.discountAmount > 0 ? (
                    <div className="flex justify-between text-xs text-red-600">
                        <span>الخصم</span>
                        <span>-{formatCurrency(order.discountAmount)}</span>
                    </div>
                ) : null}

                {order.taxAmount ? (
                    <div className="flex justify-between text-xs">
                        <span>الضريبة</span>
                        <span>{formatCurrency(order.taxAmount)}</span>
                    </div>
                ) : null}
                
                <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t border-gray-800">
                    <span>الإجمالي</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                </div>
            </div>

            {/* ZATCA QR Code */}
            <div className="mt-6 flex justify-center">
                <div className="p-2 bg-white rounded-lg inline-block">
                    <QRCodeSVG value={qrData} size={120} level="M" />
                </div>
            </div>

            {/* Feedback QR Code */}
            {order.id && (
                <div className="mt-4 flex flex-col items-center justify-center border-t border-dashed border-gray-300 pt-4">
                    <p className="text-xs font-bold mb-2">امسح الكود لتقييم تجربتك 🌟</p>
                    <div className="p-1 bg-white rounded-lg inline-block">
                        <QRCodeSVG value={`${window.location.origin}/#/feedback/${order.id}`} size={80} level="M" />
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="mt-4 text-center text-xs text-gray-500">
                {settings?.receiptFooter && (
                    <p className="mb-2 font-bold whitespace-pre-wrap">{settings.receiptFooter}</p>
                )}
                <p>شكراً لزيارتكم!</p>
                <p className="mt-1 font-mono text-[10px] opacity-70">Powered by Nima Pos</p>
            </div>
        </div>

        {/* Actions - No Print */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 no-print flex flex-col gap-3">
          <div className="flex gap-3">
              <button 
                onClick={handlePrint}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200"
              >
                <Printer className="w-5 h-5" />
                طباعة إيصال حراري
              </button>
              <button 
                onClick={() => {
                  const printWindow = window.open('', '', 'width=900,height=1200');
                  if (!printWindow) return;
                  const itemsRows = order.items.map((item, idx) => `
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 10px;">${idx + 1}</td>
                        <td style="padding: 10px;">${item.name} ${item.variantName ? `- ${item.variantName}` : ''}</td>
                        <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                        <td style="padding: 10px; text-align: left;">${formatCurrency(item.price)}</td>
                        <td style="padding: 10px; text-align: left; font-weight: bold;">${formatCurrency(item.total)}</td>
                    </tr>
                  `).join('');
                  printWindow.document.write(`
                    <html dir="rtl" lang="ar">
                      <head>
                        <title>فاتورة مبيعات ${order.id ? '#' + order.id : ''}</title>
                        <style>
                          body { font-family: 'Tahoma', sans-serif; padding: 40px; color: #333; max-width: 210mm; margin: auto; }
                          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
                          .company-info h1 { margin: 0; color: #1e1b4b; }
                          .quote-title { font-size: 24px; font-weight: bold; color: #6366f1; text-transform: uppercase; }
                          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                          .box { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
                          .box h3 { margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-transform: uppercase; }
                          .box p { margin: 0; font-weight: bold; font-size: 16px; color: #0f172a; }
                          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                          th { background-color: #1e1b4b; color: white; padding: 12px; text-align: right; }
                          .totals { display: flex; justify-content: flex-end; }
                          .totals-box { width: 300px; }
                          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
                          .totals-row.final { font-size: 18px; font-weight: bold; border-top: 2px solid #333; border-bottom: none; margin-top: 10px; padding-top: 10px; }
                          .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #eee; padding-top: 20px; }
                          .logo { max-height: 80px; max-width: 150px; object-fit: contain; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <div class="company-info">
                            ${settings?.logo ? '<img src="'+settings.logo+'" class="logo" />' : '<h1>'+(settings?.storeName || 'Nima POS')+'</h1>'}
                            <p>${settings?.address || ''}</p>
                            <p dir="ltr">${settings?.phone || ''}</p>
                          </div>
                          <div style="text-align: left;">
                            <div class="quote-title">${isProforma ? 'فاتورة مبدئية' : 'فاتورة مبيعات ضريبية'}</div>
                            <p style="margin: 5px 0;">تاريخ: ${formatDate(order.date)}</p>
                            <p style="margin: 5px 0;">رقم: #${order.id || 'N/A'}</p>
                          </div>
                        </div>
                        
                        <div class="info-grid">
                          <div class="box">
                            <h3>معلومات العميل</h3>
                            <p>${customer?.name || 'عميل نقدي'}</p>
                            ${customer?.phone ? '<p style="font-weight: normal; font-size: 14px; margin-top: 5px;">هاتف: '+customer.phone+'</p>' : ''}
                            ${customer?.taxNumber ? '<p style="font-weight: normal; font-size: 14px;">الرقم الضريبي: '+customer.taxNumber+'</p>' : ''}
                            ${customer?.address ? '<p style="font-weight: normal; font-size: 14px;">العنوان: '+customer.address+'</p>' : ''}
                          </div>
                          <div class="box">
                            <h3>تفاصيل الدفع</h3>
                            <p>طريقة الدفع: ${
                                order.paymentMethod === 'cash' ? 'نقدي' : 
                                order.paymentMethod === 'card' ? 'بطاقة' : 
                                order.paymentMethod === 'credit' ? 'آجل' : 
                                order.paymentMethod === 'wallet' ? 'محفظة' : 'متعدد'
                            }</p>
                            <p style="font-weight: normal; font-size: 14px; margin-top: 5px;">الكاشير: ${order.cashierName || '-'}</p>
                          </div>
                        </div>

                        <table>
                          <thead>
                            <tr>
                              <th style="width: 50px;">#</th>
                              <th>البيان</th>
                              <th style="width: 100px; text-align: center;">الكمية</th>
                              <th style="width: 150px; text-align: left;">سعر الوحدة</th>
                              <th style="width: 150px; text-align: left;">الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${itemsRows}
                          </tbody>
                        </table>

                        <div class="totals">
                          <div class="totals-box">
                            <div class="totals-row">
                              <span>المجموع الفرعي:</span>
                              <span>${formatCurrency(order.subtotalAmount || order.totalAmount)}</span>
                            </div>
                            ${(order.discountAmount && order.discountAmount > 0) ? 
                              '<div class="totals-row" style="color: #dc2626;"><span>الخصم:</span><span>-'+formatCurrency(order.discountAmount)+'</span></div>' 
                              : ''}
                            ${(order.taxAmount && order.taxAmount > 0) ? 
                              '<div class="totals-row"><span>الضريبة (${settings?.taxRate || 15}%):</span><span>'+formatCurrency(order.taxAmount)+'</span></div>' 
                              : ''}
                            <div class="totals-row final">
                              <span>الإجمالي المستحق:</span>
                              <span>${formatCurrency(order.totalAmount)}</span>
                            </div>
                          </div>
                        </div>

                        ${settings?.termsAndConditions ? 
                          '<div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee;"><strong>الشروط والملاحظات:</strong><p style="white-space: pre-wrap; font-size: 12px; color: #666;">'+settings.termsAndConditions+'</p></div>' 
                          : ''}

                        <div class="footer">
                          تم إنشاء هذه الفاتورة بواسطة نظام Nima Pos
                        </div>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  setTimeout(() => {
                      printWindow.print();
                  }, 500);
                }}
                className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-indigo-200"
              >
                <Printer className="w-5 h-5" />
                طباعة A4
              </button>
          </div>
          
          <div className="flex gap-3">
              <button 
                onClick={handleWhatsApp}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-200"
              >
                <MessageCircle className="w-5 h-5" />
                واتساب
              </button>
              <button 
                onClick={handleSMS}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-200"
              >
                <Smartphone className="w-5 h-5" />
                رسالة SMS
              </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoiceModal;
