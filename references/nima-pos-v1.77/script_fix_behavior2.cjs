const fs = require('fs');

// Add missing props to Behavior Modal
let bModal = fs.readFileSync('components/school/behavior/SchoolBehaviorCreateModal.tsx', 'utf8');
bModal = bModal.replace('students: SchoolStudent[];', 'students: SchoolStudent[];\nclasses: any[];\nBEHAVIOR_TYPES: any[];\nspecialists: any[];');
bModal = bModal.replace('handleSubmit, form, setForm, students\n}) => {', 'handleSubmit, form, setForm, students, classes, BEHAVIOR_TYPES, specialists\n}) => {');
bModal = bModal.replace('activeStudents', 'students');
bModal = bModal.replace("import { X, Brain, CheckCircle2, ChevronRight, MessageSquare, AlertTriangle, User } from 'lucide-react';", "import { X, Brain, CheckCircle2, ChevronRight, MessageSquare, AlertTriangle, User, LineChart } from 'lucide-react';");
fs.writeFileSync('components/school/behavior/SchoolBehaviorCreateModal.tsx', bModal);

// Add missing exports or constants inside SchoolBehavior.tsx before sending them? 
// No, BEHAVIOR_TYPES and specialists exist inside SchoolBehavior.tsx
let behaviorPg = fs.readFileSync('pages/school/SchoolBehavior.tsx', 'utf8');
behaviorPg = behaviorPg.replace('students={students}', 'students={students} classes={classesList || []} BEHAVIOR_TYPES={BEHAVIOR_TYPES} specialists={specialists}');
fs.writeFileSync('pages/school/SchoolBehavior.tsx', behaviorPg);

console.log('done fixing behavior props');
