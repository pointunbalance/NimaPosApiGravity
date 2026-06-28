
import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { useNavigate } from 'react-router-dom';
import ReportsHeader from '../components/reports/ReportsHeader';
import ReportsTabs from '../components/reports/ReportsTabs';
import FinancialTab from '../components/reports/FinancialTab';
import ProductsTab from '../components/reports/ProductsTab';
import StaffTab from '../components/reports/StaffTab';
import TaxesTab from '../components/reports/TaxesTab';
import TreasuryTab from '../components/reports/TreasuryTab';
import MaintenanceTab from '../components/reports/MaintenanceTab';

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'financial' | 'treasury' | 'maintenance' | 'products' | 'staff' | 'taxes'>('financial');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const [customStartDate, setCustomStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCustomDate, setIsCustomDate] = useState(false);

  // Queries
  // Removed old hooks here
  const products = useLiveQuery(() => db.products.toArray(), []);
  const users = useLiveQuery(() => db.users.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toCollection().first(), []);
  const currencyCode = settings?.currencyCode || 'EGP';

  // --- Helpers ---
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: currencyCode, maximumFractionDigits: 0 }).format(amount);
  };

  // --- Filtering Logic ---
  const filteredData = useLiveQuery(async () => {
    const defaultStart = new Date();
    defaultStart.setHours(0,0,0,0);
    const defaultEnd = new Date();
    defaultEnd.setHours(23,59,59,999);

    let start = new Date();
    let end = new Date();
    
    end.setHours(23, 59, 59, 999);

    if (isCustomDate) {
        start = new Date(customStartDate);
        start.setHours(0,0,0,0);
        end = new Date(customEndDate);
        end.setHours(23,59,59,999);
    } else {
        start.setHours(0,0,0,0);
        if (dateRange === 'week') start.setDate(start.getDate() - 7);
        if (dateRange === 'month') start.setMonth(start.getMonth() - 1);
        if (dateRange === 'year') start.setFullYear(start.getFullYear() - 1);
    }
    
    const startObj = new Date(start);
    const endObj = new Date(end);

    const fOrders = await db.orders.where('date').between(startObj, endObj, true, true).toArray();
    const fExpenses = await db.expenses.where('date').between(startObj, endObj, true, true).toArray();
    const fPurchases = await db.purchases.where('date').between(startObj, endObj, true, true).toArray();
    
    const allCommissions = await db.commissions.toArray();
    const fCommissions = allCommissions.filter(c => {
      const d = new Date(c.date);
      return d >= startObj && d <= endObj;
    });

    const allTreasury = await db.treasuryTransactions.toArray();
    const fTreasury = allTreasury.filter(t => {
      const d = new Date(t.date);
      return d >= startObj && d <= endObj;
    });

    const allMaintenance = await db.maintenanceOrders.toArray();
    const fMaintenance = allMaintenance.filter(m => {
      const d = new Date(m.date);
      return d >= startObj && d <= endObj;
    });

    return { 
      orders: fOrders, 
      expenses: fExpenses, 
      purchases: fPurchases, 
      commissions: fCommissions, 
      treasuryTransactions: fTreasury, 
      maintenanceOrders: fMaintenance, 
      startDate: start, 
      endDate: end 
    };
  }, [dateRange, customStartDate, customEndDate, isCustomDate]) || { 
    orders: [], 
    expenses: [], 
    purchases: [], 
    commissions: [], 
    treasuryTransactions: [], 
    maintenanceOrders: [], 
    startDate: new Date(), 
    endDate: new Date() 
  };

  // --- Advanced Statistics Calculation ---
  const stats = useMemo(() => {
    const { orders, expenses, purchases, commissions } = filteredData;
    
    const productCostMap = new Map<number, number>();
    products?.forEach(p => {
        if(p.id) productCostMap.set(p.id, p.costPrice || 0);
    });

    let totalSales = 0;
    let totalTaxCollected = 0;
    let totalCOGS = 0; 
    let cashSales = 0;
    let cardSales = 0;
    let creditSales = 0;

    let dineInSales = 0;
    let takeawaySales = 0;
    let deliverySales = 0;

    orders.forEach(o => {
        if (o.status === 'draft') return;
        totalSales += o.totalAmount;
        totalTaxCollected += (o.taxAmount || 0);
        
        o.items.forEach(item => {
            const cost = productCostMap.get(item.productId) || 0;
            totalCOGS += (cost * item.quantity * (item.conversionFactor || 1));
        });

        if (o.paymentMethod === 'cash') cashSales += o.totalAmount;
        else if (o.paymentMethod === 'card') cardSales += o.totalAmount;
        else if (o.paymentMethod === 'credit') creditSales += o.totalAmount;

        if (o.orderType === 'dine-in') dineInSales += o.totalAmount;
        else if (o.orderType === 'takeaway') takeawaySales += o.totalAmount;
        else if (o.orderType === 'delivery') deliverySales += o.totalAmount;
    });

    const totalOperatingExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPurchases = purchases ? purchases.reduce((sum, p) => sum + p.totalAmount, 0) : 0;
    const totalCommissions = commissions ? commissions.reduce((sum, c) => sum + c.amount, 0) : 0;

    const grossProfit = totalSales - totalTaxCollected - totalCOGS; // Exclude tax from profit
    // Calculate precise net profit as Sales - Purchases - OperatingExpenses - Commissions
    const netProfit = totalSales - totalPurchases - totalOperatingExpenses - totalCommissions;
    
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

    return { 
        totalSales, 
        totalTaxCollected,
        totalCOGS, 
        totalOperatingExpenses, 
        totalPurchases,
        totalCommissions,
        grossProfit, 
        netProfit, 
        totalOrders, 
        avgOrderValue, 
        cashSales, 
        cardSales, 
        creditSales, 
        dineInSales,
        takeawaySales,
        deliverySales,
        profitMargin 
    };
  }, [filteredData, products]);

  // --- Inventory Valuation Stats ---
  const valuation = useMemo(() => {
    if (!products) return { totalCostValue: 0, totalSaleValue: 0, expectedProfit: 0, itemCount: 0 };
    let totalCostValue = 0;
    let totalSaleValue = 0;
    products.forEach(p => {
      const stock = p.stock || 0;
      totalCostValue += stock * (p.costPrice || 0);
      totalSaleValue += stock * (p.price || 0);
    });
    const expectedProfit = totalSaleValue - totalCostValue;
    return {
      totalCostValue,
      totalSaleValue,
      expectedProfit,
      itemCount: products.length
    };
  }, [products]);

  // --- Product Analysis Stats ---
  const productStats = useMemo(() => {
      if (!products || !filteredData.orders) return { topSelling: [], deadStock: [], profitable: [] };

      const salesMap = new Map<number, { qty: number, revenue: number, profit: number }>();
      const productLookup = new Map<number, any>();
      
      products.forEach(p => productLookup.set(p.id!, p));

      filteredData.orders.forEach(o => {
          o.items.forEach(i => {
              const curr = salesMap.get(i.productId) || { qty: 0, revenue: 0, profit: 0 };
              const cost = productLookup.get(i.productId)?.costPrice || 0;
              const convertedQuantity = i.quantity * (i.conversionFactor || 1);
              const profit = i.total - (cost * convertedQuantity);
              
              salesMap.set(i.productId, {
                  qty: curr.qty + convertedQuantity,
                  revenue: curr.revenue + i.total,
                  profit: curr.profit + profit
              });
          });
      });

      // Top Selling by Qty
      const topSelling = Array.from(salesMap.entries())
          .map(([id, data]) => ({ name: productLookup.get(id)?.name || 'Unknown', ...data }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 5);

      // Most Profitable
      const profitable = Array.from(salesMap.entries())
          .map(([id, data]) => ({ name: productLookup.get(id)?.name || 'Unknown', ...data }))
          .sort((a, b) => b.profit - a.profit)
          .slice(0, 5);

      // Dead Stock (Products with 0 sales in period)
      const deadStock = products
          .filter(p => !salesMap.has(p.id!) && p.stock > 0)
          .map(p => ({
              id: p.id,
              name: p.name,
              stock: p.stock,
              value: p.stock * (p.costPrice || 0)
          }))
          .sort((a, b) => b.value - a.value) // Sort by stuck capital value
          .slice(0, 10);

      return { topSelling, profitable, deadStock };
  }, [filteredData, products]);

  // --- Staff Analysis Stats ---
  const staffStats = useMemo(() => {
      const map = new Map<string, { orders: number, total: number }>();
      filteredData.orders.forEach(o => {
          let name = 'Unknown';
          if (o.salespersonId && users) {
              const sp = users.find(u => u.id === o.salespersonId);
              if (sp) name = sp.name;
          } else if (o.cashierName) {
              name = o.cashierName;
          }

          const curr = map.get(name) || { orders: 0, total: 0 };
          map.set(name, { orders: curr.orders + 1, total: curr.total + o.totalAmount });
      });
      return Array.from(map.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.total - a.total);
  }, [filteredData, users]);

  // --- Charts Data Preparation ---
  const salesTrendData = useMemo(() => {
      const { orders, expenses, startDate, endDate } = filteredData;
      const dataMap = new Map<string, { name: string, sales: number, expense: number, profit: number }>();
      const isOneDay = (endDate.getTime() - startDate.getTime()) < 86400000 + 1000;
      const getKey = (date: Date) => isOneDay ? date.toLocaleTimeString('ar-EG', { hour: '2-digit', hour12: false }) + ':00' : date.toLocaleDateString('ar-EG', { month: 'long', day: 'numeric' });

      orders.forEach(o => {
          const key = getKey(new Date(o.date));
          const current = dataMap.get(key) || { name: key, sales: 0, expense: 0, profit: 0 };
          current.sales += o.totalAmount;
          current.profit += (o.totalAmount - (o.taxAmount || 0)); // Approx profit without cogs per transaction for trend
          dataMap.set(key, current);
      });

      expenses.forEach(e => {
          const key = getKey(new Date(e.date));
          const current = dataMap.get(key) || { name: key, sales: 0, expense: 0, profit: 0 };
          current.expense += e.amount;
          current.profit -= e.amount;
          dataMap.set(key, current);
      });

      return Array.from(dataMap.values());
  }, [filteredData]);

  const categoryData = useMemo(() => {
      if (!products || filteredData.orders.length === 0) return [];
      const catMap = new Map<string, number>();
      const productCatMap = new Map<number, string>(products.map(p => [p.id!, p.category]));

      filteredData.orders.forEach(order => {
          order.items.forEach(item => {
              const cat = productCatMap.get(item.productId) || 'أخرى';
              catMap.set(cat, (catMap.get(cat) || 0) + item.total);
          });
      });

      return Array.from(catMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredData, products]);

  const handlePrint = () => { setTimeout(() => window.print(), 50); };

  const handleExport = () => {
      const { orders, expenses } = filteredData;
      if (orders.length === 0 && expenses.length === 0) { alert('لا توجد بيانات للتصدير'); return; }

      const summaryData = [{
          'إجمالي المبيعات': stats.totalSales,
          'إجمالي الطلبات': stats.totalOrders,
          'صافي الربح': stats.netProfit,
          'هامش الربح (%)': stats.profitMargin.toFixed(2),
          'المصروفات التشغيلية': stats.totalOperatingExpenses,
          'الضريبة المحصلة': stats.totalTaxCollected,
          'مبيعات نقدية': stats.cashSales,
          'مبيعات بطاقة': stats.cardSales,
          'مبيعات آجلة': stats.creditSales,
          'طلبات محلي': stats.dineInSales,
          'طلبات سفري': stats.takeawaySales,
          'طلبات توصيل': stats.deliverySales,
      }];

      const trendData = (salesTrendData as any[]).map(d => ({
          'التاريخ': d.name,
          'المبيعات': d.sales,
          'المصروفات': d.expense,
          'الربح': d.profit
      }));

      const topProductsData = productStats.topSelling.map(p => ({
          'المنتج': p.name,
          'الكمية المباعة': p.qty,
          'الإيرادات': p.revenue,
          'الربح': p.profit
      }));

      const staffData = staffStats.map(s => ({
          'الموظف': s.name,
          'عدد الفواتير': s.orders,
          'إجمالي المبيعات': s.total,
          'متوسط الفاتورة': s.orders > 0 ? (s.total / s.orders).toFixed(2) : 0
      }));

      import('../utils/excel').then(({ exportMultipleToExcel }) => {
          exportMultipleToExcel([
              { name: 'ملخص الأداء', data: summaryData },
              { name: 'التوجه المالي', data: trendData },
              { name: 'المنتجات الأكثر مبيعاً', data: topProductsData },
              { name: 'أداء الموظفين', data: staffData }
          ], `reports_${new Date().toISOString().split('T')[0]}`);
      });
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50/50 print:bg-white print:p-0 print:overflow-visible print:h-auto print:static font-['Tajawal']">
      
      <ReportsHeader 
        dateRange={dateRange}
        setDateRange={setDateRange}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        isCustomDate={isCustomDate}
        setIsCustomDate={setIsCustomDate}
        handleExport={handleExport}
        handlePrint={handlePrint}
      />

      <ReportsTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'financial' && (
        <FinancialTab 
          stats={stats} 
          salesTrendData={salesTrendData} 
          categoryData={categoryData} 
          formatCurrency={formatCurrency} 
        />
      )}

      {activeTab === 'treasury' && (
        <TreasuryTab 
          treasuryTransactions={filteredData.treasuryTransactions || []} 
          formatCurrency={formatCurrency} 
        />
      )}

      {activeTab === 'maintenance' && (
        <MaintenanceTab 
          maintenanceOrders={filteredData.maintenanceOrders || []} 
          formatCurrency={formatCurrency} 
        />
      )}

      {activeTab === 'products' && (
        <ProductsTab 
          productStats={productStats} 
          valuation={valuation}
          formatCurrency={formatCurrency} 
        />
      )}

      {activeTab === 'staff' && (
        <StaffTab 
          staffStats={staffStats} 
          formatCurrency={formatCurrency} 
        />
      )}

      {activeTab === 'taxes' && (
        <TaxesTab 
          stats={stats} 
          formatCurrency={formatCurrency} 
        />
      )}

    </div>
  );
};

export default Reports;
