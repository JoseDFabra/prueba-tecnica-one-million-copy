import { access, copyFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function ensureFile(sourceRelativePath, targetRelativePath) {
  const source = path.join(rootDir, sourceRelativePath);
  const target = path.join(rootDir, targetRelativePath);

  try {
    await access(target, constants.F_OK);
    console.log(`- ${targetRelativePath} ya existe`);
  } catch {
    await copyFile(source, target);
    console.log(`- ${targetRelativePath} creado desde ${sourceRelativePath}`);
  }
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} fallo con codigo ${code}`));
      }
    });
  });
}

async function main() {
  console.log('Preparando entorno local...');
  await ensureFile('backend/.env.example', 'backend/.env');
  await ensureFile('frontend/.env.example', 'frontend/.env.local');

  console.log('Aplicando migraciones de base de datos...');
  await run('npx', ['prisma', 'migrate', 'deploy'], path.join(rootDir, 'backend'));

  console.log('Preparacion completada.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
