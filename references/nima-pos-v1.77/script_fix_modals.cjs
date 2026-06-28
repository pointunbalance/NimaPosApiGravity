const fs = require('fs');
const glob = require('glob'); // wait, glob might not be available. I'll read dir manually or use an array of paths

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
  let code = fs.readFileSync(p, 'utf8');

  // Let's replace any lingering closing braces of the sort "   )}" or ")}" or "  )} "
  // basically before </>, wait, the error says:
  // "Unexpected token. Did you mean `{'}'}` or `&rbrace;`?"
  // JSX fragment has no corresponding closing tag.
  
  // Actually, I put <> at the start using replace(), but maybe I replaced too little or too much.
  // Instead of doing complicated regex, I can parse it or just replace <> and </> to be standard DIVs or fragments.

  // Let's just fix it by string replacement:
  code = code.replace(/<>\n\s*/, '<>\n');
  
  const lines = code.split('\n');
  
  // replace <> with <React.Fragment> just in case, wait no.
  // The problem is that the original code had:
  //      {isCreateModalOpen && (
  //         <div ...
  //      )}
  // I replaced `{cond && (` with `<>`
  // and `)}` with `</>`
  
  // Let's look at what the file ends with
  let out = [];
  let openFound = false;
  
  for (let i = 0; i < lines.length; i++) {
    let l = lines[i];
    // if I see <> I note open
    // if I see `)}`` at the end of the file, I change it to `</>`
    if (l.trim() === ')}' && i > lines.length - 5) {
       l = l.replace(')}', '</>');
    }
    // Also `)}` might be `) }` or just `)` and `}`
    out.push(l);
  }
  
  // force close
  let newCode = out.join('\n');
  // cleanup extra ) } before </>
  newCode = newCode.replace(/\s*\)\}\s*<\/>/, '\n</>');
  newCode = newCode.replace(/\s*\)\s*\}\s*<\/>/, '\n</>');

  fs.writeFileSync(p, newCode);
}
console.log('done regex');
