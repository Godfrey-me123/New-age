const fs = require('fs');

const file = 'src/utils/templateMappingEngine.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add LICENCE_NUMBER to SupportedBinding
content = content.replace(
  /'PIN_NUMBER' \| 'DRIVING_LICENCE_CATEGORIES';/,
  "'PIN_NUMBER' | 'DRIVING_LICENCE_CATEGORIES' | 'LICENCE_NUMBER';"
);

// 2. Add LICENCE_NUMBER to getLayerBinding token regexes
content = content.replace(
  /if \(\/\{\{\(?:pin_number\|pin\)\}\}\/i\.test\(text\)\) return 'PIN_NUMBER';/,
  "if (/\\{\\{(?:pin_number|pin)\\}\\}/i.test(text)) return 'PIN_NUMBER';\n    if (/\\{\\{(?:licence_number|license_number|licence|license|dl_no)\\}\\}/i.test(text)) return 'LICENCE_NUMBER';"
);

// 3. Add LICENCE_NUMBER to getLayerBinding explicit field regexes
content = content.replace(
  /if \(\/pin_\\?number\|pin\/i\.test\(explicitField\)\) return 'PIN_NUMBER';/,
  "if (/pin_?number|pin/i.test(explicitField)) return 'PIN_NUMBER';\n    if (/licence_?number|license_?number|dl_?no/i.test(explicitField)) return 'LICENCE_NUMBER';"
);

// 4. Update fallback logic in applyTemplateMapping
const applyMappingTarget = `    } else {
      // Process token replacements on unbound layers for both front and back templates
      const injected = injectValueIntoLayer(layer, 'FIRST_NAME' as any, formData, sanitizedTemplate.layers);
      clonedLayers.push(injected);
      skippedCount++;
    }`;

const applyMappingReplacement = `    } else {
      // Unbound layers should simply be left alone, or just have strict token replacement.
      // We will perform a generic token replacement for known placeholders just in case,
      // without doing destructive fallback overrides.
      const injected = replaceAllTokens(layer, formData);
      clonedLayers.push(injected);
      skippedCount++;
    }`;

content = content.replace(applyMappingTarget, applyMappingReplacement);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed getLayerBinding and applyTemplateMapping');
