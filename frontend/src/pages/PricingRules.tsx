import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { PricingRule } from '../types';

import PricingRulesHeader from '../components/pricing-rules/PricingRulesHeader';
import PricingRulesList from '../components/pricing-rules/PricingRulesList';
import PricingRuleModal from '../components/pricing-rules/PricingRuleModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';

export default function PricingRules() {
  const { success, error: showError } = useToast();
  const rules = useLiveQuery(() => db.pricingRules.toArray()) || [];
  const settings = useLiveQuery(() => db.settings.get(1));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void} | null>(null);

  const [formData, setFormData] = useState<Partial<PricingRule>>({
    name: '',
    minCost: 0,
    maxCost: 0,
    marginPercentage: 0,
    isActive: true,
  });

  const handleOpenModal = (rule?: PricingRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData(rule);
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        minCost: 0,
        maxCost: 0,
        marginPercentage: 0,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule?.id) {
        await db.pricingRules.update(editingRule.id, formData as PricingRule);
        success('تم تحديث القاعدة بنجاح');
      } else {
        await db.pricingRules.add(formData as PricingRule);
        success('تم إضافة القاعدة بنجاح');
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving pricing rule:', error);
      showError('حدث خطأ أثناء حفظ القاعدة');
    }
  };

  const handleDelete = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'حذف قاعدة التسعير',
      message: 'هل أنت متأكد من حذف هذه القاعدة؟ قد يتأثر تسعير المنتجات المعتمدة على هذه الفئة.',
      onConfirm: async () => {
        await db.pricingRules.delete(id);
        success('تم حذف قاعدة التسعير بنجاح');
        setConfirmConfig(null);
      }
    });
  };

  const toggleSmartPricing = async () => {
    if (settings?.id) {
      await db.settings.update(settings.id, {
        enableSmartPricing: !settings.enableSmartPricing
      });
      success(!settings.enableSmartPricing ? 'تم تفعيل التسعير الذكي' : 'تم تعطيل التسعير الذكي');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal'] rounded-2xl min-h-screen" dir="rtl">
      <PricingRulesHeader 
        enableSmartPricing={settings?.enableSmartPricing || false}
        toggleSmartPricing={toggleSmartPricing}
        onOpenModal={() => handleOpenModal()}
      />

      <PricingRulesList 
        rules={rules}
        currency={settings?.currency}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
      />

      <PricingRuleModal 
        isModalOpen={isModalOpen}
        handleCloseModal={handleCloseModal}
        editingRule={editingRule}
        formData={formData}
        setFormData={setFormData}
        handleSubmit={handleSubmit}
        currency={settings?.currency}
      />

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
}
