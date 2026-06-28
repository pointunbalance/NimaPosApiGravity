import React, { useState } from 'react';
import { CalendarDays, Search, Plus, MapPin, DollarSign, Clock, Edit, Trash2, Download, Printer } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';
import EventModal from '../../components/events/EventModal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { Event } from '../../types';

export const EventManagement: React.FC = () => {
  const { success, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);

  const events = useLiveQuery(() => db.events.toArray()) || [];

  const handleSaveEvent = async (eventData: Omit<Event, 'id'>) => {
    try {
      const eStart = new Date(eventData.startDate).getTime();
      const eEnd = new Date(eventData.endDate).getTime();

      const conflictingEvent = events.find(e => {
        if (e.id === editingEvent?.id) return false;
        if (e.location.trim().toLowerCase() !== eventData.location.trim().toLowerCase()) return false;
        if (e.status === 'cancelled') return false;

        const checkStart = new Date(e.startDate).getTime();
        const checkEnd = new Date(e.endDate).getTime();

        return eStart < checkEnd && eEnd > checkStart;
      });

      if (conflictingEvent) {
        if (!window.confirm(`تنبيه: يوجد تعارض في حجز مساحة/قاعة (${eventData.location}) مع فعالية أخرى (${conflictingEvent.name}) في نفس الوقت. هل تريد المتابعة؟`)) {
          return;
        }
      }

      if (editingEvent?.id) {
        await db.events.update(editingEvent.id, eventData);
        success('تم تحديث الفعالية بنجاح');
      } else {
        await db.events.add(eventData as Event);
        success('تم إضافة الفعالية بنجاح');
      }
    } catch (err) {
      console.error('Error saving event:', err);
      showError('حدث خطأ أثناء حفظ الفعالية');
    }
  };

  const handleDeleteEvent = (id: number) => {
    setEventToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const confirmDelete = async () => {
    if (eventToDelete !== null) {
      try {
        await db.events.delete(eventToDelete);
        success('تم حذف الفعالية بنجاح');
      } catch (err) {
        console.error('Error deleting event:', err);
        showError('حدث خطأ أثناء حذف الفعالية');
      } finally {
        setEventToDelete(null);
      }
    }
  };

  const openNewModal = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const filteredEvents = events.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning': return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">قيد التخطيط</span>;
      case 'active': return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">نشط</span>;
      case 'completed': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">مكتمل</span>;
      case 'cancelled': return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-bold">ملغى</span>;
      default: return null;
    }
  };

  const handleExportCSV = () => {
    const headers = ['اسم الفعالية', 'تاريخ البدء', 'تاريخ الانتهاء', 'الموقع', 'الميزانية', 'الحالة'];
    const csvContent = [
      headers.join(','),
      ...filteredEvents.map(e => [
        `"${e.name}"`,
        new Date(e.startDate).toLocaleDateString('ar-EG'),
        new Date(e.endDate).toLocaleDateString('ar-EG'),
        `"${e.location}"`,
        e.budget.toFixed(2),
        e.status === 'planning' ? 'قيد التخطيط' : e.status === 'active' ? 'نشط' : e.status === 'completed' ? 'مكتمل' : 'ملغى'
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen transition-colors">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">إدارة الفعاليات والمناسبات</h1>
            <p className="text-slate-500">تخطيط وحجز القاعات، الموارد، وخدمات التموين</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 font-bold"
          >
            <Download className="w-5 h-5" />
            <span>تصدير</span>
          </button>
          <button 
            onClick={() => window.print()}
            className="flex-1 md:flex-none bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 font-bold"
          >
            <Printer className="w-5 h-5" />
            <span>طباعة</span>
          </button>
          <button 
            onClick={openNewModal}
            className="flex-1 md:flex-none bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors flex items-center justify-center gap-2 font-bold"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة فعالية</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-colors">
        <div className="p-4 border-b border-slate-100 flex gap-4 bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث باسم الفعالية أو الموقع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-900 placeholder-slate-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-4 text-slate-600 font-semibold">اسم الفعالية</th>
                <th className="p-4 text-slate-600 font-semibold">التاريخ</th>
                <th className="p-4 text-slate-600 font-semibold">الموقع</th>
                <th className="p-4 text-slate-600 font-semibold">الميزانية</th>
                <th className="p-4 text-slate-600 font-semibold">الحالة</th>
                <th className="p-4 text-slate-600 font-semibold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{event.name}</td>
                  <td className="p-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{new Date(event.startDate).toLocaleDateString('ar-EG')} - {new Date(event.endDate).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{event.location}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-800 font-black">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-slate-400" />
                      <span>{event.budget.toLocaleString()} ر.س</span>
                    </div>
                  </td>
                  <td className="p-4">{getStatusBadge(event.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(event)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-lg font-bold">لا توجد فعاليات مسجلة.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        initialData={editingEvent}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذه الفعالية؟ لا يمكن التراجع عن هذا الإجراء."
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsConfirmModalOpen(false);
          setEventToDelete(null);
        }}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
};

