const fs = require('fs');

const paths = [
  'components/school/staff/SchoolStaffModal.tsx',
  'components/school/academicyear/SchoolAcademicYearModal.tsx',
  'components/school/academicyear/SchoolPromoteModal.tsx',
  'components/school/discounts/SchoolDiscountModal.tsx',
  'components/school/admissions/SchoolAdmissionCreateModal.tsx',
  'components/school/admissions/SchoolAdmissionFollowupModal.tsx',
  'components/school/trips/SchoolTripModal.tsx',
  'components/school/meals/SchoolMealScheduleModal.tsx',
  'components/school/meals/SchoolMealRestrictionModal.tsx'
];

for (const p of paths) {
  if (!fs.existsSync(p)) continue;
  let lines = fs.readFileSync(p, 'utf8').split('\n');
  
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === ')}') {
       lines[i] = lines[i].replace(')}', '</>');
       break;
    }
  }

  fs.writeFileSync(p, lines.join('\n'));
}

console.log('done fixing modals syntax');
