// scripts/generate-index.js
const fs = require('fs');
const path = require('path');
const contentDir = path.join(__dirname, '..', 'content');
const outFile = path.join(contentDir, 'index.json');

const files = fs.readdirSync(contentDir)
  .filter(f => f.toLowerCase().endsWith('.md'))
  .sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));

fs.writeFileSync(outFile, JSON.stringify(files, null, 2)+"\n");
console.log(`Wrote ${files.length} entries to ${outFile}`);
