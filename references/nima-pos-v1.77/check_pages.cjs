const fs = require('fs');
const path = require('path');

function getFiles(dir, filesList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, filesList);
    } else if (filePath.endsWith('.tsx')) {
      filesList.push(filePath);
    }
  }
  return filesList;
}

const allFiles = getFiles('pages');
const smallFiles = [];
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n').length;
  if (lines < 150) {
    smallFiles.push({ file, lines });
  }
}
console.log(JSON.stringify(smallFiles.sort((a,b) => a.lines - b.lines), null, 2));
