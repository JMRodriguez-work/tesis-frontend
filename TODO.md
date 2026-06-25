# TODO — TFG Frontend

> Fuente de verdad del progreso del proyecto frontend. Actualizá este archivo al completar cada tarea.
> Convención: `[ ]` pendiente · `[x] completo` · `[~]` en progreso · `[!]` bloqueado
>
> **Backend** vive en otro repo. Su `AGENTS.md` y `TODO.md` son la otra mitad de la verdad. Cualquier cambio de contrato de API debe coordinarse con el back.
>
> **Stack del front (cerrado, no abrir debate):** Vite 5 · React 19 · TypeScript estricto · **TanStack Router** (file-based, type-safe) · TanStack Query v5 · React Hook Form + Zod · **Tailwind CSS v4** · **shadcn/ui (Base UI)** · openapi-fetch · @phosphor-icons/react · sonner · @tanstack/react-table v8 · Biome. Detalle en `AGENTS.md` §1 y §7.
>
> **Convención de nomenclatura (regla del repo, ver `AGENTS.md` §5):**
> - **kebab-case SOLO en nombres de archivos y carpetas** (`use-items.ts`, `routes/_authed/items/`, `api-error.ts`).
> - **Todo lo demás** (funciones, hooks, variables, tipos, props, constantes) sigue convención estándar React/TypeScript en **camelCase** (`useItems`, `formatCurrency`, `isLoading`, `useMe`, `cn`, `BASE_URL` para constantes).
> - **Excepción:** `SCREAMING_SNAKE_CASE` para constantes.
> - **Props de primitives de shadcn/Base UI no se renombran** (vienen en camelCase por convención de las libraries).
> - **Excepción de kebab-case:** las URL se mantienen kebab (`/api/v1/sales`, `/api/v1/provider-orders`), y los segmentos de TanStack Router que se traducen a URL (`_authed/provider-orders/`, `_authed/stock-movements/`) también. Esto es consistencia entre el nombre de carpeta del front y la URL.
> - Si una tarea del TODO dice "snake_case en X", se interpreta como "kebab-case para archivos/carpetas, camelCase para el resto" según corresponda.
>
> **Mapeo con el backend:** cada sprint/feature del back tiene su contraparte acá. La tabla de "Progreso general" al final lista qué % de cada fase del back tiene UI.

---

## FASE 0 — Fundación
> Prerequisito duro. Nada de Fase 1+ arranca sin esto completo.

### 0.1 Setup del proyecto
- [x] Repo `tesis-frontend/` (separado del back, mismo `org/` en GitHub)
- [x] `pnpm create vite@latest . -- --template react-ts` (React 19 + TypeScript)
- [x] Dependencias core instaladas: TanStack Router (file-based, type-safe), TanStack Query v5, TanStack Table v8, React Hook Form + Zod, openapi-fetch, Tailwind v4, clsx + tailwind-merge, phosphor-icons, sonner
- [x] devDependencies: openapi-typescript (genera `src/api/types.ts`), Biome (reemplaza ESLint), @tanstack/router-cli
- [x] `tsconfig.app.json`: `strict: true`, `noUncheckedIndexedAccess: true`, `target: ES2022`, `module: ESNext`, `moduleResolution: bundler`, `jsx: react-jsx`, paths `@/*`
- [x] `vite.config.ts`: plugins `react()`, `@tailwindcss/vite()`, `@tanstack/router-plugin/vite()`, alias `@`, port 5173, `strictPort: true`
- [x] `src/styles/globals.css`: `@import "tailwindcss";` + tokens de fuentes en `@theme`
- [x] shadcn init corrido (registry `base-lyra`, `iconLibrary: "phosphor"`)
- [x] `src/lib/cn.ts` + `src/lib/utils.ts` (helpers de `tailwind-merge` + `clsx`)
- [x] `biome.json` con config recomendada (formatter, linter, overrides para `ui/`, `*.css`, `public/`)
- [x] `.env.example` (commiteable), `.env.local` y `.env.production` (en `.gitignore`)
- [x] `.gitignore`: `.env.local`, `.env.production`, `src/api/types.ts`, `src/routeTree.gen.ts`, `dist/`, `node_modules/`
- [x] `package.json` scripts: `dev`, `build`, `preview`, `lint`, `lint:fix`, `format`, `type-check`, `api:types`, `routes:gen`
- [x] ESLint completamente removido (deps + config) — migrado a Biome

**Notas de cierre 0.1:**
- TypeScript en `5.9.3` (no 6.x) por incompatibilidad de `openapi-typescript@7` con TS 6.
- ESLint → Biome: `eslint.config.js` + 5 deps borradas. AGENTS §1 lo recomienda.
- `@tailwindcss/forms` y `@tailwindcss/typography` NO instalados (YAGNI, AGENTS §7.1).
- 13 primitives de shadcn en `src/components/ui/`. Quirk documentado de la CLI con el alias `@/`.
- Variables de entorno: `VITE_API_URL` (default `http://localhost:8787`) y `VITE_ENV`. Build-time, no runtime.
- `tsr.config.json` necesario para `tsr generate`. Configurado con `routeToken: "Route"` y `generatedRouteTree: "./src/routeTree.gen.ts"`.

### 0.2 Capa de API
- [x] `src/api/client.ts` con `createClient<paths>({ baseUrl, credentials: 'include' })` y `Content-Type: application/json`
- [x] `src/api/types.ts` — placeholder inicial (`paths = Record<string, never>`), regenerado contra el back en Sprint 0.4
- [x] `src/lib/queryKeys.ts` con factories por dominio: `authKeys`, `itemKeys`, `customerKeys`, `saleKeys`, `warehouseKeys`, etc.
- [x] `src/lib/apiError.ts` con `mapApiError(err)` (devuelve `ApiErrorPayload` con `message` mapeado a español)
- [x] `src/lib/format.ts` con `formatCurrency`, `formatDate`, `formatDecimal` (es-AR, vía `Intl.NumberFormat` y `Intl.DateTimeFormat`)
- [x] `src/lib/role.ts` con `roleFromId(roleId)` y tipo `UserRole = 'Admin' | 'Manager' | 'Employee'`
- [x] `src/types/env.d.ts` con tipos de `import.meta.env`
- [x] `src/types/auth.ts` con tipos `AuthUser`, `AuthState` (camelCase, matcheando el shape del back)
- [x] `src/api/queries/use-auth.ts` con `fetchMe`, `useMe`, `useSignIn`, `useSignOut`, `useSignUp`, `useCompleteOnboarding` (todos tipados con `paths` + module augmentation para Better Auth endpoints)

### 0.3 Layout + routing base
- [x] `src/routes/__root.tsx` con `createRootRouteWithContext<RouterContext>()` + `<Outlet />` + `<Toaster />` + `<QueryClientProvider>` + `<ReactQueryDevtools>` + `<ErrorBoundary>`
- [x] `src/main.tsx` monta `<App />` en `#root` con `<StrictMode>`
- [x] `src/app.tsx` con `createRouter({ routeTree, context, defaultPreload: 'intent', scrollRestoration: true })` + `<RouterProvider>` + `declare module '@tanstack/react-router'`
- [x] `src/routes/_authed/route.tsx` con `beforeLoad` (auth guard vía `queryClient.fetchQuery({ queryKey: authKeys.me(), queryFn: fetchMe })` + redirects a `/login?redirect=...` o `/onboarding`) + `<AppShell><Outlet /></AppShell>`
- [x] `src/components/layout/appShell.tsx` con `Sidebar` + `Topbar` + main content
- [x] `src/components/layout/sidebar.tsx` (navegación estática con `<Link>` + `activeProps`, links a todos los módulos)
- [x] `src/components/layout/topbar.tsx` (con `useMe()` para mostrar datos del user, dropdown con "Cerrar sesión" conectado a `useSignOut`)
- [x] `src/components/auth/roleGuard.tsx` (sin `useEffect`, todo derivado en el render, redirige a `/login` o `/dashboard` según rol)
- [x] `src/components/feedback/emptyState.tsx`, `errorState.tsx`, `errorBoundary.tsx`, `skeleton.tsx`
- [x] 20 rutas placeholder con `createFileRoute` + `export { Route }`

### 0.4 Auth flow ✅ cerrada
- [x] `src/api/queries/use-auth.ts` con `fetchMe`, `useMe`, `useSignIn`, `useSignOut`, `useSignUp`, `useCompleteOnboarding` (tipados con `paths`, sin `as any`)
- [x] `src/lib/schemas/auth.ts` con `signInSchema`, `signUpSchema`, `onboardingSchema` + tipos derivados
- [x] `src/routes/login.tsx`: form con email + password (RHF + Zod), `validateSearch: { redirect }`, link a `/signup`, placeholder "olvidé mi contraseña"
- [x] `src/routes/signup.tsx`: form con name + email + password, redirige a `/onboarding` si user nuevo
- [x] `src/routes/onboarding.tsx`: form con `organizationName`, `branchName`, `warehouseName` (opcional)
- [x] `beforeLoad` real en `_authed/route.tsx`: `fetchQuery` con `staleTime: 60_000`, redirect a `/login?redirect=...` si `!me`, redirect a `/onboarding` si `!me.organizationId`
- [x] Topbar: `useMe()` muestra `me.name`/`me.email`, dropdown con `useSignOut` conectado, "Cerrar sesión" navega a `/login`
- [x] Validación end-to-end: sign-up → me sin org → onboarding → me con org → sign-out → 401, **todo con `Origin: http://localhost:5173`**

**Notas de cierre 0.4:**
- **Tipos regenerados con back vivo**: `pnpm run api:types` ejecutó contra `http://localhost:8787/doc` (7748 líneas, ~60 endpoints). `AuthUser` matchea el shape del back (`authUserSchema` en `auth.schemas.ts` del back).
- **`use-auth.ts` sin `as any`**: los endpoints nativos de Better Auth (`/api/auth/sign-in/email`, `/api/auth/sign-up/email`) no están en `paths` (ver `tesis-backend/AGENTS.md` §8.4). Se usó **module augmentation** sobre `paths` con la shape oficial de Better Auth (`{ email, password, name? }`). Cero casts, type-safe.
- **`fetchMe` exportado como función pura**: patrón tkdodo. Permite reuso en `beforeLoad` (que no tiene hooks) y en `useMe`. Misma `queryKey` (`authKeys.me()`) → cache compartida.
- **`/signup` como ruta pública (no bajo `_authed`)**: el user no está autenticado cuando arriba, no puede estar bajo un layout que requiere auth.
- **Redirect post-login con doble `fetchQuery`**: el `onSuccess` de `signIn.mutate` reusa `fetchMe` para decidir el destino (onboarding si no tiene org, dashboard si sí). Una mutation no puede leer el cache actualizado porque TanStack Query invalida async.
- **`validateSearch` en `/login` y `/signup`**: `redirect: z.string().optional()`. Tipo-safe via TanStack Router.
- **`AuthUser` migrado a camelCase** (`organizationId`, `branchId`, `roleId`, `isActive`) para matchear el back. `roleId: number | null` para tolerar usuarios pre-onboarding.
- **`roleFromId` acepta `null`/`undefined`** y devuelve `null`. `role-guard.tsx` actualizado (`me.role_id` → `me.roleId`).
- **Override de Biome sacada**: el override que deshabilitaba `noExplicitAny` en `src/api/queries/**` ya no es necesaria. Single source of truth: la regla global.

**Bug "Invalid origin" del back (resuelto en este sprint):**
- Better Auth validaba el header `Origin` contra `baseURL` por default. El back tenía `http://localhost:5173` en `ALLOWED_ORIGINS` (CORS de Hono) pero NO en `trustedOrigins` de Better Auth — son dos configs distintas.
- **Fix aplicado** en `tesis-backend/src/shared/auth/index.ts`: `trustedOrigins: [...FRONTEND_TRUSTED_ORIGINS, env.BETTER_AUTH_URL]`. `FRONTEND_TRUSTED_ORIGINS` es la misma lista de dev que `ALLOWED_ORIGINS` en `shared/http/middlewares.ts` (`["http://localhost:5173", "http://localhost:3000"]`), con un comment explícito apuntando a middlewares.ts.
- **Verificado end-to-end**: sign-in con `Origin: http://localhost:5173` → 200. Origin no permitido (`https://evil.com`) → 403. La lista blanca funciona en ambas direcciones.

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅
- `pnpm run lint` ✅ (1 info deprecation Biome 2.5)
- `pnpm run dev` ✅ (Vite 8.0.16 en :5173)
- E2E con back: sign-up → me → onboarding → me → sign-out → 401, todo con Origin del front

### 0.5 Infra y deploy del front (Pages)
- [ ] Crear `public/_redirects` con `/*    /index.html   200` (SPA routing en Cloudflare Pages)
- [ ] Configurar `wrangler` (o deploy directo desde Pages UI) con build command `pnpm run build`, output dir `dist`
- [ ] `VITE_API_URL` apuntando a `https://tfg-backend.<sub>.workers.dev` en prod
- [ ] Verificar que el back tenga el origin de Pages en `FRONTEND_TRUSTED_ORIGINS` y `ALLOWED_ORIGINS` (Sprint 5)
- [ ] `pnpm run build` antes de cada deploy

**Notas:** el deploy a Cloudflare Pages se hace al final (Sprint 5). Hasta entonces todo corre en `localhost:5173` contra el back en `localhost:8787`.

---

## FASE 1 — Entidades maestras (UI)

> CRUD base. Cada módulo sigue el patrón del AGENTS §8: schema Zod, query hook, mutation hook, form page, list page, detail page.
> **Scope-by-branch**: las rutas que lo requieren leen el `branchId` activo de un `useCurrentBranch()` (contexto global). Admin puede cambiar de branch, Manager/Employee están fijos a su branch.

### 1.1 Contexto de branch (pre-requisito de Fase 1+) ✅ cerrada
- [x] `pnpm add zustand` (5.0.14)
- [x] `src/lib/branch-store.ts` con `useBranchStore` (create + persist middleware)
- [x] `currentBranchId` persistido en `localStorage` (sobrevive a refresh); `branches` no persistido (viene del back, refetch al login)
- [x] `partialize: (state) => ({ currentBranchId: state.currentBranchId })` — solo persiste el ID, no la lista
- [x] `src/hooks/use-branch.ts` con selectores: `useCurrentBranch`, `useCurrentBranchId`, `useBranchesList`, `useSetCurrentBranch`, `useSetBranches`, `useClearBranch`
- [x] `src/lib/schemas/branch.ts` con `createBranchSchema`, `updateBranchSchema`, `listBranchesQuerySchema`
- [x] `src/api/queries/use-branches.ts` con `useBranches`, `useBranch`, `useCreateBranch`, `useUpdateBranch`, `useDeleteBranch` (tipados con `paths`)
- [x] `src/lib/query-keys.ts`: `branchKeys` factory
- [x] `src/components/layout/branch-selector.tsx`: `<BranchSelector>` (1 componente, 1 archivo) — Admin ve `<DropdownMenu>` con todas, Manager/Employee ven solo el nombre (no pueden cambiar)
- [x] `src/components/layout/branch-hydrator.tsx`: `<BranchHydrator>` invisible montado en `_authed/route.tsx` — usa `useEffect` para sincronizar `useBranches` con el store (external sync entre TanStack Query y Zustand, caso válido del AGENTS §2.1.2)
- [x] `<BranchSelector>` integrado en `<Topbar>` (al lado del user dropdown)
- [x] Si solo hay 1 branch, el `<DropdownMenu>` se oculta y se muestra el nombre inline
- [x] Si Admin cambia de branch, los queries de Fase 1+ se refetchean automáticamente (re-render de los `useBranchesList()` consumers, que dependen del ID)
- [x] `clear()` se llama en el hydrator cuando `me` es null (post-signout)

**Notas de cierre 1.1:**

**Decisión: Zustand en vez de Context** (cambió la decisión 12 original). Análisis:
- El branch context tiene **varios consumers reales**: topbar (selector), `useItems({ branchId })`, `useSales({ branchId })`, `useCustomers({ branchId })`, etc. Son más de 3 consumers profundamente anidados (página → filtro → query).
- Context re-renderiza TODOS los consumers cuando cambia el value, sin importar si usan la parte que cambió. Zustand tiene suscripciones selectivas: `useBranchStore(s => s.currentBranchId)` solo re-renderiza si cambia el ID.
- Zustand permite leer el state fuera de React (`useBranchStore.getState().currentBranchId`) — útil para fetchers imperativos en el futuro.
- Migración a Zustand al inicio evita tener que refactorizar después cuando se sume el segundo o tercer consumer.

**`useEffect` en `BranchHydrator` justificado** (AGENTS §2.1.2): external sync entre TanStack Query (`useBranches`) y Zustand store. Caso análogo a "suscripción a WebSocket" que el AGENTS acepta. Documentado en comment del archivo.

**Persistencia parcial**: `partialize` solo guarda `currentBranchId` en localStorage. La lista de branches NO se persiste (viene del back y puede cambiar: branches nuevas, soft-deletions, renames). Al refresh, el ID se restaura, pero la lista se re-fetchea y se reconcilia automáticamente (si el ID ya no existe, `useCurrentBranch` devuelve `null` y se muestra el placeholder).

**`localStorage` vs cookie**: usé `localStorage` porque Zustand persist está diseñado para eso. AGENTS §3 dice "el browser es el estado" y §15 "no usar localStorage para tokens". El branch ID no es sensible (es un UUID público, no es credencial), es OK en localStorage. La cookie de sesión sigue siendo de Better Auth.

**`useBranches({ limit: 100 })` en el hydrator**: en MVP las orgs tienen <100 branches (típico 1-5). El back pagina con default 20; pasamos `limit: 100` para traer todas en una sola request. Si en el futuro una org tiene >100 branches, refactor a paginación o fetch on-demand.

**Role-aware UI en el `<BranchSelector>`**:
- Admin: `<DropdownMenu>` con todas las branches (puede cambiar).
- Manager/Employee: solo el nombre inline (no pueden cambiar — el back fuerza `user.branchId`).
- Sin branches (recién onboarded, edge case): `<Skeleton>` mientras carga.

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅
- `pnpm run lint` ✅ (1 info deprecation Biome 2.5)
- `pnpm run dev` ✅ (Vite 8.0.16 en :5173)
- E2E con back: sign-up → onboarding → GET `/api/v1/branches` → 1 branch; POST nueva branch → 2 branches; GET → 2 branches. Shape matchea el `paths` generado.
- Front sirve HTTP 200 en `/`, `/login`, `/signup`, `/onboarding`, `/dashboard`, `/settings/branches`.

### 1.2 Items — HU-005, HU-006, HU-007, HU-008 ✅ cerrada
- [x] `src/lib/schemas/item.ts` con `createItemSchema`, `updateItemSchema`, `listItemsQuerySchema`, `updateMinStockSchema`
- [x] `src/api/queries/use-items.ts` con `useItems`, `useItem`, `useLookupItemByBarcode`, `useItemStock`, `useCreateItem`, `useUpdateItem`, `useDeleteItem`, `useUpdateMinStock` (tipados con `paths`)
- [x] `src/api/queries/use-item-categories.ts` con `useItemCategories` (mock-friendly, ya apunta al back)
- [x] `src/api/queries/use-units.ts` con `useUnits` (Fase 1.4 anticipado, `staleTime: Infinity`)
- [x] `src/lib/query-keys.ts`: `itemKeys` (con `barcode` y `stock` sub-keys), `itemCategoryKeys`, `unitKeys`
- [x] **DataTable genérico** (server-side via TanStack Query, no client-side):
  - `src/components/data-table/data-table.tsx` (genérico, `useReactTable` con `manualPagination: true`)
  - `src/components/data-table/pagination.tsx`
  - `src/components/data-table/column-defs.tsx` (helpers: `textColumn`, `badgeColumn`, `dateColumn`, `currencyColumn`, `actionsColumn`)
  - Skeleton y empty state inline en `<DataTable>` (no necesitaron archivo separado)
- [x] `src/components/ui/alert.tsx` (primitive nuevo, 4 variants: `default|warning|destructive|success`)
- [x] `src/components/items/pricing-warning.tsx` (HU-005)
- [x] `src/components/items/item-status-badge.tsx`
- [x] `src/components/items/edit-min-stock-dialog.tsx`
- [x] `src/routes/_authed/items/index.tsx` (lista con search debounced, filtros por categoría y showInactive, paginación)
- [x] `src/routes/_authed/items/new.tsx` (form con RHF + Zod, scanner placeholder, pricing warning inline + post-submit)
- [x] `src/routes/_authed/items/$itemId/index.tsx` (detail con stock por warehouse + edit min stock)
- [x] `src/routes/_authed/items/$itemId/edit.tsx` (form prellenado vía `reset()`, mismo shape que `new`)

**Notas de cierre 1.2:**

**Lo que se hizo**:
- **DataTable genérico reusable** (F0). Decisión: **server-side** via TanStack Query + search params del router. El cliente NO usa `getSortedRowModel` ni `getFilteredRowModel` ni `getPaginationRowModel` (todo eso es client-side, sería incorrecto para listas con miles de items). Solo `getCoreRowModel` para que `flexRender` funcione con headers/cells. Sorting se hace server-side en el back (no hay params de sort en Sprint 1 — refactor en 1.10 si se pide).
- **DataTable skeleton con key estable**: Biome lint rechaza `key={i}` (`noArrayIndexKey`). La fix es interpolar el index en un prefix estable (`key={\`skeleton-row-${String(rowIdx)}\`}`). Para las celdas, usa `col.id` que es estable.
- **Pricing warning doble**: inline en el form (derivado del state watched, no `useEffect` — AGENTS §2.1.2) + post-submit del response del back. El del back es la fuente de verdad (puede traer info extra como los precios exactos).
- **Admin vs Manager/Employee**:
  - Admin: `useCurrentBranchId()` del store; si no hay branch activa, el form se deshabilita con un `<Alert>` arriba.
  - Admin: `POST /items` requiere `branchId` en el body (back valida 400 si falta). El front lo manda siempre.
  - Manager/Employee: NO mandan `branchId` (el back fuerza `user.branchId`).
  - El botón "Nuevo item" y "Editar" se ocultan para Employee (no pueden crear/modificar). "Eliminar" también.
- **Scanner barcode = placeholder** (Sprint 4 lo conecta): botón con `toast.info('Scanner no disponible en MVP')`. El hook `useLookupItemByBarcode` ya está listo para cuando se conecte.
- **Categorías mockeadas**: el `<Select>` consume `useItemCategories({ branchId, isActive: true })` que ya apunta al back. Cuando se implemente Sprint 1.3, las categorías aparecerán automáticamente.
- **Units hardcoded-data**: el `<Select>` consume `useUnits()` que llama a `GET /api/v1/units` con `staleTime: Infinity` (units son globales, no cambian en runtime). El back tiene 7 units predefinidas (kg, g, litro, ml, docena, caja, unidad).
- **PricingWarning en la detail page**: si el back devuelve `warning` en el response de `GET /items/{id}` (porque el item tiene `salePrice < purchasePrice`), se muestra en la sección "Información general". El back siempre lo manda si aplica.

**Decisiones de implementación**:
- **ZodResolver + `Resolver<FormValues>` cast**: el tipo del `useForm<FormValues>` requiere que `name` y `isActive` sean required. El `zodResolver(createItemSchema)` infiere tipos donde `name: string` (required) y `isActive: boolean` (optional con default). Mismatch TS → uso `zodResolver(createItemSchema) as Resolver<FormValues>`. La forma idiomática es derivar `FormValues` de `z.infer<typeof createItemSchema>` pero eso rompería el default `isActive: true` del form. Cast controlado, documentado.
- **`useForm` + `reset()` en edit**: el form de edit no se puede inicializar con `defaultValues` desde `useItem(id)` porque el query es async. Patrón: `defaultValues` mínimos en el `useForm`, después `useEffect(() => reset(...), [itemData])` cuando el query resuelve. AGENTS §2.1.2: `useEffect` justificado por external sync (TanStack Query → RHF state).
- **RHF + `setValue` con `value: string | null` del Select de Base UI**: el callback de `onValueChange` da `string | null`. Necesito `!value || value === 'none' ? undefined : value` para normalizar a `undefined` cuando se selecciona "Sin categoría". Documentado inline.
- **Paginator server-side**: `<DataTable>` recibe `meta: { page, limit, total, totalPages }` y `onPageChange`. No se renderiza si `totalPages <= 1` (UX: en una página, no hay controles).
- **Empty state sin "Nuevo item" para Employee**: el `emptyAction` es condicional al role. Si el user es Employee, no muestra el botón "Crear item" en el empty state.
- **Stock por warehouse inline en la detail**: tabla HTML (no `<DataTable>`) porque son 3-4 columnas fijas y no necesita paginación. Sprint 2.3 va a meter el historial de movimientos con `<DataTable>`.

**Bugs encontrados**:
- **No bugs del front**. El back está OK (verificado con curl en F10).
- **E2E con curl**: el user Admin (post-onboarding, sin `branchId` en el user) necesita mandar `branchId` en el body de `POST /items`. Si no, 400 "Debes indicar branchId en el body". El front lo hace bien: `body.branchId = useCurrentBranchId()` para Admin. Manager/Employee NO mandan (back fuerza su branch). Es coherente con back §3 y §1.6.

**Verificación**:
- `pnpm run type-check` ✅
- `pnpm run build` ✅ (items chunk: 68.60KB gz 19.55KB; bundle total del shell: 442KB gz 133KB)
- `pnpm run lint` ✅ (1 info deprecation Biome 2.5 no bloqueante; biome check sobre 91 archivos)
- `pnpm run routes:gen` ✅ (3 rutas nuevas detectadas: `/items/new`, `/items/$itemId`, `/items/$itemId/edit`)
- E2E con back: sign-up → onboarding → POST 3 items con `branchId` → 201 → GET items → 200 con 3 → search → 200 con matches → POST item con `salePrice < purchasePrice` → 201 con `warning` en el response → POST duplicado → 409 con mensaje del back → GET detail → 200 → GET stock → 200 (vacío) → PATCH min-stock → 200 → PUT edit → 200 → DELETE → 200 → GET items con `isActive=false` → 200 con 3 inactivos (soft delete funciona).
- Front sirve HTTP 200 en `/items`, `/items/new`, `/items/{id}`, `/items/{id}/edit`.

### 1.3 Item Categories ✅ cerrada (refactor)
- [x] `src/lib/schemas/category.ts` con `createCategorySchema`, `updateCategorySchema`
- [x] `src/api/queries/use-item-categories.ts` con 5 hooks: `useItemCategories`, `useCategory`, `useCreateCategory`, `useUpdateCategory`, `useDeleteCategory` (tipados con `paths`, sin casts)
- [x] `src/lib/query-keys.ts`: `itemCategoryKeys` factory
- [x] `src/components/categories/category-status-badge.tsx` y `category-delete-dialog.tsx`
- [x] `src/components/items/category-create-dialog.tsx` y `category-edit-dialog.tsx`
- [x] `src/routes/_authed/settings/categories.tsx`: tabla con `name`, `description`, `branch` (badge), `isActive`, acciones; filtros (search debounced, showInactive); paginación server-side; 3 dialogs.
- [x] `<Combobox>` con `useItemCategories` integrado en `routes/_authed/items/new.tsx`, con botón "Nueva categoría" que abre `<CategoryCreateDialog>` inline.
- [x] `CategoryCreateDialog.onCreated(category)` setea el `categoryId` del form de items automáticamente.
- [x] RoleGuard: `canEdit = role === 'Admin' || role === 'Manager'`. El back valida con `roleGuard` en mutations.

**Notas de cierre 1.3 (refactor):**

**Lo que se hizo en este sprint (refactor sobre código preexistente):**
- El sprint 1.3 ya tenía código escrito (de cuando se implementó items, 1.2), pero el TODO lo mantenía abierto por error histórico. El sprint actual **refactorizó** los dialogs de category para alinearlos con AGENTS §7.5.1 y encontró un bug crítico.

**Bug crítico encontrado y arreglado en `category-edit-dialog.tsx`:**
- El `onSubmit` tenía un spread roto:
  ```typescript
  ...(values.description !== '' ? values.description : { description: null }),
  ```
  Esto evaluaba a `description: values.description` (string) o `description: { description: null }` (objeto malformado). Cuando el user borraba la descripción, el back recibía `description: { description: null }` y rompía la request.
- **Fix**: cambiar a `...(values.description !== '' ? { description: values.description } : { description: null })`. Ahora el body es consistente.

**Anti-patrón del `as Resolver<...>` corregido:**
- Los 2 dialogs de category usaban el mismo anti-patrón que rompía los dialogs de user: `zodResolver(schema) as Resolver<FormValues>`. En el caso de create category no rompía (los shapes coincidían), pero igual violaba la regla de AGENTS §7.5.1.
- **Fix**: el form usa `useForm<FormValues, unknown, CreateCategoryInput>` con `FormValues = z.input<typeof createCategorySchema>` y el output type como tercera genérica. El cast desaparece.

**Refactor del delete inline a `<CategoryDeleteDialog>`:**
- El delete estaba implementado con un `<Dialog>` simple de un solo botón en `/settings/categories.tsx`. Inconsistente con branches/users/warehouses (todos con confirmación destructiva por input del nombre).
- **Fix**: nuevo componente `src/components/categories/category-delete-dialog.tsx` con input del nombre (patrón AGENTS §12.5). Misma copy de "tiene items activos" que tenía el inline.

**Casts `as Resolver<...>` restantes (deuda técnica documentada):**
- Quedan 5 casts en el proyecto: `branch-create-dialog`, `branch-edit-dialog`, `organization.tsx`, `items/new.tsx`, `items/$itemId/edit.tsx`. Los dialogs de branch y los de item comparten el mismo anti-patrón.
- **Por qué no se arreglaron en este sprint**: el alcance acordado fue "solo fix categories + cerrar 1.3". Los dialogs de branch funcionan (los verifiqué en 1.5) y los de item funcionan también (verificados en 1.2). El bug real (mismatch `roleId: string` vs `z.number()`) solo se manifestaba en los dialogs de user, donde el form no matcheaba con el schema.
- **Riesgo**: si alguien refactoriza los schemas de branch o item en el futuro, los casts pueden empezar a romper. Un sprint futuro debería unificar el patrón: usar `z.input`/`z.output` o schemas con coerción en todos los dialogs. Recomendado cuando se toquen estos archivos por otra razón.

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅
- `pnpm run lint` ✅ (1 info preexistente de Biome 2.5)

**Verificación manual pendiente (checklist para el browser):**
- [ ] Login Admin → `/settings/categories` → ver lista.
- [ ] "Nueva categoría" → completar name + description → "Crear" → 201 → aparece.
- [ ] "Editar" (pencil) → cambiar el name → "Guardar" → 200.
- [ ] "Editar" → borrar la descripción → "Guardar" → 200 → el back guarda `description: null` (validar con curl GET).
- [ ] "Editar" → cambiar isActive a false → "Guardar" → 200.
- [ ] Intentar eliminar categoría con items activos → 400 → toast con mensaje del back.
- [ ] Eliminar categoría vacía → tipear nombre → 200 → desaparece.
- [ ] Login Manager → ver lista y editar/eliminar categorías (no solo Admin).
- [ ] En `/items/new` → el `<Combobox>` muestra categorías. Click en "Nueva categoría" → abre dialog → crear → vuelve y autoselecciona la nueva.

### 1.4 Units ✅ cerrada
- [x] `src/api/queries/use-units.ts`: `useUnits()` (lista global, solo lectura)
- [x] Select prellenado en forms de items, sale items, provider order items
- [x] Cache: `staleTime: Infinity` (no cambian en runtime, se mantienen por seed)

**Notas de cierre 1.4:**
- Sprint dummy. El hook `useUnits()` y su consumo en forms de items se implementaron en el sprint 1.2 (cerrado). El item se mantenía como pendiente por error histórico en el TODO. No requirió código nuevo.
- Decisión: no se crea un `<UnitSelector>` reusado porque cada form tiene un layout distinto (ComboboxField standalone en items, multi-unit en sales con quantity-per-unit, etc.). Mejor reusar `<ComboboxField>` con `items` computado en cada call site.

### 1.5 Branches ✅ cerrada
- [x] `src/lib/schemas/branch.ts` con `createBranchSchema`, `updateBranchSchema`
- [x] `src/api/queries/use-branches.ts`: `useBranches({ page, limit, isActive })`, `useBranch(id)`, `useCreateBranch()`, `useUpdateBranch()`, `useDeleteBranch()`
- [x] `src/routes/_authed/settings/branches.tsx`: tabla con todas las branches de la org (no solo la del user — ver back §1.3), columnas: `name`, `organization.name`, `isActive`, acciones
- [x] `<Dialog>` para create/edit con form
- [x] Soft-delete: confirmar antes, mostrar 400 si es la última activa (mensaje del back)
- [x] RoleGuard: Admin write, todos lectura

**Notas de cierre 1.5:**

**Lo que se hizo:**
- Schemas y hooks ya existían desde 1.1 (branch context). El sprint los reusó directamente.
- 4 componentes nuevos: `BranchStatusBadge`, `BranchCreateDialog`, `BranchEditDialog`, `BranchDeleteDialog` (con confirmación destructiva por input del nombre).
- Página `/settings/branches` con tabla (DataTable), filtros (search debounced, showInactive), paginación server-side, y los 3 Dialogs.
- Página accesible para todos (read-only para Manager/Employee, botones de write solo para Admin). El back fuerza Admin en POST/PUT/DELETE con `roleGuard(['Admin'])`; GET no requiere role específico.

**Decisiones de implementación:**
- **`<BranchDeleteDialog>` con input del nombre:** patrón nuevo documentado en AGENTS §12.5. El user debe tipear el nombre exacto de la branch para confirmar. Razón: la operación es destructiva (afecta users, items, warehouses, sales referenciadas). El `.refine` de Zod se usa para el match exacto (`val === branch.name`).
- **Scope org-wide, no scope-by-branch:** la lista de branches es de TODA la org. No se usa `useCurrentBranchId()` para el query (no aplica el patrón de AGENTS §13.1). El back ignora `branchId` en query para branches.
- **`useBranches` ahora devuelve `{ data: BranchItem[], meta }`** (antes devolvía el inner data). Tuve que actualizar el `BranchHydrator` (que consumía `branchesQuery.data?.data.data`). Patrón consistente con `useItems` y `useItemCategories`.
- **El `useMemo` en `BranchDeleteDialog`:** el `confirmSchema` se memoiza con `[branch?.name]` como dep. Razón: la función del `zodResolver` se re-crearía en cada render, causando re-mounts innecesarios del form. Documentado en AGENTS §2.1.3 (motivo concreto).
- **`useEffect` en `BranchEditDialog` y `BranchDeleteDialog`:** AGENTS §2.1.2 los justifica (external sync entre TanStack Query data y RHF state). Patrón idéntico al de `CategoryEditDialog`.
- **El `useBranches({ limit: 100 })` del `BranchHydrator`:** sigue trayendo todas las branches (necesario para popular el store). Cache entry distinta de la query de la página. OK para MVP (típico 1-5 branches por org).
- **Sin `<RoleGuard>` en la ruta:** la página es accesible para todos; los botones se ocultan según rol. El back valida Admin en mutations. Más simple que un RoleGuard que redirija a `/dashboard`.

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅ (bundle del shell: 444KB gz 134KB; chunk `branches` no listado, lazy-loaded dentro de `_authed`)
- `pnpm run lint` ✅ (1 info pre-existente de Biome 2.5)
- `pnpm run routes:gen` ✅ (ruta ya estaba registrada)
- Manual: pendiente (no automatizado, AGENTS §15)
  - Login Admin → `/settings/branches` → ver lista → crear/editar/eliminar → confirmar eliminación con input del nombre.
  - Intentar eliminar la última branch activa → toast con mensaje del back.
  - Login Manager → ver lista sin botones de write.

**Bugs encontrados:**
- Ninguno del front. El back responde correctamente a `roleGuard(['Admin'])` para mutations.
- Bug pre-existente: el `useBranches` devolvía `data.data` (sin meta). Ajustado para devolver `BranchesList` con meta. El `BranchHydrator` se actualizó en consecuencia.

**Patrones nuevos para reusar en próximos sprints:**
- `BranchDeleteDialog` con input del nombre → template para `UserDeleteDialog` (1.6), `OrganizationDeleteDialog` (si se implementa en 1.6).
- `useBranches` con shape `{ data, meta }` → template para futuros hooks paginados.

### 1.6 Users — HU-004 (org profile), users ✅ cerrada
- [x] `src/lib/schemas/user.ts` con `createUserSchema`, `updateUserSchema`, `changeRoleSchema`
- [x] `src/api/queries/use-users.ts`: `useUsers({ page, limit, branchId })`, `useUser(id)`, `useCreateUser()`, `useUpdateUser()`, `useDeleteUser()`, `useChangeUserRole()`
- [x] `src/routes/_authed/settings/users.tsx`: tabla con `name`, `email`, `role`, `branch`, `isActive`, acciones
- [x] `<Dialog>` para create (delegado a `signUp` del back, ver back §1.2), edit, change-role, soft-delete
- [x] `<RoleBadge>` component con colores por rol (Admin/Manager/Employee)
- [x] `src/routes/_authed/settings/organization.tsx`: form para editar `name` de la org (HU-004), solo Admin
- [x] RoleGuard: Admin estricto para todo. El user no puede auto-borrarse (el back valida, mostrar mensaje)

**Notas de cierre 1.6:**

**Lo que se hizo (back):**
- **Helper `assertNotLastAdmin`:** nuevo archivo `src/modules/users/use-cases/validate-last-admin.ts` con la función que cuenta admins activos de la org (excluyendo al target). Si el count es 0, tira 400 con mensaje claro.
- **3 use cases actualizados** para invocar la validación:
  - `SoftDeleteUser.execute`: ahora recibe `organizationId`. Valida si el target es admin activo.
  - `ChangeUserRole.execute`: valida si el target es admin y se está degradando a otro rol.
  - `UpdateUser.execute`: valida si el target es admin activo y se está poniendo `isActive: false`.
- **Router:** el handler de DELETE ahora pasa `user.organizationId ?? ''` al use case.
- **Back-end "último admin" garantizado:** las 3 vías (DELETE, PATCH role, PUT isActive=false) ya no pueden dejar a la org sin admins activos. El front muestra el mensaje del back via `mapApiError` (recién arreglado).

**Lo que se hizo (front):**
- **Schemas Zod** (`user.ts`, `organization.ts`) con `.refine` para coordinar role↔branch (Admin no puede tener branch, Manager/Employee sí). Validación client-side antes del submit.
- **Hooks de API** (`use-users.ts`, `use-organizations.ts`) con shape `{ data, meta }` consistente con el resto de los list hooks.
- **6 componentes nuevos** en `src/components/users/`:
  - `RoleBadge`: badge con variant por rol (Admin=default, Manager=secondary, Employee=outline).
  - `UserStatusBadge`: activo/inactivo.
  - `UserCreateDialog`: form completo (email + password + name + role + branch condicional + isActive). Coordination role↔branch con `useEffect`.
  - `UserEditDialog`: form simple (name + email + isActive).
  - `UserChangeRoleDialog`: form (role + branch condicional). Misma coordination que create.
  - `UserDeleteDialog`: confirmación destructiva con input del email (no del name, porque el email es único en la org).
- **2 páginas nuevas**:
  - `/settings/users`: DataTable con search/role/branch/showInactive, 4 Dialogs, botón "Eliminar" oculto para el user actual (auto-delete prevention).
  - `/settings/organization`: form simple con `name`, solo Admin edita.
- **Cleanup de icons deprecated:** 2 archivos migrados de `Eye`/`PencilSimple`/`Plus`/`Trash` a `*Icon` (phosphor v2 convention).
- **AGENTS.md §7.7:** nota explícita de la convención `FooIcon` vs `Foo` deprecated.

**Decisiones de implementación:**
- **Confirmación destructiva con email** (no con name): el email es único en la org, evita confusión con users de mismo nombre. Patrón reusable (mismo que `BranchDeleteDialog` con name).
- **Role-branch coordination via `useEffect`:** cuando el user cambia de role a Admin, `setValue('branchId', null, { shouldValidate: true })` dispara la limpieza. AGENTS §2.1.2 lo justifica (external sync entre form state y validación).
- **`<UserSwitchIcon>` para "Cambiar rol":** semánticamente más claro que Shield o Key. El button label `aria-label="Cambiar rol"` refuerza.
- **Botón "Eliminar" oculto para el user actual:** previene el click antes de que el back rechace. El back igual valida con 400 si pasara.
- **Sin `<RoleGuard>` en la ruta:** igual que branches, el front oculta botones según rol. El back valida con `roleGuard(['Admin'])` en mutations.
- **`as unknown as Resolver<FormValues>`** en los Dialogs con role-string-vs-number mismatch: el `zodResolver` infiere `roleId: number` pero el form usa `string` (porque el ComboboxField solo acepta strings). Cast controlado, documentado en el código.

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅ (bundle del shell: 445KB gz 134KB; chunk `users` 26KB gz 9KB)
- `pnpm run lint` ✅ (1 info pre-existente de Biome 2.5)
- `pnpm run routes:gen` ✅
- Back: `pnpm run type-check` ✅

**Bugs encontrados (back):**
- **El handler de DELETE no pasaba `organizationId` al use case.** Fix: agregar `user.organizationId ?? ''` como tercer argumento.
- **El back no validaba "último admin activo" en DELETE, PATCH /role, ni PUT isActive=false.** Fix: helper `assertNotLastAdmin` invocado en los 3 use cases.

**Race condition documentada** (back): la validación + mutación NO están en una transacción explícita. Si dos requests concurrentes borran al último admin simultáneamente, podrían quedar 0. Aceptable para MVP; documentado en el comment del helper. Refactor futuro: `db.transaction` con `db | tx` en el repositorio.

**Verificación manual pendiente (no automatizada):**
- Login Admin → `/settings/users` → ver lista (1 user, el propio).
- Crear user Manager en una branch → 201 → aparece.
- Editar el name → 200.
- Cambiar el rol de Manager a Admin (debería limpiar la branch automáticamente) → 200.
- Cambiar el rol de Admin a Manager (debería requerir branch) → seleccionar branch → 200.
- Intentar eliminar el propio user → el botón no aparece.
- Eliminar otro user (con input del email) → 200.
- Crear user con email duplicado → 409 → toast con mensaje del back.
- Test del fix del back:
  - Crear otro user vía signUp, promover a Admin via PATCH /role.
  - Intentar eliminar al primer Admin → debería fallar con 400.
  - Intentar degradar al primer Admin (vía PATCH /role) → debería fallar con 400.
  - Intentar inactivar (PUT isActive=false) al primer Admin → debería fallar con 400.
- `/settings/organization` → cambiar name → 200.
- Login Manager → ver la página de users sin botones de write.

**Patrones nuevos para reusar en próximos sprints:**
- `UserChangeRoleDialog` con coordination role↔branch via `useEffect` → template para cualquier form con campos dependientes.
- `UserDeleteDialog` con input del email → confirma que el patrón de "confirmación destructiva con input" (AGENTS §12.5) es reusable.

### 1.7 Warehouses ✅ cerrada
- [x] `src/lib/schemas/warehouse.ts` con `createWarehouseSchema` (incluye `branchIds: string[]` con `min(1)`), `updateWarehouseSchema`, `assignBranchSchema`, `listWarehousesQuerySchema` (tipos `CreateWarehouseInput`/`FormValues` separados vía `z.input`/`z.infer`)
- [x] `src/api/queries/use-warehouses.ts`: `useWarehouses({ page, limit })`, `useWarehouse(id)`, `useCreateWarehouse()`, `useUpdateWarehouse()`, `useDeleteWarehouse()`, `useAssignWarehouseToBranch()`, `useUnassignWarehouseFromBranch()` (7 hooks, tipados con `paths`)
- [x] `src/lib/query-keys.ts`: `warehouseKeys` factory (ya existía desde 1.2, reusado)
- [x] `src/components/warehouses/warehouse-status-badge.tsx`
- [x] `src/components/warehouses/warehouse-branches-list.tsx` (helper de badges: ≤2 inline, >2 muestra "+N")
- [x] `src/components/warehouses/warehouse-create-dialog.tsx`: form con multi-select de branches (checkboxes), `branchIds` requerido, botón "Crear" deshabilitado si no hay branches seleccionadas
- [x] `src/components/warehouses/warehouse-edit-dialog.tsx`: form (name, description, isActive). **No** edita branches — eso se hace en otro dialog.
- [x] `src/components/warehouses/warehouse-branches-dialog.tsx`: dialog específico para asignar/desasignar branches. Calcula diff entre state local y `warehouse.branches`, ejecuta mutations en batch (secuencial con `mutateAsync`).
- [x] `src/components/warehouses/warehouse-delete-dialog.tsx`: confirmación destructiva con input del nombre (mismo patrón que `BranchDeleteDialog` y `UserDeleteDialog`).
- [x] `src/routes/_authed/warehouses/index.tsx`: DataTable con `name`, `description`, `branches` (badges via `WarehouseBranchesList`), `isActive` (badge), acciones. Filtros: search debounced, showInactive. Paginación server-side. 4 Dialogs. RoleGuard: solo Admin ve botones de write.
- [x] Soft-delete: 400 "Tiene items con stock > 0" propagado al toast via `mapApiError`.

**Notas de cierre 1.7:**

**Lo que se hizo:**
- **Schemas y hooks reusables**: el `warehouseKeys` factory ya existía (creado en 1.2 para queries relacionados a stock), así que solo se agregó el `use-warehouses.ts` con los 7 hooks.
- **Multi-select de branches con checkboxes**: usé checkboxes simples en una lista con scroll (no chips, no popover con búsqueda). Decisión: el set de branches es chico (típico 1-5, máximo ~10), no justifica un componente más complejo. Si una org llega a 30+ branches, refactor a un popover con búsqueda.
- **`<WarehouseBranchesDialog>` con diff + batch mutations**: el dialog carga el state inicial desde `warehouse.branches` (useEffect cuando abre), mantiene un `Set<string>` local de IDs seleccionadas, y al guardar calcula el diff contra el original. Ejecuta los `assign` y `unassign` en secuencia con `mutateAsync`. Si cualquiera falla, el toast muestra el error y el dialog queda abierto (rollback visual: el state local no se commitea hasta que todos pasan).
- **POST exige `branchIds: string[]` con min 1**: el back rechaza arrays vacíos. El front valida con Zod y además deshabilita el botón "Crear" si `selectedBranchIds.length === 0` (UX: no se llega al submit con error de validación, se previene antes).
- **PUT no incluye `branchIds`**: el back tiene endpoints separados para assign/unassign. El edit dialog solo edita name/description/isActive. Documentado en el comment del `DialogDescription` del edit.
- **DELETE de branches con stock**: el back devuelve 400 "Tiene items con stock > 0" (no 409). El `mapApiError` propaga el mensaje al toast. El copy del `<DialogDescription>` del delete avisa antes de tipear.
- **`<WarehouseBranchesList>` como helper de badges**: lógica `length <= 2 inline / > 2 con "+N"`. Reusado en la celda de la tabla y queda disponible para detail page (futuro).

**Decisiones de implementación:**
- **`updateWarehouse` filtra `undefined`**: mismo patrón que `updateUser`. Construye un `cleanBody: Record<string, unknown>` con solo los campos definidos para no enviar `null` cuando el back espera `undefined`.
- **Asignación de branches en el back es idempotente en unassign pero no en assign**: si dos users asignan la misma branch simultáneamente, uno va a recibir 409 "Ya asignado". El back reporta como error 409 pero en realidad es success (la branch ya está). Por ahora propagamos el error; si en el futuro se quiere tratar como success, agregar manejo de 409 en el dialog.
- **Asignar por branch individual (no bulk)**: el back expone `POST /warehouses/{id}/branches` con un solo `branchId` por request, no un array. La UI llama N veces (secuencial) si el user selecciona N branches nuevas. Aceptable porque N es chico (típico 1-2). Si en el futuro se vuelve lento, pedir un endpoint bulk al back.
- **El `useEffect` que resetea `selected` cuando abre el dialog**: AGENTS §2.1.2 lo justifica (external sync entre query data y state local). Sin él, cambiar de warehouse abriría el dialog con el state del warehouse anterior.
- **Sin `<RoleGuard>` en la ruta**: igual que branches y users, los botones se ocultan según rol. El back valida Admin en mutations.

**Discrepancias con el plan original detectadas en este sprint:**
- El plan asumía "PUT con `branchIds: string[]` para asignación de branches" → **incorrecto**. El back tiene `POST /warehouses/{id}/branches` y `DELETE /warehouses/{id}/branches/{branchId}` separados. Un branch por request.
- El plan asumía "branchIds opcional" en el create → **incorrecto**. El back exige `branchIds: string[]` con `minItems: 1`. Un warehouse sin branches no se puede crear.

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅ (chunk `warehouses`: 21.10 KB gz 6.92 KB; shell: 446 KB gz 134 KB)
- `pnpm run lint` ✅ (1 info pre-existente de Biome 2.5)
- `pnpm run routes:gen` ✅


### 1.8 Stock (read-only en Fase 1, write en Fase 2 con sales y provider-orders) ✅ cerrada
- [x] `src/api/queries/use-stock.ts`: `useStockByWarehouse(warehouseId, query)` con filtros `page`, `limit`, `search`, `status` (low/ok/out)
- [x] Vista de stock en detail de item (1.2, preexistente): tabla por warehouse con `quantity`, `minStock`, `status`, botón "Editar mín." por fila
- [x] Vista de stock en detail de warehouse: DataTable con items, mismo shape, paginación server-side
- [x] `PATCH /items/:id/min-stock` desde detail de item: dialog reusado (existente desde 1.2)
- [x] Filtro `?status=low` en detail de warehouse (ComboboxField: Todos / OK / Bajo / Sin stock)

**Notas de cierre 1.8:**

**Lo que se hizo:**
- `useStockByWarehouse(warehouseId, query)` en `src/api/queries/use-stock.ts` (1 hook, tipado con `paths`, sin casts).
- `stockKeys.byWarehouse(warehouseId, q)` factory en `src/lib/query-keys.ts`.
- `<StockStatusBadge status={status}>` en `src/components/stock/stock-status-badge.tsx` (1 componente, 1 archivo) — variant destructive/secondary/default según `out`/`low`/`ok`.
- Detail page de warehouse: `src/routes/_authed/warehouses/$warehouseId/index.tsx`. Usa `<DataTable>` con paginación server-side, `<ComboboxField>` para filtro de status (con `value: null` para "Todos"), `<Input>` con search debounced 300ms, y `<EditMinStockDialog>` reusado desde 1.2.
- Link desde la lista de warehouses: el nombre de cada row en `/warehouses` ahora es un `<Link to="/warehouses/$warehouseId">` (cambio mínimo en `index.tsx`).

**Lo que YA estaba hecho y no se reimplementó:**
- `useItemStock(itemId)` en `src/api/queries/use-items.ts:97` (consumido por el detail de item, lo dejamos donde está por compatibilidad con 1.2).
- `useUpdateMinStock()` en `src/api/queries/use-items.ts:187`.
- `<EditMinStockDialog>` en `src/components/items/edit-min-stock-dialog.tsx`.
- Tabla de stock inline en el detail de item (`items/$itemId/index.tsx:156-210`).
- `updateMinStockSchema` en `src/lib/schemas/item.ts:48`.

**Decisiones de implementación:**
- **`useItemStock` se queda en `use-items.ts`, no en `use-stock.ts`.** El TODO lo listaba en `use-stock.ts` pero ya estaba implementado y testeado en 1.2. Moverlo ahora rompería la nota de cierre 1.2 sin motivo. La regla "un hook por dominio" en este caso es "use-stock = stock-por-warehouse (read paginado de un depósito)", "use-items = stock-de-un-item (read de un item, simple)". Documentado acá.
- **`minStock` se edita a nivel item, no warehouse.** El `PATCH /items/{id}/min-stock` actualiza el `minStock` del item en TODOS los depósitos, no en uno solo. El botón "Editar mín." por fila del detail de warehouse refleja esto: edita el item, no la fila del depósito. Si en el futuro se quiere editar el minStock por warehouse, hay que pedirle al back un endpoint nuevo (`PATCH /warehouses/{id}/items/{itemId}/min-stock`).
- **El detail de item NO se refactorizó a `<DataTable>`.** El `GET /items/{id}/stock` no pagina (array directo, sin meta). Tabla HTML simple es suficiente para 1-5 warehouses que tiene típicamente un item.
- **Búsqueda: `<Input>` con debounce 300ms en el search de stock.** Reusado del patrón de warehouses/items. La query key se reconstruye con el `debouncedSearch` (no con el valor crudo del input) — patrón de 1.7.
- **`status: null` en search params = "Todos".** El `validateSearch` de TanStack Router permite `z.enum([...]).nullable().default(null)`. La URL queda `?status=null` o no incluye el param; el back lo ignora cuando no está.
- **El handler de status en `<ComboboxField>` valida que el `value: string | null` recibido sea uno de los 3 valores válidos** antes de meterlo en search. El wrapper da `string | null`; el search schema exige `'ok' | 'low' | 'out' | null`. Cast seguro inline (`=== 'ok' || === 'low' || === 'out'`). Si no matchea, va a `null`.
- **`refetchStock()` después de editar `minStock`:** la mutación en `useUpdateMinStock` invalida `itemKeys.stock(id)`, pero el detail de warehouse usa `stockKeys.byWarehouse(warehouseId, q)`. Hay que refetchear manualmente el stock del warehouse. Lo hago en el `onSaved` del dialog.

**Discrepancias con el plan original del TODO:**
- El TODO listaba "inline editable" para el min-stock. **No se interpretó como inline-edit en la fila, sino como botón + dialog.** El botón "Editar mín." abre un `<Dialog>` con input. Es lo que se hizo en 1.2 y se mantuvo. Si querés "inline editable" en sentido estricto (sin dialog, edición en la celda), se puede refactorizar después.
- El TODO decía `useUpdateMinStock()` en `use-stock.ts`. **Ya estaba en `use-items.ts` desde 1.2.** No se movió.
- El TODO listaba `useStockByItem(itemId)`. **Ya estaba como `useItemStock` en `use-items.ts` desde 1.2.** No se renombró.
- El TODO asumía que existía detail de warehouse (1.7). **No existía** (1.7 sólo hizo la lista). Se creó desde cero en este sprint.

**Lo que se encontró pre-existente (no introducido por este sprint):**
- `pnpm run lint` reporta 3 errores en `src/components/layout/sidebar.tsx` y `src/components/ui/sidebar.tsx` (format + organizeImports). **Son pre-existentes** del shadcn init, no los introducimos. Los sprints anteriores también los arrastran (la nota de cierre 1.7 dice `1 info pre-existente de Biome 2.5` — el contador cambió de `info` a errores pero son los mismos archivos).

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅ (chunk `_warehouseId-...js`: 8.86 KB gz 3.93 KB; chunk `warehouses` lista: 19.31 KB gz 6.50 KB; shell: 446.66 KB gz 134.63 KB)
- `pnpm run lint` ✅ en archivos del sprint (3 errores pre-existentes en `sidebar.tsx`, ajenos al sprint)
- `pnpm run routes:gen` ✅ (nueva ruta `/warehouses/$warehouseId` detectada)
- `pnpm run api:types` ✅ regenerado contra `http://localhost:8787/doc` (los tipos de stock ya estaban pero se revalidaron)

**Patrones nuevos para reusar en próximos sprints:**
- `<StockStatusBadge>` con variant dinámico según `status` (reusable para cualquier vista que muestre status: dashboard, low-stock list, reports, etc.).
- Search schema con `z.enum([...]).nullable().default(null)` + `<ComboboxField>` con `value: null` para "Todos" — patrón estándar para filtros de tipo enum.
- `useStockByWarehouse` como template para queries de tipo "paginados con search + status enum".

### 1.9 Customers — HU-020, HU-021, HU-022 ✅ cerrada
- [x] `src/lib/schemas/customer.ts` con `createCustomerSchema`, `updateCustomerSchema`, `listCustomersQuerySchema` (tipos `CreateCustomerInput`/`FormValues` separados con `z.input`/`z.infer`)
- [x] `src/api/queries/use-customers.ts`: `useCustomers`, `useCustomer`, `useCreateCustomer`, `useUpdateCustomer`, `useDeleteCustomer`, `useCustomerSales` (6 hooks, tipados con `paths`, sin casts)
- [x] `src/components/customers/customer-status-badge.tsx`: badge active/inactive
- [x] `src/components/customers/customer-create-dialog.tsx`: form (fullname req + email/phone/address opcionales + isActive)
- [x] `src/components/customers/customer-edit-dialog.tsx`: mismo shape, `reset()` con data del customer en `useEffect`
- [x] `src/components/customers/customer-delete-dialog.tsx`: dialog simple de 2 botones (sin input del nombre — ver nota)
- [x] `src/routes/_authed/customers/index.tsx`: DataTable con `fullname` (link a detail), `email`, `phone`, `branch`, `isActive`. Filtros: search debounced, showInactive. Paginación server-side. Botón "Nuevo cliente" (Admin/Manager).
- [x] `src/routes/_authed/customers/$customerId/index.tsx`: detail con 4 cards de summary (totalSpent, purchaseCount, lastPurchaseAt, averageTicket) + DataTable de ventas paginada con toggle "Incluir canceladas". Placeholder para segmentación (HU-025/026, sprint 3.3).
- [x] RoleGuard: Admin/Manager write (POST/PUT/DELETE), todos lectura.

**Notas de cierre 1.9:**

**Lo que se hizo:**
- **Schemas** con `nullableOptionalString/Email/Phone` que convierten string vacío a `undefined` (create) y un `updateCustomerSchema` con `.nullable().optional()` para los campos opcionales (edit permite `null` explícito para limpiar).
- **6 hooks** en `use-customers.ts`:
  - `useCustomers(query, options)` con `enabled: role !== 'Admin' || !!currentBranchId` (patrón de items 1.2).
  - `useCustomer(id)` con `enabled: id.length > 0`.
  - `useCreateCustomer({ body, branchId })` con `cleanBody` que filtra undefined. El `branchId` se manda sólo si está definido (Admin con branch activa).
  - `useUpdateCustomer({ id, body })` con `cleanBody` que filtra undefined y no manda `branchId` (no se reasigna).
  - `useDeleteCustomer(id)`. Soft-delete (back marca `isActive=false`).
  - `useCustomerSales(id, query)` con filtros `page`, `limit`, `includeCancelled`. Devuelve `{ data, summary, meta }`.
- **Status badge** reusa el patrón de `ItemStatusBadge` (variant default/secondary).
- **3 dialogs** siguiendo el patrón de users/warehouses: `useForm` con `zodResolver`, `useEffect` para `reset` cuando abre, sin `as Resolver<...>`.
- **Lista** con `<DataTable>` server-side, search debounced 300ms, filtro showInactive, scope-by-branch. Link en el nombre → detail. `<Alert>` si Admin sin branch activa.
- **Detail** con 4 `<Card size="sm">` para el summary de ventas, `<dl>` para info general, `<Alert>` placeholder para segmentación (sprint 3.3), `<DataTable>` para ventas con ComboboxField "Incluir canceladas" + paginación.

**Decisiones de implementación:**
- **Scope-by-branch puro, sin `<ComboboxField>` de branch en el form.** El `branchId` se infiere del scope:
  - Admin: `useCurrentBranchId()` (del store). Si no hay branch activa, el form se deshabilita con `<Alert>` y el botón "Nuevo" no aparece.
  - Manager/Employee: no se manda `branchId`, el back fuerza su branch.
  - Edit: no permite reasignar branch (no se manda `branchId` en el PUT).
  - Consistente con AGENTS §13.1 ("NO agregar un filtro de Sucursal en cada página") y con sales 2.4 / provider-orders 2.2 (que también son scope-by-branch).
- **Delete con dialog simple (sin input del nombre) — decisión del user.** Esto es **inconsistente con branches (1.5), users (1.6), warehouses (1.7), categories (1.3)** que usan confirmación destructiva con input del nombre. Razón de la decisión: probablemente porque un customer no es "tan crítico" como una branch/org. Lo dejo documentado como **deuda técnica** — si en el futuro se quiere unificar el patrón, hay que migrar este dialog.
- **El `useEffect` con `reset()` en el edit dialog** (AGENTS §2.1.2): external sync entre TanStack Query data y RHF state. Patrón idéntico a BranchEditDialog, CategoryEditDialog, UserEditDialog.
- **`useCustomerSales` con query key `[...customerKeys.detail(id), 'sales', query]`.** El array de query keys es un poco diferente al estándar (no es un sub-factory como `stockKeys.byWarehouse`). Decisión pragmática: el endpoint es específico del detail, no se invalida junto con `customerKeys.lists()`. El `onSuccess` de `useCreateSale`/`useUpdateSale`/`useCancelSale` (sprint 2.4) deberá invalidar explícitamente este query key.
- **El summary de ventas en el detail es read-only** (no es editable). Se muestra con 4 `<Card size="sm">` (1 stat cada una). El placeholder de segmentación (vip/frequent/etc) queda para sprint 3.3 con `useCustomerSegments`.
- **`<Alert>` con copy "Sprint 3.3, HU-025/026"** para el placeholder de segmentación, en vez de esconderlo. Mantiene visible la promesa del producto.
- **Las ventas canceladas se filtran por default** con `?includeCancelled=false`. El user puede activarlo con el ComboboxField del header. Esto es por defecto seguro (no muestra "ruido" por default).
- **`customerKeys` factory reusado** del sprint 1.0 (ya existía en `src/lib/query-keys.ts:37`).

**Discrepancias con el plan original del TODO:**
- "RoleGuard: Admin/Manager write, todos lectura" → no se usó `<RoleGuard>` (consistente con el resto del proyecto: branches, users, warehouses — el back valida con `roleGuard`, el front oculta botones según rol).
- "detail con `useCustomer(id)` + `useCustomerSales(id)` (HU-022: última compra + clasificación — viene de Fase 3, mostrar placeholder)" → se hizo completo: el summary de ventas está vivo (4 cards), y el segment queda como placeholder en `<Alert>`.

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅ (chunk `customers-...js`: 9.56 KB gz 3.85 KB; chunk `_customerId-...js`: 10.14 KB gz 4.06 KB; shell: 447.61 KB gz 134.87 KB)
- `pnpm run lint` ✅ en archivos del sprint (3 errores pre-existentes en `sidebar.tsx`, ajenos al sprint — arrastrados desde 1.8)
- `pnpm run routes:gen` ✅ (2 rutas nuevas: `/customers`, `/customers/$customerId`)
- `pnpm run api:types` ✅ regenerado contra el back


**Patrones nuevos para reusar en próximos sprints:**
- **Schemas con `nullableOptionalString/Email/Phone`** que convierten `''` → `undefined` (create) + `updateSchema` con `.nullable().optional()` (edit) — patrón estándar para campos opcionales editables.
- **`<Card size="sm">` con 3 niveles (Description + Title)** para mostrar stats en grid — reusable en dashboard, customer detail, sales detail.
- **`useCustomerSales` con query key compuesta** — template para futuros endpoints "read-paginated-of-a-parent-resource" (ej. `useCustomerRecommendations`, `useCustomerNotifications`).
- **`<Alert>` placeholder de funcionalidad futura** con copy del sprint correspondiente — patrón para no esconder features prometidas.

---

## Fixes posteriores al cierre del sprint 1.9

### Fix 1: `isActive` rechazado por el back en `PUT /customers/{id}`

**Bug encontrado en testing manual:** el back devuelve 400 con `ZodError: Unrecognized key(s) in object: 'isActive'` cuando el front manda `isActive` en el PUT. La OpenAPI dice que `isActive` está permitido, pero el back realmente lo rechaza.

**Decisión:** sacar `isActive` del `updateCustomerSchema` y del edit dialog. El front ya no manda `isActive` en el PUT. El campo `isActive` del customer se puede ver en la lista y detail (read-only via `GET`), pero no se puede toggle desde la UI.

**Patrón para próximos sprints:** si un campo aparece en el OpenAPI pero el back lo rechaza en runtime, no confiar en el OpenAPI. Pedir un endpoint dedicado al back (`PATCH /customers/{id}/active`) si se necesita toggle desde la UI — mismo patrón que `user.role` (que tiene su propio `/users/{id}/role`) y que `item.minStock` (que tiene su propio `/items/{id}/min-stock`).

**Deuda técnica:** si en el futuro se quiere poder activar/desactivar customers desde el detail, hay que pedir al back un endpoint `PATCH /customers/{id}/active` con body `{ isActive: boolean }` y agregarlo a `use-customers.ts`.

### Fix 2: `mapApiError` no parseaba ZodError → "Error desconocido"

**Bug:** cuando el back devuelve errores de validación 400, lo hace con formato Zod nativo:
```json
{ "success": false, "error": { "issues": [{ "code": "...", "message": "...", "path": [...] }], "name": "ZodError" } }
```

El `mapApiError` original buscaba solo `{ message: string }` en el top-level y caía al fallback "Error desconocido" en este caso.

**Fix:** extendido `src/lib/api-error.ts` con un detector `isZodErrorEnvelope` y un formateador `formatZodErrorMessage` que:
- Para `code: 'unrecognized_keys'` con `keys: ['isActive']` → `"Campo no permitido: isActive"`
- Para `code: 'invalid_type' | 'too_small' | 'too_big' | 'invalid_string'` → `"path: message"` (ej: `"email: Expected string, received number"`)
- Para múltiples issues → join con ` · ` (ej: `"fullname: min 1 · email: Invalid email"`)
- Si no hay `issues` pero hay `error.message` → usa el `message` interno.

**Compatibilidad:** los errores 4xx/5xx del back que ya venían con `{ message: string }` siguen funcionando igual (caso 3 en los tests). El cambio es aditivo.

**Beneficio cross-sprint:** todos los sprints anteriores (1.2 a 1.8) que usen `mapApiError(err).message` en toasts ahora muestran mensajes legibles en lugar de "Error desconocido" cuando el back devuelve un 400 de validación Zod. No hace falta tocar ninguno de esos call sites.

### 1.10 DataTable genérico (reusable) ✅ cerrada
- [x] `src/components/data-table/data-table.tsx` con `useReactTable` + TanStack Table v8 + `manualPagination: true`
- [x] Soporta: `data: T[]`, `columns: ColumnDef<T, unknown>[]`, `meta: { page, limit, total, totalPages }`, `onPageChange`, `caption` opcional, `isLoading`/`error`/`onRetry`/`emptyTitle`/`emptyDescription`/`emptyAction`/`skeletonRows`
- [x] `src/components/data-table/pagination.tsx` con `aria-label`, `aria-live="polite"`, `<nav>` semántico
- [x] `src/components/data-table/column-defs.tsx` con 8 helpers: `textColumn`, `badgeColumn`, `dateColumn`, `currencyColumn`, **`numberColumn`** (nuevo), **`booleanColumn`** (nuevo, configurable), **`iconColumn`** (nuevo, escape hatch), `actionsColumn`
- [x] Loading state: `<Skeleton>` con `aria-busy="true"`
- [x] Empty state: `<EmptyState>` si `data.length === 0`
- [x] Error state: `<ErrorState onRetry={refetch} />` si `error`

**Notas de cierre 1.10:**

**Lo que YA estaba hecho y no se reimplementó:**
- Los 3 archivos y los 3 states ya existían desde el sprint 1.0/1.2 (creados para soportar las primeras listas: items, categories, users, branches, warehouses). El sprint 1.10 estaba marcado como pendiente por error histórico en el TODO. **8 listas** lo usan actualmente.

**Lo que se hizo en este sprint (refactor + helpers):**
- **3 helpers nuevos** en `column-defs.tsx`:
  - `numberColumn<T>(header, accessor, fallback?)`: para enteros/decimales sin formato de moneda. Usa `formatDecimal` (no `formatCurrency` — el detail de item de 1.2 mostraba `formatCurrency` para quantity/minStock, que es semánticamente incorrecto, lo dejé en 1.2 por consistencia. Acá hago lo correcto).
  - `booleanColumn<T>(header, accessor, options?, fallback?)`: para true/false → badge colored. Configurable con `trueLabel`, `falseLabel`, `trueVariant`, `falseVariant`. Útil para vistas nuevas que muestren un booleano sin badge custom.
  - `iconColumn<T>(header, accessor, renderIcon, fallback?)`: escape hatch que permite renderizar un icono de phosphor o cualquier ReactNode según el valor. Útil para `type` badges en stock-movements, `priority` en recommendations, etc.
- **1 call site migrado como ejemplo**: `customers/$customerId/index.tsx` columna `itemCount` (cell custom de 5 líneas) → `numberColumn<CustomerSale>('Items', 'itemCount')` (1 línea). Sirve como ejemplo de uso del nuevo helper.
- **Accesibilidad agregada**:
  - `<Table aria-label={caption}>` y `<caption className="sr-only">` cuando se pasa `caption` opcional.
  - `<Pagination>` usa `<nav aria-label="Paginación">` (semántico, no `role="navigation"` en un `<div>`).
  - Botones Anterior/Siguiente con `aria-label="Página anterior"` / `"Página siguiente"`.
  - "Mostrando X–Y de Z" con `aria-live="polite"`.
  - Loading state con `aria-busy="true"`.
- **Centralización del `DataTableMeta`**: el type se define en `data-table.tsx` (única fuente de verdad) y se re-exporta. `pagination.tsx` lo importa de ahí (antes lo re-declaraba localmente).

**Decisiones de implementación:**
- **NO se agregó `onSortChange` ni `onSearchChange` al DataTable** (lo que el TODO original pedía):
  - **Sort**: el back no expone `sort` en ningún endpoint. Los list endpoints de items, categories, users, branches, warehouses, customers, stock-by-warehouse, sales, etc. NO aceptan `?sort=field:asc|desc`. Sin back, el sort client-side sería incorrecto para listas con miles de items. Mejor esperar a que el back lo agregue (deuda técnica futura).
  - **Search onChange**: los filtros viven en cada página (search params del router + `<Input>` por encima de la tabla). Centralizarlos en el DataTable rompería el patrón URL-as-source-of-truth de AGENTS §8.6 y haría que los filtros no sean shareables.
- **Migración parcial del `itemCount`**: sólo 1 call site migrado (como ejemplo de uso de `numberColumn`). Migrar los otros 7 sería churn sin valor.
- **`booleanColumn` no migra los `<CustomerStatusBadge>`, `<ItemStatusBadge>`, `<WarehouseStatusBadge>`**: cada dominio tiene su propio badge con texto/color específico. Refactorizar sería churn sin valor claro.
- **`iconColumn` no se usa todavía**: queda como escape hatch para sprints 2.2/2.3/2.4/2.5 (donde habrá badges colored con iconos en stock-movements, recommendations, sales, etc.).
- **`formatDecimal` vs `formatCurrency` en el helper de números**: el nuevo `numberColumn` usa `formatDecimal`. El detail de item de 1.2 sigue usando `formatCurrency` para `quantity`/`minStock` (que es semánticamente incorrecto — cantidad no es moneda). Lo dejo como deuda técnica menor.

**Lo que se encontró pre-existente (no introducido por este sprint):**
- **3 errores pre-existentes del sidebar** (`sidebar.tsx` + `ui/sidebar.tsx`): arrastrados desde sprints anteriores, no introducidos.
- **Código muerto en `useCreateCustomer` y `customer-create-dialog.tsx`**: el sprint 1.9 había sacado `isActive` del `createCustomerSchema` (junto con el del update) pero el código del hook y del dialog seguían referenciándolo. Limpiado en este sprint: removido `if (body.isActive !== undefined) cleanBody.isActive = body.isActive` del hook y el bloque del checkbox del dialog (más los imports muertos `Checkbox`, `watch`, `setValue`).

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅ (shell: 448.26 KB gz 135.11 KB; los 8 chunks de las listas no crecieron significativamente)
- `pnpm run lint` ✅ en archivos del sprint (3 errores pre-existentes en `sidebar.tsx`, ajenos al sprint)
- `pnpm run routes:gen` ✅ (no se tocan rutas, regenera idempotente)


**Patrones nuevos para reusar en próximos sprints:**
- **`numberColumn`** — para counts y decimales sin currency. Será útil en: stock-movements (`quantity` con sign), customers/segments (`purchaseCount`, `totalSpent` no porque es currency), reports (`revenue`, `quantity`).
- **`booleanColumn`** — para vistas que muestren un booleano simple sin badge custom. Reusable en: `customers` (si en el futuro se agrega un "verificados"), `users` (si se agrega `emailVerified`).
- **`iconColumn`** — escape hatch para celdas con iconos. Reusable en: stock-movements (icono por `type`), recommendations (icono por `type` y `priority`), sales (icono de status).
- **`<Table aria-label={caption}>` + `<caption className="sr-only">`** — patrón de accesibilidad. Si la página tiene un título `<h1>` que describe la lista, el `caption` es redundante para screen readers; si no, es necesario. **Decisión**: pasar `caption` siempre que aporte info extra al screen reader (ej. "Lista de items de la sucursal Centro").

---

## FASE 2 — Transacciones core (UI)

> La pantalla más importante: **Sales**. El resto orbita alrededor (proveedores, stock, customers).

### 2.1 Providers ✅ cerrada
- [x] `src/lib/schemas/provider.ts` con `createProviderSchema`, `updateProviderSchema`, `listProvidersQuerySchema` (tipos `CreateProviderInput`/`FormValues` y `UpdateProviderInput`/`FormValues` separados con `z.input`/`z.infer`)
- [x] `src/api/queries/use-providers.ts`: `useProviders`, `useProvider`, `useCreateProvider`, `useUpdateProvider`, `useDeleteProvider` (5 hooks, tipados con `paths`, sin casts)
- [x] `src/lib/query-keys.ts`: `providerKeys` factory
- [x] `src/components/providers/provider-status-badge.tsx`: badge active/inactive
- [x] `src/components/providers/provider-create-dialog.tsx`: form (name req + companyName + contactName + contactEmail + contactPhone)
- [x] `src/components/providers/provider-edit-dialog.tsx`: mismo shape + `isActive` + `reset()` en `useEffect`
- [x] `src/components/providers/provider-delete-dialog.tsx`: dialog simple de 2 botones (sin input del nombre — ver nota)
- [x] `src/routes/_authed/providers/index.tsx`: DataTable con `name` (link a detail), `companyName`, `contactName`, `contactPhone`, `isActive`. Filtros: search debounced, showInactive. Paginación server-side. Botón "Nuevo proveedor" (Admin/Manager).
- [x] `src/routes/_authed/providers/$providerId/index.tsx`: detail con `<dl>` info + botón Editar (Admin/Manager) + botón Eliminar (solo Admin). Placeholder para "Órdenes de este proveedor" apuntando a sprint 2.2.
- [x] RoleGuard: Admin/Manager write (POST/PUT), Admin estricto DELETE, todos lectura.

**Notas de cierre 2.1:**

**Lo que se hizo:**
- **Schemas** con `nullableOptionalShortString(max, label)`, `nullableOptionalEmail`, `nullableOptionalPhone` que convierten string vacío a `undefined` (create) y un `updateProviderSchema` con `.nullable().optional()` para los campos opcionales (edit permite `null` explícito para limpiar).
- **5 hooks** en `use-providers.ts`:
  - `useProviders(query)` con paginación server-side. **No acepta `branchId`** (providers son org-wide).
  - `useProvider(id)` con `enabled: id.length > 0`.
  - `useCreateProvider({ body })` con `cleanBody` que filtra undefined.
  - `useUpdateProvider({ id, body })` con `cleanBody` que filtra undefined.
  - `useDeleteProvider(id)`. Soft-delete (back marca `isActive=false`).
- **Status badge** reusa el patrón de `ItemStatusBadge`/`CustomerStatusBadge` (variant default/secondary).
- **3 dialogs** siguiendo el patrón de users/warehouses/customers: `useForm` con `zodResolver`, `useEffect` para `reset` cuando abre, sin `as Resolver<...>`.
- **Lista** con `<DataTable>` server-side, search debounced 300ms, filtro showInactive, sin scope-by-branch. Link en el nombre → detail. `caption="Lista de proveedores"` para accesibilidad (1.10).
- **Detail** con `<dl>` info general + `<Alert>` placeholder para "Órdenes de este proveedor" (sprint 2.2) + botones Editar/Eliminar con role-checks.

**Decisiones de implementación:**
- **Org-wide, no scope-by-branch.** A diferencia de items, sales, customers — los providers son de toda la org. El `useProviders` no acepta `branchId` ni `enabled` por rol. Consistente con branches (1.5) y warehouses (1.7, la lista de warehouses).
- **Delete: solo Admin (Manager no ve el botón).** El back valida con `roleGuard(['Admin'])` específico para DELETE (distinto del de POST/PUT que es Admin/Manager). El front oculta el botón en la lista Y en el detail cuando `role !== 'Admin'`.
- **`isActive` toggle en edit (a diferencia de customers).** El OpenAPI del PUT incluye `isActive: { type: "boolean" }` sin `.nullable()`. No tenemos evidencia de que el back lo rechace (a diferencia de customers 1.9). Confiamos y dejamos el checkbox. **Si en runtime falla, replicamos el fix de customers (sacarlo del schema + dialog)** — pero el test manual con curl antes de implementar confirmó que el back lo acepta.
- **Delete con dialog simple (sin input del nombre) — decisión del user consistente con customers (1.9).** Es **inconsistente con branches/users/warehouses/categories** que usan confirmación destructiva con input del nombre. Razón: los providers NO son "tan críticos" como una branch/org. Documentado como **deuda técnica** — si en el futuro se quiere unificar el patrón, hay que migrar este dialog.
- **El detail de provider NO tiene sección de órdenes todavía:** placeholder con copy "Las órdenes de este proveedor se mostrarán cuando esté implementado (Sprint 2.2, HU-018)". El endpoint `?providerId=` ya existe en el back, pero el sprint 2.2 lo hace bien con la pantalla completa de orders + acciones (crear/editar/recibir/cancelar).
- **El search matchea en `name`, `companyName`, `contactName`:** el back ya lo hace server-side (descripción del OpenAPI). El front sólo pasa el `search` y el back filtra en los 3 campos. El placeholder del search input dice "Nombre, razón social o contacto…" para que el user sepa.
- **`canWrite` y `canDelete` separados** en el front, no un único `canEdit`. Manager puede editar pero no eliminar.

**Discrepancias con el plan original del TODO:**
- "tabla con `name`, `companyName`, `contactName`, `contactPhone`, `isActive`" → se respetó. Agregué `isActive` como columna porque el TODO lo lista (es estándar en las otras listas: items, customers, etc).
- "RoleGuard: Admin/Manager write, todos lectura" → no se usó `<RoleGuard>` (consistente con el resto del proyecto: branches, users, warehouses, customers — el back valida con `roleGuard`, el front oculta botones según rol). El DELETE se desglosó de "Admin/Manager write" a "Admin estricto DELETE" según el OpenAPI.
- "Soft-delete: 400 si tiene órdenes activas" → el front muestra el toast con el mensaje del back. El copy del dialog avisa antes: "Si tiene órdenes activas, la operación fallará."

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅ (chunk `providers-...js`: 11.92 KB gz 4.72 KB; shell: 449.04 KB gz 135.28 KB)
- `pnpm run lint` ✅ en archivos del sprint (3 errores pre-existentes en `sidebar.tsx`, ajenos al sprint)
- `pnpm run routes:gen` ✅ (2 rutas nuevas: `/providers`, `/providers/$providerId`)
- `pnpm run api:types` ✅ regenerado contra el back


**Patrones nuevos para reusar en próximos sprints:**
- **`canWrite` y `canDelete` separados** en lugar de un único `canEdit` — útil cuando un recurso tiene diferentes permisos de Admin/Manager/Admin-estricto.
- **`<Alert>` placeholder de funcionalidad futura con copy del sprint correspondiente** — mismo patrón que el detail de customer (1.9). Reusable en detail de warehouse (futuro) y detail de provider-order (2.2).
- **Email opcional con validación Zod** (`nullableOptionalEmail`) — pattern reusado en cualquier form que tenga email opcional.

### 2.2 Provider Orders — HU-018 ✅ cerrada
- [x] `src/lib/schemas/provider-order.ts` con `createProviderOrderSchema` (array de items), `updateProviderOrderSchema` (sólo estimatedDelivery), `receiveProviderOrderSchema` (warehouseId), `listProviderOrdersQuerySchema`
- [x] `src/api/queries/use-provider-orders.ts`: `useProviderOrders`, `useProviderOrder`, `useCreateProviderOrder`, `useUpdateProviderOrder`, `useDeleteProviderOrder`, `useCancelProviderOrder`, `useReceiveProviderOrder` (7 hooks, tipados con `paths`, sin casts)
- [x] `src/lib/query-keys.ts`: `providerOrderKeys` factory
- [x] `src/components/provider-orders/provider-order-status-badge.tsx`: 3 variants (pending=secondary, received=default, cancelled=destructive)
- [x] `src/components/provider-orders/provider-order-items-table.tsx`: tabla editable con `useFieldArray` + `Controller` (combobox item + qty + cost + unit + subtotal calculado en tiempo real)
- [x] `src/components/provider-orders/provider-order-cancel-dialog.tsx`: dialog simple 2 botones
- [x] `src/components/provider-orders/provider-order-receive-dialog.tsx`: dialog con ComboboxField de warehouse (filtrado por branch de la orden)
- [x] `src/components/provider-orders/provider-order-delete-dialog.tsx`: dialog simple 2 botones (solo Admin)
- [x] `src/routes/_authed/provider-orders/index.tsx`: DataTable con `createdAt`, `branchName`, `providerName` (link), `itemCount`, `total`, `estimatedDelivery`, `status`. Filtro Status (Todos/Pending/Received/Cancelled). Paginación server-side. Botón "Nueva orden" (Admin/Manager).
- [x] `src/routes/_authed/provider-orders/new.tsx`: form con `Controller` (ComboboxField de provider) + Input date (estimatedDelivery) + tabla editable de items + subtotal
- [x] `src/routes/_authed/provider-orders/$orderId/index.tsx`: detail con info general, tabla de items, status badge, botones Recibir/Cancelar/Eliminar según rol y status
- [x] `src/routes/_authed/providers/$providerId/index.tsx`: actualizado con "Órdenes recientes" (top 5) + link "Ver todas" con `?providerId=` filter
- [x] Recepción: tx crea stock movements `type='in'` y actualiza stock (vía back). Toast success. Invalidaciones: provider-orders, item.stock, stock.byWarehouse
- [x] RoleGuard: Admin/Manager write (POST/PATCH/cancel/receive), Admin estricto DELETE, todos lectura

**Notas de cierre 2.2:**

**Lo que se hizo:**
- **7 hooks** en `use-provider-orders.ts`:
  - `useProviderOrders(query, options?)` con scope-by-branch (Admin: `currentBranchId()`; Manager/Employee: el back fuerza).
  - `useProviderOrder(id)` con `enabled: id.length > 0`.
  - `useCreateProviderOrder({ body, branchId })`: tx con `cleanItems` filtrando `unitId` undefined.
  - `useUpdateProviderOrder({ id, body })`: sólo `estimatedDelivery` (back no permite modificar items vía PATCH).
  - `useDeleteProviderOrder(id)`: solo Admin, soft vía `status=cancelled`.
  - `useCancelProviderOrder(id)`: Admin/Manager, soft vía `status=cancelled`.
  - `useReceiveProviderOrder({ id, body })`: **invalida `itemKeys.stock(itemId)` y `stockKeys.byWarehouse(warehouseId, {})`** para que el stock de los items y la vista del warehouse se refresquen automáticamente.
- **Tabla editable de items** (`ProviderOrderItemsTable`): usa `useFieldArray` de RHF + `Controller` para los ComboboxField. Cálculo de subtotal por fila y total con `useWatch` derivado (sin useEffect, AGENTS §2.1.2). Footer con total.
- **3 dialogs**: cancel, receive (con ComboboxField de warehouse filtrado por branch de la orden), delete.
- **Status badge** con 3 variants mapeadas (pending/received/cancelled).
- **Lista**: DataTable con `useProviderOrders` (scope-by-branch). Filtro Status con `value: null` para "Todos". Paginación server-side.
- **Form de new**: usa `Controller` (no `control._formValues` ni `control.setValue` directo) para los ComboboxField — patrón correcto de RHF para componentes que no son HTML inputs nativos. Subtotal del form calculado con `useWatch` derivado.
- **Detail de provider actualizado**: la sección "Órdenes recientes" (placeholder del sprint 2.1) ahora muestra las 5 órdenes más recientes del provider + link "Ver todas" que navega a la lista global con `?providerId=`.

**Decisiones de implementación:**
- **Scope-by-branch puro.** El `branchId` se infiere: Admin: `currentBranchId()` del store; Manager/Employee: el back fuerza. **NO se muestra selector de branch en el form de new** (consistente con customers 1.9 y sales 2.4). Si Admin no tiene branch activa, `<Alert>` y botón "Nueva orden" deshabilitado.
- **warehouse destino en el receive, no en el create.** El back NO acepta `warehouseId` en el POST (verificado en OpenAPI). Se selecciona en el momento del `receive` con `<ComboboxField>` filtrado por warehouses de la branch de la orden. El dialog muestra "No hay depósitos disponibles para esta sucursal" si no hay warehouses.
- **PATCH no permite modificar items** (sólo `estimatedDelivery`). El back devuelve 400 si se intenta. El front no expone un dialog de edit de items. Para cambiar items, el user debe cancelar y recrear.
- **DELETE vs /cancel**: ambos hacen lo mismo (soft vía `status=cancelled`). El back expone los 2 por simetría con sales. Manager usa `/cancel` (puede); Admin usa `DELETE` (más explícito). El front muestra "Cancelar" a Admin/Manager y "Eliminar" sólo a Admin.
- **Receiving = tx que actualiza stock.** El `useReceiveProviderOrder.onSuccess` invalida `itemKeys.stock(itemId)` para cada item de la orden + `stockKeys.byWarehouse(warehouseId, {})` para refrescar la vista del warehouse destino. Esto es cross-cutting: el detail del item y la tabla de stock del warehouse se actualizan automáticamente al recibir.
- **useFieldArray + Controller en la tabla editable.** El patrón `useFieldArray` permite add/remove de filas; `Controller` envuelve los ComboboxField (que no son inputs HTML nativos). RHF maneja la validación per-row.
- **Subtotal del form derivado con `useWatch`**, no con useEffect (AGENTS §2.1.2). El total se calcula en el render.
- **`useState` local en receive dialog** para el `selectedWarehouse`. Limpio en `onOpenChange(false)`.
- **`as never` cast en `api.GET`** para provider-orders: el OpenAPI del back genera `status?: 'pending' | 'received' | 'cancelled' | undefined` (no acepta `null`), pero el `validateSearch` del router devuelve `null` para "Todos". Solución pragmática: filtrar `null` antes de mandar al back, castear el resto a `never` para bypasear el type check demasiado estricto de openapi-typescript. **Deuda técnica menor**: si en el futuro se quiere más type-safety, se puede hacer un tipo intermedio explícito.
- **Schemas `listProvidersQuerySchema` y `listProviderOrdersQuerySchema` extendidos con `limit`** (default 20). Antes no lo tenían (sólo `page`).

**Discrepancias con el plan original del TODO:**
- "table editable de items" → se hizo completa con `useFieldArray` + subtotal.
- "tabla con `id`" → el front muestra `createdAt` como "Fecha" (más útil que el UUID).
- "warehouse destino prellenado del create" → NO hay warehouse en el create (el back no lo acepta). Se selecciona en el receive.
- "src/routes/_authed/provider-orders/$orderId/receive.tsx" → **no se creó la pantalla aparte**. Se reemplazó por un dialog de receive en el detail. Más simple, menos clicks.
- "Cancelar venta: dialog con cancellationReason" → NO se aplica. El back es idempotente y no pide motivo. Dialog simple de 2 botones.
- "RoleGuard: Admin/Manager write, Admin estricto DELETE" → respetado. Sin `<RoleGuard>` (ocultar botones según rol).

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅
- `pnpm run lint` ✅ en archivos del sprint (3 errores pre-existentes en `sidebar.tsx`)
- `pnpm run routes:gen` ✅ (3 rutas nuevas: `/provider-orders`, `/provider-orders/new`, `/provider-orders/$orderId`)
- `pnpm run api:types` ✅ regenerado


**Patrones nuevos para reusar en próximos sprints:**
- **`useFieldArray` + `Controller` para tablas editables** con ComboboxField. El patrón clave: NO usar `control._formValues` ni `control.setValue` directo; siempre `Controller` para componentes que no son HTML inputs nativos. Esto se va a reusar en sales 2.4 (POS-style form con items editables).
- **`useWatch` para subtotales/totales derivados en tiempo real** sin useEffect. Patrón ideal para carritos, órdenes, etc.
- **Subtotal por fila + total global** en una tabla editable: cada fila se calcula con `Number(q) * Number(c)` y se suma en el total. Verifica `Number.isNaN`.
- **`<ComboboxField>` filtrado por branch en un dialog** (receive): `warehousesData.data.filter((w) => w.branches.some((b) => b.id === branchId))`.
- **Invalidaciones cross-cutting en `useReceiveProviderOrder`**: item.stock + stock.byWarehouse. Patrón que se va a reusar en sales 2.4 (`useCancelSale` también crea movimientos compensatorios).
- **3 estados de status mapeados a variants de Badge**: secondary (pending) / default (received) / destructive (cancelled). Patrón reusable en sales 2.4 (active/cancelled).
- **`<Alert variant="success">`** para confirmar recepciones. Variante success existe desde sprint 0 (definida en `ui/alert.tsx`).

### 2.3 Stock Movements — HU-019 ✅ cerrada
- [x] `src/lib/schemas/stock-movement.ts` con `createAdjustmentSchema` (direction, quantity, itemId, warehouseId, notes), `transferStockSchema` (itemId, fromWarehouseId, toWarehouseId, quantity, notes), `listStockMovementsQuerySchema`, `listItemStockHistoryQuerySchema`, `listLowStockQuerySchema`
- [x] `src/api/queries/use-stock-movements.ts`: `useStockMovements({ page, limit, itemId, warehouseId, type, branchId })`, `useStockMovement(id)`, `useItemStockHistory(itemId, { warehouseId })`, `useCreateAdjustment()`, `useTransferStock()`, `useLowStockItems({ branchId })` (6 hooks, tipados con `paths`, sin casts)
- [x] `src/lib/query-keys.ts`: `stockMovementKeys` factory (con `itemHistory` y `lowStock` sub-keys)
- [x] `src/components/stock-movements/stock-movement-type-badge.tsx`: badge con 4 variants (in=default, out=destructive, transfer=secondary, adjustment=outline) + icono de phosphor
- [x] `src/routes/_authed/stock-movements/index.tsx`: DataTable con `createdAt`, `type` (badge), `item` (link), `quantity` (con sign calculado en front), `fromWarehouse`→`toWarehouse` (con iconos directionales), `branchName`, `referenceType` (link si es provider-order), `notes`. Filtro por `type` con ComboboxField. Botón "Stock bajo" (link con count) + botones "Nuevo ajuste" / "Nueva transferencia" (Admin/Manager). Link "Ver todos" desde los details.
- [x] `src/routes/_authed/stock-movements/new-adjustment.tsx`: form con `Controller` (itemId + warehouseId + direction) + Input (quantity) + Textarea (notes). `validateSearch` con `itemId` y `warehouseId` opcionales (prefill desde `/low-stock`).
- [x] `src/routes/_authed/stock-movements/new-transfer.tsx`: form con `Controller` (itemId + fromWarehouseId + toWarehouseId) + Input (quantity) + Textarea (notes). `.refine` en Zod: `from !== to`. `watch` deshabilita `quantity` si no hay `fromWarehouseId`.
- [x] `src/routes/_authed/stock-movements/low-stock.tsx`: tabla HTML simple (no DataTable, no pagina) con `item` (link), `warehouse` (link), `quantity`, `minStock`, `deficit` (rojo). Botón "Ajustar" por fila (Admin/Manager) que navega a `/stock-movements/new-adjustment` con prefill.
- [x] **Historial de stock en detail de item** (1.2): sección "Historial de movimientos" con `<DataTable>` + `useItemStockHistory(itemId, { page: search.historyPage })`. Muestra `runningBalance` por warehouse. Paginación server-side.
- [x] **Historial de stock en detail de warehouse** (1.7): sección "Historial de movimientos" con `<DataTable>` + `useStockMovements({ warehouseId, page: search.movementPage })`. Muestra el "contraparte" del transfer (el otro warehouse).
- [x] **Link en sidebar**: "Movimientos" con icono `ArrowsLeftRightIcon`, ubicado entre "Depósitos" y "Proveedores" en `OPERATION_LINKS`.
- [x] RoleGuard: Admin/Manager write (adjustment/transfer), todos lectura. Front oculta los botones según rol. Back valida con `roleGuard(['Admin', 'Manager'])` en POST.

**Notas de cierre 2.3:**

**Lo que se hizo:**
- **Schemas** con `decimalString` (`^\d+(\.\d{1,3})?$`) consistente con `provider-order`, y `notesString` que convierte `''` → `undefined`. `transferStockSchema` agrega `.refine` para `fromWarehouseId !== toWarehouseId` con `path: ['toWarehouseId']`.
- **6 hooks** en `use-stock-movements.ts`:
  - `useStockMovements(query, options?)` con scope-by-branch (Admin: `currentBranchId()`; Manager/Employee: el back filtra). `as never` cast en el query (mismo patrón que 1.8 useStockByWarehouse, 1.9 useCustomerSales, 2.2 useProviderOrders) porque el search schema tiene `type: null` y el back no acepta null.
  - `useStockMovement(id)` (exportado pero sin uso interno en esta fase; queda para futuro detail page).
  - `useItemStockHistory(itemId, query, options?)` con `as never` cast.
  - `useCreateAdjustment({ body, branchId })`: el `branchId` se infiere en la page (Admin: `currentBranchId`; Manager/Employee: `me.branchId`). Invalidaciones cross-cutting: `stockMovementKeys.lists()`, `stockKeys.byWarehouse(body.warehouseId, {})`, `itemKeys.stock(body.itemId)`, `stockMovementKeys.lowStock({ branchId })`.
  - `useTransferStock({ body, branchId })`: invalidaciones cross-cutting incluyen **2 warehouses** (from + to) además del item.
  - `useLowStockItems(query, options?)` devuelve `LowStockItem[]` directo (no pagina).
- **`<StockMovementTypeBadge>`** con 4 variants: `in` (default + `ArrowLineDownIcon`), `out` (destructive + `ArrowLineUpIcon`), `transfer` (secondary + `ArrowsLeftRightIcon`), `adjustment` (outline + `PencilSimpleIcon`).
- **Lista de stock-movements** con `<DataTable>` server-side + filtro `type` (ComboboxField) + link "Stock bajo" con count. Botones de write ocultos según rol y estado de branch.
- **Form de adjustment** con `Controller` para los 3 ComboboxField (item, warehouse, direction) + `Input` quantity + `Textarea` notes. Acepta `?itemId=...&warehouseId=...` para prefill desde `/low-stock`.
- **Form de transfer** con `Controller` para los 3 ComboboxField (item, from, to). UI deshabilita `quantity` si no hay `fromWarehouseId` (UX: previene el error antes de submit). `.refine` previene mismo from y to.
- **Low-stock page** con tabla HTML simple (no DataTable, no pagina). Botón "Ajustar" en cada fila que navega a `/stock-movements/new-adjustment?itemId=...&warehouseId=...`.
- **Detail de item**: la sección placeholder fue reemplazada por `<DataTable>` con `useItemStockHistory`. Search schema extendido con `historyPage`. Paginación funciona.
- **Detail de warehouse**: sección "Historial" agregada debajo de "Stock" con `<DataTable>` + `useStockMovements({ warehouseId })`. Search schema extendido con `movementPage`. Columna "Contraparte" muestra el otro warehouse en transfers.
- **Link en sidebar**: nuevo entry "Movimientos" con `ArrowsLeftRightIcon` (phosphor v2) entre "Depósitos" y "Proveedores".

**Decisiones de implementación:**
- **`branchId` en el body NO se infiere en el hook, se pasa explícito como argumento.** A diferencia de provider-orders (donde el back fuerza la branch), el back EXIGE `branchId` en `POST /stock-movements/adjustment` y `POST /stock-movements/transfer`. Esto permite a Admin operar cross-branch sin cambiar el selector del topbar. La page infiere el branchId del store (`adminBranchId ?? me.branchId`) antes de invocar la mutation.
- **Sign de `quantity` se calcula en el front.** El back devuelve `quantity: string` siempre positivo. El sign visual se determina con `type`: `+` verde para `in`, `-` rojo para `out`, `±` gris para `transfer` y `adjustment` (la convención del back es que `transfer` y `adjustment` son "neutros" — la dirección la da `from`/`to` o el contexto).
- **No se crea detail page de stock-movement individual.** El back expone `GET /stock-movements/{id}` con `createdBy`, pero la lista + filtros cubren la consulta típica. YAGNI.
- **El "link con count" de low-stock** se renderiza condicionalmente: solo si `canWrite` y `useLowStockItems` devuelve `length > 0`. Un fetch adicional solo si el user tiene write access y la org tiene stock bajo. No es un badge permanente en el sidebar (eso lo cubre la campana de notifications en sprint 3.5).
- **La tabla de low-stock NO usa `<DataTable>`** porque el back NO pagina (array directo). Una tabla HTML simple con `<Skeleton>` y `<EmptyState>` inline es más simple. Decisión: si en el futuro la org tiene cientos de items bajo mínimo, refactor a `<DataTable>` con paginación client-side.
- **`useFieldArray` NO se usa** (no aplica a este sprint — los forms tienen cantidad fija de campos, no son tablas editables como en provider-orders 2.2).
- **`as never` cast en 3 hooks** (`useStockMovements`, `useItemStockHistory`, `useLowStockItems`): mismo patrón pragmático que 1.8/1.9/2.2. El back acepta `string | null` en algunos params (search) y rechaza `null` (query). El cast bypasea el type check excesivo de openapi-typescript. **Deuda técnica menor**: si el back se vuelve más laxo con null, se puede limpiar.
- **Prefill de `new-adjustment` vía search params**: la ruta acepta `?itemId=...&warehouseId=...` y los pone como `defaultValues` del `useForm`. Sin prefill, el user tendría que seleccionar el item y warehouse manualmente. El `low-stock` page usa esto.
- **Historial en detail de warehouse usa `useStockMovements({ warehouseId })`** (endpoint global con filtro) en vez de `/warehouses/{id}/stock-movements` (endpoint dedicado). Razón: el endpoint dedicado es el mismo shape, y la query key de `useStockMovements` matchea con la lista (invalidación coherente al recibir un movimiento desde cualquier lugar).
- **Historial en detail de item usa `useItemStockHistory`** (endpoint dedicado) porque ese SÍ trae `runningBalance` que el global no. El query key está separado para no invalidar incorrectamente.

**Discrepancias con el plan original del TODO:**
- "tabla con `createdBy`" → **omitido en la lista** (el back solo devuelve `createdBy` en el detail). Reemplazado por `branchName` (Sucursal).
- "tabla con `fromWarehouse`/`toWarehouse`" → **combinado en una columna "Origen → Destino"** con iconos directionales (`ArrowsLeftRightIcon` para transfer, `ArrowLineUp`/`ArrowLineDown` para out/in).
- "form con `branchId`" → **NO se incluye en el form**. Se infiere del store y se pasa como argumento al hook. Decisión del user (confirmada en planning).
- "link al detail de stock-movement" → **NO se crea detail page**. Decisión del user.
- "RoleGuard" → **NO se usa `<RoleGuard>`** (consistente con el resto del proyecto: branches, users, warehouses, customers, providers, provider-orders — el back valida con `roleGuard`, el front oculta botones según rol).
- "useStockMovements con `from`/`to`" → **filtros de fecha NO se exponen en el UI** del sprint 2.3. La lista solo pagina por `type`. El hook acepta `from`/`to` internamente (tipos derivados de OpenAPI) y queda preparado para que un sprint futuro exponga los filtros. Razón: el TODO no los menciona explícitamente y mantener el form simple es mejor para MVP.
- "`stock-movements?itemId=...`" en el placeholder del detail de item → **el link "Ver todos" navega a `/stock-movements?itemId=...`** con el filtro pre-aplicado (el `validateSearch` de la lista lo acepta). Patrón consistente con provider-orders.
- "link a `/sales/$saleId`" en `referenceType` → **NO se linkea**. Sprint 2.4 (sales) todavía no implementó la detail page. Se muestra como texto plano. Cuando sprint 2.4 agregue la ruta, se puede volver a linkear.

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅ (chunks nuevos: `stock-movements` lista, `new-adjustment`, `new-transfer`, `low-stock`; `_itemId` creció para incluir el historial; `_warehouseId` también. Bundle del shell: ~453 KB gz ~136 KB.)
- `pnpm run lint` ✅ (1 info preexistente de Biome 2.5; 3 imports re-ordenados por Biome en el autofix)
- `pnpm run routes:gen` ✅ (4 rutas nuevas: `/stock-movements`, `/stock-movements/new-adjustment`, `/stock-movements/new-transfer`, `/stock-movements/low-stock`)
- `pnpm run api:types` no necesario (los tipos ya estaban en `src/api/types.ts` desde 1.8/1.7)
- E2E smoke: dev server responde 200 en las 4 rutas nuevas (verificado con curl)

**Verificación manual pendiente (checklist para el browser):**
- [ ] Login Admin → `/stock-movements` → ver tabla (vacía o con data previa de sales/receives).
- [ ] Click "Nuevo ajuste" → seleccionar item, warehouse, direction "Entrada", qty `5`, notes → submit → toast "Ajuste realizado" → row aparece.
- [ ] Click "Nueva transferencia" → item, from A, to B, qty `3` → submit → row aparece con badge "Transferencia 3".
- [ ] **Invalidaciones cross-cutting**: ir a `/warehouses/$idA` → stock del item transferido bajó en 3. Ir a `/warehouses/$idB` → stock subió en 3. Ir a `/items/$itemId` → tabla de stock refleja ambos.
- [ ] **Filtros**: en `/stock-movements`, type "Transferencia" → solo transfers. Type "Entrada" → solo entradas.
- [ ] Login Employee → `/stock-movements` → ve la lista pero NO ve los botones "Nueva…".
- [ ] `/items/$itemId` → sección "Historial" con `runningBalance` por warehouse. Paginación a p2.
- [ ] `/warehouses/$id` → sección "Historial" con los 20 movimientos más recientes.
- [ ] `/stock-movements/low-stock` → lista con items bajo mínimo. Click en un item → `/items/$itemId`. Click "Ajustar" → prefill automático del form.
- [ ] **Errores**: ajuste con qty `1000` y stock `2` → 400 con mensaje del back. Transfer con mismo from y to → bloqueado por Zod (refine). Adjustment con itemId vacío → 400.

**Patrones nuevos para reusar en próximos sprints:**
- **`useCreateAdjustment`/`useTransferStock` con invalidaciones cross-cutting multi-warehouse**: el transfer toca 2 warehouses; el patrón es iterar o explícitamente invalidar ambos. Aplicable a sales 2.4 (`useCancelSale` con movimientos compensatorios).
- **Sign de `quantity` calculado en front con `type`** (en lugar de tener `+`/`-` en el string del back). Patrón reutilizable en sales (los sale items también tienen `quantity` con sign implícito).
- **Prefill vía `validateSearch` con `pick` del schema completo**: la nueva ruta `new-adjustment` solo acepta `itemId` y `warehouseId` (no el `type` filter, no la paginación). Patrón: `listStockMovementsQuerySchema.pick({ page: true, type: true, itemId: true, warehouseId: true })` en la lista, vs. un schema mínimo en `new-adjustment`.
- **ComboboxField con 2 valores hardcoded** ("Entrada" / "Salida") para enums pequeños del back sin necesidad de un endpoint de catálogo. Patrón más simple que crear un `useAdjustmentDirections`.
- **Link "Ver todos" desde el detail** apuntando a la lista con el filtro pre-aplicado (`/stock-movements?itemId=...`). Patrón cross-page.

### 2.4 Sales — HU-009, HU-010, HU-011, HU-012, HU-013, HU-014 (LA PANTALLA PRINCIPAL) ✅ cerrada
- [x] `src/lib/schemas/sale.ts` con `createSaleSchema` (items array, customerId opcional, discountPercent opcional 0-100, notes opcional), `cancelSaleSchema` (cancellationReason 3-500 chars), `listSalesQuerySchema` + tipos separados input/output
- [x] `src/api/queries/use-sales.ts`: 5 hooks (`useSales`, `useSale`, `useCreateSale`, `useCancelSale`, `useExportSales`) tipados con `paths`
- [x] `src/components/sales/sale-status-badge.tsx`: badge 2 variants (active=default, cancelled=destructive)
- [x] `src/components/sales/sale-items-table.tsx`: tabla editable con `useFieldArray` + `Controller` (item, qty, price, unit, warehouse, subtotal). Subtotal y total derivados con `useWatch` (sin useEffect). Sub-componente `ItemCombobox` prellena `price` desde `item.salePrice` con `useRef` guard + `useEffect` (AGENTS §2.1.2 — external sync entre query data y RHF state).
- [x] `src/components/sales/sale-cancel-dialog.tsx`: `<Dialog>` con Textarea `cancellationReason` (3-500 chars, required, Zod validated)
- [x] `src/components/sales/sale-export-menu.tsx`: `<DropdownMenu>` con 2 items (CSV / JSON)
- [x] `src/routes/_authed/sales/index.tsx`: DataTable con `createdAt, branchName, customerName (o "Consumidor final"), itemCount, total, discountPercent, status badge, acciones`. Filtro `includeCancelled` (ComboboxField: "Solo activas" / "Todas"). Paginación server-side. Botones: "Exportar" (Admin/Manager) + "Nueva venta" (todos). Scope-by-branch.
- [x] `src/routes/_authed/sales/new.tsx`: POS-style form. Customer ComboboxField ("Consumidor final" por default). Tabla editable de items con prefill de price. DiscountPercent input (0-100 con 2 decimales). Subtotal + descuento + total calculados en tiempo real. Botón "Escanear" placeholder. Submit → `useCreateSale.mutate` → toast → redirect a detail.
- [x] `src/routes/_authed/sales/$saleId/index.tsx`: detail con info general (branch, customer, createdBy, fecha, notas), tabla de items con links a item/warehouse, totales (subtotal + descuento + total), status badge, `<Alert>` diferenciado para active/cancelled, botón "Cancelar venta" (Admin/Manager) → `SaleCancelDialog`.
- [x] **Helper `percentColumn`** agregado a `column-defs.tsx` (formato "10%"). 9 helpers en total.
- [x] **Export** con `useExportSales` (5° hook): usa `fetch` directo (no `api.GET`) porque el response no es JSON estándar. `URL.createObjectURL` + `<a download>` para triggear download. `mapApiError` en `onError`.
- [x] **Cancelar venta** con invalidaciones cross-cutting: `saleKeys.lists()` + `saleKeys.detail(id)` + per-item `itemKeys.stock(itemId)` + `stockKeys.byWarehouse(warehouseId, {})` + `stockMovementKeys.lists()` + `stockMovementKeys.lowStock` + `customerKeys.detail` si hay customer. Mismo patrón que `useReceiveProviderOrder` (2.2).
- [x] **RoleGuard**: Admin/Manager para cancelar y exportar; todos para crear; todos lectura. Front oculta botones según rol. Back valida con `roleGuard`.

**Notas de cierre 2.4:**

**Lo que se hizo:**
- **Schemas** con regex `^\d+(\.\d{1,3})?$` para quantity/price decimal string. `discountPercent` validado con refine custom: regex + rango 0-100. `customerId` y `notes` siguen el patrón `optional().or(literal('').transform(() => undefined))` (consistente con customers 1.9 y providers 2.1).
- **5 hooks** en `use-sales.ts`:
  - `useSales(query, options?)` con scope-by-branch + `includeCancelled` (nullable). `as never` cast (mismo patrón que 1.8/1.9/2.2/2.3).
  - `useSale(id)` con `enabled: id.length > 0`.
  - `useCreateSale({ body, branchId })` con `cleanItems` que filtra `unitId` undefined. Body incluye `customerId`, `discountPercent`, `notes` solo si están definidos. Invalidaciones cross-cutting masivas: `saleKeys.lists()`, per-item `itemKeys.stock + stockKeys.byWarehouse`, `stockMovementKeys.lists() + lowStock`, `customerKeys.detail` si hay customer.
  - `useCancelSale({ id, body })` con `cancellationReason` validado por Zod. Devuelve `data.data.sale` (estructura del back: `{sale, alreadyCancelled}`). Mismas invalidaciones que create.
  - `useExportSales({ format, branchId, from, to })` que devuelve `void`: usa `fetch` directo (no `api.GET`) porque la response no es JSON estándar. `URL.createObjectURL` + `<a download>` para triggear download. `onError` propaga via `mapApiError` después de parsear el body como JSON.
- **`<SaleStatusBadge>`** con 2 variants (active=default, cancelled=destructive).
- **`<SaleItemsTable>`**: la pieza más compleja del sprint. Usa `useFieldArray` para add/remove de filas; `Controller` para los 3 ComboboxField (item, unit, warehouse). Subtotal y total derivados con `useWatch` (sin useEffect — AGENTS §2.1.2). Footer con Subtotal/Descuento/Total.
- **`<SaleItemsTable>` prefill**: sub-componente `ItemCombobox` recibe `itemsData` (catálogo) y prellena `price` con `item.salePrice` cuando el user selecciona un item. `useRef` guard evita re-prefill si el mismo item se mantiene seleccionado entre renders. `useEffect` justificado por external sync entre query data y RHF state.
- **`<SaleCancelDialog>`** con Textarea validado por Zod (3-500 chars, required). Reset al abrir. `mapApiError` propaga el mensaje del back (ej. "Venta ya cancelada" si idempotente).
- **`<SaleExportMenu>`** con `<DropdownMenu>` (2 items: CSV, JSON). Filename: `ventas-YYYY-MM-DD.csv|json`. Pasa `branchId` si Admin tiene branch activa.
- **Lista de sales** con `<DataTable>` + filtro `includeCancelled` (ComboboxField "Solo activas" / "Todas"). Columna Cliente muestra "Consumidor final" si `customerId` es null. Helper nuevo `percentColumn` para formatear el descuento como "10%".
- **POS-style form** (new.tsx): customer opcional, tabla editable, discountPercent (0-100), notes opcionales, footer con subtotal/descuento/total, `<Alert>` informativo, botón "Escanear" placeholder.
- **Detail de sale** con 3 secciones: info general (branch, customer o "Consumidor final", createdBy, fecha, notas), totales (subtotal + descuento + total), tabla de items con links. `<Alert>` diferenciado según status: "Activa" verde o "Cancelada" destructive con motivo y fecha de baja.

**Decisiones de implementación:**
- **`branchId` en el body es OPCIONAL** (a diferencia de adjustment/transfer 2.3 que lo exigen). El back fuerza branch del user para Manager/Employee, Admin puede omitirlo y se le asigna el del store. La page infiere `branchId = adminBranchId ?? me.branchId ?? ''` y lo pasa al hook.
- **No se crea `edit.tsx` de sale**. El back no expone PUT/PATCH. Las ventas son inmutables excepto por cancelación.
- **No hay `<RoleGuard>`** en la ruta. Mismo patrón que todo el proyecto: front oculta botones según rol, back valida con `roleGuard`.
- **No se linkea el `customerName` de las cancelaciones** ni se permite ver el `cancellationReason` desde otra página. Solo visible en el detail de la venta.
- **El price prefill se hace en el form, no en el back.** El back NO tiene un endpoint para "obtener el price sugerido de un item en contexto de venta". El front lo hace vía `useItems({ isActive: true, limit: 100 })` y lookup local.
- **`useExportSales` usa `fetch` directo (no `api.GET`)** porque el OpenAPI tipa la response con `content?: never` (no es JSON estándar, es un file). No se puede usar `paths['/api/v1/sales/export']` sin que openapi-fetch se queje. Helper en `src/api/client.ts`: `export const BASE_URL`.
- **El `useEffect` con prefill de price** es exactamente el caso "external sync" que AGENTS §2.1.2 acepta: sincroniza TanStack Query data con RHF state. El `useRef` guard evita loops. Sin él, el price se sobreescribiría en cada render.
- **El helper `ItemCombobox` está dentro de `SaleItemsTable`** (mismo archivo, no componente separado). Razón: solo se usa acá, es muy específico al flow de sales. Si en el futuro provider-orders también prellena price, se puede extraer.

**Discrepancias con el plan original del TODO:**
- "tabla con `createdAt`, `branch`, `customer`, `total`, `discountPercent`, `status`, acciones" → se respetó. Agregué `itemCount` (es útil para análisis rápido).
- "POS-style form con Selector de customer + items editables + discount + total" → se respetó. Agregué notas opcionales y un `<Alert>` informativo.
- "Cancelar venta: `<Dialog>` con input `cancellationReason` (requerido)" → se respetó. Textarea en vez de Input (más espacio para 3-500 chars).
- "Export CSV/JSON" → respetado. DropdownMenu con 2 items (decidido en planning). Filename: `ventas-YYYY-MM-DD.{csv,json}`.
- "RoleGuard: Admin/Manager/Employee para POST. Admin/Manager para DELETE (cancel). Admin/Manager para export. Todos lectura." → respetado (front oculta botones según rol, sin `<RoleGuard>`).

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅ (chunks: `sales` lista 17 KB gz 6 KB; `_saleId` detail; `new`; bundle del shell: ~455 KB gz ~137 KB — solo +1 KB gz sobre 2.3)
- `pnpm run lint` ✅ (1 info preexistente de Biome 2.5)
- `pnpm run routes:gen` ✅ (3 rutas nuevas: `/sales`, `/sales/new`, `/sales/$saleId`)
- E2E smoke: dev server responde 200 en las 3 rutas

**Verificación manual pendiente (checklist para el browser):**
- [ ] Login Admin → `/sales` → ver tabla (probablemente vacía al inicio).
- [ ] "Nueva venta" → seleccionar 1-2 items con qty, price (prefill), warehouse por item, customer opcional → submit → toast → detail.
- [ ] Detail → info, items, totales, status "Activa". Botón "Cancelar" visible.
- [ ] "Cancelar" → modal pide motivo (3-500) → submit → status "Cancelada" + motivo visible en `<Alert>` destructive.
- [ ] **Invalidaciones post-cancelación**: ir a `/items/$id` → stock volvió al valor pre-venta. Ir a `/stock-movements` → nuevo row con `referenceType='sale'`.
- [ ] Login Employee → ve la lista, ve "Nueva venta", NO ve "Cancelar" ni "Exportar".
- [ ] Login Manager → ve los 3 botones.
- [ ] "Exportar" → "CSV" → file `ventas-YYYY-MM-DD.csv` se descarga. Repetir JSON.
- [ ] Filtro "Todas" → aparecen las canceladas con badge "Cancelada".
- [ ] **Errores**: qty `1000` y stock `2` → 400 con mensaje del back. Item vacío → 400. Motivo vacío → 400. Discount `150` → 400.
- [ ] Scanner: click "Escanear" → toast "Scanner no disponible en MVP".

**Patrones nuevos para reusar en próximos sprints:**
- **`useEffect` con `useRef` guard para prefill de form fields desde query data** (`SaleItemsTable`): evita loops de re-render, permite sync one-shot entre TanStack Query y RHF. Aplicable a cualquier form donde un campo dependa de otro (ej. seleccionar un item → prellenar precio, código, descripción).
- **`useExportSales` con `fetch` directo + `URL.createObjectURL`**: el patrón para endpoints que devuelven files (no JSON). Reusable en `useExportCustomers`, `useExportItems`, `useExportStockMovements` cuando se agreguen.
- **`percentColumn`** helper: formatea `string | number` como "10%". Reusable en cualquier vista que muestre porcentajes (discountPercent, tax, etc).
- **`fetch` directo para escapar el tipado de `paths`**: cuando el OpenAPI declara `content?: never` (file downloads), no se puede usar `api.GET`. Patrón: helper `BASE_URL` + `fetch` + `URL.createObjectURL`. El error handling parsea el body como JSON para mantener consistencia con `mapApiError`.

### 2.5 Stock crítico — HU-017 (front) ✅ cerrada
- [x] `src/lib/schemas/recommendation.ts` con `listRecommendationsQuerySchema` (page, type, status, itemId, branchId, openId) + tipos
- [x] `src/lib/query-keys.ts`: `recommendationKeys` factory (lists/list/details/detail) + `notificationKeys` factory (all/unread)
- [x] `src/api/queries/use-recommendations.ts`: 3 hooks (`useRecommendations`, `useRecommendation`, `useUpdateRecommendationStatus`) tipados con `paths`
- [x] `src/api/queries/use-notifications.ts`: 3 hooks (`useNotifications` con polling 60s, `useMarkRecommendationRead`, `useMarkAllRecommendationsRead`) tipados con `paths`
- [x] `src/components/recommendations/recommendation-type-badge.tsx`: 5 variants (restock=default, pricing=secondary, retention=destructive, trend/seasonal=outline) con iconos
- [x] `src/components/recommendations/recommendation-priority-badge.tsx`: 3 variants (high=destructive, medium=default, low=secondary)
- [x] `src/components/recommendations/recommendation-status-badge.tsx`: 3 variants (pending=secondary, applied=default, dismissed=outline)
- [x] `src/components/recommendations/recommendation-detail-dialog.tsx`: Dialog con descripción completa, item/customer/branch links, fechas (generatedAt, expiresAt, readAt), botones de acción contextuales (solo si `status === 'pending' && canWrite`)
- [x] `src/components/notifications/notifications-bell.tsx`: BellIcon en topbar con badge de count + Popover con secciones "Recomendaciones" (top 5) y "Stock bajo" (top 5) + "Marcar todas leídas" + link "Ver todas las recomendaciones"
- [x] `src/components/ui/popover.tsx`: primitive nuevo (vía `pnpm dlx shadcn@latest add popover`)
- [x] `src/routes/_authed/recommendations/index.tsx`: DataTable con `type (badge), priority (badge), description (truncada), item (link), customer (link solo si retention), branchName, status (badge), generatedAt`. Filtros: `type` (5 + "Todos") + `status` (4 valores: Pendientes/Todas/Aplicadas/Descartadas). Default `status=pending`. Acciones: "Ver detalle" → abre Dialog. Soporta deep-link `?openId=...` desde la campana.
- [x] `src/components/layout/topbar.tsx`: `<NotificationsBell>` integrado al lado del user dropdown
- [x] Polling: `useNotifications` con `refetchInterval: 60_000` (1 min). Patrón estándar de notificaciones en SPA (AGENTS §17).
- [x] Deep-link campana → detail: `notifications-bell` click en una rec → `useMarkRecommendationRead.mutate({id})` + navegar a `/recommendations?status=pending&openId=...`. La lista detecta `openId` y abre el Dialog.
- [x] RoleGuard: Admin/Manager para PATCH (cambiar status), todos lectura. Front oculta botones según rol.

**Notas de cierre 2.5:**

**Lo que se hizo:**
- **Schemas** con `listRecommendationsQuerySchema` que incluye `openId: z.string().uuid().optional()` para el deep-link. `status` default es `'pending'` (no `null` como en otros list schemas).
- **3 hooks** en `use-recommendations.ts`:
  - `useRecommendations(query, options?)` con scope-by-branch (Admin: `currentBranchId()`; Manager/Employee: el back filtra). Filtros: `type` (5 values nullable), `status` (3 values nullable), `itemId`, `branchId`. `as never` cast (mismo patrón que 1.8/1.9/2.2/2.3/2.4).
  - `useRecommendation(id)` con `enabled: id.length > 0`.
  - `useUpdateRecommendationStatus({ id, status })` con tipo discriminado: el body es `Exclude<RecommendationStatus, 'pending'>` (solo permite `applied` o `dismissed`). Invalidaciones cross-cutting: `recommendationKeys.lists()` + `recommendationKeys.detail(id)` + `notificationKeys.unread({})`.
- **3 hooks** en `use-notifications.ts`:
  - `useNotifications(query)` con `refetchInterval: 60_000` (polling 1 min) y `staleTime: 30_000`. Devuelve `{recommendations[], lowStock[], unreadCount}`.
  - `useMarkRecommendationRead({ id })` que invalida `notificationKeys.unread({})` y `recommendationKeys.lists()`.
  - `useMarkAllRecommendationsRead({ branchId? })` resetea las queries de notifications y recommendations.
- **3 badges** de recommendations: type (5 variants con iconos de phosphor), priority (3 variants), status (3 variants).
- **`<RecommendationDetailDialog>`** que muestra la info completa del `useRecommendation(id)` con los 3 badges (type, priority, status), descripción, branch, item (link si existe), customer (link si existe), y las 3 fechas. Botones contextuales: si `status === 'pending' && canWrite`, muestra "Marcar aplicada" + "Descartar". Si no, solo "Cerrar".
- **`<NotificationsBell>`** con BellIcon + badge rojo con count (99+ si excede). Popover con header "Notificaciones" + "Marcar todas leídas" (visible solo si `unreadCount > 0`), sección "Recomendaciones" (top 5) y "Stock bajo" (top 5) con links a detail/low-stock, footer con "Ver todas las recomendaciones" → `/recommendations`. Click en recommendation: marca como leída + navega a `/recommendations?status=pending&openId=...`. Click en lowStock item: navega a `/stock-movements/low-stock`.
- **Lista de recommendations** con `<DataTable>` + filtros (type + status) + soporte de `openId` en search schema para auto-abrir el detail dialog. Status filter con 4 valores: "Pendientes" (default, value='pending') / "Todas" (value=null) / "Aplicadas" / "Descartadas".
- **`<Popover>` primitive** agregado vía shadcn CLI. El CLI lo creó en una ruta incorrecta (`@/components/ui/popover.tsx` en la raíz del proyecto); lo moví manualmente a `src/components/ui/popover.tsx` y limpié la carpeta vacía.

**Decisiones de implementación:**
- **No hay detail page de recommendation, solo Dialog desde la lista.** Las recommendations son short-lived (meses), no tiene sentido tener URLs shareables. Decisión confirmada en planning.
- **No hay badge en el sidebar.** La campana en el topbar es el único punto de entrada a las notifications. Decisión confirmada en planning. Matchea el patrón de Slack/GitHub/Linear.
- **Las acciones están en el Dialog, no inline en la fila.** En tablas largas, los inline buttons hacen ruido visual. Decisión confirmada en planning.
- **Optimistic update del `unreadCount`**: implementación con `onMutate` + `onError` rollback en `useMarkRecommendationRead`. Patrón estándar de TanStack Query. (El sprint 2.4 no usó optimistic updates en sales, pero acá tiene sentido porque el click es instantáneo y la latencia del back es perceptible).
- **El openId en la URL** se usa para deep-link desde la campana. Si el user abre `/recommendations?openId=xyz` directamente, el detail se abre solo. La query string se limpia al cerrar el dialog (`onOpenChange(false)` quita `openId`).
- **El polling de notifications** consume 1 query permanente mientras la pestaña está visible. `refetchInterval: 60_000` (1 min). El TODO 3.5 lo iba a hacer con polling explícito; lo trajimos a 2.5 porque las notifications son parte del sprint 2.5 (campana + lista).
- **El detail dialog puede mostrar recomendaciones con `status !== 'pending'`** (sin botones de acción). Útil para revisar el histórico desde la lista.
- **`useCallback` para `handleViewDetail` y `handlePageChange`**: biome exige deps exhaustivas en el `useMemo` de las columns. `useCallback` mantiene la referencia estable entre renders.
- **El `useEffect` con `openId` y `setOpenId` en la lista** es external sync (search params → state local). AGENTS §2.1.2 lo justifica. Sin él, el deep-link no abriría el Dialog.

**Discrepancias con el plan original del TODO:**
- "Badge en sidebar con count" → **NO se implementó como badge en el sidebar**. Se implementó como campana en el topbar (decisión del user, más visible y estándar). El TODO lo mencionaba como "HU-035 partial" — el TODO 3.5 también lo menciona. Decisión: implementar la campana completa en 2.5 cubre ambos.
- "Acciones inline en la fila" → **NO**. Acciones en el Dialog. Decisión del user.
- "Toggle 'Ver histórico'" → **NO como toggle**, sino como filtro `status` con 4 valores. Más granular (ver solo aplicadas o solo descartadas).
- "Detail page de recommendation" → **NO se creó ruta aparte**. Dialog desde la lista. Decisión del user.
- "RoleGuard: Admin/Manager para PATCH" → respetado (front oculta botones según rol).

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅ (bundle del shell: ~456 KB gz ~137 KB, +1 KB gz sobre 2.4)
- `pnpm run lint` ✅ (1 info preexistente de Biome 2.5; 1 `useCallback` agregado para deps exhaustivas; 7 files formateados por Biome)
- `pnpm run routes:gen` ✅ (1 ruta actualizada: `/recommendations` reemplaza el placeholder)
- E2E smoke: dev server responde 200 en `/recommendations` y `/recommendations?status=pending` y `/recommendations?openId=...`

**Verificación manual pendiente (checklist para el browser):**
- [ ] Login Admin → ver campana en topbar (al lado del user dropdown). Si hay recommendations pending → badge con count.
- [ ] Click en campana → Popover abierto con 2 secciones: "Recomendaciones" (top 5) y "Stock bajo" (top 5) + footer con "Ver todas las recomendaciones".
- [ ] Click en una recommendation en la campana → marca como leída (optimistic, count baja) + navega a `/recommendations?status=pending&openId=...` + Dialog del detail abierto.
- [ ] En el Dialog con status `pending` (Admin/Manager): "Marcar aplicada" → status cambia → Dialog se cierra → la fila en la lista se actualiza a "Aplicada".
- [ ] En el Dialog con status `pending`: "Descartar" → status cambia a "Descartada" → Dialog se cierra.
- [ ] Login → `/recommendations?status=pending` → solo pending. Cambiar a "Todas" → todas. Cambiar a "Aplicadas" → solo aplicadas. Cambiar a "Descartadas" → solo descartadas.
- [ ] Filtro por type: "Restock" → solo recomendaciones de restock. "Retención" → solo retention.
- [ ] Login Employee → ve la lista, ve el detail Dialog (puede leer), pero NO ve los botones "Marcar aplicada" / "Descartar".
- [ ] Login Manager → ve los botones.
- [ ] En la campana: click "Marcar todas leídas" → el count baja a 0, las recommendations se vacían del Popover (optimistic).
- [ ] En la campana: click en un item de "Stock bajo" → navega a `/stock-movements/low-stock`. El Popover se cierra.
- [ ] Deep-link: abrir `/recommendations?openId=xyz` directamente → Dialog se abre automáticamente con la recommendation correspondiente.
- [ ] **Errores**: PATCH con status inválido → 400 con mensaje del back. Si el back está caído, el bell muestra error en el `error` state del query.
- [ ] Polling: dejar la pestaña abierta 1+ min → la campana se actualiza automáticamente (sin refresh manual).

**Patrones nuevos para reusar en próximos sprints:**
- **`<Popover>` primitive** (sprint 2.5): disponible en `src/components/ui/popover.tsx`. Reusable en cualquier menu contextual (no solo notifications). El CLI lo agregó en una ruta incorrecta; patrón a tener en cuenta para futuros sprints con shadcn add.
- **Campana de notificaciones con badge de count + Popover**: patrón estándar de notificaciones in-app. Reusable para otros tipos de notifications (ej. "stock bajo" en una org nueva). El polling con `refetchInterval: 60_000` es el patrón.
- **Deep-link con `openId` en search params**: la lista detecta el `openId` y abre el detail Dialog automáticamente. Patrón para URLs shareables de detail sin necesidad de tener una ruta aparte.
- **Optimistic update del `unreadCount`** en `useMarkRecommendationRead`: `onMutate` snapshot + `onError` rollback. Patrón para cualquier "marcar como leído".
- **Botones contextuales en Dialog según status**: en el detail dialog, los botones se muestran condicionalmente según `status === 'pending' && canWrite`. Patrón para cualquier Dialog con acciones stateful.

---

## FASE 3 — Inteligencia analítica (UI)

> El diferenciador del TFG. Requiere Fase 2 completa con datos reales.

### 3.1 Dashboard — HU-027, HU-028
- [x] `src/api/queries/use-dashboard.ts`: `useSalesSummary({ from, to })`, `useProductRotation({ from, to, categoryId, branchId, includeZeroSales })`, `useInactiveCustomers({ branchId })`
- [x] `src/routes/_authed/dashboard.tsx`: layout con cards:
  - **Card "Hoy"**: total ventas hoy + count transacciones + delta vs ayer (semáforo)
  - **Card "Esta semana"**: total ventas 7d + delta vs semana anterior
  - **Card "Rotación de productos"**: top 5 items con cantidad vendida (gráfico de barras simple, Recharts si se justifica)
  - **Card "Clientes inactivos"**: count + top 5 (link a lista completa)
  - Filtros globales: date range (presets: hoy, 7d, 30d, custom)
- [ ] `<DateRangePicker>` component reusable (Fase 3.1+) — **diferido al sprint 3.2** (sprint 3.1 implementa la rotación sin filtro de fecha en el front; el back devuelve 30 días por default)
- [x] Empty state si no hay ventas en el período: "Aún no hay ventas registradas"
- [x] RoleGuard: autenticados

**Notas de cierre 3.1:**

**Lo que se hizo:**
- **3 hooks** en `src/api/queries/use-dashboard.ts`:
  - `useSalesSummary({ branchId, from, to })` con `enabled: role !== 'Admin' || !!currentBranchId`. Devuelve `SalesSummary` (today + thisWeek + previousWeek + comparison deltas). Scope-by-branch.
  - `useProductRotation(query, options?)` con `page`, `limit`, `from`, `to`, `categoryId`, `includeZeroSales`, `branchId`. Paginación server-side. Scope-by-branch.
  - `useInactiveCustomers({ branchId, limit })` con array directo + `meta: { total, limit }`. Sin paginación. Scope-by-branch.
- **Query keys** (`src/lib/query-keys.ts`): `dashboardKeys = { all, salesSummary, productRotation, inactiveCustomers }`.
- **4 componentes nuevos** en `src/components/dashboard/`:
  - `sales-summary-card.tsx` — `<Card>` con título, currency grande, count de transacciones, ticket promedio, y un `<Badge>` con delta % coloreado (verde `+12%` / rojo `-3%` / gris `0%`).
  - `sales-summary-grid.tsx` — 3 columnas (Hoy / Esta semana / Semana anterior) con `enabled` por branch.
  - `product-rotation-table.tsx` — `<DataTable>` con `itemName` (link), `categoryName`, `totalQuantitySold` (numberColumn), `totalRevenue` (currencyColumn), `transactionCount` (numberColumn), `lastSoldAt` (dateColumn). Filtros: `categoryId` (ComboboxField desde `useItemCategories`), `includeZeroSales` (ComboboxField de 3 valores). Filtros controlados por la page.
  - `inactive-customers-card.tsx` — `<Card>` con `<EmptyState>` si no hay, o lista de top 5 con link a `/customers/$customerId` y "Ver todos" → `/recommendations?type=retention&status=pending`. Días sin comprar > 90 se muestran en rojo.
- **`src/routes/_authed/dashboard.tsx`** — implementación completa. `validateSearch` con `page`, `categoryId`, `includeZeroSales`. La page pasa los handlers de cambio a `<ProductRotationTable>` que actualiza los search params del router. Sections: 1) Resumen de ventas (3 cards), 2) Clientes inactivos (card), 3) Rotación de productos (tabla con filtros).

**Decisiones de implementación:**
- **Sin `<DateRangePicker>` en este sprint**: el back devuelve los últimos 30 días por default para `product-rotation`. La rotación funciona sin filtro de fecha explícito en esta primera versión; el `DateRangePicker` se construirá en el sprint 3.2 (Reports) y se agregará acá como refactor si se justifica. El TODO original lo listaba acá pero no bloquea HU-027/028.
- **`<SalesSummaryCard>` con delta solo en la card "Esta semana"**: el back devuelve un solo set de deltas (comparison totalSalesDelta/transactionCountDelta/averageTicketDelta) que compara esta semana vs la anterior. La card de hoy no tiene delta (no hay "ayer" en el response). La card de semana anterior no tiene delta (es el baseline). Se documentó en el código.
- **Sin Recharts en este sprint**: el TODO original mencionaba "gráfico de barras si se justifica". La lista de product-rotation ya es una `<DataTable>` con ordenamiento visual (los top items aparecen arriba con paginación). No agregamos un BarChart encima porque la tabla ya es informativa y es < 200 líneas de código. Recharts entra en 3.2 (Reports).
- **`includeZeroSales` con 3 valores en el ComboboxField**: 'Con y sin ventas' (null) / 'Solo con ventas' (false) / 'Incluir sin ventas' (true). El back acepta el boolean opcional; el search param es `boolean | null` y se pasa al hook.
- **`as never` en `useProductRotation`**: el OpenAPI genera `from?: string | null` y `to?: string | null` (acepta null en query) y `includeZeroSales?: boolean | null`. El query schema local también acepta null. El cast es para bypasear el type check demasiado estricto de openapi-typescript cuando el query object se pasa a `api.GET`. **Patrón consistente** con sprints 1.8/1.9/2.2/2.3.
- **`useInactiveCustomers` con `limit: 5` hardcoded en el dashboard**: el endpoint NO pagina (array directo), sólo tiene `meta: { total, limit }`. El dashboard pide top 5 para la card. El sprint 3.3 (Customer Analytics) expondrá una vista completa con `limit: 20/50/100`.
- **Sin `useEffect` en componentes nuevos**: `inactiveList` se deriva con `useMemo` (computed en render). La card de inactivos renderiza `<Skeleton>` mientras `inactive === undefined` (external sync entre query y render, AGENTS §2.1.2).
- **`<EmptyState>` del proyecto no acepta `icon` prop**: removí el icono en el empty state de inactivos. Solo texto. Documentado en el comment.

**Discrepancias con el plan original del TODO:**
- "Card 'Hoy' con delta vs ayer" → **no implementado**. El back sólo devuelve delta de thisWeek vs previousWeek. La card "Hoy" muestra sólo el total del día sin comparación. Si en el futuro se quiere un delta diario, pedir al back un campo `yesterday` en el response.
- "date range (presets: hoy, 7d, 30d, custom)" → **diferido**. El `<DateRangePicker>` se construye en 3.2 y se reusa acá como refactor.
- "Filtros globales" → los filtros son **por sección** (la rotación tiene los suyos, el sales-summary no tiene), no globales. Decisión: scope-by-section es más simple y el sales-summary no acepta filtros en el back de todas formas.
- "Recharts para rotación" → no usado. Tabla suficiente.
- "RoleGuard: autenticados" → no se usa `<RoleGuard>`. El `_authed/route.tsx` ya valida la sesión en `beforeLoad`. El back filtra por org/branch con `roleGuard`.

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅ (chunk `dashboard-D36F2QKz.js`: 19.78 KB gz 6.56 KB; shell: 456.23 KB gz 137.13 KB)
- `pnpm run lint` ✅ (1 info preexistente de Biome 2.5; 5 archivos auto-formateados por Biome en este sprint)
- `pnpm run routes:gen` ✅ (ruta ya estaba registrada, regenera idempotente)
- E2E con back: sign-up → onboarding → GET `/api/v1/dashboard/sales-summary` → 200 con 0 ventas, todos los totales en `"0"`, delta `0`. GET `/api/v1/dashboard/product-rotation?limit=5` → 200 con `{ data: [], meta: { page: 1, limit: 5, total: 0, totalPages: 0 } }`. GET `/api/v1/dashboard/inactive-customers?limit=5` → 200 con `{ data: [], meta: { total: 0, limit: 5 } }`. Front sirve HTTP 200 en `/dashboard`.
- Front renderiza correctamente: 3 cards con `formatCurrency('0')` = `$ 0,00` (no falla con string `"0"`), card de inactivos con empty state, tabla de rotación con empty state. **No warnings** en la consola del browser al cargar.

**Patrones nuevos para reusar en próximos sprints:**
- **`<SalesSummaryCard>`** — card con currency grande + meta line + delta badge. Reusable en otros dashboards (ej. overview de organización, vista de branch individual).
- **`<InactiveCustomersCard>` con top-N + link a vista completa** — patrón reusable para "Top + Ver todos" (stock bajo, items más vendidos, etc).
- **`<DataTable>` con filtros `ComboboxField` controlados por la page** — patrón consistente con el resto del proyecto. Los filtros viven en la page, no en la tabla. La tabla es presentacional.
- **Cards con `<EmptyState>` adentro** — patrón para secciones que pueden estar vacías sin ser errores (vs `<ErrorState>` que sí lo es).

### 3.2 Reports — HU-029
- [x] `src/api/queries/use-reports.ts`: `useSalesTrend({ interval, from, to })`, `useRevenueTimeline({ ... })`, `useTopItems({ sortBy, from, to, branchId, limit })`, `useCategoryDistribution({ from, to, branchId })`
- [x] `src/routes/_authed/reports/index.tsx`: layout con 4 sections apiladas (NO tabs):
  - **Tendencia de ventas**: line chart (Recharts) con buckets según `interval` (day/week/month) + 2 YAxis (currency izq + count der)
  - **Revenue timeline**: line chart sin transaction count
  - **Top items**: bar chart horizontal + tabla con `item`, `category`, `quantity`, `revenue`, `transactions`, `last sold`. Sort toggle `quantity|revenue`
  - **Distribución por categoría**: pie chart + tabla con `category`, `revenue`, `transactions`, `items`. Items sin categoría agrupados bajo "Sin categoría"
- [x] Filtros: date range por section (default 30d), branch (admin), interval (sales-trend/revenue-timeline), sortBy (top-items)
- [x] Cap de buckets respetado del back (mostrar mensaje claro si excede) — via `mapApiError` con `<Alert variant="destructive">` por chart
- [x] RoleGuard: autenticados (no se usa `<RoleGuard>`, back filtra por branchId via scope-by-branch)

**Notas de cierre 3.2:**

**Lo que se hizo:**
- **2 primitives nuevos** instalados vía `pnpm dlx shadcn@latest add chart calendar` (deps: `recharts@3.8.0`, `react-day-picker@10.0.1`, `date-fns@4.4.0`).
- **4 hooks** en `src/api/queries/use-reports.ts`:
  - `useSalesTrend({ from, to, interval, branchId })` con `enabled: role !== 'Admin' || !!currentBranchId`. **`interval` es required** (no se puede omitir). Scope-by-branch.
  - `useRevenueTimeline({ from, to, interval, branchId })` — mismo shape.
  - `useTopItems({ from, to, sortBy, limit, branchId })` — sortBy opcional (null = back usa 'revenue').
  - `useCategoryDistribution({ from, to, branchId })` — sin interval.
  - Todos con `as never` en el query (mismo patrón de 1.8/1.9/2.2/2.3/3.1).
- **Query keys** (`src/lib/query-keys.ts`): `reportKeys = { all, salesTrend, revenueTimeline, topItems, categoryDistribution }`.
- **1 schema file** (`src/lib/schemas/report.ts`): 4 schemas separados (cada section tiene su propio grupo de search params independientes, no compartido).
- **1 primitive compuesto**: `<DateRangePicker>` en `src/components/ui/date-range-picker.tsx`. Usa 2 `<Calendar mode="single">` (uno para "Desde", otro para "Hasta") en vez de `mode="range"` por simplicidad de tipos y UX (clear del range trivial). Helpers exportados: `toISODate` y `parseISODate` para convertir entre Date y string ISO (consistente con lo que el back espera en `from`/`to`).
- **6 componentes nuevos** en `src/components/reports/`:
  - `interval-selector.tsx` — `<ComboboxField>` con 3 valores (día/semana/mes). **No permite null** (el back requiere interval).
  - `chart-card.tsx` — wrapper de `<Card>` con título + controles + loading/error/content. `mapApiError(error).message` para mostrar el error 400 del back cuando se excede el cap de buckets.
  - `sales-trend-chart.tsx` — `<LineChart>` con 2 series (totalSales y transactionCount en 2 YAxis distintos). Tooltip custom que formatea totalSales como currency.
  - `revenue-timeline-chart.tsx` — `<LineChart>` simple con solo totalSales. Más chico.
  - `top-items-chart.tsx` — `<BarChart layout="vertical">` con top 10 + tabla HTML simple (no `<DataTable>` porque el back NO pagina — `meta: { from, to, sortBy, limit }` sin `total` ni `totalPages`).
  - `category-distribution-chart.tsx` — `<PieChart>` con `<Cell>` por categoría + tabla HTML.
- **1 página** (`src/routes/_authed/reports/index.tsx`): 4 sections apiladas verticalmente, cada una con su propio `<DateRangePicker>` (y `<IntervalSelector>` o `<ComboboxField>` cuando aplica). `validateSearch` con 4 grupos de search params (st*, rt*, ti*, cd*) — un grupo por section. La URL puede verse así: `?stFrom=...&stTo=...&stInterval=day&rtInterval=week&tiSortBy=quantity&cdFrom=...&cdTo=...`.
- **Refactor menor del dashboard** (`src/routes/_authed/dashboard.tsx`): el `validateSearch` ahora incluye `from` y `to` para la sección "Rotación de productos". Se agregó un `<DateRangePicker>` en el header de esa sección. Pasamos `from` y `to` a `<ProductRotationTable>` que ya tenía esas props. Refactor mínimo (3 líneas de cambio + 1 import).

**Decisiones de implementación:**
- **`<DateRangePicker>` con 2 Calendar separados** en vez de `mode="range"`: el API de `react-day-picker` v9 para range tiene quirks con el `onSelect` que recibe `DateRange | undefined`. Con 2 Calendar independientes, el binding es directo: `onSelect={(d) => onChange({ ...value, from: d })}` y listo. UX equivalente (algunos lo prefieren porque el clear del "Hasta" no resetea el "Desde" accidentalmente).
- **Layout: sections apiladas, no tabs**: cada chart tiene su propio filtro de fecha e interval. Con tabs todos compartirían un filtro, lo que no tiene sentido (top-items no tiene interval). Sections permiten ver los 4 charts de un vistazo y aplicar filtros independientes.
- **`top-items` sin `<DataTable>`**: el back NO pagina este endpoint (devuelve hasta `limit` items, default 20, max 100). `<DataTable>` con `meta: { page, limit, total, totalPages }` no aplica. Tabla HTML simple con `<Table>` primitive.
- **`category-distribution` con 8 colores fijos**: el back devuelve un array variable de categorías (1-8 típico). Usamos `CATEGORY_COLORS` con 8 valores de `var(--chart-1)` a `var(--chart-8)` (tokens que shadcn define en el theme). Si en el futuro hay más de 8, rotamos con `i % CATEGORY_COLORS.length`.
- **`interval` required en el front**: el back devuelve ZodError si no se manda. El selector siempre emite un valor (default 'day'). Esto fue verificado con curl (ver "Bugs encontrados").
- **`<ChartCard>` con `<Alert variant="destructive">` para errores**: cuando el back devuelve 400 con "rango excede máximo de buckets" o cualquier otro error, el chart muestra el mensaje del back via `mapApiError(error).message` (Fix 2 del sprint 1.9 ya lo cubre). El resto de los charts siguen funcionando.
- **3 ignores de Biome en `src/components/ui/chart.tsx`**: el primitive de shadcn usa `dangerouslySetInnerHTML` (para inyectar CSS vars por chart-id) y `key={index}` en el tooltip/legend (arrays de payload estables). Son código de shadcn oficial; el patrón es estándar. Documentados inline con `// biome-ignore`. **Deuda técnica menor** — si shadcn los actualiza, los removemos.

**Discrepancias con el plan original del TODO:**
- "Layout con tabs" → **sections apiladas** (cada chart tiene filtros independientes; tabs implicarían un solo filtro compartido, lo cual no aplica).
- "Tabla con `% of total`" → **no implementado**. El back no devuelve el total general. Calcularlo client-side requiere sumar todos los `totalRevenue` del array. YAGNI para MVP.
- "Cap de buckets respetado del back (mostrar mensaje claro si excede)" → **mostrado via `<Alert variant="destructive">`** dentro del chart-card. El mensaje del back es claro: "El rango excede el máximo de 366 buckets para interval=day (aprox 906 buckets)". No agregamos un cap client-side (el back es la fuente de verdad).
- "Branch (admin)" → **scope-by-branch automático via `useCurrentBranchId()`** (AGENTS §13.1). El user no selecciona branch explícitamente; el store global determina la branch activa.
- "Sort toggle `quantity|revenue`" → **ComboboxField con 2 valores** (no toggle binario). Más consistente con el resto de los filtros.

**Verificación:**
- `pnpm run type-check` ✅
- `pnpm run build` ✅ (chunk `reports`: 402.61 KB gz 117.62 KB; chunk `date-range-picker`: 78.23 KB gz 23.46 KB; chunk `dashboard`: 20.57 KB gz 6.89 KB; shell: 457.24 KB gz 137.43 KB)
- `pnpm run lint` ✅ (3 ignores de Biome en `src/components/ui/chart.tsx` documentados inline, 1 info preexistente)
- `pnpm run routes:gen` ✅
- E2E con back: `GET /sales-trend?interval=day` → 200 con `data: []`, `meta: { total: 0 }`. `GET /sales-trend?interval=week` → 200. `GET /revenue-timeline?interval=day` → 200. `GET /top-items?sortBy=quantity&limit=5` → 200 con meta correcto. `GET /category-distribution` → 200. **Sin `interval` → 400 ZodError** (corregido en el front, interval siempre se manda). Front sirve HTTP 200 en `/reports` y `/dashboard`.
- Dev server arranca, `/`, `/dashboard` y `/reports` responden 200.

**Patrones nuevos para reusar en próximos sprints:**
- **`<ChartCard>`** — wrapper de Card con loading/error/content + controls. Reusable en otros lugares que necesiten mostrar un chart con sus filtros.
- **`<DateRangePicker>` con 2 Calendar separados** — pattern reusable para filtros de fecha en cualquier página (sprint 3.4 lo usaría en external-data si tuviera filtros de fecha).
- **Helpers `toISODate` / `parseISODate`** — pattern para convertir entre `Date | undefined` (lo que el componente usa) y `string | null` (lo que el search schema y el back esperan). Exportados de un solo lugar.
- **Layout "sections apiladas independientes"** — para páginas con múltiples visualizaciones que necesitan filtros independientes. Alternativa a tabs cuando cada chart tiene su propio state.

### 3.3 Customer Analytics — HU-025, HU-026
- [ ] `src/api/queries/use-customer-analytics.ts`: `useDetectInactiveCustomers()` (mutation, enqueue), `useCustomerSegments({ branchId })`, `useInactiveCustomersList({ branchId })`
- [ ] Botón "Detectar clientes inactivos" en `/customers` (Admin/Manager): dispara `useDetectInactiveCustomers.mutate({ days: 60 })` → toast con `jobId` + nota "El proceso corre en background, las recomendaciones aparecerán en breve"
- [ ] `src/routes/_authed/customers/segments.tsx`: lista de customers agrupados por segment (vip, frequent, occasional, new, inactive, dormant) con count y umbrales visibles
- [ ] Filtros por branch (admin) y por segment
- [ ] RoleGuard: Admin/Manager para disparar el job, todos lectura

### 3.4 External Data — HU-030, HU-031
- [ ] `src/api/queries/use-external-data.ts`: `useExternalDataSources({ isActive, type })`, `useExternalDataSource(id)`, `useCreateSource()`, `useUpdateSource()`, `useDeleteSource()`, `useEnqueueFetch()`
- [ ] `src/routes/_authed/settings/external-data.tsx`: tabla con `name`, `type` (badge), `url`, `isActive`, `lastFetchedAt`, `lastError` (con `<Tooltip>` si existe)
- [ ] `<Dialog>` create/edit: name, type (Select: wholesale_prices/search_trends/seasonality), url, `authConfig` (jsonb editable via JSON textarea), `isActive`
- [ ] Botón "Fetch now" en cada fila (Admin/Manager): dispara `useEnqueueFetch.mutate({ id })` → toast "Job encolado"
- [ ] `authConfig` sanitizado en responses (ver back §4.2): mostrar solo "Tiene headers" / "Tiene queryParams" como boolean badges
- [ ] Cron indicator: "Última ejecución del cron: ..." con timestamp
- [ ] RoleGuard: Admin estricto para create/update/delete, Admin/Manager para enqueue, todos lectura

### 3.5 Notifications — HU-035
- [ ] `src/api/queries/use-notifications.ts`: `useNotifications()`, `useMarkRecommendationRead()`, `useMarkAllRecommendationsRead()`
- [ ] **Campana en topbar** (al lado del user dropdown):
  - Icon `<BellIcon>` + badge con `unreadCount`
  - `<Popover>` con lista: recommendations pending (top 5) + low stock items
  - Click en item → navega a su detail
  - "Marcar todas como leídas" en el header del popover
- [ ] Click en item individual → llama `useMarkRecommendationRead.mutate({ id })` antes de navegar
- [ ] Optimistic update del `unreadCount` (TanStack Query `onMutate` / `onError` rollback)
- [ ] Polling cada 60s mientras la pestaña está visible (`refetchInterval: 60_000`)
- [ ] RoleGuard: todos los autenticados

---

## FASE 4 — Pulido y cierre (UI)

### 4.1 UX y feedback
- [ ] `<Toast>` (sonner) en todos los `onSuccess`/`onError` de mutations (verificar que no falte ninguno)
- [ ] Loading states consistentes: `<Skeleton>` en listas, `disabled` + spinner en botones durante mutations
- [ ] Error boundaries en cada `_authed/*` para errores no anticipados
- [ ] `<EmptyState>` en todas las listas vacías con copy específico del módulo
- [ ] Confirmaciones destructivas: `<Dialog>` con input del nombre para delete (org, branch, user)
- [ ] Optimistic updates en mutations simples (mark-read, change-status)
- [ ] Revisar accesibilidad: focus rings, labels en inputs, aria-* en dialogs/dropdowns

### 4.2 Validaciones de negocio (UI)
- [ ] No permitir submit si `salePrice < purchasePrice` sin mostrar el warning (HU-005, ver back §4.1)
- [ ] Validar `discountPercent` en 0-100% en el form (antes que el back)
- [ ] En sale form, validar `quantity > 0` y `price >= 0` antes de submit
- [ ] En transfer form, no permitir mismo `fromWarehouse === toWarehouse` (UI lo bloquea, no llega al back)
- [ ] Mensajes de error del back propagados a español vía `mapApiError` (revisar mensajes específicos del back)

### 4.3 Performance
- [ ] Code splitting por ruta: ya activo (TanStack Router file-based). Verificar que cada feature chunk < 50KB gz
- [ ] Debounce 300ms en inputs de búsqueda (items, customers, sales, providers)
- [ ] `staleTime` ajustado por dominio: `infinity` para estáticos (units, roles), `60s` para sesiones, `30s` default
- [ ] Bundle total: < 500KB gz para el shell + lazy loading por ruta
- [ ] Verificar con `pnpm run build` que no haya imports no usados (`biome check` los detecta)

### 4.4 Auditoría de reglas React
- [ ] `grep -r "useEffect" src/` → cada uno con justificación documentada en comment
- [ ] `grep -r "useCallback\|useMemo" src/` → cada uno con medición que justifique
- [ ] `grep -r "React.memo" src/` → verificar que cada uno está perfilado
- [ ] `grep -r "as any\|@ts-ignore" src/` → cero ocurrencias
- [ ] Ningún componente de más de 250 líneas (un componente por archivo, AGENTS §2.1.1)
- [ ] Todos los forms usan RHF + Zod (ninguno con `useState` para form state, AGENTS §2.1.4)

### 4.5 Role-based UI
- [ ] Sidebar: ocultar links según rol (Admin ve todo, Manager no ve Settings → Users ni External Data, Employee solo ve Sales + Stock básico)
- [ ] Acciones inline en tablas: ocultar botones de delete/edit según rol (no solo deshabilitar — ocultar)
- [ ] `RoleGuard` en cada ruta con `allow: readonly UserRole[]`
- [ ] Verificar con un user Employee que no pueda acceder a `/settings/users` (redirect a `/dashboard`)

---

## FASE 5 — Deploy

### 5.1 Cloudflare Pages
- [ ] Crear `public/_redirects` con `/*    /index.html   200` (SPA fallback)
- [ ] `public/robots.txt` con `Disallow: /` (backoffice, no indexar)
- [ ] Conectar repo a Cloudflare Pages (UI o `wrangler pages deploy`)
- [ ] Build command: `pnpm run build`
- [ ] Output directory: `dist`
- [ ] Variables de entorno en Pages dashboard: `VITE_API_URL=https://tfg-backend.<sub>.workers.dev`, `VITE_ENV=production`
- [ ] Custom domain (opcional)

### 5.2 CORS del back para Pages
- [ ] Pedir al back: agregar `https://<tu-frontend>.pages.dev` (o custom domain) a `FRONTEND_TRUSTED_ORIGINS` en `tesis-backend/src/shared/auth/index.ts` Y a `ALLOWED_ORIGINS` en `shared/http/middlewares.ts`
- [ ] Verificar que CORS preflight + POST real funcionan desde el origin de Pages

### 5.3 Verificación post-deploy
- [ ] `curl https://<frontend>.pages.dev` → 200
- [ ] Sign-up desde prod → 200
- [ ] Onboarding → 200
- [ ] Login → 200
- [ ] CORS preflight → 204
- [ ] Smoke test: crear item, crear venta, ver dashboard

---

## Decisiones de scope (acordadas)
1. **TypeScript 5.9.3** (no 6.x) por incompatibilidad de `openapi-typescript@7` con TS 6.
2. **ESLint → Biome** (migración completa, ESLint deps y config borradas).
3. **Iconos: phosphor** (mantiene el ya instalado, `components.json` lo define así).
4. **kebab-case SOLO en archivos/carpetas** (cambiado desde snake_case para consistencia con el backend). Todo lo demás en camelCase estándar React. AGENTS §5 actualizado.
5. **React Compiler (babel plugin):** mantenido en `vite.config.ts` como estaba en el template.
6. **Sin Tailwind Forms/Typography plugins** por ahora (YAGNI).
7. **Sin tests automatizados en MVP** (AGENTS §15) — verificación por browser/curl.
8. **`AuthUser` redefinido localmente** con campos en camelCase. En Sprint 0.4 F2 se migró del snake_case original a camelCase para matchear el shape real del back. `roleId: number | null` (no `number`) para tolerar usuarios pre-onboarding.
9. **Segmentos `_authed/provider-orders/` y `_authed/stock-movements/`** renombrados a kebab-case para consistencia con la URL del back. Esta es la única excepción donde un directorio de TanStack Router NO es single-word.
10. **Module augmentation para Better Auth en `use-auth.ts`** (Sprint 0.4): los endpoints `/api/auth/sign-in/email` y `/api/auth/sign-up/email` no están en `paths` (el back no los documenta en OpenAPI, ver `tesis-backend/AGENTS.md` §8.4). En vez de `as any`, usamos `declare module '@/api/types'` con la shape oficial de Better Auth (`{ email, password, name? }`). Cero casts, type-safe.
11. **Bug `Invalid origin` del back resuelto en Sprint 0.4**: Better Auth validaba `Origin` contra `baseURL` por default. El back tenía `http://localhost:5173` en `ALLOWED_ORIGINS` (CORS de Hono) pero NO en `trustedOrigins` de Better Auth — son dos configs distintas. Fix: `trustedOrigins: [...FRONTEND_TRUSTED_ORIGINS, env.BETTER_AUTH_URL]` en `tesis-backend/src/shared/auth/index.ts`.
12. **Branch context con Zustand** (Fase 1.1): el branch context tiene múltiples consumers (topbar + query hooks de items/sales/customers/etc). Context re-renderiza todos los consumers cuando cambia el value. Zustand tiene suscripciones selectivas (`useBranchStore(s => s.currentBranchId)`) que solo re-renderizan si cambia la parte observada. AGENTS §13 ya menciona Zustand como opción válida para estado cross-page con >3 consumers profundamente anidados — el branch context matchea ese caso. Persistido en `localStorage` con `partialize` (solo `currentBranchId`, no la lista de branches que viene del back).
13. **Polling en notifications** (Fase 3.5): `refetchInterval: 60_000`. AGENTS §17 dice "WebSockets no soportado en Workers barato". Polling es la opción correcta para MVP.

---

## Progreso general

| Fase | HU cubiertas (back) | % back con UI | Estado |
|------|---------------------|----------------|--------|
| Fase 0 — Fundación | Setup, auth, infra | 100% | ✅ cerrada (0.1, 0.2, 0.3, 0.4) |
| Fase 1 — Entidades maestras | HU-004, 005, 006, 007, 008, 015, 016, 020, 021, 022 | 7/10 sub-secciones (branch context, items, categories, units, branches, users, org) | ⏳ en progreso |
| Fase 2 — Transacciones core | HU-009, 010, 011, 012, 013, 014, 017, 018, 019, 023, 024 | 4/10 sub-secciones (provider-orders, stock-movements, sales, recommendations) | ⏳ en progreso |
| Fase 3 — Inteligencia analítica | HU-025, 026, 027, 028, 029, 030, 031, 032, 033, 034, 035 | 2/5 sub-secciones (dashboard 3.1, reports 3.2) | ⏳ en progreso |
| Fase 4 — Pulido | Polish + a11y + perf + role security | 0% | ⏳ pendiente |
| Fase 5 — Deploy | Pages + CORS prod | 0% | ⏳ pendiente |

---

## Convenciones de trabajo

> Resumen de AGENTS §2. Si hay duda, abrir el AGENTS y leer la doc oficial.

- **No hacer commit hasta que se pida.** El repo del front es nuevo; commitear cuando haya un batch razonable.
- **Una feature a la vez** (siguiendo el orden de cada sprint).
- **Una HU a la vez** (dentro de cada sprint).
- **Tests manuales con browser** al cerrar cada sub-sección. **NO** tests automatizados en MVP (AGENTS §15).
- **Coordinar cambios de API con el back**: si necesitás un campo nuevo o un endpoint, abrir issue en el repo del back. NO cambiar el contrato unilateralmente.
- **Mantener este TODO.md y AGENTS.md actualizados** al cerrar cada sprint/sección.
- **Type-check pasa antes de cada commit**: `pnpm run type-check`.
- **Build pasa antes de cada deploy**: `pnpm run build`.
- **Regla de oro**: un componente por archivo, kebab-case SOLO en archivos/carpetas, no `useEffect`/`useCallback`/`useMemo` sin razón documentada. Si dudás, leer la doc oficial de React/TanStack/shadcn.
- **`pnpm run routes:gen`** después de cualquier cambio de archivos en `routes/`.
- **`pnpm run api:types`** después de cualquier cambio de contrato de API del back.
- **Commitear solo cuando se pida explícitamente.**
- **Estilo de cierre** (igual que el back): al cerrar cada sprint, escribir notas de cierre con decisiones, bugs encontrados, comandos de verificación, archivos modificados/nuevos. Si un sprint tiene sub-secciones, cada sub-sección tiene su propio bloque de notas.
