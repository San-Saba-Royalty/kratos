---
name: generate-data-table
description: >
  Generate a feature-specific data table component wrapping SharedDataTable<T>
  and refactor the page to use it. Use for new list/table views.
metadata:
  author: san-saba-royalty
  version: "2.0"
  category: code-generation
---

# Generate Data Table Skill

Generate a feature-specific data table component that wraps the project's `SharedDataTable<T>` library.

## When to Use

Use this skill when the user asks to:
- Create a new list/table view for an entity
- Add a data table to a page
- Build a CRUD list component
- Generate a table with actions, selection, or computed fields

## Prerequisites

The shared table library and reference implementation must exist:

```
src/components/tables/shared-data-table/
src/app/(auth)/admin/tools/views/view-data-table.tsx
docs/shared-data-table-walkthrough.md
```

Use `src/components/tables/shared-data-table/types.ts` as the source of truth for the API.

## Required Inputs

Collect these from the user or infer from existing code:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `entityName` | Yes | PascalCase entity name (e.g. `Acquisition`, `View`) |
| `entityType` | Yes | TypeScript type/interface name |
| `entityTypePath` | Yes | Import path for entity type |
| `pagePath` | Yes | Page to refactor |
| `dataPropName` | Yes | Array prop name for table data (`views`, `acquisitions`) |
| `idAccessor` | Yes | `keyof T` or function returning string ID |
| `columns` | Yes | `DataTableColumn<T>[]` definitions |
| `module` | No | Module name for view/field scoping (e.g. `Acquisition`, `LetterAgreement`). Required when the table uses the Views system for dynamic column filtering. |
| `actions` | No | `DataTableAction<T>[]` definitions |
| `specialItems` | No | `SpecialItemRule<T>[]` |
| `enableSelection` | No | Defaults to `true` for list management pages |
| `defaultPageSize` | No | Usually page store value (e.g. `pageSize`) |
| `pageSizeOptions` | No | Usually `[10, 25, 50, 100]` |

> [!CAUTION]
> **Critical: verify ID/property names exactly**
>
> Property names are case-sensitive (`viewID` vs `viewId`).
>
> Example: if API/store rows use `viewID`, set `idAccessor: 'viewID'`.
>
> Using the wrong case will cause all items to have `undefined` IDs, breaking selection and other ID-based features.

## Current SharedDataTable API (must match)

Use the actual types from `types.ts`:
- `DataTableColumnType`: `'text' | 'date' | 'datetime' | 'money' | 'decimal' | 'integer' | 'boolean' | 'icon' | 'image' | 'url' | 'link'`
- `computedValue`: `(item: T) => unknown`
- `renderIcon`: `(item: T) => React.ReactNode`
- `urlAccessor`: `keyof T | ((item: T) => string | null)`
- `urlLabel`: `string | ((item: T) => string)`
- `footer`: `'sum' | 'count' | 'avg' | ((items: T[]) => React.ReactNode)`
- `actions[].isVisible`: `(item: T) => boolean`
- `config.idAccessor`: `keyof T | ((item: T) => string)`

## Generation Steps

### Step 1: Create `{entity-name}-data-table.tsx`

Create it in the same directory as `pagePath`.

Template requirements:
- `use client`
- import `SharedDataTable` and types from `@/components/tables/shared-data-table`
- define `const {ENTITY}_COLUMNS: DataTableColumn<T>[]`
- define `actions` with `useMemo`
- define `config` with `useMemo`
- export typed component `{EntityName}DataTable`

Recommended config defaults for management pages:
- `enableSelection: true`
- `enableAlternatingRows: true`
- `defaultPageSize: pageSize` (prop-driven when available)
- `pageSizeOptions: [10, 25, 50, 100]`
- `emptyState` with helpful message

Use `SpecialItemRule<T>` for sentinel/system rows (example: `"All Fields"`).

### Step 2: Refactor `pagePath`

Refactor page responsibilities to:
- keep store/hook orchestration, dialog state, toolbar actions, and handlers
- use the feature table component for rendering
- avoid inline TanStack table column and cell logic

**Module-aware pages** (when `module` is provided):
- Call `fetchViews(module)` instead of `fetchViews()` on mount to scope views to this module
- Pass `displayFields` and `currentView` as props to the data table component
- The data table component should build columns dynamically from `DisplayField[]` using `mapColumnType` + `computedValue` (see `AcquisitionDataTable` reference)

**Static-column pages** (when `module` is not provided):
- Call `fetchViews()` with no args to get all views
- Define columns statically in the data table component (see `ViewDataTable` reference)

Project architecture constraints:
- Components/pages use custom hooks (`useX`) only; do not import stores directly in components.
- Hooks/components must not call REST APIs directly; API calls belong in store actions.
- If row details/fields are needed on selection/edit, call a store action that hydrates cached state and pass loading state to dialog.
- Keep `Set<string>` row selection in page state and pass via props.

### Step 3: Verification

```bash
pnpm eslint <new-data-table-file> <pagePath>
pnpm exec tsc --noEmit
```

If repository baseline is clean, run:

```bash
pnpm lint
```

## Architecture Rules

Follow these project rules when generating:

- **Flat 2.0 Design** — no borders, use background differentiation
- **Zustand hooks** — components access stores via hooks only (`useX()` not `useXStore()`)
- **No `any` type** — use generics and proper types
- **Max 500 lines per file**
- **`data-testid`** attributes on interactive elements
- **Package manager is `pnpm` only**

## Reference Implementation

**Static-column tables** (no module, fixed columns):
- `src/app/(auth)/admin/tools/views/view-data-table.tsx`
- `references/example-output.tsx`

**Module-aware dynamic-column tables** (columns from `DisplayField[]` + view filtering):
- `src/app/(auth)/admin/file/display/acquisitions/acquisition-data-table.tsx`

These should stay aligned.
