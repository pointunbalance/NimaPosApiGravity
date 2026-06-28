import React from 'react';
import { StudioBooking, Camera, ShiftType, BookingStatus, PricingType, Customer } from '../../types';
import { X, Camera as CameraIcon, MapPin, User, DollarSign, Clock, Monitor, MessageCircle, Printer, Trash2 } from 'lucide-react';

interface StudioBookingModalProps {
  bookingForm: Partial<StudioBooking>;
  setBookingForm: React.Dispatch<React.SetStateAction<Partial<StudioBooking>>>;
  cameras: Camera[] | undefined;
  customers: Customer[] | undefined;
  updatePriceDefaults: (cameraId: number, type: PricingType) => void;
  getStatusColor: (status: BookingStatus) => string;
  handleSaveBooking: () => void;
  onClose: () => void;
  viewMode: 'calendar' | 'list' | 'cameras';
  getBookingsForDay: (date: Date) => StudioBooking[];
  getShiftBadge: (shift: ShiftType) => { label: string; color: string; icon: React.ElementType };
  getStatusLabel: (status: BookingStatus) => string;
  handleEditBooking: (booking: StudioBooking) => void;
  sendWhatsApp: (booking: StudioBooking) => void;
  printBookingTicket: (booking: StudioBooking) => void;
  handleDeleteBooking: (id: number) => void;
}

const StudioBookingModal: React.FC<StudioBookingModalProps> = ({
  bookingForm,
  setBookingForm,
  cameras,
  customers,
  updatePriceDefaults,
  getStatusColor,
  handleSaveBooking,
  onClose,
  viewMode,
  getBookingsForDay,
  getShiftBadge,
  getStatusLabel,
  handleEditBooking,
  sendWhatsApp,
  printBookingTicket,
  handleDeleteBooking,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center rounded-t-3xl shrink-0">
          <div>
            <h3 className="font-bold text-xl text-slate-800">تفاصيل الحجز</h3>
            <p className="text-sm text-slate-500">{new Date(bookingForm.date!).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Left: Input Form */}
            <div className="flex-1 space-y-6">

              {/* 1. Equipment & Status */}
              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                <h4 className="font-bold text-indigo-800 mb-4 flex items-center gap-2 text-sm border-b border-indigo-200 pb-2">
                  <Clock className="w-4 h-4" /> التاريخ والمعدات
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الحجز</label>
                    <input
                      type="date"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      value={bookingForm.date}
                      onChange={e => setBookingForm({ ...bookingForm, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">وقت البدء</label>
                    <input
                      type="time"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-center"
                      value={bookingForm.startTime || ''}
                      onChange={e => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">المدة (بالساعات)</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-center"
                      value={bookingForm.shootingDuration || ''}
                      onChange={e => setBookingForm({ ...bookingForm, shootingDuration: Number(e.target.value) })}
                    />
                  </div>

                  <div className="col-span-2 mt-2 border-t border-indigo-100 pt-3">
                    <label className="block text-xs font-bold text-slate-500 mb-1">الكاميرا</label>
                    <select
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      value={bookingForm.cameraId || ''}
                      onChange={e => {
                        const id = Number(e.target.value);
                        updatePriceDefaults(id, bookingForm.pricingType || 'daily');
                      }}
                    >
                      <option value="">اختر الكاميرا...</option>
                      {cameras?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">حالة الحجز</label>
                    <select
                      className={`w-full p-3 border border-slate-200 rounded-xl outline-none font-bold ${getStatusColor(bookingForm.status || 'pending')}`}
                      value={bookingForm.status}
                      onChange={e => setBookingForm({ ...bookingForm, status: e.target.value as any })}
                    >
                      <option value="pending">قيد الانتظار (Pending)</option>
                      <option value="confirmed">مؤكد (Confirmed)</option>
                      <option value="completed">مكتمل (Completed)</option>
                      <option value="cancelled">ملغي (Cancelled)</option>
                    </select>
                  </div>

                  {/* Pricing Type */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">نظام المحاسبة</label>
                    <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                      {[
                        { id: 'daily', label: 'يومي' },
                        { id: 'hourly', label: 'بالساعة' },
                        { id: 'session', label: 'مقطوعية (جلسة)' },
                        { id: 'photo', label: 'بالصورة' }
                      ].map(type => (
                        <button
                          key={type.id}
                          onClick={() => {
                            if (bookingForm.cameraId) updatePriceDefaults(bookingForm.cameraId, type.id as any);
                            else setBookingForm(prev => ({ ...prev, pricingType: type.id as any }));
                          }}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${bookingForm.pricingType === type.id ? 'bg-indigo-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      {bookingForm.pricingType === 'hourly' ? 'عدد الساعات' :
                        bookingForm.pricingType === 'photo' ? 'عدد الصور' :
                          bookingForm.pricingType === 'session' ? 'عدد الجلسات' : 'عدد الأيام'}
                    </label>
                    <input
                      type="number" onFocus={(e) => e.target.select()}
                      min="1"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-center"
                      value={bookingForm.quantity}
                      onChange={e => setBookingForm({ ...bookingForm, quantity: Number(e.target.value) })}
                    />
                  </div>

                  {/* Unit Price */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">سعر الوحدة</label>
                    <input
                      type="number" onFocus={(e) => e.target.select()}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-center text-slate-700"
                      value={bookingForm.unitPrice}
                      onChange={e => setBookingForm({ ...bookingForm, unitPrice: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Event Location Details */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm border-b border-slate-200 pb-2">
                  <MapPin className="w-4 h-4" /> تفاصيل المكان
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">المدينة / البلد</label>
                    <input
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={bookingForm.city}
                      onChange={e => setBookingForm({ ...bookingForm, city: e.target.value })}
                      placeholder="القاهرة، الجيزة..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">نوع المكان</label>
                    <select
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-sm"
                      value={bookingForm.venueType}
                      onChange={e => setBookingForm({ ...bookingForm, venueType: e.target.value as any })}
                    >
                      <option value="home">منزل (بيت عيلة)</option>
                      <option value="hall">قاعة أفراح</option>
                      <option value="outdoor">تصوير خارجي (Outdoor)</option>
                      <option value="studio">داخل الاستوديو</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">العنوان بالتفصيل</label>
                    <input
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={bookingForm.address}
                      onChange={e => setBookingForm({ ...bookingForm, address: e.target.value })}
                      placeholder="الشارع، رقم العمارة، علامة مميزة..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Customer & Money */}
            <div className="flex-1 space-y-6">

              {/* 3. Customer Info */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm border-b border-slate-200 pb-2">
                  <User className="w-4 h-4" /> بيانات العميل والفني
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">اسم العميل</label>
                    <input
                      list="customers-list"
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                      value={bookingForm.customerName}
                      onChange={e => {
                        const val = e.target.value;
                        const existing = customers?.find(c => c.name === val);
                        if (existing) {
                          setBookingForm({ ...bookingForm, customerName: val, customerPhone: existing.phone, customerId: existing.id });
                        } else {
                          setBookingForm({ ...bookingForm, customerName: val, customerId: 0 });
                        }
                      }}
                    />
                    <datalist id="customers-list">
                      {customers?.map(c => <option key={c.id} value={c.name} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">رقم الهاتف</label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        value={bookingForm.customerPhone}
                        onChange={e => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                        placeholder="01xxxxxxxxx"
                      />
                      {bookingForm.customerPhone && (
                        <button onClick={() => sendWhatsApp(bookingForm as StudioBooking)} className="bg-green-50 text-green-600 p-3 rounded-xl hover:bg-green-100 transition-colors" title="واتساب">
                          <MessageCircle className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">اسم الفني (المصور)</label>
                    <input
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={bookingForm.technicianName}
                      onChange={e => setBookingForm({ ...bookingForm, technicianName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* 4. Financial Breakdown */}
              <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                <h4 className="font-bold text-emerald-800 mb-4 flex items-center gap-2 text-sm border-b border-emerald-200 pb-2">
                  <DollarSign className="w-4 h-4" /> الحساب والمدفوعات
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">إجمالي الحساب (محسوب)</label>
                    <input
                      type="number" onFocus={(e) => e.target.select()}
                      readOnly
                      className="w-full p-3 bg-slate-100 border-2 border-emerald-100 rounded-xl outline-none font-black text-lg text-emerald-700"
                      value={bookingForm.price}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">الكمية x سعر الوحدة</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">المدفوع (مقدم/عربون)</label>
                      <input
                        type="number" onFocus={(e) => e.target.select()}
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-600"
                        value={bookingForm.deposit}
                        onChange={e => setBookingForm({ ...bookingForm, deposit: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">المتبقي</label>
                      <div className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-bold text-red-500">
                        {(bookingForm.remaining || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={handleSaveBooking} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all text-lg">
                  {bookingForm.id ? 'حفظ التعديلات' : 'تأكيد الحجز'}
                </button>
              </div>

            </div>
          </div>

          {/* Existing Bookings List for Day (Only show in Calendar/Modal mode) */}
          {viewMode === 'calendar' && (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" /> حجوزات اليوم الحالي
              </h4>
              <div className="space-y-3">
                {getBookingsForDay(new Date(bookingForm.date!)).map(booking => {
                  const style = getShiftBadge(booking.shift);
                  const statusColor = getStatusColor(booking.status);

                  return (
                    <div key={booking.id} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center shadow-sm gap-4 hover:border-indigo-300 transition-colors">
                      <div className="flex-1 cursor-pointer" onClick={() => handleEditBooking(booking)}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${style.color} bg-opacity-20`}>{style.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${statusColor}`}>{getStatusLabel(booking.status)}</span>
                          <span className="font-bold text-slate-800">{booking.cameraName}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {booking.customerName}</span>
                          {booking.technicianName && <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> فني: {booking.technicianName}</span>}
                          {booking.address && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {booking.address}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <div className="font-bold text-emerald-600">{booking.price.toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">الإجمالي</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${booking.remaining > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                            {booking.remaining > 0 ? booking.remaining.toLocaleString() : 'خالص'}
                          </div>
                          <div className="text-[10px] text-slate-400">متبقي</div>
                        </div>

                        <div className="flex gap-1">
                          <button onClick={() => sendWhatsApp(booking)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="واتساب"><MessageCircle className="w-4 h-4" /></button>
                          <button
                            onClick={() => printBookingTicket(booking)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                            title="طباعة إيصال"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteBooking(booking.id!)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {getBookingsForDay(new Date(bookingForm.date!)).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">لا توجد حجوزات لهذا اليوم</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudioBookingModal;
