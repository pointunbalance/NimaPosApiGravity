const fs = require('fs');

let fModal = fs.readFileSync('components/school/admissions/SchoolAdmissionFollowupModal.tsx', 'utf8');
fModal = fModal.replace(/\/\*<History \*\//g, '');
fModal = fModal.replace("import { X, UserPlus, MessageSquare, Plus } from 'lucide-react';", "import { X, UserPlus, MessageSquare, Plus, History } from 'lucide-react';\nimport { format } from 'date-fns';");
fModal = fModal.replace('setFollowupForm: (val: string) => void;', 'setFollowupForm: (val: any) => void;\n   crmLogs: any[];\n   employees: any[];');
fModal = fModal.replace('followupForm, setFollowupForm } = props;', 'followupForm, setFollowupForm, crmLogs, employees } = props;');

fs.writeFileSync('components/school/admissions/SchoolAdmissionFollowupModal.tsx', fModal);

let sAdmissions = fs.readFileSync('pages/school/SchoolAdmissions.tsx', 'utf8');
sAdmissions = sAdmissions.replace('<SchoolAdmissionFollowupModal isFollowupModalOpen={isFollowupModalOpen} setIsFollowupModalOpen={setIsFollowupModalOpen} selectedRequest={selectedRequest} handleAddFollowup={handleAddFollowup} followupForm={followupForm} setFollowupForm={setFollowupForm} />',
'<SchoolAdmissionFollowupModal isFollowupModalOpen={isFollowupModalOpen} setIsFollowupModalOpen={setIsFollowupModalOpen} selectedRequest={selectedRequest} handleAddFollowup={handleAddFollowup} followupForm={followupForm} setFollowupForm={setFollowupForm} crmLogs={crmLogs} employees={employees} />');
fs.writeFileSync('pages/school/SchoolAdmissions.tsx', sAdmissions);

console.log('done fixing followup modal');
