const fs = require('fs');
const file = 'src/components/nida/DrivingLicenseFormScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  useEffect(() => {
    // 1. Prefer custom universal templates saved by Admin if present
    const customFront = customTemplates.find((t) => t.cardType === 'Driving License' && (t.side === 'Front Side' || !t.side?.toLowerCase().includes('back')));`;

const replacement = `  useEffect(() => {
    // Ensure we have the latest templates loaded
    useTemplateStore.getState().loadSavedTemplates();
  }, []);

  useEffect(() => {
    // 1. Prefer custom universal templates saved by Admin if present
    const customFront = customTemplates.find((t) => t.cardType === 'Driving License' && (t.side === 'Front Side' || !t.side?.toLowerCase().includes('back')));`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('Patched DL form screen to load templates');
