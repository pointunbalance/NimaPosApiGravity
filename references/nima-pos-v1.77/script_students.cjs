const fs = require('fs');

const file = 'pages/school/Students.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const createScript = (name, propsStr, start, end, condStr, extraImports = '') => {
   return `import React from 'react';
import { X } from 'lucide-react';
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

const props = `isModalOpen: boolean;
setIsModalOpen: (val: boolean) => void;
handleSaveStudent: (e: any) => void;
studentFormData: any;
setStudentFormData: (val: any) => void;
levels: any[];
filteredClassesForSelect: any[];
parents: any[];
`;

const code = createScript('SchoolStudentModal', props, 447, 529, 'isModalOpen');
fs.writeFileSync('components/school/students/SchoolStudentModal.tsx', code);

lines.splice(447, 529 - 447);
lines.splice(447, 0, `      <SchoolStudentModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} handleSaveStudent={handleSaveStudent} studentFormData={studentFormData} setStudentFormData={setStudentFormData} levels={levels} filteredClassesForSelect={filteredClassesForSelect} parents={parents} />`);

const imp = `import { SchoolStudentModal } from '../../components/school/students/SchoolStudentModal';\n`;
lines.splice(2, 0, imp);
fs.writeFileSync(file, lines.join('\n'));

console.log('done extracting Students modal');
