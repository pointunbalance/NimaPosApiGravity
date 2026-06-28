const fs = require('fs');

const file = 'pages/school/SchoolAcademicYear.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const createScript = (name, propsStr, start, end, condStr, extras = '') => {
   return `import React from 'react';
import { X, Calendar, Edit2, Archive, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
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

const m1Start = lines.findIndex(l => l.includes('{isModalOpen && ('));
const m2Start = lines.findIndex(l => l.includes('{isPromoteModalOpen && ('));

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

const c1 = createScript('SchoolAcademicYearModal',
`isModalOpen: boolean;
setIsModalOpen: (val: boolean) => void;
handleSubmit: (e: any) => void;
formData: any;
setFormData: (val: any) => void;
isEdit: boolean;`, m1Start, m1End + 1, 'isModalOpen');

const c2 = createScript('SchoolPromoteModal',
`isPromoteModalOpen: boolean;
setIsPromoteModalOpen: (val: boolean) => void;
handlePromote: () => void;`, m2Start, m2End + 1, 'isPromoteModalOpen');

fs.mkdirSync('components/school/academicyear', { recursive: true });
fs.writeFileSync('components/school/academicyear/SchoolAcademicYearModal.tsx', c1);
fs.writeFileSync('components/school/academicyear/SchoolPromoteModal.tsx', c2);

lines.splice(m2Start, m2End - m2Start + 1,
`            <SchoolPromoteModal isPromoteModalOpen={isPromoteModalOpen} setIsPromoteModalOpen={setIsPromoteModalOpen} handlePromote={handlePromote} />`);
lines.splice(m1Start, m1End - m1Start + 1, 
`            <SchoolAcademicYearModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} handleSubmit={handleSubmit} formData={formData} setFormData={setFormData} isEdit={isEdit} />`);

const imp = `import { SchoolAcademicYearModal } from '../../components/school/academicyear/SchoolAcademicYearModal';
import { SchoolPromoteModal } from '../../components/school/academicyear/SchoolPromoteModal';\n`;

lines.splice(2, 0, imp);
fs.writeFileSync(file, lines.join('\n'));

console.log('done extracting AcademicYear modal');
