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
    'pages/Rentals.tsx',
    'pages/restaurant/pos/RestaurantPOS.tsx',
];

for (const file of targetFiles) {
    const fullPath = path.resolve(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        // Replace single quoted data:image with double quoted data:image
        content = content.replace(/'data:image\/svg\+xml,%3Csvg xmlns='http:\/\/www\.w3\.org\/2000\/svg'[^']+'/g, (match) => {
             // replace the wrapping single quotes with double quotes
             // match is: 'data:... '
             return '"' + match.substring(1, match.length - 1) + '"';
        });
        fs.writeFileSync(fullPath, content);
        console.log(`Replaced string quotes in ${file}`);
    }
}
