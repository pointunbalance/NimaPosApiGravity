import * as fs from "fs";
import * as path from "path";

const EXCLUDE_DIRS = ["node_modules", "dist", ".git", "public", "chat_logs"];

function checkDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        checkDirectory(fullPath);
      }
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n").length;
      if (lines > 300) {
        console.log(`${fullPath} has ${lines} lines`);
      }
    }
  }
}

// Check root level files
const rootFiles = fs.readdirSync(".");
for (const file of rootFiles) {
  const stat = fs.statSync(file);
  if (stat.isFile() && (file.endsWith(".ts") || file.endsWith(".tsx"))) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n").length;
    if (lines > 300) {
      console.log(`./${file} has ${lines} lines`);
    }
  }
}

// Check other directories
checkDirectory("pages");
checkDirectory("components");
