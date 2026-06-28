import React, { useState } from 'react';
import { Lead, LeadActivity, User } from '../../types';
import { X, Phone, Mail, Building, Clock, DollarSign, Calendar, MessageSquare, Briefcase, Plus, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '../../db';
import { useToast } from '../../context/ToastContext';

interface LeadProfileModalProps {
  lead: Lead;
  users: User[];
  onClose: () => void;
  onUpdate: () => void;
}

const LeadProfileModal: React.FC<LeadProfileModalProps> = ({ lead, users, onClose, onUpdate }) => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'activities'>('activities');
  const [newActivityType, setNewActivityType] = useState<LeadActivity['type']>('note');
  const [newActivityDesc, setNewActivityDesc] = useState('');

  const handleAddActivity = async () => {
    if (!newActivityDesc.trim()) return;

    const newActivity: LeadActivity = {
      id: Date.now().toString(),
      type: newActivityType,
      date: new Date(),
      description: newActivityDesc,
      userId: 1, // Assuming current user ID is 1 for now, ideally from auth context
    };

    const updatedActivities = [...(lead.activities || []), newActivity];

    try {
      await db.leads.update(lead.id!, {
        activities: updatedActivities,
        updatedAt: new Date()
      });
      success('تم إضافة النشاط بنجاح');
      setNewActivityDesc('');
      onUpdate();
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء إضافة النشاط');
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone size={16} className="text-blue-500" />;
      case 'email': return <Mail size={16} className="text-purple-500" />;
      case 'meeting': return <Briefcase size={16} className="text-green-500" />;
      default: return <MessageSquare size={16} className="text-gray-500" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'call': return 'مكالمة';
      case 'email': return 'بريد إلكتروني';
      case 'meeting': return 'اجتماع';
      default: return 'ملاحظة';
    }
  };

  const assignedUser = users.find(u => u.id === lead.assignedTo);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{lead.name}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {lead.company && (
                <div className="flex items-center gap-1">
                  <Building size={16} />
                  <span>{lead.company}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-1">
                  <Phone size={16} />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-1">
                  <Mail size={16} />
                  <span>{lead.email}</span>
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'activities'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 '
            }`}
          >
            الأنشطة والملاحظات
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 '
            }`}
          >
            التفاصيل
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'activities' ? (
            <div className="space-y-6">
              {/* Add Activity */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 mb-3">إضافة نشاط جديد</h3>
                <div className="flex gap-2 mb-3">
                  {(['note', 'call', 'email', 'meeting'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setNewActivityType(type)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                        newActivityType === type
                          ? 'bg-indigo-100 text-indigo-700 '
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {getActivityIcon(type)}
                      {getActivityLabel(type)}
                    </button>
                  ))}
                </div>
                <textarea
                  value={newActivityDesc}
                  onChange={(e) => setNewActivityDesc(e.target.value)}
                  placeholder="اكتب تفاصيل النشاط هنا..."
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 mb-3 resize-none"
                  rows={3}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleAddActivity}
                    disabled={!newActivityDesc.trim()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus size={18} />
                    إضافة
                  </button>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900">سجل الأنشطة</h3>
                {(!lead.activities || lead.activities.length === 0) ? (
                  <p className="text-gray-500 text-center py-4">لا توجد أنشطة مسجلة بعد</p>
                ) : (
                  <div className="relative border-r-2 border-gray-200 pr-4 space-y-6 mr-2">
                    {[...lead.activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(activity => (
                      <div key={activity.id} className="relative">
                        <div className="absolute -right-[25px] top-1 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-gray-900">{getActivityLabel(activity.type)}</span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(activity.date), 'yyyy-MM-dd HH:mm')}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{activity.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">القيمة المتوقعة</label>
                  <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                    <DollarSign size={20} className="text-green-500" />
                    {lead.value?.toLocaleString() || 0}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">تاريخ الإغلاق المتوقع</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Calendar size={18} className="text-blue-500" />
                    {lead.expectedCloseDate ? format(new Date(lead.expectedCloseDate), 'yyyy-MM-dd') : 'غير محدد'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">الموظف المسؤول</label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <UserIcon size={18} className="text-purple-500" />
                    {assignedUser?.name || 'غير معين'}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">ملاحظات إضافية</label>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 min-h-[100px] text-gray-700 whitespace-pre-wrap">
                  {lead.notes || 'لا توجد ملاحظات'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadProfileModal;
