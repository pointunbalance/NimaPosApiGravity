const fs = require('fs');
let s;

// Pickup
s = fs.readFileSync('pages/school/SchoolSecurePickup.tsx', 'utf8');
s = s.replace(/selectedStudent={selectedStudent}/g, 'selectedStudent={selectedStudent} pin={pin} setPin={setPin}');
fs.writeFileSync('pages/school/SchoolSecurePickup.tsx', s);

// AcademicYear promote
s = fs.readFileSync('pages/school/SchoolAcademicYear.tsx', 'utf8');
s = s.replace(/handlePromote={handlePromoteStudents}/g, 'handlePromote={handlePromote}');
fs.writeFileSync('pages/school/SchoolAcademicYear.tsx', s);

// Behavior
s = fs.readFileSync('pages/school/SchoolBehavior.tsx', 'utf8');
s = s.replace(/classes={classes}/g, 'classes={classesList}');
fs.writeFileSync('pages/school/SchoolBehavior.tsx', s);

// Students
s = fs.readFileSync('pages/school/Students.tsx', 'utf8');
s = s.replace(/handleSave=\{handleSave\}/g, 'handleSaveStudent={handleSaveStudent}');
s = s.replace(/formData=\{formData\}/g, 'studentFormData={studentFormData}');
s = s.replace(/setFormData=\{setFormData\}/g, 'setStudentFormData={setStudentFormData}');
s = s.replace(/classes=\{classes\}/g, 'filteredClassesForSelect={filteredClassesForSelect}');
s = s.replace(/parents=\{parents\}/g, '');
s = s.replace(/guardians=\{guardians\}/g, 'guardians={guardians} parents={parents}'); 
fs.writeFileSync('pages/school/Students.tsx', s);

// Staff - replace salary and yearJoined back to their right types
s = fs.readFileSync('pages/school/SchoolStaff.tsx', 'utf8');
s = s.replace(/salary:/g, 'baseSalary:');
s = s.replace(/yearJoined:/g, ''); // ignore
fs.writeFileSync('pages/school/SchoolStaff.tsx', s);

s = fs.readFileSync('pages/school/Transport.tsx', 'utf8');
s = s.replace(/handleSave=\{handleSave\}/g, 'handleSaveTrip={handleSaveTrip}');
fs.writeFileSync('pages/school/Transport.tsx', s);

console.log('Fixed extra props 2');
