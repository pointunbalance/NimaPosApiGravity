const fs = require('fs');

const fixMainFileEnds = (file) => {
    let data = fs.readFileSync(file, 'utf8');
    if (!data.includes('  );\n};\n') && !data.includes('export default ' + file.split('/').pop().replace('.tsx', ''))) {
        if (!data.endsWith('\n')) data += '\n';
        data += '        </div>\n    );\n};\n\nexport default ' + file.split('/').pop().replace('.tsx', '') + ';\n';
        fs.writeFileSync(file, data);
        console.log('Fixed end of', file);
    }
}

fixMainFileEnds('pages/school/SchoolTrips.tsx');
fixMainFileEnds('pages/school/SchoolAdmissions.tsx');
fixMainFileEnds('pages/school/SchoolMeals.tsx');
fixMainFileEnds('pages/school/SchoolAcademicYear.tsx');
fixMainFileEnds('pages/school/SchoolStaff.tsx');
fixMainFileEnds('pages/school/SchoolDiscounts.tsx');
