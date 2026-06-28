const fs = require('fs');

const file = 'pages/school/SchoolDiscounts.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const createScript = (name, propsStr, start, end, condStr, extras = '') => {
   return `import React from 'react';
import { X, Percent, AlertCircle } from 'lucide-react';
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

const m1Start = lines.findIndex(l => l.includes('{isCreateModalOpen && ('));
let m1End = m1Start;
while (m1End < lines.length) {
    if (lines[m1End].match(/^  \);/)) {
        break;
    }
    m1End++;
}

console.log('m1Start:', m1Start, 'm1End:', m1End);

const c1 = createScript('SchoolDiscountModal',
`isCreateModalOpen: boolean;
setIsCreateModalOpen: (val: boolean) => void;
handleSubmit: (e: any) => void;
formData: any;
setFormData: (val: any) => void;`, m1Start, m1End + 1, 'isCreateModalOpen');

fs.mkdirSync('components/school/discounts', { recursive: true });
fs.writeFileSync('components/school/discounts/SchoolDiscountModal.tsx', c1);

lines.splice(m1Start, m1End - m1Start + 1, 
`      <SchoolDiscountModal isCreateModalOpen={isCreateModalOpen} setIsCreateModalOpen={setIsCreateModalOpen} handleSubmit={handleSubmit} formData={formData} setFormData={setFormData} />`);

const imp = `import { SchoolDiscountModal } from '../../components/school/discounts/SchoolDiscountModal';\n`;

lines.splice(2, 0, imp);
fs.writeFileSync(file, lines.join('\n'));

console.log('done extracting Discounts modal');
