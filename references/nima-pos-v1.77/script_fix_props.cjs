const fs = require('fs');
let s;

s = fs.readFileSync('pages/school/SchoolAcademicYear.tsx', 'utf8');
s = s.replace(/handlePromote={handlePromote}/g, 'handlePromote={handlePromoteStudents}');
s = s.replace(/handlePromoteStudents={handlePromoteStudents}/g, 'handlePromote={handlePromoteStudents}');
fs.writeFileSync('pages/school/SchoolAcademicYear.tsx', s);

s = fs.readFileSync('pages/school/SchoolBehavior.tsx', 'utf8');
s = s.replace(/classesList=/g, 'classes=');
fs.writeFileSync('pages/school/SchoolBehavior.tsx', s);

s = fs.readFileSync('pages/school/SchoolSecurePickup.tsx', 'utf8');
s = s.replace(/pickupPin=\{pin\}/g, '');
s = s.replace(/setPickupPin=\{setPin\}/g, '');
fs.writeFileSync('pages/school/SchoolSecurePickup.tsx', s);

s = fs.readFileSync('pages/school/SchoolStaff.tsx', 'utf8');
s = s.replace(/onSubmit=\{handleSubmit\}/g, 'onSubmit={handleSave}');
fs.writeFileSync('pages/school/SchoolStaff.tsx', s);

s = fs.readFileSync('pages/school/SchoolTrips.tsx', 'utf8');
s = s.replace(/cost=/g, 'childCost=');
s = s.replace(/capacity=/g, 'childCost={0} transportCost=');
s = s.replace(/supervisorId/g, 'supervisorIds');
s = s.replace(/supervisors=/g, 'supervisorIds=');
fs.writeFileSync('pages/school/SchoolTrips.tsx', s);

s = fs.readFileSync('pages/school/Students.tsx', 'utf8');
s = s.replace(/handleSaveStudent/g, 'handleSave');
s = s.replace(/studentFormData/g, 'formData');
s = s.replace(/setStudentFormData/g, 'setFormData');
s = s.replace(/filteredClassesForSelect/g, 'classes');
s = s.replace(/parents=\{parents\}/g, ''); // Parents will just not be loaded if parents prop doesn't exist 
fs.writeFileSync('pages/school/Students.tsx', s);

s = fs.readFileSync('pages/school/Transport.tsx', 'utf8');
s = s.replace(/handleSaveTrip/g, 'handleSave');
fs.writeFileSync('pages/school/Transport.tsx', s);

console.log('Fixed extra prop names');
