#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DEV_TARGETS = Object.freeze([
  {
    name: 'server',
    cwd: 'server',
  },
  {
    name: 'client',
    cwd: 'client',
  },
]);

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

export function resolveScriptRunner(platform = process.platform) {
  return platform === 'win32' ? 'cmd.exe' : 'pnpm';
}

export function buildDevCommand(target, platform = process.platform) {
  if (platform === 'win32') {
    return ['/d', '/s', '/c', `pnpm --dir ${target.cwd} dev`];
  }

  return ['--dir', target.cwd, 'dev'];
}

function prefixStream(stream, targetName, output) {
  const lineReader = createInterface({ input: stream });

  lineReader.on('line', (line) => {
    output.write(`[${targetName}] ${line}\n`);
  });

  return lineReader;
}

export function startDevProcess(target, options = {}) {
  const platform = options.platform || process.platform;
  const scriptRunner = options.scriptRunner || resolveScriptRunner(platform);
  const rootDir = options.rootDir || repoRoot;
  const child = spawn(scriptRunner, buildDevCommand(target, platform), {
    cwd: rootDir,
    env: process.env,
    stdio: ['inherit', 'pipe', 'pipe'],
    windowsHide: platform === 'win32',
  });

  prefixStream(child.stdout, target.name, process.stdout);
  prefixStream(child.stderr, target.name, process.stderr);

  return child;
}

export function runDevProcesses(options = {}) {
  const children = DEV_TARGETS.map((target) => ({
    target,
    child: startDevProcess(target, options),
  }));
  let shuttingDown = false;
  let closedCount = 0;
  let exitCode = 0;
  let forceKillTimer = null;

  const stopAll = (code = 0) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    exitCode = code;

    for (const { child } of children) {
      if (!child.killed && child.exitCode === null) {
        child.kill('SIGINT');
      }
    }

    forceKillTimer = setTimeout(() => {
      for (const { child } of children) {
        if (!child.killed && child.exitCode === null) {
          child.kill('SIGTERM');
        }
      }
    }, 3000);
    forceKillTimer.unref?.();
  };

  for (const { target, child } of children) {
    child.on('error', (error) => {
      process.stderr.write(`[${target.name}] failed to start: ${error.message}\n`);
      stopAll(1);
    });

    child.on('close', (code, signal) => {
      closedCount += 1;

      if (!shuttingDown) {
        const nextExitCode = typeof code === 'number' ? code : signal ? 1 : 0;
        if (nextExitCode !== 0) {
          process.stderr.write(`[${target.name}] exited with ${signal || nextExitCode}\n`);
        }
        stopAll(nextExitCode);
      }

      if (closedCount === children.length) {
        if (forceKillTimer) {
          clearTimeout(forceKillTimer);
        }
        process.exitCode = exitCode;
      }
    });
  }

  process.once('SIGINT', () => stopAll(0));
  process.once('SIGTERM', () => stopAll(0));

  return {
    children: children.map(({ child }) => child),
    stopAll,
  };
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  runDevProcesses();
}
