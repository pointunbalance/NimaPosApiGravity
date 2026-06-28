const fs = require('fs');
const glob = globPath => fs.readdirSync(globPath);

function removeImports(file) {
    let s = fs.readFileSync(file, 'utf8');
    s = s.replace(/import \{.*?Modal.*?} from '\.\.\/\.\.\/components\/school\/.*?';\n/g, '');
    s = s.replace(/<[A-Za-z]+Modal .*?\/>/g, '');
    fs.writeFileSync(file, s);
}

const pages = [
  'pages/school/SchoolAcademicYear.tsx',
  'pages/school/SchoolAdmissions.tsx',
  'pages/school/SchoolBehavior.tsx',
  'pages/school/SchoolDiscounts.tsx',
  'pages/school/SchoolMeals.tsx',
  'pages/school/SchoolSecurePickup.tsx',
  'pages/school/SchoolStaff.tsx',
  'pages/school/SchoolTrips.tsx',
  'pages/school/Students.tsx',
  'pages/school/Transport.tsx'
];
pages.forEach(removeImports);

const dirs = [
    'components/school/academicyear',
    'components/school/admissions',
    'components/school/behavior',
    'components/school/discounts',
    'components/school/grades',
    'components/school/meals',
    'components/school/pickup',
    'components/school/students',
    'components/school/transport',
    'components/school/trips',
    'components/school/withdrawals',
    'components/school/staff'
];

for (let dir of dirs) {
    let files = fs.readdirSync(dir);
    for (let f of files) {
        if (f.endsWith('Modal.tsx')) {
            fs.unlinkSync(dir + '/' + f);
        }
    }
}
console.log('Removed modals and imports');
