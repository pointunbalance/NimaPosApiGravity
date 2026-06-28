
import React, { useRef } from 'react';
import { Order, AppSettings, Customer } from '../types';
import { X, Printer, MessageCircle, Smartphone } from 'lucide-react';
import { printReceipt, generateReceiptText } from '../utils/printing';

interface InvoiceModalProps {
  order: Order;
  settings?: AppSettings;
  customer?: Customer;
  onClose: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, settings, customer, onClose }) => {
  
  const handlePrint = () => {
    if (settings) {
        printReceipt(order, settings, customer);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white print:block">
      
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
          <h3 className="font-bold text-gray-800">فاتورة طلب #{order.id}</h3>
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
                    <span>رقم الفاتورة: #{order.id}</span>
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
                                    {item.name}
                                    {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                            {item.selectedModifiers.map(m => m.optionName).join(', ')}
                                        </div>
                                    )}
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

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-gray-500">
                {settings?.receiptFooter && (
                    <p className="mb-2 font-bold whitespace-pre-wrap">{settings.receiptFooter}</p>
                )}
                <p>شكراً لزيارتكم!</p>
                <p className="mt-1 font-mono text-[10px] opacity-70">Powered by Nima Pos</p>
            </div>
        </div>

        {/* Actions - No Print */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 no-print flex flex-col gap-3">
          <button 
            onClick={handlePrint}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200"
          >
            <Printer className="w-5 h-5" />
            طباعة الفاتورة (Thermal)
          </button>
          
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
