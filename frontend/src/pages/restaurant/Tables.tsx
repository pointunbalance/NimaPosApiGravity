
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db';
import { Table as TableType, Order } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { toast } from 'react-hot-toast';
import { hasPermission } from '../../utils/permissions';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { 
  LayoutGrid, Plus, Edit2, Trash2, X, Save, Armchair, 
  Users, CheckCircle2, Clock, AlertCircle, RefreshCw,
  Utensils, Receipt, History, Calendar, ArrowRight,
  MoreVertical, SplitSquareHorizontal, MoveRight, CreditCard,
  Wine, Coffee, Activity, ChevronRight, Search, QrCode, Printer
} from 'lucide-react';
import TableModal, { TableFormData } from '../../components/tables/TableModal';
import { TransferTableModal } from '../../components/tables/TransferTableModal';
import { SplitBillModal } from '../../components/tables/SplitBillModal';

const Tables: React.FC = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [editingTable, setEditingTable] = useState<TableType | null>(null);
  const [selectedTable, setSelectedTable] = useState<TableType | null>(null);
  const [filterZone, setFilterZone] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'occupied' | 'reserved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isSplitBillModalOpen, setIsSplitBillModalOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // State to track table deletion target for custom ConfirmModal
  const [tableToDeleteId, setTableToDeleteId] = useState<number | null>(null);
  const [activeMenuTableId, setActiveMenuTableId] = useState<number | null>(null);
  
  // States for Table Barcode Generator & Styling Customizer
  const [isQRViewModalOpen, setIsQRViewModalOpen] = useState(false);
  const [qrHeader, setQrHeader] = useState('مطعم نيما - الخدمة الذاتية الذكية');
  const [qrInstructions, setQrInstructions] = useState('امسح الرمز لقراءة قائمة المأكولات والمشروبات، اطلب وادفع عن بعد بكل سهولة');
  const [qrAccentColor, setQrAccentColor] = useState<'indigo' | 'slate' | 'emerald' | 'amber' | 'purple'>('indigo');
  const [qrShowLogo, setQrShowLogo] = useState(true);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalZoneQuery, setModalZoneQuery] = useState('all');

  const downloadQRAsSVG = (tableName: string) => {
    const svgEl = document.getElementById(`qr-svg-${tableName}`);
    if (!svgEl) {
      toast.error("عذراً، لم نتمكن من الحصول على عنصر الـ SVG للباركود.");
      return;
    }
    try {
      // Serialize and format SVG correctly for offline browser download
      const svgData = svgEl.outerHTML;
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const tempLink = document.createElement("a");
      tempLink.href = svgUrl;
      tempLink.download = `طاولة_${tableName}_باركود.svg`;
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(svgUrl);
      toast.success(`تم تحميل باركود الطاولة "${tableName}" بصيغة ممتازة بنجاح`);
    } catch (error) {
      console.error(error);
      toast.error("عذراً، حدث خطأ أثناء تحميل كود الباركود");
    }
  };
  
  const user = useMemo(() => {
    const currentUserData = localStorage.getItem('nima_user');
    return currentUserData ? JSON.parse(currentUserData) : { id: 1, name: 'Admin', role: 'admin' };
  }, []);
  
  const qrPrintRef = useRef<HTMLDivElement>(null);
  const handlePrintQRCodes = useReactToPrint({
      contentRef: qrPrintRef,
      documentTitle: 'طاولات_باركود',
  });

  // Update timer every minute for real-time elapsed
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const tables = useLiveQuery(() => db.diningTables.toArray(), []);
  const allOrders = useLiveQuery(() => db.orders.toArray(), []);

  const suggestedName = useMemo(() => {
      if (!tables || tables.length === 0) return '1';
      let maxNum = 0;
      tables.forEach(t => {
          const match = t.name.match(/\d+/);
          if (match) {
              const num = parseInt(match[0], 10);
              if (num > maxNum) maxNum = num;
          }
      });
      return (maxNum + 1).toString();
  }, [tables]);

  // --- Logic ---
  const getActiveOrder = (tableName: string) => {
      return allOrders?.find(o => 
          o.tableNumber === tableName && 
          o.orderType === 'dine-in' && 
          o.status !== 'refunded' && 
          o.fulfillmentStatus !== 'served'
      );
  };

  const getTableHistory = (tableName: string) => {
      if (!allOrders) return [];
      return allOrders
        .filter(o => 
            o.tableNumber === tableName && 
            o.orderType === 'dine-in' && 
            (o.status === 'refunded' || o.fulfillmentStatus === 'served')
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
  };

  const tablesWithDerivedData = useMemo(() => {
      if (!tables) return [];
      
      return tables.map(table => {
          const activeOrder = getActiveOrder(table.name);
          const baseStatus = table.status;
          let derivedStatus = baseStatus;
          if (activeOrder) {
              if (baseStatus !== 'requesting_bill') {
                  derivedStatus = 'occupied';
              }
          } else {
              derivedStatus = (baseStatus === 'reserved' || baseStatus === 'requesting_bill') ? baseStatus : 'available';
          }
          
          return {
              ...table,
              status: derivedStatus,
              activeOrder: activeOrder
          };
      });
  }, [tables, allOrders]);

  const filteredTables = useMemo(() => {
      let filtered = tablesWithDerivedData;
      
      if (filterZone !== 'all') {
          filtered = filtered.filter(t => t.zone === filterZone);
      }
      
      if (filterStatus !== 'all') {
          filtered = filtered.filter(t => t.status === filterStatus);
      }
      
      if (searchQuery.trim().length > 0) {
          const lowerQuery = searchQuery.toLowerCase();
          filtered = filtered.filter(t => 
              t.name.toLowerCase().includes(lowerQuery) || 
              t.zone.toLowerCase().includes(lowerQuery) ||
              (t.seats && t.seats.toString().includes(lowerQuery))
          );
      }
      
      return filtered;
  }, [tablesWithDerivedData, filterZone, searchQuery]);

  const uniqueZones = useMemo(() => {
      if (!tables) return ['indoor'];
      const zones = Array.from(new Set(tables.map(t => t.zone)));
      return zones.length > 0 ? zones : ['indoor'];
  }, [tables]);

  // --- Metrics ---
  const metrics = useMemo(() => {
    const total = tablesWithDerivedData.length;
    const requesting_bill = tablesWithDerivedData.filter(t => t.status === 'requesting_bill').length;
    const occupied = tablesWithDerivedData.filter(t => t.status === 'occupied').length + requesting_bill;
    const reserved = tablesWithDerivedData.filter(t => t.status === 'reserved').length;
    const available = total - occupied - reserved;
    
    // Calculate total active guests based roughly on table seats for occupied ones, or actual guests if tracked
    const activeGuests = tablesWithDerivedData
        .filter(t => t.status === 'occupied' || t.status === 'requesting_bill')
        .reduce((sum, t) => sum + (t.seats || 2), 0); // fallback to 2 if seats missing

    const activeTotal = tablesWithDerivedData
        .filter(t => t.activeOrder)
        .reduce((sum, t) => sum + (t.activeOrder?.totalAmount || 0), 0);

    return { total, occupied, reserved, available, activeGuests, activeTotal };
  }, [tablesWithDerivedData]);


  // --- Handlers ---
  const handleTableClick = (table: any) => {
      setSelectedTable(table);
      setIsDetailModalOpen(true);
  };

  const goToPOS = (tableName: string, e?: React.MouseEvent, action?: string) => {
      if (e) e.stopPropagation();
      navigate('/restaurant-pos', { state: { tableNumber: tableName, orderType: 'dine-in', action } });
  };

  const handleSaveTable = async (data: TableFormData) => {
    if (!hasPermission(user, null, 'tables_manage')) {
      toast.error('ليس لديك صلاحية لحفظ وتعديل الطاولات');
      return;
    }
    try {
      if (editingTable?.id) {
        await db.diningTables.update(editingTable.id, data);
        toast.success(`تم تحديث بيانات الطاولة "${data.name}" بنجاح`);
      } else {
        await db.diningTables.add(data as TableType);
        toast.success(`تم إضافة طاولة جديدة باسم "${data.name}"`);
      }
      closeModal();
    } catch (error) {
      console.error("Error saving table", error);
      toast.error('حدث خطأ أثناء حفظ الطاولة');
    }
  };

  const toggleReservation = async (table: TableType, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const newStatus = table.status === 'reserved' ? 'available' : 'reserved';
      if (table.id) {
          const updates: Partial<TableType> = { status: newStatus };
          if (newStatus === 'reserved') {
              updates.reservedAt = new Date();
          } else {
              updates.reservedAt = undefined;
          }
          await db.diningTables.update(table.id, updates);
          if(selectedTable?.id === table.id) {
              setSelectedTable({...selectedTable, ...updates});
          }
      }
  };

  const deleteTable = async (id: number) => {
    if (!hasPermission(user, null, 'tables_manage')) {
      toast.error('ليس لديك صلاحية لحذف الطاولات من الصالون');
      return;
    }
    // We trigger the state instead of window.confirm
    setTableToDeleteId(id);
  };

  const handleConfirmDeleteTable = async () => {
    if (tableToDeleteId) {
      try {
        await db.diningTables.delete(tableToDeleteId);
        toast.success('تم حذف الطاولة من نظام الصالون بنجاح');
        setTableToDeleteId(null);
        closeModal();
      } catch (error) {
        toast.error('حدث خطأ أثناء محاولة الحذف');
      }
    }
  };

  const openModal = (table?: TableType, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!hasPermission(user, null, 'tables_manage')) {
      toast.error('عذراً، لا تمتلك الصلاحية الإدارية اللازمة لتعديل أو إضافة طاولات الصالون');
      return;
    }
    if (table) {
      setEditingTable(table);
    } else {
      setEditingTable(null);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTable(null);
  };

  // --- Render Helpers ---
  const getTimeElapsed = (date: Date) => {
      const diff = now.getTime() - new Date(date).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `${mins} دقيقة`;
      const hours = Math.floor(mins / 60);
      return `${hours} ساعة ${mins % 60} دقيقة`;
  };

  const getProgressWidthStr = (date: Date) => {
     // A fun visual: progress bar fills up over 2 hours
     const diff = now.getTime() - new Date(date).getTime();
     const mins = Math.floor(diff / 60000);
     let percent = (mins / 120) * 100;
     if (percent > 100) percent = 100;
     return `${percent}%`;
  };

  const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('ar-IQ').format(amount);
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
               <div className="flex items-center gap-3 mb-2">
                   <div className="p-3 bg-brand-100/50 rounded-2xl">
                     <LayoutGrid className="w-8 h-8 text-brand-600" />
                   </div>
                   <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                       إدارة الطاولات والصالة
                   </h1>
               </div>
               <p className="text-slate-500 font-medium text-sm pr-1">تخطيط الصالة بصرياً، ومتابعة الطلبات المباشرة للطاولات</p>
            </div>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <button onClick={() => setFilterStatus('all')} className={`bg-white p-0 rounded-3xl border transition-all text-right shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] block w-full ${filterStatus === 'all' ? 'border-brand-500 ring-4 ring-brand-500/10' : 'border-slate-100 hover:border-slate-300'}`}>
               <div className="flex items-center gap-4 w-full h-full p-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${filterStatus === 'all' ? 'bg-brand-50 text-brand-600 border-brand-200' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                    <Armchair className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-bold mb-0.5">كل الطاولات</p>
                    <p className="text-2xl font-black text-slate-800">{metrics.total}</p>
                </div>
               </div>
            </button>
            <button onClick={() => setFilterStatus('available')} className={`bg-white p-0 rounded-3xl border transition-all text-right shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] block w-full relative overflow-hidden ${filterStatus === 'available' ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-100 hover:border-slate-300'}`}>
                <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500"></div>
                <div className="flex items-center gap-4 w-full h-full p-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100">
                      <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-sm text-slate-500 font-bold mb-0.5">طاولة متاحة</p>
                      <p className="text-2xl font-black text-emerald-600">{metrics.available}</p>
                  </div>
                </div>
            </button>
            <button onClick={() => setFilterStatus('occupied')} className={`bg-white p-0 rounded-3xl border transition-all text-right shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] block w-full relative overflow-hidden ${filterStatus === 'occupied' ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-100 hover:border-slate-300'}`}>
                <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
                <div className="flex items-center gap-4 w-full h-full p-4">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shrink-0 border border-red-100">
                      <Activity className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-sm text-slate-500 font-bold mb-0.5">طاولة مشغولة</p>
                      <p className="text-2xl font-black text-red-600">{metrics.occupied}</p>
                  </div>
                </div>
            </button>
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex items-center gap-4 cursor-default">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                     <p className="text-sm text-slate-500 font-bold mb-0.5">الضيوف (تقريبي)</p>
                     <p className="text-2xl font-black text-blue-600">{metrics.activeGuests}</p>
                </div>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex items-center gap-4 cursor-default md:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 border border-purple-100">
                    <Receipt className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-slate-500 font-bold mb-0.5">قيمة الجلسات الحالية</p>
                    <p className="text-2xl font-black text-purple-600 truncate max-w-[140px]" title={formatCurrency(metrics.activeTotal)}>
                       {formatCurrency(metrics.activeTotal)}
                    </p>
                </div>
            </div>
        </div>
      </div>

      {/* Filter Tabs, Search & Quick Actions Row */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] mx-0.5">
          <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 scrollbar-none flex-1">
              <button 
                onClick={() => setFilterZone('all')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap border ${filterZone === 'all' ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-100' : 'bg-transparent border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                  كافة المناطق
              </button>
              {uniqueZones.map(zone => (
                  <button 
                    key={zone}
                    onClick={() => setFilterZone(zone)}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all capitalize whitespace-nowrap border ${filterZone === zone ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-100' : 'bg-transparent border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                  >
                      {zone}
                  </button>
              ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <div className="relative max-w-xs w-full">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <Search className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                      type="text"
                      placeholder="ابحث عن طاولة..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 block pr-12 p-2.5 font-medium transition-all"
                  />
              </div>

              <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsQRViewModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-100 font-bold transition-all border border-indigo-500 hover:scale-[1.02]"
                  >
                    <QrCode className="w-4 h-4" />
                    <span className="text-sm">باركود الطاولات</span>
                  </button>
                  <button 
                    onClick={(e) => openModal(undefined, e)}
                    className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-brand-100 font-bold transition-all border border-brand-500 hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">إضافة طاولة</span>
                  </button>
              </div>
          </div>
      </div>

      {/* Enhanced Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredTables.map((table: any) => {
              const isOccupied = table.status === 'occupied';
              const isReserved = table.status === 'reserved';
              const isRequestingBill = table.status === 'requesting_bill';
              const isAvailable = table.status === 'available';
              
              const totalSeats = table.seats || 4;
              const occupiedSeats = (isOccupied || isRequestingBill) 
                  ? (totalSeats > 2 ? Math.max(1, totalSeats - 2) : totalSeats) 
                  : 0;

              return (
              <div 
                key={table.id} 
                onClick={() => handleTableClick(table)}
                className={`flex flex-col relative p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer group hover:-translate-y-1.5 hover:shadow-md bg-white
                    ${isRequestingBill ? 'border-amber-200 bg-amber-50/5 hover:border-amber-300 shadow-sm shadow-amber-50' : 
                      isOccupied ? 'border-red-200 bg-red-50/5 hover:border-red-300 shadow-sm shadow-red-50/55' : 
                      isReserved ? 'border-sky-200 bg-sky-50/5 hover:border-sky-300 shadow-sm shadow-sky-50/55' :
                      'border-emerald-200 bg-emerald-50/5 hover:border-emerald-300 shadow-sm shadow-emerald-50/55'
                    }
                `}
              >
                  {/* Header -> Options icon + Zone */}
                  <div className="flex justify-between items-start w-full relative z-30 mb-4">
                      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest font-[Tajawal]">
                          {table.zone}
                      </span>
                      <div className="relative">
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuTableId(activeMenuTableId === table.id ? null : table.id);
                            }}
                            className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                          >
                              <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {activeMenuTableId === table.id && (
                              <div 
                                  className="absolute left-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 animate-in fade-in zoom-in-95 duration-150 text-right"
                                  onClick={(e) => e.stopPropagation()}
                              >
                                  <button 
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          openModal(table);
                                          setActiveMenuTableId(null);
                                      }}
                                      className="w-full px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 font-bold text-xs"
                                  >
                                      <span className="text-right">تعديل بيانات الطاولة</span>
                                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                  </button>

                                  <button 
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          if (table.activeOrder) {
                                              setSelectedTable(table);
                                              setIsTransferModalOpen(true);
                                          } else {
                                              toast.error("هذه الطاولة ليست مشغولة حالياً لنقل طلبها");
                                          }
                                          setActiveMenuTableId(null);
                                      }}
                                      className="w-full px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 font-bold text-xs border-t border-slate-100/50"
                                  >
                                      <span className="text-right">نقل الطلب لطاولة أخرى</span>
                                      <MoveRight className="w-3.5 h-3.5 text-slate-400" />
                                  </button>

                                  <button 
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          if (table.activeOrder) {
                                              setSelectedTable(table);
                                              setIsTransferModalOpen(true);
                                          } else {
                                              toast.error("هذه الطاولة ليست مشغولة حالياً لبدء الدمج");
                                          }
                                          setActiveMenuTableId(null);
                                      }}
                                      className="w-full px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 font-bold text-xs"
                                  >
                                      <span className="text-right">دمج مع طاولة أخرى</span>
                                      <SplitSquareHorizontal className="w-3.5 h-3.5 text-slate-400" />
                                  </button>

                                  <button 
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          toggleReservation(table, e);
                                          setActiveMenuTableId(null);
                                      }}
                                      className="w-full px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-700 font-bold text-xs border-t border-slate-100"
                                  >
                                      <span className="text-right">{isReserved ? 'إلغاء حجز الطاولة' : 'حجز الطاولة مسبقاً'}</span>
                                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Center Visualization */}
                  <div className="flex-1 flex flex-col items-center justify-center mb-6 relative z-10">
                      <div className={`w-full max-w-[145px] px-3 py-4 rounded-xl flex flex-col items-center justify-center text-center border-2 transition-all duration-300
                          ${isRequestingBill ? 'bg-amber-50/80 border-amber-100 text-amber-700' : 
                            isOccupied ? 'bg-red-50/80 border-red-100 text-red-600' : 
                            isReserved ? 'bg-sky-50/80 border-sky-100 text-sky-700' :
                            'bg-emerald-50/80 border-emerald-100 text-emerald-600'
                          }
                      `}>
                          <span className="text-base font-black tracking-tight leading-tight break-words font-[Tajawal]">
                              {table.name}
                          </span>
                      </div>

                      {/* Capacity Indicator Badge */}
                      <div className={`flex flex-row items-center justify-center gap-2 mt-3 text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-300 ${
                          isAvailable 
                              ? 'bg-emerald-50/40 text-emerald-700 border-emerald-100/30' 
                              : isOccupied || isRequestingBill 
                                  ? (occupiedSeats === totalSeats 
                                      ? 'bg-red-50 text-red-600 border-red-100 ring-2 ring-red-500/5' 
                                      : 'bg-amber-50 text-amber-600 border-amber-100 ring-2 ring-amber-500/5') 
                                  : 'bg-sky-50 text-sky-600 border-sky-100'
                      }`}>
                          <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">السعة:</span>
                          <span className="font-mono font-black">{occupiedSeats}/{totalSeats}</span>
                          <Users className="w-3.5 h-3.5 opacity-80" />
                      </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className="mt-auto relative z-10">
                      {isOccupied && table.activeOrder ? (
                          <div className="flex flex-col gap-2">
                              {/* Order Amount */}
                              <div className="flex justify-between items-end border-b border-dashed border-red-50 pb-2">
                                  <span className="text-xs font-bold text-red-500 uppercase tracking-wider font-[Tajawal]">الحساب</span>
                                  <span className="text-lg font-black text-red-600 font-mono">{formatCurrency(table.activeOrder.totalAmount)}</span>
                              </div>
                              {/* Timer/Progress */}
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                                  <div className="h-full bg-red-500 rounded-full transition-all duration-1000" style={{width: getProgressWidthStr(table.activeOrder.date)}}></div>
                              </div>
                              <p className="text-[11px] text-center text-red-600 font-extrabold mt-2 mb-1.5 leading-none">
                                  مضي {getTimeElapsed(table.activeOrder.date)}
                              </p>
                              
                              {/* Quick Actions (Hover) */}
                              <div className="absolute -bottom-2 inset-x-0 bg-white/95 backdrop-blur-sm pt-2 p-1 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-hover:bottom-0 rounded-b-2xl transition-all duration-300 flex justify-center gap-2 border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                                  <button onClick={(e) => goToPOS(table.name, e, 'pay')} className="flex-1 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 font-bold py-2 rounded-xl text-xs transition-colors border border-red-100 hover:border-red-500">
                                      الدفع
                                  </button>
                                  <button onClick={(e) => goToPOS(table.name, e)} className="flex-1 bg-brand-50 hover:bg-brand-600 hover:text-white text-brand-700 font-bold py-2 rounded-xl text-xs transition-colors border border-brand-100 hover:border-brand-600">
                                      + طلب
                                  </button>
                              </div>
                          </div>

                      ) : (
                          <div className="flex flex-col gap-3">
                               {/* Empty State Banner */}
                              <div className={`text-center py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-colors border
                                  ${isReserved 
                                      ? 'bg-sky-50/60 border-sky-100 text-sky-700' 
                                      : 'bg-slate-50 border-slate-100 text-slate-500 group-hover:bg-emerald-50/80 group-hover:border-emerald-200 group-hover:text-emerald-700'
                                  }
                              `}>
                                  <div className="flex items-center gap-2 font-[Tajawal]">
                                      {isReserved ? <Clock className="w-4 h-4 text-sky-500" /> : <Armchair className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />}
                                      <span>{isReserved ? 'محجوزة مسبقاً' : 'طاولة فارغة'}</span>
                                  </div>
                                  {isReserved && table.reservedAt && (
                                     <div className="text-[10px] opacity-80 font-mono">
                                        منذ {getTimeElapsed(table.reservedAt)}
                                     </div>
                                  )}
                              </div>

                               {/* Quick Actions (Hover) */}
                               <div className="absolute -bottom-2 inset-x-0 bg-white/95 backdrop-blur-sm pt-2 p-1 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-hover:bottom-0 rounded-b-2xl transition-all duration-300 flex justify-center gap-2 border-t border-slate-100 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                                  <button onClick={(e) => toggleReservation(table, e)} className={`flex-1 font-bold py-2 rounded-xl text-xs transition-colors border ${isReserved ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-600 hover:text-white' : 'bg-sky-50 hover:bg-sky-500 hover:text-white text-sky-600 border-sky-100 hover:border-sky-500'}`}>
                                      {isReserved ? 'إلغاء' : 'حجز'}
                                  </button>
                                  <button onClick={(e) => goToPOS(table.name, e)} className="flex-1 bg-brand-50 hover:bg-brand-600 hover:text-white text-brand-700 font-bold py-2 rounded-xl text-xs transition-colors border border-brand-100 hover:border-brand-600">
                                      فتح POS
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          )})}
          
          {/* Add New Quick Button */}
          <button 
            onClick={(e) => openModal(undefined, e)}
            className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50/50 transition-all duration-300 w-full min-h-[260px] group hover:shadow-md hover:scale-[1.02] cursor-pointer bg-white"
          >
              <div className="w-16 h-16 bg-slate-50 group-hover:bg-brand-100 group-hover:text-brand-600 rounded-full flex items-center justify-center mb-4 transition-colors duration-300 shadow-inner">
                  <Plus className="w-8 h-8" />
              </div>
              <span className="font-bold text-lg text-slate-700 group-hover:text-brand-600 transition-colors duration-300 font-[Tajawal]">إضافة طاولة</span>
              <p className="text-xs mt-2 opacity-75 font-medium text-slate-400 group-hover:text-brand-500 transition-colors duration-300 font-[Tajawal]">إعداد طاولة جديدة في الصالة</p>
          </button>
      </div>

      {/* Detail Modal (Side Panel Style instead of generic Modal for smoother UX) */}
      {isDetailModalOpen && selectedTable && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDetailModalOpen(false)}>
              <div 
                  className="bg-white w-full max-w-md h-full shadow-[-20px_0_40px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-300"
                  onClick={e => e.stopPropagation()}
              >
                  {/* Header */}
                  <div className={`p-6 flex flex-col justify-between relative overflow-hidden ${
                      selectedTable.status === 'requesting_bill' ? 'bg-yellow-500 text-white' :
                      selectedTable.status === 'occupied' ? 'bg-red-600 text-white' : 
                      selectedTable.status === 'reserved' ? 'bg-orange-500 text-white' : 
                      'bg-emerald-600 text-white'
                  }`}>
                      <div className="absolute -right-10 -top-10 opacity-10">
                          {selectedTable.status === 'occupied' || selectedTable.status === 'requesting_bill' ? <Wine className="w-48 h-48" strokeWidth={1} /> : <Coffee className="w-48 h-48" strokeWidth={1} />}
                      </div>

                      <div className="flex justify-between items-start relative z-10 mb-6">
                           <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border border-white/20">
                               {selectedTable.zone}
                           </span>
                           <button onClick={() => setIsDetailModalOpen(false)} className="bg-black/20 p-2 rounded-full hover:bg-black/40 transition-colors">
                               <ChevronRight className="w-5 h-5" />
                           </button>
                      </div>

                      <div className="flex items-center gap-5 relative z-10">
                          <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-4xl font-black shadow-lg bg-white ${
                              selectedTable.status === 'requesting_bill' ? 'text-yellow-600' :
                              selectedTable.status === 'occupied' ? 'text-red-600' : 
                              selectedTable.status === 'reserved' ? 'text-orange-600' : 
                              'text-emerald-600'
                          }`}>
                              {selectedTable.seats}
                          </div>
                          <div>
                              <h2 className="text-4xl font-black mb-1">{selectedTable.name}</h2>
                              <p className="text-sm font-bold opacity-80 flex items-center gap-2">
                                  {selectedTable.status === 'requesting_bill' ? 'يطلب الفاتورة' : selectedTable.status === 'occupied' ? 'طاولة مشغولة بالحضور' : selectedTable.status === 'reserved' ? 'الطاولة محجوزة مسبقاً' : 'متوفرة وجاهزة للجلوس'}
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                      
                      {/* Active Order Section */}
                      {(selectedTable as any).activeOrder ? (
                          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 mb-6 relative overflow-hidden">
                              <div className="absolute top-0 inset-x-0 h-1 bg-red-500"></div>
                              <div className="flex justify-between items-start mb-5">
                                  <h3 className="font-bold text-slate-800 flex items-center gap-2 border-b-2 border-brand-100 pb-1 w-max">
                                      <Receipt className="w-5 h-5 text-brand-600" />
                                      فاتورة الجلسة
                                  </h3>
                                  <div className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-bold border border-red-100">
                                      مضي {getTimeElapsed((selectedTable as any).activeOrder.date)}
                                  </div>
                              </div>
                              
                              <div className="space-y-3 mb-5 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                  {(selectedTable as any).activeOrder.items.map((item: any, idx: number) => (
                                      <div key={idx} className="flex flex-col gap-1 text-sm border-b border-dashed border-slate-100 pb-2 last:border-0">
                                          <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-2 max-w-[70%]">
                                                <span className="bg-slate-100 text-slate-600 font-bold px-1.5 rounded text-xs mt-0.5 shrink-0">{item.quantity}x</span>
                                                <span className="text-slate-700 font-medium leading-tight">{item.name}</span>
                                            </div>
                                            <span className="font-bold text-slate-900 shrink-0">{formatCurrency(item.total)}</span>
                                          </div>
                                          {item.notes && <span className="text-[10px] text-slate-400 bg-slate-50 p-1 rounded pr-8 w-max">- {item.notes}</span>}
                                      </div>
                                  ))}
                              </div>
                              
                              <div className="bg-slate-800 text-white p-4 rounded-2xl flex justify-between items-center shadow-lg transform hover:scale-[1.02] transition-transform">
                                  <span className="font-bold text-slate-300">الإجمالي النهائي</span>
                                  <span className="text-2xl font-black">{formatCurrency((selectedTable as any).activeOrder.totalAmount)}</span>
                              </div>
                          </div>
                      ) : (
                          <div className="text-center py-12 bg-white rounded-3xl border-2 border-slate-100 border-dashed mb-6 flex flex-col items-center justify-center">
                              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                  <Utensils className="w-10 h-10 text-slate-300" />
                              </div>
                              <p className="text-slate-800 text-lg font-black mb-1">لا توجد طلبات جارية</p>
                              <p className="text-sm text-slate-500 font-medium px-8 leading-relaxed">ابحث عن الضيوف وابدأ بأخذ الطلبات من شاشة نقطة البيع</p>
                          </div>
                      )}

                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
                         <button onClick={(e) => goToPOS(selectedTable.name, e)} className="flex flex-col items-center justify-center gap-2 bg-white border border-slate-200 p-4 rounded-2xl hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600 transition-all group font-bold text-slate-600">
                             <div className="p-3 bg-slate-50 rounded-full group-hover:bg-white transition-colors text-emerald-600">
                                <Plus className="w-5 h-5" />
                             </div>
                             إضافة طلبات
                         </button>
                         <button onClick={(e) => goToPOS(selectedTable.name, e, 'pay')} className="flex flex-col items-center justify-center gap-2 bg-white border border-slate-200 p-4 rounded-2xl hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 transition-all group font-bold text-slate-600">
                             <div className="p-3 bg-slate-50 rounded-full group-hover:bg-white transition-colors text-brand-600">
                                <CreditCard className="w-5 h-5" />
                             </div>
                             دفـــع
                         </button>
                         <button onClick={() => setIsTransferModalOpen(true)} className="flex flex-col items-center justify-center gap-2 bg-white border border-slate-200 p-4 rounded-2xl hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 transition-all group font-bold text-slate-600">
                             <div className="p-3 bg-slate-50 rounded-full group-hover:bg-white transition-colors text-purple-600">
                                <MoveRight className="w-5 h-5" />
                             </div>
                             نقل الطاولة
                         </button>
                         <button onClick={() => setIsSplitBillModalOpen(true)} className="flex flex-col items-center justify-center gap-2 bg-white border border-slate-200 p-4 rounded-2xl hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all group font-bold text-slate-600">
                             <div className="p-3 bg-slate-50 rounded-full group-hover:bg-white transition-colors text-indigo-600">
                                <SplitSquareHorizontal className="w-5 h-5" />
                             </div>
                             تقسيم الفاتورة
                         </button>
                         {selectedTable.status === 'occupied' ? (
                             <button onClick={async () => {
                                 if (selectedTable.id) {
                                     await db.diningTables.update(selectedTable.id, { status: 'requesting_bill' });
                                     setIsDetailModalOpen(false);
                                 }
                             }} className="col-span-2 flex flex-col items-center justify-center gap-2 bg-white border border-slate-200 p-4 rounded-2xl hover:border-yellow-300 hover:bg-yellow-50 hover:text-yellow-600 transition-all group font-bold text-slate-600">
                                 <div className="p-3 bg-slate-50 rounded-full group-hover:bg-white transition-colors text-yellow-600">
                                    <Receipt className="w-5 h-5" />
                                 </div>
                                 يطلب الفاتورة
                             </button>
                         ) : (
                             <button onClick={(e) => toggleReservation(selectedTable, e)} className="col-span-2 flex flex-col items-center justify-center gap-2 bg-white border border-slate-200 p-4 rounded-2xl hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition-all group font-bold text-slate-600">
                                 <div className="p-3 bg-slate-50 rounded-full group-hover:bg-white transition-colors text-orange-600">
                                    <AlertCircle className="w-5 h-5" />
                                 </div>
                                 {selectedTable.status === 'reserved' ? 'إلغاء حجز' : 'حجز'}
                             </button>
                         )}
                      </div>

                      {/* History Section Minimal */}
                      <div className="bg-white rounded-3xl p-5 border border-slate-200">
                      <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                             <History className="w-4 h-4 text-slate-400" />
                             سجل الجلسات (آخر 5)
                          </span>
                      </h3>
                      <div className="space-y-1">
                          {getTableHistory(selectedTable.name).map((order) => (
                              <div key={order.id} className="flex justify-between items-center py-2.5 text-sm hover:bg-slate-50 px-2 rounded-lg transition-colors border-b border-slate-50 last:border-0 border-dashed">
                                  <div className="flex items-center gap-3">
                                      <div className="p-1.5 bg-slate-100 rounded-md text-slate-500">
                                          <Receipt className="w-3.5 h-3.5" />
                                      </div>
                                      <div>
                                          <p className="font-bold text-slate-700 leading-none mb-1">#{order.id}</p>
                                          <p className="text-[10px] text-slate-400 font-mono">
                                              {new Date(order.date).toLocaleDateString()}
                                          </p>
                                      </div>
                                  </div>
                                  <span className="font-bold text-slate-800">{formatCurrency(order.totalAmount)}</span>
                              </div>
                          ))}
                          {getTableHistory(selectedTable.name).length === 0 && (
                              <p className="text-center text-slate-400 text-xs py-4 font-medium">الطاولة لم تُستخدم بعد</p>
                          )}
                      </div>
                      </div>

                  </div>

                  {/* Main Action Footer */}
                  <div className="p-5 bg-white border-t border-slate-200 shadow-[0_-20px_20px_rgba(0,0,0,0.02)] relative z-20 shrink-0">
                      {(selectedTable as any).activeOrder ? (
                          <div className="flex gap-3">
                              <button 
                                onClick={(e) => goToPOS(selectedTable.name, e)}
                                className="flex-1 py-4 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-200 hover:-translate-y-1"
                              >
                                  <Plus className="w-5 h-5" />
                                  إضافة عنصر للطلب
                              </button>
                          </div>
                      ) : (
                          <button 
                            onClick={(e) => goToPOS(selectedTable.name, e)}
                            className="w-full py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-black transition-colors flex items-center justify-center gap-2 shadow-xl shadow-slate-200 hover:-translate-y-1"
                          >
                              <Utensils className="w-5 h-5" />
                              بدء جلسة جديدة (POS)
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      <TableModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        editingTable={editingTable}
        onSave={handleSaveTable}
        onDelete={deleteTable}
        suggestedName={suggestedName}
      />

      <ConfirmModal
        isOpen={tableToDeleteId !== null}
        title="تأكيد حذف الطاولة"
        message="هل أنت متأكد من رغبتك في حذف هذه الطاولة بشكل نهائي من الصالون؟ هذا الإجراء لا يمكن التراجع عنه."
        onConfirm={handleConfirmDeleteTable}
        onCancel={() => setTableToDeleteId(null)}
        confirmText="نعم، احذف الطاولة"
        cancelText="تراجع وإلغاء"
      />

      {isDetailModalOpen && selectedTable && (selectedTable as any).activeOrder && (
          <>
          <TransferTableModal
              isOpen={isTransferModalOpen}
              onClose={() => {
                  setIsTransferModalOpen(false);
                  setIsDetailModalOpen(false);
              }}
              currentTable={selectedTable}
              activeOrder={(selectedTable as any).activeOrder}
          />
          <SplitBillModal
              isOpen={isSplitBillModalOpen}
              onClose={() => setIsSplitBillModalOpen(false)}
              currentTable={selectedTable}
              activeOrder={(selectedTable as any).activeOrder}
          />
          </>
      )}

      {/* Table QR Codes Management & Customizer Modal */}
      {isQRViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-150 animate-in zoom-in-95 duration-200 text-right font-[Tajawal]" dir="rtl">
            
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">مصمم باركودات طاولات الصالة الذكي</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">تحميل وتخصيص هوية الاستجابة السريعة (QR) المناسبة لطلبات عملاء الصالة</p>
                </div>
              </div>
              <button 
                onClick={() => setIsQRViewModalOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                title="إغلاق"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body (Two Column Grid) */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100">
              
              {/* Column 1: Config Controls (Right Panel) */}
              <div className="w-full lg:w-[380px] p-6 lg:p-8 overflow-y-auto shrink-0 bg-slate-50/30">
                <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 mb-2 block">تخصيص الهوية البصرية</span>
                <h4 className="text-lg font-bold text-slate-800 mb-5">مظهر كرت الطاولة</h4>

                {/* Option: Color Swatches */}
                <div className="mb-6">
                  <label className="text-xs font-bold text-slate-600 block mb-3">نمط لون الإطار والوسم والخط</label>
                  <div className="flex items-center gap-3">
                    {[
                      { id: 'indigo', name: 'النيلي الأنيق', color: 'bg-indigo-600' },
                      { id: 'slate', name: 'المعدني الهادئ', color: 'bg-slate-600' },
                      { id: 'emerald', name: 'الأخضر الحيوي', color: 'bg-emerald-600' },
                      { id: 'amber', name: 'الذهبي الأصيل', color: 'bg-amber-500' },
                      { id: 'purple', name: 'الأرجواني الملكي', color: 'bg-purple-600' }
                    ].map((swatch) => (
                      <button
                        key={swatch.id}
                        onClick={() => setQrAccentColor(swatch.id as any)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          qrAccentColor === swatch.id 
                            ? 'ring-4 ring-slate-800 ring-offset-2 scale-110 shadow-md' 
                            : 'opacity-85 hover:opacity-100 hover:scale-105'
                        }`}
                        title={swatch.name}
                      >
                        <div className={`w-8 h-8 rounded-full ${swatch.color} border border-white/25`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Option: Custom Branding Name */}
                <div className="mb-5">
                  <label className="text-xs font-bold text-slate-700 block mb-2">عنوان الكرت العُلوي (البراند)</label>
                  <input
                    type="text"
                    value={qrHeader}
                    onChange={(e) => setQrHeader(e.target.value)}
                    placeholder="مطعم نيما - الخدمة الذاتية الذكية"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>

                {/* Option: Custom Instructions */}
                <div className="mb-6">
                  <label className="text-xs font-bold text-slate-700 block mb-2">نص وفاق التوجيه للعميل (الأسفل)</label>
                  <textarea
                    rows={3}
                    value={qrInstructions}
                    onChange={(e) => setQrInstructions(e.target.value)}
                    placeholder="امسح الرمز لقراءة قائمة المأكولات والمشروبات..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-700 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all leading-relaxed resize-none"
                  />
                </div>

                {/* Option: Show Icon Badge */}
                <div className="flex items-center justify-between p-3.5 bg-slate-100/50 rounded-2xl border border-slate-200/50 mb-8">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700">تضمين أيقونة شعار الخدمة</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={qrShowLogo}
                    onChange={(e) => setQrShowLogo(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2"
                  />
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-3 block">فرز وتصفية الطاولات</span>
                  
                  {/* Inline Search inside Modal */}
                  <div className="relative mb-4">
                    <Search className="absolute right-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ابحث برقم/اسم الطاولة..."
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs font-medium focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                    />
                  </div>

                  {/* Inline Zone selection */}
                  <select
                    value={modalZoneQuery}
                    onChange={(e) => setModalZoneQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  >
                    <option value="all">كافة مناطق ومرافق الصالون</option>
                    {uniqueZones.map((z) => (
                      <option key={z} value={z}>منطقة: {z}</option>
                    ))}
                  </select>
                </div>

                {/* Bulk Action Buttons */}
                <div className="mt-8">
                  <button
                    onClick={() => {
                      setIsQRViewModalOpen(false);
                      setTimeout(() => handlePrintQRCodes(), 300);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <Printer className="w-5 h-5" />
                    <span>طباعة كافة الباركودات ({
                      tables?.filter(t => {
                        const s = t.name.toLowerCase().includes(modalSearchQuery.toLowerCase());
                        const z = modalZoneQuery === 'all' || t.zone === modalZoneQuery;
                        return s && z;
                      }).length || 0
                    }) المحددة</span>
                  </button>
                  <button
                    onClick={() => {
                      setQrHeader('مطعم نيما - الخدمة الذاتية الذكية');
                      setQrInstructions('امسح الرمز لقراءة قائمة المأكولات والمشروبات، اطلب وادفع عن بعد بكل سهولة');
                      setQrAccentColor('indigo');
                      setQrShowLogo(true);
                      setModalSearchQuery('');
                      setModalZoneQuery('all');
                      toast.success('تمت إعادة ضبط تصميم الباركود للإعدادات القياسية');
                    }}
                    className="w-full bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 font-bold py-2 px-4 rounded-xl text-xs border border-slate-200 transition-all text-center mt-3"
                  >
                    إعادة ضبط الإعدادات القياسية
                  </button>
                </div>

              </div>

              {/* Column 2: Live Previews Grid (Left Panel) */}
              <div className="flex-1 p-6 lg:p-8 overflow-y-auto bg-slate-50/50">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-xs font-bold text-slate-400">
                    استعراض مباشر لبطاقات الصالون المجهزة ({
                      tables?.filter(t => {
                        const s = t.name.toLowerCase().includes(modalSearchQuery.toLowerCase());
                        const z = modalZoneQuery === 'all' || t.zone === modalZoneQuery;
                        return s && z;
                      }).length || 0
                    } من إجمالي {tables?.length || 0})
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">معدل المعاينة النشطة</span>
                  </div>
                </div>

                {/* Grid */}
                {tables?.filter(t => {
                  const s = t.name.toLowerCase().includes(modalSearchQuery.toLowerCase());
                  const z = modalZoneQuery === 'all' || t.zone === modalZoneQuery;
                  return s && z;
                }).length === 0 ? (
                  <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8 bg-white border border-dashed border-slate-200 rounded-3xl">
                    <div className="p-4 bg-slate-50 text-slate-400 rounded-full mb-3">
                      <QrCode className="w-10 h-10 opacity-40" />
                    </div>
                    <span className="text-base font-bold text-slate-700">لا توجد طاولات تطابق فلاتر البحث الحالية</span>
                    <p className="text-xs text-slate-400 mt-1">تأكد من عدم وجود مسافات زائدة أو قم بتغيير الفلترة لاسترجاع البيانات</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tables?.filter(t => {
                      const s = t.name.toLowerCase().includes(modalSearchQuery.toLowerCase());
                      const z = modalZoneQuery === 'all' || t.zone === modalZoneQuery;
                      return s && z;
                    }).map((table) => {
                      const orderUrl = `${window.location.origin}${window.location.pathname}#/customer-menu?table=${encodeURIComponent(table.name)}`;
                      
                      // Accent Color mapping logic inside map helper
                      const isIndigo = qrAccentColor === 'indigo';
                      const isSlate = qrAccentColor === 'slate';
                      const isEmerald = qrAccentColor === 'emerald';
                      const isAmber = qrAccentColor === 'amber';
                      const isPurple = qrAccentColor === 'purple';

                      const borderClass = isIndigo ? 'border-indigo-500' : isSlate ? 'border-slate-500' : isEmerald ? 'border-emerald-500' : isAmber ? 'border-amber-500' : 'border-purple-500';
                      const textClass = isIndigo ? 'text-indigo-600' : isSlate ? 'text-slate-600' : isEmerald ? 'text-emerald-600' : isAmber ? 'text-amber-500' : 'text-purple-600';
                      const bgLightClass = isIndigo ? 'bg-indigo-50/50' : isSlate ? 'bg-slate-50' : isEmerald ? 'bg-emerald-50/50' : isAmber ? 'bg-amber-50/50' : 'bg-purple-50/50';
                      const accentColorHex = isIndigo ? '#4f46e5' : isSlate ? '#475569' : isEmerald ? '#10b981' : isAmber ? '#f59e0b' : '#9333ea';

                      return (
                        <div 
                          key={table.id} 
                          className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_4px_15px_-3px_rgba(0,0,0,0.03)] hover:shadow-xl hover:border-slate-200 transition-all flex flex-col items-center text-center relative group overflow-hidden"
                        >
                          {/* Live preview badge banner */}
                          <div className={`absolute top-0 inset-x-0 h-1.5 ${
                            isIndigo ? 'bg-indigo-500' : isSlate ? 'bg-slate-500' : isEmerald ? 'bg-emerald-500' : isAmber ? 'bg-amber-500' : 'bg-purple-500'
                          }`} />

                          {/* Top indicator of Accent */}
                          <div className="flex items-center justify-between w-full mb-4 mt-2">
                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-150 px-2 py-0.5 rounded-md font-mono">{table.zone}</span>
                            <span className={`text-[10px] font-extrabold ${textClass} px-2.5 py-0.5 rounded-full ${bgLightClass}`}>طاولة جاهزة</span>
                          </div>

                          {/* The QR Code Topper Graphic */}
                          <div className={`w-full max-w-[220px] bg-white border-2 rounded-2xl p-4 flex flex-col items-center ${borderClass} shadow-sm relative`}>
                            {/* Card Header inside QR code frame */}
                            <span className="text-[10px] font-bold text-slate-400 truncate w-full mb-3">{qrHeader}</span>
                            
                            {/* Table text inside the code */}
                            <div className="text-sm font-black text-slate-800 mb-2 truncate max-w-full">
                              طاولة {table.name}
                            </div>

                            {/* SVG QR code */}
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 mb-3 inline-block relative">
                              <QRCodeSVG 
                                id={`qr-svg-${table.name}`}
                                value={orderUrl} 
                                size={120} 
                                level="H" 
                                fgColor={accentColorHex}
                              />
                              {qrShowLogo && (
                                <div className="absolute inset-x-0 top-[40%] flex items-center justify-center pointer-events-none">
                                  <div className="bg-white p-1 rounded-lg border border-slate-100 shadow-sm">
                                    <Utensils className={`w-4 height-4 ${textClass}`} />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Fold Instructions bottom */}
                            <p className="text-[9px] text-slate-500 leading-tight font-medium max-w-[170px] px-1">{qrInstructions}</p>
                          </div>

                          {/* Download Control Actions footer */}
                          <div className="mt-5 pt-3 border-t border-slate-100/70 w-full flex gap-2">
                            <button
                              onClick={() => downloadQRAsSVG(table.name)}
                              className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-800 transition-colors py-2 px-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5"
                              title="تحميل كود الـ QR كملف رسومي ناقل SVG"
                            >
                              <Plus className="w-3.5 h-3.5 rotate-45" />
                              <span>تحميل SVG</span>
                            </button>
                            <button
                              onClick={() => {
                                // Direct offline action: open dynamic print window for this single card
                                const printWin = window.open("", "_blank");
                                if (printWin) {
                                  printWin.document.write(`
                                    <html>
                                      <head>
                                        <title>طباعة باركود كرت طاولة ${table.name}</title>
                                        <style>
                                          body { direction: rtl; font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; background-color: white; }
                                          .print-card {
                                            display: inline-block;
                                            border: 5px solid ${accentColorHex};
                                            border-radius: 24px;
                                            padding: 30px;
                                            background: white;
                                            max-width: 380px;
                                            margin: auto;
                                            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
                                          }
                                          .label { font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 8px; }
                                          .title { font-size: 26px; font-weight: 900; color: #1e293b; margin-bottom: 20px; }
                                          .qr-holder { margin-bottom: 20px; }
                                          .instructions { font-size: 12px; color: #475569; max-w: 280px; margin: auto; line-height: 1.5; font-weight: 500; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="print-card">
                                          <div class="label">${qrHeader}</div>
                                          <div class="title">طاولة ${table.name}</div>
                                          <div class="qr-holder">
                                            <svg width="220" height="220" viewBox="0 0 120 120">
                                              <!-- Mock printable QR as vectorized fallback -->
                                              ${document.getElementById(`qr-svg-${table.name}`)?.innerHTML || ""}
                                            </svg>
                                          </div>
                                          <div class="instructions">${qrInstructions}</div>
                                        </div>
                                        <script>
                                          window.onload = function() {
                                            window.print();
                                            setTimeout(function() { window.close(); }, 500);
                                          }
                                        </script>
                                      </body>
                                    </html>
                                  `);
                                  printWin.document.close();
                                }
                              }}
                              className="px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 transition-colors rounded-xl text-[10px] font-bold flex items-center justify-center"
                              title="طباعة هذا الكرت فوراً"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Hidden Custom-Styled Print Container for Selected Table QR Codes */}
      <div className="hidden">
          <div ref={qrPrintRef} className="p-8 font-sans" dir="rtl">
              <div className="text-center mb-10 pb-6 border-b-2 border-slate-200">
                  <h1 className="text-3xl font-black text-slate-800 mb-2">{qrHeader}</h1>
                  <p className="text-slate-500 font-bold">{qrInstructions}</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                  {tables?.filter(t => {
                      const s = t.name.toLowerCase().includes(modalSearchQuery.toLowerCase());
                      const z = modalZoneQuery === 'all' || t.zone === modalZoneQuery;
                      return s && z;
                  }).map((table) => {
                      const url = `${window.location.origin}${window.location.pathname}#/customer-menu?table=${encodeURIComponent(table.name)}`;
                      
                      const isIndigo = qrAccentColor === 'indigo';
                      const isSlate = qrAccentColor === 'slate';
                      const isEmerald = qrAccentColor === 'emerald';
                      const isAmber = qrAccentColor === 'amber';
                      const accentColorHex = isIndigo ? '#4f46e5' : isSlate ? '#475569' : isEmerald ? '#10b981' : isAmber ? '#f59e0b' : '#9333ea';

                      return (
                          <div 
                            key={table.id} 
                            style={{ borderColor: accentColorHex }}
                            className="border-4 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center break-inside-avoid bg-white"
                          >
                              <div 
                                style={{ color: accentColorHex, backgroundColor: `${accentColorHex}0a`, borderColor: `${accentColorHex}2b` }}
                                className="px-6 py-2 rounded-full mb-6 font-extrabold tracking-widest text-lg border"
                              >
                                  طاولة {table.name}
                              </div>
                              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-6 inline-block">
                                  <QRCodeSVG 
                                    value={url} 
                                    size={180} 
                                    level="H" 
                                    fgColor={accentColorHex}
                                  />
                              </div>
                              <p className="font-black text-xl text-slate-800 mb-2">{qrHeader}</p>
                              <p className="text-xs font-bold text-slate-500 max-w-xs leading-relaxed">
                                  {qrInstructions}
                              </p>
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>

    </div>
  );
};

export default Tables;
