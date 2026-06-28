const fs = require('fs');

let s = fs.readFileSync('pages/school/SchoolStaff.tsx', 'utf8');

// Replace the mis-inserted trans modal
let transModalStart = s.indexOf('            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">\n                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">');

if (transModalStart !== -1) {
    let before = s.substring(0, transModalStart);
    let afterStart = s.indexOf('                 </div> سجل الموظفين\n                </button>', transModalStart);
    if(afterStart !== -1) {
        s = before + '                سجل الموظفين\n                </button>' + s.substring(afterStart + 66);
    }
}

// Replace DIRECTORY MODAL
let dirModalStart = s.indexOf('{/* DIRECTORY MODAL */}');
if (dirModalStart !== -1) {
    let beforeDir = s.substring(0, dirModalStart);
    let dirModalEndStr = '</div>\n        </div>';
    let endIdx = s.lastIndexOf(dirModalEndStr);
    if(endIdx !== -1) {
       s = beforeDir + `
            <SchoolStaffDirectoryModal 
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                isEdit={isEdit}
                formData={formData}
                setFormData={setFormData}
                handleSave={handleSave}
            />
            <SchoolStaffTransactionModal
                transModalOpen={transModalOpen}
                setTransModalOpen={setTransModalOpen}
                transFormData={transFormData}
                setTransFormData={setTransFormData}
                handleSaveTrans={handleSaveTrans}
                staff={staff}
            />
        </div>
    );
};

export default SchoolStaff;
`;
    }
}

let imports = `import { SchoolStaffDirectoryModal } from '../../components/school/staff/SchoolStaffDirectoryModal';\nimport { SchoolStaffTransactionModal } from '../../components/school/staff/SchoolStaffTransactionModal';\n`;
if (!s.includes('SchoolStaffDirectoryModal')) {
    s = s.replace(/import React/, imports + 'import React');
}

fs.writeFileSync('pages/school/SchoolStaff.tsx', s);
console.log('Fixed Staff');
