import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MaintenanceOutsource, MaintenanceOrder } from '../../types';
import { 
  Network, Plus, Send, Check, X, Search, DollarSign, Calendar, TrendingUp, 
  ArrowLeftRight, FileText, ClipboardList, Clock, RefreshCw, BarChart2, Briefcase, 
  AlertCircle, Building, Smile, CheckCircle, Undo2, MapPin, Calculator, HelpCircle
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';

// Web Audio API beep helper for interactive sound feedback
const playSound = (type: 'beep_ok' | 'beep_warning' | 'beep_success') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'beep_ok') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(512, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'beep_warning') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(110, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.setValueAtTime(900, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.warn("Audio Context blocked or unsupported.", e);
  }
};

const ComputerMobileOutsourcing: React.FC = () => {
  // Live queries from Dexie
  const outsources = useLiveQuery(() => db.maintenanceOutsources.toArray()) || [];
  const maintenanceOrders = useLiveQuery(() => db.maintenanceOrders.toArray()) || [];

  // Filter & search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'returned_repaired' | 'returned_unrepaired' | 'delivered'>('all');

  // Form states
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [linkedOrderId, setLinkedOrderId] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deviceBrand, setDeviceBrand] = useState<string>('');
  const [deviceModel, setDeviceModel] = useState<string>('');
  const [deviceSerial, setDeviceSerial] = useState<string>('');
  const [centerName, setCenterName] = useState<string>('مركز أولكسندر للماكينات الدقيقة'); // Ukrainian center
  const [sentDate, setSentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expectedReturnDate, setExpectedReturnDate] = useState<string>('');
  const [externalCost, setExternalCost] = useState<string>('500');
  const [customerCharge, setCustomerCharge] = useState<string>('1200');
  const [notes, setNotes] = useState<string>('');

  // Status transition state
  const [updatingTicket, setUpdatingTicket] = useState<MaintenanceOutsource | null>(null);
  const [newStatus, setNewStatus] = useState<'sent' | 'returned_repaired' | 'returned_unrepaired' | 'delivered'>('returned_repaired');
  const [actualCostOverride, setActualCostOverride] = useState<string>('');
  const [actualChargeOverride, setActualChargeOverride] = useState<string>('');
  const [transitionNotes, setTransitionNotes] = useState<string>('');

  // Pre-seed some outsourcing tickets for demo if database is empty
  useEffect(() => {
    const seedOutsourceData = async () => {
      const count = await db.maintenanceOutsources.count();
      if (count === 0) {
        const someOrder = maintenanceOrders[0];
        
        await db.maintenanceOutsources.bulkAdd([
          {
            orderId: someOrder?.id || 101,
            customerName: 'روستيسلاف كوفالينكو', // Christian Ukrainian Name
            customerPhone: '01299334411',
            deviceBrand: 'Apple',
            deviceModel: 'MacBook Pro 16 M1',
            deviceSerial: 'SN-MAC-M1-9923',
            centerName: 'مختبر إيفان لإعادة الشحن والتخريد البيولوجي',
            sentDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
            expectedReturnDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
            externalCost: 1200,
            customerCharge: 3200,
            status: 'sent',
            notes: 'تحتاج عملية ريبولينج لمعالج الرسوميات وتعديل المكثفات المحروقة حول منفذ الشحن.'
          },
          {
            orderId: 102,
            customerName: 'فالنتينا يفتوشينكو', // Christian Ukrainian Name
            customerPhone: '01002244998',
            deviceBrand: 'Asus',
            deviceModel: 'ROG Strix G15',
            deviceSerial: 'SN-ASUS-ROG-3829',
            centerName: 'مركز غريغوري لهندسة الدوائر المتكاملة',
            sentDate: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString().split('T')[0],
            expectedReturnDate: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString().split('T')[0],
            externalCost: 800,
            customerCharge: 1800,
            status: 'returned_repaired',
            resolvedDate: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString().split('T')[0],
            notes: 'تم فك الآي سي الرئيسي للشحن واستبداله بآخر مكافئ تماماً واجتاز الجهاز اختبار الكهرباء المستمر.'
          }
        ]);
      }
    };
    seedOutsourceData();
  }, [maintenanceOrders]);

  // Handle autocompleting fields when selecting a linked order
  useEffect(() => {
    if (linkedOrderId) {
      const order = maintenanceOrders.find(o => o.id === parseInt(linkedOrderId));
      if (order) {
        setCustomerName(order.customerName);
        setCustomerPhone(order.customerPhone);
        setDeviceBrand(order.deviceBrand || '');
        setDeviceModel(order.deviceModel);
        setDeviceSerial(order.deviceSerial || '');
        setCustomerCharge((order.expectedCost || 1000).toString());
        playSound('beep_ok');
        toast.success(`✓ تم جلب بيانات كارت الصيانة #${order.id} تلقائياً`);
      }
    }
  }, [linkedOrderId, maintenanceOrders]);

  // Handle submission of new external outsource ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !deviceModel || !centerName) {
      toast.error('الرجاء تعبئة الحقول الأساسية: اسم العميل، والمركز الخارجي، وموديل الجهاز');
      return;
    }

    try {
      const parsedOrder = linkedOrderId ? parseInt(linkedOrderId) : undefined;
      const extCost = parseFloat(externalCost) || 0;
      const custChg = parseFloat(customerCharge) || 0;

      const newTicket: MaintenanceOutsource = {
        orderId: parsedOrder,
        customerName,
        customerPhone,
        deviceBrand,
        deviceModel,
        deviceSerial,
        centerName,
        sentDate,
        expectedReturnDate: expectedReturnDate || undefined,
        externalCost: extCost,
        customerCharge: custChg,
        status: 'sent',
        notes
      };

      const ticketId = await db.maintenanceOutsources.add(newTicket);

      // Optionally, update the status of the linked maintenance order to "repairing" and add notes
      if (parsedOrder) {
        await db.maintenanceOrders.update(parsedOrder, {
          status: 'repairing',
          notes: `[صيانة خارجية]: تم إرسال الجهاز إلى مركز (${centerName}) بتاريخ ${sentDate} لحل مشاكل تخصصية. التكلفة المتوقعة للمركز: ${extCost} ج.م`
        });
      }

      // Record a tentative journal entry or log for outsourcing commitment
      // Debit: Committed Outsourcing Service Expense (5045) pre-evaluation, Credit: Outsourcing Outstanding (2120)
      const jvId = `JV-OUTS-${ticketId}`;
      const todayStr = new Date().toISOString().split('T')[0];
      const acc5040 = await db.accounts.where('code').equals('5040').first() || { id: 5040, name: 'تكاليف صيانة خارجية' };
      const acc2100 = await db.accounts.where('code').equals('2100').first() || { id: 2100, name: 'دائنو مراكز صيانة خارجية' };

      await db.journalEntries.add({
        date: new Date(todayStr),
        reference: jvId,
        description: `ارتباط صيانة خارجية كارت #${parsedOrder || 'حر'} بمركز ${centerName} للعميل ${customerName}`,
        lines: [
          { accountId: acc5040.id || 5040, accountName: acc5040.name, debit: extCost, credit: 0 },
          { accountId: acc2100.id || 2100, accountName: acc2100.name, debit: 0, credit: extCost }
        ],
        totalAmount: extCost,
        status: 'posted'
      });

      playSound('beep_success');
      toast.success(`✓ تم تسجيل كارت الصيانة الخارجية بنجاح وتوليد قيد الاحتياط المحاسبي.`);
      
      // Cleanup states
      setIsDrawerOpen(false);
      setLinkedOrderId('');
      setCustomerName('');
      setCustomerPhone('');
      setDeviceBrand('');
      setDeviceModel('');
      setDeviceSerial('');
      setNotes('');
    } catch (err) {
      toast.error('أخفق التسجيل البرمجي لكارت الصيانة الخارجية');
    }
  };

  // Resolve external status (Returned restored / returned dead / delivered)
  const handleResolveStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingTicket || !updatingTicket.id) return;

    try {
      const ticketId = updatingTicket.id;
      const finalCost = parseFloat(actualCostOverride) || updatingTicket.externalCost;
      const finalCharge = parseFloat(actualChargeOverride) || updatingTicket.customerCharge;
      const netProfit = finalCharge - finalCost;

      // Update external ticket
      const updateData: Partial<MaintenanceOutsource> = {
        status: newStatus,
        externalCost: finalCost,
        customerCharge: finalCharge,
        resolvedDate: new Date().toISOString().split('T')[0],
        notes: `${updatingTicket.notes || ''} | تعديل الحالة لـ [${newStatus}]: ${transitionNotes || 'بدون ملاحظات'}`
      };

      await db.maintenanceOutsources.update(ticketId, updateData);

      // Financial Integration - Generate final adjusting ledger entry
      const todayStr = new Date().toISOString().split('T')[0];
      const jvRef = `JV-ADJ-${ticketId}`;

      if (newStatus === 'returned_repaired') {
        // Successful outsource.
        // We charge the customer 'finalCharge' and pay external center 'finalCost'.
        // Debit: Main Cash (1010) or Client account (1100) -> finalCharge
        // Credit: Maintenance Service Income (4050) -> finalCharge
        // Debit: Accounts payable (2100) or cash payout -> finalCost
        const acc1010 = await db.accounts.where('code').equals('1010').first() || { id: 1010, name: 'الصندوق' };
        const acc4050 = await db.accounts.where('code').equals('4050').first() || { id: 4050, name: 'إيرادات خدمات صيانة' };
        const acc2100 = await db.accounts.where('code').equals('2100').first() || { id: 2100, name: 'دائنو مراكز صيانة خارجية' };

        await db.journalEntries.add({
          date: new Date(todayStr),
          reference: jvRef,
          description: `تسوية أرباح صيانة خارجية ناجحة كارت #${updatingTicket.orderId || ticketId} من مركز ${updatingTicket.centerName}`,
          lines: [
            { accountId: acc1010.id || 1010, accountName: acc1010.name, debit: finalCharge, credit: 0 }, // Collected Cash
            { accountId: acc4050.id || 4050, accountName: acc4050.name, debit: 0, credit: finalCharge }, // Revenue
            { accountId: acc2100.id || 2100, accountName: acc2100.name, debit: finalCost, credit: 0 },   // Clear external payable
            { accountId: acc1010.id || 1010, accountName: acc1010.name, debit: 0, credit: finalCost }    // Paid center cash
          ],
          totalAmount: finalCharge + finalCost,
          status: 'posted'
        });

        // If there was a linked maintenance order, make it ready!
        if (updatingTicket.orderId) {
          await db.maintenanceOrders.update(updatingTicket.orderId, {
            status: 'ready',
            actualCost: finalCharge,
            notes: `[صيانة خارجية]: عاد الجهاز سليماً من مركز (${updatingTicket.centerName}). التكلفة الخارجية النهائية: ${finalCost} ج.م`
          });
        }
      } else if (newStatus === 'returned_unrepaired') {
        // Failed outsource. External center might charge a diagnosis fee or zero.
        // Clear payable and record small diagnosis cost if any
        const acc2100 = await db.accounts.where('code').equals('2100').first() || { id: 2100, name: 'دائنو مراكز صيانة خارجية' };
        const acc5040 = await db.accounts.where('code').equals('5040').first() || { id: 5040, name: 'تكاليف صيانة خارجية' };
        const acc1010 = await db.accounts.where('code').equals('1010').first() || { id: 1010, name: 'الصندوق' };

        await db.journalEntries.add({
          date: new Date(todayStr),
          reference: jvRef,
          description: `تسوية تذكرة صيانة خارجية مرتجعة دون إصلاح كارت #${updatingTicket.orderId || ticketId}`,
          lines: [
            { accountId: acc2100.id || 2100, accountName: acc2100.name, debit: updatingTicket.externalCost, credit: 0 }, // Clear old estimated payable
            { accountId: acc5040.id || 5040, accountName: acc5040.name, debit: finalCost, credit: 0 },                   // Actual micro diagnosis expense if any
            { accountId: acc1010.id || 1010, accountName: acc1010.name, debit: 0, credit: finalCost + updatingTicket.externalCost } // Cash paid for diag
          ],
          totalAmount: finalCost + updatingTicket.externalCost,
          status: 'posted'
        });

        if (updatingTicket.orderId) {
          await db.maintenanceOrders.update(updatingTicket.orderId, {
            status: 'diagnosing',
            notes: `[صيانة خارجية]: عاد الجهاز دون إصلاح من مركز (${updatingTicket.centerName}) - ملاحظات: ${transitionNotes}`
          });
        }
      } else if (newStatus === 'delivered') {
        // Straight delivery from external center (direct logic)
        if (updatingTicket.orderId) {
          await db.maintenanceOrders.update(updatingTicket.orderId, {
            status: 'delivered',
            deliveredDate: new Date(),
            notes: `[تسوية نهائية وصيانة خارجية تسليم]: تم التسليم المباشر للمستخدم.`
          });
        }
      }

      playSound('beep_success');
      toast.success(`✓ تم تحديث حالة الصيانة الخارجية وعقد التسوية المالية بالخيار [${newStatus}]`);
      setUpdatingTicket(null);
      setTransitionNotes('');
    } catch (err) {
      toast.error('أخفق تحديث كارت الصيانة الخارجية محاسبياً');
    }
  };

  // Perform search query filter
  const filteredTickets = outsources.filter(ticket => {
    const matchesSearch = 
      ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.centerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.deviceModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.customerPhone && ticket.customerPhone.includes(searchQuery)) ||
      (ticket.orderId && ticket.orderId.toString() === searchQuery);

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculations for KPI blocks
  const activeSentCount = outsources.filter(t => t.status === 'sent').length;
  const totalInternalCommissions = outsources.filter(t => t.status === 'returned_repaired' || t.status === 'delivered')
    .reduce((sum, t) => sum + (t.customerCharge - t.externalCost), 0);
  const totalExternalPayables = outsources.filter(t => t.status === 'sent').reduce((sum, t) => sum + t.externalCost, 0);

  return (
    <div className="p-6 select-none max-w-[1605px] mx-auto space-y-8 text-slate-800" dir="rtl">
      
      {/* Styles & Cairo font theme integration */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
        .outsourcing-main-font {
          font-family: 'Tajawal', 'Cairo', sans-serif !important;
        }
      `}</style>
      
      <Toaster position="top-left" reverseOrder={false} />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-200 pb-5 outsourcing-main-font">
        <div className="space-y-1 text-right">
          <div className="flex items-center gap-2.5 justify-start">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-200">
              <Network className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">إدارة الصيانة الخارجية والـ Outsourcing للورشة</h1>
              <p className="text-[11.5px] text-slate-500 font-bold">بوابة متكاملة لتتبع اللاب توب والموبايلات الصادرة لمراكز تخصصية أخرى وحساب صافي الأرباح والقيود المالية بالخلفية</p>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={() => {
            setIsDrawerOpen(true);
            playSound('beep_ok');
          }}
          className="p-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl cursor-pointer transition-all flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          إرسال جهاز جديد لمركز خارجي (Outsource)
        </button>
      </div>

      {/* KPI stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 outsourcing-main-font">
        {/* KPI 1 */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-slate-400 block">أجهزة برسم الصيانة بالخارج حالياً</span>
            <span className="text-2xl font-black text-indigo-600 font-mono block">
              {activeSentCount} أجهزة
            </span>
            <span className="text-[9.5px] font-bold text-indigo-605 bg-indigo-50 p-0.5 px-2 rounded-md w-fit border border-indigo-100 block">
              في حماية مراكز هندسية خارجية
            </span>
          </div>
          <div className="p-4 bg-indigo-50 text-indigo-500 rounded-2xl">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-slate-400 block">التكلفة المستحقة للمراكز الخارجية (Payable)</span>
            <span className="text-2xl font-black text-amber-600 block font-mono">
              {totalExternalPayables.toLocaleString()} <span className="text-xs">ج.م</span>
            </span>
            <span className="text-[9.5px] font-bold text-amber-600 bg-amber-50 p-0.5 px-2 rounded-md w-fit border border-amber-100 block">
              ديون رهن الصيانة الجارية
            </span>
          </div>
          <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-slate-400 block">صافي أرباح المنشأة من الأوتسورسنج</span>
            <span className="text-2xl font-black text-emerald-600 font-mono block">
              {totalInternalCommissions.toLocaleString()} <span className="text-xs">ج.م</span>
            </span>
            <span className="text-[9.5px] font-bold text-emerald-600 bg-emerald-50 p-0.5 px-2 rounded-md w-fit border border-emerald-100 block">
              الفرق الإيجابي لصالح الورشة
            </span>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-3xs flex items-center justify-between text-right">
          <div className="space-y-1">
            <span className="text-[11px] font-black text-slate-400 block">إجمالي كروت الخدمة الخارجية مسجلة</span>
            <span className="text-2xl font-black text-slate-700 font-mono block">
              {outsources.length} تذاكر
            </span>
            <span className="text-[9.5px] font-bold text-slate-600 bg-slate-50 p-0.5 px-2 rounded-md w-fit border border-slate-200 block">
              نسبة نجاح الإصلاح: {outsources.length > 0 ? Math.round((outsources.filter(o => o.status === 'returned_repaired' || o.status === 'delivered').length / outsources.length) * 100) : 0}%
            </span>
          </div>
          <div className="p-4 bg-slate-50 text-slate-500 rounded-2xl">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control panel & filter */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-3xs flex flex-col md:flex-row items-center justify-between gap-4.5 outsourcing-main-font">
        
        {/* Search Input bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="البحث باسم العميل، المركز، كارت الصيانة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-bold p-3 pr-4 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 text-right"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
        </div>

        {/* Filter categories */}
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { key: 'all', label: 'كافة الحركات' },
            { key: 'sent', label: 'في المعمل الخارجي' },
            { key: 'returned_repaired', label: 'تم إصلاحها وعادت' },
            { key: 'returned_unrepaired', label: 'مرتجعة بلا إصلاح' },
            { key: 'delivered', label: 'تم تسليمها للعميل نهائياً' }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setStatusFilter(item.key as any);
                playSound('beep_ok');
              }}
              className={`p-2.5 px-4 text-xs font-black rounded-xl cursor-pointer transition-all whitespace-nowrap ${statusFilter === item.key ? 'bg-indigo-650 text-white shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-650'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tickets List Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-3xs text-right space-y-4 outsourcing-main-font">
        
        <div className="flex border-b pb-3.5 items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">أرشيف وجرد تذاكر الصيانة الخارجية والـ Outsourcing المتطابقة</h3>
            <p className="text-[11px] text-slate-400 font-bold">تتبع حالة ومسار الأجهزة المسلمة ومقارنة هامش تكلفة المورد الخارجي بسعر بيع المحل المعتمد</p>
          </div>
          <span className="text-[10.5px] bg-indigo-50 text-indigo-700 font-black p-1 px-3.5 rounded-lg border border-indigo-100">
            تم العثور على {filteredTickets.length} حركة خارجية
          </span>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-2xl space-y-3">
            <Briefcase className="w-12 h-12 text-slate-350 mx-auto opacity-30" />
            <h4 className="text-sm font-black text-slate-650">لا توجد عمليات صيانة خارجية مسجلة حالياً بهذا الفرز</h4>
            <p className="text-[10.5px] text-slate-400 max-w-sm mx-auto leading-relaxed">
              تصفح التبويبات الأخرى أو انقر على الزر بالأعلى لتسجيل وإرسال بوردة أو لابتوب لمختبر خارجي للاستفادة التدويرية.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                  <th className="p-3.5">تذكرة خارجية / كارت</th>
                  <th className="p-3.5">العميل الهاتف</th>
                  <th className="p-3.5">اسم المختبر أو المركز الخارجي</th>
                  <th className="p-3.5 text-center">البيانات الفنية للجهاز</th>
                  <th className="p-3.5 text-center">تاريخ الخروج / المتوقع</th>
                  <th className="p-3.5 text-left">التكاليف الخارجية</th>
                  <th className="p-3.5 text-left">التكلفة للعميل</th>
                  <th className="p-3.5 text-center">صافي ربح المحل</th>
                  <th className="p-3.5 text-center">الحالة الإجرائية</th>
                  <th className="p-3.5 text-left">التحكم والإغلاق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {filteredTickets.map((ticket) => {
                  const profit = ticket.customerCharge - ticket.externalCost;
                  const isReturned = ticket.status === 'returned_repaired' || ticket.status === 'delivered';
                  
                  return (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Ticket id & Order relation */}
                      <td className="p-3.5">
                        <span className="font-extrabold text-indigo-700 block">#EXT-{ticket.id}</span>
                        {ticket.orderId ? (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 p-0.5 px-2 rounded-md font-mono mt-1 block w-fit">
                            كارت صيانة #{ticket.orderId}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-700 p-0.5 px-2 rounded-md font-mono mt-1 block w-fit">
                            صيانة حرة خارج الكروت
                          </span>
                        )}
                      </td>

                      {/* Customer names (Christian Ukrainian only!) */}
                      <td className="p-3.5">
                        <span className="font-black text-slate-800 block text-xs">{ticket.customerName}</span>
                        <span className="text-[10px] text-slate-450 block font-mono">{ticket.customerPhone}</span>
                      </td>

                      {/* External Center Name */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 justify-start">
                          <Building className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="font-black text-slate-700 block">{ticket.centerName}</span>
                        </div>
                        {ticket.notes && (
                          <span className="text-[10px] text-slate-400 mt-1 block max-w-xs text-right truncate">
                            📝 {ticket.notes}
                          </span>
                        )}
                      </td>

                      {/* Device technical specification */}
                      <td className="p-3.5 text-center">
                        <span className="text-slate-900 block font-extrabold">{ticket.deviceBrand || ''} {ticket.deviceModel}</span>
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">S/N: {ticket.deviceSerial || 'لم يسجل'}</span>
                      </td>

                      {/* Dates sent and expected */}
                      <td className="p-3.5 text-center">
                        <span className="text-slate-700 font-mono block">الصنف خرج: {new Date(ticket.sentDate).toLocaleDateString('ar-EG')}</span>
                        {ticket.expectedReturnDate && (
                          <span className="text-[9.5px] text-indigo-650 bg-indigo-50 p-0.5 px-1.5 rounded-md mt-1 block w-fit mx-auto">
                            المتوقع: {new Date(ticket.expectedReturnDate).toLocaleDateString('ar-EG')}
                          </span>
                        )}
                      </td>

                      {/* External labor cost (from outsource supplier) */}
                      <td className="p-3.5 text-left font-mono">
                        <span className="text-amber-700 block">{ticket.externalCost.toLocaleString()} ج.م</span>
                        <span className="text-[9px] text-slate-400 block">لتسويته مع المركز</span>
                      </td>

                      {/* Charge of store to customer */}
                      <td className="p-3.5 text-left font-mono">
                        <span className="text-indigo-900 block">{ticket.customerCharge.toLocaleString()} ج.م</span>
                        <span className="text-[9px] text-slate-400 block">مسجلة بفاتورة العميل</span>
                      </td>

                      {/* Calculated Profit Margin */}
                      <td className="p-3.5 text-center font-mono">
                        <span className={`p-1 px-2.5 rounded-lg font-black text-xs ${profit >= 1000 ? 'bg-emerald-100 text-emerald-700' : profit > 0 ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>
                          {profit.toLocaleString()} ج.م
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-1">هامش ربح الورشة</span>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5 text-center">
                        {ticket.status === 'sent' && (
                          <span className="p-1 px-2.5 rounded-lg text-[10px] bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            بالخارج ⚒️
                          </span>
                        )}
                        {ticket.status === 'returned_repaired' && (
                          <span className="p-1 px-2.5 rounded-lg text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-250">
                            ✓ تم الإصلاح وعاد
                          </span>
                        )}
                        {ticket.status === 'returned_unrepaired' && (
                          <span className="p-1 px-2.5 rounded-lg text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                            ✖ تعذر الإصلاح وعاد
                          </span>
                        )}
                        {ticket.status === 'delivered' && (
                          <span className="p-1 px-2.5 rounded-lg text-[10px] bg-slate-800 text-white border border-slate-900">
                            ✓ تم التسليم النهائي للزبون
                          </span>
                        )}
                      </td>

                      {/* Control buttons */}
                      <td className="p-3.5 text-left">
                        {ticket.status === 'sent' ? (
                          <button
                            onClick={() => {
                              setUpdatingTicket(ticket);
                              setNewStatus('returned_repaired');
                              setActualCostOverride(ticket.externalCost.toString());
                              setActualChargeOverride(ticket.customerCharge.toString());
                              playSound('beep_ok');
                            }}
                            className="p-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-lg cursor-pointer transition-all flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                            تحديث واستلام الجهاز للورشة
                          </button>
                        ) : (
                          <div className="text-[10px] text-slate-450 space-y-0.5 text-right font-bold leading-relaxed">
                            <span>تاريخ وتأكيد الاستلام والقيود:</span>
                            <span className="text-slate-800 block">✓ {ticket.resolvedDate ? new Date(ticket.resolvedDate).toLocaleDateString('ar-EG') : 'تم المراجعة'}</span>
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DRAWER / SLIDE-OVER TO CREATE OUTSOURCED TICKET */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 outsourcing-main-font" dir="rtl">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 text-right space-y-5 animate-in fade-in-50 duration-200">
            
            {/* Header Drawer */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <Network className="w-5 h-5 text-indigo-600" />
                  تسجيل تذكرة صيانة خارجية جديدة (Outsourcing Ticket)
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">إسناد الأجهزة والمكونات لمركز تقني خارجي وتوثيق التكلفة الخارجية والربط البرمي المالي</p>
              </div>
              <button
                onClick={() => { setIsDrawerOpen(false); playSound('beep_warning'); }}
                className="p-1 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              
              {/* Optional Link to existing maintenance orders */}
              <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                    <ClipboardList className="w-4 h-4 text-indigo-650" />
                    هل ترغب في ربط التذكرة بكارت صيانة حالي في الورشة؟
                  </label>
                  <span className="text-[9.5px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-md">اختياري</span>
                </div>
                
                <select
                  value={linkedOrderId}
                  onChange={(e) => setLinkedOrderId(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-xl bg-white text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- تخطي الربط (تسجيل صيانة حرة مع المورد الخارجي) --</option>
                  {maintenanceOrders
                    .filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
                    .map(o => (
                      <option key={o.id} value={o.id}>
                        كارت رقم #{o.id} - العميل: {o.customerName} | جهاز: {o.deviceBrand} {o.deviceModel}
                      </option>
                    ))}
                </select>
              </div>

              {/* Customer and device information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">اسم صاحب الجهاز (العميل):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أندري سافتشينكو"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs font-extrabold p-2.5 border border-slate-200 rounded-xl bg-white text-right"
                  />
                  <span className="text-[9.5px] text-slate-400 block font-bold">اسم أوكراني مسيحي فقط لبيانات العينة حمايةً للقاعدة.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">هاتف العميل:</label>
                  <input
                    type="text"
                    placeholder="مثال: 01100223399"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full text-xs font-extrabold p-2.5 border border-slate-200 rounded-xl bg-white text-right"
                  />
                </div>
              </div>

              {/* Technical features & brand */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">الشركة المصنعة (البراند):</label>
                  <input
                    type="text"
                    placeholder="مثال: Apple, Samsung"
                    value={deviceBrand}
                    onChange={(e) => setDeviceBrand(e.target.value)}
                    className="w-full text-xs font-extrabold p-2.5 border border-slate-200 rounded-xl bg-white text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">موديل الجهاز بالتفصيل:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Galaxy Tab S8"
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    className="w-full text-xs font-extrabold p-2.5 border border-slate-200 rounded-xl bg-white text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-700 block">السيريال نمبر / IMEI:</label>
                  <input
                    type="text"
                    placeholder="مثال: SN-554-A"
                    value={deviceSerial}
                    onChange={(e) => setDeviceSerial(e.target.value)}
                    className="w-full text-xs font-extrabold p-2.5 border border-slate-200 rounded-xl bg-white text-right"
                  />
                </div>
              </div>

              {/* Foreign center and pricing metrics */}
              <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-indigo-900 block">اسم مركز الصيانة الخارجي المتخصص:</label>
                    <select
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                      className="w-full text-[11px] font-black p-2.5 border border-indigo-200 rounded-xl bg-white text-right"
                    >
                      <option value="مركز أولكسندر للماكينات الدقيقة">مركز أولكسندر للماكينات الدقيقة (المعالج والـ BGA)</option>
                      <option value="مختبر إيفان لإعادة الشحن والتخريد البيولوجي">مختبر إيفان لإعادة الشحن والتخريد البيولوجي (سوائل ولوجيك بورد)</option>
                      <option value="مركز غريغوري لهندسة الدوائر المتكاملة">مركز غريغوري لهندسة الدوائر المتكاملة (شاشات وأمبيديد)</option>
                      <option value="مؤسسة تاراس لتصميم وتعديل الشاسيهات المعقدة">مؤسسة تاراس لتصميم وتعديل الشاسيهات المعقدة (شغل زجاجي وCNC)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-755 block">تاريخ الإرسال الفعلي:</label>
                    <input
                      type="date"
                      required
                      value={sentDate}
                      onChange={(e) => setSentDate(e.target.value)}
                      className="w-full text-xs font-extrabold p-2.5 border border-slate-200 rounded-xl bg-white text-right font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">تكلفة المركز الخارجي المقدرة (ج.م):</label>
                    <input
                      type="number"
                      required
                      value={externalCost}
                      onChange={(e) => setExternalCost(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-xl bg-white font-mono text-left"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">التكلفة المفروضة على العميل (ج.م):</label>
                    <input
                      type="number"
                      required
                      value={customerCharge}
                      onChange={(e) => setCustomerCharge(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-xl bg-white font-mono text-left"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-indigo-950 block">صافي الربح المتوقع للورشة:</label>
                    <div className="p-3 text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl text-center font-mono">
                      {(parseFloat(customerCharge) - parseFloat(externalCost) || 0).toLocaleString()} ج.م
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes input */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">تفاصيل العطل ومبررات التصدير للخارج (الـ Outsouting):</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: يرجى عمل شحن لبيوس اللاب توب وإصلاح الشورت في مسار الجهد العالي حول مكثفات الشحن الرئيسية."
                  rows={2}
                  className="w-full text-xs font-extrabold p-2.5 border border-slate-200 rounded-xl bg-white text-right"
                ></textarea>
              </div>

              {/* Action buttons drawer */}
              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => { setIsDrawerOpen(false); playSound('beep_warning'); }}
                  className="p-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs rounded-xl cursor-pointer"
                >
                  إلغاء التراجع
                </button>
                <button
                  type="submit"
                  className="p-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4 text-white" />
                  حفظ وتسجيل الصيانة الخارجية
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISPOSITION RESOLUTION FOR SENT DEVICE */}
      {updatingTicket && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 outsourcing-main-font" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 text-right space-y-5 animate-in fade-in-50 duration-200">
            
            {/* Header Update */}
            <div className="flex items-start justify-between border-b pb-3">
              <div className="space-y-0.5">
                <h3 className="text-normal font-black text-indigo-900 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-650 animate-spin" />
                  استلام وتثبيت حالة الجهاز العائد من الأوتسورسنج
                </h3>
                <p className="text-[10.5px] text-slate-400 font-bold">تسجيل نتائج العطل الخارجي وضبط وتثبيت القيم المحاسبية والقيود</p>
              </div>
              <button
                onClick={() => setUpdatingTicket(null)}
                className="p-1 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResolveStatusUpdate} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 block">النتيجة الفنية النهائية للمركز:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'returned_repaired', label: '✓ تم الإصلاح وعاد' },
                    { key: 'returned_unrepaired', label: '✖ تعذر الإصلاح وعاد' },
                    { key: 'delivered', label: '✓ تم التسليم من هناك' }
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => { setNewStatus(st.key as any); playSound('beep_ok'); }}
                      className={`p-2 px-3 text-[10.5px] font-black rounded-lg border cursor-pointer transition-all ${newStatus === st.key ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'}`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Adjust prices if there was variations on external billing */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">التكلفة النهائية الفعلية للمركز (ج.م):</label>
                    <input
                      type="number"
                      value={actualCostOverride}
                      onChange={(e) => setActualCostOverride(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-xl bg-white font-mono text-left"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-700 block">التكلفة النهائية الفعلية للزبون (ج.م):</label>
                    <input
                      type="number"
                      value={actualChargeOverride}
                      onChange={(e) => setActualChargeOverride(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-xl bg-white font-mono text-left"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-black text-indigo-900 border-t pt-2">
                  <span>صافي أرباح كارت الصيانة بعد التعديل:</span>
                  <span className="font-mono bg-emerald-50 text-emerald-800 p-0.5 px-2.5 rounded-lg border border-emerald-150">
                    {(parseFloat(actualChargeOverride) - parseFloat(actualCostOverride) || 0).toLocaleString()} ج.م
                  </span>
                </div>
              </div>

              {/* Dispatch transition Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">ملاحظات وتقرير المختبر الفني الخارجي المرفق باللائحة:</label>
                <textarea
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  placeholder="مثال: تم إعادة لحام شريحة معالج الرسوميات وتنازلوا الفنيين عن قيمة فحص البوردة لتكرار التعامل."
                  rows={3}
                  className="w-full text-xs font-extrabold p-2.5 border border-slate-200 rounded-xl bg-white text-right focus:outline-none focus:ring-1 focus:ring-indigo-600"
                ></textarea>
              </div>

              <div className="flex items-center gap-1.5 justify-end pt-2 border-t text-xs">
                <button
                  type="button"
                  onClick={() => setUpdatingTicket(null)}
                  className="p-2.5 px-4 bg-slate-100 text-slate-600 font-bold rounded-xl cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="p-2.5 px-5 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-xl cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <Check className="w-4 h-4 text-white" />
                  تأكيد وحسم الحركة للقيود 💰
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComputerMobileOutsourcing;
