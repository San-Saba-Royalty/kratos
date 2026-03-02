---
name: add-entity-management
description: >
  Full-stack entity management generator. Audits and scaffolds both the .NET
  backend (controller, hub, entity model, DbContext) and the React frontend
  (Zustand store, SignalR sync, data table, editor dialog, page assembly),
  then generates BDD integration tests with Playwright and video recording.
  Orchestrates generate-data-table, generate-signalr-store, and
  generate-entity-dialog sub-skills. Produces a complete list → detail → edit
  → save workflow for simple entities that do NOT need dynamic column support.
  Activate when asked to build a management page for Buyers, Counties,
  Operators, Referrals, Appraisal Groups, Lien Types, Curative Types, Deal
  Statuses, Letter Agreement Deal Statuses, or Users.
metadata:
  author: san-saba-royalty
  version: "1.2"
  category: code-generation
  tags: [react, dotnet, zustand, signalr, crud, entity-management, full-stack, bdd-testing, playwright]
---

# Add Entity Management Skill

Generate a **full-stack** CRUD management page for a simple entity type.
The skill audits and scaffolds the .NET backend API before building the React
frontend, then orchestrates three sub-skills and generates BDD integration
tests with Playwright + video recording:

1. **Backend scaffolding** — Controller, Hub, Entity model, DbContext, Program.cs
2. **`generate-signalr-store`** — Zustand store + SignalR real-time sync
3. **`generate-data-table`** — Static-column data table (NO dynamic columns)
4. **`generate-entity-dialog`** — Create/edit dialog with form validation

## Backend Project Configuration

The backend .NET project path is resolved in this order:

1. **Environment variable `SSR_BACKEND_PATH`** — if set, use this path
2. **Default**: `/Users/gqadonis/Projects/sansaba/ssr-backend`

```bash
# Check for the environment variable
echo ${SSR_BACKEND_PATH:-/Users/gqadonis/Projects/sansaba/ssr-backend}
```

The backend project structure:

```
{BACKEND_ROOT}/src/
├── SSRBlazor.Api/
│   ├── Controllers/v1/   ← CRUD controllers
│   ├── Hubs/             ← SignalR hubs
│   ├── Services/         ← EntityChangeNotifier
│   └── Program.cs        ← Hub mapping + DI registration
└── SSRBusiness.NET10/
    ├── Entities/          ← Entity models (C# classes)
    └── Data/SsrDbContext.cs ← DbSet registrations
```

> [!IMPORTANT]
> Always resolve the backend path before Step 1. If `SSR_BACKEND_PATH` is set,
> use that. Otherwise fall back to the default path. Verify the path exists
> before proceeding.

## When to Use

Activate when the user asks to:
- Build a management page for any of the 10 registered entities
- Add list → edit → save workflow for a simple entity
- Scaffold CRUD for Buyers, Counties, Operators, Referrers, Appraisal Groups,
  Lien Types, Curative Types, Deal Statuses, Letter Agreement Deal Statuses,
  or Users
- Create or complete an entity management page that needs table + dialog + search

Do NOT use when:
- The entity needs dynamic column support (use `generate-data-table` with `module` prop instead)
- The entity has complex nested relationships that need custom forms (Acquisitions, Letter Agreements)
- Only a standalone dialog or standalone table is needed

## Required Inputs

Before starting, look up the entity in `references/entity-registry.md`. If the
entity is registered there, most inputs are pre-filled. Otherwise, collect:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `EntityName` | Yes | PascalCase singular (e.g., `County`) |
| `entityName` | derived | camelCase singular (e.g., `county`) |
| `entitiesName` | derived | camelCase plural (e.g., `counties`) |
| `EntitiesName` | derived | PascalCase plural (e.g., `Counties`) |
| `entityKebab` | derived | kebab-case (e.g., `county`) |
| `EntityIdField` | Yes | ID property name, case-sensitive (e.g., `countyID`) |
| `EntityIdType` | Yes | `number` or `string` |
| `EntityNameField` | Yes | Display name field (e.g., `countyName`) |
| `entityTypePath` | Yes | Import path for type (e.g., `@/types/county`) |
| `columns` | Yes | `DataTableColumn<T>[]` definitions for the table |
| `searchFields` | Yes | Array of text field names for live search |
| `routePath` | Yes | Next.js route path (e.g., `/admin/counties`) |
| `pageTitle` | Yes | Display title (e.g., `County Management`) |
| `HubPath` | Yes | SignalR hub URL path (e.g., `/hubs/counties`) |
| `ApiEndpoint` | Yes | API client function name (e.g., `getCounties`) |
| `dialogFields` | Yes | Form fields for the create/edit dialog |

## Workflow Steps

### Step 0: Read References & Resolve Backend Path

**Always start by reading these files:**

```text
references/entity-registry.md        ← pre-filled config for all 10 entities
references/backend-templates.md      ← .NET controller, hub, entity templates
references/page-template.md          ← annotated page assembly template
references/search-pattern.md         ← live search implementation pattern
references/bdd-test-template.md      ← BDD test feature + step templates
```

**Then resolve the backend project path:**

```bash
# Resolve backend root (env var takes priority over default)
BACKEND_ROOT=${SSR_BACKEND_PATH:-/Users/gqadonis/Projects/sansaba/ssr-backend}
ls "$BACKEND_ROOT/src/SSRBlazor.Api/Controllers/v1/" > /dev/null 2>&1 && echo "Backend found at $BACKEND_ROOT" || echo "ERROR: Backend not found at $BACKEND_ROOT"
```

### Step 1: Audit Existing Infrastructure (Full-Stack)

Check what already exists for the target entity across **both** projects:

#### Backend Audit (`{BACKEND_ROOT}`)

| Artifact | Path Pattern | Check |
|----------|-------------|-------|
| Entity model | `src/SSRBusiness.NET10/Entities/{EntityName}.cs` | Must exist |
| DbContext DbSet | `src/SSRBusiness.NET10/Data/SsrDbContext.cs` | Check for `DbSet<{EntityName}>` |
| Controller | `src/SSRBlazor.Api/Controllers/v1/{EntitiesName}Controller.cs` | May exist |
| Lookup entry | `src/SSRBlazor.Api/Controllers/v1/LookupsController.cs` | Check if lookup type |
| SignalR Hub | `src/SSRBlazor.Api/Hubs/{EntityName}Hub.cs` | May exist |
| Hub mapping | `src/SSRBlazor.Api/Program.cs` | Check for `MapHub<{EntityName}Hub>` |
| Notifier | `src/SSRBlazor.Api/Services/EntityChangeNotifier.cs` | Check generic `NotifyAsync` usage |

#### Frontend Audit (`ssr-frontend`)

| Artifact | Path Pattern | Check |
|----------|-------------|-------|
| TypeScript type | `src/types/{entity-kebab}.ts` | Must exist |
| Zustand store | `src/stores/{entity-kebab}-store/index.ts` | May exist |
| SignalR module | `src/stores/{entity-kebab}-store/signalr.ts` | May exist |
| Custom hook | `src/hooks/use-{entities-kebab}.ts` | May exist |
| API functions | `src/lib/api-client.ts` | Check for get/create/update/delete |
| Page route | `src/app/(auth)/admin/{route}/page.tsx` | May exist (placeholder) |
| Data table | `src/app/(auth)/admin/{route}/{entity-kebab}-data-table.tsx` | Unlikely |
| Dialog | `src/app/(auth)/admin/{route}/{entity-kebab}-editor-dialog.tsx` | Unlikely |
| Navigation | `src/lib/admin-navigation.ts` | Check menu entry exists |

Log which artifacts exist and which need creation before proceeding.

### Step 1.5: Backend Scaffolding (if incomplete)

See `references/backend-templates.md` for all templates.

**Determine the controller pattern** from the entity registry:
- **Dedicated controller** (Buyer, County, Operator, Referrer, AppraisalGroup, User)
- **Generic lookup** (DealStatus, LienType, CurativeType, LetterAgreementDealStatus)

#### 1.5a: Entity Model (if missing)

If `{BACKEND_ROOT}/src/SSRBusiness.NET10/Entities/{EntityName}.cs` does not exist,
create it using the Entity Model template in `references/backend-templates.md`.

#### 1.5b: DbContext Registration (if missing)

If `SsrDbContext.cs` does not have `public DbSet<{EntityName}> {EntitiesName} { get; set; }`,
add it to the appropriate section.

#### 1.5c: Controller (if missing)

**For dedicated controller entities:**

Create `{BACKEND_ROOT}/src/SSRBlazor.Api/Controllers/v1/{EntitiesName}Controller.cs`
using the Dedicated Controller template.

**For lookup entities:**

Check if the entity's type slug (e.g., `lien-types`) is already in the
`LookupsController.cs` switch statements for `GetByType`, `Create`, `Update`,
and `Delete`. Add entries if missing.

#### 1.5d: SignalR Hub (if missing)

If `{BACKEND_ROOT}/src/SSRBlazor.Api/Hubs/{EntityName}Hub.cs` does not exist:

1. Create the hub file using the SignalR Hub template
2. Add `app.MapHub<{EntityName}Hub>("/hubs/{hubPathSlug}");` to `Program.cs`
   alongside the other hub mappings

#### 1.5e: Notifier Integration

For most simple entities, the generic `NotifyAsync(entityType, operation, entityId, changedBy)`
method in `EntityChangeNotifier` is sufficient. The controller calls it directly.

Only add typed notification methods to `IEntityChangeNotifier` and
`EntityChangeNotifier` if the entity's SignalR hub needs to push full entity
objects instead of just IDs.

> [!CAUTION]
> After creating backend files, do NOT attempt to build the .NET project from
> this skill. The user is responsible for running `dotnet build` in the backend
> project. This skill focuses on file generation, not compilation.

### Step 2: Frontend Store & SignalR (if missing)

If the store or SignalR module does not exist, invoke the `generate-signalr-store`
skill with the entity's configuration from the registry.

If the store exists but is missing CRUD actions (`create`, `update`, `delete`),
extend it. The minimum required store actions for entity management are:

```typescript
// Required for list display
fetch{EntitiesName}(options?: { force?: boolean }): Promise<void>

// Required for selection/edit
setSelected{EntityName}(id: EntityIdType | null): void
// -OR- for async hydration:
setSelected{EntityName}(id: EntityIdType | null): Promise<void>

// Required for SignalR sync
add{EntityName}(entity: T): void
update{EntityName}InStore(entity: T): void  // "InStore" suffix to avoid conflict with API action
remove{EntityName}(entityId: EntityIdType): void

// Required for dialog create/edit/delete
create{EntityName}(payload: Partial<T>): Promise<void>
update{EntityName}(id: EntityIdType, payload: Partial<T>): Promise<void>
delete{EntityName}(id: EntityIdType): Promise<void>

// Utility
clearError(): void
invalidateCache(): void
```

### Step 3: Custom Hook (if missing or incomplete)

If the hook does not exist, create it at `src/hooks/use-{entities-kebab}.ts`.

The hook MUST expose:

```typescript
{
  // List data
  {entitiesName}: T[];
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;

  // Selection
  selected{EntityName}: T | null;
  isSelected{EntityName}Loading: boolean;
  setSelected{EntityName}: (id: EntityIdType | null) => Promise<void>;

  // CRUD
  create{EntityName}: (payload: Partial<T>) => Promise<void>;
  update{EntityName}: (id: EntityIdType, payload: Partial<T>) => Promise<void>;
  delete{EntityName}: (id: EntityIdType) => Promise<void>;

  // Data management
  fetch{EntitiesName}: (options?: { force?: boolean }) => void;
  clearError: () => void;
  invalidateCache: () => void;
}
```

If the hook exists but is missing selection or CRUD actions, extend it.

### Step 4: Frontend API Functions (if missing)

If the API client is missing create, update, or delete functions for the entity,
add them to `src/lib/api-client.ts`.

**For dedicated-controller entities** (Buyer, County, Operator, Referrer, AppraisalGroup, User):

```typescript
export const create{EntityName} = async (payload: Partial<{EntityName}>): Promise<{EntityName}> => {
  const res = await apiClient.post(`/v1/{entitiesName}`, payload);
  return res.data;
};

export const update{EntityName} = async (id: {EntityIdType}, payload: Partial<{EntityName}>): Promise<{EntityName}> => {
  const res = await apiClient.put(`/v1/{entitiesName}/${id}`, payload);
  return res.data;
};

export const delete{EntityName} = async (id: {EntityIdType}): Promise<void> => {
  await apiClient.delete(`/v1/{entitiesName}/${id}`);
};
```

**For lookup entities** (DealStatus, LienType, CurativeType, LetterAgreementDealStatus):

```typescript
export const get{EntitiesName} = async (): Promise<{EntityName}[]> => {
  const res = await apiClient.get(`/v1/lookups/{type-slug}`);
  return res.data;
};

export const create{EntityName} = async (payload: { name: string }): Promise<{EntityName}> => {
  const res = await apiClient.post(`/v1/lookups/{type-slug}`, payload);
  return res.data;
};

export const update{EntityName} = async (id: {EntityIdType}, payload: { name: string }): Promise<void> => {
  await apiClient.put(`/v1/lookups/{type-slug}/${id}`, payload);
};

export const delete{EntityName} = async (id: {EntityIdType}): Promise<void> => {
  await apiClient.delete(`/v1/lookups/{type-slug}/${id}`);
};
```

> [!IMPORTANT]
> The endpoint paths MUST match the actual backend controller routes.
> **Verify** the backend controller from Step 1.5 before writing API functions.
> Note that dedicated controllers use `api/v1/{entitiesName}` while lookup
> entities use `api/v1/lookups/{type-slug}`.

### Step 5: Data Table Component

Invoke the `generate-data-table` skill with:
- **Static-column mode** (NO `module` prop)
- Columns from the entity registry or user input
- Standard edit/delete row actions
- `enableSelection: true`
- `enableAlternatingRows: true`

Place the component at: `src/app/(auth)/admin/{route}/{entity-kebab}-data-table.tsx`

### Step 6: Entity Dialog Component

Invoke the `generate-entity-dialog` skill with:
- The entity's form fields from the registry or user input
- Standard create/edit/delete modes
- Store-backed hydration for edit mode
- `sonner` toasts for outcomes

Place the component at: `src/app/(auth)/admin/{route}/{entity-kebab}-editor-dialog.tsx`

### Step 7: Page Assembly

Create or update the page at: `src/app/(auth)/admin/{route}/page.tsx`

The page MUST follow the pattern in `references/page-template.md`:

1. **Hook integration** — use the entity's custom hook for all data/actions
2. **Dialog state** — `showDialog`, `dialogMode`, `editingEntityId`
3. **Search state** — `searchTerm` + `useMemo` filtering (see `references/search-pattern.md`)
4. **Selection effect** — hydrate selected entity on dialog open
5. **Data table** — pass filtered entities, handlers, selection state
6. **Dialog** — pass selected entity, loading state, save/delete handlers
7. **Create button** — toolbar "Add New" button

> [!CAUTION]
> **The page uses STATIC columns.** Do NOT pass `module`, `displayFields`, or
> `currentView` props. Do NOT call `fetchViews()`. These entities do not
> participate in the Views system.

### Step 8: Navigation Verification

Check `src/lib/admin-navigation.ts` for the route entry:
- If the route already exists in the `adminMenu` array, no changes needed
- If missing, add it to the appropriate section (File > Display, Tools, or Administration)

### Step 9: Build Verification

Run these commands in order:

```bash
# Frontend: lint the new/modified files
pnpm eslint <new-files...>

# Frontend: type check
pnpm exec tsc --noEmit
```

If the frontend repository baseline is clean:

```bash
pnpm lint
```

> [!NOTE]
> If backend files were created (Step 1.5), inform the user that they should
> run `dotnet build` in the backend project to verify the C# code compiles.
> Do not attempt to build the backend from this skill.

### Step 10: BDD Integration Tests

Generate Cucumber.js + Playwright tests that validate the entity management
page end-to-end with video recording. Use `references/bdd-test-template.md`
for parameterised templates.

**10a. Feature File**

Create `tests/features/ui/{entity-kebab}-management.feature` from the template.
Replace all `{Entity}` / `{entity-kebab}` / `{entitiesName}` / `{pageRoute}`
placeholders with the entity's values from `entity-registry.md`.

The feature includes 8 scenarios:
1. Page loads with data table
2. Search filtering
3. Create via dialog
4. Validation errors on empty submit
5. Edit via dialog
6. Delete with confirmation
7. Real-time create (cross-session SignalR)
8. Real-time update (cross-session SignalR)
9. Real-time delete (cross-session SignalR)

All scenarios are tagged `@ui @video @entity-management @{entity-kebab}`.

**10b. Step Definitions**

Create `tests/steps/{entity-kebab}-management.steps.ts` from the template.
Adapt the `data-testid` selectors and form field interactions per the entity
type. Ensure steps use `CustomWorld` typing and `async function` (not arrows).

**10c. World Extensions** (first entity only)

If `entityManagement` does not yet exist in `tests/support/world.ts`, add it
to the `testData` interface and class.

**10d. Verify Wiring**

```bash
# Dry-run to check step wiring
pnpm exec cucumber-js --dry-run --tags "@{entity-kebab}"
```

**10e. Run Tests with Video**

```bash
# Run with video recording
VIDEO=true pnpm test:bdd:tag "@{entity-kebab}"
```

Videos are saved to `tests/reports/videos/` as `.webm` files.

> [!IMPORTANT]
> BDD tests depend on `data-testid` attributes generated in Steps 5–7.
> See the "data-testid Requirements" table in `references/bdd-test-template.md`
> for the full list of required attributes.

## Live Search Pattern

Every entity management page includes client-side search filtering. The pattern:

1. A search `<Input>` in the toolbar above the table
2. A `searchTerm` state variable with debounce (300ms recommended)
3. A `useMemo` that filters the full entity list against `searchFields`
4. Filtered results passed to the data table

See `references/search-pattern.md` for the complete implementation.

## Architecture Rules

These rules are inherited from the sub-skills and MUST be followed:

- **Component → Hook → Store** — Components use hooks only; no direct store imports
- **No direct API calls** in hooks or components — all API calls in store actions
- **No `any` type** — use generics and proper types
- **Flat 2.0 Design** — no borders on container sections, use background differentiation
- **Max 500 lines per file** — split into folder modules when needed
- **`data-testid`** attributes on all interactive elements
- **Package manager is `pnpm` only**
- **Zustand selectors** — select individual values, not entire state
- **`useMemo`/`useCallback`** for derived state and handlers

## Checklist

After completing all steps, verify:

### Backend
- [ ] Entity model exists in `SSRBusiness.NET10/Entities/`
- [ ] `DbSet<{Entity}>` registered in `SsrDbContext.cs`
- [ ] Controller exists (dedicated or lookup entry) with GET/POST/PUT/DELETE
- [ ] SignalR Hub exists with `I{Entity}Client` interface (3 methods)
- [ ] Hub mapped in `Program.cs` via `app.MapHub<>()`
- [ ] `EntityChangeNotifier.NotifyAsync()` called in controller CRUD actions

### Frontend
- [ ] TypeScript type exists with all fields matching backend entity
- [ ] Zustand store has full CRUD actions + SignalR sync methods
- [ ] SignalR module has 3 event handlers (Created, Updated, Deleted)
- [ ] Custom hook exposes list, selection, CRUD, and utility actions
- [ ] API client has get, create, update, delete functions (correct endpoint paths)
- [ ] Data table component uses static columns (no `module` prop)
- [ ] Entity dialog supports create, edit, and delete modes
- [ ] Page assembles table + dialog + search correctly
- [ ] Search filters on the specified text columns
- [ ] Navigation entry exists in `admin-navigation.ts`
- [ ] `pnpm eslint` passes on all new/modified files
- [ ] `pnpm exec tsc --noEmit` passes

### BDD Integration Tests
- [ ] Feature file at `tests/features/ui/{entity-kebab}-management.feature`
- [ ] Step definitions at `tests/steps/{entity-kebab}-management.steps.ts`
- [ ] `entityManagement` added to `world.ts` testData (first entity only)
- [ ] `pnpm exec cucumber-js --dry-run --tags "@{entity-kebab}"` passes
- [ ] `VIDEO=true pnpm test:bdd:tag "@{entity-kebab}"` passes with video
- [ ] All required `data-testid` attributes present in generated components

## Troubleshooting

### Type Conflicts Between Canonical and Simplified Types

**Problem**: Build fails with type incompatibility errors when the same entity has multiple type definitions across the codebase.

**Example**: `County` type exists in both:
- `@/types/county` (canonical, full definition with all fields including nullable `stateCode`)
- `@/types/acquisition` (simplified, subset of fields with non-nullable `stateCode`)

When a store or component imports the canonical type but another component expects the simplified type, TypeScript errors occur:

```
Type 'County' from '@/types/county' is not assignable to type 'County' from '@/types/acquisition'
  Types of property 'stateCode' are incompatible
    Type 'string | null | undefined' is not assignable to type 'string | undefined'
```

**Solution**:
1. **Identify the canonical type** — The type in `@/types/{entity}` is always canonical
2. **Update simplified types** — Make simplified types compatible by allowing `null` where the canonical type does:
   ```typescript
   // In @/types/acquisition.ts (simplified)
   export interface County {
     countyID: number;
     countyName: string;
     stateCode?: string | null;  // ← Add | null to match canonical
     stateName?: string | null;  // ← Add | null to match canonical
   }
   ```
3. **Prefer canonical imports** — When possible, import from the canonical source (`@/types/{entity}`) rather than simplified versions

**Prevention**:
- When generating stores/hooks, always import from `@/types/{entity}` (canonical)
- Document in entity-registry.md if simplified types exist elsewhere
- Run `pnpm exec tsc --noEmit` after store/hook generation to catch type conflicts early

### CORS Configuration for SignalR

**Problem**: Frontend cannot connect to SignalR hubs. Browser console shows one of two errors:

1. **Missing CORS headers**:
   ```
   Access to fetch at 'http://localhost:5054/hubs/{entity}/negotiate' from origin 'http://localhost:3000'
   has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
   ```

2. **Wildcard origin with credentials** (more common):
   ```
   Access to fetch at 'http://localhost:5054/hubs/{entity}/negotiate' from origin 'http://localhost:3000'
   has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
   The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*'
   when the request's credentials mode is 'include'.
   ```

**Root Cause**:
- **Error 1**: Backend doesn't have CORS middleware configured
- **Error 2**: CORS policy uses `AllowAnyOrigin()` (wildcard `*`), but SignalR sends authentication credentials. When credentials are included, CORS requires an **explicit origin**, not a wildcard.

**Solution**: Add CORS policy to backend `Program.cs` with **explicit origin and credentials support**:

```csharp
// In builder.Services section (before builder.Build())
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:3000")  // ← Explicit origin, not AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();  // ← Required for SignalR authentication
    });
});

// In app middleware pipeline (before app.UseAuthentication())
app.UseCors("AllowAll");
```

**Important**:
- Place `UseCors()` **before** `UseAuthentication()` to ensure CORS headers are added to all responses
- Use `WithOrigins()` with explicit URLs, **not** `AllowAnyOrigin()` when using `AllowCredentials()`
- For multiple origins in production, use: `policy.WithOrigins("http://localhost:3000", "https://yourdomain.com")`

**Prevention**:
- Verify CORS is configured in backend `Program.cs` before Step 1
- If missing, add it as part of backend scaffolding with explicit origins and credentials
- Test SignalR connection immediately after hub creation
- After any CORS changes, rebuild backend (`dotnet build`) and restart the service

### Backend Port Consistency

**Problem**: Frontend connects to wrong backend port, causing `ERR_CONNECTION_REFUSED` errors.

**Root Cause**: Mismatch between:
- Frontend `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:5054`
- Backend `launchSettings.json`: `"applicationUrl": "http://localhost:5093"`

**Solution**:
1. **Choose a standard port** — Use `5054` as the canonical backend port
2. **Update launchSettings.json**:
   ```json
   {
     "profiles": {
       "http": {
         "applicationUrl": "http://localhost:5054"
       },
       "https": {
         "applicationUrl": "https://localhost:7262;http://localhost:5054"
       }
     }
   }
   ```
3. **Verify .env.local** matches:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5054
   NEXT_PUBLIC_SIGNALR_HUB_URL=http://localhost:5054/hubs/app
   ```

**Prevention**:
- Document standard ports in project README
- Add port verification to skill Step 0 (audit phase)
- Include port check in BDD test setup
