import JSZip from 'jszip';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMIT_HASH = '00cb5cc7762977ebf8e2ea683521f5db9eb0e8fa';
const EDITORS_DIR = path.resolve(__dirname, '../src/editors');

async function pathExists(dir) {
  return fs
    .access(dir)
    .then(() => true)
    .catch(() => false);
}

async function removeCurrentFiles() {
  if (await pathExists(EDITORS_DIR)) {
    await fs.rmdir(EDITORS_DIR, { recursive: true });
  }
}

async function downloadZip() {
  const url = `https://github.com/desktop/desktop/archive/${COMMIT_HASH}.zip`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unexpected response ${response.statusText}.`);
  }

  return await response.arrayBuffer();
}

async function getFiles() {
  const file = await downloadZip();
  const zip = await JSZip.loadAsync(file);

  let files = [];

  zip
    .folder(`desktop-${COMMIT_HASH}/app/src/lib/editors`)
    .forEach((relativePath, file) => {
      files.push({ relativePath, file });
    });

  return files;
}

async function applyPatches(data) {
  return ''
    .concat('// automatically generated by scripts/fetch-editors.mjs')
    .concat('\n')
    .concat('// do not edit this file directly.')
    .concat('\n')
    .concat('\n')
    .concat(`import log from '../log';`)
    .concat('\n')
    .concat(data)
    .replaceAll('__DARWIN__', `process.platform === 'darwin'`)
    .replaceAll('__WIN32__', `process.platform === 'win32'`)
    .replaceAll('__LINUX__', `process.platform === 'linux'`)
    .replaceAll('../../ui/lib/path-exists', '../path-exists');
}

async function writeNewFile({ relativePath, file }) {
  const fileName = path.basename(relativePath);
  const filePath = path.resolve(EDITORS_DIR, fileName);
  const data = await applyPatches(await file.async('string'));
  await fs.writeFile(filePath, data);
}

async function writeNewFiles() {
  const files = await getFiles();
  await Promise.all(files.map(writeNewFile));
}

async function main() {
  await removeCurrentFiles();
  await fs.mkdir(EDITORS_DIR);
  await writeNewFiles();
}

await main();
