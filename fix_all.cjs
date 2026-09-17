const fs = require('fs');

const tsFile = 'src/utils/templateMappingEngine.ts';
let content = fs.readFileSync(tsFile, 'utf8');

content = content.replace(
  /  \| 'PIN_NUMBER';/,
  "  | 'PIN_NUMBER'\n  | 'LICENCE_NUMBER';"
);

fs.writeFileSync(tsFile, content, 'utf8');

const previewFile = 'src/components/CardPreviewScreen.tsx';
let previewContent = fs.readFileSync(previewFile, 'utf8');
previewContent = previewContent.replace(/Tanzania NIDA/g, 'National ID');
fs.writeFileSync(previewFile, previewContent, 'utf8');

console.log('Fixed TS issues');
