import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function isFocusableElement(element) {
  return Boolean(element && typeof element.focus === 'function' && !element.disabled);
}

function getFocusableElements(surfaceElement) {
  if (!surfaceElement || typeof surfaceElement.querySelectorAll !== 'function') {
    return [];
  }

  return Array.from(surfaceElement.querySelectorAll(FOCUSABLE_SELECTOR)).filter(isFocusableElement);
}

function setRootInteractionState(rootElement, inert = false) {
  if (!rootElement) {
    return;
  }

  if (inert) {
    if (typeof rootElement.setAttribute === 'function') {
      rootElement.setAttribute('inert', '');
      rootElement.setAttribute('aria-hidden', 'true');
    } else {
      rootElement.inert = true;
      rootElement.ariaHidden = 'true';
    }
    return;
  }

  if (typeof rootElement.removeAttribute === 'function') {
    rootElement.removeAttribute('inert');
    rootElement.removeAttribute('aria-hidden');
  } else {
    rootElement.inert = false;
    rootElement.ariaHidden = null;
  }
}

export function resolveModalPortalHost(
  documentRef = typeof document !== 'undefined' ? document : null,
  modalRootId = 'modal-root'
) {
  if (!documentRef) {
    return null;
  }

  if (typeof documentRef.getElementById === 'function') {
    const modalRoot = documentRef.getElementById(modalRootId);

    if (modalRoot) {
      return modalRoot;
    }
  }

  return documentRef.body || null;
}

export function createModalSurfaceController({
  documentRef = typeof document !== 'undefined' ? document : null,
  rootSelector = '#root',
  surfaceElement = null,
  closeButtonElement = null,
  onClose = null,
  closeOnEscape = true,
} = {}) {
  let previousActiveElement = null;
  let isActive = false;

  const resolveRootElement = () => {
    if (!documentRef) {
      return null;
    }

    if (typeof documentRef.getElementById === 'function' && rootSelector.startsWith('#')) {
      return documentRef.getElementById(rootSelector.slice(1));
    }

    if (typeof documentRef.querySelector === 'function') {
      return documentRef.querySelector(rootSelector);
    }

    return null;
  };

  const focusInitialTarget = () => {
    const target = closeButtonElement || getFocusableElements(surfaceElement)[0] || surfaceElement;
    target?.focus?.();
  };

  const activate = () => {
    if (isActive) {
      return;
    }

    previousActiveElement = documentRef?.activeElement ?? null;
    setRootInteractionState(resolveRootElement(), true);
    isActive = true;
    focusInitialTarget();
  };

  const deactivate = () => {
    if (!isActive) {
      return;
    }

    setRootInteractionState(resolveRootElement(), false);
    isActive = false;

    const previousElement = previousActiveElement;
    previousActiveElement = null;

    previousElement?.focus?.();
  };

  const handleTabKey = (event) => {
    const focusables = getFocusableElements(surfaceElement);

    if (focusables.length === 0) {
      event.preventDefault();
      event.stopPropagation();
      focusInitialTarget();
      return;
    }

    const activeElement = documentRef?.activeElement ?? null;
    const currentIndex = focusables.indexOf(activeElement);
    const lastIndex = focusables.length - 1;
    const nextIndex = event.shiftKey
      ? currentIndex <= 0
        ? lastIndex
        : currentIndex - 1
      : currentIndex === -1 || currentIndex === lastIndex
      ? 0
      : currentIndex + 1;

    event.preventDefault();
    event.stopPropagation();
    focusables[nextIndex]?.focus?.();
  };

  const handleKeyDown = (event) => {
    if (!isActive || !event) {
      return;
    }

    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault();
      event.stopPropagation();
      onClose?.();
      return;
    }

    if (event.key === 'Tab') {
      handleTabKey(event);
    }
  };

  return {
    activate,
    deactivate,
    handleKeyDown,
  };
}

export default function useModalSurface({
  open = false,
  onClose = null,
  surfaceRef = null,
  closeButtonRef = null,
  closeOnEscape = true,
  rootSelector = '#root',
} = {}) {
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      controllerRef.current?.deactivate?.();
      controllerRef.current = null;
      return undefined;
    }

    const controller = createModalSurfaceController({
      documentRef: typeof document !== 'undefined' ? document : null,
      rootSelector,
      surfaceElement: surfaceRef?.current ?? null,
      closeButtonElement: closeButtonRef?.current ?? null,
      onClose,
      closeOnEscape,
    });

    controllerRef.current = controller;
    controller.activate();

    return () => {
      controller.deactivate();
      controllerRef.current = null;
    };
  }, [closeButtonRef, closeOnEscape, onClose, open, rootSelector, surfaceRef]);

  return {
    handleKeyDown: (event) => controllerRef.current?.handleKeyDown?.(event),
  };
}
