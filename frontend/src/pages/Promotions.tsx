import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Promotion } from '../types';
import { useToast } from '../context/ToastContext';

import PromotionsHeader from '../components/promotions/PromotionsHeader';
import PromotionsList from '../components/promotions/PromotionsList';
import PromotionModal, { PromotionFormData } from '../components/promotions/PromotionModal';

const Promotions: React.FC = () => {
  const { success, error } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'scheduled' | 'expired'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  const promotions = useLiveQuery(() => db.promotions.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.toCollection().first());

  const filteredPromotions = promotions.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    const now = new Date();
    const startDate = new Date(p.startDate);
    const endDate = p.endDate ? new Date(p.endDate) : null;

    if (statusFilter === 'active') {
      return p.isActive && startDate <= now && (!endDate || endDate >= now) && (!p.usageLimit || p.usedCount < p.usageLimit);
    }
    if (statusFilter === 'scheduled') {
      return p.isActive && startDate > now;
    }
    if (statusFilter === 'expired') {
      return !p.isActive || (endDate && endDate < now) || (p.usageLimit && p.usedCount >= p.usageLimit);
    }

    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const openModal = (promo?: Promotion) => {
    if (promo) {
      setEditingPromo(promo);
    } else {
      setEditingPromo(null);
    }
    setShowModal(true);
  };

  const handleSave = async (data: PromotionFormData) => {
    try {
      const promoData: Promotion = {
        ...data,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        usageLimit: data.usageLimit || undefined,
        createdAt: editingPromo ? editingPromo.createdAt : new Date(),
      } as Promotion;

      if (editingPromo?.id) {
        await db.promotions.put({ ...promoData, id: editingPromo.id });
        success('تم تحديث العرض بنجاح');
      } else {
        await db.promotions.add(promoData);
        success('تم إضافة العرض بنجاح');
      }
      setShowModal(false);
    } catch (err) {
      error('حدث خطأ أثناء حفظ العرض');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العرض؟')) {
      try {
        await db.promotions.delete(id);
        success('تم حذف العرض بنجاح');
      } catch (err) {
        error('حدث خطأ أثناء الحذف');
      }
    }
  };

  const toggleStatus = async (promo: Promotion) => {
    try {
      await db.promotions.update(promo.id!, { isActive: !promo.isActive });
      success(`تم ${!promo.isActive ? 'تفعيل' : 'إيقاف'} العرض`);
    } catch (err) {
      error('حدث خطأ أثناء تغيير الحالة');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <PromotionsHeader onOpenModal={() => openModal()} />

      <PromotionsList 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        filteredPromotions={filteredPromotions}
        currency={settings?.currency || 'IQD'}
        onToggleStatus={toggleStatus}
        onEdit={openModal}
        onDelete={handleDelete}
      />

      <PromotionModal 
        showModal={showModal}
        setShowModal={setShowModal}
        editingPromo={editingPromo}
        currency={settings?.currency || 'IQD'}
        onSave={handleSave}
      />
    </div>
  );
};

export default Promotions;
