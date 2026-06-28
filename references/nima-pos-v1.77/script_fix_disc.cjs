const fs = require('fs');

let a = fs.readFileSync('pages/school/SchoolDiscounts.tsx', 'utf8');

a = a.replace(/<>\n\s*<div className="fixed inset-0 z-\[100\] flex items-center justify-center p-4 bg-slate-900\/50 backdrop-blur-sm overflow-y-auto">/, 
`{isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">`);

a = a.replace(/          <\/div>\n        <\/div>\n    <\/div>\n  \);\n};\n\nexport default SchoolDiscounts;\n/,
`          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolDiscounts;
`);

fs.writeFileSync('pages/school/SchoolDiscounts.tsx', a);
console.log('Fixed SchoolDiscounts');
