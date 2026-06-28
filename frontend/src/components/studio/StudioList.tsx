import React, { useState } from 'react';
import { StudioBooking, ShiftType, BookingStatus } from '../../types';
import { MessageCircle, Copy, Layout, Printer, ChevronDown, ChevronUp, MapPin, User, Clock } from 'lucide-react';

interface StudioListProps {
  bookings: StudioBooking[];
  formatDate: (dateStr: string) => string;
  formatCurrency: (amount: number) => string;
  getShiftBadge: (shift: ShiftType) => { label: string; color: string; icon: React.ElementType };
  getStatusColor: (status: BookingStatus) => string;
  getStatusLabel: (status: BookingStatus) => string;
  sendWhatsApp: (booking: StudioBooking) => void;
  copyBookingDetails: (booking: StudioBooking) => void;
  handleEditBooking: (booking: StudioBooking) => void;
  printBookingTicket: (booking: StudioBooking) => void;
}

const StudioList: React.FC<StudioListProps> = ({
  bookings,
  formatDate,
  formatCurrency,
  getShiftBadge,
  getStatusColor,
  getStatusLabel,
  sendWhatsApp,
  copyBookingDetails,
  handleEditBooking,
  printBookingTicket,
}) => {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const toggleRow = (id: number) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const getPricingLabel = (type: string) => {
    switch(type) {
        case 'hourly': return 'بالساعة';
        case 'daily': return 'باليوم';
        case 'session': return 'مقطوعية';
        case 'photo': return 'بالصورة';
        default: return type;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 text-slate-600 font-bold">
            <tr>
              <th className="p-4 w-10"></th>
              <th className="p-4">التاريخ</th>
              <th className="p-4">العميل</th>
              <th className="p-4">المعدات / الخدمة</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">المالية</th>
              <th className="p-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map(b => (
              <React.Fragment key={b.id}>
                <tr className={`hover:bg-indigo-50/30 transition-colors group ${expandedRows.includes(b.id!) ? 'bg-indigo-50/10' : ''}`}>
                  <td className="p-4 text-center cursor-pointer" onClick={() => toggleRow(b.id!)}>
                    {expandedRows.includes(b.id!) ? <ChevronUp className="w-5 h-5 text-indigo-500" /> : <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />}
                  </td>
                  <td className="p-4 font-bold text-indigo-700">{formatDate(b.date)}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{b.customerName}</div>
                    <div className="text-xs text-slate-500" dir="ltr">{b.customerPhone}</div>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium border border-slate-200">{b.cameraName}</span>
                    <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                       <Clock className="w-3 h-3" />
                       {getShiftBadge(b.shift).label}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 flex w-fit items-center gap-1 rounded-full text-xs font-bold border ${getStatusColor(b.status)}`}>
                      {getStatusLabel(b.status)}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-xs">
                      <span className="text-slate-400 block font-medium">إجمالي: {formatCurrency(b.price)}</span>
                      {b.remaining > 0 ? (
                        <span className="text-red-600 font-bold bg-red-50 px-1 py-0.5 rounded mt-1 inline-block">متبقي: {formatCurrency(b.remaining)}</span>
                      ) : (
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded mt-1 inline-block">خالص</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => sendWhatsApp(b)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="واتساب"><MessageCircle className="w-4 h-4" /></button>
                      <button onClick={() => copyBookingDetails(b)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="نسخ التفاصيل"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => handleEditBooking(b)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="تعديل الحجز ومراجعة المالية"><Layout className="w-4 h-4" /></button>
                      <button onClick={() => printBookingTicket(b)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="طباعة الإيصال"><Printer className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
                {expandedRows.includes(b.id!) && (
                  <tr className="bg-slate-50/50">
                    <td colSpan={7} className="p-0 border-t border-dashed border-indigo-100">
                      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                        
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">تفاصيل الجلسة والمعلومات</h4>
                          <div className="flex bg-white p-3 rounded-xl border border-slate-200 gap-3 items-center shadow-sm">
                             <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                <User className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-[10px] text-slate-400 font-medium mb-0.5">المصور / الفني</p>
                                <p className="text-sm font-bold text-slate-800">{b.technicianName || 'لم يحدد'}</p>
                             </div>
                          </div>
                          
                          <div className="flex bg-white p-3 rounded-xl border border-slate-200 gap-3 items-center shadow-sm">
                             <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                                <MapPin className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-[10px] text-slate-400 font-medium mb-0.5">نوع ومكان التصوير</p>
                                <p className="text-sm font-bold text-slate-800">{b.venueType === 'home' ? 'منزل (بيت عيلة)' : b.venueType === 'hall' ? 'قاعة أفراح' : b.venueType === 'outdoor' ? 'تصوير خارجي' : 'داخل الاستوديو'}</p>
                                <p className="text-xs text-slate-500 truncate max-w-[200px]">{b.city && `${b.city} - `}{b.address}</p>
                             </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">التسعير والاتفاق</h4>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                             <div className="flex justify-between text-xs">
                               <span className="text-slate-500">طريقة الحساب:</span>
                               <span className="font-bold text-slate-700">{getPricingLabel(b.pricingType)}</span>
                             </div>
                             <div className="flex justify-between text-xs">
                               <span className="text-slate-500">الكمية ({b.pricingType === 'hourly' ? 'ساعة' : 'جلسة/يوم/صورة'}):</span>
                               <span className="font-bold text-slate-700">{b.quantity}</span>
                             </div>
                             <div className="flex justify-between text-xs py-2 border-y border-dashed border-slate-100 my-1">
                               <span className="text-slate-500">سعر الوحدة:</span>
                               <span className="font-bold text-slate-700">{formatCurrency(b.unitPrice)}</span>
                             </div>
                             <div className="flex justify-between text-sm font-black text-indigo-700 pt-1">
                               <span>المجموع:</span>
                               <span>{formatCurrency(b.price)}</span>
                             </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">سجل الدفعات الحالية</h4>
                          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 shadow-sm space-y-3">
                             <div className="flex justify-between items-center text-sm">
                               <span className="text-emerald-700 font-medium">المدفوع (عربون/دفعات):</span>
                               <span className="font-bold text-emerald-800">{formatCurrency(b.deposit)}</span>
                             </div>
                             <div className="w-full bg-emerald-100 rounded-full h-1.5 overflow-hidden">
                               <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${b.price > 0 ? (b.deposit / b.price) * 100 : 0}%` }}></div>
                             </div>
                             <div className="flex justify-between items-center text-sm pt-2">
                               <span className="text-red-700 font-medium">المتبقي:</span>
                               <span className="font-black text-red-800">{formatCurrency(b.remaining)}</span>
                             </div>
                          </div>
                        </div>

                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-slate-400 font-medium">لا توجد حجوزات مطابقة للفلتر المحدد</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudioList;
