const fs = require('fs');

const fixDiv = (file) => {
    const data = fs.readFileSync(file, 'utf8');
    if (!data.includes('    </div>\n  );\n};')) {
        const newData = data.replace('  );\n};\n', '    </div>\n  );\n};\n');
        fs.writeFileSync(file, newData);
        console.log('Fixed', file);
    }
}

fixDiv('pages/school/SchoolSecurePickup.tsx');
fixDiv('pages/school/SchoolWithdrawals.tsx');
fixDiv('pages/school/SchoolCashier.tsx');

