const fs = require('fs');

const fixEnd = (p) => {
    if (!fs.existsSync(p)) return;
    let lines = fs.readFileSync(p, 'utf8').split('\n');
    let idx = lines.findIndex(l => l.trim() === '</>');
    if (idx !== -1) {
        lines.splice(idx + 1, lines.length - idx - 1);
        lines.push('   );');
        lines.push('};');
        fs.writeFileSync(p, lines.join('\n'));
    }
}

const paths = [
  'components/school/staff/SchoolStaffModal.tsx',
  'components/school/academicyear/SchoolAcademicYearModal.tsx',
  'components/school/academicyear/SchoolPromoteModal.tsx',
  'components/school/discounts/SchoolDiscountModal.tsx',
  'components/school/admissions/SchoolAdmissionCreateModal.tsx',
  'components/school/admissions/SchoolAdmissionFollowupModal.tsx',
  'components/school/trips/SchoolTripModal.tsx',
  'components/school/meals/SchoolMealScheduleModal.tsx',
  'components/school/meals/SchoolMealRestrictionModal.tsx'
];

for (let p of paths) fixEnd(p);

// The remaining errors are around expected ) and expected </div> in SchoolDiscounts.
let discounts = fs.readFileSync('pages/school/SchoolDiscounts.tsx', 'utf8');
if (!discounts.includes('      </div>\n    );\n};\n')) {
    discounts = discounts.replace('        </div>\n    );\n};\n\nexport default SchoolDiscounts;\n', '    </div></div></div></div>\n        </div>\n    );\n};\n\nexport default SchoolDiscounts;\n');
    fs.writeFileSync('pages/school/SchoolDiscounts.tsx', discounts);
}

// Let's run npx tsc to see if it improves
console.log('done fixing ends');
