const fs = require('fs');

const tsFile = 'src/utils/templateMappingEngine.ts';
let content = fs.readFileSync(tsFile, 'utf8');

// Inside validatePopulatedTemplate, add tracking for injectedLicenceNumber
content = content.replace(
  /let injectedGender: string \| null = null;/,
  "let injectedGender: string | null = null;\n  let injectedLicenceNumber: string | null = null;\n  const licenceNumber = ((formData as any).licenceNumber || formData.nidaNumber || '').trim().toUpperCase();"
);

// Collect injectedLicenceNumber
content = content.replace(
  /      \} else if \(binding === 'GENDER'\) \{\n        injectedGender = text;\n      \}/,
  "      } else if (binding === 'GENDER') {\n        injectedGender = text;\n      } else if (binding === 'LICENCE_NUMBER' || binding === 'NIDA_NUMBER') {\n        injectedLicenceNumber = text;\n      }"
);

// Add validation check
const collisionCheck = `  if (firstName && gender && firstName !== gender && injectedGender) {`;
const licenceNumberCheck = `
  if (firstName && licenceNumber && firstName !== licenceNumber && injectedLicenceNumber) {
    if (injectedLicenceNumber.includes(firstName)) {
      return {
        valid: false,
        error: \`Field Mapping Validation Error: First Name ('\${firstName}') was incorrectly injected into Licence Number field ('\${injectedLicenceNumber}'). Expected '\${licenceNumber}'.\`,
        warnings: [\`Licence Number layer received '\${injectedLicenceNumber}' instead of '\${licenceNumber}'\`],
      };
    }
  }

  if (firstName && gender && firstName !== gender && injectedGender) {`;

content = content.replace(collisionCheck, licenceNumberCheck);

fs.writeFileSync(tsFile, content, 'utf8');
console.log('Fixed validation');
