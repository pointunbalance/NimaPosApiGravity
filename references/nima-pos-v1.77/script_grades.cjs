const fs = require('fs');

const file = 'pages/school/Grades.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const createScript = (name, propsStr, start, end, condStr, extraImports = '') => {
   return `import React from 'react';
import { X, BookOpen, Star, User } from 'lucide-react';
${extraImports}

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

const c1 = createScript('SchoolSubjectModal',
`isSubjectModalOpen: boolean;
setSubjectModalOpen: (val: boolean) => void;
handleSaveSubject: (e: any) => void;
subjectData: any;
setSubjectData: (val: any) => void;`, 422, 461, 'isSubjectModalOpen');

const c2 = createScript('SchoolEvalModal',
`isEvalModalOpen: boolean;
setEvalModalOpen: (val: boolean) => void;
handleSaveEvaluation: (e: any) => void;
evalData: any;
setEvalData: (val: any) => void;
selectedStudentForEval: any;
subjects: any[];`, 461, 536, 'isEvalModalOpen', `import { motion } from 'framer-motion';`);

fs.mkdirSync('components/school/grades', { recursive: true });
fs.writeFileSync('components/school/grades/SchoolSubjectModal.tsx', c1);
fs.writeFileSync('components/school/grades/SchoolEvalModal.tsx', c2);

lines.splice(461, 536 - 461);
lines.splice(422, 461 - 422);

lines.splice(422, 0, `
            <SchoolSubjectModal isSubjectModalOpen={isSubjectModalOpen} setSubjectModalOpen={setSubjectModalOpen} handleSaveSubject={handleSaveSubject} subjectData={subjectData} setSubjectData={setSubjectData} />
            <SchoolEvalModal isEvalModalOpen={isEvalModalOpen} setEvalModalOpen={setEvalModalOpen} handleSaveEvaluation={handleSaveEvaluation} evalData={evalData} setEvalData={setEvalData} selectedStudentForEval={selectedStudentForEval} subjects={subjects} />
`);

let imps = `import { SchoolSubjectModal } from '../../components/school/grades/SchoolSubjectModal';
import { SchoolEvalModal } from '../../components/school/grades/SchoolEvalModal';\n`;

lines.splice(2, 0, imps);
fs.writeFileSync(file, lines.join('\n'));
console.log('done splitting Grades');
