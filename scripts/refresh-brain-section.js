const fs = require('fs');
const path = require('path');

const repo = process.env.BRAIN_REPO || '/root/.hermes/home/imports/miles-brain';
const indexPath = path.join(process.cwd(), 'index.html');

function read(rel) {
  return fs.readFileSync(path.join(repo, rel), 'utf8');
}

function firstMatch(text, regex, fallback = '') {
  const match = text.match(regex);
  return match ? match[1].trim() : fallback;
}

function markdownBullets(block) {
  const out = [];
  let current = null;
  for (const line of block.split('\n')) {
    if (line.startsWith('- ')) {
      if (current) out.push(current.trim());
      current = line.slice(2).trim();
    } else if (current && /^\s+\S/.test(line)) {
      current += ' ' + line.trim();
    }
  }
  if (current) out.push(current.trim());
  return out.map(item => item.replace(/\.$/, ''));
}

function bulletsBetween(text, heading, nextHeading) {
  const start = text.indexOf(heading);
  if (start === -1) return [];
  const end = nextHeading ? text.indexOf(nextHeading, start + heading.length) : -1;
  const block = text.slice(start, end === -1 ? undefined : end);
  return block
    .split('\n')
    .filter(line => line.startsWith('- `'))
    .map(line => line.replace(/^- `([^`]+)`.*$/, '$1'))
    .filter(Boolean);
}

const reading = read('readings/old-profile-reading-signals.md');
const profile = read('personal/profile.md');
const taste = read('personal/taste-and-drift.md');

const clusters = markdownBullets(firstMatch(
  reading,
  /The recurring clusters are:\n\n([\s\S]*?)\n\nSource:/,
  '- Systems and complexity.\n- Technology history and semiconductor geopolitics.\n- Founder/operator stories.'
)).join('; ');

const books = bulletsBetween(reading, 'Systems, technology, and future-making:', 'Founder/operator').slice(0, 5);
const interests = firstMatch(
  profile,
  /He is drawn to ([\s\S]*?)\. The current\nthrough-line/,
  'robotics, electronics, embedded systems, AI systems, culture and technology, future computing paradigms, and personal AI systems'
).replace(/\s+/g, ' ');
const tasteSignals = markdownBullets(firstMatch(
  taste,
  /Miles prefers systems that feel:\n\n([\s\S]*?)\n\nSource:/,
  '- calm rather than noisy\n- structured but not dashboard-heavy\n- provenance-rich and inspectable'
)).slice(0, 4).join('; ');

const bookHtml = books.map(title => `<em>${title}</em>`).join(', ');
const html = `<!-- BRAIN_SECTION_START -->
          <h2>Reading / taste signal</h2>
          <p><strong>From GBrain:</strong> ${clusters}.</p>
          <p>${bookHtml}.</p>
          <h2 style="margin-top:1.7rem">Learning / current interests</h2>
          <p>${interests}.</p>
          <p class="muted">Taste notes from GBrain: ${tasteSignals}.</p>
          <!-- BRAIN_SECTION_END -->`;

const current = fs.readFileSync(indexPath, 'utf8');
const markerRegex = /<!-- BRAIN_SECTION_START -->[\s\S]*?<!-- BRAIN_SECTION_END -->/;
if (!markerRegex.test(current)) {
  throw new Error('Could not find brain section markers in index.html');
}
const next = current.replace(markerRegex, html);
fs.writeFileSync(indexPath, next);
console.log(`Updated brain-derived section from ${repo}`);
