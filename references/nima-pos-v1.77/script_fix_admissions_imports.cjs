const fs = require('fs');

let s = fs.readFileSync('pages/school/SchoolAdmissions.tsx', 'utf8');
if (!s.includes('import { SchoolAdmissionCreateModal }')) {
    s = `import { SchoolAdmissionCreateModal } from '../../components/school/admissions/SchoolAdmissionCreateModal';\nimport { SchoolAdmissionFollowupModal } from '../../components/school/admissions/SchoolAdmissionFollowupModal';\n` + s;
}

fs.writeFileSync('pages/school/SchoolAdmissions.tsx', s);
console.log('Fixed imports for admissions');
