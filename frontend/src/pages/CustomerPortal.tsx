import React, { useState } from 'react';
import { UserCircle, FileText, ShoppingBag, LifeBuoy, Search, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { generateReferenceNumber } from '../utils/generateReference';

export const CustomerPortal: React.FC = () => {
  const [currentCustomerId, setCurrentCustomerId] = useState<number | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'orders' | 'invoices' | 'tickets'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketComment, setTicketComment] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const customer = useLiveQuery(() => currentCustomerId ? db.customers.get(currentCustomerId) : undefined, [currentCustomerId]);
  const orders = useLiveQuery(() => currentCustomerId ? db.orders.where('customerId').equals(currentCustomerId).toArray() : [], [currentCustomerId]) || [];
  const invoices = useLiveQuery(() => currentCustomerId ? db.b2bInvoices.where('customerId').equals(currentCustomerId).toArray() : [], [currentCustomerId]) || [];
  const tickets = useLiveQuery(() => currentCustomerId ? db.tickets.where('customerId').equals(currentCustomerId).toArray() : [], [currentCustomerId]) || []; 
  
  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoginError('');
      // In a real app, this would be a secure authentication process (e.g., OTP or Password over HTTPS).
      // Here, we simulate it by finding a customer by their phone number to isolate data securely.
      const foundCustomer = await db.customers.where('phone').equals(loginPhone).first();
      if (foundCustomer && foundCustomer.id) {
          setCurrentCustomerId(foundCustomer.id);
          setIsLoginModalOpen(false);
      } else {
          setLoginError('لم يتم العثور على حساب مسجل بهذا الرقم.');
      }
  };

  const customerTickets = tickets.slice(0, 5); // Show latest 5 tickets

  const ticketComments = useLiveQuery(
    () => selectedTicket ? db.ticketComments.where('ticketId').equals(selectedTicket.id).toArray() : [],
    [selectedTicket]
  ) || [];

  const filteredOrders = orders.filter(o => o.id?.toString().includes(searchTerm));
  const filteredInvoices = invoices.filter(i => i.id?.toString().includes(searchTerm));
  const filteredTickets = customerTickets.filter(t => t.ticketNumber.includes(searchTerm) || t.title.includes(searchTerm));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3"/> مكتمل</span>;
      case 'pending': return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3"/> قيد الانتظار</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-full text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3"/> ملغى</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">{status}</span>;
    }
  };

  const getTicketStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">مفتوحة</span>;
      case 'in_progress': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">قيد المعالجة</span>;
      case 'resolved': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs">تم الحل</span>;
      case 'closed': return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">مغلقة</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs">{status}</span>;
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle.trim() || !newTicketDescription.trim()) return;

    const ref = await generateReferenceNumber('tickets', 'TKT');
    await db.tickets.add({
      ticketNumber: ref,
      title: newTicketTitle,
      description: newTicketDescription,
      status: 'open',
      priority: 'medium',
      customerId: currentCustomerId,
      createdBy: currentCustomerId, // Assuming customer is creating it
      createdAt: new Date(),
    } as any);

    setNewTicketTitle('');
    setNewTicketDescription('');
    setIsNewTicketModalOpen(false);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketComment.trim() || !selectedTicket) return;

    await db.ticketComments.add({
      ticketId: selectedTicket.id,
      userId: currentCustomerId, // Customer ID
      content: ticketComment,
      createdAt: new Date(),
      isInternal: false,
    } as any);

    setTicketComment('');
  };

  if (!currentCustomerId || isLoginModalOpen) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserCircle size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">تسجيل دخول العميل</h1>
                    <p className="text-slate-500 mt-2 text-sm text-balance">يرجى تسجيل الدخول للوصول إلى طلباتك وفواتيرك الخاصة في بيئة معزولة وآمنة.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف المميز لـ العميل</label>
                        <input
                            type="tel"
                            required
                            placeholder="مثال: 079..."
                            value={loginPhone}
                            onChange={(e) => setLoginPhone(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    {loginError && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                            {loginError}
                        </div>
                    )}
                    <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">
                        تسجيل الدخول
                    </button>
                    <p className="text-xs text-slate-400 text-center mt-4">
                        *لغرض الاختبار في هذه النسخة، أدخل رقم هاتف لأي عميل موجود بقاعدة البيانات. في النسخة الحقيقية سيمر العميل بنظام التحقق OTP.
                    </p>
                </form>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <UserCircle size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">مرحباً بك، {customer?.name || 'عميلنا العزيز'}</h1>
              <p className="text-slate-500">إدارة طلباتك، فواتيرك، وتذاكر الدعم الفني</p>
            </div>
          </div>
          <div className="flex gap-2">
              <button 
                  onClick={() => { setCurrentCustomerId(null); setIsLoginModalOpen(true); }}
                  className="text-sm font-medium border border-slate-200 text-slate-600 px-4 py-2 hover:bg-slate-50 rounded-lg transition"
              >
                  تسجيل الخروج
              </button>
              {customer && (
            <div className="flex gap-6">
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-1">الرصيد المستحق</p>
                <p className="text-xl font-bold text-rose-600">{customer.balance?.toLocaleString() || 0} ر.س</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-1">رصيد المحفظة</p>
                <p className="text-xl font-bold text-emerald-600">{customer.walletBalance?.toLocaleString() || 0} ر.س</p>
              </div>
            </div>
          )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div 
            onClick={() => setActiveTab('orders')}
            className={`bg-white p-6 rounded-2xl shadow-sm border transition-all cursor-pointer ${activeTab === 'orders' ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-100 hover:shadow-md'}`}
          >
            <ShoppingBag className={`w-8 h-8 mb-4 ${activeTab === 'orders' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <h3 className="text-lg font-bold text-slate-800 mb-2">طلباتي</h3>
            <p className="text-slate-500 text-sm">تتبع حالة طلباتك الحالية والسابقة</p>
          </div>
          <div 
            onClick={() => setActiveTab('invoices')}
            className={`bg-white p-6 rounded-2xl shadow-sm border transition-all cursor-pointer ${activeTab === 'invoices' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-100 hover:shadow-md'}`}
          >
            <FileText className={`w-8 h-8 mb-4 ${activeTab === 'invoices' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <h3 className="text-lg font-bold text-slate-800 mb-2">الفواتير وكشف الحساب</h3>
            <p className="text-slate-500 text-sm">عرض وتحميل فواتيرك ومتابعة رصيدك</p>
          </div>
          <div 
            onClick={() => setActiveTab('tickets')}
            className={`bg-white p-6 rounded-2xl shadow-sm border transition-all cursor-pointer ${activeTab === 'tickets' ? 'border-orange-500 ring-2 ring-orange-100' : 'border-slate-100 hover:shadow-md'}`}
          >
            <LifeBuoy className={`w-8 h-8 mb-4 ${activeTab === 'tickets' ? 'text-orange-600' : 'text-slate-400'}`} />
            <h3 className="text-lg font-bold text-slate-800 mb-2">الدعم الفني</h3>
            <p className="text-slate-500 text-sm">فتح تذاكر دعم جديدة ومتابعة التذاكر المفتوحة</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">
              {activeTab === 'orders' ? 'سجل الطلبات' : activeTab === 'invoices' ? 'الفواتير' : 'تذاكر الدعم الفني'}
            </h2>
            <div className="relative w-64">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder={activeTab === 'orders' ? "رقم الطلب..." : activeTab === 'invoices' ? "رقم الفاتورة..." : "رقم أو عنوان التذكرة..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-0">
            {activeTab === 'orders' && (
              <table className="w-full text-right">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-slate-600 font-semibold">رقم الطلب</th>
                    <th className="p-4 text-slate-600 font-semibold">التاريخ</th>
                    <th className="p-4 text-slate-600 font-semibold">الإجمالي</th>
                    <th className="p-4 text-slate-600 font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map(order => (
                    <tr 
                      key={order.id} 
                      onClick={() => setSelectedOrder(order)}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="p-4 font-bold text-slate-800">#{order.id}</td>
                      <td className="p-4 text-slate-600">{new Date(order.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      <td className="p-4 font-bold text-slate-800">{order.totalAmount.toLocaleString()} ر.س</td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">لا توجد طلبات سابقة.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'invoices' && (
              <table className="w-full text-right">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-slate-600 font-semibold">رقم الفاتورة</th>
                    <th className="p-4 text-slate-600 font-semibold">تاريخ الإصدار</th>
                    <th className="p-4 text-slate-600 font-semibold">تاريخ الاستحقاق</th>
                    <th className="p-4 text-slate-600 font-semibold">الإجمالي</th>
                    <th className="p-4 text-slate-600 font-semibold">المدفوع</th>
                    <th className="p-4 text-slate-600 font-semibold">المتبقي</th>
                    <th className="p-4 text-slate-600 font-semibold">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map(invoice => (
                    <tr 
                      key={invoice.id} 
                      onClick={() => setSelectedInvoice(invoice)}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="p-4 font-bold text-slate-800">INV-{invoice.id?.toString().padStart(4, '0')}</td>
                      <td className="p-4 text-slate-600">{new Date(invoice.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      <td className="p-4 text-slate-600">{new Date(invoice.dueDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      <td className="p-4 font-bold text-slate-800">{invoice.totalAmount.toLocaleString()} ر.س</td>
                      <td className="p-4 text-emerald-600">{invoice.paidAmount.toLocaleString()} ر.س</td>
                      <td className="p-4 text-rose-600">{(invoice.totalAmount - invoice.paidAmount).toLocaleString()} ر.س</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                          invoice.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'partial' ? 'مدفوعة جزئياً' : 'غير مدفوعة'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500">
                        <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p>لا توجد فواتير مستحقة حالياً.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'tickets' && (
              <div className="p-6">
                <div className="flex justify-end mb-4">
                  <button 
                    onClick={() => setIsNewTicketModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    فتح تذكرة جديدة
                  </button>
                </div>
                <div className="space-y-4">
                  {filteredTickets.map(ticket => (
                    <div 
                      key={ticket.id} 
                      onClick={() => setSelectedTicket(ticket)}
                      className="p-4 border border-slate-100 rounded-xl hover:border-orange-200 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800">{ticket.title}</h4>
                        {getTicketStatusBadge(ticket.status)}
                      </div>
                      <p className="text-slate-500 text-sm mb-2">{ticket.description}</p>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.createdAt).toLocaleString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                  {filteredTickets.length === 0 && (
                    <div className="text-center py-8 text-slate-500">لا توجد تذاكر دعم فني.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">فتح تذكرة دعم فني جديدة</h2>
              <button 
                onClick={() => setIsNewTicketModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">عنوان التذكرة</label>
                <input
                  type="text"
                  required
                  value={newTicketTitle}
                  onChange={(e) => setNewTicketTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="مثال: مشكلة في الفاتورة رقم 123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">وصف المشكلة</label>
                <textarea
                  required
                  rows={4}
                  value={newTicketDescription}
                  onChange={(e) => setNewTicketDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="يرجى وصف المشكلة بالتفصيل..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  إرسال التذكرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedTicket.title}</h2>
                <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                  <span>{selectedTicket.ticketNumber}</span>
                  <span>•</span>
                  <span>{new Date(selectedTicket.createdAt).toLocaleString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                  <span>•</span>
                  {getTicketStatusBadge(selectedTicket.status)}
                </div>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-slate-50 p-4 rounded-xl mb-6">
                <h3 className="font-semibold text-slate-800 mb-2">وصف المشكلة:</h3>
                <p className="text-slate-600 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800">الردود:</h3>
                {ticketComments.filter(c => !c.isInternal).map(comment => (
                  <div key={comment.id} className={`p-4 rounded-xl ${comment.userId === currentCustomerId ? 'bg-indigo-50 ml-8' : 'bg-slate-50 mr-8'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm text-slate-700">
                        {comment.userId === currentCustomerId ? 'أنت' : 'الدعم الفني'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(comment.createdAt).toLocaleString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm">{comment.content}</p>
                  </div>
                ))}
                {ticketComments.filter(c => !c.isInternal).length === 0 && (
                  <div className="text-center py-4 text-slate-500 text-sm">
                    لا توجد ردود حتى الآن.
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
              <form onSubmit={handleAddComment} className="flex gap-4">
                <input
                  type="text"
                  value={ticketComment}
                  onChange={(e) => setTicketComment(e.target.value)}
                  placeholder="اكتب رداً..."
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!ticketComment.trim()}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  إرسال
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">تفاصيل الطلب #{selectedOrder.id}</h2>
                <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                  <span>{new Date(selectedOrder.date).toLocaleString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                  <span>•</span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="font-semibold text-slate-800 mb-4">المنتجات</h3>
              <div className="space-y-4">
                {selectedOrder.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl">
                    <div>
                      <h4 className="font-bold text-slate-800">{item.name}</h4>
                      <p className="text-sm text-slate-500">الكمية: {item.quantity}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800">{(item.price * item.quantity).toLocaleString()} ر.س</p>
                      {item.discount > 0 && (
                        <p className="text-xs text-rose-500 line-through">
                          {((item.price + item.discount) * item.quantity).toLocaleString()} ر.س
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-xl space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي</span>
                  <span>{selectedOrder.subtotalAmount.toLocaleString()} ر.س</span>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>الخصم</span>
                    <span>-{selectedOrder.discountAmount.toLocaleString()} ر.س</span>
                  </div>
                )}
                {selectedOrder.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>الضريبة</span>
                    <span>{selectedOrder.taxAmount.toLocaleString()} ر.س</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-slate-800 pt-2 border-t border-slate-200">
                  <span>الإجمالي</span>
                  <span>{selectedOrder.totalAmount.toLocaleString()} ر.س</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">تفاصيل الفاتورة INV-{selectedInvoice.id?.toString().padStart(4, '0')}</h2>
                <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                  <span>تاريخ الإصدار: {new Date(selectedInvoice.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span>•</span>
                  <span>تاريخ الاستحقاق: {new Date(selectedInvoice.dueDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    selectedInvoice.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                    selectedInvoice.status === 'partial' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }`}>
                    {selectedInvoice.status === 'paid' ? 'مدفوعة' : selectedInvoice.status === 'partial' ? 'مدفوعة جزئياً' : 'غير مدفوعة'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <h3 className="font-semibold text-slate-800 mb-4">المنتجات</h3>
              <div className="space-y-4">
                {selectedInvoice.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl">
                    <div>
                      <h4 className="font-bold text-slate-800">{item.name}</h4>
                      <p className="text-sm text-slate-500">الكمية: {item.quantity}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-800">{(item.price * item.quantity).toLocaleString()} ر.س</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-xl space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>المجموع الفرعي</span>
                  <span>{selectedInvoice.subtotalAmount.toLocaleString()} ر.س</span>
                </div>
                {selectedInvoice.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>الضريبة</span>
                    <span>{selectedInvoice.taxAmount.toLocaleString()} ر.س</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-slate-800 pt-2 border-t border-slate-200">
                  <span>الإجمالي</span>
                  <span>{selectedInvoice.totalAmount.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between text-emerald-600 pt-2">
                  <span>المدفوع</span>
                  <span>{selectedInvoice.paidAmount.toLocaleString()} ر.س</span>
                </div>
                <div className="flex justify-between font-bold text-rose-600 pt-2">
                  <span>المتبقي</span>
                  <span>{(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString()} ر.س</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
