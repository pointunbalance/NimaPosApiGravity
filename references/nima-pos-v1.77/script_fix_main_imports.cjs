const fs = require('fs');

const fixImports = (file, matchStr) => {
    let data = fs.readFileSync(file, 'utf8');
    const lines = data.split('\n');
    let impBlock = lines.findIndex(l => l.includes(matchStr));
    if (impBlock !== -1) {
        let impStr = lines[impBlock];
        // if there's two imports in the string, they might be split by \n
        // but we just splice the matched line... wait, I injected a string with '\n'
        // so it might be 2 lines.
        // Let's just find "from '../../components/school" and extract them.
        
        let toRemove = [];
        let extracted = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes("from '../../components/school")) {
                extracted.push(lines[i]);
                toRemove.push(i);
            }
        }
        
        for (let i = toRemove.length - 1; i >= 0; i--) {
            lines.splice(toRemove[i], 1);
        }
        
        let lastImport = 0;
        for (let i = lines.length - 1; i >= 0; i--) {
            if (lines[i].startsWith('import ')) {
                lastImport = i;
                break;
            }
        }
        
        lines.splice(lastImport + 1, 0, ...extracted);
        fs.writeFileSync(file, lines.join('\n'));
        console.log('Fixed imports in', file);
    }
}

const files = [
  'pages/school/SchoolTrips.tsx',
  'pages/school/SchoolAdmissions.tsx',
  'pages/school/SchoolMeals.tsx',
  'pages/school/SchoolAcademicYear.tsx',
  'pages/school/SchoolStaff.tsx',
  'pages/school/SchoolDiscounts.tsx'
];

for (let f of files) fixImports(f, "from '../../components/school");
