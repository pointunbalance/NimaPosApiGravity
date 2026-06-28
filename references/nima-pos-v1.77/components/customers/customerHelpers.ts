import { Customer, Order } from '../../types';
import { exportToExcel, importFromExcel } from '../../utils/excel';
import { db } from '../../db';

export const calculateLoyaltyPoints = (totalSpent: number) => {
  return Math.floor(totalSpent / 100);
};

export const openWhatsApp = (phone: string, name: string) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const text = `مرحبا ${name}،\n`;
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
};

export const handleExportCustomers = async (success: (msg: string) => void, error: (msg: string) => void) => {
  try {
    const allCustomers = await db.customers.toArray();
    const exportData = allCustomers.map(c => ({
      ID: c.id,
      Name: c.name,
      Code: c.code || '',
      Phone: c.phone || '',
      Address: c.address || '',
      Email: c.email || '',
      Balance: c.balance || 0,
      WalletBalance: c.walletBalance || 0,
      CreditLimit: c.creditLimit || 0,
      TotalSpent: c.totalSpent || 0,
      CreatedAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US') : ''
    }));
    exportToExcel(exportData, `Customers_${new Date().toISOString().split('T')[0]}`);
    success('تم تصدير العملاء بنجاح');
  } catch (e) {
    console.error(e);
    error('حدث خطأ أثناء التصدير');
  }
};

export const handleImportCustomers = async (file: File, success: (msg: string) => void, error: (msg: string) => void) => {
  try {
    const data = await importFromExcel(file);
    if (!data || data.length === 0) {
      error('الملف فارغ أو غير صالح');
      return;
    }

    const customersToImport: Partial<Customer>[] = data.map(row => ({
      name: row.Name || row.name || 'عميل مستورد',
      code: row.Code || row.code || '',
      phone: row.Phone || row.phone || '',
      address: row.Address || row.address || '',
      email: row.Email || row.email || '',
      balance: Number(row.Balance || row.balance) || 0,
      walletBalance: Number(row.WalletBalance || row.walletBalance) || 0,
      creditLimit: Number(row.CreditLimit || row.creditLimit) || 0,
      totalSpent: Number(row.TotalSpent || row.totalSpent) || 0,
      tags: [],
      createdAt: new Date()
    }));

    await db.customers.bulkAdd(customersToImport as Customer[]);
    success(`تم استيراد ${customersToImport.length} عميل بنجاح`);
  } catch (e) {
    console.error(e);
    error('حدث خطأ أثناء الاستيراد. تأكد من صيغة الملف.');
  }
};

export const printStatement = (
  selectedProfile: Customer,
  ordersToPrint: Order[],
  settings: any,
  currencyCode: string,
  formatCurrency: (amount: number) => string
) => {
  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) return;

  const totalValue = ordersToPrint.reduce((acc, o) => acc + o.totalAmount, 0);

  printWindow.document.write(`
    <html dir="rtl">
      <head>
        <title>كشف حساب عميل - ${selectedProfile.name}</title>
        <style>
          body { font-family: 'Tahoma', sans-serif; padding: 20px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
          .info { margin-bottom: 20px; }
          .total { font-weight: bold; font-size: 18px; margin-top: 20px; text-align: left; background: #eee; padding: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${settings?.storeName || 'Nima POS'}</h2>
          <h3>كشف فواتير عميل</h3>
          <p>تاريخ الطباعة: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="info">
            <strong>العميل:</strong> ${selectedProfile.name}<br/>
            <strong>الهاتف:</strong> ${selectedProfile.phone}<br/>
            <strong>الرصيد الحالي المستحق:</strong> ${formatCurrency(selectedProfile.balance || 0)}
        </div>

        <table>
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>التاريخ</th>
              <th>عدد الأصناف</th>
              <th>الحالة</th>
              <th>القيمة</th>
            </tr>
          </thead>
          <tbody>
            ${ordersToPrint.map(o => `
              <tr>
                <td>#${o.id}</td>
                <td>${new Date(o.date).toLocaleDateString('ar-EG', {month:'long', day:'numeric', year:'numeric'})}</td>
                <td>${o.items.length}</td>
                <td>${o.paymentMethod === 'credit' ? 'آجل' : 'نقدي'}</td>
                <td>${formatCurrency(o.totalAmount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
           إجمالي الفواتير المحددة: ${formatCurrency(totalValue)}
        </div>
        <script>window.print();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
