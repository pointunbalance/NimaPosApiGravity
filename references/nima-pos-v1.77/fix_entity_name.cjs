const fs = require('fs');
const glob = require('glob'); // Not available, let's just use raw node

const files = [
  'pages/RealEstateStaff.tsx',
  'pages/garage/GarageStaff.tsx',
  'pages/gym/GymStaff.tsx',
  'pages/hotel/HotelStaff.tsx',
  'pages/legal/LegalStaff.tsx',
  'pages/manufacturing/ManufacturingStaff.tsx',
  'pages/school/SchoolStaff.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  content = content.replace(/\$\{entityName\}/g, 'موظف');
  fs.writeFileSync(file, content);
});
console.log('Fixed entityName in Staff files');
