const fs = require('fs');

const file = 'pages/school/SchoolMeals.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const createScript = (name, propsStr, start, end, condStr, extras = '') => {
   return `import React from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
${extras}

interface ${name}Props {
${propsStr}
}

export const ${name}: React.FC<${name}Props> = (props) => {
   const { ${propsStr.split(/:\s*[^;\n]+;/).filter(x => x.trim()).map(x => x.trim().split('?')[0]).join(', ')} } = props;
   if (!${condStr}) return null;
   return (
` + lines.slice(start, end).join('\n').replace(new RegExp('\\{'+condStr+'(?: && [a-zA-Z0-9]+)? && \\('), '<>').replace(/^\s*\)\}\s*$/, '</>') + `
   );
};
`;
}

const m1Start = lines.findIndex(l => l.includes('{isScheduleModalOpen && ('));
const m2Start = lines.findIndex(l => l.includes('{isRestrictionModalOpen && ('));

let m1End = m2Start - 1;
while (!lines[m1End] || !lines[m1End].includes(')}')) m1End--;
let m2End = m2Start;
while (m2End < lines.length) {
    if (lines[m2End].match(/^  \);/)) {
        break;
    }
    m2End++;
}

console.log('m1Start:', m1Start, 'm1End:', m1End);
console.log('m2Start:', m2Start, 'm2End:', m2End);

const c1 = createScript('SchoolMealScheduleModal',
`isScheduleModalOpen: boolean;
setIsScheduleModalOpen: (val: boolean) => void;
handleScheduleSubmit: (e: any) => void;
scheduleFormData: any;
setScheduleFormData: (val: any) => void;
items: any[];`, m1Start, m1End + 1, 'isScheduleModalOpen');

const c2 = createScript('SchoolMealRestrictionModal',
`isRestrictionModalOpen: boolean;
setIsRestrictionModalOpen: (val: boolean) => void;
handleRestrictionSubmit: (e: any) => void;
restrictionFormData: any;
setRestrictionFormData: (val: any) => void;
students: any[];`, m2Start, m2End + 1, 'isRestrictionModalOpen');

fs.mkdirSync('components/school/meals', { recursive: true });
fs.writeFileSync('components/school/meals/SchoolMealScheduleModal.tsx', c1);
fs.writeFileSync('components/school/meals/SchoolMealRestrictionModal.tsx', c2);

lines.splice(m2Start, m2End - m2Start + 1,
`            <SchoolMealRestrictionModal isRestrictionModalOpen={isRestrictionModalOpen} setIsRestrictionModalOpen={setIsRestrictionModalOpen} handleRestrictionSubmit={handleRestrictionSubmit} restrictionFormData={restrictionFormData} setRestrictionFormData={setRestrictionFormData} students={students} />`);
lines.splice(m1Start, m1End - m1Start + 1, 
`            <SchoolMealScheduleModal isScheduleModalOpen={isScheduleModalOpen} setIsScheduleModalOpen={setIsScheduleModalOpen} handleScheduleSubmit={handleScheduleSubmit} scheduleFormData={scheduleFormData} setScheduleFormData={setScheduleFormData} items={items} />`);

const imp = `import { SchoolMealScheduleModal } from '../../components/school/meals/SchoolMealScheduleModal';
import { SchoolMealRestrictionModal } from '../../components/school/meals/SchoolMealRestrictionModal';\n`;

lines.splice(2, 0, imp);
fs.writeFileSync(file, lines.join('\n'));

console.log('done extracting Meals modal');
