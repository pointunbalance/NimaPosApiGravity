const fs = require('fs');

let a = fs.readFileSync('pages/school/SchoolMeals.tsx', 'utf8');

a = a.replace(/<>\n\s*<div className="fixed inset-0 z-\[100\] flex items-center justify-center p-4 bg-slate-900\/50 backdrop-blur-sm overflow-y-auto">\n\s*<div className="bg-white rounded-3xl w-full max-w-md shadow-2xl my-8">/, 
`{isScheduleModalOpen && (
                 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl my-8">`);

a = a.replace(/<\/form>\n\s*<\/div>\n\s*<\/div>\n\n\s*\{\/\* Restrictions Modal \*\/\}\n\s*<>\n\s*<div className="fixed inset-0 z-\[100\] flex items-center justify-center p-4 bg-slate-900\/50 backdrop-blur-sm overflow-y-auto">/,
`</form>
                    </div>
                </div>
            )}

            {/* Restrictions Modal */}
            {isRestrictionModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">`);

a = a.replace(/                <\/div>\n        <\/div>\n    \);\n};\n\nexport default SchoolMeals;\n/,
`                </div>
            )}
        </div>
    );
};

export default SchoolMeals;
`);

fs.writeFileSync('pages/school/SchoolMeals.tsx', a);
console.log('Fixed SchoolMeals');
