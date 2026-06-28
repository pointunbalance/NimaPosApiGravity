const fs = require('fs');

let a = fs.readFileSync('pages/school/SchoolAcademicYear.tsx', 'utf8');

// Replace line 290 `<>` with `{isModalOpen && (`
a = a.replace(/<>\n\s*<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900\/50 backdrop-blur-sm overflow-y-auto">/, 
`{isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">`);

// Replace line 371 `<>` with the end of the map and modal 1, and the start of modal 2
a = a.replace(/<>\n\s*<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900\/50 backdrop-blur-sm">/, 
`                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">إلغاء</button>
                                    <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md">حفظ التعديلات</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPromoteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">`);

// Fix end
a = a.replace(/                <\/div>\n        <\/div>\n    \);\n};\n\nexport default SchoolAcademicYear;\n/,
`                </div>
            )}
        </div>
    );
};

export default SchoolAcademicYear;
`);

fs.writeFileSync('pages/school/SchoolAcademicYear.tsx', a);
console.log('Fixed SchoolAcademicYear');
