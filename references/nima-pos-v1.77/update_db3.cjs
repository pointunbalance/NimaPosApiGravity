const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.ts');
let content = fs.readFileSync(dbPath, 'utf8');

// Increment version
content = content.replace(/\.version\(\d+\)/g, '.version(77)');

// Add new tables to stores definition
const newStores = `
        clinicInvoices: "++id, patientName, service, amount, date, status",
        clinicInventoryItems: "++id, itemName, category, stockAmount, expiryDate",
        clinicServicesList: "++id, name, category, price, status",
        clinicInsuranceCompanies: "++id, name, contactPerson, phone, discountRate",
`;

content = content.replace(/supplierEvaluations:\s*"[^"]+"\s*\n\s*\}\)/s, (match) => {
   return match.replace(/      \}\)/, newStores + '      })');
});

// Also add Table properties to NimaDatabase class
const newProps = `
  clinicInvoices!: Table<any, number>;
  clinicInventoryItems!: Table<any, number>;
  clinicServicesList!: Table<any, number>;
  clinicInsuranceCompanies!: Table<any, number>;
`;

content = content.replace(/supplierEvaluations!:\s*Table<any,\s*number>;/, 'supplierEvaluations!: Table<any, number>;\n' + newProps);

fs.writeFileSync(dbPath, content);
console.log('Successfully updated db.ts for phase 3');
