import React from 'react';
import { Quotation } from '../../types';
import { 
  Calendar, Printer, Edit2, ArrowRightCircle, CheckCircle2, 
  MessageCircle, Copy, Trash2, FileText, XCircle
} from 'lucide-react';

interface QuotationsGridProps {
  quotations: Quotation[];
  getStatusConfig: (status: string, expiry?: Date) => { label: string, color: string, icon: any };
  formatCurrency: (amount: number) => string;
  printQuote: (quote: Quotation) => void;
  openModal: (quote: Quotation) => void;
  convertToOrder: (quote: Quotation) => void;
  sendWhatsApp: (quote: Quotation) => void;
  handleDuplicate: (quote: Quotation) => void;
  deleteQuotation: (id: number) => void;
  updateStatus: (id: number, status: Quotation['status']) => void;
}

const QuotationsGrid: React.FC<QuotationsGridProps> = ({
  quotations,
  getStatusConfig,
  formatCurrency,
  printQuote,
  openModal,
  convertToOrder,
  sendWhatsApp,
  handleDuplicate,
  deleteQuotation,
  updateStatus
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {quotations.map(quote => {
        const statusConfig = getStatusConfig(quote.status, quote.expiryDate);
        const StatusIcon = statusConfig.icon;
        
        return (
          <div key={quote.id} className="bg-white rounded-2xl border border-slate-200 hover:shadow-xl hover:border-indigo-200 transition-all group flex flex-col h-full overflow-hidden">
            
            {/* Card Header */}
            <div className="p-5 border-b border-slate-50 bg-slate-50/50">
              <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-xs font-black text-slate-400 bg-white px-2 py-1 rounded border border-slate-100">#{quote.referenceNumber || quote.id}</span>
                <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-bold border ${statusConfig.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-1 line-clamp-1" title={quote.customerName}>{quote.customerName}</h3>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                {new Date(quote.date).toLocaleDateString()}
                {quote.expiryDate && (
                  <span className="text-orange-400 flex items-center gap-1 bg-orange-50 px-1.5 rounded">
                    ينتهي: {new Date(quote.expiryDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            
            {/* Card Body (Items Preview) */}
            <div className="p-5 flex-1">
              <div className="space-y-2">
                {quote.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex justify-between text-xs text-slate-600 border-b border-dashed border-slate-100 pb-1 last:border-0">
                    <span className="truncate flex-1 ml-2">{item.name}</span>
                    <span className="font-bold bg-slate-100 px-1.5 rounded">x{item.quantity}</span>
                  </div>
                ))}
                {quote.items.length > 3 && <p className="text-[10px] text-indigo-500 font-bold mt-1 text-center">+ {quote.items.length - 3} أصناف أخرى</p>}
              </div>
            </div>
            
            {/* Card Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 mt-auto">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase">الإجمالي</span>
                <span className="text-lg font-black text-indigo-700">{formatCurrency(quote.totalAmount)}</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => printQuote(quote)} className="col-span-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 flex justify-center items-center" title="طباعة"><Printer className="w-4 h-4"/></button>
                
                {quote.status !== 'converted' ? (
                  <>
                    <button onClick={() => openModal(quote)} className="col-span-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-blue-50 hover:text-blue-600 flex justify-center items-center" title="تعديل"><Edit2 className="w-4 h-4"/></button>
                    <button onClick={() => convertToOrder(quote)} className="col-span-2 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-700 shadow-sm" title="بيع">
                      <ArrowRightCircle className="w-4 h-4" /> تحويل لبيع
                    </button>
                  </>
                ) : (
                  <div className="col-span-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-xs flex items-center justify-center gap-1 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" /> تم البيع
                  </div>
                )}
                
                {/* Quick Actions Bar */}
                <div className="col-span-4 flex gap-2 pt-2 border-t border-slate-200/50 mt-2 flex-wrap">
                  <button onClick={() => sendWhatsApp(quote)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="واتساب"><MessageCircle className="w-4 h-4"/></button>
                  <button onClick={() => handleDuplicate(quote)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="نسخ"><Copy className="w-4 h-4"/></button>
                  
                  {quote.status === 'pending' && (
                    <>
                      <button onClick={() => updateStatus(quote.id!, 'accepted')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded flex items-center gap-1 text-xs font-bold" title="قبول العرض"><CheckCircle2 className="w-4 h-4"/> قبول</button>
                      <button onClick={() => updateStatus(quote.id!, 'rejected')} className="p-1.5 text-orange-600 hover:bg-orange-50 rounded flex items-center gap-1 text-xs font-bold" title="رفض العرض"><XCircle className="w-4 h-4"/> رفض</button>
                    </>
                  )}
                  
                  <button onClick={() => deleteQuotation(quote.id!)} className="p-1.5 text-red-400 hover:bg-red-50 rounded mr-auto"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {quotations.length === 0 && (
        <div className="col-span-full py-20 text-center text-slate-400 flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-10 h-10 opacity-30" />
          </div>
          <p className="font-bold text-lg">لا توجد عروض أسعار</p>
          <p className="text-sm opacity-70">ابدأ بإنشاء عرض جديد</p>
        </div>
      )}
    </div>
  );
};

export default QuotationsGrid;
