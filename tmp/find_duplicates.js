const fs = require('fs');
const content = fs.readFileSync('c:\\Projects\\Quantmind Application\\QuantMind\\apps\\web\\src\\lib\\i18n.ts', 'utf8');

const languages = ['ENGLISH_INTL', 'DEUTSCH_EU', 'FRENCH_EU', 'ESPANOL_EU'];

languages.forEach(lang => {
    const regex = new RegExp(`${lang}: \\{([\\s\\S]*?)\\},`, 'g');
    const match = regex.exec(content);
    if (match) {
        const body = match[1];
        const keys = body.match(/'([^']+)'|([^:]+):/g);
        if (keys) {
            const seen = new Set();
            keys.forEach(k => {
                const key = k.replace(/[':]/g, '').trim();
                if (key && seen.has(key)) {
                    console.log(`Duplicate key in ${lang}: ${key}`);
                }
                seen.add(key);
            });
        }
    }
});
