const fs = require('fs');

const tsFile = 'src/utils/templateMappingEngine.ts';
let content = fs.readFileSync(tsFile, 'utf8');

content = content.replace(
  /    PIN_NUMBER: 'pinNumber',/g,
  "    PIN_NUMBER: 'pinNumber',\n    LICENCE_NUMBER: 'licenceNumber',"
);

fs.writeFileSync(tsFile, content, 'utf8');

console.log('Fixed map');
