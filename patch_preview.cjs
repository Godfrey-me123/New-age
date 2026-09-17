const fs = require('fs');
const file = 'src/components/CardPreviewScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStudioBtn = `onClick={() => setActiveScreen('editor')}`;
const replacementStudioBtn = `onClick={() => {
                  const { customTemplates, activeServiceId, setCurrentTemplate } = useTemplateStore.getState();
                  const serviceTemplates = activeServiceId === 'driving_license' ? 
                    { 
                      front: customTemplates.find(t => t.cardType === 'Driving License' && (t.side === 'Front Side' || !t.side?.toLowerCase().includes('back'))) || SAMPLE_TEMPLATES.find(t => t.id === 'sample_driving_license_front'),
                      back: customTemplates.find(t => t.cardType === 'Driving License' && (t.side === 'Back Side' || t.side?.toLowerCase().includes('back'))) || SAMPLE_TEMPLATES.find(t => t.id === 'sample_driving_license_back')
                    } : {
                      front: customTemplates.find(t => t.cardType === 'Tanzania NIDA' && (t.side === 'Front Side' || !t.side?.toLowerCase().includes('back'))) || SAMPLE_TEMPLATES.find(t => t.id === 'sample_nida_front'),
                      back: customTemplates.find(t => t.cardType === 'Tanzania NIDA' && (t.side === 'Back Side' || t.side?.toLowerCase().includes('back'))) || SAMPLE_TEMPLATES.find(t => t.id === 'sample_nida_back')
                    };
                  
                  const rawTemplate = activeSide === 'front' ? serviceTemplates.front : serviceTemplates.back;
                  if (rawTemplate) {
                    setCurrentTemplate(rawTemplate);
                  }
                  useTemplateStore.getState().navigateSafely('editor', undefined, true);
                }}`;

content = content.replace(/onClick=\{\(\) => setActiveScreen\('editor'\)\}/g, replacementStudioBtn);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched CardPreviewScreen.tsx');
