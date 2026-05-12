const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const required = [
  'systems engineer with receipts',
  'firmware systems engineer at Matic Robotics',
  'Tesla wireless systems',
  'GBrain',
  'How I work',
  'public-safe'
];
for (const marker of required) {
  if (!html.includes(marker)) {
    console.error(`Missing marker: ${marker}`);
    process.exit(1);
  }
}
if ((html.match(/<a\s/gi) || []).length < 4) {
  console.error('Expected at least four links');
  process.exit(1);
}
console.log('site markers ok');
