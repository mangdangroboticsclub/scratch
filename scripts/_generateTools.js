const fs = require('fs');
const path = require('path');

const toolsDir = path.join(__dirname, 'tools');
const outputFile = path.join(toolsDir, 'list.json');

// Recursively find all .json files (excluding list.json itself) and group by category/subcategory (subfolders)
function getCategoryFiles(dir, baseDir = dir) {
  let categories = {};
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const relPath = path.relative(baseDir, filePath).replace(/\\/g, '/');
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      const subFiles = getCategoryFiles(filePath, baseDir);
      if (Object.keys(subFiles).length > 0) {
        categories[file] = subFiles;
      }
    } else if (
      file.endsWith('.json') &&
      file !== 'list.json' &&
      file.charAt(0) !== '_' // Exclude hidden files
    ) {
      if (!categories.files) categories.files = [];
      categories.files.push('scripts/tools/' + relPath);
    }
  });
  return categories;
}

const categories = getCategoryFiles(toolsDir);

fs.writeFileSync(outputFile, JSON.stringify(categories, null, 2));
console.log('Nested category tool list generated.');