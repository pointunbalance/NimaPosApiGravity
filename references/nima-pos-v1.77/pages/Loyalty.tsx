import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Customer, LoyaltySettings, LoyaltyTier, LoyaltyTransaction } from '../types';
import { useToast } from '../context/ToastContext';

import LoyaltyHeader from '../components/loyalty/LoyaltyHeader';
import LoyaltySettingsTab from '../components/loyalty/LoyaltySettingsTab';
import LoyaltyCustomersTab from '../components/loyalty/LoyaltyCustomersTab';
import LoyaltyHistoryModal from '../components/loyalty/LoyaltyHistoryModal';

const Loyalty: React.FC = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'customers' | 'settings'>('customers');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<LoyaltyTransaction[]>([]);

  // Settings State
  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltySettings>({
    enabled: false,
    pointsPerCurrency: 10,
    currencyPerPoint: 0.01,
    minPointsToRedeem: 100,
    welcomeBonus: 0,
    enableTiers: false,
    tiers: []
  });

  useEffect(() => {
    if (settings?.loyaltySettings) {
      setLoyaltyConfig(settings.loyaltySettings);
    }
  }, [settings]);

  // Customers State
  const customers = useLiveQuery(() => db.customers.toArray()) || [];
  
  const filteredCustomers = customers
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery))
    .sort((a, b) => (b.loyaltyPoints || 0) - (a.loyaltyPoints || 0));

  const handleSaveSettings = async () => {
    if (!settings?.id) return;
    try {
      await db.settings.update(settings.id, {
        loyaltySettings: loyaltyConfig
      });
      success('تم حفظ إعدادات برنامج الولاء بنجاح');
    } catch (e) {
      error('حدث خطأ أثناء حفظ الإعدادات');
    }
  };

  const handleAdjustPoints = async (customer: Customer, amount: number, type: 'manual_add' | 'manual_deduct') => {
    try {
      const storedUser = localStorage.getItem('nima_user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      
      const currentPoints = customer.loyaltyPoints || 0;
      const newPoints = type === 'manual_add' ? currentPoints + amount : Math.max(0, currentPoints - amount);
      const pointsDiff = type === 'manual_add' ? amount : -amount;

      await db.transaction('rw', db.customers, db.loyaltyTransactions, async () => {
        await db.customers.update(customer.id!, { loyaltyPoints: newPoints });
        await db.loyaltyTransactions.add({
          customerId: customer.id!,
          date: new Date(),
          points: pointsDiff,
          type: type,
          note: `تعديل يدوي بواسطة: ${currentUser?.name || 'مجهول'}`
        });
      });
      
      success(`تم ${type === 'manual_add' ? 'إضافة' : 'خصم'} ${amount} نقطة بنجاح`);
      
      // Refresh history if modal is open
      if (showHistoryModal && selectedCustomer?.id === customer.id) {
        loadHistory(customer.id);
      }
    } catch (e) {
      error('حدث خطأ أثناء تعديل النقاط');
    }
  };

  const loadHistory = async (customerId: number) => {
    const history = await db.loyaltyTransactions
      .where('customerId')
      .equals(customerId)
      .reverse()
      .sortBy('date');
    setCustomerHistory(history);
  };

  const openHistory = (customer: Customer) => {
    setSelectedCustomer(customer);
    loadHistory(customer.id!);
    setShowHistoryModal(true);
  };

  const addTier = () => {
    setLoyaltyConfig({
      ...loyaltyConfig,
      tiers: [
        ...loyaltyConfig.tiers,
        { id: Date.now().toString(), name: 'مستوى جديد', minPoints: 1000, multiplier: 1.5, color: '#f59e0b' }
      ]
    });
  };

  const updateTier = (id: string, field: keyof LoyaltyTier, value: any) => {
    setLoyaltyConfig({
      ...loyaltyConfig,
      tiers: loyaltyConfig.tiers.map(t => t.id === id ? { ...t, [field]: value } : t)
    });
  };

  const removeTier = (id: string) => {
    setLoyaltyConfig({
      ...loyaltyConfig,
      tiers: loyaltyConfig.tiers.filter(t => t.id !== id)
    });
  };

  const getCustomerTier = (points: number): LoyaltyTier | null => {
    if (!loyaltyConfig.enableTiers || !loyaltyConfig.tiers.length) return null;
    // Sort tiers by minPoints descending to find the highest applicable tier
    const sortedTiers = [...loyaltyConfig.tiers].sort((a, b) => b.minPoints - a.minPoints);
    return sortedTiers.find(t => points >= t.minPoints) || null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-['Tajawal'] bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 rounded-2xl min-h-screen" dir="rtl">
      <LoyaltyHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'settings' && (
        <LoyaltySettingsTab
          loyaltyConfig={loyaltyConfig}
          setLoyaltyConfig={setLoyaltyConfig}
          currency={settings?.currency || 'IQD'}
          onSave={handleSaveSettings}
          addTier={addTier}
          updateTier={updateTier}
          removeTier={removeTier}
        />
      )}

      {activeTab === 'customers' && (
        <LoyaltyCustomersTab
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          loyaltyConfig={loyaltyConfig}
          filteredCustomers={filteredCustomers}
          currency={settings?.currency || 'IQD'}
          getCustomerTier={getCustomerTier}
          openHistory={openHistory}
          handleAdjustPoints={handleAdjustPoints}
        />
      )}

      <LoyaltyHistoryModal
        showHistoryModal={showHistoryModal}
        setShowHistoryModal={setShowHistoryModal}
        selectedCustomer={selectedCustomer}
        customerHistory={customerHistory}
      />
    </div>
  );
};

export default Loyalty;
