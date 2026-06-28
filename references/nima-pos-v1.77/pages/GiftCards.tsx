import { AccountingEngine } from '../services/AccountingEngine';
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { GiftCard } from '../types';

import GiftCardsHeader from '../components/gift-cards/GiftCardsHeader';
import GiftCardsStats from '../components/gift-cards/GiftCardsStats';
import GiftCardsList from '../components/gift-cards/GiftCardsList';
import GiftCardsSidebar from '../components/gift-cards/GiftCardsSidebar';
import GiftCardModal from '../components/gift-cards/GiftCardModal';
import ConfirmModal from '../components/ui/ConfirmModal';

const GiftCards = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<GiftCard | null>(null);
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean; title: string; message: string; onConfirm: () => void} | null>(null);
  const [formData, setFormData] = useState<Partial<GiftCard>>({
    code: '',
    initialBalance: 0,
    currentBalance: 0,
    expiryDate: new Date(),
    status: 'active'
  });

  const giftCards = useLiveQuery(() => db.giftCards.toArray());

  const handleSave = async () => {
    try {
      await (db as any).transaction('rw', db.giftCards, db.shifts, db.journalEntries, db.accounts, async () => {
        if (editingCard?.id) {
          await db.giftCards.update(editingCard.id, formData as GiftCard);
        } else {
          const newCardId = await db.giftCards.add(formData as GiftCard);
          
          // Selling a gift card adds cash to the current active shift
          if (formData.initialBalance > 0) {
            const activeShift = await db.shifts.where('status').equals('open').first();
            if (activeShift) {
              await db.shifts.update(activeShift.id!, {
                expectedCash: (activeShift.expectedCash || 0) + formData.initialBalance,
                cashSales: (activeShift.cashSales || 0) + formData.initialBalance
              });
            }

            // Journal Entry: Debit Cash, Credit Unearned Revenue (Liability)
            try {
              const cashAccount = await db.accounts.where('code').equals('1010').first();
              const unearnedRevenueAccount = await db.accounts.where('code').equals('2040').first(); // Using same liability account (or another one)
              
              if (cashAccount && unearnedRevenueAccount) {
                await AccountingEngine.postEntry({
                  date: new Date(),
                  reference: `GC-${newCardId}`,
                  description: `بيع بطاقة هدايا ${formData.code}`,
                  lines: [
                    { accountId: cashAccount.id!, accountName: cashAccount.name, debit: formData.initialBalance, credit: 0, description: `استلام نقدي عن بطاقة هدايا` },
                    { accountId: unearnedRevenueAccount.id!, accountName: unearnedRevenueAccount.name, debit: 0, credit: formData.initialBalance, description: `التزام بطاقات هدايا` }
                  ],
                  });
              }
            } catch (err) {
              console.error("Failed to post journal entry for gift card:", err);
            }
          }
        }
      });
      setIsModalOpen(false);
      setEditingCard(null);
      setFormData({ code: '', initialBalance: 0, currentBalance: 0, expiryDate: new Date(), status: 'active' });
    } catch (error) {
      console.error('Error saving gift card:', error);
    }
  };

  const handleEdit = (card: GiftCard) => {
    setEditingCard(card);
    setFormData(card);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'حذف بطاقة الهدايا',
      message: 'هل أنت متأكد من حذف هذه البطاقة؟ لن يمكن استخدام الرصيد الحالي بعد الحذف.',
      onConfirm: async () => {
        await db.giftCards.delete(id);
        setConfirmConfig(null);
      }
    });
  };

  const filteredCards = giftCards?.filter(card => 
    card.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const activeCardsCount = giftCards?.filter(c => c.status === 'active').length || 0;
  const totalBalance = giftCards?.reduce((sum, c) => sum + (c.currentBalance || 0), 0) || 0;
  const usedBalance = giftCards?.reduce((sum, c) => sum + ((c.initialBalance || 0) - (c.currentBalance || 0)), 0) || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal'] rounded-2xl min-h-screen" dir="rtl">
      <GiftCardsHeader 
        onOpenModal={() => {
          setEditingCard(null);
          setFormData({ code: '', initialBalance: 0, currentBalance: 0, expiryDate: new Date(), status: 'active' });
          setIsModalOpen(true);
        }} 
      />

      <GiftCardsStats 
        activeCardsCount={activeCardsCount}
        totalBalance={totalBalance}
        usedBalance={usedBalance}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GiftCardsList 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredCards={filteredCards}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <GiftCardsSidebar />
      </div>

      <GiftCardModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingCard={editingCard}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
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
};

export default GiftCards;
