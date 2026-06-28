const fs = require('fs');
const path = require('path');

const targetFiles = [
    'src/pages/RestaurantPOS.tsx',
    'src/pages/PublicWebsite.tsx',
    'src/pages/RestaurantMenu.tsx',
    'src/pages/WebsiteCMS.tsx',
    'src/pages/Rentals.tsx',
    'pages/RestaurantPOS.tsx',
    'pages/PublicWebsite.tsx',
    'pages/RestaurantMenu.tsx',
    'pages/WebsiteCMS.tsx',
    'pages/Rentals.tsx'
];

const svgPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%2394a3b8'%3Eصورة%3C/text%3E%3C/svg%3E";

for (const file of targetFiles) {
    const fullPath = path.resolve(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = content.replace(/'https:\/\/images\.unsplash\.com[^']+'/g, `'${svgPlaceholder}'`);
        fs.writeFileSync(fullPath, content);
        console.log(`Replaced unsplash links in ${file}`);
    }
}
