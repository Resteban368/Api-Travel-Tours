#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

// 1. Compile TypeScript (tsc con emitDecoratorMetadata correcto)
run('rm -f tsconfig.build.tsbuildinfo');
run('./node_modules/.bin/nest build');

// 2. Bundle con ncc — maneja dynamic requires (keyv, cache-manager, etc.)
const funcDir = path.join('.vercel', 'output', 'functions', 'api', 'index.func');
fs.mkdirSync(funcDir, { recursive: true });
run(`./node_modules/.bin/ncc build dist/lambda.js -o ${funcDir} --no-source-map-register -q`);

// 2b. ncc no copia los binarios nativos de bcrypt (node-gyp-build los busca en <dir>/prebuilds)
fs.cpSync(
  path.join('node_modules', 'bcrypt', 'prebuilds', 'linux-x64'),
  path.join(funcDir, 'prebuilds', 'linux-x64'),
  { recursive: true },
);

// 2c. pdf-parse (pdfjs) requiere @napi-rs/canvas al cargar; ncc tampoco lo empaqueta.
//     En el build de Vercel (Linux) npm instala @napi-rs/canvas-linux-x64-gnu.
fs.cpSync(
  path.join('node_modules', '@napi-rs'),
  path.join(funcDir, 'node_modules', '@napi-rs'),
  { recursive: true },
);

// 2d. Archivos que el código lee con process.cwd() (en la función cwd = /var/task = funcDir):
//     páginas HTML (cotización, selección de asientos), logo del PDF y fuentes de pdfmake.
fs.cpSync('public', path.join(funcDir, 'public'), { recursive: true });
fs.cpSync(
  path.join('node_modules', 'pdfjs-dist', 'standard_fonts'),
  path.join(funcDir, 'node_modules', 'pdfjs-dist', 'standard_fonts'),
  { recursive: true },
);

// 2e. Estáticos servidos por el CDN (equivale a useStaticAssets de main.ts)
const staticDir = path.join('.vercel', 'output', 'static');
fs.cpSync('public', staticDir, { recursive: true });
fs.cpSync('assets', path.join(staticDir, 'assets'), { recursive: true });

// 3. Config de la función (Vercel Build Output API v3)
fs.writeFileSync(
  path.join(funcDir, '.vc-config.json'),
  JSON.stringify({
    runtime: 'nodejs22.x',
    handler: 'index.js',
    launcherType: 'Nodejs',
    shouldAddHelpers: false,
  }, null, 2),
);

// 4. Config del deployment (rutas)
fs.mkdirSync('.vercel/output', { recursive: true });
fs.writeFileSync(
  '.vercel/output/config.json',
  JSON.stringify({
    version: 3,
    routes: [
      { handle: 'filesystem' },
      { src: '/(.*)', dest: '/api/index' },
    ],
  }, null, 2),
);

console.log('✅ Vercel build output generado en .vercel/output/');
