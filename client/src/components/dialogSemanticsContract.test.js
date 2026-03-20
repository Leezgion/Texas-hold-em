import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  createModalSurfaceController,
  resolveModalPortalHost,
} from '../hooks/useModalSurface.js';

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
    contains(target) {
      return target === this || this.children?.includes(target) || false;
    },
    children: [],
  };
}

function createFakeDocument({ focusables = [] } = {}) {
  const root = createFakeElement('root');
  const modalRoot = createFakeElement('modal-root');
  const closeButton = createFakeElement('close');
  const primaryAction = createFakeElement('primary');
  const surface = createFakeElement('surface');
  const documentRef = {
    activeElement: null,
    getElementById(id) {
      if (id === 'root') {
        return root;
      }
      if (id === 'modal-root') {
        return modalRoot;
      }
      return null;
    },
  };

  root.ownerDocument = documentRef;
  modalRoot.ownerDocument = documentRef;
  closeButton.ownerDocument = documentRef;
  primaryAction.ownerDocument = documentRef;
  surface.ownerDocument = documentRef;
  surface.querySelectorAll = () => focusables;
  modalRoot.children.push(surface);

  return {
    documentRef,
    root,
    modalRoot,
    closeButton,
    primaryAction,
    surface,
  };
}

const clientRoot = path.resolve(process.cwd());
const indexHtml = fs.readFileSync(path.join(clientRoot, 'index.html'), 'utf8');
const modalSource = fs.readFileSync(path.join(clientRoot, 'src/components/Modal.jsx'), 'utf8');
const roomPanelSheetSource = fs.readFileSync(path.join(clientRoot, 'src/components/RoomPanelSheet.jsx'), 'utf8');

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

test('modal contract keeps the active surface outside the inerted app root', () => {
  const env = createFakeDocument();
  const controller = createModalSurfaceController({
    documentRef: env.documentRef,
    rootSelector: '#root',
    surfaceElement: env.surface,
    closeButtonElement: env.closeButton,
    onClose: () => {},
    closeOnEscape: true,
  });

  controller.activate();

  assert.equal(env.root.contains(env.surface), false);
  assert.equal(env.modalRoot.contains(env.surface), true);
  assert.equal(env.root.getAttribute('inert'), '');
  assert.equal(env.modalRoot.hasAttribute('inert'), false);
  assert.equal(env.modalRoot.getAttribute('aria-hidden'), null);
});

test('modal portal host prefers #modal-root over the background app root', () => {
  const env = createFakeDocument();

  env.documentRef.body = createFakeElement('body');

  assert.equal(resolveModalPortalHost(env.documentRef), env.modalRoot);
});

test('index.html exposes a dedicated modal root sibling to the app root', () => {
  assert.match(indexHtml, /<div id="root"><\/div>/);
  assert.match(indexHtml, /<div id="modal-root"><\/div>/);
});

test('Modal portals its dialog surface into the modal root', () => {
  assert.match(modalSource, /createPortal/);
  assert.match(modalSource, /resolveModalPortalHost/);
});

test('RoomPanelSheet portals its dialog surface into the modal root', () => {
  assert.match(roomPanelSheetSource, /createPortal/);
  assert.match(roomPanelSheetSource, /resolveModalPortalHost/);
});
