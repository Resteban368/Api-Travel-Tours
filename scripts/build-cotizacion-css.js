#!/usr/bin/env node
'use strict';

// Compila Tailwind v3 para una plantilla HTML de cotización y lo incrusta
// entre los marcadores /* tailwind:start */ … /* tailwind:end */ del <style id="tw">.
// Uso: node scripts/build-cotizacion-css.js public/cotizacion-respuesta-travelclub.html

const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const target = process.argv[2];
if (!target || !fs.existsSync(target)) {
  console.error('Uso: node scripts/build-cotizacion-css.js <archivo.html>');
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tw-'));
const config = path.join(tmp, 'tailwind.config.js');
const input = path.join(tmp, 'input.css');
const output = path.join(tmp, 'output.css');

// Colores de marca Travel Club (tomados del diseño de Google Stitch)
fs.writeFileSync(config, `module.exports = {
  content: [${JSON.stringify(path.resolve(target))}],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'sans-serif'] },
      colors: {
        brand: {
          navy: '#0a2540', ocean: '#0b3b60', cyan: '#00a3e0', gold: '#f5a623',
          sand: '#f8faff', border: '#e2e8f0', emerald: '#10b981', whatsapp: '#25D366',
        },
      },
      boxShadow: {
        soft: '0 4px 25px -4px rgba(10, 37, 64, 0.06), 0 2px 10px -2px rgba(10, 37, 64, 0.03)',
        card: '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 10px -2px rgba(0, 0, 0, 0.02)',
        sticky: '0 20px 40px -15px rgba(10, 37, 64, 0.14)',
      },
    },
  },
};\n`);
fs.writeFileSync(input, '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');

execFileSync('npx', ['--yes', 'tailwindcss@3', '-c', config, '-i', input, '-o', output, '--minify'], { stdio: 'inherit' });

const css = fs.readFileSync(output, 'utf8').trim();
const html = fs.readFileSync(target, 'utf8');
const re = /\/\* tailwind:start \*\/[\s\S]*?\/\* tailwind:end \*\//;
if (!re.test(html)) {
  console.error('No se encontraron los marcadores /* tailwind:start */ … /* tailwind:end */');
  process.exit(1);
}
fs.writeFileSync(target, html.replace(re, () => `/* tailwind:start */${css}/* tailwind:end */`));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✅ CSS de Tailwind incrustado en ${target} (${(css.length / 1024).toFixed(1)} KB)`);
