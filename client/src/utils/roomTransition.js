function matchesNavigationTarget(navigationTarget, incomingRoomId) {
  if (!navigationTarget || !incomingRoomId) {
    return false;
  }

  return navigationTarget === `/game/${incomingRoomId}`;
}

export function shouldApplyIncomingRoomPayload({
  previousRoomId = null,
  incomingRoomId = null,
  isCreatingRoom = false,
  intentionalJoin = false,
  navigationTarget = null,
} = {}) {
  if (!incomingRoomId) {
    return false;
  }

  if (!previousRoomId || previousRoomId === incomingRoomId) {
    return true;
  }

  if (isCreatingRoom) {
    return true;
  }

  if (intentionalJoin && matchesNavigationTarget(navigationTarget, incomingRoomId)) {
    return true;
  }

  if (matchesNavigationTarget(navigationTarget, incomingRoomId)) {
    return true;
  }

  return false;
}
