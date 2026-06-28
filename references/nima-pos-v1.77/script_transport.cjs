const fs = require('fs');

const file = 'pages/school/Transport.tsx';
const data = fs.readFileSync(file, 'utf8');
const lines = data.split('\n');

const createScript = (name, propsStr, start, end, condStr, iconStr) => {
   return `import React from 'react';
import { X, ${iconStr} } from 'lucide-react';
import { Student, Staff } from '../../types';

interface ${name}Props {
${propsStr}
}

export const ${name}: React.FC<${name}Props> = (props) => {
   const { ${propsStr.split(/:\s*[^;\n]+;/).filter(x => x.trim()).map(x => x.trim().split('?')[0]).join(', ')} } = props;
   if (!${condStr}) return null;
   return (
` + lines.slice(start, end).join('\n').replace(new RegExp('\\{'+condStr+' && \\('), '<>').replace(/^\s*\)\}\s*$/, '</>') + `
   );
};
`;
}

// 388 (0-indexed to 448)
// 449 (0-indexed to 491)
// 492 (0-indexed to 524)
// 525 (0-indexed to 567)

const c1 = createScript('SchoolRouteModal', 
`routeModalOpen: boolean;
setRouteModalOpen: (val: boolean) => void;
handleSaveRoute: (e: any) => void;
routeFormData: any;
setRouteFormData: (val: any) => void;
drivers: Staff[];
supervisors: Staff[];`, 388, 449, 'routeModalOpen', 'Bus');

const c2 = createScript('SchoolSubModal',
`subModalOpen: boolean;
setSubModalOpen: (val: boolean) => void;
handleSaveSub: (e: any) => void;
subFormData: any;
setSubFormData: (val: any) => void;
students: Student[];
routes: any[];`, 449, 492, 'subModalOpen', 'Users');

const c3 = createScript('SchoolTripModal',
`tripModalOpen: boolean;
setTripModalOpen: (val: boolean) => void;
handleSaveTrip: (e: any) => void;
tripFormData: any;
setTripFormData: (val: any) => void;
routes: any[];`, 492, 525, 'tripModalOpen', 'MapPin');

const c4 = createScript('SchoolExpenseModal',
`expenseModalOpen: boolean;
setExpenseModalOpen: (val: boolean) => void;
handleSaveExpense: (e: any) => void;
expenseFormData: any;
setExpenseFormData: (val: any) => void;
routes: any[];`, 525, 568, 'expenseModalOpen', 'Receipt');

fs.mkdirSync('components/school/transport', { recursive: true });
fs.writeFileSync('components/school/transport/SchoolRouteModal.tsx', c1);
fs.writeFileSync('components/school/transport/SchoolSubModal.tsx', c2);
fs.writeFileSync('components/school/transport/SchoolTripModal.tsx', c3);
fs.writeFileSync('components/school/transport/SchoolExpenseModal.tsx', c4);

lines.splice(525, 568 - 525);
lines.splice(492, 525 - 492);
lines.splice(449, 492 - 449);
lines.splice(388, 449 - 388);

lines.splice(388, 0, `
            <SchoolRouteModal routeModalOpen={routeModalOpen} setRouteModalOpen={setRouteModalOpen} handleSaveRoute={handleSaveRoute} routeFormData={routeFormData} setRouteFormData={setRouteFormData} drivers={drivers} supervisors={supervisors} />
            <SchoolSubModal subModalOpen={subModalOpen} setSubModalOpen={setSubModalOpen} handleSaveSub={handleSaveSub} subFormData={subFormData} setSubFormData={setSubFormData} students={students} routes={routes} />
            <SchoolTripModal tripModalOpen={tripModalOpen} setTripModalOpen={setTripModalOpen} handleSaveTrip={handleSaveTrip} tripFormData={tripFormData} setTripFormData={setTripFormData} routes={routes} />
            <SchoolExpenseModal expenseModalOpen={expenseModalOpen} setExpenseModalOpen={setExpenseModalOpen} handleSaveExpense={handleSaveExpense} expenseFormData={expenseFormData} setExpenseFormData={setExpenseFormData} routes={routes} />
`);

let imps = `import { SchoolRouteModal } from '../../components/school/transport/SchoolRouteModal';
import { SchoolSubModal } from '../../components/school/transport/SchoolSubModal';
import { SchoolTripModal } from '../../components/school/transport/SchoolTripModal';
import { SchoolExpenseModal } from '../../components/school/transport/SchoolExpenseModal';\n`;

lines.splice(2, 0, imps);
fs.writeFileSync(file, lines.join('\n'));
console.log('done splitting Transport');
