const fs = require('fs');

const file = 'pages/school/SchoolSecurePickup.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const m1Start = lines.findIndex(l => l.includes('isPickupModalOpen && selectedStudent && ('));
const m2Start = lines.findIndex(l => l.includes('isManageAuthModalOpen && selectedStudent && ('));
const end1 = m2Start - 1; // It probably ends right before m2Start starts
console.log('m1Start:', m1Start);
console.log('m2Start:', m2Start);

let m2End = m2Start;
while (m2End < lines.length) {
    if (lines[m2End].match(/^  \);/)) {
        break;
    }
    m2End++;
}

console.log('m2End around:', m2End);
