const fs = require('fs');
const path = require('path');

function findSmallFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findSmallFiles(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (stat.size < 2000) {
        console.log(fullPath);
      }
    }
  }
}

findSmallFiles(path.join(__dirname, 'pages'));
