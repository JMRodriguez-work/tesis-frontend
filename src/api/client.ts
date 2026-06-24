import create_client from 'openapi-fetch';
import type { paths } from './types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787';

export const api = create_client<paths>({
  baseUrl: BASE_URL,
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
});
