import fs from 'fs';
import path from 'path';

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
  
  if (content.includes('db.journalEntries.add')) {
    // We add the import at the top
    if (!content.includes("AccountingEngine")) {
      content = "import { AccountingEngine } from '../services/AccountingEngine';\n" + content;
    }
    
    // We replace db.journalEntries.add(...) with AccountingEngine.postEntry(...)
    // Then we need to strip totalAmount and status from the object passed to it.
    // Using simple regex replacement for db.journalEntries.add
    content = content.replace(/db\.journalEntries\.add\s*\(/g, "AccountingEngine.postEntry(");
    
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}
