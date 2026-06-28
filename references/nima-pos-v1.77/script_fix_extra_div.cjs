const fs = require('fs');

const fixExtraDivAndFragment = (file) => {
    let data = fs.readFileSync(file, 'utf8');
    data = data.replace('      </>\n    </div>\n  );\n};\n', '      </>\n  );\n};\n');
    data = data.replace('      </>\n    </div>\n  );\n};', '      </>\n  );\n};');
    fs.writeFileSync(file, data);
}

fixExtraDivAndFragment('components/school/withdrawals/SchoolWithdrawalModal.tsx');
fixExtraDivAndFragment('components/school/pickup/SchoolManageAuthModal.tsx');

console.log('done fixing extra div');
