const fs = require('fs');

const paths = [
  'components/school/behavior/SchoolBehaviorCreateModal.tsx',
  'components/school/grades/SchoolEvalModal.tsx',
  'components/school/grades/SchoolSubjectModal.tsx',
  'components/school/pickup/SchoolManageAuthModal.tsx',
  'components/school/pickup/SchoolPickupModal.tsx',
  'components/school/students/SchoolStudentModal.tsx',
  'components/school/transport/SchoolExpenseModal.tsx',
  'components/school/transport/SchoolRouteModal.tsx',
  'components/school/transport/SchoolSubModal.tsx',
  'components/school/transport/SchoolTripModal.tsx',
  'components/school/withdrawals/SchoolWithdrawalModal.tsx'
];

for (const p of paths) {
  if (!fs.existsSync(p)) continue;
  let lines = fs.readFileSync(p, 'utf8').split('\n');
  
  // We look backwards to find `)}` and replace it with `</>`
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === ')}' || lines[i].trim() === ')}') {
       lines[i] = lines[i].replace(')}', '</>');
       break;
    }
  }

  fs.writeFileSync(p, lines.join('\n'));
}

console.log('done fixing modals syntax');
