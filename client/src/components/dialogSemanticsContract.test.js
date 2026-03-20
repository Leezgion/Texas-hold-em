import assert from 'node:assert/strict';
import test from 'node:test';

import { createModalSurfaceController } from '../hooks/useModalSurface.js';

function createFakeElement(name) {
  return {
    name,
    attributes: {},
    focusCount: 0,
    focus() {
      this.focusCount += 1;
      this.ownerDocument.activeElement = this;
    },
    setAttribute(attributeName, value) {
      this.attributes[attributeName] = String(value);
    },
    removeAttribute(attributeName) {
      delete this.attributes[attributeName];
    },
    getAttribute(attributeName) {
      return Object.prototype.hasOwnProperty.call(this.attributes, attributeName)
        ? this.attributes[attributeName]
        : null;
    },
    hasAttribute(attributeName) {
      return Object.prototype.hasOwnProperty.call(this.attributes, attributeName);
    },
  };
}

function createFakeDocument({ focusables = [] } = {}) {
  const root = createFakeElement('root');
  const closeButton = createFakeElement('close');
  const primaryAction = createFakeElement('primary');
  const surface = createFakeElement('surface');
  const documentRef = {
    activeElement: null,
    getElementById(id) {
      return id === 'root' ? root : null;
    },
  };

  root.ownerDocument = documentRef;
  closeButton.ownerDocument = documentRef;
  primaryAction.ownerDocument = documentRef;
  surface.ownerDocument = documentRef;
  surface.querySelectorAll = () => focusables;

  return {
    documentRef,
    root,
    closeButton,
    primaryAction,
    surface,
  };
}

test('modal surface controller traps focus, marks the background inert, and restores focus', () => {
  const env = createFakeDocument();
  const outsideButton = createFakeElement('outside');
  outsideButton.ownerDocument = env.documentRef;
  env.documentRef.activeElement = outsideButton;
  env.surface.querySelectorAll = () => [env.closeButton, env.primaryAction];

  const onCloseCalls = [];
  const controller = createModalSurfaceController({
    documentRef: env.documentRef,
    rootSelector: '#root',
    surfaceElement: env.surface,
    closeButtonElement: env.closeButton,
    onClose: () => onCloseCalls.push('close'),
    closeOnEscape: true,
  });

  controller.activate();

  assert.equal(env.root.getAttribute('inert'), '');
  assert.equal(env.root.getAttribute('aria-hidden'), 'true');
  assert.equal(env.documentRef.activeElement, env.closeButton);

  controller.handleKeyDown({
    key: 'Tab',
    shiftKey: false,
    preventDefault() {},
    stopPropagation() {},
  });

  assert.equal(env.documentRef.activeElement, env.primaryAction);

  controller.handleKeyDown({
    key: 'Tab',
    shiftKey: false,
    preventDefault() {},
    stopPropagation() {},
  });

  assert.equal(env.documentRef.activeElement, env.closeButton);

  controller.deactivate();

  assert.equal(env.root.hasAttribute('inert'), false);
  assert.equal(env.root.hasAttribute('aria-hidden'), false);
  assert.equal(env.documentRef.activeElement, outsideButton);
  assert.equal(onCloseCalls.length, 0);
});

test('modal surface controller dismisses on escape when enabled', () => {
  const env = createFakeDocument();
  let closeCount = 0;
  const controller = createModalSurfaceController({
    documentRef: env.documentRef,
    rootSelector: '#root',
    surfaceElement: env.surface,
    closeButtonElement: env.closeButton,
    onClose: () => {
      closeCount += 1;
    },
    closeOnEscape: true,
  });

  controller.activate();
  controller.handleKeyDown({
    key: 'Escape',
    shiftKey: false,
    preventDefault() {},
    stopPropagation() {},
  });

  assert.equal(closeCount, 1);
});

test('modal surface controller keeps a visible focus treatment contract untouched', () => {
  const env = createFakeDocument();
  const controller = createModalSurfaceController({
    documentRef: env.documentRef,
    rootSelector: '#root',
    surfaceElement: env.surface,
    closeButtonElement: env.closeButton,
    onClose: () => {},
    closeOnEscape: false,
  });

  controller.activate();

  assert.equal(env.closeButton.focusCount > 0, true);
  assert.equal(env.root.getAttribute('inert'), '');
  assert.equal(env.root.getAttribute('aria-hidden'), 'true');
});
