export type ApiErrorPayload = { message: string; field?: string };

export function mapApiError(err: unknown): ApiErrorPayload {
  if (err instanceof Error) {
    if (err.message.includes('Failed to fetch')) {
      return { message: 'No se pudo conectar con el servidor. Verificá tu conexión.' };
    }
    return { message: err.message };
  }
  return { message: 'Error desconocido' };
}
