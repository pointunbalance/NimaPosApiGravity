import React from 'react';
import { X, Printer, RotateCcw, Trash2, MessageCircle } from 'lucide-react';
import { Order } from '../../types';

interface OrderDetailsDrawerProps {
  selectedOrder: Order;
  setSelectedOrder: (order: Order | null) => void;
  setInvoicePreviewOrder: (order: Order | null) => void;
  openRefundModal: () => void;
  handleDeleteOrder: (id: number) => void;
  handleSendWhatsApp: (order: Order) => void;
  formatCurrency: (amount: number) => string;
}

const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({
  selectedOrder,
  setSelectedOrder,
  setInvoicePreviewOrder,
  openRefundModal,
  handleDeleteOrder,
  handleSendWhatsApp,
  formatCurrency
}) => {
  return (
    <div className="w-full lg:w-[35%] bg-white border-r border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-left duration-300 relative z-20">
      
      {/* Drawer Header */}
      <div className="bg-slate-900 text-white p-6 relative overflow-hidden shrink-0">
        <button onClick={() => setSelectedOrder(null)} className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        <div className="flex justify-between items-end mt-4">
          <div>
            <h2 className="text-3xl font-black">{formatCurrency(selectedOrder.totalAmount)}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${selectedOrder.status === 'refunded' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-emerald-950'}`}>
                {selectedOrder.status}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => handleSendWhatsApp(selectedOrder)}
              className="bg-green-500 text-white p-3 rounded-xl shadow-lg hover:bg-green-600 transition-colors"
              title="إرسال عبر واتساب"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setInvoicePreviewOrder(selectedOrder)}
              className="bg-white text-slate-900 p-3 rounded-xl shadow-lg hover:bg-slate-100 transition-colors"
              title="طباعة الفاتورة"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                if (window.confirm('هل أنت متأكد من حذف هذه الفاتورة نهائياً؟')) {
                  handleDeleteOrder(selectedOrder.id!);
                }
              }}
              className="bg-red-500 text-white p-3 rounded-xl shadow-lg hover:bg-red-600 transition-colors"
              title="حذف الفاتورة"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6">
        {/* Items List */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 px-1">الأصناف ({selectedOrder.items.length})</h4>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {selectedOrder.items.map((item, idx) => (
              <div key={idx} className="p-3 flex justify-between items-center hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 text-slate-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs">
                    {item.quantity}x
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                    {item.discount && item.discount > 0 ? <p className="text-[10px] text-red-500">خصم: {formatCurrency(item.discount)}</p> : null}
                  </div>
                </div>
                <span className="font-bold text-slate-700 text-sm">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="space-y-2 text-sm px-2">
          <div className="flex justify-between text-slate-500">
            <span>المجموع الفرعي</span>
            <span>{formatCurrency(selectedOrder.subtotalAmount)}</span>
          </div>
          {(selectedOrder.discountAmount || 0) > 0 && (
            <div className="flex justify-between text-red-500">
              <span>الخصم</span>
              <span>-{formatCurrency(selectedOrder.discountAmount!)}</span>
            </div>
          )}
          {(selectedOrder.taxAmount || 0) > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>الضريبة</span>
              <span>{formatCurrency(selectedOrder.taxAmount!)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-slate-800 text-lg border-t border-slate-200 pt-2 mt-2">
            <span>الإجمالي</span>
            <span>{formatCurrency(selectedOrder.totalAmount)}</span>
          </div>

          <div className="border-t border-slate-200 pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>طريقة الدفع</span>
              <span>{selectedOrder.paymentMethod === 'cash' ? 'نقدي' : selectedOrder.paymentMethod === 'card' ? 'بطاقة' : selectedOrder.paymentMethod === 'wallet' ? 'محفظة' : selectedOrder.paymentMethod === 'split' ? 'متعدد' : 'آجل'}</span>
            </div>
            {selectedOrder.paymentMethod === 'credit' && (
              <>
                <div className="flex justify-between text-slate-500">
                    <span>المدفوع الان</span>
                    <span>{formatCurrency(selectedOrder.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between text-brand-600 font-bold">
                    <span>المبلغ الآجل</span>
                    <span>{formatCurrency(selectedOrder.totalAmount - (selectedOrder.paidAmount || 0))}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 bg-white border-t border-slate-200 flex gap-3">
        {selectedOrder.status !== 'refunded' && !selectedOrder.isReturn && (
          <button 
            onClick={openRefundModal}
            className="flex-1 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border border-red-100"
          >
            <RotateCcw className="w-4 h-4" />
            استرجاع (مرتجع)
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsDrawer;
