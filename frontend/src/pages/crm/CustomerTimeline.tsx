import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Clock, MessageSquare, ShoppingBag, Target, FileText, UserPlus, Phone, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function CustomerTimeline() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | 'all'>('all');
  
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  const orders = useLiveQuery(() => db.orders.toArray()) || [];
  const tickets = useLiveQuery(() => db.tickets.toArray()) || [];
  const leads = useLiveQuery(() => db.leads.toArray()) || [];
  const invoices = useLiveQuery(() => db.b2bInvoices.toArray()) || [];

  // Aggegrate and sort events
  const events = [];

  // Add Customer Creation
  customers.forEach(v => {
    if (selectedCustomerId === 'all' || selectedCustomerId === v.id) {
      events.push({
        id: `c_${v.id}`,
        type: 'customer_created',
        date: new Date(v.createdAt),
        title: 'تسجيل العميل في النظام',
        description: `تم إضافة العميل ${v.name} إلى قاعدة البيانات.`,
        icon: UserPlus,
        color: 'bg-indigo-100 text-indigo-600 border-indigo-200'
      });
    }
  });

  // Add Orders
  orders.forEach(v => {
    if (selectedCustomerId === 'all' || selectedCustomerId === v.customerId) {
      events.push({
        id: `o_${v.id}`,
        type: 'order',
        date: new Date(v.date),
        title: 'عملية شراء',
        description: `تم سداد فاتورة بقيمة ${v.totalAmount.toLocaleString()} د.ع.`,
        icon: ShoppingBag,
        color: 'bg-emerald-100 text-emerald-600 border-emerald-200'
      });
    }
  });

  // Add Tickets
  tickets.forEach(v => {
    if (selectedCustomerId === 'all' || selectedCustomerId === v.customerId) {
        events.push({
            id: `t_${v.id}`,
            type: 'ticket',
            date: new Date(v.createdAt),
            title: `تذكرة دعم (${v.ticketNumber})`,
            description: `العنوان: ${v.title}. الحالة: ${v.status}`,
            icon: MessageSquare,
            color: 'bg-orange-100 text-orange-600 border-orange-200'
        });
    }
  });

  // Add Leads (Approximation using phone/email if not strictly linked)
  leads.forEach(v => {
      // Find matching customer
      const matchingCustomer = customers.find(c => c.phone === v.phone || c.email === v.email);
      if (matchingCustomer && (selectedCustomerId === 'all' || selectedCustomerId === matchingCustomer.id)) {
          events.push({
            id: `l_${v.id}`,
            type: 'lead',
            date: new Date(v.createdAt),
            title: 'فرصة مبيعات جديدة',
            description: `تم تسجيل فرصة بيع بقيمة ${v.value?.toLocaleString() || 0} د.ع`,
            icon: Target,
            color: 'bg-blue-100 text-blue-600 border-blue-200'
          });
      }
  });

  // Add Invoices
  invoices.forEach(v => {
      if (selectedCustomerId === 'all' || selectedCustomerId === v.customerId) {
          events.push({
            id: `inv_${v.id}`,
            type: 'invoice',
            date: new Date(v.createdAt),
            title: `إصدار فاتورة B2B (#${v.id})`,
            description: `المبلغ: ${v.totalAmount.toLocaleString()} د.ع. الحالة: ${v.status}`,
            icon: FileText,
            color: 'bg-purple-100 text-purple-600 border-purple-200'
          });
      }
  });

  const sortedEvents = events.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="text-indigo-600" />
            سجل تفاعل العملاء (Timeline)
          </h1>
          <p className="text-slate-500 text-sm mt-1">تتبع رحلة العميل خطوة بخطوة</p>
        </div>
        <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800"
        >
            <option value="all">جميع العملاء</option>
            {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
            ))}
        </select>
      </div>

      <div className="relative border-r-2 border-slate-200 mr-4 pr-8 space-y-8">
        {sortedEvents.map((event, index) => {
          const Icon = event.icon;
          return (
            <div key={event.id} className="relative animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <div className={`absolute -right-[43px] w-10 h-10 rounded-full border-4 border-white flex items-center justify-center ${event.color} shadow-sm z-10`}>
                <Icon size={18} />
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800">{event.title}</h3>
                  <span className="text-xs text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded">
                    {format(event.date, 'MMM d, yyyy - HH:mm', { locale: ar })}
                  </span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          );
        })}
        
        {sortedEvents.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            لا توجد نشاطات مسجلة
          </div>
        )}
      </div>
    </div>
  );
}
