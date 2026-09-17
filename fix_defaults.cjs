const fs = require('fs');

// Fix DrivingLicenseFormScreen.tsx
const dlFile = 'src/components/nida/DrivingLicenseFormScreen.tsx';
let dlContent = fs.readFileSync(dlFile, 'utf8');
dlContent = dlContent.replace(
  /SAMPLE_TEMPLATES\.find\(\(t\) => t\.id === 'sample_driving_license'\)/g,
  "SAMPLE_TEMPLATES.find((t) => t.id === 'sample_driving_license_front')"
);
fs.writeFileSync(dlFile, dlContent, 'utf8');

// Fix CardPreviewScreen.tsx
const cpFile = 'src/components/CardPreviewScreen.tsx';
let cpContent = fs.readFileSync(cpFile, 'utf8');
cpContent = cpContent.replace(
  /t\.id === 'sample_nida_front'/g,
  "t.id === 'sample_tanzania_nida_front'"
);
cpContent = cpContent.replace(
  /t\.id === 'sample_nida_back'/g,
  "t.id === 'sample_tanzania_nida_back'"
);
fs.writeFileSync(cpFile, cpContent, 'utf8');

console.log('Fixed default fallback IDs');
