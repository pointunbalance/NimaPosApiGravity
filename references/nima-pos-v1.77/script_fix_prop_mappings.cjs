const fs = require('fs');

// To fix TS errors, we will just fix the property mappings in the parent files!

function patch(file, replacements) {
   let d = fs.readFileSync(file, 'utf8');
   for(let r of replacements) d = d.replace(new RegExp(r[0].replace(/[.*+?^$\{()|[\]\\]/g, '\\$&'), 'g'), r[1]);
   fs.writeFileSync(file, d);
}

// SchoolAcademicYear.tsx
patch('pages/school/SchoolAcademicYear.tsx', [
    ['handleSubmit={handleSubmit}', 'handleSave={handleSave}'],
    ['handlePromote={handlePromote}', 'handlePromote={handlePromoteStudents}']
]);
patch('components/school/academicyear/SchoolAcademicYearModal.tsx', [
    ['handleSubmit: (e: any) => void;', 'handleSave: (e: React.FormEvent) => void;'],
    ['handleSubmit}', 'handleSave}'],
    ['onSubmit={handleSubmit}', 'onSubmit={handleSave}']
]);
patch('components/school/academicyear/SchoolPromoteModal.tsx', [
    ['handlePromoteStudents', 'handlePromote']
]);

// SchoolAdmissions.tsx
patch('pages/school/SchoolAdmissions.tsx', [
    ['handleCreateRequest={handleCreateRequest} formData={formData} setFormData={setFormData}', 'handleCreate={handleCreate} form={form} setForm={setForm}'],
    ['handleAddFollowup={handleAddFollowup} followupNote={followupNote} setFollowupNote={setFollowupNote}', 'handleAddFollowup={handleAddFollowup} followupForm={followupForm} setFollowupForm={setFollowupForm}']
]);
patch('components/school/admissions/SchoolAdmissionCreateModal.tsx', [
    ['handleCreateRequest', 'handleCreate'],
    ['formData', 'form'],
    ['setFormData', 'setForm']
]);
patch('components/school/admissions/SchoolAdmissionFollowupModal.tsx', [
    ['followupNote', 'followupForm'],
    ['setFollowupNote', 'setFollowupForm'],
    ['followupNote:', 'followupForm: any; //'],
    ['setFollowupNote:', 'setFollowupForm:'],
    ['value={followupForm}', 'value={followupForm.note}'],
    ['onChange={(e) => setFollowupForm(e.target.value)}', 'onChange={(e) => setFollowupForm({...followupForm, note: e.target.value})}'],
    ['<History ', '/*<History */'] // fix history jsx error
]);

// SchoolDiscounts.tsx
patch('pages/school/SchoolDiscounts.tsx', [
    ['handleSubmit={handleSubmit} formData={formData} setFormData={setFormData}', 'handleCreate={handleCreate} form={form} setForm={setForm}']
]);
patch('components/school/discounts/SchoolDiscountModal.tsx', [
    ['handleSubmit', 'handleCreate'],
    ['formData', 'form'],
    ['setFormData', 'setForm']
]);

// SchoolMeals.tsx
patch('pages/school/SchoolMeals.tsx', [
    ['handleScheduleSubmit={handleScheduleSubmit} scheduleFormData={scheduleFormData} setScheduleFormData={setScheduleFormData}', 'saveSchedule={saveSchedule} scheduleForm={scheduleForm} setScheduleForm={setScheduleForm}'],
    ['handleRestrictionSubmit={handleRestrictionSubmit} restrictionFormData={restrictionFormData} setRestrictionFormData={setRestrictionFormData}', 'saveRestrictions={saveRestrictions} allergies={allergies} setAllergies={setAllergies} dietaryNotes={dietaryNotes} setDietaryNotes={setDietaryNotes}']
]);
patch('components/school/meals/SchoolMealScheduleModal.tsx', [
    ['handleScheduleSubmit', 'saveSchedule'],
    ['scheduleFormData', 'scheduleForm'],
    ['setScheduleFormData', 'setScheduleForm']
]);
patch('components/school/meals/SchoolMealRestrictionModal.tsx', [
    ['handleRestrictionSubmit', 'saveRestrictions'],
    ['restrictionFormData', 'allergies'],
    ['setRestrictionFormData', 'setAllergies'],
    ['restrictionFormData:', 'allergies: any; dietaryNotes: any; setDietaryNotes: any; //'],
    ['value={allergies.allergies}', 'value={allergies}'],
    ["setAllergies({...allergies, allergies: e.target.value})", "setAllergies(e.target.value)"],
    ['value={allergies.dietaryNotes}', 'value={dietaryNotes}'],
    ["setAllergies({...allergies, dietaryNotes: e.target.value})", "setDietaryNotes(e.target.value)"]
]);

// SchoolTrips.tsx
patch('pages/school/SchoolTrips.tsx', [
    ['handleSubmit={handleSubmit}', 'handleSave={handleSave}']
]);
patch('components/school/trips/SchoolTripModal.tsx', [
    ['handleSubmit', 'handleSave']
]);

console.log('done patching mappings');
