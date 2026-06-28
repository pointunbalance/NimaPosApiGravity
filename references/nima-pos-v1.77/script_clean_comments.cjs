const fs = require('fs');

const paths = [
  'components/school/grades/SchoolSubjectModal.tsx',
  'components/school/pickup/SchoolManageAuthModal.tsx',
  'components/school/transport/SchoolRouteModal.tsx',
  'components/school/transport/SchoolSubModal.tsx',
  'components/school/transport/SchoolTripModal.tsx',
  'components/school/withdrawals/SchoolWithdrawalModal.tsx',
  'pages/school/SchoolCashier.tsx'
];

for (const p of paths) {
  if (!fs.existsSync(p)) continue;
  let code = fs.readFileSync(p, 'utf8');
  
  // replace those orphaned comments right before );
  code = code.replace(/\{\/\*.*?\*\/\}\n\s*\);/g, ');');
  
  fs.writeFileSync(p, code);
}
console.log('done removing orphaned comments');
