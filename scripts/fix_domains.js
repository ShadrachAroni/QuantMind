const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /quantmind\.io/g, to: 'quantmind.co.ke' },
];

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  console.log(`Checking: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const replacement of replacements) {
    content = content.replace(replacement.from, replacement.to);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

// Targeted files that might have hardcoded domains
const files = [
  'apps/web/src/lib/i18n.ts',
  'apps/mobile/src/lib/i18n.ts',
  'supabase/functions/_shared/email.ts',
  'apps/web/src/app/api/ai/chat/route.ts',
  'supabase/functions/ai-chat/index.ts',
];

files.forEach(file => {
  processFile(path.resolve('c:/Projects/Quantmind Application/QuantMind', file));
});
