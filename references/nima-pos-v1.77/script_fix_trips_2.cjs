// Trip
const fs = require('fs');
let s = fs.readFileSync('pages/school/SchoolTrips.tsx', 'utf8');
s = s.replace(/childCost={0} transportCost=/g, 'capacity=');
s = s.replace(/childCost=/g, 'cost=');
s = s.replace(/supervisorIds/g, 'supervisorId');
s = s.replace(/supervisorId=/g, 'supervisors=');
s = s.replace(/supervisorId={supervisors}/g, 'supervisors={supervisors}');
fs.writeFileSync('pages/school/SchoolTrips.tsx', s);
