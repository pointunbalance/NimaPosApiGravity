const fs = require('fs');

const extractModals = (filename, componentPath, outPaths, baseProps) => {
    let data = fs.readFileSync(componentPath, 'utf8');
    let blocks = [];
    
    let lines = data.split('\n');
    let currentStart = -1;
    let currentCond = '';
    
    for (let i = 0; i < lines.length; i++) {
        let l = lines[i];
        if (l.match(/^\s*\{([a-zA-Z0-9_]+).*?&& \(/)) {
            currentStart = i;
            let m = l.match(/^\s*\{([a-zA-Z0-9_]+).*?&& \(/);
            currentCond = m[1];
        } else if (l.match(/^\s*\)\}\s*$/) || l.trim() === '</>') {
            if (currentStart !== -1) {
                blocks.push({
                    start: currentStart,
                    end: i,
                    cond: currentCond,
                    lines: lines.slice(currentStart + 1, i)
                });
                currentStart = -1;
            }
        }
    }
    console.log(componentPath, 'found blocks:', blocks.length);
    
    let mainLinesStr = blocks[0].lines.join('\n');
    let parentStr = fs.readFileSync(filename, 'utf8');
    
    for (let b = 1; b < blocks.length; b++) {
        let cName = outPaths[b-1].split('/').pop().replace('.tsx', '');
        let content = `import React from 'react';\nimport { X, Save, UserPlus, FileText, CheckCircle2, Map, Calendar, DollarSign, Users, ExternalLink, Download } from 'lucide-react';\n\nexport const ${cName} = (props: any) => {\nconst { ${blocks[b].cond}, setTransModalOpen, transFormData, setTransFormData, staff, handleSaveTrans, isReportOpen, setIsReportOpen, reportTripId, trips } = props;\nif (!${blocks[b].cond}) return null;\nreturn (\n<>\n` + 
          blocks[b].lines.join('\n') + 
          `\n</>\n);\n};\n`;
          
        fs.writeFileSync(outPaths[b-1], content);
        
        let injectStr = `\n            <${cName} ${blocks[b].cond}={${blocks[b].cond}} setTransModalOpen={setTransModalOpen} transFormData={transFormData} setTransFormData={setTransFormData} staff={staff} handleSaveTrans={handleSaveTrans} isReportOpen={isReportOpen} setIsReportOpen={setIsReportOpen} reportTripId={reportTripId} trips={trips} />`;
        
        parentStr = parentStr.replace('/>', '/>' + injectStr);
        let impStr = `import { ${cName} } from '../../components/school/${outPaths[b-1].split('/')[2]}/${cName}';\n`;
        
        let lastImport = parentStr.lastIndexOf('import ');
        let lastImportEnd = parentStr.indexOf('\n', lastImport);
        parentStr = parentStr.substring(0, lastImportEnd + 1) + impStr + parentStr.substring(lastImportEnd + 1);
    }
    
    fs.writeFileSync(filename, parentStr);
    
    let b0Code = `import React from 'react';\nimport { X, Save, UserPlus, FileText, CheckCircle2, Map, Calendar, DollarSign, Users } from 'lucide-react';\n\nexport const ${componentPath.split('/').pop().replace('.tsx', '')} = (props: any) => {\n   if (!props.${blocks[0].cond}) return null;\n   const { ${blocks[0].cond}, setIsModalOpen, handleSubmit, formData, setFormData, isEdit, supervisors } = props;\n   return (\n<>\n` + blocks[0].lines.join('\n') + `\n</>\n);\n};\n`;
    fs.writeFileSync(componentPath, b0Code);
}

extractModals('pages/school/SchoolStaff.tsx', 'components/school/staff/SchoolStaffModal.tsx', ['components/school/staff/SchoolStaffTransModal.tsx'], []);
extractModals('pages/school/SchoolTrips.tsx', 'components/school/trips/SchoolTripModal.tsx', ['components/school/trips/SchoolTripReportModal.tsx'], []);

console.log('done extracting multi-modals');
