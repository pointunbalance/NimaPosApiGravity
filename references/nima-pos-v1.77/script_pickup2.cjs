const fs = require('fs');

const file = 'pages/school/SchoolSecurePickup.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const m1Start = 331;
const m1End = 439;
const m2Start = 441; // wait so it deletes the comment on 440? I'll delete from 440 to 627.
const m2End = 627;

const m1Code = `import React from 'react';
import { X, ShieldCheck, QrCode } from 'lucide-react';
import { SchoolStudent } from '../../types';

interface SchoolPickupModalProps {
  isPickupModalOpen: boolean;
  setIsPickupModalOpen: (val: boolean) => void;
  selectedStudent: any;
  pickupPin: string;
  setPickupPin: (val: string) => void;
  handlePickupSubmit: (e: React.FormEvent) => void;
}

export const SchoolPickupModal: React.FC<SchoolPickupModalProps> = ({
  isPickupModalOpen, setIsPickupModalOpen, selectedStudent, pickupPin, setPickupPin, handlePickupSubmit
}) => {
  if (!isPickupModalOpen || !selectedStudent) return null;
  return (
` + lines.slice(m1Start, m1End + 1).join('\n').replace('{isPickupModalOpen && selectedStudent && (', '<>').replace(/^\s*\)\}\s*$/, '</>') + `
  );
};
`;

const m2Code = `import React from 'react';
import { X, UserCog, User, Phone, CheckCircle2, QrCode, ShieldCheck, AlertTriangle } from 'lucide-react';
import { SchoolStudent } from '../../types';

interface SchoolManageAuthModalProps {
  isManageAuthModalOpen: boolean;
  setIsManageAuthModalOpen: (val: boolean) => void;
  selectedStudent: any;
  handleAuthPersonSubmit: (e: React.FormEvent) => void;
  newAuthPerson: any;
  setNewAuthPerson: (val: any) => void;
  handleRemoveAuthPerson: (name: string) => void;
}

export const SchoolManageAuthModal: React.FC<SchoolManageAuthModalProps> = ({
  isManageAuthModalOpen, setIsManageAuthModalOpen, selectedStudent, handleAuthPersonSubmit, newAuthPerson, setNewAuthPerson, handleRemoveAuthPerson
}) => {
  if (!isManageAuthModalOpen || !selectedStudent) return null;
  return (
` + lines.slice(m2Start, m2End + 1).join('\n').replace('{isManageAuthModalOpen && selectedStudent && (', '<>').replace(/^\s*\)\}\s*$/, '</>') + `
  );
};
`;

fs.mkdirSync('components/school/pickup', { recursive: true });
fs.writeFileSync('components/school/pickup/SchoolPickupModal.tsx', m1Code);
fs.writeFileSync('components/school/pickup/SchoolManageAuthModal.tsx', m2Code);

lines.splice(m2Start, m2End - m2Start + 1);
lines.splice(m1Start, m1End - m1Start + 1,
`      <SchoolPickupModal
        isPickupModalOpen={isPickupModalOpen}
        setIsPickupModalOpen={setIsPickupModalOpen}
        selectedStudent={selectedStudent}
        pickupPin={pickupPin}
        setPickupPin={setPickupPin}
        handlePickupSubmit={handlePickupSubmit}
      />
      <SchoolManageAuthModal
        isManageAuthModalOpen={isManageAuthModalOpen}
        setIsManageAuthModalOpen={setIsManageAuthModalOpen}
        selectedStudent={selectedStudent}
        handleAuthPersonSubmit={handleAuthPersonSubmit}
        newAuthPerson={newAuthPerson}
        setNewAuthPerson={setNewAuthPerson}
        handleRemoveAuthPerson={handleRemoveAuthPerson}
      />`);

const imports = `import { SchoolPickupModal } from '../../components/school/pickup/SchoolPickupModal';
import { SchoolManageAuthModal } from '../../components/school/pickup/SchoolManageAuthModal';\n`;
lines.splice(2, 0, imports);

fs.writeFileSync(file, lines.join('\n'));

console.log('done splitting SchoolSecurePickup');
