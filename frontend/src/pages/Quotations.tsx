import React, { useState } from 'react';
import { db } from '../db';
import { Quotation } from '../types';
import { logActivity } from '../utils/logger';
import { AccountingEngine } from '../services/AccountingEngine';
import { Clock, CheckCircle2, XCircle, FileBadge, AlertCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useQuotations } from '../components/quotations/useQuotations';

import QuotationsHeader from '../components/quotations/QuotationsHeader';
import QuotationsStats from '../components/quotations/QuotationsStats';
import QuotationsToolbar from '../components/quotations/QuotationsToolbar';
import QuotationsGrid from '../components/quotations/QuotationsGrid';
import QuotationModal from '../components/quotations/QuotationModal';
import ConfirmModal from '../components/ui/ConfirmModal';

const Quotations: React.FC = () => {
  const { success, error: showError } = useToast();
  const qHook = useQuotations();
  
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const deleteQuotation = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'حذف عرض السعر',
      message: 'هل أنت متأكد من حذف عرض السعر هذا؟ لا يمكن التراجع عن هذا الإجراء.',
      onConfirm: async () => {
        try {
          await db.quotations.delete(id);
          success('تم حذف عرض السعر بنجاح');
        } catch (e) {
          showError('فشل حذف عرض السعر');
        }
        setConfirmConfig(null);
      }
    });
  };

  const convertToOrder = (quote: Quotation) => {
    setConfirmConfig({
      isOpen: true,
      title: 'تحويل إلى فاتورة بيع',
      message: 'هل أنت متأكد من تحويل هذا العرض إلى فاتورة بيع نهائية؟ سيتم خصم الكميات من المخزون فوراً وتسجيل المبيعات محاسبياً.',
      onConfirm: async () => {
        setConfirmConfig(null);
        try {
          await (db as any).transaction('rw', db.orders, db.quotations, db.products, db.inventory, db.customers, db.logs, db.shifts, db.journalEntries, db.accounts, async () => {
            // 1. Create Order
            const orderId = await db.orders.add({
              date: new Date(),
              items: quote.items,
              subtotalAmount: quote.subtotalAmount,
              totalAmount: quote.totalAmount,
              discountAmount: quote.discountAmount,
              taxAmount: quote.taxAmount,
              paymentMethod: 'cash',
              status: 'completed',
              customerId: quote.customerId,
              note: `تحويل من عرض سعر #${quote.id}. ${quote.notes || ''}`,
              cashierName: quote.createdBy,
              fulfillmentStatus: 'served',
              orderType: 'takeaway'
            });

            // 2. Update Status
            await db.quotations.update(quote.id!, { status: 'converted' });

            // 3. Deduct Stock & Calculate COGS
            let totalCogs = 0;
            const mainWh = await db.warehouses.where('isMain').equals(1).first();
            for (const item of quote.items) {
              const prod = await db.products.get(item.productId);
              if (prod) {
                await db.products.update(item.productId, { stock: prod.stock - item.quantity });
                totalCogs += (prod.costPrice || 0) * item.quantity;
              }
              if (mainWh) {
                const inv = await db.inventory.where({ warehouseId: mainWh.id, productId: item.productId }).first();
                if (inv) await db.inventory.update(inv.id!, { quantity: inv.quantity - item.quantity });
              }
            }

            // 4. Update Customer Spending
            if (quote.customerId) {
              const cust = await db.customers.get(quote.customerId);
              if (cust) await db.customers.update(quote.customerId, { totalSpent: (cust.totalSpent || 0) + quote.totalAmount });
            }
            
            // 5. Update Shift (Cash Sale)
            const openShift = await db.shifts.where('status').equals('open').first();
            if (openShift) {
              await db.shifts.update(openShift.id!, {
                expectedCash: openShift.expectedCash + quote.totalAmount,
                cashSales: openShift.cashSales + quote.totalAmount
              });
            }
            
            // 6. Accounting Journal Entry
            try {
              const cashAccount = await db.accounts.where('code').equals('1010').first();
              const revenueAccount = await db.accounts.where('code').equals('4010').first();
              const cogsAccount = await db.accounts.where('code').equals('5010').first();
              const inventoryAccount = await db.accounts.where('code').equals('1040').first();
              
              if (cashAccount && revenueAccount) {
                const lines = [];
                lines.push({ accountId: cashAccount.id!, accountName: cashAccount.name, debit: quote.totalAmount, credit: 0, description: `مبيعات نقدية لعرض #${quote.id}` });
                lines.push({ accountId: revenueAccount.id!, accountName: revenueAccount.name, debit: 0, credit: quote.totalAmount, description: `إيرادات مبيعات - فاتورة #${orderId}` });
                
                if (totalCogs > 0 && cogsAccount && inventoryAccount) {
                  lines.push({ accountId: cogsAccount.id!, accountName: cogsAccount.name, debit: totalCogs, credit: 0, description: `تكلفة البضاعة المباعة` });
                  lines.push({ accountId: inventoryAccount.id!, accountName: inventoryAccount.name, debit: 0, credit: totalCogs, description: `صرف مخزون` });
                }
                
                await AccountingEngine.postEntry({
                  date: new Date(),
                  reference: `SALE-${orderId}`,
                  description: `مبيعات من عرض سعر رقم #${quote.id}`,
                  lines: lines,
                });
              }
            } catch (err) {
              console.error("Failed to post automatic journal entry for converted quotation:", err);
            }
            
            await logActivity('sale', `تحويل عرض سعر #${quote.id} لبيع`, '', quote.totalAmount);
          });
          success('تم تحويل عرض السعر إلى فاتورة بيع بنجاح، وتحديث الحسابات والمخزون!');
        } catch (e) {
          console.error(e);
          showError('فشل تحويل عرض السعر');
        }
      }
    });
  };

  const printQuote = (quote: Quotation) => {
    const printWindow = window.open('', '', 'width=900,height=1200');
    if (!printWindow) return;

    const itemsRows = quote.items.map((item, idx) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px;">${idx + 1}</td>
        <td style="padding: 10px;">${item.name}</td>
        <td style="padding: 10px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; text-align: left;">${item.price.toLocaleString()}</td>
        <td style="padding: 10px; text-align: left; font-weight: bold;">${(item.quantity * item.price).toLocaleString()}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>عرض سعر #${quote.id}</title>
          <style>
            body { font-family: 'Tahoma', sans-serif; padding: 40px; color: #333; max-width: 210mm; margin: auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
            .company-info h1 { margin: 0; color: #1e1b4b; }
            .quote-title { font-size: 24px; font-weight: bold; color: #6366f1; text-transform: uppercase; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .box { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .box h3 { margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-transform: uppercase; }
            .box p { margin: 0; font-weight: bold; font-size: 16px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background-color: #1e1b4b; color: white; padding: 12px; text-align: right; }
            .totals { display: flex; justify-content: flex-end; }
            .totals-box { width: 300px; }
            .totals-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .totals-row.final { font-size: 18px; font-weight: bold; border-top: 2px solid #333; border-bottom: none; margin-top: 10px; padding-top: 10px; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #eee; padding-top: 20px; }
            .logo { max-height: 80px; max-width: 150px; object-fit: contain; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              ${qHook.settings?.logo ? `<img src="${qHook.settings.logo}" class="logo" />` : `<h1>${qHook.settings?.storeName || 'Nima POS'}</h1>`}
              <p>${qHook.settings?.address || ''}</p>
              <p dir="ltr">${qHook.settings?.phone || ''}</p>
            </div>
            <div style="text-align: left;">
              <div class="quote-title">عرض سعر</div>
              <div class="quote-title" style="font-size: 16px; color: #64748b;">QUOTATION</div>
              <p><strong>رقم العرض:</strong> #${quote.id}</p>
              <p><strong>التاريخ:</strong> ${new Date(quote.date).toLocaleDateString()}</p>
              <p><strong>تاريخ الانتهاء:</strong> ${quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString() : '-'}</p>
            </div>
          </div>

          <div class="info-grid">
            <div class="box">
              <h3>بيانات العميل</h3>
              <p>${quote.customerName}</p>
            </div>
            <div class="box">
              <h3>الحالة</h3>
              <p>${quote.status === 'pending' ? 'قيد الانتظار' : quote.status === 'accepted' ? 'مقبول' : quote.status === 'converted' ? 'تم البيع' : 'مرفوض'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>الوصف</th>
                <th style="width: 80px; text-align: center;">الكمية</th>
                <th style="width: 120px; text-align: left;">سعر الوحدة</th>
                <th style="width: 120px; text-align: left;">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals">
            <div class="totals-box">
              <div class="totals-row">
                <span>المجموع الفرعي:</span>
                <span>${quote.subtotalAmount.toLocaleString()}</span>
              </div>
              ${quote.discountAmount ? `
              <div class="totals-row" style="color: red;">
                <span>الخصم:</span>
                <span>${quote.discountAmount.toLocaleString()}-</span>
              </div>` : ''}
              ${quote.taxAmount ? `
              <div class="totals-row">
                <span>الضريبة:</span>
                <span>${quote.taxAmount.toLocaleString()}</span>
              </div>` : ''}
              <div class="totals-row final">
                <span>الإجمالي النهائي:</span>
                <span>${new Intl.NumberFormat('ar-IQ', { style: 'currency', currency: qHook.settings?.currencyCode || 'IQD' }).format(quote.totalAmount)}</span>
              </div>
            </div>
          </div>

          ${quote.notes ? `
          <div style="margin-top: 40px; padding: 20px; background: #fefce8; border: 1px solid #fef9c3; border-radius: 8px;">
            <h3 style="margin: 0 0 5px 0; font-size: 14px; color: #854d0e;">ملاحظات / شروط:</h3>
            <p style="margin: 0; font-size: 13px; color: #333;">${quote.notes}</p>
          </div>` : ''}

          <div class="footer">
            <p>تم إصدار هذا العرض إلكترونياً</p>
            <p>شكراً لاهتمامكم بمنتجاتنا وخدماتنا</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getStatusConfig = (status: string, expiry?: Date) => {
    const isExpired = expiry && new Date(expiry) < new Date() && status === 'pending';
    if (isExpired) return { label: 'منتهي', color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle };

    switch(status) {
      case 'pending': return { label: 'انتظار', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock };
      case 'accepted': return { label: 'مقبول', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 };
      case 'rejected': return { label: 'مرفوض', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle };
      case 'converted': return { label: 'تم البيع', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FileBadge };
      default: return { label: status, color: 'bg-gray-100', icon: AlertCircle };
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gradient-to-tr from-sky-50/60 via-indigo-50/40 via-slate-50 to-pink-50/40 font-['Tajawal'] min-h-screen rounded-2xl" dir="rtl">
      
      <QuotationsHeader onOpenModal={() => qHook.openModal()} />

      <QuotationsStats stats={qHook.stats} formatCurrency={qHook.formatCurrency} />

      <QuotationsToolbar 
        activeStatusFilter={qHook.activeStatusFilter}
        setActiveStatusFilter={qHook.setActiveStatusFilter}
        searchTerm={qHook.searchTerm}
        setSearchTerm={qHook.setSearchTerm}
        dateRange={qHook.dateRange}
        setDateRange={qHook.setDateRange}
        onExport={qHook.handleExportCSV}
      />

      <QuotationsGrid 
        quotations={qHook.filteredQuotations}
        getStatusConfig={getStatusConfig}
        formatCurrency={qHook.formatCurrency}
        printQuote={printQuote}
        openModal={qHook.openModal}
        convertToOrder={convertToOrder}
        sendWhatsApp={qHook.sendWhatsApp}
        handleDuplicate={qHook.handleDuplicate}
        deleteQuotation={deleteQuotation}
        updateStatus={qHook.updateStatus}
      />

      <QuotationModal 
        isOpen={qHook.isModalOpen}
        closeModal={qHook.closeModal}
        editingId={qHook.editingId}
        formCustomerName={qHook.formCustomerName}
        setFormCustomerName={qHook.setFormCustomerName}
        formCustomerId={qHook.formCustomerId}
        setFormCustomerId={qHook.setFormCustomerId}
        customers={qHook.customers || []}
        formDate={qHook.formDate}
        setFormDate={qHook.setFormDate}
        formExpiryDate={qHook.formExpiryDate}
        setFormExpiryDate={qHook.setFormExpiryDate}
        productSearch={qHook.productSearch}
        setProductSearch={qHook.setProductSearch}
        filteredProducts={qHook.filteredProducts || []}
        addProductToForm={qHook.addProductToForm}
        addCustomItemToForm={qHook.addCustomItemToForm}
        formItems={qHook.formItems}
        updateItem={qHook.updateItem}
        removeItem={qHook.removeItem}
        termsTemplates={qHook.termsTemplates}
        formNotes={qHook.formNotes}
        setFormNotes={qHook.setFormNotes}
        formTotals={qHook.formTotals}
        formatCurrency={qHook.formatCurrency}
        formDiscount={qHook.formDiscount}
        setFormDiscount={qHook.setFormDiscount}
        formTaxRate={qHook.formTaxRate}
        setFormTaxRate={qHook.setFormTaxRate}
        handleSaveQuotation={qHook.handleSaveQuotation}
      />

      {confirmConfig && (
        <ConfirmModal
          isOpen={confirmConfig.isOpen}
          title={confirmConfig.title}
          message={confirmConfig.message}
          onConfirm={confirmConfig.onConfirm}
          onCancel={() => setConfirmConfig(null)}
          confirmText="تأكيد ومتابعة"
          cancelText="إلغاء"
        />
      )}
    </div>
  );
};

export default Quotations;
