/**
 * Starts the API server and the Vite dev server together (npm run dev:full).
 * Ctrl+C stops both.
 */
import { spawn } from 'node:child_process';

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [
  spawn(process.execPath, ['server/index.js'], { stdio: 'inherit' }),
  spawn(npm, ['run', 'dev'], { stdio: 'inherit', shell: process.platform === 'win32' }),
];

const stop = () => {
  children.forEach((child) => child.kill());
  process.exit();
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
children.forEach((child) => child.on('exit', (code) => code && stop()));
