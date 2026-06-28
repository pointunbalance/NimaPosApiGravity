const fs = require('fs');

let s = fs.readFileSync('pages/school/Grades.tsx', 'utf8');
s = s.replace(/import \{.*?} from '\.\.\/\.\.\/components\/school\/grades\/.*';\n/g, '');
s = s.replace(/<School[A-Za-z]+Modal .*?\/>/gs, '');
fs.writeFileSync('pages/school/Grades.tsx', s);

s = fs.readFileSync('pages/school/SchoolWithdrawals.tsx', 'utf8');
s = s.replace(/import \{.*?} from '\.\.\/\.\.\/components\/school\/withdrawals\/.*';\n/g, '');
s = s.replace(/<School[A-Za-z]+Modal .*?\/>/gs, '');
fs.writeFileSync('pages/school/SchoolWithdrawals.tsx', s);

s = fs.readFileSync('pages/school/SchoolAcademicYear.tsx', 'utf8');
s = s.replace(/handlePromote=\{handlePromote\}/g, 'handlePromote={handlePromoteStudents}');
fs.writeFileSync('pages/school/SchoolAcademicYear.tsx', s);

s = fs.readFileSync('pages/school/SchoolBehavior.tsx', 'utf8');
s = s.replace(/<SchoolBehaviorCreateModal.*?\/>/gs, '');
s = s.replace(/classesList/g, 'classes');
fs.writeFileSync('pages/school/SchoolBehavior.tsx', s);

s = fs.readFileSync('pages/school/SchoolSecurePickup.tsx', 'utf8');
s = s.replace(/<School[A-Za-z]+Modal.*?\/>/gs, '');
fs.writeFileSync('pages/school/SchoolSecurePickup.tsx', s);

s = fs.readFileSync('pages/school/SchoolStaff.tsx', 'utf8');
s = s.replace(/salary: /g, 'baseSalary: ');
s = s.replace(/yearJoined:/g, ''); // avoid breaking types
s = s.replace(/formData\.yearJoined/g, '(formData as any).yearJoined');
fs.writeFileSync('pages/school/SchoolStaff.tsx', s);

s = fs.readFileSync('pages/school/SchoolTrips.tsx', 'utf8');
s = s.replace(/cost: /g, 'childCost: ');
s = s.replace(/capacity:/g, '// capacity');
s = s.replace(/supervisorId:/g, 'supervisorIds:');
s = s.replace(/supervisors\}/g, 'supervisorIds}');
s = s.replace(/supervisors\.map/g, 'supervisorIds.map');
fs.writeFileSync('pages/school/SchoolTrips.tsx', s);

console.log('Fixed final leftovers');
