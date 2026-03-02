---
name: react-data-views
description: >
  Implements list views and edit/detail views that load data from a server using
  the Component → Hook → Store architecture with React, Zustand, shadcn-ui, and
  TanStack Table. Activate when the user asks to create a list view, data table,
  edit form, detail view, or CRUD interface where server data is involved.
  Do NOT activate for static/hardcoded UI, pure layout work, or components that
  don't fetch data.
metadata:
  author: knowme-llc
  version: "1.0"
  tags: [react, zustand, shadcn-ui, tanstack-table, hooks, architecture]
---

# React Data Views

Generate list views and edit/detail views that fetch server data, following a
strict Component → Hook → Store separation of concerns.

## When This Skill Activates

- User asks to create a **list view**, **data table**, or **grid** backed by an API
- User asks to create an **edit form**, **detail view**, or **create form** that loads/saves server data
- User asks to build a **CRUD interface** for a domain entity
- User mentions needing **sorting, filtering, pagination, or search** on server data

## Architecture Overview

Every data-driven view consists of exactly three layers:

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Component   │────▶│  Custom Hook │────▶│ Zustand Store│────▶ API
│  (renderer)  │◀────│  (view-model)│◀────│  (state +    │◀──── Server
│              │     │              │     │   mutations)  │
└─────────────┘     └──────────────┘     └──────────────┘
```

### Layer 1: Components (Renderers)

Components are pure renderers. They call a single custom hook and map its return
values to shadcn-ui primitives.

**Rules:**
- NEVER import a Zustand store directly
- NEVER call `fetch`, `axios`, or any API client
- NEVER contain business logic, sorting, or filtering
- ONLY call one custom hook for data, then render JSX
- May use local `useState` for UI-only state (modal open, active tab)

### Layer 2: Custom Hooks (View-Models)

Hooks compose one or more Zustand store selectors into a domain-specific
interface. They are the component's entire API contract.

**Hooks own:**
- Lifecycle orchestration (`useEffect` for fetch-on-mount, polling, cleanup)
- Derived/computed state (sorting, filtering, search, pagination via `useMemo`)
- Combining data from multiple stores
- Local ephemeral UI state that is tightly coupled to the data (`useState`)

**Hooks DO NOT own:**
- Raw entity data (that's the store)
- API calls for shared/persisted data (that's the store)

**Exception:** Hooks MAY call an API directly for ephemeral, component-scoped
data that has no reason to live in global state (typeahead search, inline
validation, one-off lookups). Prefer TanStack Query for these cases.

### Layer 3: Zustand Stores (Source of Truth)

Stores own the raw shared state and all mutations that touch server data.

**Stores own:**
- Entity arrays/maps/records
- CRUD actions that call APIs and update state
- Optimistic update logic
- WebSocket/subscription handlers
- Loading, error, and staleness flags

**Stores DO NOT own:**
- Derived state (sorting, filtering — that's the hook)
- UI state (modal visibility, active tabs — that's the component)

## Implementation: List View

When asked to create a list view, generate these files. See
`references/list-view.md` for full annotated templates.

| File | Purpose |
|------|---------|
| `stores/use-{entity}-store.ts` | Zustand store with array, CRUD actions, loading/error |
| `hooks/use-{entity}-list.ts` | Hook that triggers fetch, applies sort/filter/search/pagination |
| `components/{Entity}ListView.tsx` | Renders shadcn `DataTable` or `Table` from hook output |
| `components/{Entity}Columns.tsx` | TanStack Table column definitions (extracted for reuse) |

### List View Data Flow

1. Component mounts → calls `use{Entity}List()` hook
2. Hook's `useEffect` calls store's `fetch{Entities}()` action
3. Store action hits API, sets `entities[]`, `isLoading`, `error`
4. Hook selects `entities` from store, applies `useMemo` sort/filter/search
5. Hook returns `{ data, isLoading, error, sortField, setSortField, searchTerm, setSearchTerm, pagination }`
6. Component maps `data` to `<DataTable>` columns and rows

## Implementation: Edit / Detail View

When asked to create an edit or detail view, generate these files. See
`references/edit-view.md` for full annotated templates.

| File | Purpose |
|------|---------|
| `stores/use-{entity}-store.ts` | Same store (reuse), ensure `getById`, `update`, `create` actions exist |
| `hooks/use-{entity}-form.ts` | Hook that loads single entity, manages form state with react-hook-form |
| `components/{Entity}EditView.tsx` | Renders shadcn `Form`, `Input`, `Select`, `Button` from hook output |

### Edit View Data Flow

1. Component mounts with `id` param → calls `use{Entity}Form(id)` hook
2. Hook's `useEffect` calls store's `fetch{Entity}(id)` if not in cache
3. Hook initializes `react-hook-form` with loaded entity data
4. Hook returns `{ form, onSubmit, isLoading, isSaving, error }`
5. Component renders `<Form>` with shadcn fields bound to `form` register
6. On submit → hook calls store's `update{Entity}(id, data)` → store hits API

## Naming Conventions

- Stores: `use{Entity}Store` in `stores/use-{entity}-store.ts`
- List hooks: `use{Entity}List` in `hooks/use-{entity}-list.ts`
- Form hooks: `use{Entity}Form` in `hooks/use-{entity}-form.ts`
- List components: `{Entity}ListView` in `components/{Entity}ListView.tsx`
- Edit components: `{Entity}EditView` in `components/{Entity}EditView.tsx`
- Column defs: `{entity}Columns` in `components/{Entity}Columns.tsx`

## Error and Loading Patterns

- Stores set `isLoading: true` before API call, `false` after (success or error)
- Stores capture `error: string | null` from failed API calls
- Hooks pass `isLoading` and `error` through to components
- Components render shadcn `Skeleton` during loading, `Alert` on error
- Use `toast` from shadcn for mutation success/failure notifications

## What This Architecture Prevents

- Components re-rendering from unrelated store changes (hooks select narrowly)
- Store bloat from derived state that belongs in hooks
- Tight coupling to Zustand — swapping state management only touches hooks
- Untestable components — hooks can be unit tested with mock stores
- API logic scattered across components — all server calls in stores

## Checklist Before Generating Code

1. Identify the domain entity (e.g., `Courtroom`, `Patient`, `Invoice`)
2. Identify the API endpoints (list, get-by-id, create, update, delete)
3. Define the TypeScript interface for the entity
4. Determine which list operations are needed (sort, filter, search, paginate)
5. Determine if edit view needs create mode, edit mode, or both
6. Check if an existing store already covers this entity (reuse, don't duplicate)

For full annotated code templates, read:
- `references/list-view.md` — Complete list view with TanStack Table
- `references/edit-view.md` — Complete edit/detail form with react-hook-form