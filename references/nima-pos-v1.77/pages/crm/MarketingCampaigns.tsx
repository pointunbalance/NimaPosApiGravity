import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { Campaign } from '../../types';
import { Megaphone, Plus, Mail, MessageSquare, Share2, Target, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const TYPE_ICONS = {
  email: Mail,
  sms: MessageSquare,
  social: Share2,
  other: Target
};

const TYPE_LABELS = {
  email: 'بريد إلكتروني',
  sms: 'رسائل نصية',
  social: 'تواصل اجتماعي',
  other: 'أخرى'
};

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-800 border-slate-200',
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
};

const STATUS_LABELS = {
  draft: 'مسودة',
  active: 'نشطة',
  completed: 'مكتملة',
  cancelled: 'ملغاة'
};

export default function MarketingCampaigns() {
  const campaigns = useLiveQuery(() => db.campaigns.toArray()) || [];
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [sendingId, setSendingId] = useState<number | null>(null);
  const [sendError, setSendError] = useState<{id: number, message: string} | null>(null);
  const [sendSuccess, setSendSuccess] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: '',
    type: 'email',
    status: 'draft',
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    budget: 0,
    spent: 0,
    targetAudience: '',
    expectedROI: 0,
    actualROI: 0
  });

  const handleSendCampaign = async (campaign: Campaign) => {
    if (!campaign.id) return;
    setSendingId(campaign.id);
    setSendError(null);
    setSendSuccess(null);

    try {
        // Validation check for target audience before sending
        if (!campaign.targetAudience || campaign.targetAudience.trim() === '') {
            throw new Error('لا يمكن إرسال الحملة: شريحة العملاء المستهدفة غير محددة.');
        }

        // Simulate network latency / external API call to mail provider (e.g., Mailchimp/SendGrid)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate a 30% chance of system failure to demonstrate robust error handling
        if (Math.random() < 0.3) {
            throw new Error('فشل الاتصال بمزود خدمة الإرسال. يرجى المحاولة مرة أخرى لاحقاً.');
        }

        // Success path
        await db.campaigns.update(campaign.id, { status: 'active' });
        setSendSuccess(campaign.id);
        setTimeout(() => setSendSuccess(null), 3000);
    } catch (err: any) {
        console.error('Campaign sending failed:', err);
        setSendError({ id: campaign.id, message: err.message || 'حدث خطأ غير معروف' });
        setTimeout(() => setSendError(null), 5000);
    } finally {
        setSendingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCampaign && editingCampaign.id) {
      await db.campaigns.update(editingCampaign.id, { ...formData });
    } else {
      await db.campaigns.add({
        ...formData,
        createdAt: new Date(),
      } as Campaign);
    }
    setIsModalOpen(false);
    setEditingCampaign(null);
    setFormData({ 
      name: '', type: 'email', status: 'draft', 
      startDate: new Date(), endDate: new Date(new Date().setDate(new Date().getDate() + 7)), 
      budget: 0, spent: 0, targetAudience: '', expectedROI: 0, actualROI: 0 
    });
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData(campaign);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Megaphone className="text-indigo-600" />
            الحملات التسويقية
          </h1>
          <p className="text-slate-500 text-sm mt-1">إدارة وتحليل أداء الحملات التسويقية</p>
        </div>
        <button
          onClick={() => {
            setEditingCampaign(null);
            setFormData({ 
              name: '', type: 'email', status: 'draft', 
              startDate: new Date(), endDate: new Date(new Date().setDate(new Date().getDate() + 7)), 
              budget: 0, spent: 0, targetAudience: '', expectedROI: 0, actualROI: 0 
            });
            setIsModalOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          حملة جديدة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map(campaign => {
          const Icon = TYPE_ICONS[campaign.type as keyof typeof TYPE_ICONS];
          const progress = campaign.budget > 0 ? Math.min(100, (campaign.spent / campaign.budget) * 100) : 0;
          
          return (
            <div 
              key={campaign.id}
              onClick={() => openEditModal(campaign)}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 cursor-pointer hover:border-indigo-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 line-clamp-1">{campaign.name}</h3>
                    <span className="text-xs text-slate-500">{TYPE_LABELS[campaign.type as keyof typeof TYPE_LABELS]}</span>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[campaign.status as keyof typeof STATUS_COLORS]}`}>
                  {STATUS_LABELS[campaign.status as keyof typeof STATUS_LABELS]}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <DollarSign size={14} /> الميزانية
                  </div>
                  <div className="font-bold text-slate-800">
                    {campaign.budget.toLocaleString()} د.ع
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
                    <TrendingUp size={14} /> العائد الفعلي
                  </div>
                  <div className={`font-bold ${campaign.actualROI && campaign.actualROI > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {campaign.actualROI ? `${campaign.actualROI}%` : '-'}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500">الإنفاق ({progress.toFixed(0)}%)</span>
                  <span className="font-medium text-slate-700">{campaign.spent.toLocaleString()} / {campaign.budget.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${progress > 90 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar size={14} />
                  {format(new Date(campaign.startDate), 'MMM d', { locale: ar })} - {format(new Date(campaign.endDate), 'MMM d, yyyy', { locale: ar })}
                </div>
                {(campaign.status === 'draft' || campaign.status === 'active') && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleSendCampaign(campaign); }}
                        disabled={sendingId === campaign.id}
                        className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                            sendingId === campaign.id ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 
                            'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 '
                        }`}
                    >
                        {sendingId === campaign.id ? (
                            <span className="flex items-center gap-1"><span className="animate-pulse">جاري الإرسال...</span></span>
                        ) : (
                            <><span className="rotate-45 block"><Megaphone size={12} /></span> إرسال الآن</>
                        )}
                    </button>
                )}
              </div>
              
              {sendError?.id === campaign.id && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg animate-fade-in">
                      {sendError.message}
                  </div>
              )}
              {sendSuccess === campaign.id && (
                  <div className="mt-3 p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-lg animate-fade-in">
                      تمت عملية الإرسال بنجاح!
                  </div>
              )}
            </div>
          );
        })}
        
        {campaigns.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <Megaphone size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-800 mb-1">لا توجد حملات</h3>
            <p className="text-slate-500">ابدأ بإنشاء حملتك التسويقية الأولى.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingCampaign ? 'تعديل الحملة' : 'حملة تسويقية جديدة'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">اسم الحملة *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">النوع</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="email">بريد إلكتروني</option>
                    <option value="sms">رسائل نصية</option>
                    <option value="social">تواصل اجتماعي</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="draft">مسودة</option>
                    <option value="active">نشطة</option>
                    <option value="completed">مكتملة</option>
                    <option value="cancelled">ملغاة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ البدء</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate ? format(new Date(formData.startDate), 'yyyy-MM-dd') : ''}
                    onChange={e => setFormData({...formData, startDate: new Date(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الانتهاء</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate ? format(new Date(formData.endDate), 'yyyy-MM-dd') : ''}
                    onChange={e => setFormData({...formData, endDate: new Date(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الميزانية (د.ع)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.budget}
                    onChange={e => setFormData({...formData, budget: Number(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">الإنفاق الفعلي (د.ع)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.spent}
                    onChange={e => setFormData({...formData, spent: Number(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">الجمهور المستهدف</label>
                  <input
                    type="text"
                    placeholder="مثال: العملاء الذين لم يشتروا منذ 3 أشهر"
                    value={formData.targetAudience}
                    onChange={e => setFormData({...formData, targetAudience: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">العائد المتوقع (%)</label>
                  <input
                    type="number"
                    value={formData.expectedROI}
                    onChange={e => setFormData({...formData, expectedROI: Number(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">العائد الفعلي (%)</label>
                  <input
                    type="number"
                    value={formData.actualROI}
                    onChange={e => setFormData({...formData, actualROI: Number(e.target.value)})}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-6">
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
                  حفظ الحملة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
