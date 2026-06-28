const fs = require('fs');

const file = 'pages/school/SchoolBehavior.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const startIndexStr = 398;
const endIndexStr = 663; // up to 664 in 1-based (which is 663 in 0-based)

const sourceCode = `import React from 'react';
import { X, Brain, CheckCircle2, ChevronRight, MessageSquare, AlertTriangle, User } from 'lucide-react';
import { SchoolStudent } from '../../types';

interface SchoolBehaviorCreateModalProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (val: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  formData: any;
  setFormData: (data: any) => void;
  students: SchoolStudent[];
}

export const SchoolBehaviorCreateModal: React.FC<SchoolBehaviorCreateModalProps> = ({
  isCreateModalOpen, setIsCreateModalOpen, handleSubmit, formData, setFormData, students
}) => {
  if (!isCreateModalOpen) return null;
  return (
` + lines.slice(startIndexStr, endIndexStr + 1).join('\n').replace('{isCreateModalOpen && (', '<>').replace(/^\s*\)\}\s*$/, '</>') + `
  );
};
`;

fs.mkdirSync('components/school/behavior', { recursive: true });
fs.writeFileSync('components/school/behavior/SchoolBehaviorCreateModal.tsx', sourceCode);

lines.splice(startIndexStr, endIndexStr - startIndexStr + 1, 
`      <SchoolBehaviorCreateModal 
        isCreateModalOpen={isCreateModalOpen} setIsCreateModalOpen={setIsCreateModalOpen}
        handleSubmit={handleSubmit} formData={formData} setFormData={setFormData}
        students={students}
      />`);

const imports = `import { SchoolBehaviorCreateModal } from '../../components/school/behavior/SchoolBehaviorCreateModal';\n`;
lines.splice(2, 0, imports);
fs.writeFileSync(file, lines.join('\n'));
console.log('done splitting SchoolBehavior');
