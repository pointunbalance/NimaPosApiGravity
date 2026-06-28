import React, { useState, useEffect, useMemo } from 'react';
import { 
  HeartHandshake, Plus, Search, Filter, ShoppingCart, Package, FileCheck, 
  Landmark, FileBarChart, Edit3, Trash2, X, AlertOctagon, Check, ShoppingBag, 
  Users, TrendingUp, TrendingDown, DollarSign, Calendar, Eye, RefreshCw, AlertTriangle, Printer, Trash,
  Sparkles, Lightbulb, ShieldCheck, Calculator
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { AccountingEngine } from '../../services/AccountingEngine';
import { useToast } from '../../context/ToastContext';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

interface PharmacyDashboardProps {
  initialTab?: string;
}

export const PharmacyDashboard: React.FC<PharmacyDashboardProps> = ({ initialTab = 'dashboard' }) => {
  const { success, error, warning } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // Confirmation Modals State
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState<'medicine' | 'prescription' | 'purchase' | 'return' | null>(null);

  // Load state from IndexedDB
  const medicines = useLiveQuery(() => db.pharmacyMedicines.toArray()) || [];
  const allBatches = useLiveQuery(() => db.pharmacyBatches.toArray()) || [];
  const allUnits = useLiveQuery(() => db.pharmacyProductUnits.toArray()) || [];
  const sales = useLiveQuery(() => db.pharmacySales.toArray()) || [];
  const prescriptions = useLiveQuery(() => db.pharmacyPrescriptions.toArray()) || [];
  const purchases = useLiveQuery(() => db.pharmacyPurchases.toArray()) || [];
  const returns = useLiveQuery(() => db.pharmacyReturns?.toArray()) || [];
  const insuranceCompanies = useLiveQuery(() => db.clinicInsuranceCompanies.toArray()) || [];

  // Local state for Modals / Forms
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [medForm, setMedForm] = useState({
    id: undefined as number | undefined,
    name: '',
    code: '',
    category: 'مضاد حيوي',
    activeIngredient: '',
    stock: 0,
    expiryDate: '',
    shelfLocation: '',
    price: 0,
    costPrice: 0,
    minStock: 10,
    hasRetailFractioning: false,
    packHasStrips: 3,
    stripHasPills: 10,
    pricePerStrip: 0,
    pricePerPill: 0,
    stripBarcode: '',
    isControlled: false,
    batchNumber: '',
    supplierName: 'مستودع ياروسلاف للأدوية'
  });

  // Local state for POS Cashier
  const [posCart, setPosCart] = useState<{ med: any; quantity: number; selectedUnit: 'pack' | 'strip' | 'pill' }[]>([]);
  const [posCustomerName, setPosCustomerName] = useState('زبون نقدي');
  const [posDiscount, setPosDiscount] = useState(0);
  const [posPaymentMethod, setPosPaymentMethod] = useState<'cash' | 'bank_transfer'>('cash');
  const [receiptToPrint, setReceiptToPrint] = useState<any | null>(null);

  // POS Co-Payment Insurance States
  const [isInsuranceEnabled, setIsInsuranceEnabled] = useState(false);
  const [selectedInsuranceCompanyId, setSelectedInsuranceCompanyId] = useState<string | number>('');
  const [patientSharePercent, setPatientSharePercent] = useState(20);
  const [insuranceSharePercent, setInsuranceSharePercent] = useState(80);
  const [posPrescriptionFile, setPosPrescriptionFile] = useState('');

  // Manual Prescription Archiving States
  const [isManualPrescModalOpen, setIsManualPrescModalOpen] = useState(false);
  const [manualPrescForm, setManualPrescForm] = useState({
    patientName: 'أولغا كوفالينكو',
    doctorName: 'د. ميكولا كوزنيتسوف',
    date: new Date().toISOString().split('T')[0],
    selectedMedicines: [] as { medicineName: string; quantity: number; dosage: string }[],
    prescriptionFileBase64: '',
    notes: 'تم فحص صورة الروشتة للأرشفة الرقمية والرقابة الصيدلانية أوفلاين'
  });
  
  // Alternatives smart suggestions modal source
  const [alternativeMedSource, setAlternativeMedSource] = useState<any | null>(null);
  const [activeMedForDetails, setActiveMedForDetails] = useState<any | null>(null);

  // Controlled drugs clearance states
  const [isControlledFormOpen, setIsControlledFormOpen] = useState(false);
  const [controlledForm, setControlledForm] = useState({
    patientName: '',
    patientNationalID: '',
    doctorName: '',
    prescriptionNumber: '',
    prescriptionFileBase64: '',
    notes: 'تم التحقق من ختم الروشتة والأكواد الطبية المشفرة'
  });

  // Interactivity for Reports
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expired' | '3months' | '6months'>('all');
  const [selectedRegistrySale, setSelectedRegistrySale] = useState<any | null>(null);
  const [purchaseSubTab, setPurchaseSubTab] = useState<'bills' | 'returns'>('bills');

  // Local state for Prescriptions Modal
  const [selectedPrescription, setSelectedPrescription] = useState<any | null>(null);
  const [prescSubTab, setPrescSubTab] = useState<'electronic' | 'manual' | 'contracts' | 'claims'>('electronic');

  // Manual Prescription Form States
  const [manualFormPatientName, setManualFormPatientName] = useState('كاترينا بوهدان');
  const [manualFormDoctorName, setManualFormDoctorName] = useState('د. رومان ميكولا');
  const [manualFormDate, setManualFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualFormFileBase64, setManualFormFileBase64] = useState('');
  const [manualFormNotes, setManualFormNotes] = useState('تم التحقق الصيدلاني وأرشفة الوثيقة في قاعدة البيانات المحلية');
  const [manualFormMedicines, setManualFormMedicines] = useState<{ medicineName: string; quantity: number; dosage: string }[]>([
    { medicineName: 'Panadol Extra 500mg', quantity: 2, dosage: 'قرص كل 8 ساعات' }
  ]);

  // Insurance Contract Form States
  const [isAddingContract, setIsAddingContract] = useState(false);
  const [contractForm, setContractForm] = useState({
    name: '',
    discountRate: 80,
    contactPerson: 'ياروسلاف بوهدان',
    phone: '+380671234567',
    notes: 'تعاقد ساري ومنسق محاسبياً ونسب تحصيل آلية للمشتريات والمبيعات'
  });

  // Local state for Supplier Purchase Bills
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    supplierName: 'مستودع ياروسلاف للأدوية',
    date: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    paymentType: 'cash' as 'cash' | 'credit',
    items: [] as { medId: number; name: string; quantity: number; costPrice: number; discountPercent?: number; bonusQty?: number; batchNumber?: string; expiryDate?: string }[],
    total: 0
  });

  // Supplier Returns States
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnForm, setReturnForm] = useState({
    supplierName: 'شركة أندري الطبية',
    date: new Date().toISOString().split('T')[0],
    items: [] as { medId: number; name: string; quantity: number; refundPrice: number }[],
    status: 'خصم من مديونية المورد (ذمم دائنة)'
  });

  // Customer Returns States
  const [isCustomerReturnModalOpen, setIsCustomerReturnModalOpen] = useState(false);
  const [customerReturnForm, setCustomerReturnForm] = useState({
    customerName: 'زبون نقدي',
    selectedSaleId: '' as string | number,
    saleInvoiceQuery: '',
    date: new Date().toISOString().split('T')[0],
    items: [] as { medId: number; name: string; quantity: number; refundPrice: number; originalBatchId?: number; batchNumber: string; expiryDate: string }[],
    barcodeToVerify: '',
    expiryToVerify: '',
    verificationStatus: 'idle' as 'idle' | 'verified' | 'failed',
    status: 'مقبول ومكتمل'
  });
  const [returnSearchQuery, setReturnSearchQuery] = useState('');

  // Sync tab status with props change
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Seeder for initial data if DB is empty
  useEffect(() => {
    const seedPharmacyData = async () => {
      const medCount = await db.pharmacyMedicines.count();
      if (medCount === 0) {
        // High quality offline medicine database with Ukrainian managers and Christian contexts
        await db.pharmacyMedicines.bulkAdd([
          {
            name: "أموكسيسيلين 500 ملغ",
            code: "622100230114",
            category: "مضاد حيوي",
            activeIngredient: "Amoxicillin",
            stock: 40,
            expiryDate: "2026-04-10", // Earliest expiry (FIFO Test Lot 1)
            shelfLocation: "أ-٣ (A3)",
            price: 75,
            costPrice: 45,
            minStock: 20,
            batchNumber: "B2026-AM1"
          },
          {
            name: "أموكسيسيلين 500 ملغ",
            code: "622100230115",
            category: "مضاد حيوي",
            activeIngredient: "Amoxicillin",
            stock: 80,
            expiryDate: "2027-08-15", // Later expiry (FIFO Test Lot 2)
            shelfLocation: "أ-٣ (A3)",
            price: 75,
            costPrice: 45,
            minStock: 20,
            batchNumber: "B2027-AM2"
          },
          {
            name: "إيبوبروفين 400 ملغ (مسكن)",
            code: "622100235891",
            category: "مسكنات آلام",
            activeIngredient: "Ibuprofen",
            stock: 250,
            expiryDate: "2026-12-01",
            shelfLocation: "ب-٢ (B2)",
            price: 45,
            costPrice: 25,
            minStock: 30,
            batchNumber: "B2026-IB9"
          },
          {
            name: "باراسيتامول 500 ملغ",
            code: "622100249002",
            category: "مسكنات آلام",
            activeIngredient: "Paracetamol",
            stock: 15, // Low stock triggers warning
            expiryDate: "2026-05-10", // Expiring soon
            shelfLocation: "ب-١ (B1)",
            price: 30,
            costPrice: 18,
            minStock: 40,
            batchNumber: "B2026-PA2"
          },
          {
            name: "فيتامين سي بلس 1000 ملغ",
            code: "622100290111",
            category: "فيتامينات ومكملات",
            activeIngredient: "Vitamin C",
            stock: 90,
            expiryDate: "2026-07-20",
            shelfLocation: "ج-٤ (C4)",
            price: 120,
            costPrice: 75,
            minStock: 15,
            batchNumber: "B2026-VC4"
          },
          {
            name: "ترامادول هيدروكلوريد 50 ملغ (مراقب جدول)",
            code: "622100889211",
            category: "مسكنات آلام",
            activeIngredient: "Tramadol",
            stock: 45,
            expiryDate: "2027-02-15",
            shelfLocation: "دولاب الجدول المغلق (C1)",
            price: 110,
            costPrice: 70,
            minStock: 10,
            batchNumber: "B2027-TR1",
            isControlled: true
          },
          {
            name: "ديازيبام 5 ملغ (مهدئ ومراقب جدول)",
            code: "622100990311",
            category: "مسكنات آلام",
            activeIngredient: "Diazepam",
            stock: 30,
            expiryDate: "2026-08-30",
            shelfLocation: "دولاب الجدول المغلق (C1)",
            price: 85,
            costPrice: 50,
            minStock: 8,
            batchNumber: "B2026-DZ3",
            isControlled: true
          },
          {
            name: "أوميبرازول 20 ملغ (معدة)",
            code: "622100277334",
            category: "جهاز هضمي",
            activeIngredient: "Omeprazole",
            stock: 80,
            expiryDate: "2026-04-12", // Low expiry
            shelfLocation: "د-١ (D1)",
            price: 95,
            costPrice: 60,
            minStock: 15,
            batchNumber: "B2026-OM9"
          }
         ]);
 
        // Seed associated batches and units for seeded medicines
        const allMeds = await db.pharmacyMedicines.toArray();
        for (const med of allMeds) {
          await db.pharmacyProductUnits.bulkAdd([
            { productId: med.id, unitName: 'علبة', conversionFactor: 1, price: med.price },
            { productId: med.id, unitName: 'شريط', conversionFactor: med.packHasStrips || 3, price: med.pricePerStrip || Math.round(med.price / (med.packHasStrips || 3)) },
            { productId: med.id, unitName: 'قرص', conversionFactor: (med.packHasStrips || 3) * (med.stripHasPills || 10), price: med.pricePerPill || Math.round(med.price / ((med.packHasStrips || 3) * (med.stripHasPills || 10))) }
          ]);

          const packMultiplier = (med.packHasStrips || 3) * (med.stripHasPills || 10);
          await db.pharmacyBatches.add({
            productId: med.id,
            batchNumber: med.batchNumber || 'B-SEED-01',
            expiryDate: med.expiryDate || '2027-12-31',
            quantityAtomic: med.hasRetailFractioning ? (med.stockPills || Math.round(med.stock * packMultiplier)) : med.stock,
            purchaseCost: med.costPrice || Math.round(med.price * 0.6)
          });
        }
         // Mock prescriptions created by Clinic Doctor "أولغا شفتشينكو" (Olga Shevchenko) for "تاراس بوهدان"
        await db.pharmacyPrescriptions.bulkAdd([
          {
            patientName: "تاراس بوهدان", // Ukrainian Christian name
            doctorName: "د. أولغا شفتشينكو", // Clinic reference
            date: "2026-06-15",
            status: "معلقة",
            medicines: [
              { medicineName: "أموكسيسيلين 500 ملغ", dosage: "كبسولة كل ٨ ساعات لمدة ٧ أيام", quantity: 2 },
              { medicineName: "إيبوبروفين 400 ملغ (مسكن)", dosage: "قرص عند اللزوم بعد الأكل", quantity: 1 }
            ]
          },
          {
            patientName: "سفيتلانا بيلوس", // Ukrainian Christian name
            doctorName: "د. كاترينا ميلنيك",
            date: "2026-06-16",
            status: "تم الصرف",
            medicines: [
              { medicineName: "باراسيتامول 500 ملغ", dosage: "قرص كل ٦ ساعات", quantity: 1 }
            ]
          }
        ]);

        // Mock purchase ledger
        await db.pharmacyPurchases.add({
          supplierName: "مجموعة كوفال للأدوية", // Koval Pharma
          date: "2026-06-10",
          total: 2400,
          status: "مستلم"
        });

        // Initialize general ledger accounts if they don't exist
        const accountsCount = await db.accounts.count();
        if (accountsCount === 0) {
          await db.accounts.bulkAdd([
            { id: 1, code: "1010", name: "صندوق الخزينة الرئيسي", type: "asset" },
            { id: 2, code: "1200", name: "مخزون الأدوية والمستلزمات", type: "asset" },
            { id: 3, code: "4010", name: "إيرادات مبيعات الصيدلية", type: "revenue" },
            { id: 4, code: "5020", name: "تكلفة البضاعة الطبية المباعة (COGS)", type: "expense" },
            { id: 5, code: "5050", name: "مصروف تالف أدوية منتهية", type: "expense" }
          ]);
        }
      }
    };
    seedPharmacyData();
  }, [medicines]);

  // Metrics computations
  const totalSalesVal = useMemo(() => {
    return sales.reduce((sum, s) => sum + (s.total || 0), 0);
  }, [sales]);

  const lowStockCount = useMemo(() => {
    return medicines.filter(m => (m.stock || 0) <= (m.minStock || 10)).length;
  }, [medicines]);

  const expiredCount = useMemo(() => {
    const today = new Date();
    return medicines.filter(m => {
      if (!m.expiryDate) return false;
      return new Date(m.expiryDate) <= today;
    }).length;
  }, [medicines]);

  const expiringSoonCount = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return medicines.filter(m => {
      if (!m.expiryDate) return false;
      const exp = new Date(m.expiryDate);
      return exp > today && exp <= thirtyDaysFromNow;
    }).length;
  }, [medicines]);

  const getMedStockDetails = (med: any) => {
    if (!med.hasRetailFractioning) {
      return {
        packs: Math.floor(med.stock),
        strips: 0,
        pills: 0,
        totalPills: med.stock,
        displayText: `${med.stock} علبة`
      };
    }

    const packMultiplier = (med.packHasStrips || 3) * (med.stripHasPills || 10);
    const totalPills = med.stockPills !== undefined ? med.stockPills : Math.round((med.stock || 0) * packMultiplier);
    
    const stripsPerPack = med.packHasStrips || 3;
    const pillsPerStrip = med.stripHasPills || 10;
    
    const packs = Math.floor(totalPills / packMultiplier);
    const remainingPillsAfterPacks = totalPills % packMultiplier;
    const strips = Math.floor(remainingPillsAfterPacks / pillsPerStrip);
    const pills = remainingPillsAfterPacks % pillsPerStrip;
    
    let parts = [];
    if (packs > 0) parts.push(`${packs} علبة`);
    if (strips > 0) parts.push(`${strips} شريط`);
    if (pills > 0) parts.push(`${pills} حبة`);
    
    return {
      packs,
      strips,
      pills,
      totalPills,
      displayText: parts.length > 0 ? parts.join(' و ') : 'نفد تماماً'
    };
  };

  // Categories list
  const categoriesList = ['الكل', 'مضاد حيوي', 'مسكنات آلام', 'فيتامينات ومكملات', 'جهاز هضمي', 'شاش ومستلزمات'];

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return medicines.filter(m => {
      const q = searchQuery.toLowerCase();
      const matchSearch = String(m.name).toLowerCase().includes(q) || 
                          String(m.activeIngredient).toLowerCase().includes(q) ||
                          String(m.code).toLowerCase().includes(q) ||
                          (m.stripBarcode && String(m.stripBarcode).toLowerCase().includes(q));
      const matchCat = selectedCategory === 'الكل' || m.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [medicines, searchQuery, selectedCategory]);

  // Handle Save Medicine Form
  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medForm.name || !medForm.price || !medForm.expiryDate) {
      error('برجاء تعبئة الحقول الأساسية: الاسم، السعر، وصلاحية الدواء');
      return;
    }
    
    const packMultiplier = (Number(medForm.packHasStrips) || 3) * (Number(medForm.stripHasPills) || 10);
    const calculatedPills = medForm.hasRetailFractioning 
      ? Math.round(Number(medForm.stock || 0) * packMultiplier)
      : Math.round(Number(medForm.stock || 0) * packMultiplier); // always sync stockPills with the default factor

    try {
      let targetId: number;
      if (medForm.id) {
        // Edit
        targetId = medForm.id;
        await db.pharmacyMedicines.update(medForm.id, {
          name: medForm.name,
          code: medForm.code,
          category: medForm.category,
          activeIngredient: medForm.activeIngredient,
          stock: Number(medForm.stock),
          expiryDate: medForm.expiryDate,
          shelfLocation: medForm.shelfLocation,
          price: Number(medForm.price),
          costPrice: Number(medForm.costPrice || medForm.price * 0.6),
          minStock: Number(medForm.minStock),
          hasRetailFractioning: !!medForm.hasRetailFractioning,
          packHasStrips: Number(medForm.packHasStrips || 3),
          stripHasPills: Number(medForm.stripHasPills || 10),
          pricePerStrip: Number(medForm.pricePerStrip || 0),
          pricePerPill: Number(medForm.pricePerPill || 0),
          stripBarcode: medForm.stripBarcode || '',
          stockPills: calculatedPills,
          isControlled: !!medForm.isControlled,
          batchNumber: medForm.batchNumber || '',
          supplierName: medForm.supplierName || 'مستودع ياروسلاف للأدوية'
        });
        success('تم تحديث الدواء بنجاح');
      } else {
        // Create new
        const exists = medicines.some(m => m.code === medForm.code && medForm.code !== '');
        if (exists) {
          warning('تحذير: رمز الباركود هذا مسجّل لدواء آخر بالفعل!');
        }
        targetId = await db.pharmacyMedicines.add({
          name: medForm.name,
          code: medForm.code || `PHA-${Date.now().toString().slice(-6)}`,
          category: medForm.category,
          activeIngredient: medForm.activeIngredient,
          stock: Number(medForm.stock || 0),
          expiryDate: medForm.expiryDate,
          shelfLocation: medForm.shelfLocation,
          price: Number(medForm.price),
          costPrice: Number(medForm.costPrice || medForm.price * 0.6),
          minStock: Number(medForm.minStock || 10),
          hasRetailFractioning: !!medForm.hasRetailFractioning,
          packHasStrips: Number(medForm.packHasStrips || 3),
          stripHasPills: Number(medForm.stripHasPills || 10),
          pricePerStrip: Number(medForm.pricePerStrip || 0),
          pricePerPill: Number(medForm.pricePerPill || 0),
          stripBarcode: medForm.stripBarcode || '',
          stockPills: calculatedPills,
          isControlled: !!medForm.isControlled,
          batchNumber: medForm.batchNumber || '',
          supplierName: medForm.supplierName || 'مستودع ياروسلاف للأدوية'
        });
        success('تم إضافة الدواء بنجاح');
      }

      // Synchronize product_units schema
      await db.pharmacyProductUnits.where('productId').equals(targetId).delete();
      await db.pharmacyProductUnits.bulkAdd([
        { productId: targetId, unitName: 'علبة', conversionFactor: 1, price: Number(medForm.price) },
        { productId: targetId, unitName: 'شريط', conversionFactor: Number(medForm.packHasStrips || 3), price: Number(medForm.pricePerStrip || 0) },
        { productId: targetId, unitName: 'قرص', conversionFactor: Number(medForm.packHasStrips || 3) * Number(medForm.stripHasPills || 10), price: Number(medForm.pricePerPill || 0) }
      ]);

      // Synchronize product_batches schema
      const bNo = medForm.batchNumber || 'B-NEW-01';
      const existingBatch = await db.pharmacyBatches.where({ productId: targetId, batchNumber: bNo }).first();
      if (existingBatch) {
        await db.pharmacyBatches.update(existingBatch.id!, {
          expiryDate: medForm.expiryDate,
          quantityAtomic: calculatedPills,
          purchaseCost: Number(medForm.costPrice || medForm.price * 0.6)
        });
      } else {
        await db.pharmacyBatches.add({
          productId: targetId,
          batchNumber: bNo,
          expiryDate: medForm.expiryDate,
          quantityAtomic: calculatedPills,
          purchaseCost: Number(medForm.costPrice || medForm.price * 0.6)
        });
      }

      setIsMedModalOpen(false);
      setMedForm({ 
        id: undefined, 
        name: '', 
        code: '', 
        category: 'مضاد حيوي', 
        activeIngredient: '', 
        stock: 0, 
        expiryDate: '', 
        shelfLocation: '', 
        price: 0, 
        costPrice: 0, 
        minStock: 10,
        hasRetailFractioning: false,
        packHasStrips: 3,
        stripHasPills: 10,
        pricePerStrip: 0,
        pricePerPill: 0,
        stripBarcode: '',
        isControlled: false,
        batchNumber: '',
        supplierName: 'مستودع ياروسلاف للأدوية'
      });
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء حفظ الملف الطبي للدواء');
    }
  };

  const openEditMedicine = (med: any) => {
    setMedForm({
      id: med.id,
      name: med.name,
      code: med.code,
      category: med.category,
      activeIngredient: med.activeIngredient,
      stock: med.stock,
      expiryDate: med.expiryDate,
      shelfLocation: med.shelfLocation,
      price: med.price,
      costPrice: med.costPrice,
      minStock: med.minStock || 10,
      hasRetailFractioning: !!med.hasRetailFractioning,
      packHasStrips: med.packHasStrips || 3,
      stripHasPills: med.stripHasPills || 10,
      pricePerStrip: med.pricePerStrip || 0,
      pricePerPill: med.pricePerPill || 0,
      stripBarcode: med.stripBarcode || '',
      isControlled: !!med.isControlled,
      batchNumber: med.batchNumber || '',
      supplierName: med.supplierName || 'مستودع ياروسلاف للأدوية'
    });
    setIsMedModalOpen(true);
  };

  const triggerDelete = (id: number, type: 'medicine' | 'prescription' | 'purchase' | 'return') => {
    setConfirmDeleteId(id);
    setConfirmDeleteType(type);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId || !confirmDeleteType) return;
    try {
      if (confirmDeleteType === 'medicine') {
        await db.pharmacyMedicines.delete(confirmDeleteId);
        success('تم حذف الدواء من السجل الطبي بالكامل');
      } else if (confirmDeleteType === 'prescription') {
        await db.pharmacyPrescriptions.delete(confirmDeleteId);
        success('تم إزالة الروشتة بنجاح');
      } else if (confirmDeleteType === 'purchase') {
        await db.pharmacyPurchases.delete(confirmDeleteId);
        success('تم إلغاء فاتورة المشتريات بنجاح');
      } else if (confirmDeleteType === 'return') {
        await db.pharmacyReturns.delete(confirmDeleteId);
        success('تم إلغاء قيد المرتجع بنجاح');
      }
    } catch (err) {
      console.error(err);
      error('فشل في حذف هذا السجل');
    } finally {
      setConfirmDeleteId(null);
      setConfirmDeleteType(null);
    }
  };

  // POS CART LOGIC
  const addToCart = (med: any, unit: 'pack' | 'strip' | 'pill' = 'pack') => {
    const details = getMedStockDetails(med);
    if (details.totalPills <= 0) {
      warning(`الدواء ${med.name} نفد من المخزن تماماً! تم تفعيل البحث السريع عن بدائل متوفرة.`);
      setAlternativeMedSource(med);
      return;
    }
    const today = new Date();
    if (new Date(med.expiryDate) <= today) {
      error(`🚫 تنبيه صرف: لا يمكن بيع ${med.name} لأنه منتهي الصلاحية!`);
      return;
    }

    setPosCart(prev => {
      const existingIndex = prev.findIndex(item => item.med.id === med.id);
      
      const packMultiplier = (med.packHasStrips || 3) * (med.stripHasPills || 10);
      const pillsPerStrip = med.stripHasPills || 10;
      
      let currentCartPillsForMed = 0;
      prev.forEach(item => {
        if (item.med.id === med.id) {
          const mMult = item.med.hasRetailFractioning 
            ? (item.selectedUnit === 'pack' ? packMultiplier : item.selectedUnit === 'strip' ? pillsPerStrip : 1)
            : packMultiplier;
          currentCartPillsForMed += item.quantity * mMult;
        }
      });

      const additionPills = med.hasRetailFractioning 
        ? (unit === 'pack' ? packMultiplier : unit === 'strip' ? pillsPerStrip : 1)
        : packMultiplier;

      if (currentCartPillsForMed + additionPills > details.totalPills) {
        warning(`لا توجد كمية كافية في الرف لهذا الدواء. المتبقي الإجمالي: ${details.displayText}`);
        return prev;
      }

      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        // If unit matches, just increment quantity
        if (existing.selectedUnit === unit) {
          return prev.map((item, idx) => idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item);
        } else {
          // If different unit, let's allow co-existence or overwrite unit or update unit
          // Let's allow different units to co-exist in cart, so key on ID + UNIT!
          // Actually, we can just edit the unit inline in the POS cart. It is much cleaner.
          // Let's add as another item in the cart or just change/add
        }
      }
      return [...prev, { med, quantity: 1, selectedUnit: unit }];
    });
    setActiveMedForDetails(med);
  };

  const updateCartQty = (medId: number, qty: number, unit?: 'pack' | 'strip' | 'pill') => {
    const med = medicines.find(m => m.id === medId);
    if (!med) return;
    
    const details = getMedStockDetails(med);
    const packMultiplier = (med.packHasStrips || 3) * (med.stripHasPills || 10);
    const pillsPerStrip = med.stripHasPills || 10;
    
    if (qty <= 0) {
      setPosCart(prev => prev.filter(item => !(item.med.id === medId && (unit ? item.selectedUnit === unit : true))));
      return;
    }

    setPosCart(prev => {
      return prev.map(item => {
        if (item.med.id !== medId) return item;
        
        const activeUnit = unit || item.selectedUnit || 'pack';
        const mult = med.hasRetailFractioning 
          ? (activeUnit === 'pack' ? packMultiplier : activeUnit === 'strip' ? pillsPerStrip : 1)
          : packMultiplier;
        
        const requestedPills = qty * mult;
        if (requestedPills > details.totalPills) {
          warning(`الكمية المطلوبة تتجاوز المخزون الفعلي المتاح. كتل المخزون: ${details.displayText}`);
          const maxQty = med.hasRetailFractioning 
            ? (activeUnit === 'pack' 
              ? Math.floor(details.totalPills / packMultiplier) 
              : activeUnit === 'strip' 
                ? Math.floor(details.totalPills / pillsPerStrip) 
                : details.totalPills)
            : Math.floor(details.totalPills);
          return { ...item, quantity: Math.max(1, maxQty), selectedUnit: activeUnit };
        }
        
        return { ...item, quantity: qty, selectedUnit: activeUnit };
      });
    });
  };

  const removeFromCart = (medId: number) => {
    setPosCart(prev => prev.filter(item => item.med.id !== medId));
  };

  // Calc POS total with retail fractioning pricing rules
  const posCartTotal = useMemo(() => {
    const subtotal = posCart.reduce((sum, item) => {
      const med = item.med;
      const unit = item.selectedUnit || 'pack';
      let itemPrice = med.price; // pack price
      if (med.hasRetailFractioning) {
        if (unit === 'strip') {
          itemPrice = med.pricePerStrip || Math.round(med.price / (med.packHasStrips || 3));
        } else if (unit === 'pill') {
          itemPrice = med.pricePerPill || Math.round(med.price / ((med.packHasStrips || 3) * (med.stripHasPills || 10)));
        }
      }
      return sum + (itemPrice * item.quantity);
    }, 0);
    return Math.max(0, subtotal - posDiscount);
  }, [posCart, posDiscount]);

  // Execute POS Checkout (Global Financial Ledger Entry Posting)
  const handlePOSCheckout = async (validatedControlledData?: any) => {
    if (posCart.length === 0) {
      error('سلة الصيدلية فارغة! الرجاء اختيار دواء أولاً');
      return;
    }

    const hasControlled = posCart.some(i => i.med.isControlled);
    if (hasControlled && !validatedControlledData) {
      // Trigger prompt for patient logs
      setControlledForm({
        patientName: selectedPrescription ? selectedPrescription.patientName : posCustomerName !== 'زبون نقدي' ? posCustomerName : 'أولغا كوفالينكو',
        doctorName: selectedPrescription ? selectedPrescription.doctorName : 'د. ميكولا كوزلوف',
        patientNationalID: 'UA-89047124',
        prescriptionFileBase64: '',
        prescriptionNumber: `RX-TAB-${Math.floor(100000 + Math.random() * 900000)}`,
        notes: 'تم فحص الختم الدائري وتأكيد الهوية الشخصية للمستهلك'
      });
      setIsControlledFormOpen(true);
      return;
    }

    try {
      // Calculate Co-payment variables
      const insuranceCompanyObj = isInsuranceEnabled && selectedInsuranceCompanyId 
        ? insuranceCompanies.find(c => c.id === Number(selectedInsuranceCompanyId))
        : null;
      const insuranceCompanyName = insuranceCompanyObj ? (insuranceCompanyObj.name || insuranceCompanyObj.companyName) : '';
      const finalPatientShareAmt = isInsuranceEnabled 
        ? Number((posCartTotal * (patientSharePercent / 100)).toFixed(2)) 
        : posCartTotal;
      const finalInsuranceShareAmt = isInsuranceEnabled 
        ? Number((posCartTotal * (insuranceSharePercent / 100)).toFixed(2)) 
        : 0;

      // 1. Post to IndexedDB Sales table
      const saleId = await db.pharmacySales.add({
        customerName: posCustomerName,
        date: new Date().toISOString().split('T')[0],
        total: posCartTotal,
        paymentMethod: posPaymentMethod,
        controlledRegistryInfo: validatedControlledData || null,
        prescriptionFileBase64: posPrescriptionFile || (validatedControlledData ? validatedControlledData.prescriptionFileBase64 : ''),
        // Insurance Meta
        isInsuranceSale: isInsuranceEnabled,
        insuranceId: insuranceCompanyObj ? insuranceCompanyObj.id : null,
        insuranceName: insuranceCompanyName,
        patientSharePercent: isInsuranceEnabled ? patientSharePercent : 100,
        insuranceSharePercent: isInsuranceEnabled ? insuranceSharePercent : 0,
        patientShareAmount: finalPatientShareAmt,
        insuranceShareAmount: finalInsuranceShareAmt,
        items: posCart.map(i => {
          const unit = i.selectedUnit || 'pack';
          let itemPrice = i.med.price;
          if (i.med.hasRetailFractioning) {
            if (unit === 'strip') {
              itemPrice = i.med.pricePerStrip || Math.round(i.med.price / (i.med.packHasStrips || 3));
            } else if (unit === 'pill') {
              itemPrice = i.med.pricePerPill || Math.round(i.med.price / ((i.med.packHasStrips || 3) * (i.med.stripHasPills || 10)));
            }
          }
          let unitLabel = 'علبة';
          if (unit === 'strip') unitLabel = 'شريط';
          else if (unit === 'pill') unitLabel = 'حبة/قرص';
          
          return { 
            medicineId: i.med.id, 
            name: `${i.med.name} (${unitLabel})`, 
            quantity: i.quantity, 
            price: itemPrice,
            selectedUnit: unit
          };
        }),
        status: 'مكتمل'
      });

      // 2. Adjust inventories physical stocks using automatic FIFO
      for (const item of posCart) {
        const itemName = item.med.name;
        const unit = item.selectedUnit || 'pack';
        const packMultiplier = (item.med.packHasStrips || 3) * (item.med.stripHasPills || 10);
        const pillsPerStrip = item.med.stripHasPills || 10;
        
        let pillsToDeduct = item.quantity;
        if (item.med.hasRetailFractioning) {
          if (unit === 'pack') pillsToDeduct = item.quantity * packMultiplier;
          else if (unit === 'strip') pillsToDeduct = item.quantity * pillsPerStrip;
        } else {
          pillsToDeduct = item.quantity * (item.med.hasRetailFractioning ? packMultiplier : 1);
        }

        const productBatches = await db.pharmacyBatches.where('productId').equals(item.med.id).toArray();
        const sortedBatches = productBatches.sort((a, b) => {
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        });

        let remainingToDeduct = pillsToDeduct;

        for (const batch of sortedBatches) {
          if (remainingToDeduct <= 0) break;
          if (batch.quantityAtomic <= 0) continue;

          const deductFromThisBatch = Math.min(batch.quantityAtomic, remainingToDeduct);
          const updatedQtyAtomic = batch.quantityAtomic - deductFromThisBatch;

          await db.pharmacyBatches.update(batch.id!, {
            quantityAtomic: updatedQtyAtomic
          });

          remainingToDeduct -= deductFromThisBatch;
        }

        const med = await db.pharmacyMedicines.get(item.med.id);
        if (med) {
          const packMultiplier = med.hasRetailFractioning ? ((med.packHasStrips || 3) * (med.stripHasPills || 10)) : 1;
          const currentStockPills = med.stockPills !== undefined ? med.stockPills : Math.round(med.stock * packMultiplier);
          const newStockPills = Math.max(0, currentStockPills - pillsToDeduct);
          const newStock = med.hasRetailFractioning 
            ? Number((newStockPills / packMultiplier).toFixed(2))
            : Math.max(0, Number((med.stock - (pillsToDeduct / packMultiplier)).toFixed(2)));

          await db.pharmacyMedicines.update(item.med.id, {
            stockPills: newStockPills,
            stock: newStock
          });
        }
      }

      // 3. Post automatic journal entry using central AccountingEngine
      const cashAccount = await db.accounts.where('code').equals('1010').first() || { id: 1, name: 'صندوق الخزينة الرئيسي' };
      const revenueAccount = await db.accounts.where('code').equals('4010').first() || { id: 3, name: 'إيرادات مبيعات الصيدلية' };
      const inventoryAccount = await db.accounts.where('code').equals('1200').first() || { id: 2, name: 'مخزون الأدوية والمستلزمات' };
      const cogsAccount = await db.accounts.where('code').equals('5020').first() || { id: 4, name: 'تكلفة البضاعة الطبية المباعة (COGS)' };
      const insuranceReceivableAccount = await db.accounts.where('code').equals('1110').first() 
        || await db.accounts.where('code').equals('1100').first() 
        || { id: 7, name: 'ذمم تأمينات طبية مستحقة للصيدلية' };

      const totalCostAmt = posCart.reduce((sum, i) => {
        const costPack = i.med.costPrice || i.med.price * 0.6;
        let costUnit = costPack;
        if (i.med.hasRetailFractioning) {
          const packMultiplier = (i.med.packHasStrips || 3) * (i.med.stripHasPills || 10);
          if (i.selectedUnit === 'strip') {
            costUnit = (costPack / (i.med.packHasStrips || 3));
          } else if (i.selectedUnit === 'pill') {
            costUnit = (costPack / packMultiplier);
          }
        }
        return sum + (costUnit * i.quantity);
      }, 0);

      // Create Ledger Lines with Co-payment splits if applicable
      const voucherLines = [];

      if (isInsuranceEnabled && finalInsuranceShareAmt > 0) {
        // Patient co-payment cash/bank transfer
        voucherLines.push({
          accountId: cashAccount.id!,
          accountName: cashAccount.name,
          debit: finalPatientShareAmt,
          credit: 0,
          description: `نسبة تحمل المريض (${patientSharePercent}%) - مبيعات صيدلية لـ ${posCustomerName} فاتورة #${saleId}`
        });

        // Insurance share account receivable
        voucherLines.push({
          accountId: insuranceReceivableAccount.id || 7,
          accountName: `${insuranceReceivableAccount.name} (${insuranceCompanyName})`,
          debit: finalInsuranceShareAmt,
          credit: 0,
          description: `نسبة تحمل شركة التأمين (${insuranceSharePercent}%) - ${insuranceCompanyName} فاتورة #${saleId}`
        });
      } else {
        // Normal full receipt payment
        voucherLines.push({
          accountId: cashAccount.id!,
          accountName: cashAccount.name,
          debit: posCartTotal,
          credit: 0,
          description: `مبيعات نقود صيدلية للعميل ${posCustomerName} فاتورة #${saleId}`
        });
      }

      // Sales revenue credit
      voucherLines.push({
        accountId: revenueAccount.id!,
        accountName: revenueAccount.name,
        debit: 0,
        credit: posCartTotal,
        description: `إثبات إيراد مبيعات طبية فاتورة #${saleId}`
      });

      if (totalCostAmt > 0) {
        voucherLines.push({
          accountId: cogsAccount.id!,
          accountName: cogsAccount.name,
          debit: Number(totalCostAmt.toFixed(2)),
          credit: 0,
          description: `تكلفة البضاعة الطبية المنصرفة للفاتورة #${saleId}`
        });
        voucherLines.push({
          accountId: inventoryAccount.id!,
          accountName: inventoryAccount.name,
          debit: 0,
          credit: Number(totalCostAmt.toFixed(2)),
          description: `تخفيض قيمة مخزون الصيدلية بمقدار التكلفة المنصرفة`
        });
      }

      // Post central entry
      await AccountingEngine.postEntry({
        date: new Date(),
        reference: `PHA-SAL-${saleId}`,
        description: isInsuranceEnabled 
          ? `قيد مبيعات تأمين طبي تلقائي - مريض: ${posCustomerName}، شركة: ${insuranceCompanyName}`
          : `قيد محاسبي تلقائي - مبيعات صيدلية لـ: ${posCustomerName}`,
        lines: voucherLines,
        createdBy: "1"
      });

      // 4. Mark associated prescription as fulfilled if applicable
      if (selectedPrescription) {
        await db.pharmacyPrescriptions.update(selectedPrescription.id, { status: 'تم الصرف' });
        setSelectedPrescription(null);
      }

      // Open receipt layout in memory
      setReceiptToPrint({
        id: saleId,
        customerName: posCustomerName,
        date: new Date().toLocaleString('ar-EG'),
        isInsuranceSale: isInsuranceEnabled,
        insuranceName: insuranceCompanyName,
        patientSharePercent: isInsuranceEnabled ? patientSharePercent : 100,
        insuranceSharePercent: isInsuranceEnabled ? insuranceSharePercent : 0,
        patientShareAmount: finalPatientShareAmt,
        insuranceShareAmount: finalInsuranceShareAmt,
        items: posCart.map(i => {
          const unit = i.selectedUnit || 'pack';
          let itemPrice = i.med.price;
          if (i.med.hasRetailFractioning) {
            if (unit === 'strip') {
              itemPrice = i.med.pricePerStrip || Math.round(i.med.price / (i.med.packHasStrips || 3));
            } else if (unit === 'pill') {
              itemPrice = i.med.pricePerPill || Math.round(i.med.price / ((i.med.packHasStrips || 3) * (i.med.stripHasPills || 10)));
            }
          }
          let unitLabel = 'علبة';
          if (unit === 'strip') unitLabel = 'شريط';
          else if (unit === 'pill') unitLabel = 'حبة/قرص';
          return {
            med: { ...i.med, name: `${i.med.name} (${unitLabel})`, price: itemPrice },
            quantity: i.quantity
          };
        }),
        discount: posDiscount,
        total: posCartTotal,
        paymentMethod: posPaymentMethod
      });

      success('🎉 تمت عملية البيع بنجاح وترحيل القيد المحاسبي وحفظ الفاتورة!');
      setPosCart([]);
      setPosDiscount(0);
      setPosCustomerName('زبون نقدي');
      setIsInsuranceEnabled(false);
      setSelectedInsuranceCompanyId('');
      setPosPrescriptionFile('');
    } catch (err) {
      console.error(err);
      error(`فشل صرف الفاتورة محاسبياً: ${(err as Error).message}`);
    }
  };

  // Dispense e-prescription immediately into POS cart
  const dispensePrescription = (presc: any) => {
    setSelectedPrescription(presc);
    setPosCustomerName(presc.patientName);
    
    const matchedItems: { med: any; quantity: number; selectedUnit: "pack" | "strip" | "pill" }[] = [];
    let someMissing = false;

    presc.medicines.forEach((pm: any) => {
      const dbMed = medicines.find(m => m.name === pm.medicineName);
      if (dbMed) {
        matchedItems.push({
          med: dbMed,
          quantity: pm.quantity || 1,
          selectedUnit: 'pack'
        });
      } else {
        someMissing = true;
      }
    });

    if (someMissing) {
      warning('تنبيه: بعض الأدوية المكتوبة بالروشتة الطبية غير مسجلة بدليل المخزن، تم دمج المتاح فقط');
    }

    setPosCart(matchedItems);
    setActiveTab('pos');
    success(`تم تحميل روشتة المريض ${presc.patientName} بنجاح إلى شاشة الكاشير`);
  };

  // Supplier Purchase Stock Inflow Transaction with discounts & bonus support
  const handleAddPurchaseItem = (medId: number) => {
    const med = medicines.find(m => m.id === medId);
    if (!med) return;
    setPurchaseForm(prev => {
      const exists = prev.items.find(i => i.medId === medId);
      if (exists) return prev;
      return {
        ...prev,
        items: [...prev.items, { 
          medId, 
          name: med.name, 
          quantity: 10, 
          costPrice: med.costPrice || med.price * 0.6,
          discountPercent: 0,
          bonusQty: 0,
          batchNumber: 'B' + Math.floor(1000 + Math.random() * 9000),
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0]
        }]
      };
    });
  };

  const updatePurchaseItemQty = (medId: number, field: string, val: any) => {
    setPurchaseForm(prev => ({
      ...prev,
      items: prev.items.map(i => i.medId === medId ? { ...i, [field]: val } : i)
    }));
  };

  const removePurchaseItem = (medId: number) => {
    setPurchaseForm(prev => ({
      ...prev,
      items: prev.items.filter(i => i.medId !== medId)
    }));
  };

  const submitPurchaseBill = async () => {
    if (purchaseForm.items.length === 0) {
      error('برجاء إضافة عقاقير أو مستلزمات طبية للفاتورة المشتريات أولاً!');
      return;
    }

    // Calculate effective total paid (taking commercial discounts on items into account)
    const calculatedTotal = purchaseForm.items.reduce((sum, item) => {
      const discount = item.discountPercent || 0;
      const effectiveItemCost = item.quantity * item.costPrice * (1 - discount / 100);
      return sum + effectiveItemCost;
    }, 0);

    try {
      // 1. Save Purchase
      const purchaseId = await db.pharmacyPurchases.add({
        supplierName: purchaseForm.supplierName,
        invoiceNumber: purchaseForm.invoiceNumber || `PUR-${Math.floor(10000 + Math.random() * 90000)}`,
        paymentType: purchaseForm.paymentType || 'cash',
        date: purchaseForm.date,
        total: Number(calculatedTotal.toFixed(2)),
        status: purchaseForm.paymentType === 'cash' ? 'مدفوع نقداً' : 'ذمم دائنة (آجل)',
        items: purchaseForm.items
      });

      // 2. Increase Stock & update accurate actual unit cost (COGS)
      for (const item of purchaseForm.items) {
        const med = medicines.find(m => m.id === item.medId);
        if (med) {
          const discount = item.discountPercent || 0;
          const bonus = item.bonusQty || 0;
          const itemCostPaid = item.quantity * item.costPrice * (1 - discount / 100);
          
          const totalUnitsReceived = item.quantity + bonus;
          // Actual unit cost per piece after discount & bonus items are accounted for
          const actualUnitCost = totalUnitsReceived > 0 
            ? Number((itemCostPaid / totalUnitsReceived).toFixed(2)) 
            : item.costPrice;

          const newStock = med.stock + totalUnitsReceived;
          const packMultiplier = med.hasRetailFractioning ? (Number(med.packHasStrips || 3) * Number(med.stripHasPills || 10)) : 1;
          const atomicQty = totalUnitsReceived * packMultiplier;

          // Save batch
          await db.pharmacyBatches.add({
            productId: item.medId,
            batchNumber: item.batchNumber || `B-PUR-${purchaseId}`,
            expiryDate: item.expiryDate || '2028-12-31',
            quantityAtomic: atomicQty,
            purchaseCost: actualUnitCost
          });

          await db.pharmacyMedicines.update(item.medId, { 
            stock: newStock, 
            costPrice: actualUnitCost,
            batchNumber: item.batchNumber || med.batchNumber,
            expiryDate: item.expiryDate || med.expiryDate,
            stockPills: (med.stockPills || 0) + atomicQty
          });
        }
      }

      // 3. Financial entry
      const cashAccount = await db.accounts.where('code').equals('1010').first() || { id: 1, name: 'صندوق الخزينة الرئيسي' };
      const inventoryAccount = await db.accounts.where('code').equals('1200').first() || { id: 2, name: 'مخزون الأدوية والمستلزمات' };
      const supplierAccount = await db.accounts.where('code').equals('2010').first() || { id: 20, name: 'ذمم دائنة (موردين)' };

      const creditAccount = purchaseForm.paymentType === 'cash' ? cashAccount : supplierAccount;

      await AccountingEngine.postEntry({
        date: new Date(purchaseForm.date),
        reference: `PHA-PUR-${purchaseId}`,
        description: `توريد أدوية ومستلزمات من المورد: ${purchaseForm.supplierName} (فاتورة رقم: ${purchaseForm.invoiceNumber || purchaseId}) - طريقة الدفع: ${purchaseForm.paymentType === 'cash' ? 'نقدي' : 'آجل'}`,
        lines: [
          // Debit Inventory (Asset up)
          { accountId: inventoryAccount.id!, accountName: inventoryAccount.name, debit: Number(calculatedTotal.toFixed(2)), credit: 0, description: `زيادة مخزون عقاقير وأدوية واردة فاتورة #${purchaseId} (صافي التكلفة الفعلية بعد الخصم والبونص)` },
          // Credit Cash / AP (Asset down / Liability up)
          { accountId: creditAccount.id!, accountName: creditAccount.name, debit: 0, credit: Number(calculatedTotal.toFixed(2)), description: purchaseForm.paymentType === 'cash' ? `مدفوع نقد من الصندوق للمورد ${purchaseForm.supplierName}` : `إثبات مستحقات (آجل) في ذمة المركز للمورد ${purchaseForm.supplierName}` }
        ],
        createdBy: "1"
      });

      success('🛒 تم حفظ فاتورة الشراء بنجاح، واحتساب تكلفة العلبة الفعلية بعد البونص والخصومات بدقة وتنزيلها بالدفاتر!');
      setIsPurchaseModalOpen(false);
      setPurchaseForm({ 
        supplierName: 'مستودع ياروسلاف للأدوية', 
        date: new Date().toISOString().split('T')[0], 
        invoiceNumber: '', 
        paymentType: 'cash', 
        items: [], 
        total: 0 
      });
    } catch (err) {
      console.error(err);
      error(`حدث خطأ أثناء حفظ التوريد: ${(err as Error).message}`);
    }
  };

  // Supplier Returns Helper Methods
  const handleAddReturnItem = (medId: number) => {
    const med = medicines.find(m => m.id === medId);
    if (!med) return;
    setReturnForm(prev => {
      const exists = prev.items.find(i => i.medId === medId);
      if (exists) return prev;
      return {
        ...prev,
        items: [...prev.items, { 
          medId, 
          name: med.name, 
          quantity: Math.min(5, med.stock), 
          refundPrice: med.costPrice || med.price * 0.6 
        }]
      };
    });
  };

  const updateReturnItemQty = (medId: number, field: string, val: any) => {
    setReturnForm(prev => ({
      ...prev,
      items: prev.items.map(i => i.medId === medId ? { ...i, [field]: val } : i)
    }));
  };

  const removeReturnItem = (medId: number) => {
    setReturnForm(prev => ({
      ...prev,
      items: prev.items.filter(i => i.medId !== medId)
    }));
  };

  const submitSupplierReturn = async () => {
    if (returnForm.items.length === 0) {
      error('برجاء إضافة عقاقير أو مستلزمات طبية لقائمة المرتجعات أولاً!');
      return;
    }

    // Verify stock availability
    for (const item of returnForm.items) {
      const med = medicines.find(m => m.id === item.medId);
      if (!med || med.stock < item.quantity) {
        error(`الكمية المرتجعة من ${item.name} تتجاوز الرصيد الحالي المتوفر (${med?.stock || 0})!`);
        return;
      }
    }

    const calculatedTotal = returnForm.items.reduce((sum, item) => sum + (item.quantity * item.refundPrice), 0);

    try {
      // 1. Save Return
      const returnId = await db.pharmacyReturns.add({
        supplierName: returnForm.supplierName,
        date: returnForm.date,
        total: Number(calculatedTotal.toFixed(2)),
        status: returnForm.status,
        items: returnForm.items
      });

      // 2. Decrease Stock
      for (const item of returnForm.items) {
        const med = medicines.find(m => m.id === item.medId);
        if (med) {
          const newStock = Math.max(0, med.stock - item.quantity);
          const packMultiplier = med.hasRetailFractioning ? (Number(med.packHasStrips || 3) * Number(med.stripHasPills || 10)) : 1;
          const pillsToDeduct = item.quantity * packMultiplier;

          // Deduct from detailed batches table
          const productBatches = await db.pharmacyBatches.where('productId').equals(item.medId).toArray();
          const sortedBatches = productBatches.sort((a, b) => {
            return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
          });

          let remainingToDeduct = pillsToDeduct;
          for (const batch of sortedBatches) {
            if (remainingToDeduct <= 0) break;
            if (batch.quantityAtomic <= 0) continue;

            const deduct = Math.min(batch.quantityAtomic, remainingToDeduct);
            await db.pharmacyBatches.update(batch.id!, {
              quantityAtomic: batch.quantityAtomic - deduct
            });
            remainingToDeduct -= deduct;
          }

          const newStockPills = Math.max(0, (med.stockPills || 0) - pillsToDeduct);

          await db.pharmacyMedicines.update(item.medId, { 
            stock: newStock,
            stockPills: newStockPills
          });
        }
      }

      // 3. Post Financial entry for Return
      const cashAccount = await db.accounts.where('code').equals('1010').first() || { id: 1, name: 'صندوق الخزينة الرئيسي' };
      const inventoryAccount = await db.accounts.where('code').equals('1200').first() || { id: 2, name: 'مخزون الأدوية والمستلزمات' };
      const supplierAccount = await db.accounts.where('code').equals('2010').first() || { id: 20, name: 'ذمم دائنة (موردين)' };

      const isCashRefund = returnForm.status.includes('نقدي') || returnForm.status.includes('الخزينة');
      const debitAccount = isCashRefund ? cashAccount : supplierAccount;

      await AccountingEngine.postEntry({
        date: new Date(returnForm.date),
        reference: `PHA-RET-${returnId}`,
        description: `إرجاع أدوية/مستلزمات منتهية أو قاربت انتهاء الصلاحية للمورد: ${returnForm.supplierName}`,
        lines: [
          // Debit Asset / Decrease Liability
          { 
            accountId: debitAccount.id!, 
            accountName: debitAccount.name, 
            debit: Number(calculatedTotal.toFixed(2)), 
            credit: 0, 
            description: isCashRefund 
              ? `استرداد نقدي بقيمة مرتجع أدوية من المورد ${returnForm.supplierName}` 
              : `تخفيض مديونية المورد ${returnForm.supplierName} بقيمة مرتجع أدوية` 
          },
          // Credit Inventory (Asset down)
          { 
            accountId: inventoryAccount.id!, 
            accountName: inventoryAccount.name, 
            debit: 0, 
            credit: Number(calculatedTotal.toFixed(2)), 
            description: `تخفيض المخزون بالأدوية المرتجعة للشركة الموردة فاتورة رقم #${returnId}` 
          }
        ],
        createdBy: "1"
      });

      success('⚖️ تم تسجيل قيد المرتجع بنجاح، تخفيض الأرصدة بالمستودع وتخفيض مديونية الشركة الموردة ماليًا!');
      setIsReturnModalOpen(false);
      setReturnForm({
        supplierName: 'شركة أندري الطبية',
        date: new Date().toISOString().split('T')[0],
        items: [],
        status: 'خصم من مديونية المورد (ذمم دائنة)'
      });
    } catch (err) {
      console.error(err);
      error(`حدث خطأ أثناء حفظ المرتجع: ${(err as Error).message}`);
    }
  };

  // Customer Returns Helper Methods
  const handleAddCustomerReturnItem = (medId: number, batchInfo?: { id: number; batchNumber: string; expiryDate: string; refundPrice?: number }) => {
    const med = medicines.find(m => m.id === medId);
    if (!med) return;
    setCustomerReturnForm(prev => {
      const exists = prev.items.find(i => i.medId === medId);
      if (exists) return prev;
      return {
        ...prev,
        items: [...prev.items, { 
          medId, 
          name: med.name, 
          quantity: 1, 
          refundPrice: batchInfo?.refundPrice || med.price,
          originalBatchId: batchInfo?.id,
          batchNumber: batchInfo?.batchNumber || med.batchNumber || 'B-NORMAL',
          expiryDate: batchInfo?.expiryDate || med.expiryDate || new Date().toISOString().split('T')[0]
        }]
      };
    });
  };

  const updateCustomerReturnItemQty = (medId: number, field: string, val: any) => {
    setCustomerReturnForm(prev => ({
      ...prev,
      items: prev.items.map(i => i.medId === medId ? { ...i, [field]: val } : i)
    }));
  };

  const removeCustomerReturnItem = (medId: number) => {
    setCustomerReturnForm(prev => ({
      ...prev,
      items: prev.items.filter(i => i.medId !== medId)
    }));
  };

  const submitCustomerReturn = async () => {
    if (customerReturnForm.items.length === 0) {
      error('برجاء إضافة عقاقير أو مستلزمات طبية لقائمة المرتجعات أولاً!');
      return;
    }

    const calculatedTotal = customerReturnForm.items.reduce((sum, item) => sum + (item.quantity * item.refundPrice), 0);

    try {
      // 1. Save Return in pharmacyReturns
      const returnId = await db.pharmacyReturns.add({
        supplierName: customerReturnForm.customerName, // fallback
        customerName: customerReturnForm.customerName,
        saleId: customerReturnForm.selectedSaleId ? Number(customerReturnForm.selectedSaleId) : null,
        type: 'customer',
        date: customerReturnForm.date,
        total: Number(calculatedTotal.toFixed(2)),
        status: 'مكتمل ومسترد',
        items: customerReturnForm.items
      } as any);

      // 2. Increase Stock & update bath atomic quantities
      for (const item of customerReturnForm.items) {
        const med = medicines.find(m => m.id === item.medId);
        if (med) {
          const packMultiplier = med.hasRetailFractioning ? (Number(med.packHasStrips || 3) * Number(med.stripHasPills || 10)) : 1;
          const pillsToBack = item.quantity * packMultiplier;

          // Find appropriate pharmacyBatch
          let batchId = item.originalBatchId;
          if (!batchId) {
            // Search if there is an existing batch with the same batch number and product
            const existing = await db.pharmacyBatches.where({ productId: item.medId, batchNumber: item.batchNumber }).first();
            if (existing) {
              batchId = existing.id;
            } else {
              // Create a batch if doesn't exist
              const newB = await db.pharmacyBatches.add({
                productId: item.medId,
                batchNumber: item.batchNumber,
                expiryDate: item.expiryDate,
                quantityAtomic: pillsToBack,
                purchaseCost: med.costPrice || med.price * 0.6
              });
              batchId = newB;
            }
          }

          if (batchId && batchId !== item.originalBatchId) {
            const batchObj = await db.pharmacyBatches.get(batchId);
            if (batchObj) {
              await db.pharmacyBatches.update(batchId, {
                quantityAtomic: batchObj.quantityAtomic + pillsToBack
              });
            }
          } else if (item.originalBatchId) {
            const batchObj = await db.pharmacyBatches.get(item.originalBatchId);
            if (batchObj) {
              await db.pharmacyBatches.update(item.originalBatchId, {
                quantityAtomic: batchObj.quantityAtomic + pillsToBack
              });
            }
          }

          const currentStockPills = med.stockPills !== undefined ? med.stockPills : Math.round(med.stock * packMultiplier);
          const newStockPills = currentStockPills + pillsToBack;
          const newStock = med.hasRetailFractioning 
            ? Number((newStockPills / packMultiplier).toFixed(2))
            : med.stock + item.quantity;

          await db.pharmacyMedicines.update(item.medId, { 
            stock: newStock,
            stockPills: newStockPills
          });
        }
      }

      // 3. Post central accounting financial journal entries
      const cashAccount = await db.accounts.where('code').equals('1010').first() || { id: 1, name: 'صندوق الخزينة الرئيسي' };
      const inventoryAccount = await db.accounts.where('code').equals('1200').first() || { id: 2, name: 'مخزون الأدوية والمستلزمات' };
      const salesAccount = await db.accounts.where('code').equals('4010').first() || { id: 3, name: 'إيرادات مبيعات الصيدلية' };
      const cogsAccount = await db.accounts.where('code').equals('5020').first() || { id: 4, name: 'تكلفة البضاعة الطبية المباعة (COGS)' };

      // Average cost estimate for physical reversal
      const totalEstimatedCogsVal = customerReturnForm.items.reduce((sum, item) => {
        const med = medicines.find(m => m.id === item.medId);
        const unitCost = med ? (med.costPrice || med.price * 0.6) : item.refundPrice * 0.6;
        return sum + (item.quantity * unitCost);
      }, 0);

      await AccountingEngine.postEntry({
        date: new Date(customerReturnForm.date),
        reference: `PHA-RET-CUST-${returnId}`,
        description: `تسجيل مرتجع مبيعات أدوية من العميل: ${customerReturnForm.customerName} - فاتورة رقم #${returnId}`,
        lines: [
          // Debit Sales Revenue (Reducing revenue)
          { 
            accountId: salesAccount.id!, 
            accountName: salesAccount.name, 
            debit: Number(calculatedTotal.toFixed(2)), 
            credit: 0, 
            description: `قيمة فاتورة مرتجع أدوية من المريض ${customerReturnForm.customerName}` 
          },
          // Credit Cash (Refunding money to patient/customer)
          { 
            accountId: cashAccount.id!, 
            accountName: cashAccount.name, 
            debit: 0, 
            credit: Number(calculatedTotal.toFixed(2)), 
            description: `رد نقدي فوري للعميل ${customerReturnForm.customerName} مقابل أدوية مرتجعة` 
          },
          // Revert COGS: Debit Inventory Asset, Credit COGS Expense
          { 
            accountId: inventoryAccount.id!, 
            accountName: inventoryAccount.name, 
            debit: Number(totalEstimatedCogsVal.toFixed(2)), 
            credit: 0, 
            description: `إعادة إدخال البضاعة الصيدلانية لرفوف المخزون` 
          },
          { 
            accountId: cogsAccount.id!, 
            accountName: cogsAccount.name, 
            debit: 0, 
            credit: Number(totalEstimatedCogsVal.toFixed(2)), 
            description: `تخفيض تكلفة البضاعة الطبية المباعة (COGS)` 
          }
        ],
        createdBy: "1"
      });

      success('⚖️ تم رد جزء من مبيعات العميل بنجاح، تزويد كميات الأرفف، والرد النقدي المقترن بالدفاتر المالية للمركز الموحد!');
      setIsCustomerReturnModalOpen(false);
      setCustomerReturnForm({
        customerName: 'زبون نقدي',
        selectedSaleId: '',
        saleInvoiceQuery: '',
        date: new Date().toISOString().split('T')[0],
        items: [],
        barcodeToVerify: '',
        expiryToVerify: '',
        verificationStatus: 'idle',
        status: 'مقبول ومكتمل'
      });
    } catch (err) {
      console.error(err);
      error(`حدث خطأ أثناء حفظ مرتجع المبيعات: ${(err as Error).message}`);
    }
  };

  // Write off expired medicines as loss
  const writeOffExpired = async (med: any) => {
    if (med.stock <= 0) {
      warning('لا يوجد أرصدة متوفرة حالياً لشطبها لهذا الصنف');
      return;
    }
    try {
      const costValue = med.stock * (med.costPrice || med.price * 0.6);
      
      // Zero out stock in medicine database
      await db.pharmacyMedicines.update(med.id, { stock: 0 });

      // Post financial write off entry using AccountingEngine
      const inventoryAccount = await db.accounts.where('code').equals('1200').first() || { id: 2, name: 'مخزون الأدوية والمستلزمات' };
      const expiredLossAccount = await db.accounts.where('code').equals('5050').first() || { id: 5, name: 'مصروف تالف أدوية منتهية' };

      await AccountingEngine.postEntry({
        date: new Date(),
        reference: `PHA-LOSS-${med.id}`,
        description: `شطب وإعدام أدوية تالفة منتهية الصلاحية: ${med.name}`,
        lines: [
          // Debit loss expense
          { accountId: expiredLossAccount.id!, accountName: expiredLossAccount.name, debit: Number(costValue.toFixed(2)), credit: 0, description: `مصاريف إعدام أدوية صيدلية منتهية الصلاحية لمجموع ${med.stock} وحدة` },
          // Credit inventory assets
          { accountId: inventoryAccount.id!, accountName: inventoryAccount.name, debit: 0, credit: Number(costValue.toFixed(2)), description: `تصفية قيمة الأدوية الهالكة من أصول المخزن` }
        ],
        createdBy: "1"
      });

      success(`☣️ تم بنجاح شطب وإعدام ${med.stock} وحدة من ${med.name} بالكامل وتسجيل خسارة محاسبية قدرها ${costValue} ج.م`);
    } catch (err) {
      console.error(err);
      error('فشل شطب الدواء المنتهي محاسبياً');
    }
  };

  // Pre-fill and trigger supplier returns for expiring products
  const triggerAutoSupplierReturn = (med: any) => {
    if (med.stock <= 0) {
      warning('لا يوجد رصيد حالياً بالمخزن للقيام بإرجاعه للمورد');
      return;
    }
    setReturnForm({
      supplierName: med.supplierName || 'شركة أندري الطبية',
      date: new Date().toISOString().split('T')[0],
      items: [
        {
          medId: med.id!,
          name: med.name,
          quantity: med.stock,
          refundPrice: med.costPrice || Number((med.price * 0.6).toFixed(2))
        }
      ],
      status: 'خصم من مديونية المورد (ذمم دائنة)'
    });
    setPurchaseSubTab('returns'); // Switch sub tab
    setActiveTab('purchases');   // Switch main tab
    setIsReturnModalOpen(true);  // Open modal
    success(`🔄 تم إنشاء كشف مرتجع ذكي تلقائي للصنف ${med.name} بالكمية المتاحة (${med.stock}) للمورد ${med.supplierName || 'شركة أندري الطبية'}`);
  };

  // Pre-fill and trigger supplier purchases for low-stock products
  const triggerAutoSupplierPurchase = (med: any) => {
    const minVal = med.minStock || 10;
    const deficit = minVal - med.stock;
    const qtyToOrder = deficit > 0 ? (deficit + Math.round(minVal * 0.5)) : minVal; // smart replenishment order size
    
    setPurchaseForm({
      supplierName: med.supplierName || 'مستودع ياروسلاف للأدوية',
      date: new Date().toISOString().split('T')[0],
      invoiceNumber: '',
      paymentType: 'credit',
      items: [
        {
          medId: med.id!,
          name: med.name,
          quantity: qtyToOrder,
          costPrice: med.costPrice || Number((med.price * 0.6).toFixed(2)),
          bonusQty: Math.ceil(qtyToOrder * 0.1), // smart AI bonus suggestion (10%)
          batchNumber: 'B' + Math.floor(1000 + Math.random() * 9000),
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split('T')[0]
        }
      ],
      total: qtyToOrder * (med.costPrice || Number((med.price * 0.6).toFixed(2)))
    });
    setPurchaseSubTab('bills'); // switch purchases view to bills
    setActiveTab('purchases');  // send them to the purchases screen
    setIsPurchaseModalOpen(true); // open purchase bill creation modal with the item preloaded!
    success(`🛒 تم صياغة أمر شراء ذكي مقترح للصنف ${med.name} بالكمية المطلوبة لتغطية العجز (${qtyToOrder} علبة مع بونص تجاري ١٠٪)`);
  };

  // Recharts metric calculations
  const chartSalesData = useMemo(() => {
    // Generate beautiful 7 days sales trend data
    const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    return days.map((day, i) => {
      // Seed nice sales values
      const baseAmt = [1200, 2400, 1800, 3100, 2800, 4500, totalSalesVal > 0 ? totalSalesVal : 3400];
      return {
        name: day,
        'المبيعات': baseAmt[i],
        'الأرباح': Math.round(baseAmt[i] * 0.35)
      };
    });
  }, [totalSalesVal]);

  const chartCategoryData = useMemo(() => {
    // Calculate category quantities
    const cats = ['مضاد حيوي', 'مسكنات آلام', 'فيتامينات ومكملات', 'جهاز هضمي', 'شاش ومستلزمات'];
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
    return cats.map((cat, i) => {
      const qtyCount = medicines.filter(m => m.category === cat).reduce((sum, m) => sum + m.stock, 0);
      return {
        name: cat,
        value: qtyCount > 0 ? qtyCount : (i + 1) * 25,
        color: colors[i]
      };
    });
  }, [medicines]);

  return (
    <div className="p-6 space-y-6 dir-rtl text-slate-800 bg-slate-50 min-h-screen">
      
      {/* Upper Status & Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <HeartHandshake className="w-3.5 h-3.5" /> قسم الصيدلية الموحد (أوفلاين)
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">إدارة الصيدلية والدواء</h1>
          <p className="text-slate-500 text-sm mt-1">
            صرف الروشتات الطبية المباشرة، جرد الدفعات، والتحليلات المالية المترابطة تلقائياً مع القيود المحاسبية.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'medicines' && (
            <button 
              onClick={() => {
                setMedForm({ 
                  id: undefined, 
                  name: '', 
                  code: '', 
                  category: 'مضاد حيوي', 
                  activeIngredient: '', 
                  stock: 0, 
                  expiryDate: '', 
                  shelfLocation: '', 
                  price: 0, 
                  costPrice: 0, 
                  minStock: 10,
                  hasRetailFractioning: false,
                  packHasStrips: 3,
                  stripHasPills: 10,
                  pricePerStrip: 0,
                  pricePerPill: 0,
                  stripBarcode: '',
                  isControlled: false,
                  batchNumber: '',
                  supplierName: 'مستودع ياروسلاف للأدوية'
                });
                setIsMedModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-600/10">
              <Plus className="w-5 h-5" />
              <span>إدخال دواء جديد</span>
            </button>
          )}
          {activeTab === 'purchases' && (
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPurchaseModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10">
                <Plus className="w-5 h-5" />
                <span>إدخال فاتورة شراء</span>
              </button>
              <button 
                onClick={() => setIsReturnModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-rose-600/10">
                <TrendingDown className="w-5 h-5" />
                <span>مرتجع للمورد (مردودات)</span>
              </button>
              <button 
                onClick={() => setIsCustomerReturnModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-teal-600/10">
                <RefreshCw className="w-5 h-5" />
                <span>مرتجع من عميل</span>
              </button>
            </div>
          )}
          <button 
            type="button"
            onClick={() => window.location.reload()}
            className="p-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
            title="تحديث البيانات">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Expiry alerts / Emergency Banner */}
      {(expiredCount > 0 || lowStockCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {expiredCount > 0 && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
              <div className="bg-rose-100 p-2 rounded-lg text-rose-600 shrink-0">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-rose-900 text-sm">أدوية منتهية الصلاحية!</h3>
                <p className="text-rose-700 text-xs mt-1">يوجد عدد <strong>{expiredCount}</strong> أدوية في الرفوف انتهت صلاحيتها. يُرجى التوجه لعلامة تبويب "الأدوية" وشطبها لحماية الأرواح وتصفية قيمتها محاسبياً.</p>
              </div>
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-amber-900 text-sm">نواقص أدوية (حد الأمان)</h3>
                <p className="text-amber-700 text-xs mt-1">يوجد عدد <strong>{lowStockCount}</strong> أدوية شارفت كميتها على النفاد. برجاء حجز طلبيات من الموردين فوراً.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Navigation Tabs */}
      <div className="flex flex-wrap gap-1 bg-white border border-slate-200 p-1.5 rounded-2xl w-fit shadow-sm">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
          <HeartHandshake className="w-4 h-4" />
          <span>لوحة التحكم</span>
        </button>
        <button 
          onClick={() => setActiveTab('pos')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'pos' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
          <ShoppingCart className="w-4 h-4" />
          <span>كاشير الصيدلية</span>
        </button>
        <button 
          onClick={() => setActiveTab('medicines')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'medicines' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Package className="w-4 h-4" />
          <span>دليل الأدوية</span>
        </button>
        <button 
          onClick={() => setActiveTab('prescriptions')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 relative ${activeTab === 'prescriptions' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
          <FileCheck className="w-4 h-4" />
          <span>صرف الروشتات</span>
          {prescriptions.filter(p => p.status === 'معلقة').length > 0 && (
            <span className="absolute -top-1 -left-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white animate-pulse">
              {prescriptions.filter(p => p.status === 'معلقة').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('purchases')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'purchases' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
          <Landmark className="w-4 h-4" />
          <span>المشتريات والتوريد</span>
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
          <FileBarChart className="w-4 h-4" />
          <span>تقارير الصلاحية والتنبؤ</span>
        </button>
      </div>

      {/****************** TAB 1: DASHBOARD ******************/}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Bento Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-bold block">إجمالي الإيرادات الطبية</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{totalSalesVal} ج.م</span>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-600"><TrendingUp className="w-6 h-6" /></div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-bold block">أصناف الأدوية بالمخزن</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{medicines.length} صنف</span>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-xl text-blue-600"><Package className="w-6 h-6" /></div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-bold block">أدوية ستنتهي خلال 30 يوم</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block text-orange-600">{expiringSoonCount} صنف</span>
              </div>
              <div className="bg-orange-500/10 p-3 rounded-xl text-orange-600"><Calendar className="w-6 h-6" /></div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs font-bold block">روشتات معلقة حالياً</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block text-indigo-600">{prescriptions.filter(p=>p.status === 'معلقة').length} روشتة</span>
              </div>
              <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-600"><FileCheck className="w-6 h-6" /></div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
              <h3 className="font-extrabold text-slate-800 mb-4 text-sm">منحنى المبيعات الأسبوعي والأرباح</h3>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartSalesData}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="المبيعات" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
                    <Area type="monotone" dataKey="الأرباح" stroke="#6366f1" strokeWidth={1.5} fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <h3 className="font-extrabold text-slate-800 mb-2 text-sm text-right">توزيع كمية المخزون حسب الفئة</h3>
              <div className="h-60 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2 text-right">
                {chartCategoryData.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{c.value} وحدة</span>
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="text-slate-600 font-medium">{c.name}</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Staff Activity List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mt-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4 text-right">طاقم صيدليتنا النشط اليوم (أخصائيين ومحاسبين)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" dir="rtl">
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex items-center gap-3 justify-start">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold font-mono shrink-0">KK</div>
                <div className="text-right">
                  <h4 className="font-bold text-slate-800 text-xs">كاترينا كوزلوفا</h4>
                  <p className="text-slate-400 text-[10px]">كاشير الصيدلية المناوب</p>
                </div>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex items-center gap-3 justify-start">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold font-mono shrink-0">OS</div>
                <div className="text-right">
                  <h4 className="font-bold text-slate-800 text-xs">د. أولغا شفتشينكو</h4>
                  <p className="text-slate-400 text-[10px]">طبيب محول وكاتب روشتات</p>
                </div>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex items-center gap-3 justify-start">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold font-mono shrink-0">MK</div>
                <div className="text-right">
                  <h4 className="font-bold text-slate-800 text-xs">ميكولا كوساش</h4>
                  <p className="text-slate-400 text-[10px]">مسؤول جرد ومخزون الأدوية</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/****************** TAB 2: PHARMACY POS ******************/}
               {activeTab === 'pos' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          
          {/***************** 1. RIGHT COLUMN (الجانب الأيمن): فاتورة البيع الحالية *****************/}
          <div className="xl:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-right">
            <div className="flex justify-between items-center border-b border-indigo-50 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <span>فاتورة البيع الحالية (Cart)</span>
              </h3>
              <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {posCart.length} مستحضر
              </span>
            </div>

            {/* Current Patient details (Ukrainian-Christian friendly or neutral) */}
            <div className="grid grid-cols-1 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 block mb-1">اسم العميل / المريض المستلم</label>
                <input 
                  type="text"
                  value={posCustomerName}
                  onChange={e => setPosCustomerName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500 font-bold text-slate-700"
                  placeholder="زبون نقدي / اختر اسماً..."
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button 
                  type="button"
                  onClick={() => setPosPaymentMethod('cash')}
                  className={`py-1.5 px-2.5 border rounded-lg text-[10px] font-bold transition-all ${posPaymentMethod === 'cash' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}>
                  💵 كاش بالخزينة
                </button>
                <button 
                  type="button"
                  onClick={() => setPosPaymentMethod('bank_transfer')}
                  className={`py-1.5 px-2.5 border rounded-lg text-[10px] font-bold transition-all ${posPaymentMethod === 'bank_transfer' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'}`}>
                  🏦 تحويل بنكي / فودافون
                </button>
              </div>
            </div>

            {/* Flexible Invoice Cart Table */}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto text-right" dir="rtl">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-150 text-slate-500 font-extrabold text-[10px]">
                      <th className="p-2 text-right">الدواء</th>
                      <th className="p-2 text-center">الوحدة</th>
                      <th className="p-2 text-center">الكمية</th>
                      <th className="p-2 text-center">السعر</th>
                      <th className="p-2 text-left">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posCart.map((item, index) => {
                      const itemPrice = (() => {
                        const med = item.med;
                        const unit = item.selectedUnit || 'pack';
                        let price = med.price;
                        if (med.hasRetailFractioning) {
                          if (unit === 'strip') {
                            price = med.pricePerStrip || Math.round(med.price / (med.packHasStrips || 3));
                          } else if (unit === 'pill') {
                            price = med.pricePerPill || Math.round(med.price / ((med.packHasStrips || 3) * (med.stripHasPills || 10)));
                          }
                        }
                        return price;
                      })();

                      const isActive = activeMedForDetails?.id === item.med.id;

                      return (
                        <tr 
                          key={`${item.med.id}-${item.selectedUnit}-${index}`} 
                          onClick={() => setActiveMedForDetails(item.med)}
                          className={`border-b border-slate-100 transition-all cursor-pointer ${
                            isActive ? 'bg-emerald-50/70 border-r-4 border-r-emerald-600' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="p-2 font-bold text-slate-800">
                            <span className="block truncate max-w-[110px]" title={item.med.name}>{item.med.name}</span>
                          </td>
                          <td className="p-2 text-center">
                            {item.med.hasRetailFractioning ? (
                              <select 
                                value={item.selectedUnit}
                                onClick={(e) => e.stopPropagation()}
                                onChange={e => updateCartQty(item.med.id, item.quantity, e.target.value as any)}
                                className="bg-white border border-slate-200 rounded p-0.5 text-[10px] font-bold text-slate-700 focus:border-emerald-500 outline-none"
                              >
                                <option value="pack">علبة</option>
                                <option value="strip">شريط</option>
                                <option value="pill">حبة</option>
                              </select>
                            ) : (
                              <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-black">علبة</span>
                            )}
                          </td>
                          <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => updateCartQty(item.med.id, item.quantity - 1, item.selectedUnit)}
                                className="w-5 h-5 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 rounded flex items-center justify-center font-bold text-[10px] shadow-sm">-</button>
                              <span className="font-extrabold text-[11px] w-5 text-center text-slate-700">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQty(item.med.id, item.quantity + 1, item.selectedUnit)}
                                className="w-5 h-5 bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 rounded flex items-center justify-center font-bold text-[10px] shadow-sm">+</button>
                            </div>
                          </td>
                          <td className="p-2 text-center font-mono text-slate-600 text-[11px]">{itemPrice}</td>
                          <td className="p-2 text-left font-extrabold text-slate-900 text-[11px]">{itemPrice * item.quantity} ج.م</td>
                        </tr>
                      );
                    })}

                    {posCart.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 text-[11px] space-y-1">
                          <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto opacity-75 mb-1" />
                          <p>الفاتورة فارغة حالياً.</p>
                          <p className="text-[10px] text-slate-400">انقر على الأدوية بالمنتصف للإدراج الفوري.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Syndicate and Insurance Discount buttons */}
            <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/65 space-y-2.5">
              <span className="text-[10px] font-black text-slate-400 block">خصومات سريعة (الروشتات الطبية والتأمينية):</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button 
                  type="button"
                  onClick={() => {
                    const subtotal = posCart.reduce((sum, item) => {
                      const med = item.med;
                      const unit = item.selectedUnit || 'pack';
                      let price = med.price;
                      if (med.hasRetailFractioning) {
                        if (unit === 'strip') price = med.pricePerStrip || Math.round(med.price / (med.packHasStrips || 3));
                        else if (unit === 'pill') price = med.pricePerPill || Math.round(med.price / ((med.packHasStrips || 3) * (med.stripHasPills || 10)));
                      }
                      return sum + (price * item.quantity);
                    }, 0);
                    setPosDiscount(Math.round(subtotal * 0.20));
                    success("تم تطبيق خصم نقابة الأطباء %20 بنجاح");
                  }}
                  className="bg-white hover:bg-slate-50 text-indigo-700 text-[9px] font-extrabold py-1.5 px-1.5 rounded-lg border border-indigo-150 transition-all text-center">
                  🩺 نقابة الأطباء %20
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const subtotal = posCart.reduce((sum, item) => {
                      const med = item.med;
                      const unit = item.selectedUnit || 'pack';
                      let price = med.price;
                      if (med.hasRetailFractioning) {
                        if (unit === 'strip') price = med.pricePerStrip || Math.round(med.price / (med.packHasStrips || 3));
                        else if (unit === 'pill') price = med.pricePerPill || Math.round(med.price / ((med.packHasStrips || 3) * (med.stripHasPills || 10)));
                      }
                      return sum + (price * item.quantity);
                    }, 0);
                    setPosDiscount(Math.round(subtotal * 0.30));
                    success("تم تطبيق خصم التأمين الصحي الشامل %30 بنجاح");
                  }}
                  className="bg-white hover:bg-slate-50 text-emerald-700 text-[9px] font-extrabold py-1.5 px-1.5 rounded-lg border border-emerald-150 transition-all text-center">
                  🛡️ التأمين الصحي %30
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const subtotal = posCart.reduce((sum, item) => {
                      const med = item.med;
                      const unit = item.selectedUnit || 'pack';
                      let price = med.price;
                      if (med.hasRetailFractioning) {
                        if (unit === 'strip') price = med.pricePerStrip || Math.round(med.price / (med.packHasStrips || 3));
                        else if (unit === 'pill') price = med.pricePerPill || Math.round(med.price / ((med.packHasStrips || 3) * (med.stripHasPills || 10)));
                      }
                      return sum + (price * item.quantity);
                    }, 0);
                    setPosDiscount(Math.round(subtotal * 0.15));
                    success("تم تطبيق خصم هيئة التأمين والنواب %15 بنجاح");
                  }}
                  className="bg-white hover:bg-slate-50 text-amber-700 text-[9px] font-extrabold py-1.5 px-1.5 rounded-lg border border-amber-150 transition-all text-center">
                  📋 تأمينات أخرى %15
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setPosDiscount(0);
                    warning("تم تصفير قيمة الخصم الفاتورة");
                  }}
                  className="bg-red-50 hover:bg-red-100 text-red-700 text-[9px] font-extrabold py-1.5 px-1 rounded-lg border border-red-200 transition-all text-center">
                  ✕ إلغاء الخصم
                </button>
              </div>

              {/* Discount Input directly */}
              <div className="flex justify-between items-center text-xs font-bold pt-1">
                <span className="text-slate-500">مبلغ الخصم الإضافي اليدوي (ج.م)</span>
                <input 
                  type="number"
                  value={posDiscount || ''}
                  onChange={e => setPosDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-24 bg-white border border-slate-200 rounded p-1 text-center font-bold text-slate-800 text-xs outline-none focus:border-emerald-500"
                  placeholder="0.0"
                />
              </div>
            </div>

            {/* dynamic co-payment and prescription upload cards */}
            <div className="bg-sky-50/50 p-3.5 rounded-xl border border-sky-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-sky-900 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>التعاقدات والتأمين الطبي (Co-payment)</span>
                </span>
                <input 
                  type="checkbox"
                  checked={isInsuranceEnabled}
                  onChange={e => setIsInsuranceEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                />
              </div>

              {isInsuranceEnabled && (
                <div className="space-y-3 pt-2 text-right">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 block mb-1">اختر الشركة / النقابة المتعاقد معها</label>
                    <select 
                      value={selectedInsuranceCompanyId}
                      onChange={e => {
                        const val = e.target.value;
                        setSelectedInsuranceCompanyId(val);
                        const matched = insuranceCompanies.find(c => c.id === Number(val));
                        if (matched) {
                          const discount = Number(matched.discountRate || matched.coveragePercent || 80);
                          setInsuranceSharePercent(discount);
                          setPatientSharePercent(100 - discount);
                        } else {
                          setInsuranceSharePercent(80);
                          setPatientSharePercent(20);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none focus:border-sky-500"
                    >
                      <option value="">-- حدد جهة التعاقد --</option>
                      {insuranceCompanies.map(c => (
                        <option key={c.id} value={c.id}>{c.name || c.companyName} ({c.discountRate || c.coveragePercent || 80}%)</option>
                      ))}
                      {insuranceCompanies.length === 0 && (
                        <>
                          <option value="9991">التأمين الصحي الشامل (تحمل 20%)</option>
                          <option value="9992">نقابة المهندسين المصرية (تحمل 30%)</option>
                          <option value="9993">شركة أليانز للرعاية الطبية (تحمل 10%)</option>
                          <option value="9994">نقابة المعلمين والعمال (تحمل 25%)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-slate-400 block mb-1.5">توزيع نسبة التحمل (الشركة / العميل):</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: '80/20', ins: 80, pat: 20 },
                        { label: '90/10', ins: 90, pat: 10 },
                        { label: '70/30', ins: 70, pat: 30 },
                        { label: '50/50', ins: 50, pat: 50 }
                      ].map(opt => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => {
                            setInsuranceSharePercent(opt.ins);
                            setPatientSharePercent(opt.pat);
                          }}
                          className={`py-1 rounded text-[10px] font-extrabold border transition-all ${
                            insuranceSharePercent === opt.ins ? 'bg-sky-600 text-white border-sky-600' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-lg border border-sky-100 text-[11px]">
                    <div className="text-right">
                      <span className="text-slate-400 font-bold block">يدفعه المريض ({patientSharePercent}%)</span>
                      <strong className="text-slate-800 text-xs font-black">
                        {Number((posCartTotal * (patientSharePercent / 100)).toFixed(2))} ج.م
                      </strong>
                    </div>
                    <div className="text-left border-r border-slate-100 pr-2">
                      <span className="text-slate-400 font-bold block text-left">تتحمله التأمينات ({insuranceSharePercent}%)</span>
                      <strong className="text-sky-700 text-xs font-black block text-left">
                        {Number((posCartTotal * (insuranceSharePercent / 100)).toFixed(2))} ج.م
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Offline Preservation Prescription File Upload */}
            <div className="bg-slate-50/85 p-3 rounded-xl border border-slate-200 text-right space-y-2">
              <span className="text-[10px] font-black text-slate-500 block">📁 أرشفة المستند الطبي المرفق (اختياري):</span>
              <div 
                className="border border-dashed border-slate-300 hover:border-emerald-500 bg-white p-3 rounded-xl text-center space-y-1 cursor-pointer transition select-none"
                onClick={() => document.getElementById('pos-prescription-file-hidden')?.click()}
              >
                <input 
                  id="pos-prescription-file-hidden"
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPosPrescriptionFile(reader.result as string);
                        success('تم تحميل صورة الروشتة للفاتورة بنجاح!');
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {posPrescriptionFile ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-emerald-600">✓ تم دمج المستند بالفاتورة (Base64)</p>
                    <img src={posPrescriptionFile} alt="Attached Presc" className="max-h-12 mx-auto rounded object-contain shadow-xs border border-slate-150" referrerPolicy="no-referrer" />
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setPosPrescriptionFile(''); }} 
                      className="text-red-500 hover:text-red-700 text-[9px] underline">
                      حذف المستند
                    </button>
                  </div>
                ) : (
                  <div className="text-slate-400 py-1 flex flex-col items-center justify-center">
                    <FileCheck className="w-5 h-5 text-slate-400 mb-0.5" />
                    <p className="text-[10px] font-bold text-slate-600">اسحب صورة الروشتة أو انقر للملف</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Calculations */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">💸 إجمالي الحساب للعميل</span>
                <span className="text-xl font-black text-emerald-800">{posCartTotal} ج.م</span>
              </div>
            </div>

            <button 
              onClick={() => handlePOSCheckout()}
              disabled={posCart.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-center rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-md">
              <ShoppingCart className="w-4 h-4" />
              <span>ترحيل المبيعات وحفظ القيد المالي</span>
            </button>
          </div>

          {/***************** 2. CENTER COLUMN (المنتصف): شبكة البحث السريع والبدائل *****************/}
          <div className="xl:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-right">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">شاشة مبيعات كاشير الصيدلية (POS)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">البحث الفوري بالاسم أو المادة الفعالة لحل فوري لنواقص السوق</p>
            </div>

            {/* Smart search input & Autocomplete Dropdown */}
            <div className="relative">
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="ابحث بالاسم التجاري، المادة الفعالة، أو باركود العلبة/الشريط..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pr-9 pl-3 text-xs outline-none focus:border-emerald-500 font-bold"
              />

              {/* Smart autocomplete list that shows up when typing >= 2 chars */}
              {searchQuery.trim().length >= 2 && (
                <div className="absolute z-20 left-0 right-0 top-full bg-white border border-slate-200 rounded-xl shadow-xl mt-1.5 p-1 max-h-[290px] overflow-y-auto divide-y divide-slate-100 text-right">
                  <div className="p-1 px-3 text-[10px] text-emerald-800 font-black bg-emerald-50/50 rounded-lg flex justify-between items-center mb-1">
                    <span>نتائج البحث الذكي الفورية:</span>
                    <span>{medicines.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || (m.activeIngredient && m.activeIngredient.toLowerCase().includes(searchQuery.toLowerCase()))).length} أصناف مطابقة</span>
                  </div>
                  {medicines
                    .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || (m.activeIngredient && m.activeIngredient.toLowerCase().includes(searchQuery.toLowerCase())))
                    .slice(0, 10)
                    .map(med => {
                      const det = getMedStockDetails(med);
                      const isExpired = new Date(med.expiryDate) <= new Date();
                      const isOutOfStock = det.totalPills <= 0;
                      return (
                        <div 
                          key={med.id}
                          onClick={() => {
                            if (isExpired) {
                              error(`🚫 تنبيه صلاحية: لا يمكن صرف ${med.name} منتهي الصلاحية!`);
                              return;
                            }
                            if (isOutOfStock) {
                              setAlternativeMedSource(med);
                            } else {
                              addToCart(med, med.hasRetailFractioning ? 'pack' : 'pack');
                            }
                            setActiveMedForDetails(med);
                          }}
                          className="p-2.5 hover:bg-slate-50 transition-all text-xs cursor-pointer flex justify-between items-center rounded-lg pr-1"
                        >
                          <div className="text-right">
                            <span className="font-extrabold text-slate-900">{med.name}</span>
                            <span className="bg-slate-150 text-slate-500 text-[9px] font-mono px-1 py-0.5 rounded mr-1.5">{med.shelfLocation || 'غير محدد'}</span>
                            <div className="text-[10px] text-slate-400 mt-0.5 animate-fade-in">
                              المادة: {med.activeIngredient || 'مسجل كمنتج طبي'}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <strong className="text-emerald-700 font-black text-xs font-mono">{med.price} ج.م</strong>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              isExpired ? 'bg-red-100 text-red-800' :
                              isOutOfStock ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                            }`}>
                              {isExpired ? 'منتهي صلاحية' : isOutOfStock ? 'رصيد 0 (البدائل ⚡)' : `متاح: ${det.displayText}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  {medicines.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || (m.activeIngredient && m.activeIngredient.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs">لا توجد أدوية مطابقة للكلمة المدخلة</div>
                  )}
                </div>
              )}
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
              {categoriesList.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Smart Alternatives Bar / Widget */}
            {alternativeMedSource && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-right animate-bounce bg-white shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
                      البدائل المتوفرة فوراً لـ {alternativeMedSource.name}
                    </h4>
                    <p className="text-[10px] text-amber-700 mt-1">المادة العلاجية: <strong className="font-mono">{alternativeMedSource.activeIngredient}</strong></p>
                  </div>
                  <button 
                    onClick={() => setAlternativeMedSource(null)}
                    className="text-amber-500 hover:text-amber-700 text-xs font-bold leading-none p-1">✕ اغلاق</button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {medicines
                    .filter(m => m.activeIngredient === alternativeMedSource.activeIngredient && m.id !== alternativeMedSource.id && getMedStockDetails(m).totalPills > 0)
                    .map(alt => {
                      const altDetails = getMedStockDetails(alt);
                      return (
                        <div key={alt.id} className="bg-white border border-amber-100 p-2.5 rounded-lg flex justify-between items-center text-xs">
                          <div className="text-right">
                            <span className="font-bold text-slate-900">{alt.name}</span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                              <span>الرف: {alt.shelfLocation || 'غير محدد'}</span>
                              <span>•</span>
                              <span className="text-emerald-700 font-extrabold">{altDetails.displayText} متوفر</span>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              addToCart(alt, alt.hasRetailFractioning ? 'pack' : 'pack');
                              success(`تم تمكين بديل الصنف: ${alt.name}`);
                              setAlternativeMedSource(null);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 py-1 rounded text-[10px] transition">
                            صرف البديل
                          </button>
                        </div>
                      );
                    })}
                  {medicines.filter(m => m.activeIngredient === alternativeMedSource.activeIngredient && m.id !== alternativeMedSource.id && getMedStockDetails(m).totalPills > 0).length === 0 && (
                    <div className="text-[11px] text-amber-800 py-1 font-medium text-center">لا توجد أدوية بديلة أخرى متوفرة حالياً في المخزن بنفس المادة العلاجية!</div>
                  )}
                </div>
              </div>
            )}

            {/* Medicines List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredMedicines.map(med => {
                const details = getMedStockDetails(med);
                const isOutOfStock = details.totalPills <= 0;
                const isLowStock = !isOutOfStock && (med.hasRetailFractioning ? (details.packs <= (med.minStock || 10)) : (med.stock <= (med.minStock || 10)));
                const today = new Date();
                const isExpired = new Date(med.expiryDate) <= today;

                return (
                  <div 
                    key={med.id}
                    onClick={() => {
                      if (isExpired) {
                        error(`🚫 تنبيه صلاحية: لا يمكن صرف ${med.name} منتهي الصلاحية!`);
                        return;
                      }
                      if (isOutOfStock) {
                        setAlternativeMedSource(med);
                      } else {
                        addToCart(med, med.hasRetailFractioning ? 'pack' : 'pack');
                      }
                      setActiveMedForDetails(med);
                    }}
                    className={`p-3 border rounded-xl flex flex-col justify-between transition-all cursor-pointer select-none text-left h-36 ${
                      activeMedForDetails?.id === med.id ? 'ring-2 ring-emerald-500 scale-[0.99] border-transparent shadow-sm' : ''
                    } ${
                      isExpired ? 'bg-red-50/50 border-red-200 cursor-not-allowed grayscale' :
                      isOutOfStock ? 'bg-amber-50 border-amber-200 border-dashed hover:border-amber-400' :
                      'bg-white hover:border-emerald-500 hover:shadow-md'
                    }`}>
                    <div className="text-right">
                      <div className="flex justify-between items-start gap-1">
                        <span className="text-xs text-slate-400 font-mono">[{med.shelfLocation || 'غير محدد'}]</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded flex items-center gap-1 ${
                          isExpired ? 'bg-red-100 text-red-800' :
                          isOutOfStock ? 'bg-amber-100 text-amber-800' :
                          isLowStock ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                        }`}>
                          {isExpired ? 'منتهي صلاحية' : isOutOfStock ? 'الرصيد 0 (البدائل ⚡)' : `مخزن: ${details.displayText}`}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-xs mt-1.5 truncate flex items-center justify-between gap-1" title={med.name}>
                        <span>{med.name}</span>
                        {med.isControlled && (
                          <span className="bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shrink-0">جدول ⚠️</span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5" title={med.activeIngredient}>المادة: {med.activeIngredient || 'مسجّل كمنتج طبي'}</p>
                    </div>

                    <div className="flex justify-between items-end mt-2 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-mono">EXP: {med.expiryDate}</span>
                        {med.batchNumber && (
                          <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-150 font-mono px-1.5 py-0.5 rounded block mt-1 w-fit">
                            تشغيلة: {med.batchNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        {med.hasRetailFractioning && (
                          <span className="text-[9px] text-slate-400 block mb-0.5">متاح تجزئة لشرائط وحبوب</span>
                        )}
                        <div className="bg-emerald-50 text-emerald-700 font-black text-sm px-2.5 py-1 rounded-lg">
                          {med.price} ج.م
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredMedicines.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400 text-xs">لا يوجد أدوية مطابقة لبحثك في الخزانة</div>
              )}
            </div>
          </div>

          {/***************** 3. LEFT COLUMN (الجانب الأيسر): تفاصيل الدواء النشط *****************/}
          <div className="xl:col-span-3 space-y-4">
            
            {/* If there is an active medicine selected */}
            {(() => {
              // Fallback to first item in card if no active selected
              const activeMed = activeMedForDetails || (posCart.length > 0 ? posCart[0]?.med : null);

              if (activeMed) {
                const actDetails = getMedStockDetails(activeMed);
                const isOutOfStock = actDetails.totalPills <= 0;
                const actBatches = allBatches.filter(b => b.productId === activeMed.id);
                const altMedsInStock = medicines.filter(m => m.activeIngredient === activeMed.activeIngredient && m.id !== activeMed.id && getMedStockDetails(m).totalPills > 0);

                return (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-right animate-fade-in">
                    <div className="border-b border-slate-100 pb-3">
                      <div className="flex justify-between items-start gap-1">
                        <span className="bg-indigo-50 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-150">
                          {activeMed.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold block">معرف صنف: #{activeMed.id}</span>
                      </div>
                      
                      <h4 className="font-extrabold text-slate-900 text-sm mt-2 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-slate-500" />
                        <span>{activeMed.name}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">الباركود/الكود: {activeMed.code || 'لا يوجد'}</p>
                    </div>

                    {/* Active Ingredient display */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-slate-400 block">المادة الفعالة (Active Ingredient):</span>
                      <div className="bg-emerald-50/50 text-emerald-800 p-2.5 rounded-lg border border-emerald-100 font-bold text-xs font-mono">
                        {activeMed.activeIngredient || 'مسجل كمنتج طبي عام'}
                      </div>
                    </div>

                    {/* Expiry dates & batches in stock */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-extrabold text-slate-400 block flex justify-between items-center">
                        <span>تواريخ الصلاحية والتشغيلات المتوفرة:</span>
                        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-mono text-[9px]">
                          {actBatches.length} تشغيلات حية
                        </span>
                      </span>

                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5" dir="rtl">
                        {actBatches.map(b => {
                          const exp = new Date(b.expiryDate);
                          const isExpired = exp <= new Date();
                          return (
                            <div key={b.id} className={`p-2 rounded-lg border text-[11px] font-mono flex justify-between items-center ${
                              isExpired ? 'bg-red-50 text-red-750 border-red-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              <div className="text-right">
                                <span className="font-bold text-slate-800 block">تشغيلة: {b.batchNumber}</span>
                                <span className="text-[10px] text-slate-400">صلاحية: {b.expiryDate} {isExpired && '⚠️ منتهي'}</span>
                              </div>
                              <span className="font-extrabold text-[12px] text-emerald-700 shrink-0 bg-white px-2 py-0.5 rounded border border-slate-200">
                                {b.quantityAtomic} وحدة
                              </span>
                            </div>
                          );
                        })}

                        {actBatches.length === 0 && (
                          <div className="p-3 bg-slate-50 text-slate-500 rounded-lg text-center text-[11px] border border-slate-200">
                            لا توجد تشغيلات مخصصة بجدول التوريدات بعد. تاريخ الصلاحية العام المقيد: <strong className="text-slate-700">{activeMed.expiryDate}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Alternatives list in stock */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <span className="text-[10px] font-extrabold text-slate-400 block flex justify-between items-center">
                        <span>أدوية بديلة متوفرة في المستودع:</span>
                        <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                          {altMedsInStock.length} بديل في الرف
                        </span>
                      </span>

                      <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-0.5">
                        {altMedsInStock.map(alt => {
                          const altDetails = getMedStockDetails(alt);
                          return (
                            <div key={alt.id} className="p-2 bg-slate-50 hover:bg-slate-100 transition rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                              <div className="text-right">
                                <span className="font-bold text-slate-800 block">{alt.name}</span>
                                <span className="text-[10px] text-slate-400">الرف: {alt.shelfLocation || 'غير محدد'} | الرصيد: {altDetails.displayText}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => {
                                  addToCart(alt, alt.hasRetailFractioning ? 'pack' : 'pack');
                                  setActiveMedForDetails(alt);
                                  success(`تم صرف البديل الجاهز: ${alt.name}`);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-2 py-1 rounded text-[10px] transition shrink-0">
                                ⚡ صرف
                              </button>
                            </div>
                          );
                        })}

                        {altMedsInStock.length === 0 && (
                          <div className="p-3 bg-slate-50 text-slate-500 rounded-lg text-center text-[10px] border border-slate-150">
                            لا توجد أدوية بديلة أخرى متوفرة حالياً في المخزن بنفس المادة العلاجية! {isOutOfStock ? '⚠️ ينصح بطلب توفير صنف بديل مع الموردين.' : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shelf Location Guide */}
                    <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 text-[10px] text-indigo-800">
                      ℹ️ <strong>مكان الترتيب في الصيدلية:</strong> الصنف مدرج في الرف <strong className="font-mono text-[11px] font-black text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">{activeMed.shelfLocation || 'غير محدد'}</strong>. يرجى مراجعة الصنف وتاريخ الصلاحية بعناية قبل تقديمه للعميل.
                    </div>
                  </div>
                );
              }

              // Onboarding State / Placeholder
              return (
                <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-300 shadow-sm text-center py-16 text-slate-400 text-xs space-y-3">
                  <Package className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
                  <p className="font-bold text-slate-700 text-center">لم يختر أي دواء حالياً</p>
                  <p className="text-[10px] text-slate-400 p-2 text-center">
                    يرجى النقر على أي مستحضر طبي داخل فاتورة البيع باليمين أو كروت البحث بالمنتصف لعرض جينوم المادة الفعالة، وبدائل الصنف في المخزن، حزمة التشغيلات المتوفرة وصلاحياتها في الصيدلية فوراً بالمنطقة هنا.
                  </p>
                </div>
              );
            })()}

          </div>
        </div>
      )}

            {/* Simulated Receipt modal/box */}
            {receiptToPrint && (
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3 relative">
                <button 
                  onClick={() => setReceiptToPrint(null)}
                  className="absolute top-2 left-2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
                <div className="text-center pb-2 border-b border-amber-200">
                  <h4 className="font-extrabold text-amber-950 text-xs text-center flex items-center justify-center gap-1.5"><Printer className="w-4 h-4"/> إيصال صرف دواء جاهز للطباعة</h4>
                  <p className="text-[10px] text-amber-800 mt-1">فاتورة مبيعات صيدلية رقم #{receiptToPrint.id}</p>
                </div>
                <div className="space-y-1.5 text-xs text-amber-900 font-mono text-right">
                  <div><strong>العميل المشتري:</strong> {receiptToPrint.customerName}</div>
                  <div><strong>التاريخ والوقت:</strong> {receiptToPrint.date}</div>
                  <div><strong>طريقة السداد:</strong> {receiptToPrint.paymentMethod === 'cash' ? 'نقد بالخزينة' : 'حوالة بنكية'}</div>
                  <div className="border-t border-b border-amber-200 py-1 my-1">
                    {receiptToPrint.items.map((it: any, k: number) => (
                      <div key={k} className="flex justify-between text-[11px] font-mono">
                        <span>{it.med.name} (عدد {it.quantity})</span>
                        <span>{it.med.price * it.quantity} ج.م</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-amber-950 text-sm">
                    <span>الصافي المدفوع:</span>
                    <span>{receiptToPrint.total} ج.م</span>
                  </div>
                </div>
                <button 
                  onClick={() => { window.print(); }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5">
                  <Printer className="w-4 h-4" /> طباعة الإيصال الفوري (Print)
                </button>
              </div>
            )}

            {/* Controlled drug register modal */}
            {isControlledFormOpen && (
              <div className="fixed inset-0 z-50 bg-black/55 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[95vh]">
                  <div className="bg-amber-600 px-6 py-4 flex justify-between items-center text-white text-right">
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="w-5 h-5 text-amber-100 shrink-0" />
                      <div className="text-right">
                        <h3 className="font-extrabold text-sm text-white">تفويض صرف أدوية مراقبة (جدول مخدرات)</h3>
                        <p className="text-[10px] text-amber-100 mt-0.5">يتطلب هذا الصنف تدوين البيانات للمريض والطبيب وصورة الروشتة امتثالاً للرقابة</p>
                      </div>
                    </div>
                    <button onClick={() => setIsControlledFormOpen(false)} className="text-white/80 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      setIsControlledFormOpen(false);
                      handlePOSCheckout(controlledForm);
                    }}
                    className="p-6 overflow-y-auto space-y-4 text-right"
                  >
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800 text-xs text-right">
                      📌 <strong>تنبيه قانوني:</strong> سيتم تسجيل هذا الصرف في السجل المركزي المعتمد للصيدلية وحفظه للجهات التفتيشية أوفلاين بالكامل.
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">اسم المريض المستهلك *</label>
                        <input 
                          type="text"
                          required
                          value={controlledForm.patientName}
                          onChange={e => setControlledForm({ ...controlledForm, patientName: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-amber-500 text-right"
                          placeholder="مثال: تاراس بوهدان"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">الرقم القومي / الهوية *</label>
                        <input 
                          type="text"
                          required
                          value={controlledForm.patientNationalID}
                          onChange={e => setControlledForm({ ...controlledForm, patientNationalID: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-amber-500 text-left"
                          placeholder="مثال: UA9912048"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">اسم الطبيب المعالج كاتب الروشتة *</label>
                        <input 
                          type="text"
                          required
                          value={controlledForm.doctorName}
                          onChange={e => setControlledForm({ ...controlledForm, doctorName: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-amber-500 text-right"
                          placeholder="مثال: د. ميكولا شفتشينكو"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">رقم الروشتة / الكود الطبي *</label>
                        <input 
                          type="text"
                          required
                          value={controlledForm.prescriptionNumber}
                          onChange={e => setControlledForm({ ...controlledForm, prescriptionNumber: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-amber-500 text-left"
                          placeholder="مثال: RX-992144"
                        />
                      </div>
                    </div>

                    {/* Drag and Drop File uploader with Base64 encoding */}
                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">صورة الروشتة الطبية (للأرشفة القانونية أوفلاين) *</label>
                      <div 
                        className="border-2 border-dashed border-slate-200 hover:border-amber-500 bg-slate-50/50 p-4 rounded-xl text-center space-y-2 cursor-pointer transition select-none"
                        onClick={() => document.getElementById('prescription-file-elem')?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setControlledForm({ ...controlledForm, prescriptionFileBase64: reader.result as string });
                              success('تم قراءة الروشتة كـ Base64 وحفظها بالذاكرة بنجاح!');
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      >
                        <input 
                          id="prescription-file-elem"
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setControlledForm({ ...controlledForm, prescriptionFileBase64: reader.result as string });
                                success('تم تحميل ملف الروشتة بنجاح!');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        
                        {controlledForm.prescriptionFileBase64 ? (
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
                              ✓ تم تحميل صورة المستند بنجاح (مخزنة)
                            </p>
                            <img 
                              src={controlledForm.prescriptionFileBase64} 
                              alt="Prescription preview" 
                              className="max-h-24 mx-auto rounded-lg border border-slate-200 object-contain shadow-xs"
                              referrerPolicy="no-referrer"
                            />
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setControlledForm({ ...controlledForm, prescriptionFileBase64: '' });
                              }}
                              className="text-red-500 hover:text-red-700 text-[10px] underline block mx-auto">
                              حذف وتبديل الملف
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1 py-1.5">
                            <FileCheck className="w-8 h-8 text-slate-400 mx-auto" />
                            <p className="text-xs font-bold text-slate-700">اسحب وأفلت صورة الروشتة هنا، أو انقر للتصفح</p>
                            <p className="text-[10px] text-slate-400">أي ملف صورة أو مستند طبي - يتم حفظه مشفر كـ Base64 أوفلاين</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 block mb-1">ملاحظات التحقق الأمني والرقابي</label>
                      <textarea 
                        rows={2}
                        value={controlledForm.notes}
                        onChange={e => setControlledForm({ ...controlledForm, notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-amber-500 text-right resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-slate-100">
                      <button 
                        type="button"
                        onClick={() => setIsControlledFormOpen(false)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition">
                        إلغاء وفك السلة
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md shadow-amber-600/10 transition">
                        اعتماد التوقيع وصرف الفاتورة
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

      {/****************** TAB 3: MEDICINES DIRECTORY ******************/}
      {activeTab === 'medicines' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <h3 className="font-extrabold text-slate-900 text-sm">دليل الأدوية المسجلة وتفاصيل التخزين والرفوف</h3>
            
            {/* Search Controls */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="ابحث بالاسم، المادة الفعالة، أو الباركود..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pr-9 pl-3 text-xs outline-none focus:border-emerald-500"
                />
              </div>
              <div className="w-fit">
                <select 
                  value={selectedCategory} 
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs outline-none">
                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Medicines Desktop Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200">
                  <th className="p-3">باركود الصنف</th>
                  <th className="p-3">اسم المنتج الطبي</th>
                  <th className="p-3">الفئة العلاجية</th>
                  <th className="p-3">المادة الفعالة</th>
                  <th className="p-3 text-center">الرمز بالخزينة (الرف)</th>
                  <th className="p-3 text-center">الرصيد المتاح</th>
                  <th className="p-3 text-center">الأقرب انتهاءً</th>
                  <th className="p-3 text-center">سعر البيع</th>
                  <th className="p-3 text-left">التحكم والعمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredMedicines.map(med => {
                  const today = new Date();
                  const isExpired = new Date(med.expiryDate) <= today;
                  const isLow = med.stock <= (med.minStock || 10);

                  return (
                    <tr key={med.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono text-slate-400">{med.code}</td>
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex flex-col gap-1.5 max-w bg-white">
                          <span>{med.name}</span>
                          <div className="flex flex-wrap gap-1">
                            {med.isControlled && (
                              <span className="bg-amber-100 text-amber-850 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-amber-200 w-fit">
                                ⚠️ دواء مراقب جدول
                              </span>
                            )}
                          </div>
                          
                          {/* Display all active physical batches using product_batches schema */}
                          {allBatches.some(b => b.productId === med.id) && (
                            <div className="flex flex-col gap-1 border-t border-slate-100 pt-1.5 w-full">
                              <span className="text-[10px] text-slate-400 font-extrabold block">تشغيلات المخزن الفعلية (FIFO/FEFO):</span>
                              <div className="flex flex-wrap gap-1">
                                {allBatches.filter(b => b.productId === med.id).map(b => {
                                  const exp = new Date(b.expiryDate);
                                  const expired = exp <= new Date();
                                  return (
                                    <span key={b.id} className={`font-mono text-[9px] px-2 py-0.5 rounded border flex items-center gap-1.5 ${
                                      expired ? 'bg-red-50 text-red-700 border-red-200' : 'bg-indigo-50 text-indigo-700 border-indigo-150'
                                    }`}>
                                      📦 No. {b.batchNumber} ({b.quantityAtomic} وحدة) | EXP: {b.expiryDate} {expired && '⚠️ منتهي'}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Display all active units using product_units schema */}
                          {allUnits.some(u => u.productId === med.id) && (
                            <div className="flex flex-col gap-1 border-t border-dashed border-slate-100 pt-1 w-full text-[9px]">
                              <span className="text-[10px] text-slate-400 font-extrabold block">جدول وحدات التجزئة والتسعير:</span>
                              <div className="flex flex-wrap gap-1">
                                {allUnits.filter(u => u.productId === med.id).map(u => (
                                  <span key={u.id} className="bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                                    {u.unitName} (معامل: {u.conversionFactor}) = <strong className="text-emerald-700 font-mono font-black">{u.price} ج.م</strong>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-slate-500">
                        <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px]">{med.category}</span>
                      </td>
                      <td className="p-3 text-slate-400 italic font-mono">{med.activeIngredient || 'مسجّل كمنتج'}</td>
                      <td className="p-3 text-center font-bold text-slate-500">{med.shelfLocation || '--'}</td>
                      <td className="p-3 text-center">
                        <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${isLow ? 'bg-red-50 text-red-600 font-extrabold font-mono' : 'text-slate-800'}`}>
                          {med.stock} وحدة
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-mono text-[11px] ${isExpired ? 'text-red-600 font-black' : 'text-slate-500'}`}>
                          {med.expiryDate} {isExpired && '⚠️'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-emerald-600">{med.price} ج.م</td>
                      <td className="p-3 text-left">
                        <div className="flex items-center gap-1.5 justify-end">
                          {isExpired && (
                            <button 
                              onClick={() => writeOffExpired(med)}
                              className="bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition text-[10px] font-bold"
                              title="إعدام أدوية تالفة وتسجيل قيود الخسائر">
                              شطب هالِك
                            </button>
                          )}
                          <button 
                            onClick={() => openEditMedicine(med)}
                            className="text-slate-400 hover:text-emerald-600 p-1">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => triggerDelete(med.id, 'medicine')}
                            className="text-slate-400 hover:text-red-500 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMedicines.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                      لا يوجد دواء مطابق لبحثك، يرجى النقر على "إدخال دواء جديد" لإضافة الصنف
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/****************** TAB 4: ELECTRONIC PRESCRIPTIONS, INSURANCE & ARCHIVING ******************/}
      {activeTab === 'prescriptions' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-right">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">شاشة إدارة الروشتات، التأمينات والتعاقدات المفتوحة (Insurance & Prescriptions Copies)</h3>
              <p className="text-xs text-slate-500 mt-1">
                التحكم بالروشتات الإلكترونية المحوّلة، وأرشفة الروشتات الطبية للأدوية المراقبة (الجدول)، وإدارة مطالبات شركات التأمينات والنقابات.
              </p>
            </div>
          </div>

          {/* Sub Navigation Inside Prescriptions Tab */}
          <div className="flex flex-wrap border-b border-slate-200 gap-1">
            <button
              onClick={() => setPrescSubTab('electronic')}
              className={`pb-3 px-4 text-xs font-bold transition-all relative ${
                prescSubTab === 'electronic' 
                  ? 'text-emerald-600 border-b-2 border-emerald-500 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📋 روشتات إلكترونية محولة ({prescriptions.filter(p => !p.isManualArchived).length})
            </button>
            <button
              onClick={() => setPrescSubTab('manual')}
              className={`pb-3 px-4 text-xs font-bold transition-all relative ${
                prescSubTab === 'manual' 
                  ? 'text-emerald-600 border-b-2 border-emerald-500 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📁 أرشيف الروشتات الورقية والمراقبة ({prescriptions.filter(p => p.isManualArchived).length})
            </button>
            <button
              onClick={() => setPrescSubTab('contracts')}
              className={`pb-3 px-4 text-xs font-bold transition-all relative ${
                prescSubTab === 'contracts' 
                  ? 'text-emerald-600 border-b-2 border-emerald-500 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              💼 عروض وجهات التعاقد التأميني ({insuranceCompanies.length})
            </button>
            <button
              onClick={() => setPrescSubTab('claims')}
              className={`pb-3 px-4 text-xs font-bold transition-all relative ${
                prescSubTab === 'claims' 
                  ? 'text-emerald-600 border-b-2 border-emerald-500 font-extrabold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🛡️ سجل مطالبات مبيعات التأمين ({sales.filter(s => s.isInsuranceSale).length})
            </button>
          </div>

          {/* Sub-tab 1: e-Prescriptions */}
          {prescSubTab === 'electronic' && (
            <div className="space-y-4 pt-2">
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-800 leading-relaxed font-bold">
                ⚠️ ينصح بمطابقة باركود عبوات الأدوية وتاريخ صلاحيتها المخزني قبل إتمام ترحيل الصرف لضمان استقرار نظام الـ FIFO المالي في الصيدلية.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prescriptions.filter(p => !p.isManualArchived).map(presc => {
                  const isDispensed = presc.status === 'تم الصرف';
                  return (
                    <div 
                      key={presc.id} 
                      className={`p-4 border rounded-2xl flex flex-col justify-between space-y-3 transition-all ${isDispensed ? 'bg-slate-50/70 border-slate-200 opacity-60' : 'bg-white border-emerald-200 hover:border-emerald-500 hover:shadow-md'}`}>
                      
                      <div className="flex justify-between items-start">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 font-mono block">الروشتة المحولة رقم #{presc.id}</span>
                          <h4 className="font-extrabold text-slate-800 text-sm mt-1">{presc.patientName}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">الطبيب كاتب الروشتة: {presc.doctorName}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isDispensed ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-800 animate-pulse'}`}>
                          {presc.status}
                        </span>
                      </div>

                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-2 text-right">
                        <strong className="text-slate-500 text-[10px] block">العقاقير وتوجيهات الصيدلي:</strong>
                        {presc.medicines.map((m: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-slate-700">
                            <span>💊 {m.medicineName}</span>
                            <span className="text-slate-400 font-bold">جرعة: {m.dosage} (عدد {m.quantity})</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {presc.date}
                        </span>
                        {!isDispensed ? (
                          <button 
                            onClick={() => dispensePrescription(presc)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1 transition">
                            <Check className="w-4 h-4" />
                            <span>تحميل الفاتورة والصرف الآن</span>
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold text-xs flex items-center gap-1">
                            <Check className="w-4 h-4" /> تم الصرف والترحيل المالي
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {prescriptions.filter(p => !p.isManualArchived).length === 0 && (
                  <div className="col-span-full py-16 text-center text-slate-400 text-xs">
                    لم يتم تحويل أي روشتات طبية إلكترونية من المركز الطبي حتى الآن.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Manual Prescription Archiving */}
          {prescSubTab === 'manual' && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form to Archv manual prescription */}
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!manualFormPatientName || !manualFormDoctorName) {
                      error('الرجاء كتابة اسم المريض واسم الطبيب كاتب الروشتة أولاً.');
                      return;
                    }
                    try {
                      await db.pharmacyPrescriptions.add({
                        patientName: manualFormPatientName,
                        doctorName: manualFormDoctorName,
                        date: manualFormDate,
                        status: 'مؤرشفة ورقياً',
                        isManualArchived: true,
                        prescriptionFileBase64: manualFormFileBase64,
                        medicines: manualFormMedicines,
                        notes: manualFormNotes
                      });
                      success('🎉 تم أرشفة الروشتة الورقية وسجل أدوية الجدول بنجاح تام!');
                      // Reset values
                      setManualFormPatientName('سفيتلانا أولغا');
                      setManualFormDoctorName('د. ياروسلاف كوزنيتسوف');
                      setManualFormFileBase64('');
                      setManualFormMedicines([{ medicineName: 'Amoxicillin 500mg', quantity: 1, dosage: 'كبسولة كل 12 ساعة' }]);
                    } catch (err) {
                      error('حدث خطأ أثناء حفظ الأرشفة المحلية.');
                    }
                  }}
                  className="lg:col-span-1 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-right space-y-4"
                >
                  <h4 className="font-black text-slate-800 text-xs border-b border-slate-200 pb-2">➕ أرشفة روشتة ورقية جديدة (مع الرقابة)</h4>
                  
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">اسم المريض (تأكيد الهوية للجدول)</label>
                      <input 
                        type="text"
                        value={manualFormPatientName}
                        onChange={e => setManualFormPatientName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none"
                        placeholder="مثال: ياروسلاف ميكولا"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">اسم الطبيب المعالج والختم الدائري</label>
                      <input 
                        type="text"
                        value={manualFormDoctorName}
                        onChange={e => setManualFormDoctorName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none"
                        placeholder="مثال: د. بوهدان رومان"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">تاريخ تحرير الروشتة</label>
                        <input 
                          type="date"
                          value={manualFormDate}
                          onChange={e => setManualFormDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-700 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">الرقم التعريفي</label>
                        <input 
                          type="text"
                          defaultValue="UA-823947"
                          className="w-full bg-slate-100 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-400 font-bold cursor-not-allowed"
                          disabled
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1.5 flex justify-between items-center">
                        <span>الأدوية الموصوفة بداخل الطرد ورقية:</span>
                        <button 
                          type="button" 
                          onClick={() => setManualFormMedicines(prev => [...prev, { medicineName: '', quantity: 1, dosage: 'كبسولة يومياً' }])}
                          className="text-emerald-600 hover:text-emerald-700 text-[9px] font-black underline"
                        >
                          + إضافة دواء
                        </button>
                      </label>
                      
                      <div className="space-y-2">
                        {manualFormMedicines.map((item, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-lg border border-slate-150 space-y-1.5 relative">
                            {manualFormMedicines.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => setManualFormMedicines(prev => prev.filter((_, i) => i !== idx))}
                                className="absolute left-1 top-1 text-red-500 text-[10px]"
                              >
                                ✕
                              </button>
                            )}
                            <input 
                              type="text"
                              value={item.medicineName}
                              onChange={e => {
                                const val = e.target.value;
                                setManualFormMedicines(prev => prev.map((item, i) => i === idx ? { ...item, medicineName: val } : item));
                              }}
                              className="w-full bg-slate-50 border border-slate-100 rounded px-1.5 py-1 text-[11px] font-bold"
                              placeholder="اسم الدواء كلياً"
                              required
                            />
                            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                              <div>
                                <input 
                                  type="number"
                                  value={item.quantity}
                                  onChange={e => {
                                    const val = Math.max(1, Number(e.target.value));
                                    setManualFormMedicines(prev => prev.map((item, i) => i === idx ? { ...item, quantity: val } : item));
                                  }}
                                  className="w-full border rounded px-1.5 py-0.5"
                                  placeholder="الكمية"
                                  title="الكمية"
                                />
                              </div>
                              <div>
                                <input 
                                  type="text"
                                  value={item.dosage}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setManualFormMedicines(prev => prev.map((item, i) => i === idx ? { ...item, dosage: val } : item));
                                  }}
                                  className="w-full border rounded px-1 text-[10px]"
                                  placeholder="الجرعة"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Image Attachment base64 */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">نسخة صورة الروشتة (طبيعة الرقابة للتفتيش)</label>
                      <div 
                        className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-white p-3 rounded-lg text-center cursor-pointer transition"
                        onClick={() => document.getElementById('manual-upload-presc-el')?.click()}
                      >
                        <input 
                          id="manual-upload-presc-el"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setManualFormFileBase64(reader.result as string);
                                success('تم التقاط الصورة المؤرشفة بنجاح!');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {manualFormFileBase64 ? (
                          <div className="space-y-1">
                            <span className="text-[10px] text-emerald-600 font-bold block">✓ تم دمج كبسولة الملف (Base64)</span>
                            <img src={manualFormFileBase64} alt="Pre-upload" className="max-h-16 mx-auto rounded object-contain border" referrerPolicy="no-referrer" />
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[10px]">
                            <p className="font-bold text-slate-500">📥 اختر صورة أو التقط بكاميرا الجوال</p>
                            <span className="text-[9px] text-slate-400">للحفاظ على ملفات التفتيش الصيدلي كاملاً أوفلاين</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition"
                  >
                    💾 ترحيل وحفظ الأرشيف الرقمي للروشتة
                  </button>
                </form>

                {/* Grid of manual prescriptions */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-slate-800 text-xs">سجل الروشتات الورقية المؤرشفة للتفتيش الرقابي الصيدلاني</h4>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                      العدد الإجمالي: {prescriptions.filter(p => p.isManualArchived).length} روشتة
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prescriptions.filter(p => p.isManualArchived).map(presc => (
                      <div key={presc.id} className="bg-slate-50/60 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
                        <div className="text-right">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[9px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-black font-mono">أرشيف يدوي ورقي</span>
                              <h5 className="font-black text-slate-800 text-xs mt-1.5">{presc.patientName}</h5>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono font-bold">{presc.date}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">الطبيب المحرر للروشتة: <strong className="text-slate-700 font-bold">{presc.doctorName}</strong></p>
                        </div>

                        <div className="bg-white p-2.5 rounded-lg border border-slate-150 text-[11px] space-y-1.5 text-right">
                          <span className="text-[9px] text-slate-400 block font-bold">العقاقير المؤرشفة:</span>
                          {presc.medicines?.map((m: any, i: number) => (
                            <div key={i} className="flex justify-between items-center text-slate-700 font-medium">
                              <span>💊 {m.medicineName}</span>
                              <span className="text-slate-400 text-[10px]">الكمية: {m.quantity} | {m.dosage}</span>
                            </div>
                          ))}
                        </div>

                        {presc.prescriptionFileBase64 ? (
                          <div className="pt-1.5 border-t border-slate-200">
                            <span className="text-[9px] text-slate-400 block mb-1 font-bold">المستند الطبي المؤرشف للتفتيش الجنائي/الصيدلي:</span>
                            <div className="inline-block relative group">
                              <img 
                                src={presc.prescriptionFileBase64} 
                                alt="Prescription Archival" 
                                className="w-16 h-16 rounded object-cover border border-slate-300 shadow-xs cursor-pointer hover:scale-105 transition-all"
                                onClick={() => {
                                  // Open new tab or window mock of full base64 image
                                  const win = window.open();
                                  if (win) {
                                    win.document.write(`<img src="${presc.prescriptionFileBase64}" style="max-width:100%;" />`);
                                  } else {
                                    success('يتم عرض الصورة المؤرشفة الكبيرة بتفاصيل كاملة');
                                  }
                                }}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 font-bold">
                            ⚠️ لا توجد صورة مرفقة مع الروشتة الورقية. يوصى برفع الصورة لإثبات الأرشفة القانونية.
                          </div>
                        )}
                      </div>
                    ))}

                    {prescriptions.filter(p => p.isManualArchived).length === 0 && (
                      <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                        لم يتم أرشفة أي روشتات يدوية ورقية حتى الآن. أضف الروشتة الأولى من خلال النموذج الأيمن.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Sub-tab 3: Insurance Contracts */}
          {prescSubTab === 'contracts' && (
            <div className="space-y-6 pt-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs">سجل عقود وخصومات شركات الرعاية الطبية والتأمينية المتفق عليها</h4>
                  <p className="text-[11px] text-slate-400">هذه النسب يتم تطبيقها وخصمها تلقائياً على فاتورة الـ POS كجهة تحمل (Co-payment) مع الصرف اللحظي للقيود المحاسبية.</p>
                </div>
                <button 
                  onClick={() => setIsAddingContract(!isAddingContract)}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1 transition"
                >
                  {isAddingContract ? '✕ إلغاء نموذج الإضافة' : '➕ إضافة عقد تأميني جديد'}
                </button>
              </div>

              {isAddingContract && (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!contractForm.name) {
                      error('الرجاء تعبئة اسم الشركة المتعاقد معها');
                      return;
                    }
                    try {
                      await db.clinicInsuranceCompanies.add({
                        name: contractForm.name,
                        companyName: contractForm.name,
                        discountRate: Number(contractForm.discountRate),
                        coveragePercent: Number(contractForm.discountRate),
                        contactPerson: contractForm.contactPerson,
                        phone: contractForm.phone,
                        notes: contractForm.notes,
                        isActive: true
                      });
                      success('🎉 تم تسجيل العقد الطبي وصياغة نسبة تحمل الفاتورة تلقائياً!');
                      setIsAddingContract(false);
                      setContractForm({
                        name: '',
                        discountRate: 80,
                        contactPerson: 'ياروسلاف بوهدان',
                        phone: '+380671234567',
                        notes: 'تحت رعاية الفحص والتأمينات المباشرة'
                      });
                    } catch(err) {
                      error('فشل حفظ العقد الطبي');
                    }
                  }}
                  className="bg-sky-50/50 p-4 rounded-xl border border-sky-100 grid grid-cols-1 md:grid-cols-5 gap-3 text-right"
                >
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">اسم النقابة أو جهة التعاقد</label>
                    <input 
                      type="text"
                      value={contractForm.name}
                      onChange={e => setContractForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none"
                      placeholder="مثال: نقابة صيادلة أوكرانيا"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">نسبة تحمل التأمينات (Discount/Rate %)</label>
                    <input 
                      type="number"
                      value={contractForm.discountRate}
                      onChange={e => setContractForm(prev => ({ ...prev, discountRate: Math.max(1, Math.min(100, Number(e.target.value))) }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none"
                      min="1"
                      max="100"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">الشخص المسؤول (Ukrainian Christian)</label>
                    <input 
                      type="text"
                      value={contractForm.contactPerson}
                      onChange={e => setContractForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">رقم الهاتف للتواصل</label>
                    <input 
                      type="text"
                      value={contractForm.phone}
                      onChange={e => setContractForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none"
                    />
                  </div>
                  <div className="flex items-end">
                    <button 
                      type="submit"
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 rounded-lg text-xs transition"
                    >
                      💾 تثبيت وحفظ العقد
                    </button>
                  </div>
                </form>
              )}

              {/* Table of contracts */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold">
                      <th className="p-3">رقم العقد</th>
                      <th className="p-3">اسم الجهة المتعاقدة</th>
                      <th className="p-3 text-center">نسبة تغطية التأمينات</th>
                      <th className="p-3 text-center">نسبة تحمل المريض</th>
                      <th className="p-3">مسؤول التواصل</th>
                      <th className="p-3">رقم الهاتف</th>
                      <th className="p-3 text-center">حالة العقد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insuranceCompanies.map(c => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-slate-500">#{c.id}</td>
                        <td className="p-3 font-extrabold text-slate-800">{c.name || c.companyName}</td>
                        <td className="p-3 text-center font-black text-sky-600 font-mono">{c.discountRate || c.coveragePercent || 80}%</td>
                        <td className="p-3 text-center font-black text-slate-600 font-mono">{100 - (c.discountRate || c.coveragePercent || 80)}%</td>
                        <td className="p-3 text-slate-600 font-medium">{c.contactPerson || 'تاراس بوهدان'}</td>
                        <td className="p-3 font-mono text-slate-500">{c.phone || '+380-67-124-567'}</td>
                        <td className="p-3 text-center">
                          <span className="bg-green-100 text-green-800 text-[9px] font-black px-2 py-0.5 rounded-full inline-block">نشط وساري</span>
                        </td>
                      </tr>
                    ))}
                    {/* Fallback mock display if empty */}
                    {insuranceCompanies.length === 0 && (
                      <>
                        <tr className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-slate-500">#9991</td>
                          <td className="p-3 font-extrabold text-slate-800">التأمين الصحي الشامل</td>
                          <td className="p-3 text-center font-black text-sky-600 font-mono">80%</td>
                          <td className="p-3 text-center font-black text-slate-600 font-mono">20%</td>
                          <td className="p-3 text-slate-600 font-medium">ياروسلاف بوهدان</td>
                          <td className="p-3 font-mono text-slate-500">+380 97 121 445</td>
                          <td className="p-3 text-center">
                            <span className="bg-green-100 text-green-800 text-[9px] font-black px-2 py-0.5 rounded-full inline-block">نشط وساري</span>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50 transition">
                          <td className="p-3 font-mono font-bold text-slate-500">#9992</td>
                          <td className="p-3 font-extrabold text-slate-800">نقابة المهندسين المصرية</td>
                          <td className="p-3 text-center font-black text-sky-600 font-mono">70%</td>
                          <td className="p-3 text-center font-black text-slate-600 font-mono">30%</td>
                          <td className="p-3 text-slate-600 font-medium">ميكولا أولغا</td>
                          <td className="p-3 font-mono text-slate-500">+380 67 112 559</td>
                          <td className="p-3 text-center">
                            <span className="bg-green-100 text-green-800 text-[9px] font-black px-2 py-0.5 rounded-full inline-block">نشط وساري</span>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab 4: Insurance Claims */}
          {prescSubTab === 'claims' && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Math Stats Box 1 */}
                <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl text-right">
                  <span className="text-[10px] font-black text-sky-800 block">💸 ذمم تأمين طبي معلقة مستحقة للصيدلية</span>
                  <strong className="text-xl font-black text-sky-900 mt-1 block">
                    {sales.filter(s => s.isInsuranceSale).reduce((sum, s) => sum + (s.insuranceShareAmount || 0), 0).toFixed(2)} ج.م
                  </strong>
                  <span className="text-[9px] text-slate-400 block mt-1">تترحل تلقائياً على حساب الـ AR (مديونيات مستحقة)</span>
                </div>

                {/* Math Stats Box 2 */}
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-right">
                  <span className="text-[10px] font-black text-emerald-800 block">💰 كاش المحفظة المحصل من المرضى (تحمل)</span>
                  <strong className="text-xl font-black text-emerald-900 mt-1 block">
                    {sales.filter(s => s.isInsuranceSale).reduce((sum, s) => sum + (s.patientShareAmount || 0), 0).toFixed(2)} ج.م
                  </strong>
                  <span className="text-[9px] text-slate-400 block mt-1">دخلت فوراً إلى الصندوق نقوداً</span>
                </div>

                {/* Math Stats Box 3 */}
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl text-right">
                  <span className="text-[10px] font-black text-purple-800 block">📁 فواتير تأمين متضمنة وثائق مؤرشفة</span>
                  <strong className="text-xl font-black text-purple-900 mt-1 block">
                    {sales.filter(s => s.isInsuranceSale && s.prescriptionFileBase64).length} فاتورة مدعمة بالدليل
                  </strong>
                  <span className="text-[9px] text-slate-400 block mt-1">تم التحقق من صور الروشتات لمطابقة هيئة التفتيش</span>
                </div>
              </div>

              {/* List of Sales Claims */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold">
                      <th className="p-3">رقم الفاتورة</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">اسم المريض (العميل)</th>
                      <th className="p-3">جهة التعاقد</th>
                      <th className="p-3 text-center">القيمة الإجمالية</th>
                      <th className="p-3 text-center">تحمل المريض (فاتورة)</th>
                      <th className="p-3 text-center">تحمل التأمينات (مستحق)</th>
                      <th className="p-3 text-center">أرشيف الروشتة المرفقة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.filter(s => s.isInsuranceSale).map(sale => (
                      <tr key={sale.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-slate-500">#{sale.id}</td>
                        <td className="p-3 font-mono text-slate-500">{sale.date}</td>
                        <td className="p-3 font-extrabold text-slate-800">{sale.customerName}</td>
                        <td className="p-3 font-bold text-sky-700">{sale.insuranceName || 'التأمين الطبي'}</td>
                        <td className="p-3 text-center font-bold text-slate-700 font-mono">{sale.total} ج.م</td>
                        <td className="p-3 text-center font-bold text-emerald-600 font-mono">{(sale.patientShareAmount || 0).toFixed(2)} ج.م ({sale.patientSharePercent}%)</td>
                        <td className="p-3 text-center font-bold text-sky-600 font-mono">{(sale.insuranceShareAmount || 0).toFixed(2)} ج.م ({sale.insuranceSharePercent}%)</td>
                        <td className="p-3 text-center">
                          {sale.prescriptionFileBase64 ? (
                            <img 
                              src={sale.prescriptionFileBase64} 
                              alt="Claim document proof" 
                              className="w-10 h-10 object-contain mx-auto rounded border shadow-xs cursor-pointer hover:scale-105 transition"
                              onClick={() => {
                                const win = window.open();
                                if (win) {
                                  win.document.write(`<img src="${sale.prescriptionFileBase64}" style="max-width:100%;" />`);
                                }
                              }}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-amber-600 text-[10px] font-bold">بدون مرفق للروشتة</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {sales.filter(s => s.isInsuranceSale).length === 0 && (
                      <tr className="border-b">
                        <td colSpan={8} className="py-16 text-center text-slate-400 text-xs">
                          لا توجد أي مبيعات تأمين طبي مسجلة في نظام الـ POS حالياً. قم ببيع الأدوية مع تفعيل التأمينات ليظهر هاهنا.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/****************** TAB 5: PROCUREMENT, PURCHASES & RETURNS ******************/}
      {activeTab === 'purchases' && (
        <div className="space-y-4 text-right">
          {/* Sub-Header Stats Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-2xl border border-indigo-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">صافي قيمة مشتريات وتوريد الأدوية</span>
                <span className="text-xl font-black text-indigo-700 font-mono">
                  {purchases.reduce((sum, p) => sum + (p.total || 0), 0).toLocaleString()} ج.م
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">إجمالي الفواتير المحاسبية المبرمة بالخزينة</span>
              </div>
              <div className="bg-indigo-100/50 text-indigo-600 p-3 rounded-xl">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-white p-5 rounded-2xl border border-rose-100 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">المرتجع للشركات والمصانع</span>
                <span className="text-xl font-black text-rose-700 font-mono">
                  {returns.reduce((sum, r) => sum + (r.total || 0), 0).toLocaleString()} ج.م
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">تمت تصفيتها كخصم من المدفوعات أو نقدية</span>
              </div>
              <div className="bg-rose-100/50 text-rose-600 p-3 rounded-xl">
                <TrendingDown className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {/* Toggle bar */}
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">حركة التوريد والارتجاع مع الشركات الموردة</h3>
                <p className="text-xs text-slate-500 mt-0.5">الربط والمزامنة المحاسبية الفورية للمشتريات مع الحسابات العامة للصيدلية والمركز الطبي.</p>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setPurchaseSubTab('bills')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${purchaseSubTab === 'bills' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  📥 فواتير الشراء والتوريد ({purchases.length})
                </button>
                <button
                  onClick={() => setPurchaseSubTab('returns')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${purchaseSubTab === 'returns' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  📤 المرتجعات والتسويات الدائنة ({returns.length})
                </button>
              </div>
            </div>

            {purchaseSubTab === 'bills' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200">
                      <th className="p-3">رقم التوريد</th>
                      <th className="p-3">اسم الشركة الموردة</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3 text-center">صافي الفاتورة المعتمد</th>
                      <th className="p-3 text-center">حالة الحساب المالي</th>
                      <th className="p-3 text-left">التحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                    {purchases.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono text-slate-400">PHA-PUR-{p.id}</td>
                        <td className="p-3 font-bold text-slate-900">{p.supplierName}</td>
                        <td className="p-3 text-slate-500">{p.date}</td>
                        <td className="p-3 text-center font-bold text-emerald-600">{p.total} ج.م</td>
                        <td className="p-3 text-center">
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg text-[10px]">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-left">
                          <button 
                            onClick={() => triggerDelete(p.id, 'purchase')}
                            className="text-slate-400 hover:text-red-500 p-1">
                            <Trash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {purchases.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">لا توجد سجلات فواتير في الصيدلية حالياً</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Elastic Returns Search Bar */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <div className="relative w-full sm:w-96">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      value={returnSearchQuery}
                      onChange={e => setReturnSearchQuery(e.target.value)}
                      placeholder="ابحث برقم الفاتورة، باركود الـ Batch أو اسم الدواء لتحديد المصدر..."
                      className="w-full bg-white border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs outline-none focus:border-rose-500"
                    />
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block"></span>
                    <span>مرتجع عملاء</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block ms-3"></span>
                    <span>مرتجع شركات</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200">
                        <th className="p-3">رقم المرتجع</th>
                        <th className="p-3">طبيعة المعاملة</th>
                        <th className="p-3">الطرف الثاني في المستند</th>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3 text-center">الكميات والأصناف</th>
                        <th className="p-3 text-center">إجمالي القيمة المستردة</th>
                        <th className="p-3 text-center">الحالة بالدفاتر اللوجستية</th>
                        <th className="p-3 text-left">التحكم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {(() => {
                        const query = returnSearchQuery.toLowerCase().trim();
                        const filtered = returns.filter(r => {
                          if (!query) return true;
                          const idMatch = `pha-ret-${r.id}`.includes(query) || String(r.id).includes(query);
                          const partyMatch = (r.customerName || r.supplierName || '').toLowerCase().includes(query);
                          const statusMatch = (r.status || '').toLowerCase().includes(query);
                          const itemsMatch = r.items?.some((it: any) => 
                            (it.name || '').toLowerCase().includes(query) || 
                            (it.batchNumber || '').toLowerCase().includes(query)
                          );
                          return idMatch || partyMatch || statusMatch || itemsMatch;
                        });

                        return filtered.map(r => {
                          const isCustomerType = r.type === 'customer';
                          return (
                            <tr key={r.id} className="hover:bg-slate-50 transition">
                              <td className="p-3 font-mono text-slate-400 font-extrabold text-[11px]">
                                {isCustomerType ? `PHA-RET-C-${r.id}` : `PHA-RET-S-${r.id}`}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isCustomerType ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {isCustomerType ? '🔄 مرتجع من عميل' : '📤 مرتجع إلى شركة'}
                                </span>
                              </td>
                              <td className="p-3 font-bold text-slate-900">
                                {isCustomerType ? (r.customerName || 'زبون نقدي') : (r.supplierName || 'غير مسماة')}
                              </td>
                              <td className="p-3 text-slate-500 font-mono text-[11px]">{r.date}</td>
                              <td className="p-3 text-center">
                                <div className="inline-flex flex-col gap-1 items-center">
                                  {r.items?.map((it: any, i: number) => (
                                    <div key={i} className="text-[10px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 font-sans">
                                      {it.name} ({it.quantity} وحدة) {it.batchNumber && <span className="font-mono text-[9px] text-slate-400">| دفعة {it.batchNumber}</span>}
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="p-3 text-center font-bold text-slate-900 font-mono text-[11px]">{r.total} ج.م</td>
                              <td className="p-3 text-center">
                                <span className={`font-bold px-2.5 py-1 rounded-lg text-[10px] ${
                                  (r.status === 'تحت الفحص' || r.status?.includes('فحص')) ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {isCustomerType ? 'مقبول ومكتمل' : (r.status || 'تحت الفحص')}
                                </span>
                              </td>
                              <td className="p-3 text-left">
                                <button 
                                  onClick={() => triggerDelete(r.id, 'return')}
                                  className="text-slate-400 hover:text-red-500 p-1"
                                  title="حذف القيد اللوجستي والمالي">
                                  <Trash className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                      {returns.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-12 text-center text-slate-400 text-xs">لا توجد سجلات أدوية مرتجعة أو تحت الفحص حالياً في الصيدلية</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/****************** TAB 6: EXPIRY & ANALYTICS REPORTS ******************/}
      {activeTab === 'reports' && (
        <div className="space-y-6 text-right">

          {/* Core Analytics Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">المنتجات منتهية / قريبة الانتهاء</span>
                <span className="text-2xl font-black text-rose-600 font-mono">
                  {medicines.filter(m => {
                    const diffDays = Math.ceil((new Date(m.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return diffDays <= 180;
                  }).length} صنوف
                </span>
              </div>
              <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">الأصناف تحت حد إعادة الطلب (النواقص)</span>
                <span className="text-2xl font-black text-amber-600 font-mono">
                  {medicines.filter(m => m.stock <= (m.minStock || 10)).length} أدوية
                </span>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي الحالات المسجلة بالجدول</span>
                <span className="text-2xl font-black text-indigo-600 font-mono">
                  {sales.filter(s => s.controlledRegistryInfo).length} مريضا
                </span>
              </div>
              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                <FileCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Segment 1: Expiry Alerts Module */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="bg-amber-100 text-amber-800 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit mb-1.5 font-sans">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> تنبيه الصلاحية الصامت الملون
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm">أولاً: أداة مراقبة وتنبيهات انتهاء الصلاحية الجردية</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  الترتيب التلقائي للأدوية حسب مصفوفة الـ FEFO (الأقرب انتهاءً أولاً). <span className="text-amber-700 font-bold">باقي على صلاحيتها أقل من 6 شهور تظهر باللون الأصفر</span>، و <span className="text-rose-700 font-bold">أقل من 3 شهور باللون الأحمر</span> لتسهيل تتبعها وإرجاعها للموردين.
                </p>
              </div>

              {/* Interactive filters */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setExpiryFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${expiryFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}>
                  الكل
                </button>
                <button 
                  onClick={() => setExpiryFilter('expired')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${expiryFilter === 'expired' ? 'bg-red-650 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}>
                  منتهي بالفعل 🚫
                </button>
                <button 
                  onClick={() => setExpiryFilter('3months')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${expiryFilter === '3months' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}>
                  خلال ٣ أشهر ⚠️
                </button>
                <button 
                  onClick={() => setExpiryFilter('6months')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${expiryFilter === '6months' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}>
                  خلال ٦ أشهر ⚡
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200">
                    <th className="p-3">اسم المنتج الطبي</th>
                    <th className="p-3">المورد الموصى به</th>
                    <th className="p-3 font-medium">الفئة العلاجية</th>
                    <th className="p-3 font-medium text-slate-500">المادة الفعالة</th>
                    <th className="p-3 text-center">الرمز بالرف</th>
                    <th className="p-3 text-center">الرصيد المتاح</th>
                    <th className="p-3 text-center">تاريخ انتهاء الصلاحية</th>
                    <th className="p-3 text-center">المتبقي للصلاحية</th>
                    <th className="p-3 text-left">الملخص الجردي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-sans">
                  {medicines
                    .filter(med => {
                      const today = new Date();
                      const exp = new Date(med.expiryDate);
                      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      if (expiryFilter === 'expired') return diffDays <= 0;
                      if (expiryFilter === '3months') return diffDays > 0 && diffDays <= 90;
                      if (expiryFilter === '6months') return diffDays > 0 && diffDays <= 180;
                      return true;
                    })
                    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
                    .map(med => {
                      const today = new Date();
                      const exp = new Date(med.expiryDate);
                      const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      
                      let statusLabel = '';
                      let statusBg = ''; // row styling
                      let badgeStyle = '';
                      if (diffDays <= 0) {
                        statusLabel = 'منتهي الصلاحية 🚫 شطب فوري!';
                        statusBg = 'bg-red-50 text-red-950 font-medium hover:bg-slate-50/80 border-r-4 border-r-red-550';
                        badgeStyle = 'bg-red-600 text-white font-extrabold';
                      } else if (diffDays <= 90) {
                        statusLabel = `ينتهي خلال مده حرجة جداً (${diffDays} يوم)`;
                        statusBg = 'bg-rose-50/50 text-rose-950 hover:bg-slate-50/70 border-r-4 border-r-rose-450';
                        badgeStyle = 'bg-rose-600 text-white font-black animate-pulse';
                      } else if (diffDays <= 180) {
                        statusLabel = `ينتهى خلال ٦ شهور تنبيه صامت (${diffDays} يوم)`;
                        statusBg = 'bg-yellow-50/40 text-yellow-950 hover:bg-slate-50/75 border-r-4 border-r-amber-450';
                        badgeStyle = 'bg-amber-500 text-slate-900 font-bold';
                      } else {
                        statusLabel = 'صالح ومستقر وآمن';
                        statusBg = 'hover:bg-slate-50';
                        badgeStyle = 'bg-emerald-50 text-emerald-800';
                      }

                      return (
                        <tr key={med.id} className={`transition ${statusBg}`}>
                          <td className="p-3 font-bold">
                            <div className="flex flex-col">
                              <span className="text-slate-900 text-xs">{med.name}</span>
                              {med.isControlled && <span className="text-[9px] text-amber-600 font-bold">⚠️ صنف مراقب بالجدول</span>}
                            </div>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">
                            {med.supplierName || 'شركة أندري الطبية'}
                          </td>
                          <td className="p-3 text-slate-600">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px]">{med.category}</span>
                          </td>
                          <td className="p-3 text-slate-400 italic font-mono">{med.activeIngredient || 'مسجّل'}</td>
                          <td className="p-3 text-center font-mono text-slate-500">{med.shelfLocation || '--'}</td>
                          <td className="p-3 text-center font-bold text-slate-850">{med.stock} وحدة</td>
                          <td className="p-3 text-center font-mono text-slate-650 font-bold">{med.expiryDate}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${badgeStyle}`}>{statusLabel}</span>
                          </td>
                          <td className="p-3 text-left">
                            <div className="flex items-center gap-1 justify-end">
                              {diffDays <= 0 ? (
                                <>
                                  <button 
                                    onClick={() => writeOffExpired(med)}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded-md text-[10px] transition">
                                    شطب هالِك
                                  </button>
                                  <button 
                                    onClick={() => triggerAutoSupplierReturn(med)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-2 rounded-md text-[10px] transition">
                                    استرجاع للمورد
                                  </button>
                                </>
                              ) : diffDays <= 180 ? (
                                <button 
                                  onClick={() => triggerAutoSupplierReturn(med)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-2.5 rounded-lg text-[10px] flex items-center gap-1 transition shadow-xs shadow-indigo-600/10">
                                  <RefreshCw className="w-3.5 h-3.5" /> إرجاع تلقائي للمورد
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[11px]">آمن بالرف الرئيسي</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Segment 2: Reorder Point & Smart Shortages Module */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="bg-violet-100 text-violet-850 text-violet-800 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit mb-1.5 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5" /> نظام النواقص وبطاقة الذكاء الاصطناعي الجردي
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm">ثانياً: دفتر وقائمة النواقص الذكائية التلقائية (AI Shortages Ledger)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  يتعقب السيستم فورياً صنف الدواء بمجرد وصول رصيده الحالي لـ <span className="font-bold text-slate-700">"حد إعادة الطلب الآمن"</span> أو ما دونه، ويتم إدراجه تلقائياً مع الشركة الموردة له في هذا الدفتر الممنهج بدون أي تدخل بشري لتأمين طلبات عاجلة.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200">
                    <th className="p-3">اسم الصنف الدوائي</th>
                    <th className="p-3">المورد المعتمد</th>
                    <th className="p-3 text-center">الرصيد الفعلي الحالي</th>
                    <th className="p-3 text-center">التنبيه (حد لإعادة التعبئة)</th>
                    <th className="p-3 text-center">مقدار العجز والقصور</th>
                    <th className="p-3 text-center">أماكن التخزين المفترضة</th>
                    <th className="p-3 text-left">التوريد وصياغة أمر الشراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {medicines
                    .filter(med => med.stock <= (med.minStock || 10))
                    .map(med => {
                      const minVal = med.minStock || 10;
                      const deficit = minVal - med.stock;

                      return (
                        <tr key={med.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-900">
                            <div className="flex flex-col">
                              <span>{med.name}</span>
                              <span className="text-[10px] text-slate-450 text-slate-400 italic font-mono">CODE: {med.code || '--'}</span>
                            </div>
                          </td>
                          <td className="p-3 font-mono font-bold text-slate-700">
                            {med.supplierName || 'شركة أندري الطبية'}
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-rose-100 text-rose-850 font-extrabold px-2.5 py-0.5 rounded font-mono text-[11px]">
                              {med.stock} وحدة
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-slate-600">{minVal} وحدة</td>
                          <td className="p-3 text-center animate-pulse">
                            <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">عجز بمقدار <span className="font-black font-mono">{deficit}</span> علب</span>
                          </td>
                          <td className="p-3 text-center font-mono text-slate-400">{med.shelfLocation || '--'}</td>
                          <td className="p-3 text-left">
                            <button 
                              onClick={() => triggerAutoSupplierPurchase(med)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1 px-3.5 rounded-lg text-[10px] transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/10">
                              <Plus className="w-3.5 h-3.5" /> صياغة أمر شراء
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {medicines.filter(med => med.stock <= (med.minStock || 10)).length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-400 font-bold">✓ كافة المسجلّات الطبية في الحدود الآمنة بالكامل! لا توجد نواقص بالدولاب.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Segment 3: Controlled Drugs Sales Logs Ledger */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">ثالثاً: دفتر قيد الأدوية المراقبة والأرشيف الرقابي الطبي</h3>
              <p className="text-xs text-slate-500 mt-0.5">سجل التدقيق القانوني لكافة المعاملات المالية والصرفية التي اشتملت على أدوية دولاب الجدول المغلق بالتفصيل.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200">
                    <th className="p-3">رقم الفاتورة</th>
                    <th className="p-3">تاريخ وقيد الصرف</th>
                    <th className="p-3">اسم المريض المستهلك</th>
                    <th className="p-3">الرقم القومي / الهوية</th>
                    <th className="p-3">الطبيب المعالج</th>
                    <th className="p-3 font-mono">كود الروشنة الطبية (Rx)</th>
                    <th className="p-3 text-center">المنتجات المنصرفة</th>
                    <th className="p-3 text-left">التفويض والروشتة والأرشيف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {sales
                    .filter(s => s.controlledRegistryInfo)
                    .map(sale => {
                      const reg = sale.controlledRegistryInfo;
                      return (
                        <tr key={sale.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold font-mono">#{sale.id}</td>
                          <td className="p-3 text-slate-500">{sale.date}</td>
                          <td className="p-3 font-bold text-slate-900">{reg.patientName}</td>
                          <td className="p-3 font-mono text-slate-500">{reg.patientNationalID}</td>
                          <td className="p-3 font-medium">{reg.doctorName}</td>
                          <td className="p-3 font-mono text-indigo-700 font-black">{reg.prescriptionNumber}</td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col text-[11px] gap-0.5 max-w-xs overflow-hidden text-right">
                              {sale.items.map((it: any, k: number) => (
                                <span key={k} className="truncate text-slate-700 bg-amber-50 text-amber-900 px-1 py-0.5 rounded text-[10px] w-fit">
                                  {it.name} (عدد {it.quantity})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3 text-left">
                            <button 
                              onClick={() => setSelectedRegistrySale(sale)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-3 rounded-lg text-[10px] flex items-center gap-1 transition">
                              <Eye className="w-3.5 h-3.5" /> عرض وثائق التفويض
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {sales.filter(s => s.controlledRegistryInfo).length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-6 text-slate-400 font-bold">لم يتم تسجيل مبيعات لأي أصناف مراقبة في السجل بعد.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Popup Overlay to verify and preview uploaded Rx Images */}
          {selectedRegistrySale && (
            <div className="fixed inset-0 z-55 bg-black/55 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-slate-200 shadow-2xl flex flex-col">
                <div className="bg-indigo-800 text-white py-3.5 px-5 flex justify-between items-center text-right">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5 shrink-0" />
                    <h3 className="font-extrabold text-sm">أرشيف التحقق من الروشتة والأكواد الطبية</h3>
                  </div>
                  <button onClick={() => setSelectedRegistrySale(null)} className="text-white hover:text-indigo-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 text-right space-y-3.5 text-xs text-slate-700">
                  <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 text-blue-900">
                    <strong>الرابط بالدفتر العام:</strong> تم صرف الروشتة وربطها محاسبياً بالقيد المالي للفاتورة رقم <span className="font-mono font-bold">#{selectedRegistrySale.id}</span> بنجاح.
                  </div>

                  <div className="space-y-2 border-b border-slate-100 pb-3">
                    <div className="flex justify-between"><strong>اسم المريض بالبوابة الطبية:</strong> <span className="font-bold">{selectedRegistrySale.controlledRegistryInfo.patientName}</span></div>
                    <div className="flex justify-between"><strong>الرقم القومي للمريض:</strong> <span className="font-mono font-bold text-slate-800">{selectedRegistrySale.controlledRegistryInfo.patientNationalID}</span></div>
                    <div className="flex justify-between"><strong>اسم الطبيب المفوّض بالصرف:</strong> <span className="font-bold text-slate-800">{selectedRegistrySale.controlledRegistryInfo.doctorName}</span></div>
                    <div className="flex justify-between"><strong>كود الروشتة الدائري:</strong> <span className="font-mono font-black text-indigo-700">{selectedRegistrySale.controlledRegistryInfo.prescriptionNumber}</span></div>
                    <div className="flex justify-between"><strong>حالة الختم والتحقق:</strong> <span>{selectedRegistrySale.controlledRegistryInfo.notes || 'تمت المصادقة الكترونيا'}</span></div>
                  </div>

                  <div>
                    <strong className="block mb-1.5 text-slate-600">صورة الروشتة الطبية والختم بالأرشيف:</strong>
                    {selectedRegistrySale.controlledRegistryInfo.prescriptionFileBase64 ? (
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 text-center">
                        <img 
                          src={selectedRegistrySale.controlledRegistryInfo.prescriptionFileBase64} 
                          alt="Medical Prescription Attachment" 
                          className="max-h-56 mx-auto object-contain rounded-lg shadow-xs"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="bg-slate-50 py-10 rounded-xl text-center border border-dashed border-slate-200 text-slate-400">
                        ⚠️ لا تتوفر صورة مستند لهذا الصيدلي (تمت التعبئة الكترونياً برمز التأكيد المركزي)
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-150 flex justify-end">
                  <button 
                    onClick={() => setSelectedRegistrySale(null)}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-1.5 px-4 rounded-xl text-xs transition">
                    إغلاق المعاينة
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/****************** MODAL: ADD / EDIT MEDICINE ******************/}
      {isMedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {medForm.id ? 'تعديل السجل السريري للدواء' : 'إضافة دواء مستجّد للخزانة الطبية'}
              </h3>
              <button 
                onClick={() => setIsMedModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveMedicine} className="p-6 overflow-y-auto space-y-4 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">اسم الدواء التجاري *</label>
                  <input 
                    type="text"
                    required
                    value={medForm.name}
                    onChange={e => setMedForm({...medForm, name: e.target.value})}
                    placeholder="مثل: بنادول 500 ملغ"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">الاسم العلمي (المادة الفعالة)</label>
                  <input 
                    type="text"
                    value={medForm.activeIngredient}
                    onChange={e => setMedForm({...medForm, activeIngredient: e.target.value})}
                    placeholder="مثل: Paracetamol"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">الفئة العلاجية *</label>
                  <select 
                    value={medForm.category}
                    onChange={e => setMedForm({...medForm, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500">
                    <option value="مضاد حيوي">مضاد حيوي</option>
                    <option value="مسكنات آلام">مسكنات آلام</option>
                    <option value="فيتامينات ومكملات">فيتامينات ومكملات</option>
                    <option value="جهاز هضمي">جهاز هضمي</option>
                    <option value="شاش ومستلزمات">شاش ومستلزمات</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">الباركود (الرمز التعريفي) *</label>
                  <input 
                    type="text"
                    required
                    value={medForm.code}
                    onChange={e => setMedForm({...medForm, code: e.target.value})}
                    placeholder="باركود العبوة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">الموضع بالرف / الخزانة</label>
                  <input 
                    type="text"
                    value={medForm.shelfLocation}
                    onChange={e => setMedForm({...medForm, shelfLocation: e.target.value})}
                    placeholder="مثال: أ-١ (A1)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">رقم التشغيلة (Batch Number)</label>
                  <input 
                    type="text"
                    value={medForm.batchNumber}
                    onChange={e => setMedForm({...medForm, batchNumber: e.target.value})}
                    placeholder="مثال: B2026-X4"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500 text-left font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">تاريخ انتهاء الصلاحية *</label>
                  <input 
                    type="date"
                    required
                    value={medForm.expiryDate}
                    onChange={e => setMedForm({...medForm, expiryDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">الرصيد الابتدائي المتوفر</label>
                  <input 
                    type="number"
                    value={medForm.stock}
                    onChange={e => setMedForm({...medForm, stock: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">حد الأمان للتنبيه بالنواقص</label>
                  <input 
                    type="number"
                    value={medForm.minStock}
                    onChange={e => setMedForm({...medForm, minStock: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">سعر الشراء (التكلفة) ج.م *</label>
                  <input 
                    type="number"
                    required
                    value={medForm.costPrice}
                    onChange={e => setMedForm({...medForm, costPrice: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">سعر البيع للجمهور ج.م *</label>
                  <input 
                    type="number"
                    required
                    value={medForm.price}
                    onChange={e => setMedForm({...medForm, price: Number(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 block mb-1">المورد الرئيسي المعتمد (مزود التغذية) *</label>
                  <select 
                    value={medForm.supplierName || 'مستودع ياروسلاف للأدوية'}
                    onChange={e => setMedForm({...medForm, supplierName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500">
                    <option value="مستودع ياروسلاف للأدوية">مستودع ياروسلاف للأدوية</option>
                    <option value="شركة أندري الطبية">شركة أندري الطبية</option>
                    <option value="مجموعة كوفال للأدوية">مجموعة كوفال للأدوية</option>
                    <option value="مؤسسة بوهدان للأدوية والمستلزمات">مؤسسة بوهدان للأدوية والمستلزمات</option>
                    <option value="شركة تاراس الدولية للاستيراد الطبي">شركة تاراس الدولية للاستيراد الطبي</option>
                  </select>
                </div>
              </div>

              {/* Retail details toggle option */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={medForm.hasRetailFractioning}
                    onChange={e => setMedForm({ ...medForm, hasRetailFractioning: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="text-xs font-black text-slate-700">تفعيل بيع الدواء بالتجزئة (شريط / قرص)</span>
                </label>

                {medForm.hasRetailFractioning && (
                  <div className="grid grid-cols-2 gap-3 pt-2 text-right border-t border-slate-200">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">شريط / علبة</label>
                      <input 
                        type="number"
                        value={medForm.packHasStrips}
                        onChange={e => setMedForm({ ...medForm, packHasStrips: Number(e.target.value) })}
                        placeholder="مثال: 3 شريط"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">قرص / شريط</label>
                      <input 
                        type="number"
                        value={medForm.stripHasPills}
                        onChange={e => setMedForm({ ...medForm, stripHasPills: Number(e.target.value) })}
                        placeholder="مثال: 10 قرص"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">سعر بيع الشريط ج.م</label>
                      <input 
                        type="number"
                        value={medForm.pricePerStrip}
                        onChange={e => setMedForm({ ...medForm, pricePerStrip: Number(e.target.value) })}
                        placeholder="اتركه 0 لحسابه تلقائيا"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">سعر بيع الحبة ج.م</label>
                      <input 
                        type="number"
                        value={medForm.pricePerPill}
                        onChange={e => setMedForm({ ...medForm, pricePerPill: Number(e.target.value) })}
                        placeholder="اتركه 0 لحسابه تلقائيا"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">رمز باركود الشريط الطبي</label>
                      <input 
                        type="text"
                        value={medForm.stripBarcode}
                        onChange={e => setMedForm({ ...medForm, stripBarcode: e.target.value })}
                        placeholder="ادخل باركود الشريط للتجزئة مباشرة"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-emerald-500 text-left font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Controlled drug toggle option */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 mt-2 space-y-2 text-right">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={medForm.isControlled}
                    onChange={e => setMedForm({ ...medForm, isControlled: e.target.checked })}
                    className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <span className="text-xs font-black text-amber-800 flex items-center gap-1">
                    ⚠️ تصنيف صنف جدول / مراقب (طلب روشتة معتمدة)
                  </span>
                </label>
                <p className="text-[10px] text-amber-600/90 pr-6 mr-1">
                  عند التفعيل، سيُطالب النظام كاشير الصيدلية بتدوين الرقم القومي، اسم الطبيب المعالج، واسم المريض مع رفع الروشتة للتجزئة والامتثال للقوانين المعمول بها.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 px-6 pb-4">
                <button 
                  type="button"
                  onClick={() => setIsMedModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition">
                  إلغاء
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition">
                  حفظ المستند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/****************** MODAL: ADD SUPPLIER PURCHASE ******************/}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] font-sans">
            
            {/* Modal Header */}
            <div className="bg-slate-900 border-b border-slate-800 text-white px-6 py-4 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-extrabold text-white text-base">تسجيل وتوريد وإثبات فاتورة مشتريات الأدوية الموردة</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">ضبط البونص والخصومات وتأثير التوريد على حسابات المخازن والتكلفة الحقيقية للصنف</p>
              </div>
              <button 
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-white transition bg-slate-800/50 hover:bg-slate-800 p-1.5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-right flex-1 bg-slate-50">
              
              {/* Top Container: Suppliers, Invoice, Payment Type */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full inline-block animate-pulse"></span>
                  ١. البيانات الضريبية والمالية للفاتورة
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Supplier dropdown */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">الشركة الموردة (الدائن المالي) *</label>
                    <select 
                      value={purchaseForm.supplierName}
                      onChange={e => setPurchaseForm({...purchaseForm, supplierName: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 font-bold text-slate-850">
                      <option value="مستودع ياروسلاف للأدوية">مستودع ياروسلاف للأدوية</option>
                      <option value="شركة أندري الطبية">شركة أندري الطبية</option>
                      <option value="مجموعة كوفال للأدوية">مجموعة كوفال للأدوية</option>
                      <option value="مؤسسة بوهدان للأدوية والمستلزمات">مؤسسة بوهدان للأدوية والمستلزمات</option>
                      <option value="شركة تاراس الدولية للاستيراد الطبي">شركة تاراس الدولية للاستيراد الطبي</option>
                    </select>
                  </div>

                  {/* Invoice Number */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">رقم فاتورة الشراء المرجعي *</label>
                    <input 
                      type="text"
                      required
                      value={purchaseForm.invoiceNumber}
                      onChange={e => setPurchaseForm({...purchaseForm, invoiceNumber: e.target.value})}
                      placeholder="مثال: Invoice-2209"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 font-mono font-bold text-left"
                    />
                  </div>

                  {/* Payment Type */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">طريقة الدفع والتسوية المالية *</label>
                    <select 
                      value={purchaseForm.paymentType}
                      onChange={e => setPurchaseForm({...purchaseForm, paymentType: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 font-bold text-slate-800">
                      <option value="cash">نقدي (سحب فوري من الصندوق الرئيسي)</option>
                      <option value="credit">على المكشوف / آجل (ذمم دائنة للموردين)</option>
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">تاريخ الاستلام والتوريد *</label>
                    <input 
                      type="date"
                      value={purchaseForm.date}
                      onChange={e => setPurchaseForm({...purchaseForm, date: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 font-bold text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Add Select Medicines item */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block"></span>
                    ٢. إدراج وتدقيق بنود الفاتورة والشحنة الطبية
                  </h4>
                  <span className="text-[11px] text-indigo-600 font-bold">بإمكانك البحث في المستحضرات وإدراجها بجدول الفاتورة</span>
                </div>

                <div className="flex gap-2">
                  <select 
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) {
                        handleAddPurchaseItem(Number(e.target.value));
                        e.target.value = "";
                      }
                    }}
                    className="flex-1 bg-slate-50 border border-indigo-200 focus:border-indigo-500 rounded-lg p-2.5 text-xs outline-none font-bold text-slate-700">
                    <option value="" disabled>انقر هنا للبحث واختيار صنف الدواء المراد إدراجه للفاتورة...</option>
                    {medicines.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} [المخزون الحالي: {m.stock} وحدات] - سعر الجمهور: {m.price} ج.م
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Shipment Entry Table container */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 text-xs font-bold border-b border-slate-200">
                        <th className="p-3.5 w-1/4">اسم الدواء الطبي</th>
                        <th className="p-3.5 text-center w-[11%]">الكمية الأساسية</th>
                        <th className="p-3.5 text-center w-[11%]">بونص مجاناً</th>
                        <th className="p-3.5 text-center w-[12%]">الرسمي للشراء (ج.م)</th>
                        <th className="p-3.5 text-center w-[10%]">خصم تجاري %</th>
                        <th className="p-3.5 text-center w-[12%]">رقم التشغيلة (Batch)</th>
                        <th className="p-3.5 text-center w-[12%]">تاريخ الصلاحية</th>
                        <th className="p-3.5 text-left w-[8%]">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {purchaseForm.items.map((item, index) => {
                        const discount = item.discountPercent || 0;
                        const bonus = item.bonusQty || 0;
                        const rawCost = item.quantity * item.costPrice;
                        const effectiveCost = rawCost * (1 - discount / 100);
                        const totalUnits = item.quantity + bonus;
                        const unitCostAfterBonus = totalUnits > 0 ? (effectiveCost / totalUnits) : item.costPrice;

                        return (
                          <tr key={item.medId} className="hover:bg-slate-50/50 transition">
                            {/* Medicine Name & Info summary */}
                            <td className="p-3">
                              <div className="flex flex-col">
                                <span className="font-extrabold text-slate-900 text-xs">{item.name}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-bold font-mono">
                                    تكلفتك الفعلية: {unitCostAfterBonus.toFixed(2)} ج.م
                                  </span>
                                  {bonus > 0 && (
                                    <span className="text-[8.5px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-bold">
                                      هدية بونص: {bonus} وحدة
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Base Qty */}
                            <td className="p-3 text-center">
                              <input 
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={e => updatePurchaseItemQty(item.medId, 'quantity', Math.max(1, Number(e.target.value)))}
                                className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-center font-bold text-slate-800 text-xs font-mono"
                              />
                            </td>

                            {/* Bonus Qty */}
                            <td className="p-3 text-center">
                              <input 
                                type="number"
                                min="0"
                                value={bonus}
                                onChange={e => updatePurchaseItemQty(item.medId, 'bonusQty', Math.max(0, Number(e.target.value)))}
                                className="w-full bg-amber-50/30 border border-amber-200 rounded p-1 text-center font-bold text-amber-800 text-xs font-mono"
                              />
                            </td>

                            {/* Standard Cost Price */}
                            <td className="p-3 text-center">
                              <input 
                                type="number"
                                step="0.01"
                                min="0.1"
                                value={item.costPrice}
                                onChange={e => updatePurchaseItemQty(item.medId, 'costPrice', Math.max(0.1, Number(e.target.value)))}
                                className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-center font-bold text-indigo-700 text-xs font-mono"
                              />
                            </td>

                            {/* Commercial Discount % */}
                            <td className="p-3 text-center">
                              <input 
                                type="number"
                                min="0"
                                max="100"
                                value={discount}
                                onChange={e => updatePurchaseItemQty(item.medId, 'discountPercent', Math.min(100, Math.max(0, Number(e.target.value))))}
                                className="w-full bg-violet-50/30 border border-violet-200 rounded p-1 text-center font-bold text-violet-700 text-xs font-mono"
                              />
                            </td>

                            {/* Batch No */}
                            <td className="p-3 text-center">
                              <input 
                                type="text"
                                required
                                value={item.batchNumber || ''}
                                onChange={e => updatePurchaseItemQty(item.medId, 'batchNumber', e.target.value)}
                                placeholder="B-9022"
                                className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-center font-mono font-bold text-slate-700 text-xs"
                              />
                            </td>

                            {/* Expiry Date */}
                            <td className="p-3 text-center">
                              <input 
                                type="date"
                                required
                                value={item.expiryDate || ''}
                                onChange={e => updatePurchaseItemQty(item.medId, 'expiryDate', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-center text-[10.5px] font-bold text-slate-600"
                              />
                            </td>

                            {/* Action delete row */}
                            <td className="p-3 text-left">
                              <button 
                                type="button"
                                onClick={() => removePurchaseItem(item.medId)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {purchaseForm.items.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 font-bold text-xs">
                            🔴 لا توجد أدوية مدرجة للفاتورة حالياً. اختر من محرك المشتريات والبحث أعلاه للإضافة فوراً.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Totals Bar Block Container */}
              {purchaseForm.items.length > 0 && (
                <div className="bg-slate-900 rounded-xb-2xl rounded-2xl border border-slate-800 shadow-xl p-6 text-white space-y-4">
                  <h4 className="text-xs font-black text-indigo-300 flex items-center gap-1 border-b border-slate-800 pb-2">
                    <Calculator className="w-4 h-4" /> الخلاصة المالية التراكمية للفاتورة الحالية والأرباح الذكائية المتوقعة
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    
                    {/* Sum raw cost (before discount) */}
                    <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">إجمالي التوريد قبل الخصم</span>
                      <strong className="text-base font-extrabold font-mono text-slate-200">
                        {purchaseForm.items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0).toFixed(2)} ج.م
                      </strong>
                    </div>

                    {/* Total commercial discount */}
                    <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] uppercase tracking-wider text-amber-400 block mb-1">قيمة الخصم التجاري لمصلحتك</span>
                      <strong className="text-base font-extrabold font-mono text-amber-400">
                        {purchaseForm.items.reduce((sum, item) => {
                          const discount = item.discountPercent || 0;
                          return sum + (item.quantity * item.costPrice * (discount / 100));
                        }, 0).toFixed(2)} ج.م
                      </strong>
                    </div>

                    {/* Final Net Invoice Cost */}
                    <div className="bg-emerald-950/60 p-3.5 rounded-xl border border-emerald-900">
                      <span className="text-[10px] uppercase tracking-wider text-emerald-400 block mb-2 font-black">الإجمالي النهائي والمطالبة الصافية</span>
                      <strong className="text-xl font-black font-mono text-emerald-400">
                        {purchaseForm.items.reduce((sum, item) => {
                          const discount = item.discountPercent || 0;
                          return sum + (item.quantity * item.costPrice * (1 - discount / 100));
                        }, 0).toFixed(2)} ج.م
                      </strong>
                    </div>

                    {/* Expected Profit */}
                    <div className="bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-900">
                      <span className="text-[10px] uppercase tracking-wider text-indigo-400 block mb-2 font-black">الربح التجاري الإجمالي المتوقع</span>
                      <strong className="text-xl font-black font-mono text-indigo-400 animate-pulse">
                        {(() => {
                          const value = purchaseForm.items.reduce((sum, item) => {
                            const med = medicines.find(m => m.id === item.medId);
                            const sellingPrice = med ? med.price : 0;
                            const discount = item.discountPercent || 0;
                            const totalAmountReceivedUnits = item.quantity + (item.bonusQty || 0);
                            
                            const expectedRevenue = totalAmountReceivedUnits * sellingPrice;
                            const costPaidForThis = item.quantity * item.costPrice * (1 - discount / 100);
                            
                            return sum + (expectedRevenue - costPaidForThis);
                          }, 0);
                          return value.toFixed(2);
                        })()} ج.م
                      </strong>
                    </div>

                  </div>

                  <div className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full inline-block animate-ping"></span>
                    <span>معادلة البونص الذكية تُثبت بالعام وتُنقص تكلفة العلبة فعلياً في مخلفات السعر لتعطيك تفصيلاً حقيقياً لهامش الربح و COGS.</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200">
                <button 
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="bg-slate-200 hover:bg-slate-350 hover:bg-slate-300 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold transition">
                  إلغاء التوريد
                </button>
                <button 
                  onClick={submitPurchaseBill}
                  disabled={purchaseForm.items.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-xs font-black transition disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-600/20">
                  <ShoppingBag className="w-4 h-4" />
                  <span>اعتماد الفاتورة المحاسبية وصرف المخزون</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/****************** MODAL: LOG DRUG RETURN TO SUPPLIER ******************/}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1">
                <TrendingDown className="w-5 h-5 text-rose-500" />
                <span>تسجيل وإثبات مرتجع أدوية منتهية أو قرب صلاحيتها للمورد</span>
              </h3>
              <button 
                onClick={() => setIsReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-right">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">اسم المورد المسترجع إليه</label>
                  <input 
                    type="text"
                    value={returnForm.supplierName}
                    onChange={e => setReturnForm({...returnForm, supplierName: e.target.value})}
                    placeholder="مثل: شركة أندري الطبية"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">تاريخ عملية الارتجاع والتسوية</label>
                  <input 
                    type="date"
                    value={returnForm.date}
                    onChange={e => setReturnForm({...returnForm, date: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">نوع تسوية حساب القيمة المالية بالدفاتر</label>
                <select 
                  value={returnForm.status}
                  onChange={e => setReturnForm({...returnForm, status: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-rose-500">
                  <option value="خصم من مديونية المورد (ذمم دائنة)">خصم من مديونية المورد (تخفيض ذمم دائنة - كود 2010)</option>
                  <option value="استرداد مالي صندوق الخزينة">استرداد نقدي فوري (إيداع بصندوق الخزينة الرئيسي - كود 1010)</option>
                </select>
              </div>

              {/* Add Select Medicines item */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="text-xs font-bold text-slate-500 block mb-1">اختر الدواء للمرتجع (مرتبة حسب مصفوفة انتهاء الصلاحية)</label>
                <div className="flex gap-2">
                  <select 
                    defaultValue=""
                    onChange={e => {
                      if (e.target.value) {
                        handleAddReturnItem(Number(e.target.value));
                        e.target.value = "";
                      }
                    }}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none">
                    <option value="" disabled>انقر لاختيار وإدراج الأصناف المراد ارتجاعها...</option>
                    {medicines.filter(m => m.stock > 0).map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} [{m.expiryDate}] (متاح بالرف: {m.stock} عبوات)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Return Items List */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-500 block">الأصناف الموردة المراد ارتجاعها للحساب الجاري:</span>
                {returnForm.items.map((item, index) => {
                  const matchedMed = medicines.find(m => m.id === item.medId);
                  const maxStock = matchedMed ? matchedMed.stock : 999;

                  return (
                    <div key={item.medId} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-3">
                      <div className="text-right">
                        <h5 className="font-extrabold text-slate-800">{item.name}</h5>
                        <span className="text-[10px] text-slate-400 block mt-0.5">الرصيد الكلي المتوفر بالرف: ({maxStock} عبوة)</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">الكمية المرتجعة</span>
                          <input 
                            type="number"
                            min="1"
                            max={maxStock}
                            value={item.quantity}
                            onChange={e => {
                              const inputVal = Math.min(maxStock, Math.max(1, Number(e.target.value)));
                              updateReturnItemQty(item.medId, 'quantity', inputVal);
                            }}
                            className="w-16 bg-white border border-slate-200 rounded p-1 text-center font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">سعر الارتجاع (ج.م)</span>
                          <input 
                            type="number"
                            step="0.01"
                            value={item.refundPrice}
                            onChange={e => updateReturnItemQty(item.medId, 'refundPrice', Math.max(0.1, Number(e.target.value)))}
                            className="w-20 bg-white border border-slate-200 rounded p-1 text-center font-bold text-rose-600"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeReturnItem(item.medId)}
                          className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg mt-4">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {returnForm.items.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs">لا توجد أصناف مضافة للمرتجع حالياً. الرجاء اختيار دواء من القائمة أعلاه</div>
                )}
              </div>

              {/* Total Calculation Return Card */}
              {returnForm.items.length > 0 && (
                <div className="bg-rose-950 text-white p-4 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-bold text-rose-200">إجمالي قيمة التعويض المسترد / المخصوم:</span>
                  <span className="text-lg font-black font-mono text-rose-400">
                    {returnForm.items.reduce((sum, i) => sum + (i.quantity * i.refundPrice), 0).toFixed(2)} ج.م
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition">
                  إلغاء
                </button>
                <button 
                  onClick={submitSupplierReturn}
                  disabled={returnForm.items.length === 0}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50">
                  اعتماد مستند المردودات وتحديث الحسابات
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Return Modal with Invoice Search & Anti-Fraud Batch Verification */}
      {isCustomerReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-teal-600 px-6 py-4 border-b border-teal-700 flex justify-between items-center shrink-0 text-white">
              <h3 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                <RefreshCw className="w-5 h-5 text-teal-100 animate-spin-reverse" />
                <span>شاشة معالجة مرتجع عملاء (Customer Sales Returns)</span>
              </h3>
              <button 
                onClick={() => setIsCustomerReturnModalOpen(false)}
                className="text-teal-100 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-right">
              {/* Step 1: Search previous invoice or write customer name */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
                <h4 className="text-xs font-extrabold text-teal-800">١. الربط بفاتورة مبيعات سابقة (اختياري للتحقق من المصدر)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">ابحث بـرقم الفاتورة أو اسم العميل</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={customerReturnForm.saleInvoiceQuery}
                        onChange={e => setCustomerReturnForm({...customerReturnForm, saleInvoiceQuery: e.target.value})}
                        placeholder="رقم الفاتورة، مثلاً: 1"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">اسم العميل الحالي في مستند المردودات</label>
                    <input 
                      type="text"
                      value={customerReturnForm.customerName}
                      onChange={e => setCustomerReturnForm({...customerReturnForm, customerName: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Display found matching invoices */}
                {customerReturnForm.saleInvoiceQuery.trim() && (
                  <div className="bg-white border border-slate-200 rounded-lg max-h-36 overflow-y-auto p-1 text-xs divide-y divide-slate-100">
                    {sales
                      .filter(s => 
                        String(s.id).includes(customerReturnForm.saleInvoiceQuery) || 
                        s.customerName.toLowerCase().includes(customerReturnForm.saleInvoiceQuery.toLowerCase())
                      )
                      .map(invoice => (
                        <div 
                          key={invoice.id} 
                          onClick={() => {
                            // Automatically populate customer return form with invoice details
                            const invoiceItems = invoice.items.map((it: any) => ({
                              medId: it.medicineId,
                              name: it.name,
                              quantity: it.quantity,
                              refundPrice: it.price,
                              batchNumber: 'B-NORMAL',
                              expiryDate: new Date().toISOString().split('T')[0]
                            }));
                            setCustomerReturnForm({
                              ...customerReturnForm,
                              customerName: invoice.customerName,
                              selectedSaleId: invoice.id!,
                              items: invoiceItems,
                              saleInvoiceQuery: '' // Reset invoice search query to hide dropdown
                            });
                            success(`تم جلب تفاصيل فاتورة المبيعات رقم PHA-SALE-${invoice.id} تلقائيا!`);
                          }}
                          className="p-2 hover:bg-teal-50 cursor-pointer flex justify-between items-center transition">
                          <div>
                            <span className="font-bold text-slate-800">فاتورة رقم #{invoice.id}</span>
                            <span className="text-[10px] text-slate-400 ms-2">({invoice.customerName})</span>
                          </div>
                          <span className="font-mono text-emerald-600 font-bold">{invoice.total} ج.م</span>
                        </div>
                      ))}
                    {sales.filter(s => 
                      String(s.id).includes(customerReturnForm.saleInvoiceQuery) || 
                      s.customerName.toLowerCase().includes(customerReturnForm.saleInvoiceQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="p-3 text-center text-slate-400 text-[10px]">لا توجد فواتير مبيعات مطابقة لهذا الاستعلام</div>
                    )}
                  </div>
                )}
              </div>

              {/* Step 2: Anti-Fraud Box & Expiry Verification */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 space-y-3">
                <h4 className="text-xs font-extrabold text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-amber-650" />
                  <span>٢. التحقق الإلكتروني لمنع التلاعب (رقم التشغيلة Batch وصلاحية العبوة)</span>
                </h4>
                <p className="text-[10px] text-slate-500">من أجل الحفاظ على سلامة المرضى، يُرجى فحص العبوة وتأكيد مطابقة باركود الدفعة مع الدفاتر قبل إعادتها للرفوف.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">أدخل باركود الدفعة / رقم التشغيلة (Batch Number)</label>
                    <input 
                      type="text"
                      placeholder="مثل: LOT-9021"
                      value={customerReturnForm.barcodeToVerify}
                      onChange={e => setCustomerReturnForm({...customerReturnForm, barcodeToVerify: e.target.value, verificationStatus: 'idle'})}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">ختر دواء للمقارنة (الدواء المراد ارتجاعه)</label>
                    <select 
                      defaultValue=""
                      onChange={e => {
                        if (e.target.value) {
                          handleAddCustomerReturnItem(Number(e.target.value));
                          e.target.value = "";
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-amber-500">
                      <option value="" disabled>انقر لاختيار وإدراج الأدوية يدويًا...</option>
                      {medicines.map(m => (
                        <option key={m.id} value={m.id}>{m.name} (التصنيف: {m.category})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 items-center justify-between">
                  <button 
                    type="button"
                    onClick={() => {
                      if (!customerReturnForm.barcodeToVerify.trim()) {
                        warning('يُرجى إدخال رقم دفعة/تشغيلة العلبة أولاً!');
                        return;
                      }
                      
                      const match = allBatches.find(b => b.batchNumber.toLowerCase().includes(customerReturnForm.barcodeToVerify.trim().toLowerCase()));
                      if (match) {
                        setCustomerReturnForm({
                          ...customerReturnForm,
                          verificationStatus: 'verified'
                        });
                        success('✅ تم العثور ومطابقة رقم المعاملة مع مستندات التوريد السابقة!');
                      } else {
                        setCustomerReturnForm({
                          ...customerReturnForm,
                          verificationStatus: 'failed'
                        });
                        error('❌ رقم التشغيلة المدخل مخترع أو غير مطابق لسجلات التوريد المسجلة لدينا!');
                      }
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-1.5 px-4 rounded-lg transition-all shadow-sm">
                    تحقق وفحص مطابقة العلبة
                  </button>

                  {customerReturnForm.verificationStatus === 'verified' && (
                    <span className="text-xs text-emerald-700 font-extrabold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                      🟢 متطابق: تم التوريد سابقاً ومسموح بالعودة
                    </span>
                  )}
                  {customerReturnForm.verificationStatus === 'failed' && (
                    <span className="text-xs text-red-700 font-bold bg-red-50 border border-red-200 px-3 py-1 rounded-lg">
                      🔴 تحذير: المعاملة غير مسجلة بالدفاتر، يُنصح برفض الارتجاع!
                    </span>
                  )}
                </div>
              </div>

              {/* Step 3: Items Return List Grid */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-700 block">الأصناف المزمع إرجاعها للمخزن واسترداد قيمتها للعميل:</span>
                {customerReturnForm.items.map((item, index) => {
                  return (
                    <div key={item.medId} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-3">
                      <div className="text-right">
                        <h5 className="font-extrabold text-slate-800">{item.name}</h5>
                        <div className="flex gap-1 mt-1">
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded">دفعة: {item.batchNumber}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-650 px-1.5 rounded">نتهي: {item.expiryDate}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">الكمية المستردة</span>
                          <input 
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={e => {
                              const inputVal = Math.max(1, Number(e.target.value));
                              updateCustomerReturnItemQty(item.medId, 'quantity', inputVal);
                            }}
                            className="w-16 bg-white border border-slate-200 rounded p-1 text-center font-bold"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-0.5">سعر الارتجاع (ج.م)</span>
                          <input 
                            type="number"
                            step="0.01"
                            value={item.refundPrice}
                            onChange={e => updateCustomerReturnItemQty(item.medId, 'refundPrice', Math.max(0.1, Number(e.target.value)))}
                            className="w-20 bg-white border border-slate-200 rounded p-1 text-center font-bold text-teal-600 font-mono"
                          />
                        </div>
                        <button 
                          type="button"
                          onClick={() => removeCustomerReturnItem(item.medId)}
                          className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg mt-4">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {customerReturnForm.items.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    لا توجد أصناف مدرجة للمرتجع حالياً. الرجاء الإدراج بالبحث عن فاتورة مبيعات سابقة أو اختيار الصنف يدويّاً من الأعلى.
                  </div>
                )}
              </div>

              {/* Total Calculation Return Card */}
              {customerReturnForm.items.length > 0 && (
                <div className="bg-teal-950 text-white p-4 rounded-xl flex justify-between items-center">
                  <span className="text-xs font-bold text-teal-200">إجمالي المبلغ المراد ردّه للعميل نقداً من كاش البوكس:</span>
                  <span className="text-lg font-black font-mono text-teal-300">
                    {customerReturnForm.items.reduce((sum, i) => sum + (i.quantity * i.refundPrice), 0).toFixed(2)} ج.م
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setIsCustomerReturnModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition">
                  إلغاء
                </button>
                <button 
                  onClick={submitCustomerReturn}
                  disabled={customerReturnForm.items.length === 0}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-md">
                  اعتماد مستند مرتجع المبيعات والتسليم المالي
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmDeleteId !== null}
        onClose={() => { setConfirmDeleteId(null); setConfirmDeleteType(null); }}
        onConfirm={handleConfirmDelete}
        title="تأكيد حذف الملف من النظام"
        message="هل أنت متأكد من رغبتك في حذف هذا الملف بالكامل من قاعدة البيانات الملحقة أوفلاين؟ لا يمكن استرجاع هذا الإجراء بعد الحذف."
      />

    </div>
  );
};
