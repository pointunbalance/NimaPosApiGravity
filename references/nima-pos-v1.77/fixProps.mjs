import fs from 'fs';

const files = [
    "pages/Payroll.tsx",
    "pages/Customers.tsx",
    "pages/Quotations.tsx",
    "pages/Tailoring.tsx",
    "pages/GiftCards.tsx",
    "pages/Installments.tsx",
    "pages/Rentals.tsx",
    "pages/WorkOrders.tsx",
    "pages/B2BSales.tsx",
    "pages/Purchases.tsx",
    "pages/Suppliers.tsx",
    "pages/Maintenance.tsx",
    "pages/Loans.tsx",
    "pages/Returns.tsx",
    "pages/StockAdjustments.tsx",
    "pages/Subscriptions.tsx",
    "pages/Shifts.tsx",
    "pages/PurchaseOrders.tsx",
    "pages/EcommerceOrders.tsx"
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');

  content = content.replace(/totalAmount:\s*[^,]+,\s*/g, '');
  content = content.replace(/status:\s*['"]posted['"]\s*,?/g, '');
  
  // also handle trailing commas properly without breaking object literal if comma is missing
  // wait the regex for totalAmount matching commas at the end should be fine.  

  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
