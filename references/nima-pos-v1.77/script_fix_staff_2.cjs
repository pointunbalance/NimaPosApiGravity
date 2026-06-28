const fs = require('fs');
let s = fs.readFileSync('pages/school/SchoolStaff.tsx', 'utf8');
s = s.replace(/\{\.\.\.formData,\s*Number\(e\.target\.value\)\}/g, '{...formData, yearJoined: Number(e.target.value)}');
fs.writeFileSync('pages/school/SchoolStaff.tsx', s);
console.log('Fixed yearJoined');
