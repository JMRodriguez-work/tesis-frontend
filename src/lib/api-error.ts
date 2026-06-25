export type ApiErrorPayload = { message: string; field?: string };

function isObjectWithMessage(value: unknown): value is { message: unknown } {
  return typeof value === 'object' && value !== null && 'message' in value;
}

function isApiErrorBody(value: unknown): value is { message: string; data?: unknown } {
  if (!isObjectWithMessage(value)) return false;
  const { message } = value;
  return typeof message === 'string' && message.length > 0;
}

type ZodIssue = {
  code?: string;
  message?: string;
  path?: (string | number)[];
  keys?: string[];
};

type ZodErrorEnvelope = {
  error?: {
    name?: string;
    issues?: ZodIssue[];
    message?: string;
  };
};

function isZodErrorEnvelope(value: unknown): value is ZodErrorEnvelope {
  if (typeof value !== 'object' || value === null) return false;
  const error = (value as { error?: unknown }).error;
  if (typeof error !== 'object' || error === null) return false;
  const issues = (error as { issues?: unknown }).issues;
  return Array.isArray(issues);
}

function translateZodIssue(issue: ZodIssue): string {
  const code = issue.code ?? '';
  const path = (issue.path ?? []).map(String).join('.');
  const rawMessage = issue.message ?? 'Dato inválido';

  if (code === 'unrecognized_keys' && Array.isArray(issue.keys) && issue.keys.length > 0) {
    const keys = issue.keys.join(', ');
    return path ? `Campo no permitido: ${keys} (en ${path})` : `Campo no permitido: ${keys}`;
  }
  if (code === 'invalid_type') {
    return path ? `${path}: ${rawMessage}` : rawMessage;
  }
  if (code === 'too_small' || code === 'too_big') {
    return path ? `${path}: ${rawMessage}` : rawMessage;
  }
  if (code === 'invalid_string') {
    return path ? `${path}: ${rawMessage}` : rawMessage;
  }
  return path ? `${path}: ${rawMessage}` : rawMessage;
}

function formatZodErrorMessage(envelope: ZodErrorEnvelope): string {
  const innerMessage = envelope.error?.message;
  const issues = envelope.error?.issues ?? [];
  if (issues.length === 0) {
    return typeof innerMessage === 'string' && innerMessage.length > 0
      ? innerMessage
      : 'Datos inválidos';
  }
  if (issues.length === 1) {
    return translateZodIssue(issues[0] ?? { message: 'Datos inválidos' });
  }
  const translated = issues.map(translateZodIssue);
  return translated.join(' · ');
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

  if (isZodErrorEnvelope(err)) {
    return { message: formatZodErrorMessage(err) };
  }

  return { message: 'Error desconocido' };
}
