const fs = require('fs');

const file = 'pages/school/Classes.tsx';
let data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const createLevelModal = `import React from 'react';
import { X, Layers } from 'lucide-react';

export const LevelModal = ({
  isLevelModalOpen, setIsLevelModalOpen, handleSaveLevel, levelForm, setLevelForm
}: any) => {
  if (!isLevelModalOpen) return null;
  return (
` + lines.slice(427, 507).join('\n').replace('{isLevelModalOpen && (', '<>').replace(/^\s*\)\}\s*$/, '</>') + `
  );
};
`;

const createClassModal = `import React from 'react';
import { X, BookOpen } from 'lucide-react';

export const ClassModal = ({
  isClassModalOpen, setIsClassModalOpen, handleSaveClass, classForm, setClassForm, levelsList, teachersList
}: any) => {
  if (!isClassModalOpen) return null;
  return (
` + lines.slice(510, 605).join('\n').replace('{isClassModalOpen && (', '<>').replace(/^\s*\)\}\s*$/, '</>') + `
  );
};
`;

const createProfileModal = `import React from 'react';
import { X, BookOpen, User, Phone, MapPin, Printer } from 'lucide-react';

export const ClassProfileModal = ({
  isClassProfileOpen, setIsClassProfileOpen, selectedClass, selectedClassStudents,
  handleRemoveStudent, setTransferModalOpen, selectedStudents, setSelectedStudents
}: any) => {
  if (!isClassProfileOpen || !selectedClass) return null;

  return (
` + lines.slice(608, 725).join('\n').replace('{isClassProfileOpen && selectedClass && (', '<>').replace(/^\s*\)\}\s*$/, '</>') + `
  );
};
`;

const createTransferModal = `import React from 'react';

export const ClassTransferModal = ({
  transferModalOpen, setTransferModalOpen, handleBulkTransfer, transferClassId, setTransferClassId, classesList, selectedClass, selectedStudents
}: any) => {
  if (!transferModalOpen) return null;
  return (
` + lines.slice(728, 768).join('\n').replace('{transferModalOpen && (', '<>').replace(/^\s*\)\}\s*$/, '</>') + `
  );
};
`;

fs.mkdirSync('components/school/classes', { recursive: true });
fs.writeFileSync('components/school/classes/LevelModal.tsx', createLevelModal);
fs.writeFileSync('components/school/classes/ClassModal.tsx', createClassModal);
fs.writeFileSync('components/school/classes/ClassProfileModal.tsx', createProfileModal);
fs.writeFileSync('components/school/classes/ClassTransferModal.tsx', createTransferModal);

lines.splice(728, 769 - 728);
lines.splice(607, 726 - 607);
lines.splice(509, 606 - 509);
lines.splice(426, 508 - 426);

lines.splice(lines.length - 3, 0, `      <LevelModal 
        isLevelModalOpen={isLevelModalOpen} setIsLevelModalOpen={setIsLevelModalOpen}
        handleSaveLevel={handleSaveLevel} levelForm={levelForm} setLevelForm={setLevelForm} 
      />
      <ClassModal 
        isClassModalOpen={isClassModalOpen} setIsClassModalOpen={setIsClassModalOpen}
        handleSaveClass={handleSaveClass} classForm={classForm} setClassForm={setClassForm}
        levelsList={levelsList} teachersList={teachersList}
      />
      <ClassProfileModal 
        isClassProfileOpen={isClassProfileOpen} setIsClassProfileOpen={setIsClassProfileOpen}
        selectedClass={selectedClass} selectedClassStudents={selectedClassStudents}
        handleRemoveStudent={handleRemoveStudent} setTransferModalOpen={setTransferModalOpen}
        selectedStudents={selectedStudents} setSelectedStudents={setSelectedStudents}
      />
      <ClassTransferModal 
        transferModalOpen={transferModalOpen} setTransferModalOpen={setTransferModalOpen}
        handleBulkTransfer={handleBulkTransfer} transferClassId={transferClassId}
        setTransferClassId={setTransferClassId} classesList={classesList}
        selectedClass={selectedClass} selectedStudents={selectedStudents}
      />`);

const imports = `import { LevelModal } from '../../components/school/classes/LevelModal';
import { ClassModal } from '../../components/school/classes/ClassModal';
import { ClassProfileModal } from '../../components/school/classes/ClassProfileModal';
import { ClassTransferModal } from '../../components/school/classes/ClassTransferModal';
`;

lines.splice(2, 0, imports);
fs.writeFileSync(file, lines.join('\n'));
console.log('done extracting classes modals');
