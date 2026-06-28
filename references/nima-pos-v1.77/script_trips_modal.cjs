const fs = require('fs');

const file = 'pages/school/SchoolTrips.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const createScript = (name, propsStr, start, end, condStr, extras = '') => {
   return `import React from 'react';
import { X, Map, Calendar, DollarSign, Users } from 'lucide-react';
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
let m1End = m1Start;
while (m1End < lines.length) {
    if (lines[m1End].match(/^  \);/)) {
        break;
    }
    m1End++;
}

console.log('m1Start:', m1Start, 'm1End:', m1End);

const c1 = createScript('SchoolTripModal',
`isModalOpen: boolean;
setIsModalOpen: (val: boolean) => void;
handleSubmit: (e: any) => void;
formData: any;
setFormData: (val: any) => void;
isEdit: boolean;
supervisors: any[];`, m1Start, m1End + 1, 'isModalOpen');

fs.mkdirSync('components/school/trips', { recursive: true });
fs.writeFileSync('components/school/trips/SchoolTripModal.tsx', c1);

lines.splice(m1Start, m1End - m1Start + 1, 
`            <SchoolTripModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} handleSubmit={handleSubmit} formData={formData} setFormData={setFormData} isEdit={isEdit} supervisors={supervisors} />`);

const imp = `import { SchoolTripModal } from '../../components/school/trips/SchoolTripModal';\n`;

lines.splice(2, 0, imp);
fs.writeFileSync(file, lines.join('\n'));

console.log('done extracting Trips modal');
