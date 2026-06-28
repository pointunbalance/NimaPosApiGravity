const fs = require('fs');

let a = fs.readFileSync('pages/school/SchoolAdmissions.tsx', 'utf8');

a = a.replace(/<>\n\s*<div className="fixed inset-0 z-\[100\] flex items-center justify-center p-4 bg-slate-900\/50 backdrop-blur-sm overflow-y-auto">\n\s*<div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">/, 
`{isCreateModalOpen && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-8">`);

a = a.replace(/<\/form>\n\s*<\/div>\n\s*<\/div>\n\s*<>\n\s*<div className="fixed inset-0 z-\[100\] flex items-center justify-center p-4 bg-slate-900\/50 backdrop-blur-sm overflow-y-auto">/,
`</form>
                    </div>
                </div>
            )}

            {isFollowupModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">`);

a = a.replace(/                <\/div>\n        <\/div>\n    \);\n};\n\nexport default SchoolAdmissions;\n/,
`                </div>
            )}
        </div>
    );
};

export default SchoolAdmissions;
`);

fs.writeFileSync('pages/school/SchoolAdmissions.tsx', a);
console.log('Fixed SchoolAdmissions');
