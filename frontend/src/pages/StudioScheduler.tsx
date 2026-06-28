
import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Camera, StudioBooking, ShiftType, PricingType, BookingStatus } from '../types';
import { Moon, Sun } from 'lucide-react';
import StudioHeader from '../components/studio/StudioHeader';
import StudioStats from '../components/studio/StudioStats';
import StudioToolbar from '../components/studio/StudioToolbar';
import StudioCalendar from '../components/studio/StudioCalendar';
import StudioList from '../components/studio/StudioList';
import StudioCamerasList from '../components/studio/StudioCamerasList';
import StudioBookingModal from '../components/studio/StudioBookingModal';
import StudioCameraModal from '../components/studio/StudioCameraModal';

const StudioScheduler: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'cameras'>('calendar'); // NEW: View Mode
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // Forms
  const [bookingForm, setBookingForm] = useState<Partial<StudioBooking>>({
      shift: 'full',
      status: 'pending',
      pricingType: 'daily',
      quantity: 1,
      unitPrice: 0,
      price: 0,
      deposit: 0,
      remaining: 0,
      customerName: '',
      customerPhone: '',
      technicianName: '',
      city: '',
      venueType: 'home',
      address: '',
      shootingDuration: 6,
      isPaid: false
  });
  
  const [cameraForm, setCameraForm] = useState<Partial<Camera>>({
      name: '', 
      hourlyRate: 0,
      dailyRate: 0, 
      sessionRate: 0,
      photoRate: 0,
      status: 'active'
  });

  // Queries
  const cameras = useLiveQuery(() => db.cameras.toArray(), []);
  const bookings = useLiveQuery(() => db.studioBookings.toArray(), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const currencyCode = settings?.currencyCode || 'EGP';

  // --- Statistics Logic ---
  const monthStats = useMemo(() => {
      if (!bookings) return { revenue: 0, count: 0, remaining: 0, completed: 0 };
      
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const monthBookings = bookings.filter(b => {
          const d = new Date(b.date);
          return d >= startOfMonth && d <= endOfMonth && b.status !== 'cancelled';
      });

      return {
          revenue: monthBookings.reduce((sum, b) => sum + b.price, 0),
          count: monthBookings.length,
          remaining: monthBookings.reduce((sum, b) => sum + b.remaining, 0),
          completed: monthBookings.filter(b => b.status === 'completed').length
      };
  }, [bookings, currentDate]);

  // --- Auto-Calculate Total ---
  useEffect(() => {
      const qty = Number(bookingForm.quantity) || 0;
      const rate = Number(bookingForm.unitPrice) || 0;
      const total = qty * rate;
      
      const deposit = Number(bookingForm.deposit) || 0;
      
      setBookingForm(prev => ({
          ...prev,
          price: total,
          remaining: Math.max(0, total - deposit),
          isPaid: total > 0 && deposit >= total
      }));
  }, [bookingForm.quantity, bookingForm.unitPrice, bookingForm.deposit]);

  // --- Calendar Logic ---
  
  const daysInMonth = useMemo(() => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const date = new Date(year, month, 1);
      const days = [];
      while (date.getMonth() === month) {
          days.push(new Date(date));
          date.setDate(date.getDate() + 1);
      }
      return days;
  }, [currentDate]);

  const monthName = useMemo(() => {
      return currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  const changeMonth = (delta: number) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + delta);
      setCurrentDate(newDate);
  };

  const getBookingsForDay = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      return bookings?.filter(b => {
          const matchesDate = b.date === dateStr;
          const matchesSearch = searchTerm 
              ? (b.customerName.includes(searchTerm) || b.customerPhone?.includes(searchTerm)) 
              : true;
          const matchesStatus = statusFilter === 'all' ? true : b.status === statusFilter;
          return matchesDate && matchesSearch && matchesStatus;
      }) || [];
  };

  const getAllBookingsSorted = () => {
      if (!bookings) return [];
      return bookings
        .filter(b => {
            const matchesSearch = searchTerm 
              ? (b.customerName.includes(searchTerm) || b.customerPhone?.includes(searchTerm) || b.date.includes(searchTerm)) 
              : true;
            const matchesStatus = statusFilter === 'all' ? true : b.status === statusFilter;
            // Also filter by current month view if desired, or show all for list? 
            // Let's show current month + future for list view to be useful as "Agenda"
            const bookingDate = new Date(b.date);
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            return matchesSearch && matchesStatus && bookingDate >= startOfMonth;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('ar-IQ', { style: 'decimal', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  // --- Handlers ---

  const handleDayClick = (day: number) => {
      setSelectedDay(day);
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${month}-${dayStr}`;
      
      setBookingForm({ 
          date: dateStr,
          cameraId: undefined,
          shift: 'full',
          status: 'pending',
          pricingType: 'daily',
          quantity: 1,
          unitPrice: 0,
          price: 0,
          deposit: 0,
          remaining: 0,
          customerName: '',
          customerPhone: '',
          technicianName: '',
          city: '',
          venueType: 'home',
          address: '',
          shootingDuration: 6,
          startTime: '10:00'
      });
      setIsModalOpen(true);
  };

  const handleEditBooking = (booking: StudioBooking) => {
      setBookingForm(booking);
      setIsModalOpen(true);
  };

  const handleSaveBooking = async () => {
      if (!bookingForm.cameraId || !bookingForm.customerName || !bookingForm.date) {
          alert('يرجى تعبئة الحقول المطلوبة (الكاميرا، اسم العميل)');
          return;
      }

      // 1. الأمان والتحقق: فحص صحة المدخلات لمنع حجز تواريخ قديمة
      const newBookingDate = new Date(bookingForm.date!);
      newBookingDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (newBookingDate < today && bookingForm.status !== 'completed' && bookingForm.status !== 'cancelled' && !bookingForm.id) {
          alert('لا يمكن حجز تواريخ سابقة (يُسمح فقط لتسجيل الحجوزات المكتملة بأثر رجعي).');
          return;
      }

      try {
          // استخدام Transaction لضمان تزامن البيانات وعدم حدوث تضارب
          await db.transaction('rw', db.studioBookings, db.shifts, db.customers, async () => {
              // 2. منطق التوفر (Availability Logic): منع الحجز المزدوج (Double Booking)
              const existing = await db.studioBookings
                  .where({ date: bookingForm.date, cameraId: bookingForm.cameraId })
                  .toArray();
              
              const overlapping = existing.filter(b => b.id !== bookingForm.id && b.status !== 'cancelled');

              if (overlapping.length > 0) {
                  // التحقق من تعارض الفترات (Shift overlapping)
                  const conflict = overlapping.find(b => 
                      b.shift === 'full' || 
                      bookingForm.shift === 'full' || 
                      b.shift === bookingForm.shift
                  );

                  if (conflict) {
                      throw new Error(`عذراً، المورد (الكاميرا) محجوز مسبقاً في نفس الفترة (${getStatusLabel(conflict.status)}). الرجاء اختيار فترة أو مورد آخر.`);
                  }
              }

              // الجلب الفعلي للكاميرا غير متاح بداخل نفس الـ transaction لأنه يحتاج الـ db.assets/products أو نحن لدينا context. 
              // Camera name was mapped outside transaction? No, cameraName is already populated or we can skip it, since it's just a label. We'll leave it as is if it fails.
              const cameraTitle = document.querySelector(`option[value="${bookingForm.cameraId}"]`)?.textContent || `الكاميرا ${bookingForm.cameraId}`;

              // Check if customer exists, if not, create one
              let customerId = bookingForm.customerId;
              if (!customerId && bookingForm.customerName) {
                  const existingCustomer = await db.customers.filter(c => c.name.toLowerCase() === bookingForm.customerName?.toLowerCase()).first();
                  if (existingCustomer) {
                      customerId = existingCustomer.id!;
                  } else {
                      customerId = await db.customers.add({
                          name: bookingForm.customerName,
                          phone: bookingForm.customerPhone || '',
                          address: bookingForm.address || '',
                          balance: 0,
                          totalSpent: 0
                      });
                  }
              }

              const bookingData = {
                  ...bookingForm as StudioBooking,
                  customerId: customerId,
                  // cameraName already updated in form previously or we can fallback
                  createdAt: bookingForm.createdAt || new Date()
              };

              // 3. إدارة دورة حياة الحجز (Lifecycle) ومعالجة الاستثناءات
              const activeShift = await db.shifts.where('status').equals('open').first();
              
              if (bookingForm.id) {
                  const oldBooking = await db.studioBookings.get(bookingForm.id);
                  if (oldBooking) {
                      const depositDiff = (bookingData.deposit || 0) - (oldBooking.deposit || 0);
                      
                      // إذا تم إلغاء الحجز، استرداد العربون إن وُجد
                      if (bookingData.status === 'cancelled' && oldBooking.status !== 'cancelled') {
                          if (oldBooking.deposit > 0 && activeShift) {
                              await db.shifts.update(activeShift.id!, {
                                  expectedCash: (activeShift.expectedCash || 0) - oldBooking.deposit,
                                  cashSales: (activeShift.cashSales || 0) - oldBooking.deposit
                              });
                          }
                          bookingData.deposit = 0;
                          bookingData.remaining = bookingData.price; // or 0? Usually remaining is 0 on cancel.
                          bookingData.remaining = 0;
                      } 
                      // إذا تم إعادة تنشيط حجز ملغي
                      else if (bookingData.status !== 'cancelled' && oldBooking.status === 'cancelled') {
                           if (bookingData.deposit > 0 && activeShift) {
                              await db.shifts.update(activeShift.id!, {
                                  expectedCash: (activeShift.expectedCash || 0) + bookingData.deposit,
                                  cashSales: (activeShift.cashSales || 0) + bookingData.deposit
                              });
                           }
                      }
                      else if (depositDiff !== 0 && activeShift && bookingData.status !== 'cancelled') {
                          await db.shifts.update(activeShift.id!, {
                              expectedCash: (activeShift.expectedCash || 0) + depositDiff,
                              cashSales: (activeShift.cashSales || 0) + depositDiff
                          });
                      }

                      // إذا اكتمل الحجز، نقل المتبقي لرصيد العميل إن لم يُسدد
                      if (bookingData.status === 'completed' && oldBooking.status !== 'completed') {
                          const customer = await db.customers.get(customerId!);
                          if (customer) {
                              await db.customers.update(customerId!, {
                                  balance: (customer.balance || 0) + (bookingData.remaining || 0),
                                  totalSpent: (customer.totalSpent || 0) + (bookingData.price || 0)
                              });
                          }
                      }
                      // عكس العملية في حال التراجع عن الإكمال
                      if (oldBooking.status === 'completed' && bookingData.status !== 'completed') {
                          const customer = await db.customers.get(customerId!);
                          if (customer) {
                              await db.customers.update(customerId!, {
                                  balance: (customer.balance || 0) - (oldBooking.remaining || 0),
                                  totalSpent: (customer.totalSpent || 0) - (oldBooking.price || 0)
                              });
                          }
                      }
                  }
                  await db.studioBookings.update(bookingForm.id, bookingData);
              } else {
                  if (bookingData.deposit > 0 && activeShift) {
                      await db.shifts.update(activeShift.id!, {
                          expectedCash: (activeShift.expectedCash || 0) + bookingData.deposit,
                          cashSales: (activeShift.cashSales || 0) + bookingData.deposit
                      });
                  }
                  await db.studioBookings.add(bookingData);
              }
          });
          setIsModalOpen(false);
      } catch (error: any) {
          alert('خطأ أثناء الحفظ: ' + error.message);
      }
  };

  const handleDeleteBooking = async (id: number) => {
      if(window.confirm('حذف الحجز؟')) {
          const booking = await db.studioBookings.get(id);
          if (booking && booking.status !== 'cancelled' && booking.deposit > 0) {
              const activeShift = await db.shifts.where('status').equals('open').first();
              if (activeShift) {
                  await db.shifts.update(activeShift.id!, {
                      expectedCash: (activeShift.expectedCash || 0) - booking.deposit,
                      cashSales: (activeShift.cashSales || 0) - booking.deposit
                  });
              }
          }
          await db.studioBookings.delete(id);
      }
  };

  const handleAddCamera = async () => {
      if(!cameraForm.name) return;
      if (cameraForm.id) {
          await db.cameras.update(cameraForm.id, cameraForm as Camera);
      } else {
          await db.cameras.add(cameraForm as Camera);
      }
      setIsCameraModalOpen(false);
      setCameraForm({ name: '', dailyRate: 0, hourlyRate: 0, sessionRate: 0, photoRate: 0, status: 'active' });
  };

  const updatePriceDefaults = (cameraId: number, type: PricingType) => {
      const cam = cameras?.find(c => c.id === cameraId);
      if (cam) {
          let rate = 0;
          let qty = 1;
          
          switch(type) {
              case 'hourly': rate = cam.hourlyRate || 0; qty = 1; break;
              case 'daily': rate = cam.dailyRate || 0; qty = 1; break;
              case 'session': rate = cam.sessionRate || 0; qty = 1; break;
              case 'photo': rate = cam.photoRate || 0; qty = 50; break; // Default 50 photos example
          }

          setBookingForm(prev => ({
              ...prev, 
              cameraId,
              pricingType: type,
              unitPrice: rate,
              quantity: qty
          }));
      }
  };

  // --- Communication ---
  const sendWhatsApp = (booking: StudioBooking) => {
      if (!booking.customerPhone) return;
      const phone = booking.customerPhone.replace(/[^0-9]/g, '');
      const text = `مرحبا ${booking.customerName}،\nنؤكد حجزكم لدينا بتاريخ ${booking.date} للتصوير.\nالكاميرا: ${booking.cameraName}\nالمبلغ المتبقي: ${booking.remaining}\nشكراً لاختياركم استوديو.`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyBookingDetails = (booking: StudioBooking) => {
      const text = `حجز جديد\nالعميل: ${booking.customerName}\nالتاريخ: ${booking.date}\nالكاميرا: ${booking.cameraName}\nالعنوان: ${booking.city} - ${booking.address}\nالهاتف: ${booking.customerPhone}`;
      navigator.clipboard.writeText(text);
      alert('تم نسخ التفاصيل');
  };

  // --- Printing ---
  const printBookingTicket = (booking: StudioBooking) => {
      const printWindow = window.open('', '', 'width=600,height=600');
      if (!printWindow) return;

      const currency = settings?.currencyCode || 'EGP';
      
      const html = `
        <html dir="rtl" lang="ar">
        <head>
          <title>إيصال حجز #${booking.id}</title>
          <style>
            body { font-family: 'Tahoma', sans-serif; padding: 20px; color: #333; max-width: 80mm; margin: 0 auto; text-align: center; }
            h2 { margin: 0; font-size: 18px; }
            .header { border-bottom: 2px dashed #333; padding-bottom: 10px; margin-bottom: 15px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
            .label { font-weight: bold; }
            .box { border: 1px solid #333; padding: 10px; margin: 15px 0; font-weight: bold; }
            .total { font-size: 16px; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${settings?.storeName || 'Studio'}</h2>
            <p>إيصال حجز تصوير</p>
            <p>تاريخ: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="row">
             <span class="label">العميل:</span>
             <span>${booking.customerName}</span>
          </div>
          <div class="row">
             <span class="label">الهاتف:</span>
             <span>${booking.customerPhone || '-'}</span>
          </div>
          <div class="row">
             <span class="label">التاريخ:</span>
             <span>${booking.date}</span>
          </div>
          <div class="row">
             <span class="label">الكاميرا:</span>
             <span>${booking.cameraName}</span>
          </div>
           <div class="row">
             <span class="label">العنوان:</span>
             <span>${booking.city || ''} - ${booking.address || ''}</span>
          </div>
          
          <div class="box">
             <div class="row">
                <span>الإجمالي المتفق عليه:</span>
                <span>${booking.price.toLocaleString()} ${currency}</span>
             </div>
             <div class="row">
                <span>المدفوع (عربون):</span>
                <span>${booking.deposit.toLocaleString()} ${currency}</span>
             </div>
             <div class="row total">
                <span>المتبقي:</span>
                <span>${booking.remaining.toLocaleString()} ${currency}</span>
             </div>
          </div>
          
          <p style="font-size: 10px; margin-top: 20px;">شكراً لاختياركم خدماتنا</p>
          <script>window.print();</script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
  };

  // Helpers
  const getStatusColor = (status: BookingStatus) => {
      switch(status) {
          case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200';
          case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
          case 'completed': return 'bg-green-100 text-green-800 border-green-200';
          case 'cancelled': return 'bg-red-100 text-red-800 border-red-200 opacity-60';
          default: return 'bg-slate-100 text-slate-800';
      }
  };

  const getStatusLabel = (status: BookingStatus) => {
      switch(status) {
          case 'pending': return 'قيد الانتظار';
          case 'confirmed': return 'مؤكد';
          case 'completed': return 'مكتمل';
          case 'cancelled': return 'ملغي';
      }
  };

  const getShiftBadge = (shift: ShiftType) => {
      switch(shift) {
          case 'full': return { label: 'يوم كامل', color: 'bg-indigo-50 text-indigo-700', icon: Sun };
          case 'morning': return { label: 'صباحي', color: 'bg-amber-50 text-amber-700', icon: Sun };
          case 'night': return { label: 'مسائي', color: 'bg-slate-800 text-slate-100', icon: Moon };
      }
  };

  const handleAddBooking = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      setBookingForm({ 
          date: dateStr,
          cameraId: undefined,
          shift: 'full',
          status: 'pending',
          pricingType: 'daily',
          quantity: 1,
          unitPrice: 0,
          price: 0,
          deposit: 0,
          remaining: 0,
          customerName: '',
          customerPhone: '',
          technicianName: '',
          city: '',
          venueType: 'home',
          address: '',
          shootingDuration: 6,
          startTime: '10:00'
      });
      setIsModalOpen(true);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50/50 font-['Tajawal']">
        <StudioHeader onShowCameras={() => setViewMode('cameras')} onAddBooking={handleAddBooking} />
        
        <StudioStats monthStats={monthStats} formatCurrency={formatCurrency} />

        <StudioToolbar 
            monthName={monthName}
            onChangeMonth={changeMonth}
            viewMode={viewMode}
            onSetViewMode={setViewMode}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onToday={() => setCurrentDate(new Date())}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
        />

        {viewMode === 'calendar' && (
            <StudioCalendar 
                daysInMonth={daysInMonth}
                getBookingsForDay={getBookingsForDay}
                handleDayClick={handleDayClick}
                handleEditBooking={handleEditBooking}
                sendWhatsApp={sendWhatsApp}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                getShiftBadge={getShiftBadge}
                formatCurrency={formatCurrency}
                handleDeleteBooking={handleDeleteBooking}
            />
        )}
        
        {viewMode === 'list' && (
            <StudioList 
                bookings={getAllBookingsSorted()}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
                getShiftBadge={getShiftBadge}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                sendWhatsApp={sendWhatsApp}
                copyBookingDetails={copyBookingDetails}
                handleEditBooking={handleEditBooking}
                printBookingTicket={printBookingTicket}
            />
        )}

        {viewMode === 'cameras' && (
            <StudioCamerasList 
                cameras={cameras}
                onEditCamera={(camera) => {
                    setCameraForm(camera);
                    setIsCameraModalOpen(true);
                }}
                onDeleteCamera={async (id) => {
                    if (window.confirm('هل أنت متأكد من حذف هذه الكاميرا؟')) {
                        await db.cameras.delete(id);
                    }
                }}
                onAddCamera={() => {
                    setCameraForm({ name: '', dailyRate: 0, hourlyRate: 0, sessionRate: 0, photoRate: 0, status: 'active' });
                    setIsCameraModalOpen(true);
                }}
            />
        )}

        {isModalOpen && (
            <StudioBookingModal 
                bookingForm={bookingForm}
                setBookingForm={setBookingForm}
                cameras={cameras}
                customers={customers}
                updatePriceDefaults={updatePriceDefaults}
                getStatusColor={getStatusColor}
                handleSaveBooking={handleSaveBooking}
                onClose={() => setIsModalOpen(false)}
                viewMode={viewMode}
                getBookingsForDay={getBookingsForDay}
                getShiftBadge={getShiftBadge}
                getStatusLabel={getStatusLabel}
                handleEditBooking={handleEditBooking}
                sendWhatsApp={sendWhatsApp}
                printBookingTicket={printBookingTicket}
                handleDeleteBooking={handleDeleteBooking}
            />
        )}

        {isCameraModalOpen && (
            <StudioCameraModal 
                cameraForm={cameraForm}
                setCameraForm={setCameraForm}
                handleAddCamera={handleAddCamera}
                onClose={() => setIsCameraModalOpen(false)}
            />
        )}
    </div>
  );
};

export default StudioScheduler;
