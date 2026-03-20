function toError(value, fallbackMessage) {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    return new Error(value);
  }

  if (value && typeof value === 'object' && typeof value.message === 'string' && value.message.trim()) {
    const error = new Error(value.message);
    Object.entries(value).forEach(([key, entryValue]) => {
      if (key !== 'message') {
        error[key] = entryValue;
      }
    });
    return error;
  }

  return new Error(fallbackMessage);
}

const inFlightRequestsBySocket = new WeakMap();

function getInFlightRequests(socket) {
  let requestSet = inFlightRequestsBySocket.get(socket);
  if (!requestSet) {
    requestSet = new Set();
    inFlightRequestsBySocket.set(socket, requestSet);
  }

  return requestSet;
}

export function emitWithResponse(
  socket,
  {
    emitEvent,
    payload,
    successEvent,
    errorEvent = 'error',
    timeoutMs = 5000,
    timeoutMessage = '请求超时',
    requestKey = null,
    rejectConcurrent = false,
    concurrentMessage = '请求处理中',
  }
) {
  if (!socket) {
    return Promise.reject(new Error('连接未建立'));
  }

  const normalizedRequestKey = requestKey || emitEvent;
  if (rejectConcurrent) {
    const inFlightRequests = getInFlightRequests(socket);
    if (inFlightRequests.has(normalizedRequestKey)) {
      return Promise.reject(new Error(concurrentMessage));
    }
    inFlightRequests.add(normalizedRequestKey);
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      socket.off(successEvent, handleSuccess);
      socket.off(errorEvent, handleError);
      clearTimeout(timeoutId);
      if (rejectConcurrent) {
        getInFlightRequests(socket).delete(normalizedRequestKey);
      }
    };

    const handleSuccess = (response) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(response);
    };

    const handleError = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(toError(error, '请求失败'));
    };

    const timeoutId = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    socket.once(successEvent, handleSuccess);
    socket.once(errorEvent, handleError);
    socket.emit(emitEvent, payload);
  });
}
