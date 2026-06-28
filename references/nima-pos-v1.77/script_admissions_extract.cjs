const fs = require('fs');

let s = fs.readFileSync('pages/school/SchoolAdmissions.tsx', 'utf8');

// 1. Create Modal
let createModalStart = s.indexOf('{isCreateModalOpen && (');
let createModalEnd = s.indexOf(')}', s.indexOf('</div>\n                </div>', createModalStart));
let createCode = s.substring(createModalStart, createModalEnd + 2);
s = s.replace(createCode, `
            <SchoolAdmissionCreateModal 
                isCreateModalOpen={isCreateModalOpen}
                setIsCreateModalOpen={setIsCreateModalOpen}
                form={form}
                setForm={setForm}
                handleCreate={handleCreate}
                LEAD_SOURCES={LEAD_SOURCES}
                levels={levels}
                employees={employees}
            />`);

// 2. Followup Modal
let fwModalStart = s.indexOf('{isFollowupModalOpen && selectedRequest && (');
let fwModalEnd = s.indexOf(')}', s.indexOf('</div>\n                </div>', fwModalStart));
let fwCode = s.substring(fwModalStart, fwModalEnd + 2);
s = s.replace(fwCode, `
            <SchoolAdmissionFollowupModal 
                isFollowupModalOpen={isFollowupModalOpen}
                setIsFollowupModalOpen={setIsFollowupModalOpen}
                selectedRequest={selectedRequest}
                crmLogs={crmLogs}
                employees={employees}
                followupForm={followupForm}
                setFollowupForm={setFollowupForm}
                handleAddFollowup={handleAddFollowup}
            />`);

let imports = `import { SchoolAdmissionCreateModal } from '../../components/school/admissions/SchoolAdmissionCreateModal';\nimport { SchoolAdmissionFollowupModal } from '../../components/school/admissions/SchoolAdmissionFollowupModal';\n`;
if (!s.includes('SchoolAdmissionCreateModal')) {
    s = imports + s;
}

fs.writeFileSync('pages/school/SchoolAdmissions.tsx', s);

// Write components
let createComponent = `import React from 'react';
import { UserPlus, X, Megaphone, User, Calendar } from 'lucide-react';

export const SchoolAdmissionCreateModal = ({
    isCreateModalOpen,
    setIsCreateModalOpen,
    form,
    setForm,
    handleCreate,
    LEAD_SOURCES,
    levels,
    employees
}: any) => {
    if (!isCreateModalOpen) return null;
    return (
` + createCode.substring(createCode.indexOf('<div className="fixed inset-0'), createCode.lastIndexOf('</div>') + 6) + `
    );
};
`;
fs.writeFileSync('components/school/admissions/SchoolAdmissionCreateModal.tsx', createComponent);

let fwComponent = `import React from 'react';
import { History, X, Plus } from 'lucide-react';
import { format } from 'date-fns';

export const SchoolAdmissionFollowupModal = ({
    isFollowupModalOpen,
    setIsFollowupModalOpen,
    selectedRequest,
    crmLogs,
    employees,
    followupForm,
    setFollowupForm,
    handleAddFollowup
}: any) => {
    if (!isFollowupModalOpen || !selectedRequest) return null;
    return (
` + fwCode.substring(fwCode.indexOf('<div className="fixed inset-0'), fwCode.lastIndexOf('</div>') + 6) + `
    );
};
`;
fs.writeFileSync('components/school/admissions/SchoolAdmissionFollowupModal.tsx', fwComponent);

console.log('Fixed admissions');
