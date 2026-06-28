import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MaintenanceOrder, MaintenanceStatus } from '../../types';
import { 
  Search, ShieldCheck, DollarSign, Printer, CheckCircle, RefreshCw, 
  MapPin, Clock, Smartphone, Laptop, AlertCircle, FileText, ChevronRight, 
  Trash2, Plus, ArrowLeftRight, CreditCard, Award, ArrowLeft, Info
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { AccountingEngine } from '../../services/AccountingEngine';

const ComputerMobileDelivery: React.FC = () => {
  // Live queries from local database
  const orders = useLiveQuery(() => db.maintenanceOrders.toArray()) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];
  const shift = useLiveQuery(() => db.shifts.where('status').equals('open').first());

  // Search filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Delivery Details Form States
  const [discount, setDiscount] = useState<number>(0);
  const [warrantyDays, setWarrantyDays] = useState<number>(30);
  const [warrantyNotes, setWarrantyNotes] = useState<string>('ضمان فني لمدة 30 يوماً شامل قطع الغيار المستبدلة ضد عيوب الصناعة (لا يشمل سوء الاستخدام أو الكسر أو التعرض للسوائل).');
  const [paymentAccount, setPaymentAccount] = useState<string>('1010'); // Default cash Code
  const [isProcessing, setIsProcessing] = useState(false);

  // Printer Template/Modal States
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState<MaintenanceOrder | null>(null);

  // Sync state with selected order
  const activeOrder = orders.find(o => o.id === selectedOrderId) || null;

  // Sync default warranty text when warrantyDays changes
  useEffect(() => {
    if (activeOrder) {
      if (warrantyDays === 0) {
        setWarrantyNotes('عذرًا، الصيانة المنجزة تمت بدون تقديم فترة ضمان فني.');
      } else if (warrantyDays === 30) {
        setWarrantyNotes('ضمان فني ذهبي لمدة 30 يوماً من تاريخ التسليم على القطع المستبدلة والمصنعية.');
      } else if (warrantyDays === 60) {
        setWarrantyNotes('ضمان فني موسَّع لمدة 60 يوماً من تاريخ التسليم على القطع المستبدلة وأجور الصيانة.');
      } else if (warrantyDays === 90) {
        setWarrantyNotes('ضمان ملكي شامل لمدة 90 يوماً (3 أشهر) يشمل الفحص المجاني وقطع الغيار.');
      } else {
        setWarrantyNotes(`ضمان شامل ممتد لمدة ${warrantyDays} يوماً على خدمات الصيانة الرقمية ولحام الشيب.`);
      }
    }
  }, [warrantyDays, selectedOrderId]);

  // Handle Search Filtering
  const filteredOrders = orders.filter(order => {
    if (!searchQuery.trim()) return order.status === 'ready'; // Default view: ready for delivery

    const term = searchQuery.toLowerCase();
    // Search by invoice ID, customer phone, customer name, device model or serial
    return (
      order.id?.toString() === term ||
      order.customerPhone.includes(term) ||
      order.customerName.toLowerCase().includes(term) ||
      order.deviceModel.toLowerCase().includes(term) ||
      (order.deviceSerial && order.deviceSerial.toLowerCase().includes(term))
    );
  });

  // Financial Calculations for current selected order
  const totalCost = activeOrder ? (activeOrder.actualCost || activeOrder.expectedCost || 0) : 0;
  const depositPaid = activeOrder ? (activeOrder.deposit || 0) : 0;
  const netDue = Math.max(0, totalCost - depositPaid - discount);

  // Handle delivery confirmation
  const handleConfirmDelivery = async () => {
    if (!activeOrder) return;

    if (totalCost <= 0) {
      toast.error('لا يمكن تسليم جهاز بتكلفة صفرية، الرجاء مراجعة الفني لتحديث التكلفة الفعلية أولاً');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Prepare delivery properties
      const updatedOrder: MaintenanceOrder = {
        ...activeOrder,
        status: 'delivered',
        actualCost: totalCost, // Finalize actual cost
        deliveredDate: new Date(),
        notes: `${activeOrder.notes || ''}\n[تم التسليم للعميل بضمان ${warrantyDays} يوماً وبخصم ${discount} ج.م]`.trim()
      };

      // Add custom unstructured items securely using IndexedDB flexibility
      (updatedOrder as any).warrantyDays = warrantyDays;
      (updatedOrder as any).warrantyNotes = warrantyNotes;
      (updatedOrder as any).finalDiscount = discount;
      (updatedOrder as any).settlementAccountCode = paymentAccount;

      // 2. Perform financial Accounting Integration (Global Financial Impact)
      if (netDue > 0) {
        // Find corresponding Cash/Bank account
        const selectedAcc = accounts.find(a => a.code === paymentAccount) || 
                            await db.accounts.where('code').equals(paymentAccount).first();
        const revenueAcc = accounts.find(a => a.code === '4010') || 
                           await db.accounts.where('code').equals('4010').first();

        if (selectedAcc && revenueAcc) {
          // Double Entry Ledger: Debit Cash/Bank 'selectedAcc', Credit Maintenance Revenue '4010'
          await AccountingEngine.postEntry({
            date: new Date(),
            reference: `PCMOB-DELIV-${activeOrder.id}`,
            description: `تسوية نهائية وتسليم جهاز #${activeOrder.id} لعميل ${activeOrder.customerName} بضمان ${warrantyDays} يوماً`,
            lines: [
              { 
                accountId: selectedAcc.id!, 
                accountName: selectedAcc.name, 
                debit: netDue, 
                credit: 0, 
                description: `المتبقي المستلم عند تسليم الإلكترونيات (${activeOrder.deviceModel})` 
              },
              { 
                accountId: revenueAcc.id!, 
                accountName: revenueAcc.name, 
                debit: 0, 
                credit: netDue, 
                description: `إيرادات الصيانة الخدمية المحققة` 
              }
            ]
          });
        }

        // 3. Update the cash status of the active shift if open
        const activeShift = await db.shifts.where('status').equals('open').first();
        if (activeShift?.id) {
          await db.shifts.update(activeShift.id, {
            expectedCash: (activeShift.expectedCash || 0) + netDue,
            cashSales: (activeShift.cashSales || 0) + netDue,
          });
        }
      }

      // Update customer total loyalty spend
      const customerExist = await db.customers.where('phone').equals(activeOrder.customerPhone).first();
      if (customerExist?.id) {
        const spentSoFar = customerExist.totalSpent || 0;
        await db.customers.update(customerExist.id, {
          totalSpent: spentSoFar + totalCost
        });
      }

      // 4. Save to Database
      await db.maintenanceOrders.put(updatedOrder);

      toast.success(`🎉 تم تسليم الجهاز وتصفية الحساب ماليًا ودفتريًا بقيمة ${netDue.toLocaleString()} ج.م بنجاح!`);
      
      // Set to print dialog
      setInvoiceToPrint(updatedOrder);
      setShowInvoiceModal(true);
      
      // Reset state
      setSelectedOrderId(null);
      setDiscount(0);
    } catch (err) {
      console.error(err);
      toast.error('حدث عطل مالي أو تقني أثناء تنفيذ تسليم الجهاز');
    } finally {
      setIsProcessing(false);
    }
  };

  // Printing Function using HTML/CSS printable structure
  const handlePrintReceipt = (order: MaintenanceOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('الرجاء السماح بفتح النوافذ المنبثقة لطباعة فاتورة العميل');
      return;
    }

    const brandStr = order.deviceBrand || '';
    const partList = order.parts || [];
    const wDays = (order as any).warrantyDays || 0;
    const wNotes = (order as any).warrantyNotes || 'لا يوجد ضمان فني مبرم.';
    const finalDisc = (order as any).finalDiscount || 0;
    const computedDue = Math.max(0, (order.actualCost || 0) - (order.deposit || 0) - finalDisc);

    const docStr = `
      <html dir="rtl">
        <head>
          <title>سند تسليم وضمان جهاز صيانة #${order.id}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 25px;
              color: #333;
              background: #fff;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #222;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 22px;
              color: #111;
            }
            .header p {
              margin: 5px 0 0;
              font-size: 12px;
              color: #666;
            }
            .meta-section {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
              background: #f9f9f9;
              padding: 15px;
              border-radius: 8px;
              font-size: 13px;
            }
            .meta-block p {
              margin: 4px 0;
            }
            .device-card {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 20px;
            }
            .device-card h4 {
              margin: 0 0 10px;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
              color: #2563eb;
            }
            .parts-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 13px;
            }
            .parts-table th, .parts-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: right;
            }
            .parts-table th {
              background: #f4f4f4;
            }
            .warranty-alert {
              background: #eff6ff;
              border: 1px solid #bfdbfe;
              color: #1e3a8a;
              padding: 12px;
              border-radius: 6px;
              margin-bottom: 20px;
              font-size: 12.5px;
            }
            .financial-brief {
              background: #fffbeb;
              border: 1px solid #fde68a;
              padding: 15px;
              border-radius: 8px;
              font-size: 13px;
              margin-bottom: 25px;
            }
            .financial-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
            }
            .financial-row.total {
              font-weight: bold;
              border-top: 1px dashed #ccc;
              padding-top: 8px;
              font-size: 15px;
              color: #b45309;
            }
            .footer-notes {
              text-align: center;
              font-size: 11px;
              color: #888;
              margin-top: 40px;
              border-top: 1px solid #eee;
              padding-top: 15px;
            }
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              font-size: 13px;
            }
            .signature-box {
              text-align: center;
              width: 45%;
              border-top: 1px solid #666;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ورشة الإلكترونيات والخدمات الرقمية المتطورة</h1>
            <p>كارت صيانة ذكي • تسليم نهائي ووثيقة ضمان العميل</p>
          </div>

          <div class="meta-section">
            <div class="meta-block">
              <p><strong>رقم الفاتورة:</strong> PCMOB-DELIV-${order.id}</p>
              <p><strong>تاريخ الاستلام:</strong> ${new Date(order.date).toLocaleDateString('ar-EG')}</p>
              <p><strong>تاريخ التسليم:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            <div class="meta-block" style="text-align: left;">
              <p><strong>العميل:</strong> ${order.customerName}</p>
              <p><strong>الجوال:</strong> ${order.customerPhone}</p>
              <p><strong>الفني المسؤول:</strong> ${order.technicianName || 'المهندس المناوب'}</p>
            </div>
          </div>

          <div class="device-card">
            <h4>📱 تفاصيل ومواصفات الجهاز</h4>
            <p style="font-size: 13px; margin: 4px 0;"><strong>الجهاز:</strong> ${brandStr} ${order.deviceModel} (${order.deviceType === 'laptop' ? 'كمبيوتر محمول' : 'هاتف ذكي'})</p>
            <p style="font-size: 13px; margin: 4px 0;"><strong>الرقم التسلسلي:</strong> ${order.deviceSerial || 'بدون سيريال مكتوب'}</p>
            <p style="font-size: 13px; margin: 4px 0;"><strong>شكوى العميل:</strong> ${order.issueDescription}</p>
          </div>

          ${partList.length > 0 ? `
            <div style="margin-bottom: 20px;">
              <h4 style="margin: 0 0 5px; font-size: 14px; color: #374151;">🔧 قطع الغيار المدمجة بالصيانة:</h4>
              <table class="parts-table">
                <thead>
                  <tr>
                    <th>اسم قطعة الغيار</th>
                    <th>الكمية</th>
                    <th>السعر المفوتر</th>
                  </tr>
                </thead>
                <tbody>
                  ${partList.map(p => `
                    <tr>
                      <td>${p.name}</td>
                      <td>${p.quantity}</td>
                      <td>${p.price.toLocaleString()} ج.م</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : '<p style="font-size:12px; color:#666; margin-bottom: 15px;">* لم تستخدم قطع غيار خارجية من المستودع.</p>'}

          <div class="warranty-alert">
            <strong>🛡️ فترة الضمان والالتزام الفني:</strong> 
            <p style="margin: 5px 0 0 0;">الجهاز بضمان فني مدته <strong>${wDays} يوماً</strong> من تاريخ الاستلام.</p>
            <p style="margin: 3px 0 0 0; font-size: 11px; color:#475569;">${wNotes}</p>
          </div>

          <div class="financial-brief">
            <h4 style="margin: 0 0 10px; font-size: 14px; color: #b45309;">💵 تفصيل وتصفية الحساب المالي لبطاقة الصيانة</h4>
            <div class="financial-row">
              <span>إجمالي قيمة الخدمة والقطع:</span>
              <span>${(order.actualCost || order.expectedCost || 0).toLocaleString()} ج.م</span>
            </div>
            <div class="financial-row">
              <span>خصومات ترويجية ممنوحة عند التسليم:</span>
              <span>- ${finalDisc.toLocaleString()} ج.م</span>
            </div>
            <div class="financial-row">
              <span>مقدم صيانة (عربون مدفوع):</span>
              <span>- ${order.deposit.toLocaleString()} ج.م</span>
            </div>
            <div class="financial-row total">
              <span>المبلغ المستلم المستحق للدفع:</span>
              <span>${computedDue.toLocaleString()} ج.م</span>
            </div>
          </div>

          <div class="signatures">
            <div class="signature-box">
              <p>توقيع مسؤول التسليم والورشة</p>
              <br/><br/>
              <span>________________________</span>
            </div>
            <div class="signature-box">
              <p>توقيع العميل المستلم للجهاز</p>
              <br/><br/>
              <span>________________________</span>
            </div>
          </div>

          <div class="footer-notes">
            <p>شكراً لثقتكم بنا! يُرجى الاحتفاظ ببطاقة التسليم والضمان لمراجعة الصيانة داخل مهلة الضمان المبرمة فنيًا.</p>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(docStr);
    printWindow.document.close();
  };

  return (
    <div className="p-6 select-none max-w-[1600px] mx-auto space-y-8 tech-circuit-bg min-h-screen text-slate-800 relative" dir="rtl" id="computer-mobile-maintenance-root">
      <style>{`
        #computer-mobile-maintenance-root .glass-card {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(226, 232, 240, 0.82);
          box-shadow: 0 10px 30px -10px rgba(115, 125, 140, 0.12);
        }
      `}</style>
      <Toaster position="top-left" reverseOrder={true} />

      {/* Header Banner */}
      <div className="bg-white p-8 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10 border border-slate-100 shadow-xs transition-all duration-300">
        <div className="space-y-3 text-right w-full font-sans">
          <div className="flex flex-wrap items-center gap-2.5 mb-1 bg-slate-50/50 p-1 rounded-full w-max border border-slate-100/50">
            <span className="px-3.5 py-1 text-[10px] font-black tracking-tight text-emerald-850 bg-emerald-50 border border-emerald-100/80 rounded-full inline-flex items-center gap-1.5 shadow-3xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
              </span>
              قسم تسليم الإلكترونيات وتصفية الضمانات
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">شاشة تسليم الأجهزة الجاهزة (Device Delivery)</h1>
              <p className="text-xs text-slate-500 font-medium">خطوات البحث بالباركود وأرقام الجوالات الفاتورة لمشاهدة التسوية المالية وتأصيل الضمان فنيًا ومحاسبيًا</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Search on Right, Delivery setup on Left */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* RIGHT PANEL: Search & Select Orders */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-2xs space-y-3">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-600" />
              البحث الدقيق واستعراض الأجهزة المستلمة
            </h3>
            <p className="text-[11px] text-slate-500">
              أدخل رقم الكرت (الفاتورة)، أو الباركود، أو رقم هاتف العميل للبحث السريع.
            </p>
            
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="رقم الفاتورة، الباركود، رقم جوال العميل..."
                className="w-full text-xs font-medium p-3.5 bg-slate-50 border border-slate-250 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-right text-slate-800 leading-relaxed pr-10"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-4" />
            </div>

            {/* Quick Status Info Banner */}
            {!searchQuery && (
              <div className="bg-emerald-50/75 p-3 rounded-xl border border-emerald-100 text-right flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-[10px] text-emerald-950 font-bold leading-relaxed">
                  الحالة التلقائية في غياب البحث: نعرض لك الأجهزة التي تحمل حالة <span className="bg-emerald-250 px-1.5 py-0.5 rounded text-emerald-950 text-[9px]">تم الإصلاح</span> وتنتظر استلام أصحابها.
                </span>
              </div>
            )}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="p-10 text-center bg-white border border-dashed rounded-2xl text-slate-400">
                <AlertCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <span className="text-xs font-extrabold block text-slate-700">لا توجد نتائج مطابقة</span>
                <p className="text-[10px] text-slate-400 mt-1">امسح الباركود بشكل دقيق أو اختبر البحث بمفتاح آخر كالهاتف.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrderId === order.id;
                const tot = order.actualCost || order.expectedCost || 0;
                const dueToGo = Math.max(0, tot - (order.deposit || 0));
                
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id || null)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-right flex flex-col justify-between gap-3 ${
                      isSelected 
                        ? 'bg-emerald-50/40 border-emerald-500/80 shadow-xs' 
                        : 'bg-white border-slate-205 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-black text-slate-900 block font-sans">
                          {order.customerName}
                        </span>
                        <span className="text-[10px] text-slate-500 block font-mono" dir="ltr">
                          📞 {order.customerPhone}
                        </span>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-[10.5px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-bold">
                          الكرت #{order.id}
                        </span>
                        <span className={`block text-[9.5px] mt-1 font-bold ${
                          order.status === 'ready' 
                            ? 'text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-md' 
                            : 'text-slate-600 bg-slate-50 px-1.5 py-0.2 rounded-md'
                        }`}>
                          {order.status === 'ready' ? '✅ جاهز للتسليم' : '📦 تم مسبقاً'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 text-slate-600 text-[11px] font-medium leading-relaxed">
                      <div>
                        <strong>الموديل:</strong> {order.deviceBrand || ''} {order.deviceModel}
                      </div>
                      <div>
                        <strong>قطع الغيار المدمجة:</strong> {order.parts?.length || 0} قطع
                      </div>
                      <div>
                        <strong>التكلفة الإجمالية:</strong> <span className="font-mono text-slate-800 font-extrabold">{tot} ج.م</span>
                      </div>
                      <div>
                        <strong>المتبقي للدفع:</strong> <span className="font-mono text-amber-700 font-extrabold">{dueToGo} ج.م</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* LEFT PANEL: Selected order delivery dashboard */}
        <div className="lg:col-span-7">
          {activeOrder ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6">
              
              {/* Device and customer overview heading */}
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-150">
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-black">جهاز قيد التسليم النهائي</span>
                  <h3 className="text-sm font-black text-slate-900 mt-1">
                    {activeOrder.deviceBrand || ''} {activeOrder.deviceModel}
                  </h3>
                  <p className="text-[11px] text-indigo-750 mt-0.5 font-bold">
                    العميل الكريم: {activeOrder.customerName}
                  </p>
                </div>
                <div className="text-left font-mono">
                  <span className="text-xs bg-indigo-600 text-white font-black px-2.5 py-1 rounded-lg">
                    رقم الكرت: #{activeOrder.id}
                  </span>
                </div>
              </div>

              {/* Technical summary & Fault report */}
              <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 text-right space-y-1.5">
                <span className="block text-xs font-black text-indigo-950">📋 التقرير الفني المنجز بورشة الصيانة:</span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {(activeOrder as any).techReport || 'لم يتم تدوين خطوات معالجة كود الإصلاح مسبقاً، جارٍ استخدام الفلترة الكلاسيكية للدوائر.'}
                </p>
              </div>

              {/* 1. Warranty Settings (فترة الضمان) */}
              <div className="bg-white p-4.5 rounded-xl border border-slate-205 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black text-slate-900">إثبات فترة وبنود ضمان الصيانة (Warranty Period)</span>
                </div>

                <div className="space-y-4 text-right">
                  <div className="block text-[11px] text-slate-500 font-bold mb-1">حدد فترة الضمان المناسبة على المكون المستبدل:</div>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { days: 0, label: 'بدون ضمان' },
                      { days: 30, label: '٣٠ يوماً' },
                      { days: 60, label: '٦٠ يوماً' },
                      { days: 90, label: '٩٠ يوماً' }
                    ].map((w) => (
                      <button
                        key={w.days}
                        type="button"
                        onClick={() => setWarrantyDays(w.days)}
                        className={`py-2 px-3 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                          warrantyDays === w.days
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="block text-[11px] font-black text-slate-700">بنود تغطية الضمان الموثق بالفاتورة للأرشفة:</label>
                    <textarea
                      value={warrantyNotes}
                      onChange={(e) => setWarrantyNotes(e.target.value)}
                      rows={2}
                      placeholder="صف بنود الضمان فنيًا ومحاسبيًا للعميل..."
                      className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800 leading-relaxed text-right"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Delivery Financial Summary (الملخص المالي) */}
              <div className="bg-amber-50/30 p-5 rounded-xl border border-amber-200 space-y-4 text-right">
                <div className="flex items-center gap-2 text-slate-800 border-b border-slate-200/50 pb-2">
                  <DollarSign className="w-4 h-4 text-amber-700" />
                  <span className="text-xs font-black text-amber-950">الملخص المالي لعملية الاستلام والتصفية المحاسبية</span>
                </div>

                <div className="space-y-3 font-sans text-xs">
                  <div className="flex justify-between items-center text-slate-650">
                    <span>التكلفة الكلية المعتمدة (صيانة + قطع غيار):</span>
                    <span className="font-mono text-slate-800 font-black">{totalCost.toLocaleString()} ج.م</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-650">
                    <span>المقدم المدفوع مسبقاً (العربون):</span>
                    <span className="font-mono text-emerald-700 font-black">- {depositPaid.toLocaleString()} ج.m</span>
                  </div>

                  <div className="flex justify-between items-center gap-4 text-slate-650">
                    <span className="shrink-0">إضافة خصم نقدي ترويجي عند التسليم:</span>
                    <div className="flex items-center gap-1.5 max-w-[140px]">
                      <input
                        type="number"
                        value={discount === 0 ? '' : discount}
                        onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="خصم مالي..."
                        className="w-full text-xs font-mono font-bold p-1 border border-slate-300 rounded focus:outline-none text-left bg-white"
                      />
                      <span className="text-[10px] text-slate-500 shrink-0">ج.م</span>
                    </div>
                  </div>

                  {/* Treasury Box Destination */}
                  <div className="flex justify-between items-center gap-4 text-slate-650 pt-1">
                    <span>حساب الإيداع / الخزينة المستلمة:</span>
                    <select
                      value={paymentAccount}
                      onChange={(e) => setPaymentAccount(e.target.value)}
                      className="text-xs font-black bg-white border border-slate-300 rounded p-1 text-right focus:outline-none"
                    >
                      <option value="1010">💵 الخزينة والعهدة اليومية العامة (1010)</option>
                      <option value="1020">🏦 الحساب البنكي / نقاط شبكة مالي (1020)</option>
                      <option value="1030">💳 المحفظة الذكية / كاش بنك (1030)</option>
                    </select>
                  </div>

                  {/* Highlight: Net due to pay */}
                  <div className="flex justify-between items-center bg-white p-3.5 rounded-lg border border-amber-250 mt-3">
                    <span className="text-xs font-black text-amber-950">المبلغ الصافي المتبقي المستحق للدفع نقداً:</span>
                    <span className="text-[17px] font-black font-mono text-amber-800">
                      {netDue.toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmDelivery}
                  disabled={isProcessing}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-xs px-6 py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-97 shadow-xs font-sans"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                  {isProcessing ? 'جاري تنفيذ تسليم الجهاز ماليًا...' : 'تأكيد تسليم الجهاز وتصفية الحساب 🤝'}
                </button>
                
                {/* Reprint button */}
                <button
                  type="button"
                  onClick={() => handlePrintReceipt(activeOrder)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-5 py-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4 text-white" />
                  طباعة الفاتورة والضمان 🧾
                </button>
              </div>

            </div>
          ) : (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200/50 shadow-3xs flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-600">
                <Smartphone className="w-10 h-10" />
              </div>
              <div className="max-w-md space-y-1">
                <h4 className="text-sm font-black text-slate-800">شاشة تسوية الصيانة والاستلام</h4>
                <p className="text-xs text-slate-400">
                  يرجى تصفح فائمة الأجهزة أو البحث برقم الكرت/الفاتورة، ثم تحديد مواصفات الضمان لترحيل الحركة المحاسبية وتوثيق التسليم للعميل.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Invoice Success & Quick Print Modal Dialogue */}
      {showInvoiceModal && invoiceToPrint && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center space-y-5 animate-scale-up">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl">
              👍
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 font-sans">تمت تصفية المعاملة بنجاح !</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                تم تغيير الحالة إلى <span className="text-emerald-700 font-bold">تم التسليم وتصفية الحساب</span> وإدراج بند مالي بقيمة <span className="font-black text-indigo-950 font-mono">{( (invoiceToPrint.actualCost || 0) - (invoiceToPrint.deposit || 0) - ( (invoiceToPrint as any).finalDiscount || 0 ) ).toLocaleString()} ج.م</span> في الخزينة.
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-right text-[11px] leading-relaxed text-slate-600">
              📌 <strong>تفاصيل الضمان لعميلنا:</strong> ضمان فني لمدة <strong>{(invoiceToPrint as any).warrantyDays || 0} يوماً</strong> شامل مع شهادة التسليم.
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePrintReceipt(invoiceToPrint)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 rounded-xl cursor-pointer shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                طباعة الآن
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoiceToPrint(null);
                }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-750 font-black text-xs py-3 rounded-xl cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComputerMobileDelivery;
