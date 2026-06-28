import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Ticket, TicketPriority } from '../../types';
import { LifeBuoy, Plus, Search, Filter, MessageSquare, Clock, AlertCircle, CheckCircle2, User as UserIcon } from 'lucide-react';
import { format, differenceInHours, addHours, isAfter } from 'date-fns';
import { ar } from 'date-fns/locale';
import { generateReferenceNumber } from '../../utils/generateReference';

const STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  closed: 'bg-slate-100 text-slate-800 border-slate-200'
};

const PRIORITY_COLORS = {
  low: 'bg-slate-100 text-slate-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800'
};

const STATUS_LABELS = {
  open: 'مفتوحة',
  in_progress: 'قيد المعالجة',
  resolved: 'تم الحل',
  closed: 'مغلقة'
};

const PRIORITY_LABELS = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة جداً'
};

// SLA Hours based on Priority
const SLA_HOURS: Record<TicketPriority, number> = {
    urgent: 4,
    high: 12,
    medium: 24,
    low: 48
};

export default function Helpdesk() {
  const tickets = useLiveQuery(() => db.tickets.toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  
  const [formData, setFormData] = useState<Partial<Ticket>>({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
    ticketNumber: `TKT-LOADING`,
    assignedTo: undefined,
    customerId: undefined,
  });

  // Auto-Resolve Background Task
  useEffect(() => {
    const runSLA_AndAutoClose = async () => {
        if (!tickets.length) return;
        const now = new Date();
        const ticketsToUpdate: Ticket[] = [];

        for (const t of tickets) {
            // Auto-close resolved tickets after 3 days
            if (t.status === 'resolved' && t.resolvedAt) {
                const hoursSinceResolved = differenceInHours(now, new Date(t.resolvedAt));
                if (hoursSinceResolved >= 72) { // 3 days
                    ticketsToUpdate.push({ ...t, status: 'closed', closedAt: now, updatedAt: now });
                }
            }
        }

        if (ticketsToUpdate.length > 0) {
            await db.tickets.bulkPut(ticketsToUpdate);
        }
    };
    runSLA_AndAutoClose();
  }, [tickets]);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // SLA logic
    const slaDueDate = addHours(new Date(), SLA_HOURS[formData.priority as TicketPriority]);

    const isResolved = formData.status === 'resolved';
    const isClosed = formData.status === 'closed';

    if (editingTicket && editingTicket.id) {
      await db.tickets.update(editingTicket.id, { 
        ...formData,
        updatedAt: new Date(),
        slaDueDate: editingTicket.priority !== formData.priority ? slaDueDate : editingTicket.slaDueDate,
        resolvedAt: isResolved && editingTicket.status !== 'resolved' ? new Date() : (isResolved ? editingTicket.resolvedAt : undefined),
        closedAt: isClosed && editingTicket.status !== 'closed' ? new Date() : (isClosed ? editingTicket.closedAt : undefined),
      });
    } else {
      await db.tickets.add({
        ...formData,
        createdAt: new Date(),
        updatedAt: new Date(),
        slaDueDate,
        createdBy: 1 // Default to admin for now
      } as Ticket);
    }
    setIsModalOpen(false);
    setEditingTicket(null);
  };

  const openNewModal = async () => {
    setEditingTicket(null);
    const ref = await generateReferenceNumber('tickets', 'TKT');
    setFormData({ 
      title: '', 
      description: '', 
      status: 'open', 
      priority: 'medium',
      ticketNumber: ref,
      assignedTo: undefined,
      customerId: undefined,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setFormData(ticket);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <LifeBuoy className="text-indigo-600" />
            الدعم الفني والتذاكر
          </h1>
          <p className="text-slate-500 text-sm mt-1">إدارة استفسارات وشكاوى العملاء</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          تذكرة جديدة
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="ابحث برقم التذكرة أو العنوان..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-slate-400" size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">جميع الحالات</option>
              <option value="open">مفتوحة</option>
              <option value="in_progress">قيد المعالجة</option>
              <option value="resolved">تم الحل</option>
              <option value="closed">مغلقة</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTickets.map(ticket => (
          <div 
            key={ticket.id}
            onClick={() => openEditModal(ticket)}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 cursor-pointer hover:border-indigo-300 transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {ticket.ticketNumber}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS]}`}>
                {STATUS_LABELS[ticket.status as keyof typeof STATUS_LABELS]}
              </span>
            </div>
            
            <h3 className="font-bold text-slate-800 mb-2 line-clamp-1">{ticket.title}</h3>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2">{ticket.description}</p>
            
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS]}`}>
                  {PRIORITY_LABELS[ticket.priority as keyof typeof PRIORITY_LABELS]}
                </span>
                {ticket.slaDueDate && ['open', 'in_progress'].includes(ticket.status) && (
                    <span className={`text-[10px] px-1.5 py-0.5 flex items-center gap-1 rounded-full border ${isAfter(new Date(), new Date(ticket.slaDueDate)) ? 'border-red-200 text-red-600 bg-red-50' : 'border-slate-200 text-slate-500'}`}>
                        SLA: {format(new Date(ticket.slaDueDate), 'dd/MM HH:mm')}
                    </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {ticket.assignedTo && (
                  <div title="الموظف المعين" className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    <UserIcon size={12} />
                    {users.find(u => u.id === ticket.assignedTo)?.name?.split(' ')[0] || 'مجهول'}
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={14} />
                  {format(new Date(ticket.createdAt), 'MMM d', { locale: ar })}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {filteredTickets.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-1">لا توجد تذاكر</h3>
            <p className="text-slate-500">لم يتم العثور على تذاكر تطابق معايير البحث.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingTicket ? 'تعديل التذكرة' : 'تذكرة جديدة'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">عنوان التذكرة *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">العميل</label>
                  <select
                    value={formData.customerId || ''}
                    onChange={e => setFormData({...formData, customerId: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">بدون عميل</option>
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تعيين إلى (موظف أخصائي)</label>
                  <select
                    value={formData.assignedTo || ''}
                    onChange={e => setFormData({...formData, assignedTo: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">غير معين</option>
                    {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="open">مفتوحة</option>
                    <option value="in_progress">قيد المعالجة</option>
                    <option value="resolved">تم الحل</option>
                    <option value="closed">مغلقة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الأولوية</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value as any})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجلة جداً</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الوصف والتفاصيل *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  حفظ التذكرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
