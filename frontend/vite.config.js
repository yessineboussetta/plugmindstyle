// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/embed-widget.jsx'),
      name: 'PlugmindChat',
      fileName: () => 'plugmind-chat.js',
      formats: ['iife'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
  },
  define: {
    'process.env': {},
  },
  // ✅ Custom hook to copy files after build
  buildEnd() {
    const distDir = path.resolve(__dirname, 'dist');
    const pluginDir = path.resolve(__dirname, 'plugmind-chatbot');

    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir);
    }

    // ✅ Copy all needed files into the plugin folder
    const filesToCopy = ['plugmind-chat.js', 'plugmind-style.css', 'plugmind-chat.php'];
    for (const file of filesToCopy) {
      const src = path.join(distDir, file);
      const dest = path.join(pluginDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`📦 Copied ${file} to plugmind-chatbot/`);
      } else {
        console.warn(`⚠️ ${file} not found in dist/`);
      }
    }
    console.log('✅ All plugin files copied to `plugmind-chatbot/`!');
  }
});
