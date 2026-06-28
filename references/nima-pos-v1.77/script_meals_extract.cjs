const fs = require('fs');

let s = fs.readFileSync('pages/school/SchoolMeals.tsx', 'utf8');

// 1. Schedule Modal
let schModalStart = s.indexOf('{isScheduleModalOpen && (');
let schModalEnd = s.indexOf(')}', s.indexOf('</div>\n                </div>', schModalStart));
let schCode = s.substring(schModalStart, schModalEnd + 2);

s = s.replace(schCode, `
            <SchoolMealScheduleModal
                isScheduleModalOpen={isScheduleModalOpen}
                setIsScheduleModalOpen={setIsScheduleModalOpen}
                scheduleForm={scheduleForm}
                setScheduleForm={setScheduleForm}
                saveSchedule={saveSchedule}
                WEEK_DAYS={WEEK_DAYS}
            />`);

// 2. Restriction Modal
let resModalStart = s.indexOf('{isRestrictionModalOpen && (');
let resModalEnd = s.indexOf(')}', s.indexOf('</div>\n                </div>', resModalStart));
let resCode = s.substring(resModalStart, resModalEnd + 2);

s = s.replace(resCode, `
            <SchoolMealRestrictionModal 
                isRestrictionModalOpen={isRestrictionModalOpen}
                setIsRestrictionModalOpen={setIsRestrictionModalOpen}
                allergies={allergies}
                setAllergies={setAllergies}
                dietaryNotes={dietaryNotes}
                setDietaryNotes={setDietaryNotes}
                saveRestrictions={saveRestrictions}
            />`);

let imports = `import { SchoolMealScheduleModal } from '../../components/school/meals/SchoolMealScheduleModal';\nimport { SchoolMealRestrictionModal } from '../../components/school/meals/SchoolMealRestrictionModal';\n`;
if (!s.includes('import { SchoolMealScheduleModal }')) {
    s = imports + s;
}

fs.writeFileSync('pages/school/SchoolMeals.tsx', s);

// Write components
let schComponent = `import React from 'react';
import { X, Coffee, Apple, Salad } from 'lucide-react';

export const SchoolMealScheduleModal = ({
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    scheduleForm,
    setScheduleForm,
    saveSchedule,
    WEEK_DAYS
}: any) => {
    if (!isScheduleModalOpen) return null;
    return (
` + schCode.substring(schCode.indexOf('<div className="fixed inset-0'), schCode.lastIndexOf('</div>') + 6) + `
    );
};
`;
fs.writeFileSync('components/school/meals/SchoolMealScheduleModal.tsx', schComponent);

let resComponent = `import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export const SchoolMealRestrictionModal = ({
    isRestrictionModalOpen,
    setIsRestrictionModalOpen,
    allergies,
    setAllergies,
    dietaryNotes,
    setDietaryNotes,
    saveRestrictions
}: any) => {
    if (!isRestrictionModalOpen) return null;
    return (
` + resCode.substring(resCode.indexOf('<div className="fixed inset-0'), resCode.lastIndexOf('</div>') + 6) + `
    );
};
`;
fs.writeFileSync('components/school/meals/SchoolMealRestrictionModal.tsx', resComponent);

console.log('Fixed meals');
