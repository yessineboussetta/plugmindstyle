// copy-plugin-files.js
import fs from 'fs';
import path from 'path';

const dist = path.resolve('dist');
const target = path.resolve('plugmind-chatbot');

if (!fs.existsSync(target)) {
  fs.mkdirSync(target);
}

// List of plugin files to copy
const files = ['plugmind-chat.js', 'plugmind-style.css', 'plugmind-chat.php'];
files.forEach(file => {
  const from = path.join(dist, file);
  const to = path.join(target, file);

  if (fs.existsSync(from)) {
    fs.copyFileSync(from, to);
    console.log(`✅ Copied ${file} to plugmind-chatbot`);
  } else {
    console.warn(`⚠️ File not found: ${file}`);
  }
});
