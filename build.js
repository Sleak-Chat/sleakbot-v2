const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const dist = './dist';
if (!fs.existsSync(dist)) fs.mkdirSync(dist);

esbuild.buildSync({
  entryPoints: ['sleakbot.js', 'fetchsleakbot.js', 'sleakbot-fw.js'],
  bundle: false,
  minify: true,
  outdir: dist
});

const fetchsleakbotPath = path.join(dist, 'fetchsleakbot.js');
if (fs.existsSync(fetchsleakbotPath)) {
  let content = fs.readFileSync(fetchsleakbotPath, 'utf8');
  content = content.replace(/WIDGET_URL/g, process.env.WIDGET_URL || 'https://widget.sleak.chat');
  content = content.replace(/BASE_URL/g, process.env.BASE_URL || 'https://cdn.sleak.chat');
  fs.writeFileSync(fetchsleakbotPath, content);
}

esbuild.buildSync({
  entryPoints: ['sleakbot.css', 'sleakbot-fw.css'],
  minify: true,
  outdir: dist
});

['sleakbot.html', 'sleakbot-fw.html', 'index.html', 'installationsnippet.html', '_headers'].forEach(f => {
  if (fs.existsSync(f)) fs.copyFileSync(f, path.join(dist, f));
});

if (fs.existsSync('./assets')) {
  fs.cpSync('./assets', path.join(dist, 'assets'), { recursive: true });
}