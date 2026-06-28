const fs = require('fs');

const fixImports = (p, impName) => {
    let lines = fs.readFileSync(p, 'utf8').split('\n');
    let impBlock = lines.findIndex(l => l.includes(impName));
    if (impBlock !== -1) {
        let impStr = lines[impBlock];
        lines.splice(impBlock, 1);
        
        let lastImport = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import ')) {
                lastImport = i;
            }
        }
        lines.splice(lastImport + 1, 0, impStr);
        fs.writeFileSync(p, lines.join('\n'));
    }
}

fixImports('pages/school/SchoolBehavior.tsx', 'import { SchoolBehaviorCreateModal');
fixImports('pages/school/SchoolSecurePickup.tsx', 'import { SchoolPickupModal');
fixImports('pages/school/SchoolSecurePickup.tsx', 'import { SchoolManageAuthModal');
fixImports('pages/school/SchoolWithdrawals.tsx', 'import { SchoolWithdrawalModal');

console.log('done fixing imports');
