const fs = require('fs');
const file = 'src/store/useTemplateStore.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /targetScreen: 'home' \| 'upload' \| 'editor' \| 'templates' \| 'nida' \| 'preview' \| 'downloads' \| 'driving_license',\n    serviceId\?: string\n  \) => void;/,
  "targetScreen: 'home' | 'upload' | 'editor' | 'templates' | 'nida' | 'preview' | 'downloads' | 'driving_license',\n    serviceId?: string,\n    bypassDraftRestore?: boolean\n  ) => void;"
);

const navDefStart = "navigateSafely: (targetScreen, serviceId) => {";
const navDefEnd = "navigateSafely: (targetScreen, serviceId, bypassDraftRestore) => {";
content = content.replace(navDefStart, navDefEnd);

const ifFinalEditorTarget = `if (finalTarget === 'editor') {
          get().restoreStudioDraft(serviceId || get().activeServiceId);
        }`;

const ifFinalEditorReplacement = `if (finalTarget === 'editor' && !bypassDraftRestore) {
          get().restoreStudioDraft(serviceId || get().activeServiceId);
        }`;

content = content.replace(ifFinalEditorTarget, ifFinalEditorReplacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched useTemplateStore.ts for navigateSafely');
