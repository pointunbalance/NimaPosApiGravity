import React from 'react';
import { DollarSign, Activity, TrendingDown, Receipt, BarChart3, PieChart as PieIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, ComposedChart, Line } from 'recharts';

interface FinancialTabProps {
  stats: {
    totalSales: number;
    totalOrders: number;
    totalPurchases?: number;
    totalCommissions?: number;
    netProfit: number;
    profitMargin: number;
    totalOperatingExpenses: number;
    totalTaxCollected: number;
    cashSales: number;
    cardSales: number;
    creditSales: number;
    dineInSales: number;
    takeawaySales: number;
    deliverySales: number;
  };
  salesTrendData: any[];
  categoryData: any[];
  formatCurrency: (amount: number) => string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const FinancialTab: React.FC<FinancialTabProps> = ({ stats, salesTrendData, categoryData, formatCurrency }) => {
  const paymentData = [
    { name: 'نقدي', value: stats.cashSales },
    { name: 'بطاقة', value: stats.cardSales },
    { name: 'آجل', value: stats.creditSales },
  ].filter(d => d.value > 0);

  const orderTypeData = [
    { name: 'محلي', value: stats.dineInSales },
    { name: 'سفري', value: stats.takeawaySales },
    { name: 'توصيل', value: stats.deliverySales },
  ].filter(d => d.value > 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:grid-cols-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-xs font-bold uppercase">إجمالي المبيعات</p>
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><DollarSign className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800">{formatCurrency(stats.totalSales)}</h3>
          <div className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-lg w-fit">{stats.totalOrders} فاتورة</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl shadow-lg text-white flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <p className="text-indigo-200 text-xs font-bold uppercase">صافي الربح</p>
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg"><Activity className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-extrabold">{formatCurrency(stats.netProfit)}</h3>
          <div className="text-xs text-indigo-100 bg-white/10 px-2 py-1 rounded-lg w-fit">هامش: {stats.profitMargin.toFixed(1)}%</div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-xs font-bold uppercase">المصروفات التشغيلية</p>
            <div className="p-2 bg-red-100 text-red-600 rounded-lg"><TrendingDown className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-extrabold text-red-600">{formatCurrency(stats.totalOperatingExpenses)}</h3>
          <div className="text-xs text-slate-400">إيجار، رواتب، فواتير...</div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between h-36">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-xs font-bold uppercase">الضريبة المحصلة</p>
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Receipt className="w-4 h-4" /></div>
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800">{formatCurrency(stats.totalTaxCollected)}</h3>
          <div className="text-xs text-slate-400">مستحقة للدفع</div>
        </div>
      </div>

      {/* تقرير الأرباح والخسائر الشامل (P&L Income Statement) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-8 print:break-inside-avoid">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800">تقرير وقائمة الأرباح والخسائر (Income Statement)</h3>
          </div>
          <span className="text-xs text-slate-500 font-bold bg-slate-200 px-3 py-1 rounded-full">معادلة محاسبية دقيقة</span>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            {/* 1. Revenues */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="font-bold text-slate-700 text-sm">إجمالي المبيعات والإيرادات (+)</span>
              <span className="font-extrabold text-sm text-slate-900 font-sans">{formatCurrency(stats.totalSales)}</span>
            </div>

            {/* 2. Deductions (Purchases) */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-700 text-sm">تكاليف المشتريات والسلع المخزنية (-)</span>
                <p className="text-[10px] text-slate-400">إجمالي فواتير شراء المنتجات وقطع الغيار الموردة</p>
              </div>
              <span className="font-bold text-sm text-rose-600 font-sans">-{formatCurrency(stats.totalPurchases || 0)}</span>
            </div>

            {/* 3. Deductions (Commissions) */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-700 text-sm">عمولات فنيي الصيانة والموظفين (-)</span>
                <p className="text-[10px] text-slate-400">مكافآت ونسب الإصلاحات المعتمدة ومرتبطة بالأجهزة</p>
              </div>
              <span className="font-bold text-sm text-rose-600 font-sans">-{formatCurrency(stats.totalCommissions || 0)}</span>
            </div>

            {/* 4. Deductions (Operating Expenses) */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-700 text-sm">المصروفات التشغيلية والعمومية (-)</span>
                <p className="text-[10px] text-slate-400">أجور، إيجارات، فواتير، كهرباء وغيرها</p>
              </div>
              <span className="font-bold text-sm text-rose-600 font-sans">-{formatCurrency(stats.totalOperatingExpenses || 0)}</span>
            </div>

            {/* 5. Net Profit Result */}
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="space-y-1">
                <span className="font-extrabold text-slate-900 text-sm">صافي الأرباح التشغيلية (Net Operations Income)</span>
                <p className="text-xs text-slate-500">الأرباح والخسائر الصافية للفترة المحددة بعد خصم كافة التبعات والالتزامات</p>
              </div>
              <div className="text-left">
                <span className={`text-2xl font-extrabold font-sans block ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stats.netProfit >= 0 ? '+' : ''}{formatCurrency(stats.netProfit)}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${stats.netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  هامش صافي الربح: {stats.profitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:break-inside-avoid">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" /> الأداء المالي
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={salesTrendData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} formatter={(val: number) => formatCurrency(val)} />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#6366f1" fill="url(#colorSales)" strokeWidth={3} />
                <Line type="monotone" dataKey="profit" name="الربح" stroke="#10b981" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><PieIcon className="w-5 h-5 text-blue-500" /> الأصناف الأكثر مبيعاً</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend layout="vertical" verticalAlign="middle" align="left" wrapperStyle={{fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 print:break-inside-avoid">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><PieIcon className="w-5 h-5 text-emerald-500" /> طرق الدفع</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {paymentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend layout="vertical" verticalAlign="middle" align="left" wrapperStyle={{fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><PieIcon className="w-5 h-5 text-orange-500" /> أنواع الطلبات</h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={orderTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {orderTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend layout="vertical" verticalAlign="middle" align="left" wrapperStyle={{fontSize: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialTab;
