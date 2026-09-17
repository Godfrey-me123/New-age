const fs = require('fs');
const file = 'src/store/useTemplateStore.ts';
let content = fs.readFileSync(file, 'utf8');

const target1 = `    await saveTemplateDB(sanitized);
    set({ currentTemplate: template, hasUnsavedChanges: false });
    get().saveStudioDraft();`;

const replacement1 = `    await saveTemplateDB(sanitized);
    set({ currentTemplate: template, hasUnsavedChanges: false });
    get().saveStudioDraft();
    await get().loadSavedTemplates();`;

content = content.replace(target1, replacement1);

const target2 = `    await saveTemplateDB(newTpl);
    set({ currentTemplate: newTpl, hasUnsavedChanges: false });
    get().saveStudioDraft();
    return newTpl;`;

const replacement2 = `    await saveTemplateDB(newTpl);
    set({ currentTemplate: newTpl, hasUnsavedChanges: false });
    get().saveStudioDraft();
    await get().loadSavedTemplates();
    return newTpl;`;

content = content.replace(target2, replacement2);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched save functions');
