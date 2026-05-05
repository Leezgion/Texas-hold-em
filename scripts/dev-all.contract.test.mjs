import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const rootPackageUrl = new URL('../package.json', import.meta.url);
const devScriptUrl = new URL('./dev-all.mjs', import.meta.url);

function readJson(url) {
  return JSON.parse(readFileSync(url, 'utf8'));
}

test('root package exposes a single command for starting client and server dev processes', () => {
  assert.equal(existsSync(rootPackageUrl), true, 'root package.json should exist');

  const rootPackage = readJson(rootPackageUrl);
  assert.equal(rootPackage.private, true);
  assert.equal(rootPackage.scripts.dev, 'node scripts/dev-all.mjs');
  assert.equal(rootPackage.scripts['test:dev-command'], 'node --test scripts/dev-all.contract.test.mjs');
});

test('dev-all script starts both child package dev scripts and handles terminal shutdown', () => {
  assert.equal(existsSync(devScriptUrl), true, 'scripts/dev-all.mjs should exist');

  const source = readFileSync(devScriptUrl, 'utf8');
  assert.match(source, /export const DEV_TARGETS = Object\.freeze\(\[/);
  assert.match(source, /name:\s*'server'[\s\S]*cwd:\s*'server'/);
  assert.match(source, /name:\s*'client'[\s\S]*cwd:\s*'client'/);
  assert.match(source, /spawn\(packageManager,\s*\['--dir',\s*target\.cwd,\s*'dev'\]/);
  assert.match(source, /process\.once\('SIGINT'/);
  assert.match(source, /process\.once\('SIGTERM'/);
});
