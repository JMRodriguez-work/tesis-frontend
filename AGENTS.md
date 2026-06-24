# AGENTS.md — TFG Frontend

> Fuente de verdad de la arquitectura, convenciones y decisiones del proyecto frontend.
> **Leé este archivo completo antes de tocar cualquier archivo.**
> El backend con el que se comunica vive en otro repositorio. Su `AGENTS.md` es la otra mitad de la verdad.

---

## 1. Contexto del proyecto

Frontend del TFG "tesis-backend" (Cloudflare Workers + Hono + Drizzle + Neon + Better Auth). Es la **interfaz de usuario** de la plataforma de inteligencia analítica para almacenes y despensas pequeñas de Argentina.

El backend expone 61 endpoints OpenAPI en `/doc` y UI de Scalar en `/docs`. El front consume esos endpoints. No hay otro front ni duplicación de lógica.

**Stack (cerrado, no abrir debate salvo causa mayor):**

| Capa | Tecnología | Por qué |
|---|---|---|
| Build | **Vite 5+** | Estándar de facto, dev server rápido, HMR, output a Pages. |
| Framework | **React 19+** | Server components no; SPA puro. |
| Lenguaje | **TypeScript estricto** | `strict: true`, `noUncheckedIndexedAccess: true`. |
| Routing | **TanStack Router** (file-based, type-safe) | Tipos de rutas y search params derivados automáticamente. Reemplaza a React Router. |
| Server state | **TanStack Query v5** | Cache, revalidación, mutations, devtools. |
| Forms | **React Hook Form + Zod resolver** | Performance, validación tipada. |
| Estilos | **Tailwind CSS v4** | Utility-first, sin CSS-in-JS. |
| UI primitives | **shadcn/ui (Base UI)** | Copias en el repo (no paquete), accesibles, personalizables. |
| Iconos | **@phosphor-icons/react** | Tree-shakeable, sets por import. Decisión: usar phosphor (no lucide) porque el template de Vite lo trae y `components.json` lo define así. Si querés cambiar a lucide, hay que actualizar `components.json` + `package.json` + AGENTS. |
| HTTP | **openapi-fetch** | Cliente tipado derivado del OpenAPI del back. |
| Tipos back | **openapi-typescript** | Genera `src/api/types.ts` desde `/doc`. |
| Toasts | **sonner** | 3KB, API simple. |
| Tablas | **@tanstack/react-table v8** | Sorting, filtering, pagination. |
| Charts | **Recharts** | Solo si se necesita. |
| Lint/format | **Biome** (recomendado) o ESLint + Prettier | Un solo binario, rápido. Decisión en bootstrap. |
| Deploy | **Cloudflare Pages** | CORS al backend ya configurado. |

> **NO usar** (sin abrir debate):
> - Next.js, Astro, Remix, Vue, Svelte, Solid.
> - styled-components, Emotion, MUI, Chakra, Ant Design, Mantine.
> - Redux, MobX, Zustand (salvo necesidad real, ver §13).
> - SWR, Axios, React Query < v5.
> - CSS Modules, SCSS, LESS.
> - Internacionalización (`react-i18next`) en MVP. UI es-AR.

---

## 2. Filosofía: doc first, sin slop

**Esta sección es la más importante del documento.** Antes de escribir cualquier hook, componente o integración, **leer la documentación oficial** de la herramienta que vas a usar. Si la doc dice que algo es un anti-pattern, es un anti-pattern. Si dice "usar X para Y", usar X para Y. **No improvisar basándose en "lo que siempre se hace" en tutoriales random.**

### 2.1 Reglas duras (no se rompen, se debaten antes de romper)

1. **Un componente por archivo.** NUNCA dos componentes en el mismo `.tsx`. Si necesitás un sub-componente, va en su propio archivo. Sin excepciones.
2. **`useEffect` está prohibido salvo necesidad absoluta.** React 19+ resuelve la mayoría de los casos que motivaban `useEffect` con:
   - **Derived state**: calcular en el render, no en un effect (`const full_name = `${first_name} ${last_name}``).
   - **Event-driven**: hacer la acción en el handler del evento (`onChange`, `onClick`), no en un effect que observe el evento.
   - **External sync** (suscripción a WebSocket, listeners, timers, focus tracking): SÍ es válido. Documentar en un comentario por qué hace falta el effect.
   - Si un `useEffect` se vuelve necesario, citar la doc de React que justifica el caso. Si no hay doc que lo justifique, replantear.
   - Ref: <https://react.dev/learn/you-might-not-need-an-effect>.
3. **`useCallback` y `useMemo` no se usan por defecto.** Solo cuando hay un motivo concreto:
   - **`useMemo`**: cálculo costoso (>1ms) o que evita renders innecesarios en hijos memoizados.
   - **`useCallback`**: función pasada a un componente hijo memoizado (`React.memo`) que la usa en `useEffect` o `useMemo`. Si el hijo no está memoizado, no hace falta.
   - Ref: <https://react.dev/reference/react/useCallback#caveats> y <https://react.dev/reference/react/useMemo#caveats>.
   - **Default**: no usar. Si alguien te pide "optimizar", primero medir.
4. **No inventar abstracciones "por si acaso".** YAGNI. Tres líneas repetidas valen más que un helper mal diseñado.
5. **No "memorizar" JSX sin razón.** `React.memo` solo cuando hay perfilado que lo justifica.
6. **TypeScript estricto siempre.** Sin `any`, sin `// @ts-ignore`, sin `as unknown as X` salvo pattern narrowing real.
7. **Errores del backend se manejan en el componente que los dispara.** No en un `ErrorBoundary` global que traga todo. `ErrorBoundary` solo para errores de renderizado no anticipados.

### 2.2 Doc first

Antes de codear, abrir y leer:

- React 19: <https://react.dev/learn> (secciones "Thinking in React", "You might not need an effect", "Escape hatches").
- TanStack Router: <https://tanstack.com/router/latest/docs/framework/react/overview>.
- TanStack Query v5: <https://tanstack.com/query/latest/docs/framework/react/overview>.
- Tailwind v4: <https://tailwindcss.com/docs/installation>.
- shadcn/ui (Base UI): <https://ui.shadcn.com/docs> y el repo de Base UI: <https://base-ui.com/react/handbook/overview>.
- React Hook Form: <https://react-hook-form.com/get-started>.
- Zod: <https://zod.dev>.
- openapi-fetch: <https://openapi-ts.dev/openapi-fetch/>.
- sonner: <https://sonner.emilkowal.ski>.
- TanStack Table: <https://tanstack.com/table/latest/docs/introduction>.

**Si un snippet parece IA-slop (código inflado, abstracción prematura, comentarios obvios, dependencias innecesarias), reescribirlo. El código se lee más veces de las que se escribe.**

---

## 3. Modelo mental: Vite SPA + Worker backend

```
Cold dev start (Vite):
  1. Vite lee vite.config.ts + vite plugin de Tailwind v4
  2. Resuelve index.html → carga src/main.tsx
  3. main.tsx monta <App /> en #root dentro de <RouterProvider />
  4. App envuelve con <QueryClientProvider> + <Toaster /> + el router
  5. TanStack Router genera el árbol de rutas desde src/routes/
  6. El browser hace CORS preflight a localhost:8787 al primer fetch

Request HTTP desde el front:
  1. api.GET('/api/v1/items', { params: { query: { branchId, page: 1 } } })
  2. openapi-fetch: serializa query + path, agrega credentials: 'include', agrega Origin
  3. Browser: si Origin no está en Access-Control-Allow-Origin → bloquea
  4. Si pasa: viaja al Worker, Worker valida cookie de sesión, ejecuta el handler
  5. Response con Set-Cookie o body JSON
  6. openapi-fetch deserializa, valida contra el OpenAPI schema, devuelve { data, error }
  7. TanStack Query guarda en cache, dispara re-render de los componentes suscritos

Build a producción:
  1. pnpm run build → vite build → dist/ con index.html + assets/
  2. wrangler pages deploy dist → Cloudflare Pages sirve el bundle
  3. Las llamadas API van a https://<api>.workers.dev
  4. CORS del back ya está configurado para el origin de Pages
```

**Consecuencias:**

- **El browser es el estado**: cookies + localStorage (no usar) + cache de TanStack Query.
- **No hay SSR**. El primer paint es HTML vacío + bundle. Aceptable para un backoffice.
- **Routing client-side**. Las URLs `/sales/123` no existen en el server. Pages redirige a `index.html` (configurar `_redirects` o `404.html`).
- **Auth cookie-based**. Better Auth pone la cookie, viaja con `credentials: 'include'`. El front NO toca tokens.
- **CORS obligatorio**. El back tiene `http://localhost:5173` en `ALLOWED_ORIGINS` (ver `wrangler.jsonc` del back). Agregar el origin de Pages al deployar.

---

## 4. Estructura de directorios

Todo en **kebab-case**. Archivos `.tsx` solo para componentes, `.ts` para todo lo demás.

```
src/
├── main.tsx                              # Entry point. Mounts <App />. Sin lógica.
├── app.tsx                              # Top-level: <RouterProvider /> + <QueryClientProvider /> + <Toaster />
├── routes/                              # TanStack Router file-based routes
│   ├── __root.tsx                       # Layout raíz (providers, <Outlet />)
│   ├── login.tsx
│   ├── onboarding.tsx
│   ├── _authed/                         # Segmento protegido (layout anidado)
│   │   ├── route.tsx                    # beforeLoad: valida sesión
│   │   ├── dashboard.tsx
│   │   ├── items/
│   │   │   ├── index.tsx                # lista
│   │   │   ├── new.tsx
│   │   │   └── $item_id/
│   │   │       ├── index.tsx            # detail
│   │   │       └── edit.tsx
│   │   ├── sales/
│   │   ├── customers/
│   │   ├── warehouses/
│   │   ├── providers/
│   │   ├── provider-orders/
│   │   ├── recommendations/
│   │   ├── notifications/
│   │   ├── reports/
│   │   └── settings/
│   │       ├── organization.tsx
│   │       ├── branches.tsx
│   │       ├── users.tsx
│   │       └── external-data.tsx
│   └── 404.tsx
├── components/                          # Componentes compartidos. 1 por archivo.
│   ├── ui/                              # shadcn primitives (button, input, dialog, etc.)
│   ├── layout/                          # app-shell, sidebar, topbar
│   ├── data-table/                      # data-table, column-def, pagination
│   ├── feedback/                        # empty-state, error-state, error-boundary, skeleton
│   └── auth/                            # role-guard
├── api/                                 # Capa de datos (NO componentes)
│   ├── client.ts                        # openapi-fetch configurado
│   ├── types.ts                         # GENERADO por openapi-typescript. NO editar.
│   ├── queries/                         # 1 archivo por dominio
│   │   ├── use-auth.ts
│   │   ├── use-items.ts
│   │   ├── use-categories.ts
│   │   ├── use-warehouses.ts
│   │   ├── use-stock.ts
│   │   ├── use-customers.ts
│   │   ├── use-sales.ts
│   │   ├── use-providers.ts
│   │   ├── use-provider-orders.ts
│   │   ├── use-units.ts
│   │   ├── use-organizations.ts
│   │   ├── use-branches.ts
│   │   ├── use-users.ts
│   │   ├── use-recommendations.ts
│   │   ├── use-notifications.ts
│   │   ├── use-dashboard.ts
│   │   ├── use-reports.ts
│   │   ├── use-customer-analytics.ts
│   │   └── use-external-data.ts
├── lib/                                 # Utilidades puras, sin React
│   ├── format.ts                        # formatCurrency, formatDate, formatDecimal
│   ├── api-error.ts                     # mapApiError
│   ├── cn.ts                            # clsx + tailwind-merge
│   ├── query-keys.ts                    # factory de query keys
│   ├── query-client.ts                  # QueryClient singleton
│   ├── role.ts                          # roleFromId → 'Admin' | 'Manager' | 'Employee'
│   └── utils.ts                         # cn() (generado por shadcn init)
├── hooks/                               # Hooks genéricos (no de un dominio)
│   ├── use-debounce.ts
│   └── use-media-query.ts
├── types/                               # Tipos internos (no generados)
│   ├── env.d.ts
│   └── auth.ts
└── styles/
    └── globals.css                      # @import "tailwindcss";
```

### 4.1 Mapeo de módulos (front ↔ back)

| Módulo | Carpeta | Endpoints que consume |
|---|---|---|
| `auth` | `routes/login.tsx`, `routes/onboarding.tsx`, `api/queries/use-auth.ts` | `/api/auth/*`, `/api/v1/auth/me` |
| `items` | `routes/_authed/items/*`, `api/queries/use-items.ts` | `/api/v1/items`, `/api/v1/items/barcode/{code}`, `/api/v1/items/{id}/stock` |
| `categories` | anidado en items | `/api/v1/item-categories` |
| `warehouses` | `routes/_authed/warehouses/*`, `api/queries/use-warehouses.ts` | `/api/v1/warehouses`, `/api/v1/warehouses/{id}/stock` |
| `stock` | anidado en warehouses, items, stock-movements | `/api/v1/warehouses/{id}/stock`, `/api/v1/items/{id}/stock`, `/api/v1/warehouses/{id}/stock-movements` |
| `customers` | `routes/_authed/customers/*`, `api/queries/use-customers.ts` | `/api/v1/customers`, `/api/v1/customers/{id}/sales`, `/api/v1/customers/segments` |
| `sales` | `routes/_authed/sales/*`, `api/queries/use-sales.ts` | `/api/v1/sales`, `/api/v1/sales/{id}`, `/api/v1/sales/export` |
| `providers` | `routes/_authed/providers/*`, `api/queries/use-providers.ts` | `/api/v1/providers` |
| `provider-orders` | `routes/_authed/provider-orders/*`, `api/queries/use-provider-orders.ts` | `/api/v1/provider-orders` |
| `recommendations` | `routes/_authed/recommendations/*`, `api/queries/use-recommendations.ts` | `/api/v1/recommendations` |
| `notifications` | `routes/_authed/notifications/*`, `api/queries/use-notifications.ts` | `/api/v1/notifications`, `/api/v1/notifications/recommendations/{id}/read` |
| `dashboard` | `routes/_authed/dashboard.tsx`, `api/queries/use-dashboard.ts` | `/api/v1/dashboard/sales-summary`, `/api/v1/dashboard/product-rotation`, `/api/v1/dashboard/inactive-customers` |
| `reports` | `routes/_authed/reports/*`, `api/queries/use-reports.ts` | `/api/v1/reports/sales-trend`, `/api/v1/reports/revenue-timeline`, `/api/v1/reports/top-items`, `/api/v1/reports/category-distribution` |
| `customer-analytics` | `api/queries/use-customer-analytics.ts` | `/api/v1/customer-analytics/detect-inactive` |
| `external-data` | `routes/_authed/settings/external-data.tsx`, `api/queries/use-external-data.ts` | `/api/v1/external-data` |
| `organizations` | `routes/_authed/settings/organization.tsx`, `api/queries/use-organizations.ts` | `/api/v1/organizations/{id}` |
| `branches` | `routes/_authed/settings/branches.tsx`, `api/queries/use-branches.ts` | `/api/v1/branches` |
| `users` | `routes/_authed/settings/users.tsx`, `api/queries/use-users.ts` | `/api/v1/users` |
| `units` | `api/queries/use-units.ts` | `/api/v1/units` |

---

## 5. Convenciones de nomenclatura

**Regla única: kebab-case SOLO en nombres de archivos y carpetas.** Todo lo demás (variables, funciones, hooks, tipos, props) sigue la convención estándar de React/TypeScript en **camelCase**.

| Artefacto | Convención | Ejemplo |
|---|---|---|
| Archivos | `kebab-case` | `use-items.ts`, `app-shell.tsx`, `api-error.ts` |
| Carpetas | `kebab-case` | `routes/_authed/items/`, `components/ui/` |
| Componentes (nombre y tipo) | `PascalCase` (convención React) | `DataTable`, `AppShell`, `ProtectedRoute` |
| Componentes (archivo) | `kebab-case` con `PascalCase` adentro | `app-shell.tsx` exporta `function AppShell` |
| Hooks (nombre) | `camelCase` con prefijo `use` | `useItems`, `useDebounce`, `useMe` |
| Funciones puras | `camelCase` | `formatCurrency`, `mapApiError`, `cn` |
| Variables | `camelCase` | `isLoading`, `hasError`, `branchId` |
| Constantes | `SCREAMING_SNAKE_CASE` | `BASE_URL`, `QUERY_KEYS`, `MAX_LIMIT` |
| Tipos / Interfaces | `PascalCase` (sin prefijo `I`) | `AuthUser`, `ListItemsQuery`, `DataTableProps` |
| Enums / union types | `PascalCase` para el tipo, valores en `camelCase` o `snake_case` (lib externo) | `type Status = 'active' \| 'cancelled'` |
| Props de componentes propios | `camelCase` | `<AppShell onNavigate={...} />` |
| Handlers de eventos | `onCamelCase` (estándar React) | `onClick`, `onChange`, `onSubmit` |
| Props HTML nativas | `camelCase` (convención React) | `className`, `htmlFor` |
| Rutas URL (browser) | `/kebab-case` con segmentos `$paramId` | `/items/$itemId/edit` |
| Endpoints HTTP consumidos | match exacto del backend (kebab-case en el back) | `/api/v1/items`, `/api/v1/sale-items` |
| Variables de entorno | `VITE_*` (Vite) | `VITE_API_URL`, `VITE_ENV` |
| Query keys | `camelCase` strings o `as const` arrays | `['items', 'list', query]` |
| CSS classes (Tailwind) | tal cual (kebab-case nativo de Tailwind) | `bg-slate-50 text-slate-900` |
| Comentarios | español, completos | `// Calcula el total con descuento aplicado` |

> **Por qué kebab-case y no snake_case:** consistencia cross-repo con el backend (que usa kebab-case en sus archivos, ver `tesis-backend/AGENTS.md` §4). Coherencia: una sola convención de filenames en todo el proyecto TFG. TS/React lo soportan sin fricción y el path alias `@/` no cambia.

> **Por qué kebab-case y no snake_case para filenames**: inicialmente se eligió snake_case para "coherencia con el backend", pero el backend en realidad usa kebab-case (ver `tesis-backend/AGENTS.md` §4: `get-branches-paginated.use-case.ts`, `branches.repository.ts`, etc.). Migramos filenames a kebab-case para tener una sola convención cross-repo. Funciones, hooks y variables propios siguen en camelCase (convención React/TS). TS y React soportan ambos sin fricción.

---

## 6. Tipos globales

```typescript
// src/types/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_ENV: 'development' | 'staging' | 'production'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

```typescript
// src/types/auth.ts
export type UserRole = 'Admin' | 'Manager' | 'Employee'

export type AuthUser = {
  id: string
  email: string
  name: string
  organizationId: string | null
  branchId: string | null
  roleId: number
  isActive: boolean
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: AuthUser }
```

> Los tipos `User`, `Item`, `Sale`, etc. vienen de `src/api/types.ts` (generado). NO redefinir. Solo `AuthUser` es interno porque le agrega el mapping `roleId` (number) → `UserRole` (string derivado).

> **Decisión tipada**: el back devuelve `roleId: number` (1/2/3). El front lo mapea a `UserRole` (string) en `lib/role.ts`. Mantener el mapping en un solo lugar. Los nombres de campos en `AuthUser` están en camelCase por convención de TS, no en snake_case como la columna del back. El mapeo snake_case (DB) → camelCase (TS) lo hace openapi-typescript al regenerar `src/api/types.ts`. Hasta que se ejecute `pnpm run api:types`, este tipo es un placeholder local.

---

## 7. Stack técnico detallado

### 7.1 Vite + Tailwind v4

**`vite.config.ts`** (esqueleto):
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { port: 5173, strict_port: true },
})
```

**`src/styles/globals.css`** (Tailwind v4):
```css
@import "tailwindcss";

@theme {
  --color-brand-50: oklch(0.97 0.02 240);
  --color-brand-500: oklch(0.55 0.18 240);
  /* ... tokens de marca si se necesitan */
}
```

Tailwind v4 usa `@import "tailwindcss"` (no las 3 directivas v3). Los tokens se definen con `@theme {}`. **No hay `tailwind.config.ts`** salvo que se necesite el plugin de forms/typography.

Ref: <https://tailwindcss.com/docs/installation/using-vite>.

**`tsconfig.json`** (esqueleto):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "module_resolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

### 7.2 TanStack Router (file-based, type-safe)

**`src/routes/__root.tsx`** (layout raíz):
```typescript
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/feedback/error-boundary'
import { ErrorState } from '@/components/feedback/error-state'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'

type RouterContext = { queryClient: QueryClient }

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return (
    <ErrorBoundary fallback={<ErrorState error={new Error('Render error')} onRetry={() => window.location.reload()} />}>
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <Toaster position="top-right" richColors />
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
```

**`src/app.tsx`** (entry del router):
```typescript
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from '@/routeTree.gen'  // GENERADO por TanStack Router CLI
import { queryClient } from '@/lib/query-client'

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',  // preload on hover/focus
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export function App() {
  return <RouterProvider router={router} />
}
```

**Generación del route tree**:
```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "biome check .",
    "format": "biome format --write .",
    "type-check": "tsc -b --noEmit",
    "api:types": "openapi-typescript http://localhost:8787/doc -o src/api/types.ts",
    "routes:gen": "tsr generate"
  }
}
```

`pnpm run routes:gen` corre TanStack Router CLI y regenera `src/routeTree.gen.ts`. **Hacerlo después de cada cambio de archivos en `routes/`.** Requiere `tsr.config.json` en la raíz del proyecto (ver AGENTS §3 para la config). El vite plugin de TanStack Router también regenera el archivo en `dev` y `build`, así que en CI alcanza con `vite build`.

Ref: <https://tanstack.com/router/latest/docs/framework/react/guide/file-based-routing>.

**Rutas protegidas con segment `_authed` + `beforeLoad`**:
```typescript
// src/routes/_authed/route.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { fetchMe } from '@/api/queries/use-auth'
import { authKeys } from '@/lib/query-keys'

export const Route = createFileRoute('/_authed/route')({
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.fetchQuery({
      queryKey: authKeys.me(),
      queryFn: fetchMe,
      staleTime: 60_000,
    })
    if (!me) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    if (!me.organizationId) {
      throw redirect({ to: '/onboarding' })
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
```

> **Por qué no `useEffect` para el guard**: `beforeLoad` corre antes del render, así que el redirect sucede antes de que el componente protegido se monte. No hay flash, no hay race conditions. Ref: <https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes>.

### 7.3 TanStack Query v5

**`src/lib/query-client.ts`** (un solo cliente, lazy):
```typescript
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,             // 30s
      gcTime: 5 * 60_000,            // 5 min
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: { retry: 0 },
  },
})
```

**Patrón de hooks** (un archivo por dominio, kebab-case):
```typescript
// src/api/queries/use-items.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { itemKeys } from '@/lib/query-keys'
import type { paths } from '@/api/types'

type ListItemsQuery = NonNullable<
  paths['/api/v1/items']['get']['parameters']['query']
>
type CreateItemBody = NonNullable<
  paths['/api/v1/items']['post']['requestBody']['content']['application/json']
>

export function useItems(query: ListItemsQuery) {
  return useQuery({
    queryKey: itemKeys.list(query),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/items', { params: { query } })
      if (error) throw error
      return data
    },
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: itemKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/items/{id}', {
        params: { path: { id } },
      })
      if (error) throw error
      return data
    },
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateItemBody) => {
      const { data, error } = await api.POST('/api/v1/items', { body })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.lists() })
    },
  })
}
```

**Naming de hooks**: `use<Recurso>` para read, `useCreate<Recurso>`, `useUpdate<Recurso>`, `useDelete<Recurso>`, `use<Accion><Recurso>`. PascalCase en la segunda parte (`Item`, `Sale`, etc.). Sin sobreingeniería.

**`src/lib/query-keys.ts`** (factory centralizada):
```typescript
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (q: object) => [...itemKeys.lists(), q] as const,
  details: () => [...itemKeys.all, 'detail'] as const,
  detail: (id: string) => [...itemKeys.details(), id] as const,
}
```

> **Por qué query-keys centralizada**: TanStack Query invalida por prefijo de array. `itemKeys.lists()` te da `['items', 'list']` que matchea cualquier key que empiece así. Imposible equivocarse de typo.

Ref: <https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults> y <https://tkdodo.eu/blog/leveraging-the-query-function-context>.

### 7.4 openapi-fetch + openapi-typescript

**`src/api/client.ts`** (un solo archivo, sin lógica):
```typescript
import createClient from 'openapi-fetch'
import type { paths } from './types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8787'

export const api = createClient<paths>({
  baseUrl: BASE_URL,
  credentials: 'include',  // CRÍTICO: cookies de Better Auth
  headers: { 'Content-Type': 'application/json' },
})
```

**Generación de tipos**:
```bash
# Asegurarse de que el back está corriendo (localhost:8787)
pnpm run api:types
# → src/api/types.ts se regenera
```

`src/api/types.ts` es **GENERADO**. NO editar. Agregar a `.gitignore` hasta que la API sea estable. Si la API cambia, regenerar. Si rompe, fixear los call sites.

Ref: <https://openapi-ts.dev/openapi-fetch/> y <https://openapi-ts.dev/introduction>.

### 7.5 React Hook Form + Zod

**Schema primero, tipos derivados**:
```typescript
// src/lib/schemas/item.ts
import { z } from 'zod'

export const createItemSchema = z.object({
  name: z.string().min(1, 'Requerido').max(255),
  salePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Decimal inválido').optional(),
  branchId: z.string().uuid().optional(),
})

export type CreateItemInput = z.infer<typeof createItemSchema>
```

**Form** (un archivo por form, kebab-case):
```typescript
// src/routes/_authed/items/new.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useCreateItem } from '@/api/queries/use-items'
import { createItemSchema, type CreateItemInput } from '@/lib/schemas/item'
import { mapApiError } from '@/lib/api-error'

export const Route = createFileRoute('/_authed/items/new')({
  component: NewItemPage,
})

function NewItemPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateItemInput>({
    resolver: zodResolver(createItemSchema),
  })
  const createItem = useCreateItem()

  const onSubmit = handleSubmit((data) => {
    createItem.mutate(
      { body: data },
      {
        onSuccess: () => {
          toast.success('Item creado')
          // navigate se hace desde el form vía useNavigate o router.navigate
        },
        onError: (err) => toast.error(mapApiError(err).message),
      },
    )
  })

  return (
    <form onSubmit={onSubmit}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      <button type="submit" disabled={isSubmitting}>Crear</button>
    </form>
  )
}
```

> **Por qué no `useEffect` para `isSubmitting`**: react-hook-form ya gestiona el estado del submit internamente. `formState.isSubmitting` es la forma oficial (ref: <https://react-hook-form.com/api/useform/formstate>).

> **Schema local vs schema del back**: si el back ya valida con Zod, **no** duplicar. Si el front necesita un schema distinto (ej. para UX de confirmación), definir localmente en `src/lib/schemas/`.

Ref: <https://react-hook-form.com/get-started> y <https://zod.dev>.

### 7.6 Tailwind v4 + shadcn (Base UI)

**Setup**:
1. `pnpm dlx shadcn@latest init` — crea `components.json`, `lib/utils.ts` (con `cn()`), y los primeros componentes.
2. `pnpm dlx shadcn@latest add button input dialog` — agrega primitives.
3. Cada primitive va en su propio archivo en `src/components/ui/`.

**`src/lib/cn.ts`** (helper de Tailwind merge):
```typescript
import { clsx, type ClassValue } from 'clsx'
import { tw_merge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return tw_merge(clsx(inputs))
}
```

**Convención de clases**:
- Mobile-first. `sm:`, `md:`, `lg:`, `xl:` para breakpoints.
- Sin valores mágicos: `bg-slate-50`, NO `bg-[#f0f0f0]`. Excepciones solo para tokens únicos de la marca (definidos en `@theme`).
- Espaciado: `p-4`, `gap-2`, `space-y-4`, `space-x-2`.
- `cn()` para variantes condicionales, NO template strings.

**shadcn + Base UI**: shadcn es un set de recipes que copia código a tu repo (no es un paquete). Base UI es la底层 accesible (de los mismos autores que Radix UI, pero API modernizada). El output es accesible WCAG-compliant por default.

Ref: <https://ui.shadcn.com/docs> y <https://base-ui.com/react/handbook/overview>.

### 7.7 phosphor-icons (iconos)

```typescript
import { ShoppingCart, User, Package } from '@phosphor-icons/react'

<ShoppingCart className="h-5 w-5" weight="regular" />
```

Tree-shaken. **No** instalar MUI Icons, FontAwesome, lucide-react (mantenerse en phosphor por consistencia).

Ref: <https://phosphoricons.com/>.

---

## 8. Patrón de implementación por feature

Cada feature nueva sigue este orden. **No improvisar variantes.**

### 8.1 Reglas de oro

1. **Un componente por archivo.** Sin excepciones.
2. **No `useEffect`** salvo necesidad absoluta con justificación documentada.
3. **No `useCallback`/`useMemo`** sin razón concreta.
4. **Derivar estado en el render**, no en effects.
5. **Errores en el componente que los dispara** (no en un ErrorBoundary global).
6. **URL = fuente de verdad** para filtros, page, sort (vía TanStack Router search params).

### 8.2 Query hook (read)

1. Verificar que existe la key en `src/lib/query-keys.ts`. Si no, agregarla.
2. Crear `src/api/queries/use-<recurso>.ts` con `use<Recurso>(query)`.
3. Consumir en la ruta: `const { data, isLoading, error } = useItems({ branchId, page: 1 })`.
4. Render: `isLoading` → `<Skeleton />`; `error` → `<ErrorState onRetry={refetch} />`; `data` → `<DataTable data={data.data.data} meta={data.data.meta} />`.

### 8.3 Mutation hook (write)

1. `useCreate<Recurso>`, `useUpdate<Recurso>`, `useDelete<Recurso>` en el mismo archivo.
2. `onSuccess`: `qc.invalidateQueries({ queryKey: <recurso>Keys.lists() })`.
3. Consumir: `const createItem = useCreateItem(); createItem.mutate({ body: data }, { onSuccess: () => toast.success('...') })`.

### 8.4 Form page (create/edit)

1. Schema Zod en `src/lib/schemas/<recurso>.ts` (un archivo por recurso).
2. `useForm` con `zodResolver`. NUNCA `useState` para el form.
3. Inputs: primitives de `@/components/ui/` (Button, Input, etc.).
4. Submit: `handleSubmit` → `mutation.mutate`.
5. Loading: `isSubmitting` o `mutation.isPending` → button disabled + spinner.
6. Error del server: `toast.error(mapApiError(err).message)` en el `onError` del mutate.
7. Success: `toast.success(...)` + `router.navigate({ to: '/...' })` o cerrar modal.

### 8.5 Detail page

1. `use<Recurso>(id)` para fetch. `id` viene de `Route.useParams()`.
2. `useUpdate<Recurso>()` y `useDelete<Recurso>()` para acciones inline.
3. Si tiene sub-recursos, cargarlos en paralelo con `useQueries` (TanStack Query).
4. Breadcrumb: derivar del path, no hardcodear.

### 8.6 List page con paginación

1. Search params del router como source of truth: `const { page, search, categoryId } = Route.useSearch()`.
2. Cambios: `router.navigate({ to: '.', search: (prev) => ({ ...prev, page: 2 }) })`.
3. Query: `useItems({ page, search, categoryId, branchId })`.
4. `<DataTable>` con paginación server-side (lee `meta` del response).

> **Por qué `useSearchParams` NO se usa**: TanStack Router tiene su propio sistema de search params, type-safe, serializa automáticamente. Ref: <https://tanstack.com/router/latest/docs/framework/react/guide/search-params>.

---

## 9. Auth flow

### 9.1 Login

```typescript
// src/api/queries/use-auth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { authKeys } from '@/lib/query-keys'
import type { paths } from '@/api/types'

type SignInBody = NonNullable<
  paths['/api/auth/sign-in/email']['post']['requestBody']['content']['application/json']
>

export function useMe() {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/auth/me')
      if (error) return null  // 401 = no autenticado, no es error
      return data
    },
    staleTime: 60_000,
  })
}

export function useSignIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: SignInBody) => {
      const { data, error } = await api.POST('/api/auth/sign-in/email', { body })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me() }),
  })
}

export function useSignOut() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await api.POST('/api/v1/auth/sign-out')
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: authKeys.me() }),
  })
}
```

### 9.2 Rutas protegidas con `beforeLoad`

```typescript
// src/routes/_authed/route.tsx
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/app-shell'
import { fetchMe } from '@/api/queries/use-auth'
import { authKeys } from '@/lib/query-keys'

export const Route = createFileRoute('/_authed/route')({
  beforeLoad: async ({ context, location }) => {
    const me = await context.queryClient.fetchQuery({
      queryKey: authKeys.me(),
      queryFn: fetchMe,
      staleTime: 60_000,
    })
    if (!me) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
    if (!me.organizationId) {
      throw redirect({ to: '/onboarding' })
    }
  },
  component: AuthedLayout,
})

function AuthedLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
```

### 9.3 RoleGuard (componente, no effect)

```typescript
// src/components/auth/role-guard.tsx
import type { ReactNode } from 'react'
import { Navigate } from '@tanstack/react-router'
import { useMe } from '@/api/queries/use-auth'
import { roleFromId, type UserRole } from '@/lib/role'

type RoleGuardProps = { allow: readonly UserRole[]; children: ReactNode }

function RoleGuard({ allow, children }: RoleGuardProps) {
  const { data: me, isLoading } = useMe()
  if (isLoading) return null
  if (!me) return <Navigate to="/login" />
  const role = roleFromId(me.roleId)
  if (!role || !allow.includes(role)) {
    return <Navigate to="/dashboard" />
  }
  return <>{children}</>
}

export { RoleGuard }
```

Ref: <https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes>.

---

## 10. Manejo de errores

### 10.1 Mapear errores del backend a mensajes en español

```typescript
// src/lib/api-error.ts
export type ApiErrorPayload = { message: string; field?: string }

export function mapApiError(err: unknown): ApiErrorPayload {
  if (err instanceof Error) {
    if (err.message.includes('Failed to fetch')) {
      return { message: 'No se pudo conectar con el servidor. Verificá tu conexión.' }
    }
    return { message: err.message }
  }
  return { message: 'Error desconocido' }
}
```

### 10.2 Toast para feedback global

`sonner`:
```typescript
// src/routes/__root.tsx
import { Toaster } from '@/components/ui/sonner'

<QueryClientProvider client={queryClient}>
  <Outlet />
  <Toaster position="top-right" richColors />
</QueryClientProvider>
```

```typescript
import { toast } from 'sonner'
import { mapApiError } from '@/lib/api-error'

createItem.mutate(
  { body: data },
  {
    onSuccess: () => toast.success('Item creado'),
    onError: (err) => toast.error(mapApiError(err).message),
  },
)
```

### 10.3 ErrorBoundary para crashes de renderizado

Solo para errores NO anticipados (bugs reales). Errores anticipados (404, 401, 422) se manejan en el componente.

```typescript
// src/components/feedback/error-boundary.tsx (un componente por archivo)
import { Component, type ReactNode } from 'react'

type ErrorBoundaryProps = { children: ReactNode; fallback: ReactNode }
type ErrorBoundaryState = { hasError: boolean }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }
  componentDidCatch(error: Error) {
    console.error('Unexpected render error:', error)
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

export { ErrorBoundary }
```
```

> Esto es el único caso válido de un componente con `state` propio. Documentado por la doc oficial: <https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary>.

---

## 11. Variables de entorno

| Variable | Default dev | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8787` | URL del backend. Prod: `https://tfg-backend.<sub>.workers.dev`. |
| `VITE_ENV` | `development` | `development` / `staging` / `production`. |

**`.env.example`** (commiteable):
```
VITE_API_URL=http://localhost:8787
VITE_ENV=development
```

**`.env.local`** (NO committeable, `.gitignore` lo excluye):
```
VITE_API_URL=https://mi-backend-staging.workers.dev
```

**Build-time vs runtime**: Vite embebe `VITE_*` en el bundle en build time. Cambiar una env var requiere rebuild. **No** son dinámicas.

---

## 12. Patrón de componentes UI

### 12.1 shadcn/ui (Base UI) — primitives en `src/components/ui/`

shadcn copia el código al repo. Cada primitive va en su **propio archivo**:

```
src/components/ui/
├── button.tsx
├── input.tsx
├── label.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── combobox.tsx
├── textarea.tsx
├── checkbox.tsx
├── table.tsx
├── badge.tsx
├── card.tsx
├── skeleton.tsx
├── sonner.tsx
└── ...
```

Reglas:

- **Un componente por archivo.** `button.tsx` exporta `Button`. NO poner `ButtonGroup` ahí. Si necesitás `ButtonGroup`, va en su propio archivo.
- **Componentes compound** (como `Dialog.Header`, `Dialog.Title`) van en el mismo archivo del componente padre, NO en archivos separados. Ej: `Dialog.Header` y `Dialog.Title` viven en `dialog.tsx`.
- **Props del componente**: `camelCase` (`onClick`, `isOpen`, `children`). Las props de primitives de shadcn/Base UI se mantienen en camelCase nativo de React.
- **Ref forwarding** cuando se use con react-hook-form (`forward_ref` solo si es necesario; React 19 ya tiene `ref` como prop normal, no necesita `forwardRef`).

#### 12.0.1 Selección con opciones: `Combobox`, nunca `Select`

**No usar `Select` de Base UI para nada.** El wrapper `<Select>` quedó deprecated en favor de `<ComboboxField>` (definido en `src/components/ui/combobox.tsx`).

Razones:

1. **Accesibilidad**: `Select` de Base UI no incluye un input de búsqueda por default, y nuestro wrapper `ComboboxField` ya integra label visible, popup con filtrado por typing, y un botón de clear — todo WCAG-compliant out-of-the-box.
2. **Sin magic values**: `Combobox` acepta `null` como "ningún valor seleccionado" (no necesitamos `'all'`, `'none'`, `''` ni similares para representar ausencia de valor).
3. **UX consistente**: todo el proyecto tiene el mismo look & feel. No hay un `<Select>` para filtros y un `<Combobox>` para forms.

**API del wrapper** (`src/components/ui/combobox.tsx`):

```typescript
import { ComboboxField, type ComboboxItem } from '@/components/ui/combobox';

type ComboboxItem = { label: string; value: string | null };

<ComboboxField
  id="categoryId"              // opcional, se genera con useId() si se omite
  label="Categoría"            // REQUERIDO, siempre visible
  items={categoryItems}        // ComboboxItem[]
  value={watch('categoryId') ?? null}  // string | null
  onValueChange={(v) => setValue('categoryId', v ?? undefined)}
  placeholder="Sin categoría"  // opcional
  emptyMessage="Sin resultados"  // opcional
  className="w-56"             // opcional, ancho del contenedor
/>
```

**Convenciones de los items:**

- El `label` es lo que ve el user. **Siempre legible, humano**, en es-AR. Nunca `cat.id` ni códigos.
- El `value` es lo que se persiste. Preferentemente `string` (UUID, slug, código). **Nunca** mostrar el `id` al user.
- Para representar "ningún valor", usar `value: null` con un `label` que diga "— Sin categoría —" o "— Ninguno —". El combobox lo trata como un item normal; el handler recibe `null` y vos hacés el mapping (`v ?? undefined`).
- `items` se computa con `useMemo` para no recrear el array en cada render:

```typescript
const categoryItems: ComboboxItem[] = useMemo(
  () => [
    { label: '— Sin categoría —', value: null },
    ...(categories?.map((cat) => ({ label: cat.name, value: cat.id })) ?? []),
  ],
  [categories],
);
```

**Labels siempre visibles**: el `label` es requerido. No usar solo el `placeholder` del trigger (los screen readers no anuncian placeholders como labels). Si el filtro es "Buscar", poner un `<label htmlFor="...">Buscar</label>` arriba del `<Input>` aunque el `<Input>` no tenga prop `label`.

**Para `<Input>` de filtros que no son combobox**: envolver en un `<div className="flex flex-col gap-1.5">` con un `<label htmlFor="...">` adentro, igual que `ComboboxField` lo hace internamente. Mantener consistencia visual.

```bash
# Agregar un primitive
pnpm dlx shadcn@latest add button
# Crea src/components/ui/button.tsx y actualiza components.json
```

Ref: <https://ui.shadcn.com/docs/components>.

### 12.2 NO reinventar accessibility

shadcn ya da accessibility out-of-the-box (focus trap, escape, aria-attributes). **No** construir modales con `position: fixed` y click-outside manual. **No** construir dropdowns con CSS-only. Usar los primitives.

### 12.3 DataTable genérico

```typescript
// src/components/data-table/data-table.tsx (un solo componente)
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

type DataTableMeta = { page: number; limit: number; total: number; totalPages: number }

type DataTableProps<T> = {
  data: T[]
  columns: ColumnDef<T>[]
  meta?: DataTableMeta
  onPageChange?: (page: number) => void
  isLoading?: boolean
}

function DataTable<T>({ data, columns, meta, onPageChange, isLoading }: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (isLoading) return <Skeleton />

  return (
    <div className="rounded-lg border border-slate-200">
      <table className="w-full">
        <thead className="bg-slate-50">
          {/* ... */}
        </thead>
        <tbody>
          {/* ... */}
        </tbody>
      </table>
      {meta && <Pagination meta={meta} onPageChange={onPageChange} />}
    </div>
  )
}

export { DataTable }
```

`pagination.tsx` y `column-def.ts` van en archivos separados.

Ref: <https://tanstack.com/table/latest/docs/introduction>.

### 12.4 `cn()` para variants

```typescript
import { cn } from '@/lib/utils'

<button className={cn(
  'px-4 py-2 rounded-md font-medium',
  variant === 'primary' && 'bg-brand-500 text-white',
  variant === 'ghost' && 'bg-transparent text-slate-700',
  isLoading && 'opacity-50 cursor-not-allowed',
)} />
```

---

## 13. Estado y cache

- **Server state** (datos del backend): **TanStack Query**. NUNCA `useState` para listas u objetos del server.
- **UI state** (forms, modals, toggles): `useState`, `useForm` (react-hook-form).
- **URL state**: search params de TanStack Router. URL es la fuente de verdad para filtros, page, sort.
- **Estado global cross-page** (raro): Zustand si se necesita. NO Redux. NO Context para estado de UI.

```bash
pnpm add zustand  # solo si se necesita
```

> **Por qué Zustand y no Context**: Context re-renderiza todos los consumers cuando cambia el value, sin selector. Zustand tiene selector-based subscriptions. Si el estado se lee desde >3 componentes profundamente anidados, vale. Si no, prop drilling.

### 13.1 Branch store: contrato de "branch activa"

El store en `src/lib/branch-store.ts` mantiene la **branch activa** del user. Es consumido por pantallas, queries y mutaciones scope-by-branch (item-categories, items, sales, etc.).

**Contrato del `BranchHydrator` (`src/components/layout/branch-hydrator.tsx`):**

- Garantiza que `currentBranchId` siempre tiene un valor válido **mientras haya branches en la org**.
- Para **Admin**: si `currentBranchId` es `null` o apunta a una branch que ya no existe (soft-deleted), autoselecciona la primera de la lista.
- Para **Manager/Employee**: sincroniza `currentBranchId = me.branchId` si difiere.
- Caso degenerado: si la org no tiene branches (`branches.length === 0`), el store queda con `currentBranchId = null`. **Esto es responsabilidad de las páginas** manejar el caso via `enabled: false` en queries o guard.

**Patrón para páginas Admin** (típico, scope-by-branch):

```typescript
const currentBranchId = useCurrentBranchId();
const adminBranchId = role === 'Admin' ? currentBranchId ?? undefined : undefined;

const { data, isLoading, error } = useItems(
  { branchId: adminBranchId, ...otherFilters },
  { enabled: role !== 'Admin' || !!currentBranchId },
);
```

- `useItems` y `useItemCategories` aceptan un segundo argumento `options?: Pick<UseQueryOptions, 'enabled'>` para controlar cuándo se dispara el query.
- `enabled: role !== 'Admin' || !!currentBranchId` es el patrón estándar: Manager/Employee siempre se dispara (el back fuerza su branch); Admin solo si tiene branch activa.
- **NO** agregar un filtro de "Sucursal" en cada página. La branch activa del store es la única branch visible. Si Admin quiere ver otra branch, usa el `<BranchSelector>` del topbar (cambio consciente, global).

**Lo que NO se hace:**

- ❌ `isAdminWithoutBranch` con `<Alert>` en cada página. El hydrator ya garantiza branch activa.
- ❌ Filtros de "Todas las sucursales" o "Seleccionar sucursal" en páginas de scope-by-branch. El back exige `branchId` para Admin y filtra por su branch para Manager/Employee.
- ❌ Pasar `branchId` distinto a la branch activa. La branch activa es global.

---

## 14. Performance

Optimizar **después** de medir. Por default, dejá que React haga lo suyo.

- **Code splitting por ruta**: TanStack Router lo hace por default con file-based routing. Cada archivo en `routes/` es un chunk.
- **Preload on intent**: `defaultPreload: 'intent'` en el router (precarga al hover/focus).
- **Debounce en inputs de búsqueda**: 300ms. NO menos (jank al tipear).
- **Imágenes**: `loading="lazy"` si se suben. `@unpic/react` para Cloudflare Images.
- **Bundle size**: `pnpm run build` muestra el tamaño. Apuntar a <500KB gzipped para el shell. El resto se carga por chunk bajo demanda.

**No hacer**:
- `React.memo` por default. Solo con perfilado.
- `useMemo` para cálculos triviales. Solo para >1ms o referencias en deps.
- `useCallback` por default. Solo cuando la función se pasa a un `React.memo` child.
- `useEffect` para "sincronizar" state que se puede derivar.

---

## 15. Testing

Recomendación: **NO agregar tests automatizados en el MVP**. Criterio del proyecto (heredado del back): "verificación por curl + browser". Si el TFG requiere tests, agregar Vitest + React Testing Library en un sprint posterior.

```bash
pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom
```

Si se agrega: testear **comportamiento** (qué hace el componente, no cómo lo hace). Un test por file, idealmente cerca del código (`co-located`).

---

## 16. Convenciones de commit y PRs

(Si este es un repo nuevo, definir a gusto. Sugerencia: Conventional Commits + PR template con checklist de "qué probé en el browser".)

---

## 17. Lo que NO está en este proyecto (fuera de scope)

- SSR / SSG / RSC → NO. Es un SPA puro.
- Server actions → NO. Toda mutación va por la API del back.
- WebSockets → NO soportado en Cloudflare Workers barato. Usar polling de TanStack Query (`refetch_interval`).
- Push notifications del browser → NO en MVP. Usar toast + campana de notifications in-app.
- Internacionalización → NO en MVP. UI es-AR. Si se necesita i18n, agregar `react-i18next` después.
- Modo offline → NO. Asumimos conexión constante.
- PWA / installable → NO en MVP. `vite-plugin-pwa` después si se necesita.
- Animaciones complejas → NO en MVP. Si se necesitan, `framer-motion` después.
- Dark mode → NO en MVP. Tailwind v4 lo soporta out-of-the-box (`dark:` prefix), pero no lo activamos.

---

## 18. Checklist pre-feature

Antes de mergear una feature a `main`:

- [ ] `pnpm run type-check` pasa
- [ ] `pnpm run build` pasa
- [ ] `pnpm run routes:gen` ejecutado (si tocaste `routes/`)
- [ ] Probada manualmente en el browser con dev server
- [ ] Sin warnings en la consola del browser
- [ ] Sin warnings de CORS
- [ ] Sin requests con `Content-Type: application/json` enviados como `text/plain` (el back los rechaza)
- [ ] `src/api/types.ts` regenerado si cambió la API (`pnpm run api:types`)
- [ ] Si creaste archivos nuevos, `pnpm run routes:gen` los detectó
- [ ] **No** se commitea `src/api/types.ts` mientras la API esté en movimiento (`.gitignore`)
- [ ] **No** se commitea `.env.local`, `.env.production`, ni archivos de env con secrets
- [ ] Si agregaste deps, justificadas en el commit message (no `pnpm add` sin pensar)

---

## 19. Recursos

- **Backend** (separado): el repo de `tesis-backend`. Su `AGENTS.md` y `TODO.md` son la otra mitad de la verdad.
- **OpenAPI spec local**: `http://localhost:8787/doc` (JSON) y `http://localhost:8787/docs` (Scalar UI).
- **React 19**: <https://react.dev/learn> + <https://react.dev/reference/react/hooks>.
- **TanStack Router**: <https://tanstack.com/router/latest/docs/framework/react/overview>.
- **TanStack Query v5**: <https://tanstack.com/query/latest/docs/framework/react/overview> + <https://tkdodo.eu/blog> (mantainer escribe los mejores posts).
- **TanStack Table v8**: <https://tanstack.com/table/latest/docs/introduction>.
- **Tailwind v4**: <https://tailwindcss.com/docs/installation/using-vite>.
- **shadcn/ui (Base UI)**: <https://ui.shadcn.com/docs> + <https://base-ui.com/react/handbook/overview>.
- **React Hook Form**: <https://react-hook-form.com/get-started>.
- **Zod**: <https://zod.dev>.
- **openapi-fetch**: <https://openapi-ts.dev/openapi-fetch/>.
- **sonner**: <https://sonner.emilkowal.ski>.
- **@phosphor-icons/react**: <https://phosphoricons.com/>.
- **Vite**: <https://vitejs.dev>.
- **Better Auth** (solo si necesitamos client SDK; normalmente no): <https://www.better-auth.com/docs/concepts/client>.
