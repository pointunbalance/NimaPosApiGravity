import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../db';
import { Download, FileBarChart, GripVertical, X, Calendar, Printer, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { exportToExcel } from '../../utils/excel';

// Define available data sources and their fields
const DATA_SOURCES = {
  sales: {
    label: 'المبيعات',
    fields: [
      { id: 'id', label: 'رقم الطلب' },
      { id: 'date', label: 'التاريخ' },
      { id: 'subtotalAmount', label: 'المجموع الفرعي' },
      { id: 'discountAmount', label: 'الخصم' },
      { id: 'taxAmount', label: 'الضريبة' },
      { id: 'total', label: 'الإجمالي' },
      { id: 'status', label: 'الحالة' },
      { id: 'paymentMethod', label: 'طريقة الدفع' },
      { id: 'cashier', label: 'الكاشير' },
      { id: 'orderType', label: 'نوع الطلب' },
    ]
  },
  products: {
    label: 'المنتجات والمخزون',
    fields: [
      { id: 'id', label: 'الرقم' },
      { id: 'name', label: 'الاسم' },
      { id: 'category', label: 'الفئة' },
      { id: 'price', label: 'سعر البيع' },
      { id: 'cost', label: 'التكلفة' },
      { id: 'stock', label: 'المخزون' },
      { id: 'alertThreshold', label: 'حد التنبيه' },
      { id: 'barcode', label: 'الباركود' },
    ]
  },
  customers: {
    label: 'العملاء',
    fields: [
      { id: 'id', label: 'الرقم' },
      { id: 'name', label: 'الاسم' },
      { id: 'phone', label: 'رقم الهاتف' },
      { id: 'email', label: 'البريد الإلكتروني' },
      { id: 'address', label: 'العنوان' },
      { id: 'totalPurchases', label: 'إجمالي المشتريات' },
      { id: 'createdAt', label: 'تاريخ التسجيل' },
    ]
  },
  expenses: {
    label: 'المصروفات',
    fields: [
      { id: 'id', label: 'الرقم' },
      { id: 'date', label: 'التاريخ' },
      { id: 'title', label: 'العنوان' },
      { id: 'amount', label: 'المبلغ' },
      { id: 'category', label: 'الفئة' },
      { id: 'paymentMethod', label: 'طريقة الدفع' },
      { id: 'description', label: 'الوصف' },
    ]
  }
};

export default function CustomReportBuilder() {
  const [source, setSource] = useState<keyof typeof DATA_SOURCES>('sales');
  const [availableFields, setAvailableFields] = useState(DATA_SOURCES['sales'].fields);
  const [selectedFields, setSelectedFields] = useState<typeof availableFields>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const printRef = useRef<HTMLDivElement>(null);

  // Handle source change
  useEffect(() => {
    setAvailableFields(DATA_SOURCES[source].fields);
    setSelectedFields([]);
    setReportData([]);
  }, [source]);

  const handleDragStart = (e: React.DragEvent, field: any, from: 'available' | 'selected') => {
    e.dataTransfer.setData('field', JSON.stringify(field));
    e.dataTransfer.setData('from', from);
  };

  const handleDrop = (e: React.DragEvent, to: 'available' | 'selected') => {
    e.preventDefault();
    const fieldData = e.dataTransfer.getData('field');
    if (!fieldData) return;
    
    const field = JSON.parse(fieldData);
    const from = e.dataTransfer.getData('from');

    if (from === to) return;

    if (to === 'selected') {
      setAvailableFields(prev => prev.filter(f => f.id !== field.id));
      setSelectedFields(prev => [...prev, field]);
    } else {
      setSelectedFields(prev => prev.filter(f => f.id !== field.id));
      setAvailableFields(prev => [...prev, field]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeSelectedField = (field: any) => {
    setSelectedFields(prev => prev.filter(f => f.id !== field.id));
    setAvailableFields(prev => [...prev, field]);
  };

  const generateReport = async () => {
    if (selectedFields.length === 0) return;
    setIsGenerating(true);
    try {
      let data: any[] = [];
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      if (source === 'sales') {
        const orders = await db.orders.toArray();
        data = orders
          .filter(o => {
            const d = new Date(o.date);
            return d >= start && d <= end;
          })
          .map(o => ({
            id: o.id,
            date: format(new Date(o.date), 'yyyy-MM-dd HH:mm'),
            subtotalAmount: o.subtotalAmount || 0,
            discountAmount: o.discountAmount || 0,
            taxAmount: o.taxAmount || 0,
            total: o.totalAmount,
            status: o.status === 'completed' ? 'مكتمل' : o.status === 'refunded' ? 'مسترجع' : o.status,
            paymentMethod: o.paymentMethod === 'cash' ? 'نقدي' : o.paymentMethod === 'card' ? 'بطاقة' : o.paymentMethod,
            cashier: o.cashierName || 'غير محدد',
            orderType: o.orderType === 'dine-in' ? 'محلي' : o.orderType === 'takeaway' ? 'سفري' : o.orderType === 'delivery' ? 'توصيل' : 'غير محدد'
          }));
      } else if (source === 'products') {
        const products = await db.products.toArray();
        data = products.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          cost: p.costPrice || '-',
          stock: p.stock,
          alertThreshold: p.alertThreshold || '-',
          barcode: p.barcode || '-'
        }));
      } else if (source === 'customers') {
        const customers = await db.customers.toArray();
        data = customers
          .filter(c => {
            if (!c.createdAt) return true;
            const d = new Date(c.createdAt);
            return d >= start && d <= end;
          })
          .map(c => ({
            id: c.id,
            name: c.name,
            phone: c.phone || '-',
            email: c.email || '-',
            address: c.address || '-',
            totalPurchases: c.totalSpent || 0,
            createdAt: c.createdAt ? format(new Date(c.createdAt), 'yyyy-MM-dd') : '-'
          }));
      } else if (source === 'expenses') {
        const expenses = await db.expenses.toArray();
        data = expenses
          .filter(ex => {
            const d = new Date(ex.date);
            return d >= start && d <= end;
          })
          .map(ex => ({
            id: ex.id,
            date: format(new Date(ex.date), 'yyyy-MM-dd'),
            title: ex.title || '-',
            amount: ex.amount,
            category: ex.category,
            paymentMethod: ex.paymentMethod === 'cash' ? 'نقدي' : ex.paymentMethod === 'card' ? 'بطاقة' : ex.paymentMethod === 'bank' ? 'تحويل بنكي' : '-',
            description: ex.notes || '-',
          }));
      }
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportExcel = () => {
    if (reportData.length === 0 || selectedFields.length === 0) return;
    
    const exportData = reportData.map(row => {
      const newRow: any = {};
      selectedFields.forEach(f => {
        newRow[f.label] = row[f.id];
      });
      return newRow;
    });

    exportToExcel(exportData, `تقرير_مخصص_${DATA_SOURCES[source].label}_${format(new Date(), 'yyyyMMdd')}`);
  };

  const handlePrint = () => {
    if (!printRef.current) return;
    
    const printContent = printRef.current.innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = `
      <div dir="rtl" style="font-family: system-ui, -apple-system, sans-serif; padding: 20px;">
        <h1 style="text-align: center; margin-bottom: 20px;">تقرير مخصص - ${DATA_SOURCES[source].label}</h1>
        ${startDate || endDate ? `<p style="text-align: center; margin-bottom: 20px; color: #666;">الفترة: ${startDate || 'البداية'} إلى ${endDate || 'النهاية'}</p>` : ''}
        ${printContent}
      </div>
    `;
    
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore React bindings
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileBarChart className="text-indigo-600" />
            منشئ التقارير المخصصة
          </h1>
          <p className="text-slate-500 text-sm mt-1">قم بسحب وإفلات الحقول لإنشاء تقريرك الخاص</p>
        </div>
        {reportData.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Printer size={20} />
              طباعة
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Download size={20} />
              تصدير Excel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-800">إعدادات التقرير</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">مصدر البيانات</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as keyof typeof DATA_SOURCES)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {Object.entries(DATA_SOURCES).map(([key, data]) => (
                    <option key={key} value={key}>{data.label}</option>
                  ))}
                </select>
              </div>

              {source !== 'products' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">من تاريخ</label>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">إلى تاريخ</label>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-medium text-slate-700 mb-3">الحقول المتاحة</h3>
            <div 
              className="min-h-[150px] p-2 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200"
              onDrop={(e) => handleDrop(e, 'available')}
              onDragOver={handleDragOver}
            >
              {availableFields.map(field => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, field, 'available')}
                  className="bg-white p-3 mb-2 rounded border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing flex items-center gap-2 text-slate-700 hover:border-indigo-300 transition-colors"
                >
                  <GripVertical size={16} className="text-slate-400" />
                  {field.label}
                </div>
              ))}
              {availableFields.length === 0 && (
                <div className="text-center text-slate-400 py-4 text-sm">
                  لا توجد حقول متاحة
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Fields Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-800">الحقول المحددة للتقرير</h3>
              <button
                onClick={generateReport}
                disabled={selectedFields.length === 0 || isGenerating}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm"
              >
                {isGenerating ? 'جاري الإنشاء...' : 'إنشاء التقرير'}
              </button>
            </div>
            <div 
              className="flex-1 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 flex flex-wrap content-start gap-3"
              onDrop={(e) => handleDrop(e, 'selected')}
              onDragOver={handleDragOver}
            >
              {selectedFields.map(field => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, field, 'selected')}
                  className="bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-lg border border-indigo-200 flex items-center gap-2 cursor-grab active:cursor-grabbing shadow-sm"
                >
                  <GripVertical size={16} className="opacity-50" />
                  <span className="font-medium">{field.label}</span>
                  <button onClick={() => removeSelectedField(field)} className="hover:text-red-500 mr-2 p-1 rounded-full hover:bg-indigo-100 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {selectedFields.length === 0 && (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <FileBarChart className="w-12 h-12 opacity-20" />
                  <p>اسحب الحقول من القائمة الجانبية وأفلتها هنا</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Preview */}
      {reportData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="font-medium text-slate-800">معاينة التقرير ({reportData.length} سجل)</h3>
          </div>
          <div className="overflow-x-auto" ref={printRef}>
            <table className="w-full text-right border-collapse">
              <thead className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <tr>
                  {selectedFields.map(field => (
                    <th key={field.id} className="p-4 font-semibold whitespace-nowrap">{field.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {reportData.slice(0, 100).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    {selectedFields.map(field => (
                      <td key={field.id} className="p-4 text-sm text-slate-700 whitespace-nowrap">
                        {row[field.id]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {reportData.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                لا توجد بيانات مطابقة لمعايير البحث
              </div>
            )}
          </div>
          {reportData.length > 100 && (
            <div className="p-4 text-center text-sm text-slate-500 border-t border-slate-200 bg-slate-50">
              يتم عرض أول 100 سجل فقط في المعاينة. قم بتصدير التقرير لرؤية جميع البيانات.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
