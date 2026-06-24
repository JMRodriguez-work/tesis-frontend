export type ApiErrorPayload = { message: string; field?: string };

function isObjectWithMessage(value: unknown): value is { message: unknown } {
  return typeof value === 'object' && value !== null && 'message' in value;
}

function isApiErrorBody(value: unknown): value is { message: string; data?: unknown } {
  if (!isObjectWithMessage(value)) return false;
  const { message } = value;
  if (typeof message !== 'string' || message.length === 0) return false;
  return true;
}

export function mapApiError(err: unknown): ApiErrorPayload {
  if (err === null || err === undefined) {
    return { message: 'Error desconocido' };
  }

  if (err instanceof Error) {
    if (err.message.includes('Failed to fetch')) {
      return {
        message: 'No se pudo conectar con el servidor. Verificá tu conexión.',
      };
    }
    return { message: err.message };
  }

  if (isApiErrorBody(err)) {
    return { message: err.message };
  }

  return { message: 'Error desconocido' };
}
