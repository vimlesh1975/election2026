const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const port = String(process.env.PORT || process.env.APP_PORT || '16000');

// Installed layout:
//   {install}\app\...
//   {install}\runtime\service\service.js   <-- this file
const installRoot = path.resolve(__dirname, '..', '..');
const appDir = path.join(installRoot, 'app');
const nextBin = path.join(appDir, 'node_modules', 'next', 'dist', 'bin', 'next');
const buildIdPath = path.join(appDir, '.next', 'BUILD_ID');
const dataDir = process.env.ELECTION_GRAPHIC_DATA_DIR
  || path.join(process.env.PROGRAMDATA || path.join(installRoot, 'data'), 'ElectionGraphic');
const dataExcelPath = process.env.MLA_EXCEL_PATH || path.join(dataDir, 'mla.updated.xlsx');

function serviceEnv() {
  return {
    ...process.env,
    NODE_ENV: 'production',
    ELECTION_GRAPHIC_DATA_DIR: dataDir,
    MLA_EXCEL_PATH: dataExcelPath,
  };
}

function runNode(args, { stdio = 'inherit' } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: appDir,
      env: serviceEnv(),
      windowsHide: true,
      stdio,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command failed: node ${args.join(' ')} (exit ${code})`));
    });
  });
}

async function ensureBuild() {
  if (fs.existsSync(buildIdPath)) return;
  await runNode([nextBin, 'build']);
}

async function startServer() {
  const child = spawn(process.execPath, [nextBin, 'start', '-p', port], {
    cwd: appDir,
    env: serviceEnv(),
    windowsHide: true,
    stdio: 'inherit',
  });

  const forward = (signal) => {
    try {
      child.kill(signal);
    } catch {
      // ignore
    }
  };

  process.on('SIGINT', () => forward('SIGINT'));
  process.on('SIGTERM', () => forward('SIGTERM'));

  child.on('exit', (code) => {
    process.exitCode = code ?? 0;
  });
}

(async () => {
  try {
    await ensureBuild();
    await startServer();
  } catch (err) {
    // Let WinSW capture this in stderr log.
    console.error(err && err.stack ? err.stack : String(err));
    process.exitCode = 1;
  }
})();

