import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus, Search, Phone, Mail, Building, Calendar, Download, UserPlus, Target, DollarSign, TrendingUp, Users, Edit2, Trash2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '../context/ToastContext';
import LeadProfileModal from '../components/crm/LeadProfileModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useCRMData } from '../components/crm/useCRMData';
import { useCRMActions } from '../components/crm/useCRMActions';
import { Lead } from '../types';

const STAGES = [
  { id: 'new', title: 'جديد', color: 'bg-blue-100 text-blue-800 ' },
  { id: 'contacted', title: 'تم التواصل', color: 'bg-yellow-100 text-yellow-800 ' },
  { id: 'qualified', title: 'مؤهل', color: 'bg-purple-100 text-purple-800 ' },
  { id: 'proposal', title: 'عرض سعر', color: 'bg-orange-100 text-orange-800 ' },
  { id: 'won', title: 'تم البيع', color: 'bg-green-100 text-green-800 ' },
  { id: 'lost', title: 'مفقود', color: 'bg-red-100 text-red-800 ' },
];

export const CRM: React.FC = () => {
  const { success, error } = useToast();
  const pData = useCRMData();
  const pActions = useCRMActions(pData.leads, pData.users, success, error);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة علاقات العملاء (CRM)</h1>
          <p className="text-gray-500">تتبع العملاء المحتملين وفرص المبيعات</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={pActions.handleExport}
            className="bg-white text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
          >
            <Download size={20} />
            <span className="hidden sm:inline">تصدير</span>
          </button>
          <button
            onClick={() => {
              pActions.setEditingLead(null);
              pActions.setFormData({ status: 'new', value: 0 });
              pActions.setIsModalOpen(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={20} />
            <span>إضافة عميل محتمل</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Target size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">قيمة الفرص المفتوحة</p>
            <p className="text-xl font-bold text-gray-900">{pData.pipelineValue.toLocaleString()} {pData.currencyCode}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">قيمة المبيعات الناجحة</p>
            <p className="text-xl font-bold text-gray-900">{pData.wonValue.toLocaleString()} {pData.currencyCode}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">معدل النجاح</p>
            <p className="text-xl font-bold text-gray-900">{pData.winRate}%</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">الفرص النشطة</p>
            <p className="text-xl font-bold text-gray-900">{pData.activeLeadsCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="البحث عن عميل محتمل، شركة، أو رقم هاتف..."
            value={pData.searchTerm}
            onChange={(e) => pData.setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <select
          value={pData.assignedUserFilter}
          onChange={(e) => pData.setAssignedUserFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
        >
          <option value="all">جميع الموظفين</option>
          {pData.users?.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={pActions.handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4 min-h-[calc(100vh-250px)]">
          {STAGES.map(stage => {
            const stageLeads = pData.filteredLeads
              .filter(l => l.status === stage.id)
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            const stageTotal = stageLeads.reduce((sum, l) => sum + (l.value || 0), 0);
            
            return (
              <div key={stage.id} className="min-w-[300px] w-[300px] flex flex-col bg-gray-50 rounded-xl">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className={`px-3 py-1 rounded-full text-sm font-medium ${stage.color}`}>
                      {stage.title}
                    </h3>
                    <span className="text-sm text-gray-500 font-medium">
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-700">
                    {stageTotal.toLocaleString()} {pData.currencyCode}
                  </div>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 space-y-3 ${snapshot.isDraggingOver ? 'bg-indigo-50' : ''}`}
                    >
                      {stageLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id!.toString()} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500' : ''}`}
                              onClick={() => pActions.setViewingLead(lead)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900">{lead.name}</h4>
                                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                  <button onClick={() => pActions.handleEdit(lead)} className="text-gray-400 hover:text-indigo-600">
                                    <Edit2 size={14} />
                                  </button>
                                  <button onClick={() => pActions.setLeadToDeleteId(lead.id!)} className="text-gray-400 hover:text-red-600">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                              
                              {lead.company && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                  <Building size={14} />
                                  <span>{lead.company}</span>
                                </div>
                              )}
                              
                              {lead.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                  <Phone size={14} />
                                  <span>{lead.phone}</span>
                                </div>
                              )}

                              {lead.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                  <Mail size={14} />
                                  <span className="truncate">{lead.email}</span>
                                </div>
                              )}

                              {lead.expectedCloseDate && (
                                <div className={`flex items-center gap-2 text-sm mb-1 ${
                                  differenceInDays(new Date(lead.expectedCloseDate), new Date()) < 0 
                                    ? 'text-red-600 font-medium' 
                                    : 'text-gray-600'
                                }`}>
                                  <Calendar size={14} />
                                  <span>{format(new Date(lead.expectedCloseDate), 'yyyy-MM-dd')}</span>
                                </div>
                              )}

                              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                                <div className="font-bold text-indigo-600">
                                  {lead.value?.toLocaleString()} {pData.currencyCode}
                                </div>
                                <div className="flex gap-2 items-center">
                                  {lead.status === 'won' && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        pActions.setLeadToConvert(lead);
                                      }}
                                      title="تحويل إلى عميل فعلي"
                                      className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200"
                                    >
                                      <UserPlus size={14} />
                                    </button>
                                  )}
                                  {lead.assignedTo && (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600" title={pData.users?.find(u => u.id === lead.assignedTo)?.name}>
                                      {pData.users?.find(u => u.id === lead.assignedTo)?.name?.charAt(0)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Add/Edit Modal */}
      {pActions.isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {pActions.editingLead ? 'تعديل العميل المحتمل' : 'إضافة عميل محتمل جديد'}
              </h2>
              <button onClick={() => pActions.setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 ">
                ✕
              </button>
            </div>
            
            <form onSubmit={pActions.handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم العميل *</label>
                  <input
                    type="text"
                    required
                    value={pActions.formData.name || ''}
                    onChange={e => pActions.setFormData({...pActions.formData, name: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">الشركة</label>
                  <input
                    type="text"
                    value={pActions.formData.company || ''}
                    onChange={e => pActions.setFormData({...pActions.formData, company: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={pActions.formData.phone || ''}
                    onChange={e => pActions.setFormData({...pActions.formData, phone: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={pActions.formData.email || ''}
                    onChange={e => pActions.setFormData({...pActions.formData, email: e.target.value})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">القيمة المتوقعة ({pData.currencyCode})</label>
                  <input
                    type="number"
                    min="0"
                    value={pActions.formData.value || 0}
                    onChange={e => pActions.setFormData({...pActions.formData, value: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المرحلة</label>
                  <select
                    value={pActions.formData.status || 'new'}
                    onChange={e => pActions.setFormData({...pActions.formData, status: e.target.value as Lead['status']})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الإغلاق المتوقع</label>
                  <input
                    type="date"
                    value={pActions.formData.expectedCloseDate ? format(new Date(pActions.formData.expectedCloseDate), 'yyyy-MM-dd') : ''}
                    onChange={e => pActions.setFormData({...pActions.formData, expectedCloseDate: e.target.value ? new Date(e.target.value) : undefined})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تعيين إلى</label>
                  <select
                    value={pActions.formData.assignedTo || ''}
                    onChange={e => pActions.setFormData({...pActions.formData, assignedTo: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">غير معين</option>
                    {pData.users?.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                <textarea
                  rows={3}
                  value={pActions.formData.notes || ''}
                  onChange={e => pActions.setFormData({...pActions.formData, notes: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => pActions.setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewing Lead Profile */}
      {pActions.viewingLead && (
        <LeadProfileModal
          lead={pActions.viewingLead}
          users={pData.users || []}
          onClose={() => pActions.setViewingLead(null)}
          onUpdate={() => {}}
        />
      )}

      {/* Confirm Convert Lead to Customer */}
      <ConfirmModal
        isOpen={pActions.leadToConvert !== null}
        title="تحويل إلى عميل فعلي"
        message={`هل أنت متأكد من تحويل ${pActions.leadToConvert?.name} إلى عميل فعلي؟`}
        onConfirm={() => {
          if (pActions.leadToConvert) {
            pActions.executeConvertToCustomer(pActions.leadToConvert);
          }
        }}
        onCancel={() => pActions.setLeadToConvert(null)}
        confirmText="تحويل"
        cancelText="إلغاء"
      />

      {/* Confirm Delete Lead */}
      <ConfirmModal
        isOpen={pActions.leadToDeleteId !== null}
        title="حذف العميل المحتمل"
        message="هل أنت متأكد من حذف هذا العميل المحتمل؟"
        onConfirm={() => {
          if (pActions.leadToDeleteId !== null) {
            pActions.executeDelete(pActions.leadToDeleteId);
          }
        }}
        onCancel={() => pActions.setLeadToDeleteId(null)}
        confirmText="حذف"
        cancelText="إلغاء"
      />
    </div>
  );
};
