const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.ts');
let content = fs.readFileSync(dbPath, 'utf8');

// Increment version
content = content.replace(/\.version\(74\)/g, '.version(75)');

// Add new tables to stores definition
const newStores = `
        schoolFees: "++id, studentId, amount, date, status",
        schoolTimetable: "++id, classId, subject, teacherId, day, time",
        schoolTransport: "++id, busNumber, driverId, route, status",
        schoolLibrary: "++id, title, author, isbn, status",
        garageSpareParts: "++id, name, partNumber, price, stock",
        garageInvoices: "++id, customerId, date, amount, status",
        garageAppointments: "++id, customerId, vehicleId, date, status",
        gymEquipment: "++id, name, type, status, lastMaintenance",
        gymStoreItems: "++id, name, price, stock",
        gymAccessLogs: "++id, memberId, timestamp, type",
        hotelBilling: "++id, reservationId, amount, date, status",
        hotelDiningOrders: "++id, roomNumber, amount, date, status",
        hotelServicesList: "++id, name, price, type, status",
`;

content = content.replace(/medicalRecords:\s*"[^"]+"\s*\}\)/, 'medicalRecords: "++id, customerId, doctorId, date",' + newStores + '\n      })');

// Also add Table properties to NimaDatabase class
const newProps = `
  schoolFees!: Table<any, number>;
  schoolTimetable!: Table<any, number>;
  schoolTransport!: Table<any, number>;
  schoolLibrary!: Table<any, number>;
  garageSpareParts!: Table<any, number>;
  garageInvoices!: Table<any, number>;
  garageAppointments!: Table<any, number>;
  gymEquipment!: Table<any, number>;
  gymStoreItems!: Table<any, number>;
  gymAccessLogs!: Table<any, number>;
  hotelBilling!: Table<any, number>;
  hotelDiningOrders!: Table<any, number>;
  hotelServicesList!: Table<any, number>;
`;

content = content.replace(/medicalRecords!:\s*Table<MedicalRecord,\s*number>;/, 'medicalRecords!: Table<MedicalRecord, number>;\n' + newProps);

fs.writeFileSync(dbPath, content);
console.log('Successfully updated db.ts');
