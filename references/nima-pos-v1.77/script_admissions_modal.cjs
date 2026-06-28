const fs = require('fs');

const file = 'pages/school/SchoolAdmissions.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const createScript = (name, propsStr, start, end, condStr, extras = '') => {
   return `import React from 'react';
import { X, UserPlus, MessageSquare, Plus } from 'lucide-react';
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
const m2Start = lines.findIndex(l => l.includes('{isFollowupModalOpen && selectedRequest && ('));

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

const c1 = createScript('SchoolAdmissionCreateModal',
`isCreateModalOpen: boolean;
setIsCreateModalOpen: (val: boolean) => void;
handleCreateRequest: (e: any) => void;
formData: any;
setFormData: (val: any) => void;
levels: any[];`, m1Start, m1End + 1, 'isCreateModalOpen');

const c2 = createScript('SchoolAdmissionFollowupModal',
`isFollowupModalOpen: boolean;
setIsFollowupModalOpen: (val: boolean) => void;
selectedRequest: any;
handleAddFollowup: (e: any) => void;
followupNote: string;
setFollowupNote: (val: string) => void;`, m2Start, m2End + 1, 'isFollowupModalOpen');

fs.mkdirSync('components/school/admissions', { recursive: true });
fs.writeFileSync('components/school/admissions/SchoolAdmissionCreateModal.tsx', c1);
fs.writeFileSync('components/school/admissions/SchoolAdmissionFollowupModal.tsx', c2);

lines.splice(m2Start, m2End - m2Start + 1,
`            <SchoolAdmissionFollowupModal isFollowupModalOpen={isFollowupModalOpen} setIsFollowupModalOpen={setIsFollowupModalOpen} selectedRequest={selectedRequest} handleAddFollowup={handleAddFollowup} followupNote={followupNote} setFollowupNote={setFollowupNote} />`);
lines.splice(m1Start, m1End - m1Start + 1, 
`            <SchoolAdmissionCreateModal isCreateModalOpen={isCreateModalOpen} setIsCreateModalOpen={setIsCreateModalOpen} handleCreateRequest={handleCreateRequest} formData={formData} setFormData={setFormData} levels={levels} />`);

const imp = `import { SchoolAdmissionCreateModal } from '../../components/school/admissions/SchoolAdmissionCreateModal';
import { SchoolAdmissionFollowupModal } from '../../components/school/admissions/SchoolAdmissionFollowupModal';\n`;

lines.splice(2, 0, imp);
fs.writeFileSync(file, lines.join('\n'));

console.log('done extracting Admissions modal');
