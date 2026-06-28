import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Bookmark, Plus, Search, Calendar, PackageOpen, LayoutDashboard, Wallet, CreditCard, Ban } from 'lucide-react';
import { NewLayawayModal } from '../../components/sales/NewLayawayModal';
import { ViewLayawayModal } from '../../components/sales/ViewLayawayModal';

export default function Layaways() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewLayaway, setViewLayaway] = useState<any | null>(null);
  
  const dbOrders = useLiveQuery(() => db.orders.filter(o => o.orderType === 'reservation' || o.isReservation === true).toArray()) || [];
  const dbLayaways = useLiveQuery(() => db.layaways.toArray()) || [];
  const dbCustomers = useLiveQuery(() => db.customers.toArray()) || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  const customerMap = new Map((dbCustomers || []).map(c => [c.id, c.name]));

  const mappedOrders = dbOrders.map(o => {
      const isCancelled = o.status === 'cancelled' || o.reservationDetails?.deliveryStatus === 'cancelled' as any;
      const isCompleted = o.reservationDetails?.deliveryStatus === 'fully_delivered';
      const status: 'active' | 'completed' | 'cancelled' = isCancelled ? 'cancelled' : (isCompleted ? 'completed' : 'active');
      
      return {
          id: o.id,
          date: o.date,
          customerName: o.customerId ? (customerMap.get(o.customerId) || `عميل #${o.customerId}`) : 'عميل نقدي',
          totalValue: o.totalAmount,
          remainingAmount: o.reservationDetails ? o.reservationDetails.remainingAmount : (o.totalAmount - (o.paidAmount || 0)),
          dueDate: o.reservationDetails?.dueDate || o.dueDate || o.date,
          status,
          payments: o.reservationDetails ? [{ amount: o.reservationDetails.depositAmount, date: o.date }] : [],
          items: (o.items || []).map((item: any) => ({
              productId: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              total: item.total
          })),
          notes: o.note || '',
          isRealOrder: true,
          _rawOrder: o
      };
  });

  const mappedLayaways = dbLayaways.map(l => ({
      ...l,
      isRealOrder: false
  }));

  const layaways = [...mappedLayaways, ...mappedOrders];

  const filteredLayaways = layaways?.filter(l => {
      const matchesSearch = l.id?.toString().includes(searchTerm) || l.customerName?.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(val || 0);
  };

  const totalActiveValue = layaways.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.totalValue || 0), 0);
  const totalActiveRemaining = layaways.filter(l => l.status === 'active').reduce((sum, l) => sum + (l.remainingAmount || 0), 0);
  const totalCompletedValue = layaways.filter(l => l.status === 'completed').reduce((sum, l) => sum + (l.totalValue || 0), 0);

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-indigo-500" />
            نظام العربون وحجز المستودع
          </h2>
          <p className="text-slate-500 mt-1 font-medium">إدارة البضائع المحجوزة بعربون وتواريخ الاستحقاق والتسليم</p>
        </div>
        <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
        >
            <Plus className="w-5 h-5" />
            حجز عربون جديد
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-indigo-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-500 rounded-l-3xl"></div>
              <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
                  <LayoutDashboard className="w-7 h-7" />
              </div>
              <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">حجوزات نشطة</p>
                  <p className="text-xl font-black text-gray-800">{formatCurrency(totalActiveValue)}</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-rose-500 rounded-l-3xl"></div>
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                  <CreditCard className="w-7 h-7" />
              </div>
              <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">المتبقي للتحصيل</p>
                  <p className="text-xl font-black text-gray-800">{formatCurrency(totalActiveRemaining)}</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-500 rounded-l-3xl"></div>
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                  <Calendar className="w-7 h-7" />
              </div>
              <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">متأخر عن التسليم</p>
                  <p className="text-xl font-black text-amber-700">{layaways.filter(l => l.status === 'active' && new Date(l.dueDate) < new Date(new Date().setHours(0,0,0,0))).length} حجوزات</p>
              </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex items-center gap-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500 rounded-l-3xl"></div>
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                  <Wallet className="w-7 h-7" />
              </div>
              <div>
                  <p className="text-sm font-bold text-gray-500 mb-1">مكتملة (مبيعات)</p>
                  <p className="text-xl font-black text-gray-800">{formatCurrency(totalCompletedValue)}</p>
              </div>
          </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
          <div className="bg-white flex-1 p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center">
            <div className="relative w-full">
                <Search className="w-5 h-5 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                <input 
                    type="text"
                    placeholder="ابحث باسم العميل أو رقم الحجز..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-12 pl-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-3xl border border-slate-200 flex gap-2 w-fit shadow-sm">
            <button 
                className={`px-6 py-2.5 rounded-2xl font-bold transition-all ${statusFilter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                onClick={() => setStatusFilter('all')}
            >
                الكل
            </button>
            <button 
                className={`px-6 py-2.5 rounded-2xl font-bold transition-all ${statusFilter === 'active' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                onClick={() => setStatusFilter('active')}
            >
                نشط (قيد الحجز)
            </button>
            <button 
                className={`px-6 py-2.5 rounded-2xl font-bold transition-all ${statusFilter === 'completed' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                onClick={() => setStatusFilter('completed')}
            >
                مكتمل (مُسلّم)
            </button>
          </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="p-5 font-bold text-slate-500">رقم الحجز</th>
                        <th className="p-5 font-bold text-slate-500">تاريخ الحجز</th>
                        <th className="p-5 font-bold text-slate-500">العميل</th>
                        <th className="p-5 font-bold text-slate-500">إجمالي المطلوب</th>
                        <th className="p-5 font-bold text-slate-500">المدفوع (مقدم)</th>
                        <th className="p-5 font-bold text-slate-500">المتبقي</th>
                        <th className="p-5 font-bold text-slate-500 text-center">الحالة</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredLayaways?.map((l: any, i) => {
                        const isOverdue = l.status === 'active' && new Date(l.dueDate) < new Date(new Date().setHours(0,0,0,0));
                        return (
                        <tr key={i} onClick={() => setViewLayaway(l)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                            <td className="p-5 font-black text-indigo-700">
                                ORD-{l.id}
                                {isOverdue && <span className="mr-2 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] rounded animate-pulse font-bold border border-red-200">متأخر</span>}
                            </td>
                            <td className="p-5 text-slate-600 font-medium">
                                <div>{new Date(l.date).toLocaleDateString('ar-EG')}</div>
                                <div className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? 'text-red-500 font-bold' : 'text-orange-500'}`}>
                                    <Calendar className="w-3 h-3" /> تسليم: {new Date(l.dueDate).toLocaleDateString('ar-EG')}
                                </div>
                            </td>
                            <td className="p-5 font-bold text-slate-800">{l.customerName}</td>
                            <td className="p-5 font-bold text-slate-800">{formatCurrency(l.totalValue)}</td>
                            <td className="p-5 text-emerald-600 font-bold">{formatCurrency(l.totalValue - l.remainingAmount)}</td>
                            <td className="p-5 text-rose-600 font-bold">{formatCurrency(l.remainingAmount)}</td>
                            <td className="p-5 text-center">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${l.status === 'active' ? 'bg-amber-100 text-amber-700 border border-amber-200' : l.status === 'completed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                    {l.status === 'active' ? 'نشط (تحت الحجز)' : l.status === 'completed' ? 'تـم التسليـم' : 'ملغى'}
                                </span>
                            </td>
                        </tr>
                    )})}
                    {filteredLayaways?.length === 0 && (
                        <tr>
                            <td colSpan={7} className="p-20 text-center">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <PackageOpen className="w-10 h-10 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 mb-1">لا توجد حجوزات مطابقة</h3>
                                    <p className="text-slate-500 font-medium">حاول تغيير معايير البحث أو ابدأ بإضافة حجز جديد</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <NewLayawayModal 
          isOpen={isModalOpen} 
          closeModal={() => setIsModalOpen(false)} 
          formatCurrency={formatCurrency}
      />
      
      <ViewLayawayModal 
          layaway={viewLayaway}
          onClose={() => setViewLayaway(null)}
          formatCurrency={formatCurrency}
      />

    </div>
  );
}
