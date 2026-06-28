import * as fs from 'fs';

const appTsx = fs.readFileSync('App.tsx', 'utf8');
const lazyMatches = [...appTsx.matchAll(/lazy\(\(\) => import\("\.\/([^"]+)"\)/g)];

for (const match of lazyMatches) {
  let file = `${match[1]}.tsx`;
  // Need to handle if they use .tsx or nothing
  if (file.endsWith('.tsx.tsx')) {
    file = file.slice(0, -4);
  }
  if (!fs.existsSync(file)) {
    console.log(`Missing: ${file}`);
  }
}
