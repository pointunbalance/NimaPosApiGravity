const fs = require('fs');
const code = fs.readFileSync('App.tsx', 'utf8');
const regex = /import\(['"]\.\/([^'"]+)['"]\)/g;
let match;
const missing = [];
while ((match = regex.exec(code)) !== null) {
  const path = match[1] + '.tsx';
  if (!fs.existsSync(path)) missing.push(path);
}
console.log("Missing files:", missing);
