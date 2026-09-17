const fs = require('fs');
const file = 'src/utils/templateMappingEngine.ts';
let content = fs.readFileSync(file, 'utf8');

const replaceAllTokensImpl = `
export function replaceAllTokens(layer: Layer, formData: any): Layer {
  if (layer.type !== 'text') return layer;
  let text = (layer as any).text || '';
  if (!text.includes('{{')) return layer;

  const fVal = (formData.firstName || '').trim();
  const mVal = (formData.middleName || '').trim();
  const lVal = (formData.lastName || formData.surname || '').trim();
  const dob = (formData.dob || formData.dateOfBirth || '').trim();
  const gender = (formData.gender || '').trim().toUpperCase().startsWith('M') ? 'M' : 'F';
  const nida = (formData.nidaNumber || formData.licenceNumber || '').trim();
  const issue = (formData.issueDate || formData.dateOfIssue || '').trim();
  const expiry = (formData.expiryDate || formData.dateOfExpiry || '').trim();
  const auth = (formData.issuingAuthority || '').trim();
  const region = (formData.region || '').trim();
  const pin = (formData.pinNumber || '').trim();
  const licence = (formData.licenceNumber || formData.nidaNumber || '').trim();

  text = text.replace(/\\{\\{(?:first_middle_name|first_name_middle_name|display_name_line1)\\}\\}/gi, \`\${fVal} \${mVal}\`.trim());
  text = text.replace(/\\{\\{(?:first_name|firstname|given_name|given_names|fname)\\}\\}/gi, fVal);
  text = text.replace(/\\{\\{(?:middle_name|middlename|other_names|mname)\\}\\}/gi, mVal);
  text = text.replace(/\\{\\{(?:last_name|lastname|surname|family_name|lname)\\}\\}/gi, lVal);
  text = text.replace(/\\{\\{(?:dob|date_of_birth|birth_date)\\}\\}/gi, dob);
  text = text.replace(/\\{\\{(?:gender|sex|jinsia|jinsi)\\}\\}/gi, gender);
  text = text.replace(/\\{\\{(?:nida_number|nida|id_number|national_id|nin)\\}\\}/gi, nida);
  text = text.replace(/\\{\\{(?:issue_date|date_of_issue)\\}\\}/gi, issue);
  text = text.replace(/\\{\\{(?:expiry_date|date_of_expiry)\\}\\}/gi, expiry);
  text = text.replace(/\\{\\{(?:issuing_authority|authority)\\}\\}/gi, auth);
  text = text.replace(/\\{\\{(?:region|residence|place_of_residence)\\}\\}/gi, region);
  text = text.replace(/\\{\\{(?:pin_number|pin)\\}\\}/gi, pin);
  text = text.replace(/\\{\\{(?:licence_number|license_number|licence|license|dl_no)\\}\\}/gi, licence);

  return { ...layer, text } as any;
}

export function injectValueIntoLayer(
`;

content = content.replace('export function injectValueIntoLayer(', replaceAllTokensImpl);

const licenceNumberCase = `      case 'LICENCE_NUMBER': {
        const val = ((formData as any).licenceNumber || formData.nidaNumber || '').trim();
        if (text.includes('{{')) {
          text = text.replace(/\\{\\{(?:licence_number|license_number|licence|license|dl_no)\\}\\}/gi, val);
        } else {
          text = val;
        }
        break;
      }
      case 'NIDA_NUMBER':`;

content = content.replace("      case 'NIDA_NUMBER':", licenceNumberCase);

fs.writeFileSync(file, content, 'utf8');
console.log('Added replaceAllTokens and LICENCE_NUMBER case');
