const fs = require('fs');

const fix = (file, replacers) => {
    let data = fs.readFileSync(file, 'utf8');
    for (const [k, v] of replacers) {
        data = data.replaceAll(k, v);
    }
    fs.writeFileSync(file, data);
}

// Grades Fixes
fix('pages/school/Grades.tsx', [
    ['evalData={evalData}', 'evalFormData={evalFormData}'],
    ['setEvalData={setEvalData}', 'setEvalFormData={setEvalFormData}'],
    ['<SchoolEvalModal isEvalModalOpen={isEvalModalOpen} setEvalModalOpen={setEvalModalOpen} handleSaveEvaluation={handleSaveEvaluation} evalFormData={evalFormData} setEvalFormData={setEvalFormData} selectedStudentForEval={selectedStudentForEval} subjects={subjects} />',
     '<SchoolEvalModal isEvalModalOpen={isEvalModalOpen} setEvalModalOpen={setEvalModalOpen} handleSaveEvaluation={handleSaveEvaluation} evalFormData={evalFormData} setEvalFormData={setEvalFormData} selectedStudentForEval={selectedStudentForEval} subjects={subjects} evalDate={evalDate} setEvalDate={setEvalDate} evalType={evalType} setEvalType={setEvalType} handleEvalChange={handleEvalChange} generalNotes={generalNotes} setGeneralNotes={setGeneralNotes} />']
]);

let evalModal = fs.readFileSync('components/school/grades/SchoolEvalModal.tsx', 'utf8');
evalModal = evalModal.replace('evalData: any;', 'evalFormData: any;');
evalModal = evalModal.replace('setEvalData: (val: any) => void;', 'setEvalFormData: (val: any) => void;');
evalModal = evalModal.replace('selectedStudentForEval: any;\nsubjects: any[];', 'selectedStudentForEval: any;\nsubjects: any[];\nevalDate: string; setEvalDate: any; evalType: string; setEvalType: any; handleEvalChange: any; generalNotes: string; setGeneralNotes: any;');
evalModal = evalModal.replace('evalData', 'evalFormData');
fs.writeFileSync('components/school/grades/SchoolEvalModal.tsx', evalModal);

// Transport Fixes
fix('pages/school/Transport.tsx', [
    ['drivers={drivers} supervisors={supervisors}', 'staff={staff}']
]);
let routeModal = fs.readFileSync('components/school/transport/SchoolRouteModal.tsx', 'utf8');
routeModal = routeModal.replace('drivers: Staff[];\nsupervisors: Staff[];', 'staff: Staff[];');
routeModal = routeModal.replace('drivers', 'staff');
routeModal = routeModal.replace('supervisors', 'staff');
fs.writeFileSync('components/school/transport/SchoolRouteModal.tsx', routeModal);

// Students Fixes
fix('pages/school/Students.tsx', [
    ['studentFormData={studentFormData}', 'studentFormData={studentFormData}'], // already correct but missing other handlers
    ['<SchoolStudentModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} handleSaveStudent={handleSaveStudent} studentFormData={studentFormData} setStudentFormData={setStudentFormData} levels={levels} filteredClassesForSelect={filteredClassesForSelect} parents={parents} />',
     '<SchoolStudentModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} handleSaveStudent={handleSaveStudent} studentFormData={studentFormData} setStudentFormData={setStudentFormData} levels={levels} filteredClassesForSelect={filteredClassesForSelect} parents={parents} handleClose={handleClose} activeTab={activeTab} setActiveTab={setActiveTab} handleSaveInfo={handleSaveInfo} guardianId={guardianId} setGuardianId={setGuardianId} guardians={parents} handleLinkGuardian={handleLinkGuardian} newPickup={newPickup} setNewPickup={setNewPickup} handleAddPickup={handleAddPickup} handleRemovePickup={handleRemovePickup} selectedChildId={selectedChildId} medicalForm={medicalForm} setMedicalForm={setMedicalForm} handleSaveMedical={handleSaveMedical} behavioralForm={behavioralForm} setBehavioralForm={setBehavioralForm} handleSaveBehavioral={handleSaveBehavioral} checklistForm={checklistForm} setChecklistForm={setChecklistForm} handleSaveChecklist={handleSaveChecklist} childNotes={childNotes} setChildNotes={setChildNotes} handleSaveNotes={handleSaveNotes} handleAddSubscription={handleAddSubscription} subForm={subForm} setSubForm={setSubForm} paymentForm={paymentForm} setPaymentForm={setPaymentForm} handleAddPayment={handleAddPayment} evalForm={evalForm} setEvalForm={setEvalForm} handleAddEvaluation={handleAddEvaluation} />']
]);

let studModal = fs.readFileSync('components/school/students/SchoolStudentModal.tsx', 'utf8');
studModal = studModal.replace('parents: any[];', 'parents: any[];\nhandleClose: any; activeTab: any; setActiveTab: any; handleSaveInfo: any; guardianId: any; setGuardianId: any; guardians: any; handleLinkGuardian: any; newPickup: any; setNewPickup: any; handleAddPickup: any; handleRemovePickup: any; selectedChildId: any; medicalForm: any; setMedicalForm: any; handleSaveMedical: any; behavioralForm: any; setBehavioralForm: any; handleSaveBehavioral: any; checklistForm: any; setChecklistForm: any; handleSaveChecklist: any; childNotes: any; setChildNotes: any; handleSaveNotes: any; handleAddSubscription: any; subForm: any; setSubForm: any; paymentForm: any; setPaymentForm: any; handleAddPayment: any; evalForm: any; setEvalForm: any; handleAddEvaluation: any;');
studModal = studModal.replace(/const { [^}]+ } = props;/g, 'const { isModalOpen, setIsModalOpen, handleSaveStudent, studentFormData: formData, setStudentFormData: setFormData, levels, filteredClassesForSelect: classesList, parents, handleClose, activeTab, setActiveTab, handleSaveInfo, guardianId, setGuardianId, guardians, handleLinkGuardian, newPickup, setNewPickup, handleAddPickup, handleRemovePickup, selectedChildId, medicalForm, setMedicalForm, handleSaveMedical, behavioralForm, setBehavioralForm, handleSaveBehavioral, checklistForm, setChecklistForm, handleSaveChecklist, childNotes, setChildNotes, handleSaveNotes, handleAddSubscription, subForm, setSubForm, paymentForm, setPaymentForm, handleAddPayment, evalForm, setEvalForm, handleAddEvaluation } = props;');
// Also studentFormData was mapped to formData inside the component above.
fs.writeFileSync('components/school/students/SchoolStudentModal.tsx', studModal);

console.log('done fixing type errors 2');
