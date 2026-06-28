import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { MaintenanceOrder, MaintenanceStatus, MaintenancePart, User } from '../../types';
import { 
  Monitor, Smartphone, Laptop, Tablet, Wrench, Search, AlertCircle, CheckCircle2, 
  Clock, X, Edit, Trash2, Printer, Plus, Cpu, HardDrive, Database, ShieldAlert, 
  Lock, DollarSign, UserCog, ClipboardList, Info, FileText, HelpCircle, Eye, RefreshCw,
  TrendingUp, BarChart3, Coins, Users, Award, Percent, Layers, Inbox, Scale, CheckCircle, Play, Droplets
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { AccountingEngine } from '../../services/AccountingEngine';
import ConfirmModal from '../../components/ui/ConfirmModal';

// Status styling mapping for PC/Mobile
const statusMap: Record<MaintenanceStatus, { label: string; color: string; bg: string; icon: any }> = {
  received: { label: 'تم الاستلام والدخول للورشة', color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200', icon: Clock },
  diagnosing: { label: 'جاري الفحص الفني والتشخيص', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: Search },
  waiting_parts: { label: 'في انتظار وفرة قطع الغيار', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: AlertCircle },
  repairing: { label: 'على طاولة صيانة المهندسين', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', icon: Wrench },
  ready: { label: 'جاهز للاختبار والتسليم', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  delivered: { label: 'تم التسليم وتصفية الحساب', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200', icon: CheckCircle2 },
  cancelled: { label: 'ملغي مرتجع بدون صيانة', color: 'text-rose-600', bg: 'bg-rose-50 border-rose-200', icon: X },
  waiting_approval: { label: 'بانتظار موافقة العميل والتسعير', color: 'text-rose-500', bg: 'bg-rose-50 border-rose-150', icon: HelpCircle },
  abandoned: { label: 'مهجور/تالف لم يستلم', color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200', icon: Trash2 },
};

const ComputerMobileOrders: React.FC = () => {
  // Live queries from local database
  const orders = useLiveQuery(() => db.maintenanceOrders.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];
  const products = useLiveQuery(() => db.products.toArray()) || [];
  const accounts = useLiveQuery(() => db.accounts.toArray()) || [];

  // Internal filters for Orders Tab
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'computer' | 'mobile'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal controllers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<MaintenanceOrder | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);

  // Form states (controlled inputs for the modal)
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formCustomerPhone, setFormCustomerPhone] = useState('');
  const [formCustomerAltPhone, setFormCustomerAltPhone] = useState('');
  const [formDeviceType, setFormDeviceType] = useState<'computer' | 'mobile' | 'laptop'>('mobile');
  const [formDeviceBrand, setFormDeviceBrand] = useState('Apple');
  const [formDeviceModel, setFormDeviceModel] = useState('');
  const [formDeviceSerial, setFormDeviceSerial] = useState('');
  const [formDevicePassword, setFormDevicePassword] = useState('');
  const [formIssueDescription, setFormIssueDescription] = useState('');
  const [formReceptionistInspection, setFormReceptionistInspection] = useState('');
  const [formDeviceCondition, setFormDeviceCondition] = useState('');
  const [formDeviceAttachments, setFormDeviceAttachments] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formTechnicianName, setFormTechnicianName] = useState('');
  const [formExpectedCost, setFormExpectedCost] = useState<number>(0);
  const [formActualCost, setFormActualCost] = useState<number>(0);
  const [formDeposit, setFormDeposit] = useState<number>(0);
  const [formStatus, setFormStatus] = useState<MaintenanceStatus>('received');

  // Specs
  const [pcCpu, setPcCpu] = useState('Intel i5');
  const [pcRam, setPcRam] = useState('16GB');
  const [pcStorage, setPcStorage] = useState('512GB SSD');
  const [pcOs, setFormPcOs] = useState('Windows 11');
  const [pcGpu, setPcGpu] = useState('Intel Iris Xe');

  const [mobileBatteryHealth, setMobileBatteryHealth] = useState<number>(85);
  const [mobileAccountStatus, setMobileAccountStatus] = useState('Logged Out');
  const [mobileScreenCondition, setMobileScreenCondition] = useState('Excellent');

  // Dead Devices Protocol & Pre-Check Checklist
  const [formIsDeadOnArrival, setFormIsDeadOnArrival] = useState<boolean>(false);
  const [formCheckPower, setFormCheckPower] = useState<'ok' | 'fail' | 'not_tested'>('not_tested');
  const [formCheckCharging, setFormCheckCharging] = useState<'ok' | 'fail' | 'not_tested'>('not_tested');
  const [formCheckCamera, setFormCheckCamera] = useState<'ok' | 'fail' | 'not_tested'>('not_tested');
  const [formCheckAudio, setFormCheckAudio] = useState<'ok' | 'fail' | 'not_tested'>('not_tested');
  const [formCheckWifi, setFormCheckWifi] = useState<'ok' | 'fail' | 'not_tested'>('not_tested');
  const [formCheckFingerprint, setFormCheckFingerprint] = useState<'ok' | 'fail' | 'not_tested'>('not_tested');

  // Materials consumed inside order form
  const [orderParts, setOrderParts] = useState<MaintenancePart[]>([]);
  const [currentPartName, setCurrentPartName] = useState('');
  const [currentPartPrice, setCurrentPartPrice] = useState<number>(0);
  const [currentPartQty, setCurrentPartQty] = useState<number>(1);

  // Helper to filter orders for PC & Mobile
  const pcMobileOrders = orders.filter(order => {
    const normalizedType = (order.deviceType || '').toLowerCase();
    const isPC = normalizedType.includes('كمبيوتر') || normalizedType.includes('لابتوب') || normalizedType.includes('laptop') || normalizedType.includes('pc') || normalizedType.includes('computer') || normalizedType.includes('desktop') || (order as any).deviceCategory === 'computer';
    const isMobile = normalizedType.includes('موبايل') || normalizedType.includes('هاتف') || normalizedType.includes('جوال') || normalizedType.includes('mobile') || normalizedType.includes('phone') || normalizedType.includes('iphone') || (order as any).deviceCategory === 'mobile';
    
    if (deviceFilter === 'computer') return isPC;
    if (deviceFilter === 'mobile') return isMobile;
    return isPC || isMobile || (order as any).department === 'pc-mobile';
  });

  // Search filter
  const filteredOrders = pcMobileOrders.filter(order => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      order.customerName.toLowerCase().includes(term) ||
      order.customerPhone.includes(term) ||
      order.deviceModel.toLowerCase().includes(term) ||
      (order.deviceSerial && order.deviceSerial.toLowerCase().includes(term)) ||
      (order.issueDescription && order.issueDescription.toLowerCase().includes(term));

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const parsedParts = products.filter(p => {
    const isMntcCat = p.category === 'قطع غيار صيانة' || (p.name.includes('شاشة') || p.name.includes('رام') || p.name.includes('SSD') || p.name.includes('بطارية') || p.name.includes('فلاتة') || p.name.includes('معجون'));
    return isMntcCat;
  });

  const openFormModal = (order: MaintenanceOrder | null) => {
    if (order) {
      setEditingOrder(order);
      setFormCustomerName(order.customerName);
      setFormCustomerPhone(order.customerPhone);
      setFormCustomerAltPhone(order.customerAltPhone || '');
      
      const isLaptop = (order.deviceType || '').toLowerCase().includes('لابتوب') || (order as any).deviceCategory === 'laptop';
      const isComputer = (order.deviceType || '').toLowerCase().includes('كمبيوتر') || (order as any).deviceCategory === 'computer';
      
      setFormDeviceType(isLaptop ? 'laptop' : isComputer ? 'computer' : 'mobile');
      setFormDeviceBrand(order.deviceBrand || 'Apple');
      setFormDeviceModel(order.deviceModel);
      setFormDeviceSerial(order.deviceSerial || '');
      setFormDevicePassword(order.devicePassword || '');
      setFormIssueDescription(order.issueDescription);
      setFormReceptionistInspection(order.receptionistInspection || '');
      setFormDeviceCondition(order.deviceCondition || '');
      setFormDeviceAttachments(order.deviceAttachments || '');
      setFormNotes(order.notes || '');
      setFormTechnicianName(order.technicianName || '');
      setFormExpectedCost(order.expectedCost || 0);
      setFormActualCost(order.actualCost || order.expectedCost || 0);
      setFormDeposit(order.deposit || 0);
      setFormStatus(order.status);
      
      const customSpec = (order as any).customSpecs || {};
      if (isLaptop || isComputer) {
        setPcCpu(customSpec.pcCpu || 'Intel i5');
        setPcRam(customSpec.pcRam || '16GB');
        setPcStorage(customSpec.pcStorage || '512GB SSD');
        setFormPcOs(customSpec.pcOs || 'Windows 11');
        setPcGpu(customSpec.pcGpu || 'Intel Iris Xe');
      } else {
        setMobileBatteryHealth(customSpec.mobileBatteryHealth || 85);
        setMobileAccountStatus(customSpec.mobileAccountStatus || 'Logged Out');
        setMobileScreenCondition(customSpec.mobileScreenCondition || 'Excellent');
      }

      setFormIsDeadOnArrival(!!order.isDeadOnArrival);
      setFormCheckPower(order.preCheckChecklist?.power || 'not_tested');
      setFormCheckCharging(order.preCheckChecklist?.charging || 'not_tested');
      setFormCheckCamera(order.preCheckChecklist?.camera || 'not_tested');
      setFormCheckAudio(order.preCheckChecklist?.audio || 'not_tested');
      setFormCheckWifi(order.preCheckChecklist?.wifi || 'not_tested');
      setFormCheckFingerprint(order.preCheckChecklist?.fingerprint || 'not_tested');

      setOrderParts(order.parts || []);
    } else {
      setEditingOrder(null);
      setFormCustomerName('');
      setFormCustomerPhone('');
      setFormCustomerAltPhone('');
      setFormDeviceType('mobile');
      setFormDeviceBrand('Apple');
      setFormDeviceModel('');
      setFormDeviceSerial('');
      setFormDevicePassword('');
      setFormIssueDescription('');
      setFormReceptionistInspection('');
      setFormDeviceCondition('');
      setFormDeviceAttachments('');
      setFormNotes('');
      setFormTechnicianName('');
      setFormExpectedCost(150);
      setFormActualCost(150);
      setFormDeposit(0);
      setFormStatus('received');
      
      // Default specs reset
      setPcCpu('Intel i5');
      setPcRam('16GB');
      setPcStorage('512GB SSD');
      setFormPcOs('Windows 11');
      setPcGpu('Intel Iris Xe');
      
      setMobileBatteryHealth(90);
      setMobileAccountStatus('Logged Out');
      setMobileScreenCondition('Excellent');

      setFormIsDeadOnArrival(false);
      setFormCheckPower('not_tested');
      setFormCheckCharging('not_tested');
      setFormCheckCamera('not_tested');
      setFormCheckAudio('not_tested');
      setFormCheckWifi('not_tested');
      setFormCheckFingerprint('not_tested');

      setOrderParts([]);
    }
    
    setCurrentPartName('');
    setCurrentPartPrice(0);
    setCurrentPartQty(1);

    setIsModalOpen(true);
  };

  const handleAddPart = () => {
    if (!currentPartName.trim()) {
      toast.error('أدخل اسم أو صنف قطعة الغيار المستخدمة');
      return;
    }
    if (currentPartPrice <= 0) {
      toast.error('احسب سعر التكلفة للعميل');
      return;
    }

    const added: MaintenancePart = {
      name: currentPartName,
      quantity: currentPartQty,
      price: currentPartPrice
    };

    setOrderParts([...orderParts, added]);
    setCurrentPartName('');
    setCurrentPartPrice(0);
    setCurrentPartQty(1);
    toast.success('تمت إضافة قطعة الغيار لقائمة العميل');
  };

  const handleRemovePart = (idx: number) => {
    setOrderParts(orderParts.filter((_, i) => i !== idx));
    toast.success('تم إبعاد القطعة من أمر الصيانة');
  };

  const handleSelectProductPart = (partName: string) => {
    const found = products.find(p => p.name === partName);
    if (found) {
      setCurrentPartName(found.name);
      setCurrentPartPrice(found.price || 0);
    }
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCustomerName.trim() || !formCustomerPhone.trim() || !formDeviceModel.trim() || !formIssueDescription.trim()) {
      toast.error('فضلاً أكمل الحقول الأساسية: الجوال والعميل والـبراند والعيب');
      return;
    }

    const isPcOrLaptop = formDeviceType === 'computer' || formDeviceType === 'laptop';
    const specsObj = isPcOrLaptop ? {
      pcCpu, pcRam, pcStorage, pcOs, pcGpu
    } : {
      mobileBatteryHealth, mobileAccountStatus, mobileScreenCondition
    };

    const displayDeviceType = formDeviceType === 'computer' ? 'كمبيوتر مكتبي' : formDeviceType === 'laptop' ? 'لابتوب' : 'موبايل';

    const orderObj: Partial<MaintenanceOrder> = {
      customerName: formCustomerName,
      customerPhone: formCustomerPhone,
      customerAltPhone: formCustomerAltPhone,
      deviceType: displayDeviceType,
      deviceBrand: formDeviceBrand,
      deviceModel: formDeviceModel,
      deviceSerial: formDeviceSerial,
      devicePassword: formDevicePassword,
      issueDescription: formIssueDescription,
      receptionistInspection: formReceptionistInspection,
      deviceCondition: formDeviceCondition,
      deviceAttachments: formDeviceAttachments,
      expectedCost: formExpectedCost,
      actualCost: formActualCost || formExpectedCost,
      deposit: formDeposit,
      status: formStatus,
      technicianName: formTechnicianName,
      notes: formNotes,
      parts: orderParts,
      isDeadOnArrival: formIsDeadOnArrival,
      preCheckChecklist: {
        power: formCheckPower,
        charging: formCheckCharging,
        camera: formCheckCamera,
        audio: formCheckAudio,
        wifi: formCheckWifi,
        fingerprint: formCheckFingerprint
      }
    };

    (orderObj as any).deviceCategory = formDeviceType;
    (orderObj as any).customSpecs = specsObj;
    (orderObj as any).department = 'pc-mobile';

    try {
      let custId = editingOrder?.customerId;
      if (!custId) {
        const exist = customers.find(c => c.phone === formCustomerPhone);
        if (exist?.id) {
          custId = exist.id;
        } else {
          custId = await db.customers.add({
            name: formCustomerName,
            phone: formCustomerPhone,
            totalSpent: 0
          });
        }
      }
      orderObj.customerId = custId;

      const oldStatus = editingOrder?.status;
      const newStatus = orderObj.status;

      if (editingOrder?.id) {
        const readyToSave = { ...editingOrder, ...orderObj, id: editingOrder.id } as MaintenanceOrder;
        
        if (oldStatus !== newStatus && newStatus === 'delivered') {
          const delta = (readyToSave.actualCost || 0) - (readyToSave.deposit || 0);
          
          if (delta > 0) {
            const currentShift = await db.shifts.where('status').equals('open').first();
            if (currentShift?.id) {
              await db.shifts.update(currentShift.id, {
                expectedCash: (currentShift.expectedCash || 0) + delta,
                cashSales: (currentShift.cashSales || 0) + delta,
              });
            }

            const activeCust = await db.customers.get(custId);
            if (activeCust) {
              await db.customers.update(custId, {
                totalSpent: (activeCust.totalSpent || 0) + (readyToSave.actualCost || 0)
              });
            }

            try {
              const cashAcc = accounts.find(a => a.code === '1010') || await db.accounts.where('code').equals('1010').first();
              const revAcc = accounts.find(a => a.code === '4010') || await db.accounts.where('code').equals('4010').first();
              
              if (cashAcc && revAcc) {
                await AccountingEngine.postEntry({
                  date: new Date(),
                  reference: `PCMOB-MNTC-${readyToSave.id}`,
                  description: `إيراد مكتمل صيانة جهاز #${readyToSave.id} - عميل ${readyToSave.customerName}`,
                  lines: [
                    { accountId: cashAcc.id!, accountName: cashAcc.name, debit: delta, credit: 0, description: `استلام بقية تكلفة صيانة جهاز تفصيلي` },
                    { accountId: revAcc.id!, accountName: revAcc.name, debit: 0, credit: delta, description: `إثبات الإيراد الخدمي للصيانة` }
                  ]
                });
              }
            } catch (je) {
              console.warn("Ledger registration failed: ", je);
            }
          }
        }

        await db.maintenanceOrders.put(readyToSave);
        toast.success('تمت تحديثات كود الصيانة بالدفاتر الفنية');
      } else {
        orderObj.date = new Date();
        const autoKey = await db.maintenanceOrders.add(orderObj as MaintenanceOrder);
        
        if (formDeposit > 0) {
          const activeShift = await db.shifts.where('status').equals('open').first();
          if (activeShift?.id) {
            await db.shifts.update(activeShift.id, {
              expectedCash: (activeShift.expectedCash || 0) + formDeposit,
              cashSales: (activeShift.cashSales || 0) + formDeposit,
            });
          }

          try {
            const cashAcc = accounts.find(a => a.code === '1010') || await db.accounts.where('code').equals('1010').first();
            const liabilityAcc = accounts.find(a => a.code === '2020') || await db.accounts.where('code').equals('2020').first();
            if (cashAcc && liabilityAcc) {
              await AccountingEngine.postEntry({
                date: new Date(),
                reference: `PRE-MNTC-${autoKey}`,
                description: `عربون مستلم مقدم صيانة جهاز #${autoKey} لعميل ${formCustomerName}`,
                lines: [
                  { accountId: cashAcc.id!, accountName: cashAcc.name, debit: formDeposit, credit: 0, description: `كاش عربون الصيانة` },
                  { accountId: liabilityAcc.id!, accountName: liabilityAcc.name, debit: 0, credit: formDeposit, description: `دفعات ورعابين عملاء معلقة` }
                ]
              });
            }
          } catch(e){}
        }

        toast.success(`تم تسجيل الجهاز بقبول فني ناجح! كود الصيانة #${autoKey}`);
      }

      setIsModalOpen(false);
    } catch (err) {
      toast.error('أخفق التخزين بالصناديق الرقمية المحلية');
    }
  };

  const handleDeleteOrder = async () => {
    if (deleteOrderId) {
      await db.maintenanceOrders.delete(deleteOrderId);
      setDeleteOrderId(null);
      toast.success('تم حذف حركة الفحص بالكامل');
    }
  };

  const handlePrintReceipt = (order: MaintenanceOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const customSpec = (order as any).customSpecs || {};
    const specHtml = order.deviceType?.toLowerCase().includes('كمبيوتر') || (order as any).deviceCategory === 'computer' ? `
      <tr><th>اسم المعالج (Processor)</th><td>${customSpec.pcCpu || 'i5 / i7'}</td></tr>
      <tr><th>الرام (RAM Speed)</th><td>${customSpec.pcRam || '16GB'}</td></tr>
      <tr><th>السعة والتخزين</th><td>${customSpec.pcStorage || '512GB SSD'}</td></tr>
      <tr><th>البيئة البرمجية Operating System</th><td>${customSpec.pcOs || 'Windows'}</td></tr>
    ` : `
      <tr><th>القدرة النسبية للبطارية (Health)</th><td>${customSpec.mobileBatteryHealth || 100}%</td></tr>
      <tr><th>قفل السحاب المتوازن (iCloud/Google)</th><td>${customSpec.mobileAccountStatus || 'مسجل خروج'}</td></tr>
      <tr><th>فحص باغة الشاشة الخارجية</th><td>${customSpec.mobileScreenCondition || 'سليمة'}</td></tr>
    `;

    const checkStatusLabels: Record<string, string> = {
      ok: '✔ سليم (يعمل)',
      fail: '❌ عطلان (لا يعمل)',
      not_tested: '🔍 لم يتم الفحص'
    };

    let checklistHtml = '';
    if (order.isDeadOnArrival) {
      checklistHtml = `
        <div style="background: #fff5f5; border: 2px solid #e74c3c; padding: 15px; border-radius: 12px; margin-top: 20px; margin-bottom: 25px; text-align: center; font-family: sans-serif;">
          <h4 style="color: #c0392b; margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">💀 بروتوكول جهاز لا يعمل نهائياً (Dead on Arrival)</h4>
          <p style="font-size: 13.5px; color: #2c3e50; font-weight: bold; margin: 5px 0; line-height: 1.5;">
            تم تسجيل هذا الجهاز وتصنيفه كحالة: <span style="background: #e74c3c; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">ميت بالكامل / فاصل باور تماماً</span> عند الاستلام بالمركز.
          </p>
          <div style="background: #fff0f0; border-right: 4px solid #e74c3c; padding: 10px; margin-top: 10px; font-size: 12.5px; font-weight: bold; text-align: right; color: #c0392b;">
            🚨 إقرار وبند عريض يوقع عليه العميل المستلم:<br/>
            (تم استلام الجهاز وهو فاصل باور تماماً وميت، والمحل غير مسؤول نهائياً عن أي عطل داخلي بالبوردة أو الشاشة أو الرقاقات المعالجة قد يظهر أثناء أو بعد عملية الفحص الفني المتقدمة ومحاولة التشغيل).
          </div>
        </div>
      `;
    } else if (order.preCheckChecklist) {
      const cl = order.preCheckChecklist;
      checklistHtml = `
        <div style="background: #fdfefe; border: 1.5px solid #3498db; padding: 15px; border-radius: 12px; margin-top: 20px; margin-bottom: 25px; text-align: right; font-family: sans-serif;">
          <h4 style="color: #2980b9; margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">📋 إقرار فحص الحالة المبدئي المتفق عليه (Pre-Check Checklist):</h4>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #dcdde1;">
            <tbody>
              <tr style="border-bottom: 1px solid #dcdde1; background: #f8f9fa;">
                <td style="padding: 6px; font-weight: bold; border-left: 1px solid #dcdde1; width: 33%">الباور والتشغيل (Power):</td>
                <td style="padding: 6px; color: #2c3e50; font-weight: bold; width: 17%">${checkStatusLabels[cl.power || 'not_tested']}</td>
                <td style="padding: 6px; font-weight: bold; border-left: 1px solid #dcdde1; border-right: 1px solid #dcdde1; width: 33%">منفذ وسرعة الشحن (Charging):</td>
                <td style="padding: 6px; color: #2c3e50; font-weight: bold; width: 17%">${checkStatusLabels[cl.charging || 'not_tested']}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dcdde1;">
                <td style="padding: 6px; font-weight: bold; border-left: 1px solid #dcdde1;">الكاميرا الأمامية/الخلفية (Camera):</td>
                <td style="padding: 6px; color: #2c3e50; font-weight: bold;">${checkStatusLabels[cl.camera || 'not_tested']}</td>
                <td style="padding: 6px; font-weight: bold; border-left: 1px solid #dcdde1; border-right: 1px solid #dcdde1;">مكبرات الصوت والمايك (Audio):</td>
                <td style="padding: 6px; color: #2c3e50; font-weight: bold;">${checkStatusLabels[cl.audio || 'not_tested']}</td>
              </tr>
              <tr style="border-bottom: 1px solid #dcdde1; background: #f8f9fa;">
                <td style="padding: 6px; font-weight: bold; border-left: 1px solid #dcdde1;">الواي فاي والاتصال (Wi-Fi):</td>
                <td style="padding: 6px; color: #2c3e50; font-weight: bold;">${checkStatusLabels[cl.wifi || 'not_tested']}</td>
                <td style="padding: 6px; font-weight: bold; border-left: 1px solid #dcdde1; border-right: 1px solid #dcdde1;">البصمة والأمان والوجه (Biometrics):</td>
                <td style="padding: 6px; color: #2c3e50; font-weight: bold;">${checkStatusLabels[cl.fingerprint || 'not_tested']}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    const itemsHtml = order.parts?.length > 0 ? `
      <h3>المكونات والقطع التي شملها تتبع العطل:</h3>
      <table>
        <thead>
          <tr>
            <th>بيان قطعة الإلكترونيات والمحلول</th>
            <th>الكمية</th>
            <th>القيمة الحسابية</th>
            <th>المجموع الفرعي</th>
          </tr>
        </thead>
        <tbody>
          ${order.parts.map(p => `
            <tr>
              <td>${p.name}</td>
              <td>${p.quantity}</td>
              <td>${p.price.toLocaleString()} ج.م</td>
              <td>${(p.price * p.quantity).toLocaleString()} ج.م</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p style="text-align: center; color: #7f8c8d; font-size: 13px;">لم تتطلب ورشة الصيانة قطع بديلة خارجية</p>';

    const barcodeHtml = `
      <div style="font-family: monospace; font-size: 14px; letter-spacing: 4px; padding: 10px; display: inline-block; margin-top: 8px; border: 2px solid #2c3e50; background: white; border-radius: 8px;">
        <div style="display: flex; gap: 1px; justify-content: center; height: 35px; align-items: stretch; margin-bottom: 5px;">
          ${Array.from({length: 28}).map((_, i) => `<div style="width: ${i % 3 === 0 ? '3px' : i % 5 === 0 ? '1px' : '2px'}; background: black; height: 100%;"></div>`).join('')}
        </div>
        <strong>CODE-MNTC-${String(order.id).padStart(5, '0')}</strong>
      </div>
    `;

    const docStr = `
      <html dir="rtl" lang="ar">
        <head>
          <title>إيصال تتبع وصافي صيانة #${order.id}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 25px; color: #2c3e50; line-height: 1.6; }
            .badge-bar { text-align: center; border-bottom: 2px dashed #bdc3c7; padding-bottom: 15px; margin-bottom: 25px; }
            .badge-bar h1 { font-size: 24px; margin: 0; color: #2c3e50; }
            .badge-bar p { margin: 6px 0; font-size: 13px; color: #7f8c8d; }
            .ticket-box { background: #f8f9fa; border: 1px solid #e2e8f0; padding: 18px; border-radius: 12px; margin-bottom: 25px; }
            .t-row { display: flex; justify-content: space-between; font-size: 14px; padding: 6px 0; border-bottom: 1px dashed #ecf0f1; }
            .t-row .key { font-weight: bold; color: #34495e; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
            th, td { border: 1px solid #bdc3c7; padding: 10px; text-align: right; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .balance-card { background: #e8f5e9; border: 1.5px solid #a5d6a7; padding: 15px; border-radius: 10px; text-align: right; margin-top: 15px; }
            .rules-box { background: #fffcf4; border: 1px solid #f39c12; border-radius: 10px; padding: 15px; margin-top: 25px; }
            .rules-box h4 { margin: 0 0 8px 0; color: #d35400; font-size: 14px; font-weight: bold; }
            .rules-box ul { margin: 0; padding-right: 20px; font-size: 11px; color: #7f8c8d; }
            .rules-box li { margin-bottom: 4px; }
            .foot { text-align: center; margin-top: 40px; font-size: 11px; color: #7f8c8d; border-top: 1px dashed #bdc3c7; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="badge-bar">
            <h1>مركز كود تك لصيانة الكمبيوتر والموبايل 💻📱</h1>
            <p>حلول البرمجيات، الدوائر الدقيقة، وقطع الغيار المعتمدة</p>
            ${barcodeHtml}
            <p style="margin-top: 10px; font-weight: bold;">رقم أمر الفحص: #${order.id}</p>
            <p>التاريخ المحاسبي: ${new Date(order.date).toLocaleString('ar-EG')}</p>
          </div>

          <div class="ticket-box">
            <div class="t-row"><span class="key">المرسل / العميل المستلم:</span><span>${order.customerName} (${order.customerPhone})</span></div>
            ${order.customerAltPhone ? `<div class="t-row"><span class="key">الهاتف البديل / الطوارئ:</span><span>${order.customerAltPhone}</span></div>` : ''}
            <div class="t-row"><span class="key">نوع الإلكترونيات:</span><span>${order.deviceType} | ${order.deviceBrand} ${order.deviceModel}</span></div>
            <div class="t-row"><span class="key">سيريال الهيكل / IMEI:</span><span>${order.deviceSerial || 'غير مسجل'}</span></div>
            <div class="t-row"><span class="key">حالة الجهاز الخارجي:</span><span style="color: #d35400; font-weight: bold;">${order.deviceCondition || 'غير محدد'}</span></div>
            <div class="t-row"><span class="key">قفل ومستودع الشاشة (الرمز):</span><span style="font-family: monospace; font-weight: bold;">${order.devicePassword || 'بدون قفل'}</span></div>
            <div class="t-row"><span class="key">الأجزاء الملحقة والكماليات:</span><span>${order.deviceAttachments || 'الجهاز المحمول بدون ملحقات'}</span></div>
          </div>

          ${checklistHtml}

          <h3>تفاصيل الفحص الوقائية المسجلة لتتبع المشاكل:</h3>
          <table>
            <thead>
              <tr><th>معيار القياس ببدء الدورة</th><th>القراءة المسجلة على البنش الفني</th></tr>
            </thead>
            <tbody>
              ${specHtml}
              <tr><th>شكوى العميل الفنية</th><td><strong>${order.issueDescription}</strong></td></tr>
              ${order.receptionistInspection ? `<tr><th>الفحص المبدئي (موظف الاستقبال)</th><td><span style="color: #2980b9;">${order.receptionistInspection}</span></td></tr>` : ''}
            </tbody>
          </table>

          ${itemsHtml}

          <div class="balance-card">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>التكلفة التقريبية المتوقعة:</span>
              <span>${(order.expectedCost || 0).toLocaleString()} ج.م</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>مقدم عربون الصيانة (تأكيد):</span>
              <span>${(order.deposit || 0).toLocaleString()} ج.م</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; color: #2e7d32; font-size: 16px; border-top: 1px double #2e7d32; padding-top: 5px; margin-top: 5px;">
              <span>المبلغ المتبقي المتوقع لتسوية التسليم والضمان:</span>
              <span>${((order.actualCost || order.expectedCost || 0) - (order.deposit || 0)).toLocaleString()} ج.م</span>
            </div>
          </div>

          <div class="rules-box">
            <h4>⚠️ شروط الصيانة العامة والتزام العميل:</h4>
            <ul>
              <li>تنتهي مسؤولية المحل بالكامل عن أي جهاز يترك في الصيانة لأكثر من 3 أشهر دون استلامه.</li>
              <li>الضمان يسري فقط على قطع الغيار المستبدلة والمسجلة بالإيصال لمدة 14 يوماً من تاريخ الاستلام، ولا يشمل الضمان حالات سوء الاستخدام مثل التعرض للماء أو السقوط.</li>
              <li>الرمز المشفر أو كلمة السر المسلمة هي لغرض الفحص التقني فقط والمحل ملتزم بخصوصية البيانات وسريتها التامة.</li>
              <li>الفحص المبدئي هو معاينة ظاهرية، وربما تظهر أعطال أخرى في الدوائر المتكاملة أثناء العمل الفني يتم التواصل مع العميل لإبلاغه بالكلفة المحدثة فوراً.</li>
            </ul>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 40px; font-size: 13px; font-weight: bold; padding: 15px 10px; border-top: 1px dashed #bdc3c7; font-family: sans-serif;">
            <span>مستلم الجهاز بالمركز: .......................</span>
            <span>توقيع العميل بقبول بروتوكول وشروط الصيانة: .......................</span>
          </div>

          <div class="foot">
            <p>نسعد بخدمتكم التقنية وحريصون على سرية واستجابة بياناتكم الشخصية بالكامل!</p>
          </div>

          <script>
            window.onload = () => { window.print(); window.close(); }
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
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&family=Cairo:wght@300;400;500;600;700;800;900&display=swap');

        #computer-mobile-maintenance-root {
          font-family: 'Tajawal', 'Cairo', sans-serif !important;
        }

        .tech-circuit-bg {
          background-color: #f8fafc !important;
          background-image: none !important;
        }

        #computer-mobile-maintenance-root .neu-pressed {
          background: #f1f5f9 !important;
          box-shadow: 
            inset 2px 2px 5px rgba(165, 180, 200, 0.08), 
            inset -2px -2px 5px rgba(255, 255, 255, 0.8) !important;
          border: 1px solid rgba(226, 232, 240, 0.8) !important;
        }

        #computer-mobile-maintenance-root .neu-raised {
          background: #ffffff !important;
          box-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.02),
            0 4px 12px rgba(163, 177, 198, 0.06) !important;
          border: 1px solid rgba(241, 245, 249, 0.8) !important;
        }

        .neu-nav-item {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent !important;
        }

        .neu-nav-item:hover {
          transform: translateY(-1.5px);
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          color: #0f172a !important;
          box-shadow: 
            0 4px 12px rgba(148, 163, 184, 0.08),
            0 1px 2px rgba(0, 0, 0, 0.01) !important;
        }

        #computer-mobile-maintenance-root .neu-nav-item-active {
          background: linear-gradient(102deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%) !important;
          color: #ffffff !important;
          border: 1px solid #2563eb !important;
          box-shadow: 
            0 10px 18px -3px rgba(37, 99, 235, 0.3), 
            0 4px 6px -4px rgba(37, 99, 235, 0.3),
            inset 0 1px 1px rgba(255, 255, 255, 0.2) !important;
          transform: translateY(-1.5px) scale(1.015);
        }
      `}</style>
      <Toaster position="top-left" reverseOrder={true} />

      {/* Header Banner */}
      <div className="bg-white p-8 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10 border border-slate-100 shadow-xs transition-all duration-300">
        <div className="space-y-3 text-right w-full font-sans">
          <div className="flex flex-wrap items-center gap-2.5 mb-1 bg-slate-50/50 p-1 rounded-full w-max border border-slate-100/50">
            <span className="px-3.5 py-1 text-[10px] font-black tracking-tight text-blue-755 bg-white border border-blue-100/80 rounded-full inline-flex items-center gap-1.5 shadow-3xs">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
              </span>
              قسم صيانة الإلكترونيات ورقاقة البورد المتقدمة
            </span>
            <span className="px-3 py-1 text-[10px] font-black text-slate-500 bg-transparent inline-flex items-center gap-1 select-none">
              المطابقة المحاسبية والضمانات الفنية 💻📱
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 session-brief">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">كروت وأجهزة صيانة الورشة الحالية</h1>
              <p className="text-xs text-slate-500 font-medium">استقبال أجهزة وفحص الدوائر وإثبات التسويات المالية المحاسبية</p>
            </div>

            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => openFormModal(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3.5 rounded-[8px] flex items-center justify-center gap-2 transition-all active:scale-95 text-center shrink-0 cursor-pointer border border-blue-700 shadow-xs"
              >
                <Plus className="w-4 h-4 text-white" />
                استلام جهاز صيانة جديد
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* Orders Core SubPage */}
      <div className="space-y-6" id="mntc-orders-subpage">
        {/* Internal filters toolbar */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/45 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xs">
          <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200/30 w-full md:w-auto">
            <button
              onClick={() => setDeviceFilter('all')}
              className={`flex-1 md:flex-initial px-4.5 py-2 font-black text-xs rounded-lg transition-all ${deviceFilter === 'all' ? 'bg-white text-blue-600 shadow-xs border border-slate-200/10' : 'text-slate-500 hover:text-slate-800'}`}
            >
              كل الأجهزة ({orders.length})
            </button>
            <button
              onClick={() => setDeviceFilter('computer')}
              className={`flex-1 md:flex-initial px-4.5 py-2 font-black text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 ${deviceFilter === 'computer' ? 'bg-white text-blue-600 shadow-xs border border-slate-200/10' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Monitor className="w-3.5 h-3.5" />
              كمبيوتر / لابتوب
            </button>
            <button
              onClick={() => setDeviceFilter('mobile')}
              className={`flex-1 md:flex-initial px-4.5 py-2 font-black text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 ${deviceFilter === 'mobile' ? 'bg-white text-blue-600 shadow-xs border border-slate-200/10' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              موبيلات وهواتف
            </button>
          </div>

          {/* Searches */}
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                placeholder="ابحث بالعميل، جوال، براند، أو عيب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-64 pr-9 pl-4 py-2 bg-slate-55/70 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-right"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-55/70 border border-slate-200 rounded-xl font-black text-xs outline-none focus:bg-white text-right cursor-pointer"
            >
              <option value="all">كل حالات الورشة</option>
              {Object.entries(statusMap).map(([key, value]) => (
                <option key={key} value={key} className="font-bold">{value.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Floating spacious cards display */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/60 shadow-xs">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">لا توجد أجهزة مسجلة تطابق محددات البحث</h3>
            <p className="text-slate-550 text-xs max-w-md mx-auto leading-normal font-semibold text-slate-500">
              اضغط على زر (استلام جهاز صيانة جديد) بالزاوية العلوية اليسرى للشاشة وقم بإرفاق عيب الموبايل وسيريال الشاحنات، والمواصفات وسيتم تدوين الحركة المحاسبية في نفس اللحظة.
            </p>
          </div>
        ) : (
          <div className="space-y-4 font-sans" id="mntc-orders-list-cards">
            {filteredOrders.map((order) => {
              const isPC = (order.deviceType || '').toLowerCase().includes('كمبيوتر') || 
                           (order.deviceType || '').toLowerCase().includes('لابتوب') || 
                           (order as any).deviceCategory === 'computer';
              
              const statusOpt = statusMap[order.status] || { label: 'غير محدد', color: 'text-slate-400', bg: 'bg-slate-100', icon: HelpCircle };
              const StatusIcon = statusOpt.icon;

              return (
                <div 
                  key={order.id} 
                  className="bg-white hover:bg-slate-50/10 border border-slate-200/35 rounded-2xl p-6 shadow-xs hover:shadow-sm transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-6"
                  id={`order-card-${order.id}`}
                >
                  <div className="flex items-center gap-4.5 w-full md:w-[28%] text-right shrink-0">
                    <div className={`p-4 rounded-xl shrink-0 transition-transform hover:scale-105 duration-200 ${isPC ? 'bg-amber-50 text-amber-600 border border-amber-100/50' : 'bg-blue-50 text-blue-600 border border-blue-100/50'}`}>
                      {isPC ? <Laptop className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                    </div>
                    <div className="space-y-1">
                      <div className="font-extrabold text-slate-800 text-base">{order.customerName}</div>
                      <div className="flex flex-wrap items-center gap-1.5 text-slate-450 font-bold text-xs">
                        <span className="font-mono text-slate-400">{order.customerPhone}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-black text-slate-700">{order.deviceBrand} {order.deviceModel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-[15%] flex justify-start md:justify-center items-center shrink-0">
                    <span className={`px-4 py-2 rounded-2xl border text-xs font-black inline-flex items-center gap-2 transition-transform hover:scale-102 ${statusOpt.bg} ${statusOpt.color} border-current/10 shadow-xs/10`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusOpt.label}
                    </span>
                  </div>

                  <div className="w-full md:w-[22%] text-right md:text-center shrink-0">
                    <div className="text-rose-600 font-extrabold text-sm tracking-tight leading-normal">
                      <span className="text-rose-500/70 font-black">المشكلة: </span>
                      {order.issueDescription.split('\n')[0].split('•')[0].split(',')[0]}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 justify-end md:justify-center">
                      <span className="inline-block font-mono text-[10px] bg-slate-50 border border-slate-200/50 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                        ORD-{String(order.id).padStart(5, '0')}
                      </span>
                      {order.technicianName && (
                        <span className="inline-block text-[10px] text-slate-450 font-bold">
                          الفني: {order.technicianName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full md:w-[18%] flex items-center justify-start md:justify-end gap-3 text-left">
                    <div className="text-right">
                      <div className="font-black font-sans text-lg text-slate-900 leading-none">
                        {(order.actualCost || order.expectedCost || 0).toLocaleString()} <span className="text-xs font-black text-slate-500">ج.م</span>
                      </div>
                      {order.deposit > 0 && (
                        <span className="inline-block mt-0.5 font-mono text-[9px] text-slate-450 font-extrabold bg-blue-50/60 border border-blue-100/40 px-1.5 py-0.5 rounded-md">
                          عربون: {order.deposit.toLocaleString()} ج.م
                        </span>
                      )}
                    </div>
                    {order.status === 'delivered' ? (
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-lg border border-emerald-100 shadow-xs shrink-0 font-sans font-sans">
                        مسلم ومحصل
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-extrabold rounded-lg border border-blue-100 shadow-xs shrink-0 font-sans font-sans">
                        قيد العمل
                      </span>
                    )}
                  </div>

                  <div className="w-full md:w-auto flex items-center justify-start md:justify-end gap-3 shrink-0">
                    <button 
                      onClick={() => handlePrintReceipt(order)}
                      title="طباعة إيصال الفحص والضمان للعميل"
                      className="p-3 text-blue-600 hover:bg-blue-50 hover:text-blue-700 active:scale-95 rounded-xl border border-slate-200/60 bg-white shadow-xs transition-all cursor-pointer"
                    >
                      <Printer className="w-4.5 h-4.5" />
                    </button>

                    <button 
                      onClick={() => openFormModal(order)}
                      title="تعديل تفاصيل الصيانة / ترحيل الحالة المادية"
                      className="p-3 text-amber-600 hover:bg-amber-50 hover:text-amber-700 active:scale-95 rounded-xl border border-slate-200/60 bg-white shadow-xs transition-all cursor-pointer"
                    >
                      <Edit className="w-4.5 h-4.5" />
                    </button>

                    <button 
                      onClick={() => setDeleteOrderId(order.id || null)}
                      title="حذف"
                      className="p-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:scale-95 rounded-xl border border-slate-200/60 bg-white shadow-xs transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 1. ORDER CREATION / EDIT MODAL SCREEN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-end z-50 p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:max-w-4xl h-full sm:h-[90vh] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between">
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <Wrench className="w-6 h-6 text-blue-600" />
                <div className="text-right">
                  <h3 className="text-sm font-black text-slate-800">
                    {editingOrder ? `تخطيط وتحديث كرت الصيانة #${editingOrder.id}` : 'فتح ملف استقبال صيانة تقني جديد'}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">تسجيل الأعطال، كشفيات الفحص ودمج عتاد قطع البورد ومطابقة الكاش والضمانات</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-slate-100 text-slate-400 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="flex-1 overflow-y-auto p-6 space-y-6 text-right">
              {/* Part A: Client Info */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/55 space-y-3.5">
                <h3 className="text-xs font-black text-slate-700 border-b pb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-blue-500 rounded-xs"></span>
                  1. الهوية الأساسية والاتصال بالعميل المستلم
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold">الاسم الكامل للعميل *</label>
                    <input 
                      type="text"
                      value={formCustomerName}
                      onChange={(e) => setFormCustomerName(e.target.value)}
                      placeholder="مثال: ياروسلاف بوندس"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-black text-slate-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold">جوال التواصل الرئيسي *</label>
                    <input 
                      type="text"
                      value={formCustomerPhone}
                      onChange={(e) => setFormCustomerPhone(e.target.value)}
                      placeholder="رقم الموبايل المسجل"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-mono font-bold text-center"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold">هاتف بديل / للطوارئ (اختياري)</label>
                    <input 
                      type="text"
                      value={formCustomerAltPhone}
                      onChange={(e) => setFormCustomerAltPhone(e.target.value)}
                      placeholder="رقم آخر أو هاتف أرضي"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Part B: Device Identification */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/55 space-y-4">
                <h3 className="text-xs font-black text-slate-700 border-b pb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-blue-550 rounded-xs"></span>
                  2. مواصفات وتعريف الإلكترونيات المستلمة بالفرع
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold">فئة الأجهزة المستلمة</label>
                    <select
                      value={formDeviceType}
                      onChange={(e) => setFormDeviceType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black cursor-pointer text-right"
                    >
                      <option value="mobile">📱 هاتف محمول مخصص</option>
                      <option value="laptop">💻 كمبيوتر محمول (Laptop)</option>
                      <option value="computer">🖥️ كمبيوتر مكتبي (Desktop)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold">الشركة المصنعة (Brand)</label>
                    <select
                      value={formDeviceBrand}
                      onChange={(e) => setFormDeviceBrand(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black cursor-pointer text-right"
                    >
                      <option value="Apple">Apple</option>
                      <option value="Samsung">Samsung</option>
                      <option value="Xiaomi">Xiaomi</option>
                      <option value="Oppo">Oppo</option>
                      <option value="Huawei">Huawei</option>
                      <option value="Dell">Dell</option>
                      <option value="Lenovo">Lenovo</option>
                      <option value="HP">HP</option>
                      <option value="Asus">Asus</option>
                      <option value="Acer">Acer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold">موديل ومواصفات الهيكل *</label>
                    <input 
                      type="text"
                      value={formDeviceModel}
                      onChange={(e) => setFormDeviceModel(e.target.value)}
                      placeholder="مثال: iPhone 13 Pro"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-extrabold text-right"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold">سيريال الهيكل / IMEI</label>
                    <input 
                      type="text"
                      value={formDeviceSerial}
                      onChange={(e) => setFormDeviceSerial(e.target.value)}
                      placeholder="رمز السيريال المكتوب"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-mono text-center font-bold"
                    />
                  </div>
                </div>

                {/* Technical Custom Specs (Diagnostic Parameters) based on conditional type Selection */}
                {formDeviceType === 'mobile' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3 border-t">
                    <div>
                      <label className="block text-[10px] text-slate-450 mb-1">القدرة والـصحة المقررة للبطارية (%)</label>
                      <input 
                        type="number"
                        value={mobileBatteryHealth}
                        onChange={(e) => setMobileBatteryHealth(parseInt(e.target.value) || 100)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-mono text-center font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-450 mb-1">قفل الحساب السحابي للعميل</label>
                      <select
                        value={mobileAccountStatus}
                        onChange={(e) => setMobileAccountStatus(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-50 border rounded-lg text-xs font-black cursor-pointer text-right"
                      >
                        <option value="Logged Out">مسجل خروج بالكامل (آمن) Logged Out</option>
                        <option value="Logged In">نشط وبجوجل / آي كلاود Logged In</option>
                        <option value="N/A">لا يمكن عرضه (طافي طاقة) N/A</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-450 mb-1">فحص باغات وشروخ الشاشة</label>
                      <input 
                        type="text"
                        value={mobileScreenCondition}
                        onChange={(e) => setMobileScreenCondition(e.target.value)}
                        placeholder="مثال: ممتازة / بها شرخ بسيط"
                        className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-extrabold text-right animate-pulse-soft"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3 border-t">
                    <div>
                      <label className="block text-[9.5px] text-slate-450 mb-1 font-sans font-bold">المعالج CPU</label>
                      <input 
                        type="text"
                        value={pcCpu}
                        onChange={(e) => setPcCpu(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border rounded-lg text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] text-slate-450 mb-1 font-sans font-bold">الذاكرة الـ RAM</label>
                      <input 
                        type="text"
                        value={pcRam}
                        onChange={(e) => setPcRam(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border rounded-lg text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] text-slate-450 mb-1 font-sans font-bold">تخزين Storage</label>
                      <input 
                        type="text"
                        value={pcStorage}
                        onChange={(e) => setPcStorage(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border rounded-lg text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] text-slate-450 mb-1 font-sans font-bold">كارت الشاشة GPU</label>
                      <input 
                        type="text"
                        value={pcGpu}
                        onChange={(e) => setPcGpu(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border rounded-lg text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[9.5px] text-slate-450 mb-1 font-sans font-bold">نظام التشغيل OS</label>
                      <input 
                        type="text"
                        value={pcOs}
                        onChange={(e) => setFormPcOs(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border rounded-lg text-xs font-black"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dead Devices Protocol & Pre-Check Checklist */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/55 space-y-4 shadow-xs">
                <div className="border-b pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-3.5 bg-rose-500 rounded-xs"></span>
                    بروتوكول الأجهزة الميتة وفصل المسؤولية (Dead Devices Protocol)
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-100 font-extrabold px-2 py-0.5 rounded-md">
                      حماية قانونية
                    </span>
                  </div>
                </div>

                {/* Dead on Arrival Switch */}
                <div className="p-3.5 bg-rose-50/40 rounded-xl border border-rose-100/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1 text-right">
                    <label className="text-xs font-black text-rose-900 flex items-center gap-1 select-none">
                      💀 تنشيط بروتوكول "جهاز لا يعمل بالكامل" (Dead on Arrival)
                    </label>
                    <p className="text-[10px] text-rose-600/80 font-bold">
                      فعل هذا الخيار إذا كان الجهاز تالفاً بالكامل، لا يستجيب للكهرباء أو طاقة التشغيل، أو فاصل باور تماماً.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nuVal = !formIsDeadOnArrival;
                      setFormIsDeadOnArrival(nuVal);
                      if (nuVal) {
                        // Automatically set checklist power and charging to fail
                        setFormCheckPower('fail');
                        setFormCheckCharging('fail');
                        setFormCheckCamera('not_tested');
                        setFormCheckAudio('not_tested');
                        setFormCheckWifi('not_tested');
                        setFormCheckFingerprint('not_tested');
                      } else {
                        setFormCheckPower('ok');
                        setFormCheckCharging('ok');
                      }
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all active:scale-95 border cursor-pointer select-none ${
                      formIsDeadOnArrival 
                        ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-200' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {formIsDeadOnArrival ? '💀 الجهاز ميت بالكامل' : '✔ الجهاز يفتح طاقة'}
                  </button>
                </div>

                {/* Checklist Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-600 select-none">
                      📋 فحص معاينة الحالة المبدئية عند الاستلام (Checklist):
                    </span>
                    {formIsDeadOnArrival && (
                      <span className="text-[10px] text-rose-600 font-bold">
                        مغلق تلقائياً لتصنيف الجهاز كـ "ميت بالكامل"
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Item 1: Power */}
                    <div className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700 select-none">التشغيل والباور (Power)</span>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg border gap-0.5 shrink-0">
                        {(['ok', 'fail', 'not_tested'] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            disabled={formIsDeadOnArrival}
                            onClick={() => setFormCheckPower(v)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer select-none ${
                              formCheckPower === v
                                ? v === 'ok' ? 'bg-emerald-500 text-white shadow-xs' : v === 'fail' ? 'bg-rose-500 text-white shadow-xs' : 'bg-slate-500 text-white shadow-xs'
                                : 'text-slate-550 hover:bg-slate-200/50'
                            }`}
                          >
                            {v === 'ok' ? 'سليم' : v === 'fail' ? 'تالف' : 'لم يُفحص'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Item 2: Charging */}
                    <div className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700 select-none">دائرة ومنفذ الشحن (Charging)</span>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg border gap-0.5 shrink-0">
                        {(['ok', 'fail', 'not_tested'] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            disabled={formIsDeadOnArrival}
                            onClick={() => setFormCheckCharging(v)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer select-none ${
                              formCheckCharging === v
                                ? v === 'ok' ? 'bg-emerald-500 text-white shadow-xs' : v === 'fail' ? 'bg-rose-500 text-white shadow-xs' : 'bg-slate-500 text-white shadow-xs'
                                : 'text-slate-550 hover:bg-slate-200/50'
                            }`}
                          >
                            {v === 'ok' ? 'سليم' : v === 'fail' ? 'تالف' : 'لم يُفحص'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Item 3: Camera */}
                    <div className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700 select-none">الكاميرات المامبلة والخلفية (Camera)</span>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg border gap-0.5 shrink-0">
                        {(['ok', 'fail', 'not_tested'] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            disabled={formIsDeadOnArrival}
                            onClick={() => setFormCheckCamera(v)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer select-none ${
                              formCheckCamera === v
                                ? v === 'ok' ? 'bg-emerald-500 text-white shadow-xs' : v === 'fail' ? 'bg-rose-500 text-white shadow-xs' : 'bg-slate-500 text-white shadow-xs'
                                : 'text-slate-550 hover:bg-slate-200/50'
                            }`}
                          >
                            {v === 'ok' ? 'سليم' : v === 'fail' ? 'تالف' : 'لم يُفحص'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Item 4: Audio */}
                    <div className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700 select-none">سماعات ومايك الصوت (Audio)</span>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg border gap-0.5 shrink-0">
                        {(['ok', 'fail', 'not_tested'] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            disabled={formIsDeadOnArrival}
                            onClick={() => setFormCheckAudio(v)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer select-none ${
                              formCheckAudio === v
                                ? v === 'ok' ? 'bg-emerald-500 text-white shadow-xs' : v === 'fail' ? 'bg-rose-500 text-white shadow-xs' : 'bg-slate-500 text-white shadow-xs'
                                : 'text-slate-550 hover:bg-slate-200/50'
                            }`}
                          >
                            {v === 'ok' ? 'سليم' : v === 'fail' ? 'تالف' : 'لم يُفحص'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Item 5: Wi-Fi */}
                    <div className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700 select-none">الواي فاي والاتصال (Wi-Fi)</span>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg border gap-0.5 shrink-0">
                        {(['ok', 'fail', 'not_tested'] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            disabled={formIsDeadOnArrival}
                            onClick={() => setFormCheckWifi(v)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer select-none ${
                              formCheckWifi === v
                                ? v === 'ok' ? 'bg-emerald-500 text-white shadow-xs' : v === 'fail' ? 'bg-rose-500 text-white shadow-xs' : 'bg-slate-500 text-white shadow-xs'
                                : 'text-slate-550 hover:bg-slate-200/50'
                            }`}
                          >
                            {v === 'ok' ? 'سليم' : v === 'fail' ? 'تالف' : 'لم يُفحص'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Item 6: Fingerprint */}
                    <div className="p-3 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700 select-none">بصمة الإصبع والوجه (Biometrics)</span>
                      <div className="flex bg-slate-100 p-0.5 rounded-lg border gap-0.5 shrink-0">
                        {(['ok', 'fail', 'not_tested'] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            disabled={formIsDeadOnArrival}
                            onClick={() => setFormCheckFingerprint(v)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer select-none ${
                              formCheckFingerprint === v
                                ? v === 'ok' ? 'bg-emerald-500 text-white shadow-xs' : v === 'fail' ? 'bg-rose-500 text-white shadow-xs' : 'bg-slate-500 text-white shadow-xs'
                                : 'text-slate-550 hover:bg-slate-200/50'
                            }`}
                          >
                            {v === 'ok' ? 'سليم' : v === 'fail' ? 'تالف' : 'لم يُفحص'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Part C: Shape, Conditions & Device Password Lock */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/55 space-y-4">
                <h3 className="text-xs font-black text-slate-700 border-b pb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-blue-500 rounded-xs"></span>
                  3. شكل وقفل الجهاز (الحالة الخارجية وأمن البورد)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold">حالة الجهاز الخارجي (به خدوش، مكسور...) *</label>
                    <input 
                      type="text"
                      value={formDeviceCondition}
                      onChange={(e) => setFormDeviceCondition(e.target.value)}
                      placeholder="سليم تماماً / به خدوش شاشة / كسر بالباغة"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-black"
                      required
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['سليم تماماً', 'به خدوش وشروخ', 'شاشة mكسورة', 'صدمات بالهيكل', 'أثر سوائل رطوبة'].map(cond => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => setFormDeviceCondition(cond)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-200 cursor-pointer"
                        >
                          {cond}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold">قفل الشاشة: رمز أو نمط (لأغراض المعاينة)</label>
                    <input 
                      type="text"
                      value={formDevicePassword}
                      onChange={(e) => setFormDevicePassword(e.target.value)}
                      placeholder="مثال: رمز: 1234 أو نمط: حرف Z"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-mono font-bold text-center"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['بدون قفل', 'رمز 1234', 'رمز 0000', 'نمط مرسوم'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormDevicePassword(p)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-200 cursor-pointer"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Part D: Issue Diagnostics */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/55 space-y-4">
                <h3 className="text-xs font-black text-slate-700 border-b pb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-indigo-500 rounded-xs"></span>
                  4. تشخيص المشكلة ومعاينة الورشة الأساسية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold">شكوى العميل الأساسية من العطل *</label>
                    <textarea 
                      rows={2} 
                      value={formIssueDescription}
                      onChange={(e) => setFormIssueDescription(e.target.value)}
                      placeholder="مثال: شاشة رمادي كاملة / لا يشحن / يغلق فجأة"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold leading-normal text-right space-y-1"
                      required
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold">الفحص المبدئي والتشخيص المسجل لموظف الاستقبال</label>
                    <textarea 
                      rows={2} 
                      value={formReceptionistInspection}
                      onChange={(e) => setFormReceptionistInspection(e.target.value)}
                      placeholder="ملاحظات فحص المسار والتيار المبدئي"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold leading-normal text-right space-y-1"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Part E: Received Accessories */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/55 space-y-4">
                <h3 className="text-xs font-black text-slate-700 border-b pb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-amber-500 rounded-xs"></span>
                  5. المتعلقات والكماليات المستلمة بالمركز
                </h3>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1 font-extrabold text-right">الأجزاء والقطع الملحقة مع الجهاز (شاحن، بطارية، كارت ميموري...)</label>
                  <input 
                    type="text"
                    value={formDeviceAttachments}
                    onChange={(e) => setFormDeviceAttachments(e.target.value)}
                    placeholder="شاحن، بطارية، كارت ميموري، بدون متعلقات"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-xs font-black text-right"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['شاحن أصلي', 'بطارية داخلية', 'كارت ميموري', 'بدون متعلقات', 'جراب أو كفر حماية'].map(item => {
                      const hasItem = formDeviceAttachments.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            if (item === 'بدون متعلقات') {
                              setFormDeviceAttachments('بدون متعلقات');
                            } else {
                              let current = formDeviceAttachments === 'بدون متعلقات' ? '' : formDeviceAttachments;
                              if (current.includes(item)) {
                                current = current.replace(item, '').replace(/,\s*,/g, ',').trim();
                              } else {
                                current = current ? `${current} - ${item}` : item;
                              }
                              setFormDeviceAttachments(current);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                            hasItem || (item === 'بدون متعلقات' && formDeviceAttachments === 'بدون متعلقات')
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Part F: Financial Estimations and upfront balance */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/55 space-y-4">
                <h3 className="text-xs font-black text-slate-700 border-b pb-2 flex items-center gap-1">
                  <Coins className="w-4 h-4 text-emerald-500" />
                  6. الماليات المبدئية والربط المحاسبي (التكلفة ومقدم العربون والباقي)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold font-sans">التكلفة التقديرية المخططة *</label>
                    <input 
                      type="number"
                      value={formExpectedCost}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setFormExpectedCost(val);
                        setFormActualCost(val);
                      }}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-center font-mono text-xs font-black text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold font-sans">المبلغ المدفوع كمقدم (عربون)</label>
                    <input 
                      type="number"
                      value={formDeposit}
                      disabled={!!editingOrder}
                      onChange={(e) => setFormDeposit(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-center font-mono text-xs font-black text-amber-700 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold font-sans">الباقي المتوقع للتسوية</label>
                    <input 
                      type="text"
                      readOnly
                      value={`${(formExpectedCost - formDeposit).toLocaleString()} ج.م`}
                      className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none text-center font-mono text-xs font-black text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold font-sans">حالة كرت الصيانة بالورشة</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as MaintenanceStatus)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black cursor-pointer text-right"
                    >
                      {Object.entries(statusMap).map(([k, v]) => (
                        <option key={k} value={k} className="font-bold">{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold">الفني / المهندس المكلف بصيانة الجهاز</label>
                    <select
                      value={formTechnicianName}
                      onChange={(e) => setFormTechnicianName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-right cursor-pointer"
                    >
                      <option value="">-- اضغط لتعيين فني للبطاقة --</option>
                      <option value="المهندس رومان بيليبيينكو">المهندس رومان بيليبيينكو (إلكترونيات وشاشات)</option>
                      <option value="البشمهندس تاراس شفتشينكو">البشمهندس تاراس شفتشينكو (لابتوب وبوردات)</option>
                      <option value="المهندس ميكولا كوفال">المهندس ميكولا كوفال (سوكت وشحن)</option>
                      <option value="الأخصائي بوهدان ملنيك">الأخصائي بوهدان ملنيك (بوردات أجهزة منزلية)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1 font-extrabold">ملاحظات وتقرير المهندسين النهائي</label>
                    <input 
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="لقد تم استبدال مكثف خط الاستقطاب ومراجعة فاز الطاقة"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-right"
                    />
                  </div>
                </div>

                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 text-[10px] font-black leading-relaxed text-right flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  📢 تصفية المبلغ المتبقي (قيمة: <span className="font-mono text-emerald-800 font-black">{(formActualCost - formDeposit).toLocaleString()} ج.م</span>)
                  سيتم معالجته كقيد مزدوج في كشوفات الخزينة تلقائياً بمجرد تحول حالة الجهاز إلى <strong className="text-emerald-700">"تم التسليم"</strong>.
                </div>
              </div>

              {/* Part E: Consumed Spare Parts inside tickets form */}
              <div className="bg-white p-4.5 rounded-2xl border border-slate-150 space-y-4">
                <h3 className="text-xs font-black text-slate-700 border-b pb-2 flex items-center gap-1">
                  <Database className="w-4 h-4 text-amber-500" />
                  6. قطع الغيار والرقاقات المدخلة لأمر الصيانة
                </h3>

                <div className="space-y-2.5 text-right font-sans">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">اختر قطعة غيار من الرف المسبق (اختياري)</label>
                    <select
                      onChange={(e) => handleSelectProductPart(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-black cursor-pointer text-right"
                    >
                      <option value="">-- اختر من مخزون بوردة المحل --</option>
                      {parsedParts.map(p => (
                        <option key={p.id} value={p.name} className="font-semibold">{p.name} (رصيد: {p.stock || 0} • بيع: {p.price || 0} ج.م)</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-12 gap-1.5 items-end">
                    <div className="col-span-5">
                      <label className="block text-[8px] text-slate-400 mb-0.5">اسم القطعة يدوياً</label>
                      <input 
                        type="text" 
                        placeholder="باغة ايفون / ايسي شحن"
                        value={currentPartName}
                        onChange={(e) => setCurrentPartName(e.target.value)}
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold text-right"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-[8px] text-slate-400 mb-0.5">الكلفة للعميل</label>
                      <input 
                        type="number" 
                        value={currentPartPrice}
                        onChange={(e) => setCurrentPartPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold font-mono text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[8px] text-slate-400 mb-0.5">الكمية</label>
                      <input 
                        type="number" 
                        value={currentPartQty}
                        onChange={(e) => setCurrentPartQty(parseInt(e.target.value) || 1)}
                        className="w-full px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono font-bold text-center"
                      />
                    </div>
                    <div className="col-span-2">
                      <button
                        type="button"
                        onClick={handleAddPart}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-md cursor-pointer text-center"
                      >
                        ضم
                      </button>
                    </div>
                  </div>
                </div>

                {/* Consumed materials list */}
                {orderParts.length > 0 ? (
                  <div className="space-y-1.5 pt-2 border-t text-[11px] text-right font-sans">
                    {orderParts.map((p, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-50 border p-2 rounded-lg font-bold">
                        <span>{p.name} × {p.quantity}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-emerald-800">{(p.price * p.quantity).toLocaleString()} ج.م</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemovePart(i)}
                            className="text-rose-600 hover:text-rose-800 font-extrabold cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-405 italic text-center py-1 font-semibold text-slate-450 text-slate-400">لا توجد قطع غيار مسحوبة بعد، أدرجها عند الفحص الفعلي</p>
                )}
              </div>
            </form>

            <div className="p-6 border-t bg-slate-50 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-605 font-bold rounded-xl text-xs cursor-pointer"
              >
                إلغاء وتراجع
              </button>
              <button
                type="button"
                onClick={handleSaveOrder}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
              >
                {editingOrder ? 'حفظ التحديثات ومطابقة الصندوق' : 'إيداع الصيانة ببطاقات المحل'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CORE CONFIRM DIALOG */}
      <ConfirmModal 
        isOpen={deleteOrderId !== null}
        title="حذف حركة الفحص الفني"
        message="هل أنت متأكد من مسح وإبعاد ملف الصيانة وتتبع هذا الجهاز نهائياً من الصندوق السحابي والذاكرة المحلية للفرع؟"
        confirmText="نعم، حذف سجل الصيانة"
        cancelText="تراجع وإبقاء الملف"
        onConfirm={handleDeleteOrder}
        onCancel={() => setDeleteOrderId(null)}
      />
    </div>
  );
};

export default ComputerMobileOrders;
