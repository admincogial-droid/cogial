const fs = require('fs');
const path = require('path');

const replacements = {
  'bg-ink-950': 'bg-brand-white',
  'bg-ink-900': 'bg-brand-cloud',
  'bg-ink-800': 'bg-brand-white',
  'bg-ink-800/50': 'bg-brand-white',
  'border-ink-800': 'border-brand-slate/20',
  'border-ink-700': 'border-brand-slate/20',
  'border-ink-600': 'border-brand-slate/30',
  'text-paper-100': 'text-brand-navy',
  'text-paper-200': 'text-brand-ink',
  'text-paper-300': 'text-brand-slate',
  'text-paper-400': 'text-brand-slate',
  'text-paper-300/75': 'text-brand-slate',
  'text-paper-300/80': 'text-brand-slate',
  'text-paper-300/85': 'text-brand-slate',
  'text-paper-400/70': 'text-brand-slate',
  'text-paper-400/60': 'text-brand-slate',
  'text-brass-400': 'text-brand-violet',
  'text-brass-500': 'text-brand-violet',
  'bg-brass-500': 'bg-brand-violet',
  'bg-brass-400': 'bg-brand-violet/90',
  'hover:bg-brass-400': 'hover:bg-brand-violet/90',
  'border-brass-500': 'border-brand-violet',
  'border-brass-500/50': 'border-brand-violet/50',
  'border-brass-500/40': 'border-brand-violet/40',
  'shadow-brass-500/10': 'shadow-brand-violet/10',
  'shadow-brass-500/20': 'shadow-brand-violet/20',
  'text-teal-400': 'text-brand-violet',
  'text-teal-500': 'text-brand-violet',
  'bg-teal-500/10': 'bg-brand-lavender',
  'border-teal-500/30': 'border-brand-violet/20',
  'text-ink-950': 'text-brand-white',
  'font-display': 'font-heading',
  'shadow-xl': 'shadow-card',
  'Pressline': 'Cogial'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      // Simple string replacements for exact classes
      for (const [oldClass, newClass] of Object.entries(replacements)) {
        // use global regex to replace all occurrences, being careful with word boundaries for classes
        const regex = new RegExp(`\\b${oldClass.replace(/[\/\.]/g, '\\$&')}\\b`, 'g');
        content = content.replace(regex, newClass);
      }
      
      // Also replace just the word Pressline everywhere
      content = content.replace(/Pressline/g, 'Cogial');
      content = content.replace(/pressline/g, 'cogial');
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory('./src');
