import React, { useState, useEffect, useRef } from 'react';
import { db } from '../db';
import { Ticket, TicketComment, User, Customer, TicketStatus, TicketPriority } from '../types';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ui/ConfirmModal';
import { 
  Ticket as TicketIcon, Plus, Search, Filter, MessageSquare, 
  AlertCircle, CheckCircle, Clock, User as UserIcon, X, Send,
  Trash2, Edit2, Save, Printer, BarChart3
} from 'lucide-react';

export default function Helpdesk() {
  const { success, error: showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Ticket>>({});
  const [confirmDeleteConfig, setConfirmDeleteConfig] = useState<{ isOpen: boolean } | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [assignedToFilter, setAssignedToFilter] = useState<string>('all');
  
  const [newTicket, setNewTicket] = useState<Partial<Ticket>>({
    title: '',
    description: '',
    status: 'open',
    priority: 'medium',
  });

  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);

  const currentUser = useLiveQuery(() => db.users.where('isActive').equals(1).first());
  const tickets = useLiveQuery(() => db.tickets.reverse().sortBy('createdAt'));
  const users = useLiveQuery(() => db.users.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());
  const comments = useLiveQuery(
    () => selectedTicket?.id ? db.ticketComments.where('ticketId').equals(selectedTicket.id).sortBy('createdAt') : []
  , [selectedTicket?.id]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTicket.title || !newTicket.description) return;

    try {
      const count = await db.tickets.count();
      const ticketNumber = `TCK-${(count + 1).toString().padStart(4, '0')}`;

      await db.tickets.add({
        ticketNumber,
        title: newTicket.title,
        description: newTicket.description,
        status: newTicket.status as TicketStatus,
        priority: newTicket.priority as TicketPriority,
        customerId: newTicket.customerId ? Number(newTicket.customerId) : undefined,
        assignedTo: newTicket.assignedTo ? Number(newTicket.assignedTo) : undefined,
        createdBy: currentUser.id!,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      success('تم إنشاء التذكرة بنجاح');
      setIsModalOpen(false);
      setNewTicket({ title: '', description: '', status: 'open', priority: 'medium' });
    } catch (err) {
      console.error(err);
      showError('فشل في إنشاء التذكرة');
    }
  };

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket?.id) return;

    try {
      const updates = {
        ...editForm,
        updatedAt: new Date()
      };

      await db.tickets.update(selectedTicket.id, updates);
      setSelectedTicket({ ...selectedTicket, ...updates } as Ticket);
      setIsEditing(false);
      success('تم تحديث التذكرة بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل في تحديث التذكرة');
    }
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket?.id) return;
    try {
      await db.ticketComments.where('ticketId').equals(selectedTicket.id).delete();
      await db.tickets.delete(selectedTicket.id);
      setSelectedTicket(null);
      setConfirmDeleteConfig(null);
      success('تم حذف التذكرة والملاحظات المرتبطة بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل في حذف التذكرة');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedTicket?.id || !commentText.trim()) return;

    try {
      await db.ticketComments.add({
        ticketId: selectedTicket.id,
        userId: currentUser.id!,
        content: commentText,
        createdAt: new Date(),
        isInternal: isInternalComment
      });

      await db.tickets.update(selectedTicket.id, { updatedAt: new Date() });
      setCommentText('');
      success('تم إضافة الرد بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل في إضافة الرد');
    }
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!selectedTicket?.id) return;
    try {
      const updates: Partial<Ticket> = { status, updatedAt: new Date() };
      if (status === 'resolved' || status === 'closed') {
        updates.resolvedAt = new Date();
      }
      await db.tickets.update(selectedTicket.id, updates);
      setSelectedTicket({ ...selectedTicket, ...updates } as Ticket);
      success('تم تحديث حالة التذكرة بنجاح');
    } catch (err) {
      console.error(err);
      showError('فشل في تحديث حالة التذكرة');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredTickets = tickets?.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesAssignedTo = assignedToFilter === 'all' || 
                              (assignedToFilter === 'unassigned' && !ticket.assignedTo) ||
                              (ticket.assignedTo === Number(assignedToFilter));
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignedTo;
  });

  const stats = {
    total: tickets?.length || 0,
    open: tickets?.filter(t => t.status === 'open').length || 0,
    inProgress: tickets?.filter(t => t.status === 'in_progress').length || 0,
    resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
    closed: tickets?.filter(t => t.status === 'closed').length || 0,
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'in_progress': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'resolved': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'closed': return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  const getStatusLabel = (status: TicketStatus) => {
    switch (status) {
      case 'open': return 'مفتوحة';
      case 'in_progress': return 'قيد المعالجة';
      case 'resolved': return 'محلولة';
      case 'closed': return 'مغلقة';
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'low': return 'text-slate-500';
      case 'medium': return 'text-blue-500';
      case 'high': return 'text-orange-500 font-semibold';
      case 'urgent': return 'text-red-600 font-bold animate-pulse';
    }
  };

  const getPriorityLabel = (priority: TicketPriority) => {
    switch (priority) {
      case 'low': return 'منخفضة';
      case 'medium': return 'متوسطة';
      case 'high': return 'عالية';
      case 'urgent': return 'عاجلة';
    }
  };

  const getUserName = (id?: number) => users?.find(u => u.id === id)?.name || 'غير محدد';
  const getCustomerName = (id?: number) => customers?.find(c => c.id === id)?.name || 'غير محدد';

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-full bg-gradient-to-tr from-sky-50/60 via-slate-50 to-pink-50/40 font-['Tajawal']" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 flex items-center gap-2">
            <TicketIcon className="text-indigo-600 animate-pulse" />
            نظام التذاكر والدعم الفني
          </h1>
          <p className="text-slate-500 text-sm mt-1">إدارة ومتابعة طلبات الدعم الفني والشكاوى بكفاءة عالية</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md font-medium"
        >
          <Plus size={20} />
          تذكرة جديدة
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-xs border border-slate-200/60">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">إجمالي التذاكر</h3>
            <BarChart3 className="text-indigo-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono">{stats.total}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-xs border border-slate-200/60">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">مفتوحة</h3>
            <AlertCircle className="text-blue-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-blue-600 font-mono">{stats.open}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-xs border border-slate-200/60">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">قيد المعالجة</h3>
            <Clock className="text-amber-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-amber-600 font-mono">{stats.inProgress}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-xs border border-slate-200/60">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">محلولة</h3>
            <CheckCircle className="text-emerald-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-emerald-600 font-mono">{stats.resolved}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl shadow-xs border border-slate-200/60">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">مغلقة</h3>
            <CheckCircle className="text-slate-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-600 font-mono">{stats.closed}</p>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="البحث برقم التذكرة أو العنوان..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="all">جميع الحالات</option>
              <option value="open">مفتوحة</option>
              <option value="in_progress">قيد المعالجة</option>
              <option value="resolved">محلولة</option>
              <option value="closed">مغلقة</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="all">جميع الأولويات</option>
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
              <option value="urgent">عاجلة</option>
            </select>
            <select
              value={assignedToFilter}
              onChange={(e) => setAssignedToFilter(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="all">الكل (المسندة)</option>
              <option value="unassigned">غير مسندة</option>
              {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="p-4 font-semibold">رقم التذكرة</th>
                <th className="p-4 font-semibold">العنوان</th>
                <th className="p-4 font-semibold">الحالة</th>
                <th className="p-4 font-semibold">الأولوية</th>
                <th className="p-4 font-semibold">العميل</th>
                <th className="p-4 font-semibold">مُسندة إلى</th>
                <th className="p-4 font-semibold">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTickets?.map(ticket => (
                <tr 
                  key={ticket.id} 
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setIsEditing(false);
                    setEditForm(ticket);
                  }}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="p-4 font-mono text-sm text-indigo-600 font-bold">{ticket.ticketNumber}</td>
                  <td className="p-4 font-medium text-slate-900">{ticket.title}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status)}`}>
                      {getStatusLabel(ticket.status)}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm ${getPriorityColor(ticket.priority)}`}>
                      {getPriorityLabel(ticket.priority)}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {ticket.customerId ? getCustomerName(ticket.customerId) : '-'}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {ticket.assignedTo ? getUserName(ticket.assignedTo) : <span className="text-slate-400">غير مسندة</span>}
                  </td>
                  <td className="p-4 text-sm text-slate-500 font-mono">
                    {format(new Date(ticket.createdAt), 'yyyy-MM-dd HH:mm')}
                  </td>
                </tr>
              ))}
              {filteredTickets?.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <TicketIcon className="w-12 h-12 text-gray-300 animate-pulse" />
                      <p>لا توجد تذاكر مطابقة لخيارات البحث المحددة</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-indigo-100/30">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">إنشاء تذكرة دعم جديدة</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">عنوان التذكرة *</label>
                <input
                  required
                  type="text"
                  value={newTicket.title}
                  placeholder="مثال: مشكلة في طباعة الفواتير أو الدفع الرقمي"
                  onChange={e => setNewTicket({...newTicket, title: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الأولوية</label>
                  <select
                    value={newTicket.priority}
                    onChange={e => setNewTicket({...newTicket, priority: e.target.value as TicketPriority})}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="low">منخفضة</option>
                    <option value="medium">متوسطة</option>
                    <option value="high">عالية</option>
                    <option value="urgent">عاجلة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">العميل (اختياري)</label>
                  <select
                    value={newTicket.customerId || ''}
                    onChange={e => setNewTicket({...newTicket, customerId: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">-- بدون عميل --</option>
                    {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">إسناد إلى (اختياري)</label>
                  <select
                    value={newTicket.assignedTo || ''}
                    onChange={e => setNewTicket({...newTicket, assignedTo: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">-- غير مسندة --</option>
                    {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">الوصف والتفاصيل *</label>
                <textarea
                  required
                  rows={4}
                  value={newTicket.description}
                  placeholder="يرجى إدخال تفاصيل العطل أو المشكلة بدقة لتسريع الاستجابة..."
                  onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-semibold shadow"
                >
                  إنشاء التذكرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 print:p-0 print:bg-white">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] print:h-auto print:shadow-none flex flex-col overflow-hidden border border-indigo-100/20">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 print:hidden">
              <div className="flex items-center gap-3">
                <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2.5 py-1 rounded-md text-sm">{selectedTicket.ticketNumber}</span>
                <h2 className="text-xl font-bold text-slate-900">{selectedTicket.title}</h2>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedTicket.status)}`}>
                  {getStatusLabel(selectedTicket.status)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrint} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="طباعة">
                  <Printer size={20} />
                </button>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="تعديل">
                    <Edit2 size={20} />
                  </button>
                )}
                <button onClick={() => setConfirmDeleteConfig({ isOpen: true })} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="حذف">
                  <Trash2 size={20} />
                </button>
                <button onClick={() => setSelectedTicket(null)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block p-8 border-b border-slate-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">تفاصيل التذكرة</h1>
                  <p className="text-slate-500">رقم التذكرة: {selectedTicket.ticketNumber}</p>
                </div>
                <div className="text-left">
                  <p className="text-slate-500">تاريخ الطباعة: {format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">{selectedTicket.title}</h2>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row print:overflow-visible print:flex-col">
              {/* Sidebar Details */}
              <div className="w-full md:w-1/3 border-l border-slate-200 p-4 overflow-y-auto bg-slate-50/50 print:w-full print:border-l-0 print:border-b print:bg-white">
                {isEditing ? (
                  <form id="edit-ticket-form" onSubmit={handleUpdateTicket} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">العنوان</label>
                      <input
                        required
                        type="text"
                        value={editForm.title || ''}
                        onChange={e => setEditForm({...editForm, title: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                      <select
                        value={editForm.status || 'open'}
                        onChange={e => setEditForm({...editForm, status: e.target.value as TicketStatus})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="open">مفتوحة</option>
                        <option value="in_progress">قيد المعالجة</option>
                        <option value="resolved">محلولة</option>
                        <option value="closed">مغلقة</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">الأولوية</label>
                      <select
                        value={editForm.priority || 'medium'}
                        onChange={e => setEditForm({...editForm, priority: e.target.value as TicketPriority})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="low">منخفضة</option>
                        <option value="medium">متوسطة</option>
                        <option value="high">عالية</option>
                        <option value="urgent">عاجلة</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">العميل</label>
                      <select
                        value={editForm.customerId || ''}
                        onChange={e => setEditForm({...editForm, customerId: e.target.value ? Number(e.target.value) : undefined})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">-- بدون عميل --</option>
                        {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">مُسندة إلى</label>
                      <select
                        value={editForm.assignedTo || ''}
                        onChange={e => setEditForm({...editForm, assignedTo: e.target.value ? Number(e.target.value) : undefined})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="">-- غير مسندة --</option>
                        {users?.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">الوصف</label>
                      <textarea
                        required
                        rows={4}
                        value={editForm.description || ''}
                        onChange={e => setEditForm({...editForm, description: e.target.value})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none animate-none"
                      ></textarea>
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 font-semibold">
                        <Save size={18} /> حفظ التغييرات
                      </button>
                      <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 py-2 rounded-lg">
                        إلغاء
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="print:hidden">
                      <h3 className="text-sm font-bold text-slate-800 mb-2">تحديث الحالة السريع</h3>
                      <select
                        value={selectedTicket.status}
                        onChange={e => handleUpdateStatus(e.target.value as TicketStatus)}
                        className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="open">مفتوحة</option>
                        <option value="in_progress">قيد المعالجة</option>
                        <option value="resolved">محلولة</option>
                        <option value="closed">مغلقة</option>
                      </select>
                    </div>

                    <div className="space-y-3 text-sm print:grid print:grid-cols-2 print:gap-4 print:space-y-0">
                      <div className="flex justify-between py-2 border-b border-slate-200/60 print:border-none">
                        <span className="text-slate-500">الحالة</span>
                        <span className={`font-semibold ${getStatusColor(selectedTicket.status)} px-2 py-0.5 rounded-full text-xs`}>{getStatusLabel(selectedTicket.status)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-200/60 print:border-none">
                        <span className="text-slate-500">الأولوية</span>
                        <span className={`font-semibold ${getPriorityColor(selectedTicket.priority)}`}>{getPriorityLabel(selectedTicket.priority)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-200/60 print:border-none">
                        <span className="text-slate-500">العميل</span>
                        <span className="font-semibold text-slate-800">{selectedTicket.customerId ? getCustomerName(selectedTicket.customerId) : '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-200/60 print:border-none">
                        <span className="text-slate-500">مُسندة إلى</span>
                        <span className="font-semibold text-slate-800">{selectedTicket.assignedTo ? getUserName(selectedTicket.assignedTo) : '-'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-200/60 print:border-none">
                        <span className="text-slate-500">بواسطة</span>
                        <span className="font-semibold text-slate-800">{getUserName(selectedTicket.createdBy)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-200/60 print:border-none">
                        <span className="text-slate-500">تاريخ الإنشاء</span>
                        <span className="font-semibold text-slate-800 font-mono">{format(new Date(selectedTicket.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-200/60 print:border-none">
                        <span className="text-slate-500">آخر تحديث</span>
                        <span className="font-semibold text-slate-800 font-mono">{format(new Date(selectedTicket.updatedAt), 'yyyy-MM-dd HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Main Content & Comments */}
              <div className="w-full md:w-2/3 flex flex-col h-full print:w-full print:overflow-visible">
                <div className="p-6 overflow-y-auto flex-1 bg-white print:overflow-visible">
                  <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-wider">وصف المشكلة</h3>
                    <div className="bg-slate-50/70 border border-slate-200/40 p-4 rounded-xl text-slate-800 whitespace-pre-wrap print:bg-transparent print:p-0 print:border-none">
                      {selectedTicket.description}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">الردود والملاحظات</h3>
                    {comments?.map(comment => (
                      <div key={comment.id} className={`flex gap-3 ${comment.isInternal ? 'opacity-90 print:hidden' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-bold text-sm print:border print:border-slate-300 print:bg-white">
                          {getUserName(comment.userId).charAt(0)}
                        </div>
                        <div className={`flex-1 rounded-xl p-4 ${comment.isInternal ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50/70 border border-slate-200/30'} print:bg-transparent print:border-b print:border-slate-200 print:rounded-none print:p-2`}>
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-sm text-slate-800">{getUserName(comment.userId)}</span>
                            <span className="text-xs text-slate-500 font-mono">{format(new Date(comment.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                          </div>
                          {comment.isInternal && (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 mb-2">
                              ملاحظة داخلية
                            </span>
                          )}
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                    {comments?.length === 0 && (
                      <div className="text-center text-slate-500 py-8 print:hidden">
                        لا توجد ردود حتى الآن
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Comment Form */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 print:hidden">
                  <form onSubmit={handleAddComment}>
                    <div className="flex flex-col gap-2">
                      <textarea
                        required
                        rows={3}
                        placeholder="اكتب ردك أو الإجراء المتخذ لحل المشكلة هنا..."
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      ></textarea>
                      <div className="flex justify-between items-center">
                        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isInternalComment}
                            onChange={e => setIsInternalComment(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          ملاحظة داخلية (لا تظهر للعميل)
                        </label>
                        <button
                          type="submit"
                          disabled={!commentText.trim()}
                          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg flex items-center gap-2 transition-all font-semibold shadow"
                        >
                          <Send size={16} />
                          إرسال الرد
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteConfig && (
        <ConfirmModal
          isOpen={confirmDeleteConfig.isOpen}
          title="حذف تذكرة الدعم الفني"
          message="هل أنت متأكد من حذف هذه التذكرة بشكل نهائي وكافة الردود والملاحظات المرتبطة بها؟ لا يمكن التراجع عن هذا الإجراء."
          onConfirm={handleDeleteTicket}
          onCancel={() => setConfirmDeleteConfig(null)}
          confirmText="تأكيد الحذف"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
}
