const fs = require('fs');

const file = 'src/utils/sampleTemplates.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/placeholderType: 'barcode'/g, "placeholderType: 'badge'");
content = content.replace(/placeholderKey: 'barcode'/g, "placeholderKey: 'barcode'");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed barcode placeholder type');
