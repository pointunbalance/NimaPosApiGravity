const fs = require('fs');

let s = fs.readFileSync('pages/school/SchoolStaff.tsx', 'utf8');
if (!s.includes('import { SchoolStaffDirectoryModal }')) {
    s = `import { SchoolStaffDirectoryModal } from '../../components/school/staff/SchoolStaffDirectoryModal';\nimport { SchoolStaffTransactionModal } from '../../components/school/staff/SchoolStaffTransactionModal';\n` + s;
}

fs.writeFileSync('pages/school/SchoolStaff.tsx', s);
console.log('Fixed imports for real');
