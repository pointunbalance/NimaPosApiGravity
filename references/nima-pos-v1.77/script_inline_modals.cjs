const fs = require('fs');

function inlineModal(parentFile, modalName, modalFile) {
   if (!fs.existsSync(parentFile) || !fs.existsSync(modalFile)) return;
   
   let pData = fs.readFileSync(parentFile, 'utf8');
   let mData = fs.readFileSync(modalFile, 'utf8');
   
   // Extract the return block of the modal
   let lines = mData.split('\n');
   let start = lines.findIndex(l => l.includes('return ('));
   if (start === -1) return;
   let end = lines.findIndex((l, i) => i > start && (l.trim() === '    );' || l.trim() === '   );' || l.trim() === ');'));
   if (end === -1) return;
   
   let jsx = lines.slice(start + 1, end).join('\n');
   jsx = jsx.replace(/^<>\s*/g, '');
   jsx = jsx.replace(/\s*<\/>$/g, '');
   
   // find the tag in parent
   let tagRegex = new RegExp('<' + modalName + '.*?/>');
   pData = pData.replace(tagRegex, jsx);
   fs.writeFileSync(parentFile, pData);
}

// Inline modals
inlineModal('pages/school/SchoolAcademicYear.tsx', 'SchoolAcademicYearModal', 'components/school/academicyear/SchoolAcademicYearModal.tsx');
inlineModal('pages/school/SchoolAcademicYear.tsx', 'SchoolPromoteModal', 'components/school/academicyear/SchoolPromoteModal.tsx');
inlineModal('pages/school/SchoolAdmissions.tsx', 'SchoolAdmissionCreateModal', 'components/school/admissions/SchoolAdmissionCreateModal.tsx');
inlineModal('pages/school/SchoolAdmissions.tsx', 'SchoolAdmissionFollowupModal', 'components/school/admissions/SchoolAdmissionFollowupModal.tsx');
inlineModal('pages/school/SchoolDiscounts.tsx', 'SchoolDiscountModal', 'components/school/discounts/SchoolDiscountModal.tsx');
inlineModal('pages/school/SchoolMeals.tsx', 'SchoolMealScheduleModal', 'components/school/meals/SchoolMealScheduleModal.tsx');
inlineModal('pages/school/SchoolMeals.tsx', 'SchoolMealRestrictionModal', 'components/school/meals/SchoolMealRestrictionModal.tsx');
inlineModal('pages/school/SchoolTrips.tsx', 'SchoolTripModal', 'components/school/trips/SchoolTripModal.tsx');
inlineModal('pages/school/SchoolTrips.tsx', 'SchoolTripReportModal', 'components/school/trips/SchoolTripReportModal.tsx');
inlineModal('pages/school/SchoolStaff.tsx', 'SchoolStaffModal', 'components/school/staff/SchoolStaffModal.tsx');
inlineModal('pages/school/SchoolStaff.tsx', 'SchoolStaffTransModal', 'components/school/staff/SchoolStaffTransModal.tsx');

console.log('done inlining');
