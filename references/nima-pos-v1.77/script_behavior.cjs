const fs = require('fs');

const file = 'pages/school/SchoolBehavior.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const createModalStart = lines.findIndex(l => l.includes('{isCreateModalOpen && ('));
const fileEnd = lines.length;

console.log('createModalStart:', createModalStart);
// Just find the matching closing braces
let scriptOut = [];
let idx = createModalStart;
while (idx < lines.length) {
    if (lines[idx].match(/^  \);/)) {
        break;
    }
    scriptOut.push(lines[idx]);
    idx++;
}
console.log('End of modal found around index:', idx);
