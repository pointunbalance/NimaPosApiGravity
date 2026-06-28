import React, { useState, useMemo } from 'react';
import { LineChart as LineChartIcon, TrendingUp, Users, Package, DollarSign, BarChart2, Calendar, Download, CreditCard, ShoppingCart } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { exportToExcel } from '../../utils/excel';

type DateRange = 'today' | 'week' | 'month' | 'year' | 'all';

export const BIDashboards: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>('month');

  const allOrders = useLiveQuery(() => db.orders.toArray()) || [];
  const allProducts = useLiveQuery(() => db.products.toArray()) || [];
  const allCustomers = useLiveQuery(() => db.customers.toArray()) || [];
  const allExpenses = useLiveQuery(() => db.expenses.toArray()) || [];

  // Filter data based on date range
  const { orders, expenses, customers } = useMemo(() => {
    const now = new Date();
    let startDate = new Date(0); // Default to all time

    if (dateRange === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (dateRange === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
    } else if (dateRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    return {
      orders: allOrders.filter(o => new Date(o.date) >= startDate),
      expenses: allExpenses.filter(e => new Date(e.date) >= startDate),
      customers: allCustomers.filter(c => !c.createdAt || new Date(c.createdAt) >= startDate)
    };
  }, [allOrders, allExpenses, allCustomers, dateRange]);

  // Calculate KPIs
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Prepare data for Sales Trend Chart
  const salesTrendData = useMemo(() => {
    const trendMap = new Map<string, number>();
    
    // Initialize map based on range to ensure continuous dates
    if (dateRange === 'week' || dateRange === 'month') {
      const days = dateRange === 'week' ? 7 : 30;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        trendMap.set(d.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }), 0);
      }
    }

    orders.forEach(order => {
      const date = new Date(order.date);
      let key = date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
      if (dateRange === 'year' || dateRange === 'all') {
        key = date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short' });
      }
      trendMap.set(key, (trendMap.get(key) || 0) + order.totalAmount);
    });

    return Array.from(trendMap.entries()).map(([name, المبيعات]) => ({ name, المبيعات }));
  }, [orders, dateRange]);

  // Prepare data for Top Products
  const topProductsData = useMemo(() => {
    const productSales = new Map<string, { quantity: number, revenue: number }>();
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const current = productSales.get(item.name) || { quantity: 0, revenue: 0 };
        productSales.set(item.name, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + item.total
        });
      });
    });

    return Array.from(productSales.entries())
      .map(([name, data]) => ({
        name,
        'الكمية المباعة': data.quantity,
        'الإيرادات': data.revenue
      }))
      .sort((a, b) => b['الإيرادات'] - a['الإيرادات'])
      .slice(0, 5);
  }, [orders]);

  // Prepare data for Expenses by Category
  const expenseData = useMemo(() => {
    const categories = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Prepare data for Payment Methods
  const paymentMethodData = useMemo(() => {
    const methods = orders.reduce((acc, order) => {
      const method = order.paymentMethod === 'cash' ? 'نقدي' :
                     order.paymentMethod === 'card' ? 'بطاقة' :
                     order.paymentMethod === 'credit' ? 'آجل' :
                     order.paymentMethod === 'wallet' ? 'محفظة' : 'مقسم';
      acc[method] = (acc[method] || 0) + order.totalAmount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  const handleExport = () => {
    const exportData = [
      { 'المؤشر': 'إجمالي الإيرادات', 'القيمة': totalRevenue },
      { 'المؤشر': 'إجمالي المصروفات', 'القيمة': totalExpenses },
      { 'المؤشر': 'صافي الأرباح', 'القيمة': netProfit },
      { 'المؤشر': 'إجمالي الطلبات', 'القيمة': totalOrders },
      { 'المؤشر': 'متوسط قيمة الطلب', 'القيمة': averageOrderValue },
      { 'المؤشر': 'العملاء الجدد', 'القيمة': customers.length },
    ];
    exportToExcel(exportData, `تقرير_ذكاء_الأعمال_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <LineChartIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">لوحات تحكم ذكاء الأعمال (BI)</h1>
            <p className="text-slate-500">تحليل البيانات المتقدم ورؤى استراتيجية</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 outline-none pr-2"
            >
              <option value="today">اليوم</option>
              <option value="week">آخر 7 أيام</option>
              <option value="month">هذا الشهر</option>
              <option value="year">هذا العام</option>
              <option value="all">كل الوقت</option>
            </select>
          </div>
          <button 
            onClick={handleExport}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Download className="w-5 h-5" />
            تصدير التقرير
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">إجمالي الإيرادات</p>
          <h3 className="text-xl font-bold text-slate-800">{totalRevenue.toLocaleString()} <span className="text-sm font-normal text-slate-500">د.ع</span></h3>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">صافي الأرباح</p>
          <h3 className="text-xl font-bold text-slate-800">{netProfit.toLocaleString()} <span className="text-sm font-normal text-slate-500">د.ع</span></h3>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">إجمالي المصروفات</p>
          <h3 className="text-xl font-bold text-slate-800">{totalExpenses.toLocaleString()} <span className="text-sm font-normal text-slate-500">د.ع</span></h3>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">إجمالي الطلبات</p>
          <h3 className="text-xl font-bold text-slate-800">{totalOrders}</h3>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">متوسط قيمة الطلب</p>
          <h3 className="text-xl font-bold text-slate-800">{Math.round(averageOrderValue).toLocaleString()} <span className="text-sm font-normal text-slate-500">د.ع</span></h3>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-slate-500 mb-1">العملاء الجدد</p>
          <h3 className="text-xl font-bold text-slate-800">{customers.length}</h3>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6">اتجاه المبيعات</h3>
          <div className="h-80" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toLocaleString()} د.ع`, 'المبيعات']}
                />
                <Line type="monotone" dataKey="المبيعات" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">المنتجات الأعلى مبيعاً (بالإيرادات)</h3>
          <div className="h-80" dir="ltr">
            {topProductsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" margin={{ left: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={100} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number, name: string) => [
                      name === 'الإيرادات' ? `${value.toLocaleString()} د.ع` : value, 
                      name
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="الإيرادات" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">لا توجد بيانات مبيعات</div>
            )}
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">توزيع المصروفات</h3>
          <div className="h-80" dir="ltr">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toLocaleString()} د.ع`, 'المبلغ']}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">لا توجد بيانات مصروفات</div>
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-400" />
            طرق الدفع المفضلة
          </h3>
          <div className="h-64" dir="ltr">
            {paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethodData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toLocaleString()} د.ع`, 'المبلغ']}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} name="المبلغ" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">لا توجد بيانات مبيعات</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BIDashboards;
