---
name: generate-signalr-store
description: Generate a Zustand store with real-time SignalR sync, co-located hub connection module, .NET backend hub, notifier additions, and auto-fetch hook. Activate when asked to create a new entity store that needs real-time updates.
---

# Generate SignalR Store Skill

Generate a complete SignalR-synced Zustand store for a given entity type.
This creates both frontend (store + signalr module + hook) and backend scaffolding.

## Inputs

Before starting, gather the following from the user or the task:

| Input | Example | Required |
|-------|---------|----------|
| `EntityName` (PascalCase singular) | `LetterAgreement` | ✅ |
| `entityName` (camelCase singular) | `letterAgreement` | derived |
| `entitiesName` (camelCase plural) | `letterAgreements` | derived |
| `EntityIdField` | `letterAgreementID` | ✅ |
| `EntityIdType` | `number` or `string` | ✅ |
| `HubPath` | `/hubs/letteragreements` | ✅ |
| `ApiEndpoint` | result of API client function | ✅ |
| `WithPersistence` | `false` (default) | ❌ |

## Steps

### Step 1: Read Architecture Rules

Read the architecture rules to ensure compliance:

```
.cursor/rules/signalr-zustand-architecture.mdc
```

### Step 2: Read Reference Implementations

Study at least one existing store pair to match codebase conventions:

```
src/stores/document-template-store/index.ts    ← simple entity store
src/stores/document-template-store/signalr.ts  ← simple signalr module
src/stores/letter-agreement-store/index.ts     ← similar simple pattern
src/stores/letter-agreement-store/signalr.ts   ← similar signalr module
```

For complex stores with optimistic updates:

```
src/stores/view-store/index.ts
src/stores/view-store/signalr.ts
```

### Step 3: Create TypeScript Type (if not existing)

Path: `src/types/{entity}.ts`

```typescript
export interface {EntityName} {
  {EntityIdField}: {EntityIdType};
  // ... entity fields from the API
  // Add all fields the API returns
}
```

### Step 4: Create Zustand Store

Path: `src/stores/{entity}-store/index.ts`

**Required state:**
- `{entitiesName}: {EntityName}[]` — raw entity array
- `selected{EntityName}Id: {EntityIdType} | null`
- `lastFetchedAt: number | null`
- `currentSort: { field: string; direction: 'asc' | 'desc' } | null`
- `currentFilters: Record<string, unknown> | null`
- `isLoading: boolean`
- `error: string | null`
- `_hasHydrated: boolean`

**Required actions:**
- `fetch{EntitiesName}(options?: { force?: boolean; sort?; filters? })` — API call with skip-if-cached
- `setSelected{EntityName}(id)` — selection setter
- `add{EntityName}(entity)` — called by SignalR Created event, with deduplication check
- `update{EntityName}(entity)` — called by SignalR Updated event, uses `.map()`
- `remove{EntityName}(entityId)` — called by SignalR Deleted event, uses `.filter()`
- `clearError()` — clear error state
- `invalidateCache()` — clear entities + lastFetchedAt

**Module-level initialization (at bottom of file):**
```typescript
let hasInitializedClientSync = false;

if (typeof window !== 'undefined') {
  if (!hasInitializedClientSync) {
    hasInitializedClientSync = true;

    const store = use{EntityName}Store.getState();
    void connect{EntityName}Hub(store);

    window.addEventListener('beforeunload', () => {
      void disconnect{EntityName}Hub();
      hasInitializedClientSync = false;
    });
  }
}
```

**If `WithPersistence` is `true`:**
- Wrap with `persist()` middleware from `zustand/middleware`
- Use `createJSONStorage(() => localStorage)`
- `partialize` to exclude: `isLoading`, `error`, `_hasHydrated`
- `onRehydrateStorage` sets `_hasHydrated: true`
- Change `_hasHydrated` default to `false`
- Add `STALE_THRESHOLD` constant (5 minutes)
- Modify `fetch` logic to check staleness, not just array length

### Step 5: Create SignalR Module

Path: `src/stores/{entity}-store/signalr.ts`

Follow this exact pattern:

```typescript
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import type { {EntityName} } from '@/types/{entity}';
import { useAuthStore } from '@/stores/auth-store';
import type { use{EntityName}Store } from './index';

let hubConnection: HubConnection | null = null;
let connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';

type {EntityName}StoreInstance = ReturnType<typeof use{EntityName}Store.getState>;
```

**Required functions:**
- `connect{EntityName}Hub(store)` — builds connection, registers 3 event handlers, lifecycle handlers, starts connection
- `disconnect{EntityName}Hub()` — stops connection, nullifies, sets status
- `getConnectionStatus()` — returns connection status

**Event handlers (inside `connect{EntityName}Hub`):**
- `{EntityName}Created` → `store.add{EntityName}(entity)`
- `{EntityName}Updated` → `store.update{EntityName}(entity)`
- `{EntityName}Deleted` → `store.remove{EntityName}(entityId)`

**Lifecycle handlers:**
- `onreconnecting` → set status to 'connecting'
- `onreconnected` → set status to 'connected', call `store.fetch{EntitiesName}()` (FULL REFRESH)
- `onclose` → set status to 'disconnected'

**Connection config:**
- URL: `${process.env.NEXT_PUBLIC_API_URL}{HubPath}`
- `accessTokenFactory: () => useAuthStore.getState().token || ''`
- `.withAutomaticReconnect()`
- `.configureLogging(LogLevel.Information)`

**Error handling:**
- Catch connection start errors
- Retry with `setTimeout(() => void connect{EntityName}Hub(store), 5000)`

### Step 6: Create Custom Hook

Path: `src/hooks/use-{entity}.ts` (or `use-{entities}.ts` for list hook)

Follow the Component → Hook → Store pattern:

```typescript
import { useEffect } from 'react';
import { use{EntityName}Store } from '@/stores/{entity}-store';

export function use{EntitiesName}() {
  const {entitiesName} = use{EntityName}Store((s) => s.{entitiesName});
  const isLoading = use{EntityName}Store((s) => s.isLoading);
  const error = use{EntityName}Store((s) => s.error);
  const fetch{EntitiesName} = use{EntityName}Store((s) => s.fetch{EntitiesName});

  // Auto-fetch on mount
  useEffect(() => {
    fetch{EntitiesName}();
  }, [fetch{EntitiesName}]);

  return {
    {entitiesName},
    isLoading,
    error,
    refresh: () => fetch{EntitiesName}({ force: true }),
  };
}
```

**Rules:**
- Select individual values from store, NOT entire state
- Auto-fetch in `useEffect` on mount
- Return a clean public API object
- Add derived state (search, sort, filter, pagination) as needed via `useMemo`

### Step 7: Create Backend Hub (Optional — if building full-stack)

Path: `src/SSRBlazor.Api/Hubs/{EntityName}Hub.cs`

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace SSRBlazor.Api.Hubs;

public interface I{EntityName}Client
{
    Task {EntityName}Created({EntityName} entity);
    Task {EntityName}Updated({EntityName} entity);
    Task {EntityName}Deleted(int entityId);
}

[Authorize]
public class {EntityName}Hub : Hub<I{EntityName}Client>
{
    // Clients connect to receive broadcast events
}
```

### Step 8: Add Notifier Methods (Optional — if building full-stack)

Add to `src/SSRBlazor.Api/Services/EntityChangeNotifier.cs`:

1. Add `IHubContext<{EntityName}Hub, I{EntityName}Client>` field + constructor parameter
2. Add `Notify{EntityName}CreatedAsync`, `Notify{EntityName}UpdatedAsync`, `Notify{EntityName}DeletedAsync` methods
3. Add interface methods to `IEntityChangeNotifier`

### Step 9: Register Hub Endpoint (Optional — if building full-stack)

Add to `Program.cs`:

```csharp
app.MapHub<{EntityName}Hub>("/hubs/{entitiesname}");
```

## Verification Checklist

After generating all files, verify:

- [ ] Store has all required state fields and actions
- [ ] SignalR module has all 3 event handlers + lifecycle handlers
- [ ] `onreconnected` calls `fetch{EntitiesName}()` (full refresh)
- [ ] `add{EntityName}` includes deduplication check
- [ ] Module-level init block at bottom of store `index.ts`
- [ ] `beforeunload` cleanup registered
- [ ] Hook auto-fetches on mount via `useEffect`
- [ ] Hook selects individual values, not entire state
- [ ] If persistent: `partialize` excludes ephemeral state
- [ ] Backend hub uses strongly-typed client interface
- [ ] Hub endpoint registered in `Program.cs`
