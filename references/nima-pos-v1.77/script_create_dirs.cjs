const fs = require('fs');
const path = require('path');

fs.mkdirSync('components/school/staff', { recursive: true });
fs.mkdirSync('components/school/admissions', { recursive: true });
fs.mkdirSync('components/school/meals', { recursive: true });
console.log('Dirs created');
