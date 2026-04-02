import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('JARVIS: Iniciando backend Holozonic via Wrapper TSX...');

const child = spawn('npx.cmd', ['tsx', 'src/server.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PRISMA_CLIENT_ENGINE_TYPE: 'library',
    PRISMA_CLI_QUERY_ENGINE_TYPE: 'library'
  }
});

child.on('exit', (code) => {
  console.log(`JARVIS: Backend finalizado com código ${code}`);
  process.exit(code);
});
