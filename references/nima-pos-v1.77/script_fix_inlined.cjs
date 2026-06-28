const fs = require('fs');

function restoreModal(pageFile, modalName, condition) {
    if (!fs.existsSync(pageFile)) return;
    let code = fs.readFileSync(pageFile, 'utf8');
    
    // find the start of the modal (it was inlined so it starts with the <div> of the modal)
    // Wait, the inlining script replaced `<SchoolAcademicYearModal />` with the raw JSX from the component return.
    // The component return was `<div className="fixed inset-0...`
    // I can just find `<div className="fixed inset-0 ` and replace it!
    // But there are multiple modals!
    
}
