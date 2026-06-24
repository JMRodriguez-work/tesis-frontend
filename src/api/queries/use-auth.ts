import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { paths } from '@/api/types';
import { authKeys } from '@/lib/query-keys';
import type { OnboardingInput } from '@/lib/schemas/auth';
import type { AuthUser } from '@/types/auth';

type MeResponse = NonNullable<
  paths['/api/v1/auth/me']['get']['responses']['200']['content']['application/json']
>;
type MeData = MeResponse['data'];
type OnboardingResponse = NonNullable<
  paths['/api/v1/onboarding']['post']['responses']['200']['content']['application/json']
>;
type OnboardingData = OnboardingResponse['data'];

/**
 * Sign-in y sign-up usan los endpoints nativos de Better Auth
 * (`/api/auth/sign-in/email`, `/api/auth/sign-up/email`). El back los monta
 * con `app.on(['POST','GET'], '/api/auth/**', ...)` y los wrappea para
 * traducir errores a es-AR, pero NO los documenta en OpenAPI
 * (ver `tesis-backend/AGENTS.md` §8.4). Por eso no aparecen en `paths`:
 * los declaramos localmente vía module augmentation para tener type-safety
 * en el cliente. La shape matchea la doc oficial de Better Auth.
 * Ref: https://www.better-auth.com/docs/authentication/email-password
 */
declare module '@/api/types' {
  interface paths {
    '/api/auth/sign-in/email': {
      post: {
        requestBody: {
          content: { 'application/json': { email: string; password: string } };
        };
        responses: {
          200: {
            content: {
              'application/json': {
                token: string;
                user: { id: string; email: string; name: string };
              };
            };
          };
          400: { content?: never };
          401: { content?: never };
        };
      };
    };
    '/api/auth/sign-up/email': {
      post: {
        requestBody: {
          content: { 'application/json': { email: string; password: string; name: string } };
        };
        responses: {
          200: {
            content: {
              'application/json': {
                token: string;
                user: { id: string; email: string; name: string };
              };
            };
          };
          400: { content?: never };
          422: { content?: never };
        };
      };
    };
  }
}

export async function fetchMe(): Promise<AuthUser | null> {
  const { data, error } = await api.GET('/api/v1/auth/me');
  if (error || !data) return null;
  return data.data as AuthUser;
}

export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: fetchMe,
    staleTime: 60_000,
  });
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email: string; password: string }) => {
      const { data, error } = await api.POST('/api/auth/sign-in/email', { body });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me() }),
  });
}

export function useSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email: string; password: string; name: string }) => {
      const { data, error } = await api.POST('/api/auth/sign-up/email', { body });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me() }),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await api.POST('/api/v1/auth/sign-out');
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me() }),
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: OnboardingInput): Promise<OnboardingData> => {
      const { data, error } = await api.POST('/api/v1/onboarding', { body });
      if (error || !data) throw error ?? new Error('Onboarding failed');
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me() }),
  });
}

export type { MeData, OnboardingData };
