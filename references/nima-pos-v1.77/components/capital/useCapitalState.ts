import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

export const useCapitalState = () => {
  const [capitalInput, setCapitalInput] = useState<number | ''>('');
  const [isSaved, setIsSaved] = useState(false);
  
  // Fixed Asset Modal
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [deleteAssetId, setDeleteAssetId] = useState<number | null>(null);

  const settings = useLiveQuery(() => db.settings.toCollection().first());
  const expenses = useLiveQuery(() => db.expenses.toArray());
  const orders = useLiveQuery(() => db.orders.toArray());
  const suppliers = useLiveQuery(() => db.suppliers.toArray());
  const customers = useLiveQuery(() => db.customers.toArray());
  const warehouses = useLiveQuery(() => db.warehouses.toArray());
  const products = useLiveQuery(() => db.products.toArray());
  const inventoryItems = useLiveQuery(() => db.inventory.toArray());
  const assets = useLiveQuery(() => db.assets.toArray());

  useEffect(() => {
      if (settings?.initialCapital) {
          setCapitalInput(settings.initialCapital);
      }
  }, [settings]);

  const currencyCode = settings?.currencyCode || 'IQD';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(amount);
  };

  const handleSaveCapital = async () => {
      if (!settings || !settings.id) return;
      try {
          await db.settings.update(settings.id, {
              initialCapital: Number(capitalInput)
          });
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2000);
      } catch (e) {
          console.error("Failed to save capital", e);
      }
  };

  const handleAddAsset = async (name: string, value: string) => {
      try {
          await db.assets.add({
              name,
              value: parseFloat(value),
              cost: parseFloat(value), // default to current value
              lifeInYears: 5, // default
              purchaseDate: new Date()
          });
          setIsAssetModalOpen(false);
      } catch(e) { console.error(e); }
  };

  const handleDeleteAsset = (id: number) => {
      setDeleteAssetId(id);
  };

  const executeDeleteAsset = async () => {
      if (deleteAssetId) {
          try {
              await db.assets.delete(deleteAssetId);
          } catch (e) {
              console.error(e);
          }
          setDeleteAssetId(null);
      }
  };

  // --- Advanced Calculations ---
  
  const financialData = useMemo(() => {
      const initial = Number(capitalInput) || 0;
      
      // 1. Inventory Value
      const warehouseAssets: Record<number, number> = {};
      let totalInventoryValue = 0;
      
      const productCostMap = new Map<number, number>();
      products?.forEach(p => {
          if (p.id) productCostMap.set(p.id, p.costPrice || 0);
      });

      inventoryItems?.forEach(item => {
          const cost = productCostMap.get(item.productId) || 0;
          const value = item.quantity * cost;
          warehouseAssets[item.warehouseId] = (warehouseAssets[item.warehouseId] || 0) + value;
          totalInventoryValue += value;
      });

      // 2. Cash Flow Estimation
      const totalRevenue = orders?.reduce((acc, o) => acc + o.totalAmount, 0) || 0;
      const totalExpenses = expenses?.reduce((acc, e) => acc + e.amount, 0) || 0;
      
      const estimatedCash = initial + totalRevenue - totalExpenses;

      // 3. Debts
      const suppliersDebt = suppliers?.filter(s => (s.balance || 0) > 0) || [];
      const totalLiabilities = suppliersDebt.reduce((acc, s) => acc + (s.balance || 0), 0); // Money we owe

      const customersDebt = customers?.reduce((acc, c) => acc + (c.balance || 0), 0) || 0; // Money owed to us

      // 4. Fixed Assets
      const totalFixedAssets = assets?.reduce((sum, a) => sum + a.value, 0) || 0;

      // 5. Totals
      // Current Assets = Cash + Inventory + Receivables (Customer Debt)
      const currentAssets = estimatedCash + totalInventoryValue + customersDebt;
      
      // Total Assets (Fixed + Current)
      const totalAssets = currentAssets + totalFixedAssets;
      
      // Net Worth (Equity) = Total Assets - Liabilities
      const netWorth = totalAssets - totalLiabilities;
      
      // Working Capital = Current Assets - Current Liabilities
      const workingCapital = currentAssets - totalLiabilities;
      
      // ROI Calculation (Net Profit / Total Invested Capital)
      const netProfit = totalRevenue - totalExpenses;
      const roi = initial > 0 ? (netProfit / initial) * 100 : 0;

      return {
          initial,
          warehouseAssets,
          totalInventoryValue,
          estimatedCash,
          totalLiabilities,
          suppliersDebt,
          customersDebt,
          totalFixedAssets,
          currentAssets,
          totalAssets,
          netWorth,
          workingCapital,
          netProfit,
          roi
      };
  }, [capitalInput, orders, expenses, suppliers, customers, inventoryItems, products, assets]);

  // --- Cash Flow Trends Chart Data ---
  const trendData = useMemo(() => {
      if (!orders || !expenses) return [];
      
      const map = new Map<string, { income: number, expense: number }>();
      const getKey = (d: Date) => d.toISOString().split('T')[0];

      orders.forEach(o => {
          if (o.status === 'refunded') return;
          const key = getKey(new Date(o.date));
          const curr = map.get(key) || { income: 0, expense: 0 };
          curr.income += o.totalAmount;
          map.set(key, curr);
      });

      expenses.forEach(e => {
          const key = getKey(new Date(e.date));
          const curr = map.get(key) || { income: 0, expense: 0 };
          curr.expense += e.amount;
          map.set(key, curr);
      });

      return Array.from(map.entries())
          .map(([date, val]) => ({ 
              date: new Date(date).toLocaleDateString('ar-EG', {month: 'short', day: 'numeric'}), 
              rawDate: date,
              ...val,
              net: val.income - val.expense 
          }))
          .sort((a,b) => a.rawDate.localeCompare(b.rawDate))
          .slice(-14);
  }, [orders, expenses]);

  const assetAllocationData = [
      { name: 'السيولة النقدية', value: Math.max(0, financialData.estimatedCash), color: '#10b981' }, 
      { name: 'قيمة المخزون', value: financialData.totalInventoryValue, color: '#6366f1' }, 
      { name: 'ديون العملاء', value: financialData.customersDebt, color: '#f59e0b' },
      { name: 'أصول ثابتة', value: financialData.totalFixedAssets, color: '#8b5cf6' },
  ];

  const handleExportCSV = () => {
    const headers = ['المؤشر', 'القيمة'];
    const csvContent = [
      headers.join(','),
      `"إجمالي الأصول",${financialData.totalAssets}`,
      `"الأصول المتداولة",${financialData.currentAssets}`,
      `"الأصول الثابتة",${financialData.totalFixedAssets}`,
      `"السيولة النقدية",${financialData.estimatedCash}`,
      `"قيمة المخزون",${financialData.totalInventoryValue}`,
      `"ديون العملاء",${financialData.customersDebt}`,
      `"إجمالي الخصوم (ديون الموردين)",${financialData.totalLiabilities}`,
      `"صافي الثروة (حقوق الملكية)",${financialData.netWorth}`,
      `"رأس المال العامل",${financialData.workingCapital}`,
      `"صافي الربح",${financialData.netProfit}`,
      `"العائد على الاستثمار (ROI)",${financialData.roi.toFixed(2)}%`
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'المركز_المالي.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return {
    capitalInput,
    setCapitalInput,
    isSaved,
    isAssetModalOpen,
    setIsAssetModalOpen,
    deleteAssetId,
    setDeleteAssetId,
    assets: assets || [],
    warehouses: warehouses || [],
    formatCurrency,
    handleSaveCapital,
    handleAddAsset,
    handleDeleteAsset,
    executeDeleteAsset,
    financialData,
    trendData,
    assetAllocationData,
    handleExportCSV,
    handlePrint
  };
};
