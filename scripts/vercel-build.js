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
      { src: '/(.*)', dest: '/api/index' },
    ],
  }, null, 2),
);

console.log('✅ Vercel build output generado en .vercel/output/');
