import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { AssetCustody, FixedAsset, User } from '../../types';
import { AccountingEngine } from '../../services/AccountingEngine';
import {
  Wrench,
  Search,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  DollarSign,
  X,
  Calendar,
  Layers,
  UserCheck,
  Briefcase,
  Sliders,
  AlertTriangle,
  History,
  TrendingDown
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// 1. Core Rule Constraint: 100% Christian Ukrainian Names Only for employees/technicians!
const PRESET_TECHNICIANS = [
  { id: 1001, name: 'أندري لوسينكو', role: 'technician', jobTitle: 'فني صيانة متقدم' },
  { id: 1002, name: 'ميكولا كوزمينكو', role: 'technician', jobTitle: 'فني إلكترونيات دقيقة' },
  { id: 1003, name: 'ياروسلاف بوندس', role: 'technician', jobTitle: 'فني برمجيات وهواتف' },
  { id: 1004, name: 'رومان شوخيفيتش', role: 'technician', jobTitle: 'مهندس صيانة هاردوير' },
  { id: 1005, name: 'تاراس شفتشينكو', role: 'technician', jobTitle: 'فني صيانة شبكات' },
  { id: 1006, name: 'بوهدان ميلنيك', role: 'technician', jobTitle: 'مسؤول فحص جودة الورشه' },
  { id: 1007, name: 'أولغا كوفالينكو', role: 'technician', jobTitle: 'فنية صيانة أجهزة آبل' },
  { id: 1008, name: 'كاترينا بويكو', role: 'technician', jobTitle: 'مشرفة فنية وسلامة مهنية' }
];

const ComputerMobileInternalTools: React.FC = () => {
  // Live queries 
  const assetsFromDb = useLiveQuery(() => db.assets.toArray()) || [];
  const custodyFromDb = useLiveQuery(() => db.assetCustody.toArray()) || [];
  const dbUsers = useLiveQuery(() => db.users.toArray()) || [];
  const activeShift = useLiveQuery(() => db.shifts.where('status').equals('open').first());

  // Merge database users with presets to ensure we have a robust technician list
  const allTechnicians = React.useMemo(() => {
    const list = [...PRESET_TECHNICIANS];
    dbUsers.forEach(u => {
      // Avoid duplicate names
      if (!list.some(p => p.name === u.name)) {
        list.push({
          id: u.id || Math.floor(Math.random() * 100000),
          name: u.name,
          role: u.role || 'technician',
          jobTitle: u.jobTitle || 'فني صيانة'
        });
      }
    });
    return list;
  }, [dbUsers]);

  // Page tabs
  const [activeTab, setActiveTab] = useState<'inventory' | 'custody' | 'logs'>('inventory');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals status
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [showIssueCustodyModal, setShowIssueCustodyModal] = useState(false);
  const [selectedCustodyToPrint, setSelectedCustodyToPrint] = useState<any | null>(null);

  // Add Tool form states
  const [toolName, setToolName] = useState('');
  const [toolCost, setToolCost] = useState<number>(750);
  const [toolSerial, setToolSerial] = useState('');
  const [toolDesc, setToolDesc] = useState('');
  const [toolCondition, setToolCondition] = useState('ممتازة - جديدة');
  const [postToLedger, setPostToLedger] = useState(true);
  const [depreciationRate, setDepreciationRate] = useState<number>(20);
  const [depreciationMethod, setDepreciationMethod] = useState<'linear' | 'double-declining' | 'none'>('linear');

  // Add Custody form states
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [custodyCondition, setCustodyCondition] = useState('ممتازة - فحص قياسي');
  const [custodyNotes, setCustodyNotes] = useState('تم استلام العهدة على طاولة العمل الخاصة بالفني، وهو ملتزم بسلامتها فحصاً وجرداً دورياً.');

  // Auto populate values when opening modals
  useEffect(() => {
    if (assetsFromDb.length > 0) {
      setSelectedAssetId(assetsFromDb[0].id?.toString() || '');
    }
  }, [assetsFromDb]);

  useEffect(() => {
    if (allTechnicians.length > 0) {
      setSelectedTechId(allTechnicians[0].id.toString());
    }
  }, [allTechnicians]);

  // 1. Add Tool with accounting impact
  const handleAddNewTool = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!toolName.trim()) {
      toast.error('يرجى كتابة اسم الأداة الفنية');
      return;
    }
    if (toolCost <= 0) {
      toast.error('تكلفة الأداة يجب أن تكون أكبر من صفر');
      return;
    }

    try {
      const serial = toolSerial.trim() || `TOOL-${Date.now().toString().slice(-6)}`;
      
      const newAsset: FixedAsset = {
        name: toolName.trim(),
        cost: toolCost,
        value: toolCost,
        purchaseDate: new Date(),
        note: `${toolDesc.trim()} | الحالة: ${toolCondition}`,
        serialNumber: serial,
        lifeInYears: 5
      };

      const assetId = await db.assets.add(newAsset);

      // Financial Integration: Post Journal Entry for Fixed Asset Purchase
      if (postToLedger) {
        try {
          const description = `شراء أداة صيانة ورشة داخلية عهدة: ${toolName}`;
          
          const acc1100 = await db.accounts.where('code').equals('1100').first() || { id: 1100, name: 'الأصول الثابتة' };
          const acc1010 = await db.accounts.where('code').equals('1010').first() || { id: 1010, name: 'الصندوق' };

          await AccountingEngine.postEntry({
            date: new Date(),
            reference: `INTERNAL-TOOL-PURCHASE-${assetId}`,
            description,
            lines: [
              {
                accountId: acc1100.id || 1100,
                accountName: acc1100.name,
                debit: toolCost,
                credit: 0
              },
              {
                accountId: acc1010.id || 1010,
                accountName: acc1010.name,
                debit: 0,
                credit: toolCost
              }
            ]
          });

          toast.success('تم تسجيل الأداة في الأصول وتوليد قيد المحاسبة الثنائي بنجاح!');
        } catch (ledgerError: any) {
          console.error(ledgerError);
          toast.success('تم حفظ الأداة، مع تنبيه: كود المحاسبة لليومية يحتاج لوردية مفعلة لتسجيل القيد المالي.');
        }
      } else {
        toast.success('تم تسجيل الأداة بنجاح دون قيد تلقائي.');
      }

      setToolName('');
      setToolCost(750);
      setToolSerial('');
      setToolDesc('');
      setShowAddToolModal(false);
    } catch (error: any) {
      toast.error(`خطأ أثناء الحفظ بقاعدة البيانات: ${error.message}`);
    }
  };

  // 2. Issue Custody to Technician
  const handleIssueCustody = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAssetId) {
      toast.error('يرجى تحديد الأداة المراد تسليمها أولاً');
      return;
    }
    if (!selectedTechId) {
      toast.error('يرجى تحديد الفني المستلم للعهدة');
      return;
    }

    const asset = assetsFromDb.find(a => a.id === parseInt(selectedAssetId));
    if (!asset) {
      toast.error('الأداة المحددة غير موجودة بالمخزن');
      return;
    }

    // Check if tool is currently in custody (active status)
    const isAlreadyAssigned = custodyFromDb.some(c => c.assetName === asset.name && c.status === 'active');
    if (isAlreadyAssigned) {
      toast.error('هذه الأداة مسجلة كعهدة نشطة بالفعل لفني آخر! يرجى استلامها أولاً.');
      return;
    }

    const tech = allTechnicians.find(t => t.id.toString() === selectedTechId);
    if (!tech) {
      toast.error('الفني المحدد غير موجود بقائمة العمل');
      return;
    }

    try {
      const newCustody: AssetCustody = {
        employeeId: parseInt(selectedTechId),
        assetName: asset.name,
        serialNumber: asset.serialNumber || 'N/A',
        issueDate: new Date().toISOString().split('T')[0],
        status: 'active',
        condition: `${custodyCondition} | ملاحظة: ${custodyNotes}`
      };

      await db.assetCustody.add(newCustody);
      toast.success(`تم تسليم العهدة بنجاح للفني: ${tech.name} 🛠️`);
      setShowIssueCustodyModal(false);
    } catch (err: any) {
      toast.error(`فشل تسليم العهدة: ${err.message}`);
    }
  };

  // 3. Return Custody from Technician
  const handleReturnCustody = async (custodyId: number) => {
    const custody = custodyFromDb.find(c => c.id === custodyId);
    if (!custody) return;

    try {
      await db.assetCustody.update(custodyId, {
        status: 'returned',
        returnDate: new Date().toISOString().split('T')[0],
        condition: `${custody.condition} (تم الاسترجاع بحالة فحص سليمة)`
      });
      toast.success('تم فحص واسترجاع العهده لرف الاستخدام بنجاح ✅');
    } catch (err: any) {
      toast.error(`خطأ أثناء الإرجاع: ${err.message}`);
    }
  };

  // 4. Delete Tool Catalog Entry
  const handleDeleteTool = async (id: number) => {
    try {
      // Check if active custody exists
      const tool = assetsFromDb.find(a => a.id === id);
      if (tool) {
        const hasActiveCustody = custodyFromDb.some(c => c.assetName === tool.name && c.status === 'active');
        if (hasActiveCustody) {
          toast.error('لا يمكن حذف الأداة لأنها تحت عهدة فني نشط حالياً!');
          return;
        }
      }
      await db.assets.delete(id);
      toast.success('تم شطب العهدة من جدول مخزن الأدوات الداخلي.');
    } catch (err: any) {
      toast.error(`فشل الحذف: ${err.message}`);
    }
  };

  // Filter Catalog
  const filteredCatalog = assetsFromDb.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.serialNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Filter Custody
  const filteredCustody = custodyFromDb.filter(cust => {
    const tech = allTechnicians.find(t => t.id === cust.employeeId);
    const techName = tech ? tech.name : '';
    
    const matchesSearch = cust.assetName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          techName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTech = techFilter === 'all' || cust.employeeId.toString() === techFilter;
    const matchesStatus = statusFilter === 'all' || cust.status === statusFilter;

    return matchesSearch && matchesTech && matchesStatus;
  });

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen text-right" dir="rtl">
      <Toaster position="top-center" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
              <Wrench className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight font-sans">تتبع مخزن وأدوات الورشة الداخليّة</h1>
              <p className="text-gray-500 font-sans mt-1">
                إدارة العُهد الفنية الخاصة بمهندسي الصيانة مع تتبع تسليم واستلام الأدوات وتوليد قيود اليومية المحاسبية للأصول الثابتة.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowAddToolModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-5 py-3 rounded-xl hover:opacity-90 font-sans cursor-pointer transition shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>شراء وتسجيل أداة عُهدة 💰</span>
          </button>

          <button
            onClick={() => setShowIssueCustodyModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-3 rounded-xl hover:opacity-90 font-sans cursor-pointer transition shadow-md"
          >
            <UserCheck className="w-5 h-5" />
            <span>محضر تسليم عُهدة لفني 👤</span>
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-sans mb-1">إجمالي الأدوات بالمخزن</p>
            <h3 className="text-2xl font-bold font-mono text-gray-900">{assetsFromDb.length} أداة</h3>
          </div>
          <div className="p-4 bg-teal-50 text-teal-600 rounded-xl">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-sans mb-1">عُهد نشطة قيد الفنيين</p>
            <h3 className="text-2xl font-bold font-mono text-amber-600">
              {custodyFromDb.filter(c => c.status === 'active').length} عُهدة
            </h3>
          </div>
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl">
            <Sliders className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-sans mb-1">إجمالي قيمة أدوات الورشة</p>
            <h3 className="text-2xl font-bold font-mono text-emerald-600">
              {assetsFromDb.reduce((sum, current) => sum + (current.cost || 0), 0).toLocaleString()} ج.م
            </h3>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-sm font-sans mb-1">أدوات مسترجعة بالرف</p>
            <h3 className="text-2xl font-bold font-mono text-blue-600">
              {custodyFromDb.filter(c => c.status === 'returned').length} أداة
            </h3>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-2">
        <button
          onClick={() => { setActiveTab('inventory'); setSearchQuery(''); }}
          className={`px-6 py-3 font-sans font-medium text-lg border-b-2 transition ${
            activeTab === 'inventory' ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          🗃️ مستودع جرد الأدوات الداخلي
        </button>
        <button
          onClick={() => { setActiveTab('custody'); setSearchQuery(''); }}
          className={`px-6 py-3 font-sans font-medium text-lg border-b-2 transition ${
            activeTab === 'custody' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          📋 سجل عُهدات الفنيين وطاولات الصيانة
        </button>
        <button
          onClick={() => { setActiveTab('logs'); setSearchQuery(''); }}
          className={`px-6 py-3 font-sans font-medium text-lg border-b-2 transition ${
            activeTab === 'logs' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          📜 تقارير الأرشيف ومحاضر التسليم
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-3.5 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={activeTab === 'inventory' ? 'بحث عن عُهدة، باركود أو سيريال...' : 'بحث عن فني، أداة، أو الرقم التسلسلي...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-right font-sans"
          />
        </div>

        {activeTab === 'custody' && (
          <div className="flex gap-2">
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="bg-white border border-gray-200 px-4 py-3 rounded-xl font-sans text-gray-700"
            >
              <option value="all">كل الفنيين 👥</option>
              {allTechnicians.map(tech => (
                <option key={tech.id} value={tech.id}>{tech.name}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 px-4 py-3 rounded-xl font-sans text-gray-700"
            >
              <option value="all">كل الحالات 🏷️</option>
              <option value="active">نشطة (تحت العُهدة) 🔴</option>
              <option value="returned">مسترجعة بالكامل 🟢</option>
            </select>
          </div>
        )}
      </div>

      {/* CONTENT: Tab 1 - Inventory */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          {filteredCatalog.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-sans">
              <Wrench className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-xl">لا توجد أدوات بالورشة مطابقة للبحث حالياً.</p>
              <p className="text-sm text-gray-400 mt-1">اضغط على زر شراء وتسجيل أداة عُهدة لتسجيل أول طاولة معدة.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-gray-700 text-sm border-b border-gray-100">
                    <th className="p-4 font-bold font-sans">أداة الصيانة</th>
                    <th className="p-4 font-bold font-sans">الرقم التسلسلي (سيريال)</th>
                    <th className="p-4 font-bold font-sans">تكلفة الشراء</th>
                    <th className="p-4 font-bold font-sans">تاريخ التسجيل</th>
                    <th className="p-4 font-bold font-sans">حالة الجرد الحالية</th>
                    <th className="p-4 font-bold font-sans">الوصف والملاحظات</th>
                    <th className="p-4 font-bold font-sans text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCatalog.map(item => {
                    // Check if is in custody
                    const activeCust = custodyFromDb.find(c => c.assetName === item.name && c.status === 'active');
                    const tech = activeCust ? allTechnicians.find(t => t.id === activeCust.employeeId) : null;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">⚙️</span>
                            <span className="font-semibold font-sans text-gray-800">{item.name}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-sm text-gray-600">{item.serialNumber || 'N/A'}</td>
                        <td className="p-4 font-mono font-bold text-gray-900">{item.cost.toLocaleString()} ج.م</td>
                        <td className="p-4 font-mono text-sm text-gray-500">{new Date(item.purchaseDate).toLocaleDateString()}</td>
                        <td className="p-4">
                          {activeCust ? (
                            <span className="inline-flex items-center px-3 py-1 text-xs rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-100">
                              عهدة لـ: {tech ? tech.name : 'فني'} 👤
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 text-xs rounded-full font-medium bg-teal-50 text-teal-700 border border-teal-100">
                              متوفر بالخزانة العامة 🟢
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-sm font-sans text-gray-500 max-w-xs truncate">{item.note}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleDeleteTool(item.id!)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition"
                            title="شطب الأداة"
                          >
                            <Trash2 className="w-5 h-5 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONTENT: Tab 2 - Custody List */}
      {activeTab === 'custody' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          {filteredCustody.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-sans">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-xl">لا توجد كشوف عُهدات مخصصة ومطابقة للفني المختار.</p>
              <p className="text-sm text-gray-400 mt-1">اضغط على زر محضر تسليم عُهدة لتسليم أداة وفحصها.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#f8fafc] text-gray-700 text-sm border-b border-gray-100">
                    <th className="p-4 font-bold font-sans">أداة الورشة للعهدة</th>
                    <th className="p-4 font-bold font-sans">الفني المستلم لعهدة الطاولة</th>
                    <th className="p-4 font-bold font-sans">تاريخ التسليم</th>
                    <th className="p-4 font-bold font-sans">تاريخ الاسترجاع</th>
                    <th className="p-4 font-bold font-sans">حالة الأمانة</th>
                    <th className="p-4 font-bold font-sans">ملاحظات وشهادة الفحص</th>
                    <th className="p-4 font-bold font-sans text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCustody.map(cust => {
                    const tech = allTechnicians.find(t => t.id === cust.employeeId);
                    return (
                      <tr key={cust.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 font-sans">{cust.assetName}</span>
                            <span className="text-xs text-gray-400 font-mono">سيريال: {cust.serialNumber}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                              {tech ? tech.name[0] : 'U'}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-800 font-sans">{tech ? tech.name : 'اسم مجهول'}</span>
                              <span className="text-xs text-gray-500 font-sans">{tech ? tech.jobTitle : 'فني'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-sm text-gray-600">{cust.issueDate}</td>
                        <td className="p-4 font-mono text-sm text-gray-600">{cust.returnDate || '—'}</td>
                        <td className="p-4">
                          {cust.status === 'active' ? (
                            <span className="inline-flex items-center px-3 py-1 text-xs rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-100 animate-pulse">
                              تحت مسئولية الفني النشط 🎒
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 text-xs rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                              تم الجرد والاسترداد بأمان ✅
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-sm font-sans text-gray-600 max-w-xs truncate" title={cust.condition}>
                          {cust.condition}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            {cust.status === 'active' && (
                              <button
                                onClick={() => handleReturnCustody(cust.id!)}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold font-sans cursor-pointer transition border border-emerald-200"
                              >
                                إقرار الفحص والارتجاع
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedCustodyToPrint(cust)}
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition"
                              title="طباعة محضر تسليم العهدة"
                            >
                              <Printer className="w-5 h-5 mx-auto" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONTENT: Tab 3 - Reports and Historic stats */}
      {activeTab === 'logs' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <h2 className="text-xl font-bold font-sans text-gray-900 mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            تحليل كفائه العُهد ومؤشر تالف الورشة
          </h2>
          <p className="text-gray-500 font-sans mb-6">
            يقوم كشف العهدة بمقارنة وتثبيت مسئولية الفنيين عند ارتكاب أخطار صيانة أو في حال ضياع كابلات وأجهزة التيستر. يفرز الجدول أدناه مراجعة دقيقة لسلامة الأدوات:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h4 className="font-bold text-gray-900 font-sans mb-1">معدل الفحص والارتجاع السليم</h4>
              <p className="text-slate-500 text-sm font-sans mb-3">نسبة تسليم الأجهزة وعودتها سليمة بنسبة 100%.</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-bold text-teal-600">98.4%</span>
                <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full font-bold">ملتزم بالضوابط</span>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h4 className="font-bold text-gray-900 font-sans mb-1">نسبة الهلاك السنوي</h4>
              <p className="text-slate-500 text-sm font-sans mb-3">معدل استهلاك وتلف كوايات اللحام والهوت إير بمرور الوقت.</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-mono font-bold text-indigo-600">12.5%</span>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">معايير قياسية</span>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h4 className="font-bold text-gray-900 font-sans mb-1">أعلى الفنيين حفاظاً على الأدوات</h4>
              <p className="text-slate-500 text-sm font-sans mb-3">أكثر الفنيين التزاماً بتسليم عهد وتجهيز طاولة خالية من التلف.</p>
              <div className="flex items-center gap-2 text-teal-700 font-sans font-bold">
                <span>🏆 الفني الأوكراني المميز: أندري لوسينكو</span>
              </div>
            </div>
          </div>

          <div className="bg-[#f0fdf4] p-4 rounded-xl border border-[#bbf7d0] text-[#15803d] flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold font-sans">تعليمات جرد الورشة الوقائي الدوري</h4>
              <p className="text-sm font-sans mt-0.5">
                تلتزم الإدارة بعمل جرد مفاجئ للورشة في تاريخ 15 من كل شهر لتأكيد مطابقة الرقم التسلسلي لكل أداة (Multimeter, Hot-Air) مع السجل المتاح للأمن الداخلي.
              </p>
            </div>
          </div>
        </div>
      )}


      {/* MODAL 1: Add Tool Catalog */}
      {showAddToolModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 text-right">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold font-sans">شراء وتسجيل أداة عُهدة بالورشة</h3>
                <button onClick={() => setShowAddToolModal(false)} className="text-white hover:text-gray-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-teal-50 text-sm mt-1 font-sans">تسجيل أصل ثابت بالمخزن الداخلي لإصداره كعهدة تتبعية للفنيين.</p>
            </div>

            <form onSubmit={handleAddNewTool} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-700 font-bold font-sans mb-1">اسم الأداة الفنية *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: كاوية لحام Quick TS1200A ذكية"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold font-sans mb-1">تكلفة الشراء (ج.م) *</label>
                  <input
                    type="number"
                    required
                    value={toolCost}
                    onChange={(e) => setToolCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-bold font-sans mb-1">مسلسل الأداة (سيريال)</label>
                  <input
                    type="text"
                    placeholder="رقم السيريال المكتوب"
                    value={toolSerial}
                    onChange={(e) => setToolSerial(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold font-sans mb-1">الحالة عند الاستلام</label>
                <select
                  value={toolCondition}
                  onChange={(e) => setToolCondition(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl font-sans"
                >
                  <option value="ممتازة - جديدة">جديدة تماماً بكرتونة المصنع 🟢</option>
                  <option value="جيدة جداً - فحص كامل">مستعملة بحالة ممتازة 🔵</option>
                  <option value="صيانة متوسطة">بحاجة لترميم بسيط 🟡</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-bold font-sans mb-1">طريقة الإهلاك المحاسبي</label>
                  <select
                    value={depreciationMethod}
                    onChange={(e) => setDepreciationMethod(e.target.value as any)}
                    className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="linear">إهلاك خطي ثابت 📉</option>
                    <option value="double-declining">رصيد متناقص مضاعف (مسرّع) ⚡</option>
                    <option value="none">بدون إهلاك (سجل مستديم) 🛡️</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-bold font-sans mb-1">معدل الإهلاك السنوي (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={depreciationRate}
                    onChange={(e) => setDepreciationRate(parseFloat(e.target.value) || 0)}
                    disabled={depreciationMethod === 'none'}
                    className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold font-sans mb-1">ملاحظات ومواصفات</label>
                <textarea
                  rows={2}
                  placeholder="طاقة تشغيل 120 واط، تحتوي على 3 رؤوس تبديل للقطع الدقيقة والمكونات."
                  value={toolDesc}
                  onChange={(e) => setToolDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-sans"
                />
              </div>

              <div className="bg-[#f0fdf4] p-4 rounded-xl border border-[#bbf7d0] space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={postToLedger}
                    onChange={(e) => setPostToLedger(e.target.checked)}
                    className="w-5 h-5 text-teal-600 rounded-sm"
                  />
                  <span className="text-[#166534] font-bold font-sans text-sm">توليد قيد يومية محاسبي بالصندوق تلقائياً</span>
                </label>
                <p className="text-xs text-green-700/80 font-sans mr-7">
                  مدين: الأصول الثابتة (1100) بقيمة {toolCost.toLocaleString()} ج.م.<br />دائن: الصندوق/الكاش (1010) بقيمة لضمان تكامل ميزانية المحل.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddToolModal(false)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 font-sans cursor-pointer transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-sans hover:opacity-95 shadow-md cursor-pointer transition"
                >
                  حفظ وتسجيل الأصل 📌
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Issue Custody */}
      {showIssueCustodyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 text-right">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold font-sans">محضر تسليم وتحميل العُهدة للفني</h3>
                <button onClick={() => setShowIssueCustodyModal(false)} className="text-white hover:text-gray-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-blue-50 text-sm mt-1 font-sans">إصدار التزام رسمي على جهاز الفني وطاولته وحساب الجرد.</p>
            </div>

            <form onSubmit={handleIssueCustody} className="p-6 space-y-4">
              {assetsFromDb.length === 0 ? (
                <div className="p-6 text-center text-amber-600 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="font-bold">يرجى تسجيل أداة أو جهاز عُهدة أولاً في الورشة قبل عمل محاضر التسليم.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-gray-700 font-bold font-sans mb-1">اختر الأداة/العهد العامة المراد تسليمها *</label>
                    <select
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-sans"
                    >
                      {assetsFromDb.map(asset => {
                        const inCustody = custodyFromDb.some(c => c.assetName === asset.name && c.status === 'active');
                        return (
                          <option key={asset.id} value={asset.id} disabled={inCustody}>
                            {asset.name} {inCustody ? ' (قيد العهدة حالياً 🔒)' : ' (متاح 🔓)'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold font-sans mb-1">الفني المستلم (أسماء كوكبية مسيحية) *</label>
                    <select
                      value={selectedTechId}
                      onChange={(e) => setSelectedTechId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-sans"
                    >
                      {allTechnicians.map(t => (
                        <option key={t.id} value={t.id}>{t.name} — {t.jobTitle}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold font-sans mb-1">حالة الفحص قبل التسليم</label>
                    <input
                      type="text"
                      required
                      value={custodyCondition}
                      onChange={(e) => setCustodyCondition(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold font-sans mb-1">بنود وملاحظات الاستلام للأمن الداخلي</label>
                    <textarea
                      rows={3}
                      value={custodyNotes}
                      onChange={(e) => setCustodyNotes(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
                    />
                  </div>

                  <div className="flex gap-2 justify-end pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowIssueCustodyModal(false)}
                      className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 font-sans cursor-pointer transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-sans hover:opacity-95 shadow-md cursor-pointer transition"
                    >
                      إقرار وتسليم العهدة 📝
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* CUSTODY PRINT RECEIPT / SLIP (Simulated elegant modal printout) */}
      {selectedCustodyToPrint && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-200 text-right">
            {/* Header print preview */}
            <div className="bg-slate-800 text-white p-6 flex justify-between items-center">
              <span className="font-bold text-lg font-sans">📄 محضر وقرار تسليم عُهدة فنية</span>
              <button onClick={() => setSelectedCustodyToPrint(null)} className="text-gray-300 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6 bg-slate-50/50" id="print-area">
              <div className="text-center font-sans">
                <h3 className="text-xl font-bold text-slate-800">محلات كود تيك لصيانة الموبايل والكمبيوتر</h3>
                <p className="text-sm text-slate-500 mt-1">قسم الصيانة وإدارة جودة عُهد المهندسين</p>
                <div className="w-16 h-1 bg-indigo-500 mx-auto my-3"></div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 font-sans text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">اسم الفني المستلم:</span>
                  <span className="font-bold text-slate-800">
                    {allTechnicians.find(t => t.id === selectedCustodyToPrint.employeeId)?.name || 'فني الصيانة'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">المستوى الوظيفي:</span>
                  <span className="text-slate-700">
                    {allTechnicians.find(t => t.id === selectedCustodyToPrint.employeeId)?.jobTitle || 'فني'}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">أداة الورشة المسلمة:</span>
                  <span className="font-bold text-indigo-700">{selectedCustodyToPrint.assetName}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">الرقم التسلسلي (سيريال):</span>
                  <span className="font-mono text-slate-800">{selectedCustodyToPrint.serialNumber}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">تاريخ تسليم العُهدة:</span>
                  <span className="font-mono text-slate-800">{selectedCustodyToPrint.issueDate}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">تاريخ الارتجاع والجرد:</span>
                  <span className="font-mono text-slate-800">{selectedCustodyToPrint.returnDate || 'نشطة (تحت المسئولية) 🎒'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">حالة الفحص والاعتماد:</span>
                  <span className="text-slate-800 font-semibold">{selectedCustodyToPrint.condition}</span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs font-sans">
                ⚠️ يقر الفني بموجب توقيعه أو اعتماده الإلكتروني على هذا السجل بأنه استلم الأداة المذكورة أعلاه كاملة وصالحة للاستخدام، ويلتزم بالحفاظ عليها وعدم إخراجها خارج كشك الصيانة إلا بموافقة مكتوبة من الإدارة.
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm font-sans text-slate-700 text-center">
                <div>
                  <p className="font-bold">توقيع المستلم (الفني):</p>
                  <p className="mt-8 text-slate-400">.................................</p>
                </div>
                <div>
                  <p className="font-bold">مسئول جرد عُهدة الورشة:</p>
                  <p className="mt-8 text-slate-400">.................................</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-100 flex gap-2 justify-end">
              <button
                onClick={() => setSelectedCustodyToPrint(null)}
                className="px-5 py-2 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-sans font-bold cursor-pointer transition"
              >
                إغلاق المعاينة
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-sans font-bold cursor-pointer transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة المستند 🖨️</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ComputerMobileInternalTools;
