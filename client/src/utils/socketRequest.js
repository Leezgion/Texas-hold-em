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

export function emitWithResponse(
  socket,
  {
    emitEvent,
    payload,
    successEvent,
    errorEvent = 'error',
    timeoutMs = 5000,
    timeoutMessage = '请求超时',
  }
) {
  if (!socket) {
    return Promise.reject(new Error('连接未建立'));
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      socket.off(successEvent, handleSuccess);
      socket.off(errorEvent, handleError);
      clearTimeout(timeoutId);
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
