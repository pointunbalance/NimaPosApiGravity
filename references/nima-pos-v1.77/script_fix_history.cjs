const fs = require('fs');
let f = fs.readFileSync('components/school/admissions/SchoolAdmissionFollowupModal.tsx', 'utf8');
f = f.replace('className="w-6 h-6 text-indigo-500"/>', '<History className="w-6 h-6 text-indigo-500"/>');
f = f.replace('className="w-4 h-4"/>', '<History className="w-4 h-4"/>');
fs.writeFileSync('components/school/admissions/SchoolAdmissionFollowupModal.tsx', f);
