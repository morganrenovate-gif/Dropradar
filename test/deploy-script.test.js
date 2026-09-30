import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const script = path.join(root, 'scripts/sync-hedy-dev.sh');
const run = (extraEnv = {}) => spawnSync('/bin/bash', [script], { cwd: root, encoding: 'utf8', env: { ...process.env, ...extraEnv } });

test('dev sync refuses to run without a scoped token or CI OIDC', () => {
  const result = run({ HEDY_TOKEN: '', ACTIONS_ID_TOKEN_REQUEST_URL: '', ACTIONS_ID_TOKEN_REQUEST_TOKEN: '' });
  assert.equal(result.status, 2); assert.match(result.stderr, /authentication is required/);
});

test('dev sync refuses authenticated execution when official CLI is absent', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dropradar-no-hedy-cli-'));
  fs.symlinkSync('/usr/bin/dirname', path.join(directory, 'dirname'));
  const result = run({ HEDY_TOKEN: 'test-only', PATH: directory });
  assert.equal(result.status, 3); assert.match(result.stderr, /official Hedy CLI must be installed/);
});

test('dev sync invokes only Hedy CLI stage-and-sync command for dev', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dropradar-hedy-cli-'));
  const calls = path.join(directory, 'calls');
  fs.writeFileSync(path.join(directory, 'hedy'), `#!/bin/sh\nprintf '%s\\n' "$*" > "${calls}"\n`); fs.chmodSync(path.join(directory, 'hedy'), 0o755);
  const result = run({ HEDY_TOKEN: 'test-only', PATH: `${directory}:${process.env.PATH}` });
  assert.equal(result.status, 0, result.stderr); assert.equal(fs.readFileSync(calls, 'utf8').trim(), 'app sync --environment dev');
  assert.doesNotMatch(fs.readFileSync(script, 'utf8'), /--environment (staging|prod|production)/);
});

test('OIDC sync fails closed when company, policy, or audience is incomplete', () => {
  const result = run({
    HEDY_TOKEN: '', ACTIONS_ID_TOKEN_REQUEST_URL: 'https://oidc.example', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'test-request-token',
    HEDY_COMPANY_ID: 'company', HEDY_CI_TRUST_ID: '', HEDY_OIDC_AUDIENCE: 'audience'
  });
  assert.equal(result.status, 4); assert.match(result.stderr, /OIDC configuration is incomplete/);
});

test('OIDC sync logs in with authoritative CI arguments before dev sync', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dropradar-hedy-oidc-'));
  const calls = path.join(directory, 'calls');
  fs.writeFileSync(path.join(directory, 'hedy'), `#!/bin/sh\nprintf '%s\\n' "$*" >> "${calls}"\n`); fs.chmodSync(path.join(directory, 'hedy'), 0o755);
  const result = run({
    HEDY_TOKEN: '', PATH: `${directory}:${process.env.PATH}`,
    ACTIONS_ID_TOKEN_REQUEST_URL: 'https://oidc.example', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'test-request-token',
    HEDY_COMPANY_ID: 'company-123', HEDY_CI_TRUST_ID: 'trust-456', HEDY_OIDC_AUDIENCE: 'audience-789'
  });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(fs.readFileSync(calls, 'utf8').trim().split('\n'), [
    'login --ci --company company-123 --policy trust-456 --audience audience-789',
    'app sync --environment dev'
  ]);
});

test('failed OIDC login prevents dev sync', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dropradar-hedy-oidc-fail-'));
  const calls = path.join(directory, 'calls');
  fs.writeFileSync(path.join(directory, 'hedy'), `#!/bin/sh\nprintf '%s\\n' "$*" >> "${calls}"\n\n[ "$1" != login ]\n`); fs.chmodSync(path.join(directory, 'hedy'), 0o755);
  const result = run({
    HEDY_TOKEN: '', PATH: `${directory}:${process.env.PATH}`,
    ACTIONS_ID_TOKEN_REQUEST_URL: 'https://oidc.example', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'test-request-token',
    HEDY_COMPANY_ID: 'company', HEDY_CI_TRUST_ID: 'trust', HEDY_OIDC_AUDIENCE: 'audience'
  });
  assert.notEqual(result.status, 0); assert.deepEqual(fs.readFileSync(calls, 'utf8').trim().split('\n'), [
    'login --ci --company company --policy trust --audience audience'
  ]);
});

test('deployment workflow is manual, OIDC-enabled, and dev-only', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/deploy-dev.yml'), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /environment: dev/);
  assert.match(workflow, /HEDY_TOKEN: \$\{\{ secrets\.HEDY_TOKEN \}\}/);
  assert.match(workflow, /HEDY_COMPANY_ID: \$\{\{ vars\.HEDY_COMPANY_ID \}\}/);
  assert.match(workflow, /HEDY_CI_TRUST_ID: \$\{\{ vars\.HEDY_CI_TRUST_ID \}\}/);
  assert.match(workflow, /HEDY_OIDC_AUDIENCE: \$\{\{ vars\.HEDY_OIDC_AUDIENCE \}\}/);
  assert.match(workflow, /\.\/scripts\/sync-hedy-dev\.sh/);
  assert.doesNotMatch(workflow, /environment:\s*(staging|prod|production)/);
});
