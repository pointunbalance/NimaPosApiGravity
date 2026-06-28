const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.ts');
let content = fs.readFileSync(dbPath, 'utf8');

// Increment version
content = content.replace(/\.version\(75\)/g, '.version(76)');

// Add new tables to stores definition
const newStores = `
        schoolStudents: "++id, name, grade, parentPhone, status",
        schoolTeachers: "++id, name, subject, phone, status",
        schoolClassesList: "++id, name, grade, capacity, teacherId",
        schoolAttendanceList: "++id, studentId, date, status",
        schoolGradesList: "++id, studentId, subject, score, term",
        garageJobsList: "++id, vehicleId, description, status, estimatedCost",
        garageVehiclesList: "++id, plateNumber, make, model, customerId",
        garageTechniciansList: "++id, name, specialization, phone, status",
        gymMembershipsList: "++id, memberId, plan, startDate, endDate, status",
        gymClassesList: "++id, name, trainerId, schedule, capacity",
        gymTrainersList: "++id, name, specialization, phone, status",
        hotelReservations: "++id, customerName, roomNumber, checkIn, checkOut, status",
        hotelRoomsList: "++id, roomNumber, type, capacity, status",
        hotelHousekeepingList: "++id, roomNumber, task, assignedTo, status",
        supplierEvaluations: "++id, supplierId, date, score, notes",
`;

content = content.replace(/medicalRecords:\s*"[^"]+"\s*,\s*\w+:\s*"[^"]+".*\n      \}\)/s, (match) => {
   return match.replace(/      \}\)/, newStores + '\n      })');
});

// Also add Table properties to NimaDatabase class
const newProps = `
  schoolStudents!: Table<any, number>;
  schoolTeachers!: Table<any, number>;
  schoolClassesList!: Table<any, number>;
  schoolAttendanceList!: Table<any, number>;
  schoolGradesList!: Table<any, number>;
  garageJobsList!: Table<any, number>;
  garageVehiclesList!: Table<any, number>;
  garageTechniciansList!: Table<any, number>;
  gymMembershipsList!: Table<any, number>;
  gymClassesList!: Table<any, number>;
  gymTrainersList!: Table<any, number>;
  hotelReservations!: Table<any, number>;
  hotelRoomsList!: Table<any, number>;
  hotelHousekeepingList!: Table<any, number>;
  supplierEvaluations!: Table<any, number>;
`;

content = content.replace(/hotelServicesList!:\s*Table<any,\s*number>;/, 'hotelServicesList!: Table<any, number>;\n' + newProps);

fs.writeFileSync(dbPath, content);
console.log('Successfully updated db.ts for phase 2');
