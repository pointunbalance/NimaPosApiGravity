import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Lead } from '../../types';
import { Filter, Plus, Phone, Mail, Building, Clock, User as UserIcon, MoreVertical, Target } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const PIPELINE_STAGES = [
  { id: 'new', label: 'جديد', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'contacted', label: 'تم التواصل', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { id: 'qualified', label: 'مؤهل', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'proposal', label: 'عرض سعر', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { id: 'won', label: 'مكتمل (ربح)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'lost', label: 'مفقود', color: 'bg-red-100 text-red-800 border-red-200' },
];

export default function LeadsPipeline() {
  const leads = useLiveQuery(() => db.leads.toArray()) || [];
  const users = useLiveQuery(() => db.users.toArray()) || [];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'new',
    value: 0,
    notes: ''
  });

  const handleDragStart = (e: React.DragEvent, leadId: number) => {
    e.dataTransfer.setData('leadId', leadId.toString());
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = parseInt(e.dataTransfer.getData('leadId'));
    if (!leadId) return;
    
    await db.leads.update(leadId, { status: newStatus as any });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLead && editingLead.id) {
      await db.leads.update(editingLead.id, { ...formData });
    } else {
      await db.leads.add({
        ...formData,
        createdAt: new Date(),
      } as Lead);
    }
    setIsModalOpen(false);
    setEditingLead(null);
    setFormData({ name: '', company: '', email: '', phone: '', status: 'new', value: 0, notes: '' });
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData(lead);
    setIsModalOpen(true);
  };

  const deleteLead = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل المحتمل؟')) {
      await db.leads.delete(id);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Filter className="text-indigo-600" />
            إدارة الفرص والمبيعات (Pipeline)
          </h1>
          <p className="text-slate-500 text-sm mt-1">تتبع العملاء المحتملين من أول تواصل حتى إتمام البيع</p>
        </div>
        <button
          onClick={() => {
            setEditingLead(null);
            setFormData({ name: '', company: '', email: '', phone: '', status: 'new', value: 0, notes: '' });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          إضافة فرصة جديدة
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-200px)]">
        {PIPELINE_STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage.id);
          const stageTotal = stageLeads.reduce((sum, l) => sum + (l.value || 0), 0);
          
          return (
            <div 
              key={stage.id} 
              className="flex-shrink-0 w-80 bg-slate-50 rounded-xl border border-slate-200 flex flex-col"
              onDrop={(e) => handleDrop(e, stage.id)}
              onDragOver={handleDragOver}
            >
              <div className={`p-3 border-b border-slate-200 rounded-t-xl ${stage.color} bg-opacity-50`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold">{stage.label}</h3>
                  <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-medium">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="text-sm mt-1 opacity-80 font-medium">
                  {stageTotal.toLocaleString()} د.ع
                </div>
              </div>
              
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {stageLeads.map(lead => (
                  <div 
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id!)}
                    className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-indigo-300 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800">{lead.name}</h4>
                      <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(lead)} className="text-slate-400 hover:text-indigo-600">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {lead.company && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5">
                        <Building size={12} />
                        {lead.company}
                      </div>
                    )}
                    
                    {(lead.phone || lead.email) && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        {lead.phone && <span className="flex items-center gap-1"><Phone size={12} /> {lead.phone}</span>}
                        {lead.email && <span className="flex items-center gap-1"><Mail size={12} /> {lead.email}</span>}
                      </div>
                    )}

                    {lead.assignedTo && (
                        <div className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit mb-3">
                            <UserIcon size={12} />
                            {users.find(u => u.id === lead.assignedTo)?.name?.split(' ')[0] || 'غير معروف'}
                        </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                      <div className="font-bold text-indigo-600 text-sm">
                        {(lead.value || 0).toLocaleString()} د.ع
                      </div>
                      <div className="flex flex-col items-end gap-1 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-[10px]">
                            <Clock size={10} />
                            أنشئ: {format(new Date(lead.createdAt), 'MMM d', { locale: ar })}
                        </span>
                        {lead.expectedCloseDate && (
                            <span className={`flex items-center gap-1 text-[10px] font-bold ${new Date(lead.expectedCloseDate) < new Date() && lead.status !== 'won' && lead.status !== 'lost' ? 'text-red-500' : 'text-slate-500'}`}>
                                <Target size={10} />
                                إغلاق: {format(new Date(lead.expectedCloseDate), 'MMM d, yyyy', { locale: ar })}
                            </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {stageLeads.length === 0 && (
                  <div className="text-center p-4 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                    اسحب وأفلت هنا
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingLead ? 'تعديل فرصة' : 'إضافة فرصة جديدة'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">اسم العميل *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الشركة</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={e => setFormData({...formData, company: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">القيمة المتوقعة (د.ع)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.value || 0}
                    onChange={e => setFormData({...formData, value: Number(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المرحلة</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {PIPELINE_STAGES.map(stage => (
                        <option key={stage.id} value={stage.id}>{stage.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الإغلاق المتوقع</label>
                    <input
                        type="date"
                        value={formData.expectedCloseDate ? format(new Date(formData.expectedCloseDate), 'yyyy-MM-dd') : ''}
                        onChange={e => setFormData({...formData, expectedCloseDate: new Date(e.target.value)})}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">مسؤول المبيعات</label>
                  <select
                    value={formData.assignedTo || ''}
                    onChange={e => setFormData({...formData, assignedTo: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">غير معين</option>
                    {users.filter(u => ['admin', 'manager', 'sales', 'cashier'].includes(u.role)).map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-between pt-4">
                {editingLead ? (
                  <button
                    type="button"
                    onClick={() => deleteLead(editingLead.id!)}
                    className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                  >
                    حذف
                  </button>
                ) : <div></div>}
                
                <div className="flex gap-2">
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
                    حفظ
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
