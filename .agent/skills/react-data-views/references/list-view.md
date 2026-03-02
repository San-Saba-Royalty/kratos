# List View Reference

Complete annotated templates for implementing a list view with server data.
Replace `{Entity}` / `{entity}` / `{entities}` with your domain name.

---

## 1. TypeScript Interface

```typescript
// types/{entity}.ts

export interface Entity {
  id: string;
  // ... domain fields
  createdAt: string;
  updatedAt: string;
}

export interface EntityListParams {
  page?: number;
  pageSize?: number;
  // Server-side params if API supports them:
  // sortBy?: string;
  // sortOrder?: 'asc' | 'desc';
  // search?: string;
}

export interface EntityListResponse {
  data: Entity[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 2. Zustand Store

```typescript
// stores/use-{entity}-store.ts

import { create } from 'zustand';
import { Entity } from '@/types/{entity}';
import { apiClient } from '@/lib/api-client';

interface EntityState {
  // --- Raw State ---
  entities: Entity[];
  total: number;
  isLoading: boolean;
  error: string | null;

  // --- Actions (own all API calls) ---
  fetchEntities: (params?: EntityListParams) => Promise<void>;
  createEntity: (data: Partial<Entity>) => Promise<Entity>;
  updateEntity: (id: string, data: Partial<Entity>) => Promise<Entity>;
  deleteEntity: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useEntityStore = create<EntityState>((set, get) => ({
  // --- Initial State ---
  entities: [],
  total: 0,
  isLoading: false,
  error: null,

  // --- Actions ---
  fetchEntities: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get<EntityListResponse>(
        '/api/entities',
        { params }
      );
      set({
        entities: response.data.data,
        total: response.data.total,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch',
        isLoading: false,
      });
    }
  },

  createEntity: async (data) => {
    // Note: isLoading is NOT set here — the form hook manages its own
    // isSaving state. The store only sets isLoading for list fetches.
    const response = await apiClient.post<Entity>('/api/entities', data);
    const created = response.data;
    set((state) => ({
      entities: [...state.entities, created],
      total: state.total + 1,
    }));
    return created;
  },

  updateEntity: async (id, data) => {
    const response = await apiClient.put<Entity>(`/api/entities/${id}`, data);
    const updated = response.data;
    set((state) => ({
      entities: state.entities.map((e) => (e.id === id ? updated : e)),
    }));
    return updated;
  },

  deleteEntity: async (id) => {
    await apiClient.delete(`/api/entities/${id}`);
    set((state) => ({
      entities: state.entities.filter((e) => e.id !== id),
      total: state.total - 1,
    }));
  },

  clearError: () => set({ error: null }),
}));
```

**Key decisions:**
- Store holds the **raw array** — never sorted or filtered
- Each action calls the API, then updates state immutably
- `isLoading` / `error` are for the list fetch only
- Mutation actions (create, update, delete) throw on failure — the calling
  hook catches and handles errors

---

## 3. Custom Hook (View-Model)

```typescript
// hooks/use-{entity}-list.ts

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useEntityStore } from '@/stores/use-{entity}-store';
import { Entity } from '@/types/{entity}';

type SortField = keyof Entity;
type SortOrder = 'asc' | 'desc';

export function useEntityList() {
  // --- Store selectors (narrow!) ---
  const entities = useEntityStore((s) => s.entities);
  const total = useEntityStore((s) => s.total);
  const isLoading = useEntityStore((s) => s.isLoading);
  const error = useEntityStore((s) => s.error);
  const fetchEntities = useEntityStore((s) => s.fetchEntities);
  const deleteEntity = useEntityStore((s) => s.deleteEntity);

  // --- Local UI state (owned by hook, not store) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // --- Lifecycle: fetch on mount ---
  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  // --- Derived state: filter, sort, paginate (via useMemo) ---
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return entities;
    const term = searchTerm.toLowerCase();
    return entities.filter((entity) =>
      // Customize: search across whichever fields are relevant
      Object.values(entity).some(
        (val) => typeof val === 'string' && val.toLowerCase().includes(term)
      )
    );
  }, [entities, searchTerm]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal == null || bVal == null) return 0;
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortOrder]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  const totalPages = Math.ceil(filtered.length / pageSize);

  // --- Stable callbacks ---
  const toggleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortOrder('asc');
      }
      setPage(1);
    },
    [sortField]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteEntity(id);
      } catch {
        // Error handling — toast notification, etc.
      }
    },
    [deleteEntity]
  );

  // --- Public API (component's only interface) ---
  return {
    // Data
    data: paginated,
    totalItems: filtered.length,
    totalPages,
    isLoading,
    error,
    // Sort controls
    sortField,
    sortOrder,
    toggleSort,
    // Search controls
    searchTerm,
    setSearchTerm,
    // Pagination controls
    page,
    setPage,
    pageSize,
    // Actions
    handleDelete,
    refresh: fetchEntities,
  };
}
```

**Key decisions:**
- Hook selects **individual values** from store, not the whole state
- All derived state (filter → sort → paginate) is `useMemo` chained
- Sort/filter/search state lives in the hook, NOT the store
- The return object IS the component's entire API — nothing else is needed

---

## 4. Column Definitions

```typescript
// components/{Entity}Columns.tsx

import { ColumnDef } from '@tanstack/react-table';
import { Entity } from '@/types/{entity}';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface ColumnOptions {
  onEdit: (entity: Entity) => void;
  onDelete: (id: string) => void;
}

export function getEntityColumns({
  onEdit,
  onDelete,
}: ColumnOptions): ColumnDef<Entity>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    // ... additional columns for your entity fields
    {
      id: 'actions',
      cell: ({ row }) => {
        const entity = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(entity)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(entity.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
```

---

## 5. List View Component

```tsx
// components/{Entity}ListView.tsx

import { useEntityList } from '@/hooks/use-{entity}-list';
import { getEntityColumns } from '@/components/{Entity}Columns';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';

export function EntityListView() {
  const navigate = useNavigate();

  // --- Single hook call: the component's ONLY data source ---
  const {
    data,
    totalItems,
    totalPages,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    handleDelete,
    refresh,
  } = useEntityList();

  const columns = getEntityColumns({
    onEdit: (entity) => navigate(`/entities/${entity.id}/edit`),
    onDelete: handleDelete,
  });

  // --- Render: map hook return values to shadcn-ui primitives ---
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => navigate('/entities/new')}>
            <Plus className="mr-2 h-4 w-4" /> Add Entity
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          pageCount={totalPages}
          page={page}
          onPageChange={setPage}
          totalItems={totalItems}
        />
      )}
    </div>
  );
}
```

**Notice what the component does NOT do:**
- No `useEntityStore()` import
- No `fetch()` or API calls
- No `useMemo` for sorting or filtering
- No business logic whatsoever
- It calls ONE hook and renders the results