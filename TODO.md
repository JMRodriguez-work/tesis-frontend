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

### 1.2 Items — HU-005, HU-006, HU-007, HU-008
- [ ] `src/lib/schemas/item.ts` con `createItemSchema`, `updateItemSchema`, `listItemsQuerySchema` (page, limit, search, categoryId, branchId)
- [ ] `src/api/queries/use-items.ts`: `useItems(query)`, `useItem(id)`, `useLookupItemByBarcode(code)`, `useCreateItem()`, `useUpdateItem()`, `useDeleteItem()`
- [ ] `src/routes/_authed/items/index.tsx`: lista paginada con `<DataTable>` (sortable por `name`, `code`, `salePrice`), search debounced (300ms), filtro por categoría, filtro por branch
- [ ] `src/routes/_authed/items/new.tsx`: form con RHF + Zod, inputs `name`, `code`, `barcode` (con botón "leer código de barras" — placeholder, scanner HW en Sprint 4), `purchasePrice`, `salePrice`, `categoryId` (Select), `baseUnitId` (Select), `branchId`
- [ ] `src/routes/_authed/items/$itemId/index.tsx`: detail con datos + `useItemStock(itemId)` (vista de stock por warehouse) + historial de movimientos
- [ ] `src/routes/_authed/items/$itemId/edit.tsx`: form prellenado con `useItem(id)`, mismo shape que `new`
- [ ] `pricing warning` (HU-005): si `salePrice < purchasePrice`, mostrar warning inline en el form antes de submit, pero permitir submit (no es error duro, ver back §4.1)
- [ ] RoleGuard: Admin/Manager para create/update/delete. Employee solo lectura + `lookupItemByBarcode`

### 1.3 Item Categories
- [ ] `src/lib/schemas/category.ts` con `createCategorySchema`, `updateCategorySchema`
- [ ] `src/api/queries/use-categories.ts`: `useCategories({ branchId })`, `useCreateCategory()`, `useUpdateCategory()`, `useDeleteCategory()`
- [ ] Lista en `/settings` o en un `<Combobox>` reutilizable en el form de items (más probable esto último)
- [ ] CRUD inline en `/settings` o como `<Dialog>` desde la lista de items
- [ ] RoleGuard: Admin/Manager write, todos lectura

### 1.4 Units
- [ ] `src/api/queries/use-units.ts`: `useUnits()` (lista global, solo lectura)
- [ ] Select prellenado en forms de items, sale items, provider order items
- [ ] Cache: `staleTime: Infinity` (no cambian en runtime, se mantienen por seed)

### 1.5 Branches
- [ ] `src/lib/schemas/branch.ts` con `createBranchSchema`, `updateBranchSchema`
- [ ] `src/api/queries/use-branches.ts`: `useBranches({ page, limit, isActive })`, `useBranch(id)`, `useCreateBranch()`, `useUpdateBranch()`, `useDeleteBranch()`
- [ ] `src/routes/_authed/settings/branches.tsx`: tabla con todas las branches de la org (no solo la del user — ver back §1.3), columnas: `name`, `isActive`, acciones
- [ ] `<Dialog>` para create/edit con form
- [ ] Soft-delete: confirmar antes, mostrar 400 si es la última activa (mensaje del back)
- [ ] RoleGuard: Admin write, todos lectura

### 1.6 Users — HU-004 (org profile), users
- [ ] `src/lib/schemas/user.ts` con `createUserSchema`, `updateUserSchema`, `changeRoleSchema`
- [ ] `src/api/queries/use-users.ts`: `useUsers({ page, limit, branchId })`, `useUser(id)`, `useCreateUser()`, `useUpdateUser()`, `useDeleteUser()`, `useChangeUserRole()`
- [ ] `src/routes/_authed/settings/users.tsx`: tabla con `name`, `email`, `role`, `branch`, `isActive`, acciones
- [ ] `<Dialog>` para create (delegado a `signUp` del back, ver back §1.2), edit, change-role, soft-delete
- [ ] `<RoleBadge>` component con colores por rol (Admin/Manager/Employee)
- [ ] `src/routes/_authed/settings/organization.tsx`: form para editar `name` de la org (HU-004), solo Admin
- [ ] RoleGuard: Admin estricto para todo. El user no puede auto-borrarse (el back valida, mostrar mensaje)

### 1.7 Warehouses
- [ ] `src/lib/schemas/warehouse.ts` con `createWarehouseSchema` (incluye `branchIds: string[]` array de branches asignadas)
- [ ] `src/api/queries/use-warehouses.ts`: `useWarehouses({ page, limit })`, `useWarehouse(id)`, `useCreateWarehouse()`, `useUpdateWarehouse()`, `useDeleteWarehouse()`, `useAssignWarehouseToBranch()`, `useUnassignWarehouseFromBranch()`
- [ ] `src/routes/_authed/warehouses/index.tsx`: tabla con `name`, `description`, `branches` (badges), acciones
- [ ] `<Dialog>` create/edit: input para seleccionar branches asignadas (multi-select)
- [ ] Soft-delete: 400 si tiene stock > 0 (mensaje del back)
- [ ] RoleGuard: Admin write, todos lectura

### 1.8 Stock (read-only en Fase 1, write en Fase 2 con sales y provider-orders)
- [ ] `src/api/queries/use-stock.ts`: `useStockByWarehouse(warehouseId)`, `useStockByItem(itemId)`, `useUpdateMinStock()`
- [ ] Vista de stock en detail de item (Fase 1.2): tabla por warehouse con `quantity`, `minStock`, `status` (ok/low/out)
- [ ] Vista de stock en detail de warehouse: tabla de items con mismo shape
- [ ] `PATCH /items/:id/min-stock` desde detail de item: inline editable
- [ ] Filtro `?status=low` en lista (status calculado en back, ver §1.8 back)

### 1.9 Customers — HU-020, HU-021, HU-022
- [ ] `src/lib/schemas/customer.ts` con `createCustomerSchema`, `updateCustomerSchema`
- [ ] `src/api/queries/use-customers.ts`: `useCustomers({ page, limit, branchId, isActive, search })`, `useCustomer(id)`, `useCreateCustomer()`, `useUpdateCustomer()`, `useDeleteCustomer()`
- [ ] `src/routes/_authed/customers/index.tsx`: tabla con `fullname`, `email`, `phone`, `branch` (badge), `isActive`, acciones
- [ ] `<Dialog>` create/edit con form
- [ ] `src/routes/_authed/customers/$customerId/index.tsx`: detail con `useCustomer(id)` + `useCustomerSales(id)` (HU-022: última compra + clasificación — viene de Fase 3, mostrar placeholder)
- [ ] RoleGuard: Admin/Manager write, todos lectura

### 1.10 DataTable genérico (reusable)
- [ ] `src/components/data-table/data-table.tsx` con `useReactTable` + TanStack Table v8
- [ ] Soporta: `data: T[]`, `columns: ColumnDef<T>[]`, `meta: { page, limit, total, totalPages }`, `onPageChange`, `onSortChange`, `onSearchChange` (server-side)
- [ ] `src/components/data-table/pagination.tsx` (paginación con `meta`)
- [ ] `src/components/data-table/column-def.ts` con helpers (`textColumn`, `badgeColumn`, `dateColumn`, `actionsColumn`)
- [ ] Loading state: `<Skeleton>` mientras `isLoading`
- [ ] Empty state: `<EmptyState>` si `data.length === 0`
- [ ] Error state: `<ErrorState onRetry={refetch} />` si `error`

---

## FASE 2 — Transacciones core (UI)

> La pantalla más importante: **Sales**. El resto orbita alrededor (proveedores, stock, customers).

### 2.1 Providers
- [ ] `src/lib/schemas/provider.ts` con `createProviderSchema`, `updateProviderSchema`
- [ ] `src/api/queries/use-providers.ts`: `useProviders({ page, limit })`, `useProvider(id)`, `useCreateProvider()`, `useUpdateProvider()`, `useDeleteProvider()`
- [ ] `src/routes/_authed/providers/index.tsx`: tabla con `name`, `companyName`, `contactName`, `contactPhone`, `isActive`
- [ ] `<Dialog>` create/edit
- [ ] Soft-delete: 400 si tiene órdenes activas
- [ ] RoleGuard: Admin/Manager write, todos lectura

### 2.2 Provider Orders — HU-018
- [ ] `src/lib/schemas/provider-order.ts` con `createProviderOrderSchema` (array de items), `cancelProviderOrderSchema` (motivo)
- [ ] `src/api/queries/use-provider-orders.ts`: `useProviderOrders({ page, limit, status, providerId, branchId })`, `useProviderOrder(id)`, `useCreateProviderOrder()`, `useUpdateProviderOrder()`, `useReceiveProviderOrder()`, `useCancelProviderOrder()`
- [ ] `src/routes/_authed/provider-orders/index.tsx`: tabla con `id`, `provider` (nombre), `branch`, `total`, `status` (badge colored), `estimatedDelivery`, acciones
- [ ] `src/routes/_authed/provider-orders/new.tsx`: form con selector de provider, branch, warehouse destino, **tabla editable de items** (combobox de item + qty + cost + unit)
- [ ] `src/routes/_authed/provider-orders/$orderId/index.tsx`: detail con items, status badge, botones `Recibir` (si pending) y `Cancelar` (si pending)
- [ ] `src/routes/_authed/provider-orders/$orderId/receive.tsx`: confirmar recepción (warehouse destino prellenado del create, o editable)
- [ ] Recepción: tx crea stock movements `type='in'` y actualiza stock (vía back). Toast success con el id del movimiento.
- [ ] RoleGuard: Admin/Manager write (POST/PATCH/receive/cancel), Admin estricto DELETE

### 2.3 Stock Movements — HU-019
- [ ] `src/lib/schemas/stock-movement.ts` con `createAdjustmentSchema` (direction, quantity, itemId, warehouseId, notes), `transferStockSchema` (itemId, fromWarehouseId, toWarehouseId, quantity, notes)
- [ ] `src/api/queries/use-stock-movements.ts`: `useStockMovements({ page, limit, itemId, warehouseId, type, from, to })`, `useStockMovement(id)`, `useItemStockHistory(itemId, { warehouseId, from, to })`, `useCreateAdjustment()`, `useTransferStock()`, `useLowStockItems({ branchId })`
- [ ] `src/routes/_authed/stock-movements/index.tsx`: tabla con `createdAt`, `type` (badge), `item`, `quantity` (con sign), `fromWarehouse`/`toWarehouse`, `referenceType`, `createdBy`, `notes`
- [ ] `src/routes/_authed/stock-movements/new-adjustment.tsx`: form con item, warehouse, direction (in/out), quantity, notes
- [ ] `src/routes/_authed/stock-movements/new-transfer.tsx`: form con item, fromWarehouse, toWarehouse, quantity, notes
- [ ] `src/routes/_authed/stock-movements/low-stock.tsx`: lista de items bajo mínimo (usa endpoint de Fase 2.3 back)
- [ ] Historial de stock en detail de item (Fase 1.2) y de warehouse (Fase 1.7)
- [ ] RoleGuard: Admin/Manager write (adjustment/transfer), todos lectura

### 2.4 Sales — HU-009, HU-010, HU-011, HU-012, HU-013, HU-014 (LA PANTALLA PRINCIPAL)
- [ ] `src/lib/schemas/sale.ts` con `createSaleSchema` (customerId opcional, branchId, items: [{ itemId, quantity, unitId?, price, warehouseId? }], discountPercent)
- [ ] `src/api/queries/use-sales.ts`: `useSales({ page, limit, branchId, customerId, from, to, includeCancelled })`, `useSale(id)`, `useCreateSale()`, `useCancelSale()`, `useExportSales({ format, from, to, branchId })`
- [ ] `src/routes/_authed/sales/index.tsx`: tabla con `createdAt`, `branch`, `customer` (o "Consumidor final"), `total`, `discountPercent`, `status` (active/cancelled badge), acciones
- [ ] `src/routes/_authed/sales/new.tsx`: **POS-style form**:
  - Selector de customer (Combobox, opcional)
  - Lista editable de items: combobox para item (búsqueda por nombre/code/barcode), qty, unit, price (prefill desde item.salePrice, editable), warehouse (auto o manual)
  - Subtotal calculado en tiempo real
  - Discount input (0-100%)
  - Total calculado
  - Submit: `useCreateSale.mutate(...)` → toast success con id → redirect a detail
  - Loading: `<Skeleton>` mientras `useCreateSale.isPending` o `useLookupItemByBarcode` para autocompletar
- [ ] `src/routes/_authed/sales/$saleId/index.tsx`: detail con `items[]` (item + warehouse), `customer{}`, `branch{}`, `createdBy{id, name, email}`, `subtotal`, `total`, `status`
- [ ] Cancelar venta (HU-011): `<Dialog>` con input `cancellationReason` (requerido), soft-delete con movimientos compensatorios
- [ ] Export CSV/JSON (HU-014): botón en lista que dispara download vía `useExportSales`
- [ ] RoleGuard: Admin/Manager/Employee para POST. Admin/Manager para DELETE (cancel). Admin/Manager para export. Todos lectura.

### 2.5 Stock crítico — HU-017 (front)
- [ ] `src/api/queries/use-recommendations.ts`: `useRecommendations({ page, limit, status, type, branchId })`, `useRecommendation(id)`, `useUpdateRecommendationStatus()`
- [ ] `src/routes/_authed/recommendations/index.tsx`: tabla con `type` (restock/retention/seasonal/pricing/trend), `priority` (high/medium/low badge), `description`, `itemId` (badge con link a item), `customerId` (si es retention), `branch`, `status`, `generatedAt`
- [ ] `<Dialog>` de detail: descripción completa, item, customer (si aplica), `expiresAt`, transiciones de status permitidas (`pending → applied/dismissed`)
- [ ] Acciones inline en la fila: marcar como aplicada o dismissed
- [ ] Default `?status=pending` (mostrar solo accionables). Toggle "Ver histórico" para ver aplicadas/dismissed
- [ ] Badge en sidebar con count de recommendations pending (HU-035 partial, contar via `useRecommendations({ status: 'pending', limit: 1 })` y leer `meta.total`)
- [ ] RoleGuard: Admin/Manager para PATCH (cambiar status), todos lectura

---

## FASE 3 — Inteligencia analítica (UI)

> El diferenciador del TFG. Requiere Fase 2 completa con datos reales.

### 3.1 Dashboard — HU-027, HU-028
- [ ] `src/api/queries/use-dashboard.ts`: `useSalesSummary({ from, to })`, `useProductRotation({ from, to, categoryId, branchId, includeZeroSales })`, `useInactiveCustomers({ branchId })`
- [ ] `src/routes/_authed/dashboard.tsx`: layout con cards:
  - **Card "Hoy"**: total ventas hoy + count transacciones + delta vs ayer (semáforo)
  - **Card "Esta semana"**: total ventas 7d + delta vs semana anterior
  - **Card "Rotación de productos"**: top 5 items con cantidad vendida (gráfico de barras simple, Recharts si se justifica)
  - **Card "Clientes inactivos"**: count + top 5 (link a lista completa)
  - Filtros globales: date range (presets: hoy, 7d, 30d, custom)
- [ ] `<DateRangePicker>` component reusable (Fase 3.1+)
- [ ] Empty state si no hay ventas en el período: "Aún no hay ventas registradas"
- [ ] RoleGuard: autenticados

### 3.2 Reports — HU-029
- [ ] `src/api/queries/use-reports.ts`: `useSalesTrend({ interval, from, to })`, `useRevenueTimeline({ ... })`, `useTopItems({ sortBy, from, to, branchId, limit })`, `useCategoryDistribution({ from, to, branchId })`
- [ ] `src/routes/_authed/reports/index.tsx`: layout con tabs:
  - **Tab "Tendencia de ventas"**: line chart (Recharts) con buckets según `interval` (day/week/month)
  - **Tab "Revenue timeline"**: line chart sin transaction count
  - **Tab "Top items"**: bar chart horizontal + tabla con `item`, `quantity`, `revenue`, `% of total`. Toggle `quantity|revenue`
  - **Tab "Distribución por categoría"**: pie chart + tabla con `category`, `revenue`, `% of total`. Items sin categoría agrupados bajo "Sin categoría"
- [ ] Filtros: date range (default 30d), branch (admin), interval (sales-trend/revenue-timeline)
- [ ] Cap de buckets respetado del back (mostrar mensaje claro si excede)
- [ ] RoleGuard: autenticados

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
| Fase 1 — Entidades maestras | HU-004, 005, 006, 007, 008, 015, 016, 020, 021, 022 | 1/10 sub-secciones (branch context) | ⏳ en progreso |
| Fase 2 — Transacciones core | HU-009, 010, 011, 012, 013, 014, 017, 018, 019, 023, 024 | 0% | ⏳ pendiente |
| Fase 3 — Inteligencia analítica | HU-025, 026, 027, 028, 029, 030, 031, 032, 033, 034, 035 | 0% | ⏳ pendiente |
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
