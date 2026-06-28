import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Currency } from '../types';
import CurrenciesHeader from '../components/currencies/CurrenciesHeader';
import CurrenciesTable from '../components/currencies/CurrenciesTable';
import CurrencyModal, { CurrencyFormData } from '../components/currencies/CurrencyModal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { useToast } from '../context/ToastContext';

const Currencies: React.FC = () => {
  const currencies = useLiveQuery(() => db.currencies.toArray(), []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { error, success } = useToast();
  
  // Confirm Modal State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const confirmAction = (title: string, message: string, onConfirm: () => void) => {
    setConfirmState({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmState(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const [promptState, setPromptState] = useState<{
      isOpen: boolean;
      title: string;
      message: string;
      defaultValue: string;
      onConfirm: (val: string) => void;
  }>({
      isOpen: false,
      title: '',
      message: '',
      defaultValue: '',
      onConfirm: () => {}
  });

  const promptAction = (title: string, message: string, defaultValue: string, onConfirm: (val: string) => void) => {
      setPromptState({
          isOpen: true,
          title,
          message,
          defaultValue,
          onConfirm: (val) => {
              onConfirm(val);
              setPromptState(prev => ({ ...prev, isOpen: false }));
          }
      });
  };

  const filteredCurrencies = useMemo(() => {
    if (!currencies) return [];
    return currencies.filter(c => 
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      if (a.isBaseCurrency) return -1;
      if (b.isBaseCurrency) return 1;
      return a.code.localeCompare(b.code);
    });
  }, [currencies, searchQuery]);

  const handleOpenModal = (currency?: Currency) => {
    if (currency) {
      setEditingCurrency(currency);
    } else {
      setEditingCurrency(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCurrency(null);
  };

  const handleSave = async (formData: CurrencyFormData) => {
    try {
      // If setting as base currency, unset others
      if (formData.isBaseCurrency) {
        const currentBase = currencies?.find(c => c.isBaseCurrency);
        if (currentBase && currentBase.id !== editingCurrency?.id) {
          await db.currencies.update(currentBase.id!, { isBaseCurrency: false });
        }
        // Base currency exchange rate should always be 1
        formData.exchangeRate = 1;
      }

      const dataToSave = {
        ...formData,
        code: formData.code.toUpperCase(),
        lastUpdated: new Date(),
      } as Currency;

      if (editingCurrency?.id) {
        await db.currencies.update(editingCurrency.id, dataToSave);
      } else {
        await db.currencies.add(dataToSave);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving currency:', error);
      error('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id: number) => {
    const currency = currencies?.find(c => c.id === id);
    if (currency?.isBaseCurrency) {
      error('لا يمكن حذف العملة الأساسية للنظام. يرجى تعيين عملة أخرى كعملة أساسية أولاً.');
      return;
    }

    confirmAction('حذف العملة', 'هل أنت متأكد من حذف هذه العملة؟', async () => {
      await db.currencies.delete(id);
      success('تم حذف العملة بنجاح');
    });
  };

  const handleSetBaseCurrency = async (id: number) => {
    confirmAction('تعيين العملة الأساسية', 'هل أنت متأكد من تعيين هذه العملة كعملة أساسية للنظام؟ سيتم تغيير سعر صرفها إلى 1.', async () => {
      try {
        const currentBase = currencies?.find(c => c.isBaseCurrency);
        if (currentBase && currentBase.id) {
          await db.currencies.update(currentBase.id, { isBaseCurrency: false });
        }
        await db.currencies.update(id, { isBaseCurrency: true, exchangeRate: 1, lastUpdated: new Date() });
        success('تم تعيين العملة بنجاح');
      } catch (err) {
        console.error('Error setting base currency:', err);
        error('حدث خطأ أثناء تعيين العملة الأساسية');
      }
    });
  };

  const handleQuickUpdateRate = async (id: number, currentRate: number) => {
    promptAction('تحديث سعر الصرف', 'أدخل سعر الصرف الجديد:', currentRate.toString(), async (newRateStr) => {
        const newRate = parseFloat(newRateStr);
        if (!isNaN(newRate) && newRate > 0) {
          try {
            await db.currencies.update(id, { exchangeRate: newRate, lastUpdated: new Date() });
            success('تم التحديث بنجاح');
          } catch (err) {
            console.error('Error updating exchange rate:', err);
            error('حدث خطأ أثناء تحديث سعر الصرف');
          }
        } else {
          error('يرجى إدخال رقم صحيح أكبر من الصفر');
        }
    });
  };

  const handleExportCSV = () => {
    if (!filteredCurrencies || filteredCurrencies.length === 0) return;
    
    const headers = ['رمز العملة', 'اسم العملة', 'سعر الصرف', 'النوع', 'آخر تحديث'];
    const csvContent = [
      headers.join(','),
      ...filteredCurrencies.map(c => [
        `"${c.code}"`,
        `"${c.name}"`,
        c.exchangeRate,
        `"${c.isBaseCurrency ? 'عملة أساسية' : 'عملة أجنبية'}"`,
        `"${c.lastUpdated ? new Date(c.lastUpdated).toLocaleString('ar-EG') : '-'}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'العملات.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-8 font-['Tajawal'] bg-slate-50/50 min-h-screen" dir="rtl">
      <div className="hidden print:block mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800">تقرير العملات وأسعار الصرف</h1>
        <p className="text-slate-500 text-sm mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
      </div>

      <CurrenciesHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onAddCurrency={() => handleOpenModal()}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
      />

      <CurrenciesTable 
        filteredCurrencies={filteredCurrencies}
        onEdit={handleOpenModal}
        onDelete={handleDelete}
        onSetBaseCurrency={handleSetBaseCurrency}
        onQuickUpdateRate={handleQuickUpdateRate}
      />

      <CurrencyModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingCurrency={editingCurrency}
      />
    </div>
  );
};

export default Currencies;
