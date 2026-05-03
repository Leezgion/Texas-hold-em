import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const modeGatewaySource = readFileSync(new URL('./ModeGateway.jsx', import.meta.url), 'utf8');
const globalStylesSource = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

test('ModeGateway exposes semantic action-first hooks for the phone homepage', () => {
  assert.match(modeGatewaySource, /mode-gateway-shell/);
  assert.match(modeGatewaySource, /mode-gateway-layout/);
  assert.match(modeGatewaySource, /data-phone-priority="primary-actions"/);
  assert.match(modeGatewaySource, /mode-gateway-control__block mode-gateway-control__block--create/);
  assert.match(modeGatewaySource, /mode-gateway-control__block mode-gateway-control__block--join/);
  assert.match(modeGatewaySource, /mode-gateway-control__block mode-gateway-control__block--mode-summary/);
  assert.match(modeGatewaySource, /mode-gateway-control__copy/);
  assert.ok(
    modeGatewaySource.indexOf('<aside className="mode-gateway-control"') <
      modeGatewaySource.indexOf('<section className="mode-gateway-panel mode-gateway-panel--hero'),
    'primary actions should appear before marketing hero in DOM and focus order'
  );
});

test('phone ModeGateway promotes create and join before the marketing stage', () => {
  assert.match(
    globalStylesSource,
    /\.mode-gateway-layout\s*\{\s*@apply grid gap-6 xl:grid-cols-\[minmax\(0,1\.3fr\)_420px\];[\s\S]*grid-template-areas:\s*"control"\s*"hero";/s
  );
  assert.match(
    globalStylesSource,
    /\.mode-gateway-panel--hero\s*\{[\s\S]*grid-area:\s*hero;/s
  );
  assert.match(
    globalStylesSource,
    /\.mode-gateway-control\s*\{[\s\S]*grid-area:\s*control;/s
  );
  assert.match(
    globalStylesSource,
    /@media \(min-width: 1280px\) \{[\s\S]*\.mode-gateway-layout\s*\{[\s\S]*grid-template-areas:\s*"hero control";/s
  );
  assert.match(
    globalStylesSource,
    /@media \(max-width: 767px\) \{[\s\S]*\.mode-gateway-control\s*\{[\s\S]*gap:\s*0\.75rem;/s
  );
  assert.match(
    globalStylesSource,
    /@media \(max-width: 767px\) \{[\s\S]*\.mode-gateway-control__block\s*\{[\s\S]*padding:\s*0\.9rem;[\s\S]*border-radius:\s*1\.15rem;/s
  );
  assert.match(
    globalStylesSource,
    /@media \(max-width: 767px\) \{[\s\S]*\.mode-gateway-control__copy,[\s\S]*\.mode-gateway-side-note\s*\{[\s\S]*display:\s*none;/s
  );
  assert.match(
    globalStylesSource,
    /@media \(max-width: 767px\) \{[\s\S]*\.mode-gateway-control__block--mode-summary\s*\{[\s\S]*display:\s*none;/s
  );
  assert.match(
    globalStylesSource,
    /@media \(max-width: 767px\) \{[\s\S]*\.mode-gateway-control\s+\.mode-primary-button,[\s\S]*\.mode-gateway-control\s+\.mode-secondary-button\s*\{[\s\S]*min-height:\s*3rem;/s
  );
});
