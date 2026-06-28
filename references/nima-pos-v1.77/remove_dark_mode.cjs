const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? 
            walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

function processFiles() {
    const rootDirs = ['components', 'pages', 'context', 'services'];
    const filesToProcess = ['App.tsx', 'Layout.tsx', 'index.tsx', 'components/layout/Sidebar.tsx', 'components/layout/Header.tsx'];

    rootDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            walkDir(dir, (filePath) => {
                if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
                    filesToProcess.push(filePath);
                }
            });
        }
    });

    // Make array unique
    const uniqueFiles = [...new Set(filesToProcess)];

    uniqueFiles.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            let content = fs.readFileSync(filePath, 'utf8');
            // Remove 'dark:xxx ' or ' dark:xxx' 
            // The regex matches `dark:` followed by any valid tailwind class characters
            let newContent = content.replace(/\s?dark:[a-zA-Z0-9\-/\\[\]\#:]+\s?/g, (match) => {
                // Return a single space if it was surrounded by spaces, else nothing if it was at the edge
                if (match.startsWith(' ') && match.endsWith(' ')) return ' ';
                if (match.startsWith(' ') || match.endsWith(' ')) return '';
                return '';
            });

            // Re-run to handle adjacent classes correctly that might have overlapped in regex
            newContent = newContent.replace(/\s?dark:[a-zA-Z0-9\-/\\[\]\#:]+\s?/g, (match) => {
                if (match.startsWith(' ') && match.endsWith(' ')) return ' ';
                if (match.startsWith(' ') || match.endsWith(' ')) return '';
                return '';
            });

            if (content !== newContent) {
                fs.writeFileSync(filePath, newContent);
                console.log(`Removed dark classes from ${filePath}`);
            }
        }
    });
}

processFiles();
