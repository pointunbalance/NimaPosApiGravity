const fs = require('fs');

const file = 'pages/school/SchoolStaff.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const mStart = lines.findIndex(l => l.includes('{isModalOpen && ('));

let mEnd = mStart;
while (mEnd < lines.length) {
    if (lines[mEnd].match(/^  \);/)) {
        break;
    }
    mEnd++;
}

console.log('mStart:', mStart);
console.log('mEnd:', mEnd);

const mCode = `import React from 'react';
import { X, Save, UserPlus, FileText, CheckCircle2 } from 'lucide-react';

interface SchoolStaffModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (val: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (val: any) => void;
  isEdit: boolean;
}

export const SchoolStaffModal: React.FC<SchoolStaffModalProps> = ({
  isModalOpen, setIsModalOpen, handleSubmit, formData, setFormData, isEdit
}) => {
  if (!isModalOpen) return null;
  return (
` + lines.slice(mStart, mEnd + 1).join('\n').replace('{isModalOpen && (', '<>').replace(/^\s*\)\}\s*$/, '</>') + `
  );
};
`;

fs.mkdirSync('components/school/staff', { recursive: true });
fs.writeFileSync('components/school/staff/SchoolStaffModal.tsx', mCode);

lines.splice(mStart, mEnd - mStart + 1, 
`            <SchoolStaffModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} handleSubmit={handleSubmit} formData={formData} setFormData={setFormData} isEdit={isEdit} />`);

const imp = `import { SchoolStaffModal } from '../../components/school/staff/SchoolStaffModal';\n`;
lines.splice(2, 0, imp);

fs.writeFileSync(file, lines.join('\n'));

console.log('done extracting Staff modal');
