const fs = require('fs');

const file = 'pages/school/SchoolWithdrawals.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const mStart = 371;
const mEnd = 575;

const mCode = `import React from 'react';
import { X, AlertOctagon, FileMinus } from 'lucide-react';
import { SchoolStudent } from '../../types';

interface SchoolWithdrawalModalProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (val: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  students: SchoolStudent[];
}

export const SchoolWithdrawalModal: React.FC<SchoolWithdrawalModalProps> = ({
  isCreateModalOpen, setIsCreateModalOpen, handleSubmit, formData, setFormData, students
}) => {
  if (!isCreateModalOpen) return null;
  return (
` + lines.slice(mStart, mEnd + 1).join('\n').replace('{isCreateModalOpen && (', '<>').replace(/^\s*\)\}\s*$/, '</>') + `
  );
};
`;

fs.mkdirSync('components/school/withdrawals', { recursive: true });
fs.writeFileSync('components/school/withdrawals/SchoolWithdrawalModal.tsx', mCode);

lines.splice(mStart, mEnd - mStart + 1, 
`      <SchoolWithdrawalModal
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        handleSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        students={students}
      />`);

const imports = `import { SchoolWithdrawalModal } from '../../components/school/withdrawals/SchoolWithdrawalModal';\n`;
lines.splice(2, 0, imports);

fs.writeFileSync(file, lines.join('\n'));

console.log('done splitting SchoolWithdrawals');
