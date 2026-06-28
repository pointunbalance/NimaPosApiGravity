const fs = require('fs');

let s = fs.readFileSync('pages/school/SchoolStaff.tsx', 'utf8');
s = s.replace(/\{\.\.\.formData,\s*Number\(e\.target\.value\)\}/g, '{...formData, yearJoined: Number(e.target.value)}');
fs.writeFileSync('pages/school/SchoolStaff.tsx', s);

s = fs.readFileSync('pages/school/SchoolTrips.tsx', 'utf8');
s = s.replace(/\{\.\.\.formData,\s*\/\/ capacity Number\(e\.target\.value\)\}/g, '{...formData, capacity: Number(e.target.value)}');
s = s.replace(/formData\.capacity/g, '(formData as any).capacity');
fs.writeFileSync('pages/school/SchoolTrips.tsx', s);

console.log('Fixed final leftovers');
