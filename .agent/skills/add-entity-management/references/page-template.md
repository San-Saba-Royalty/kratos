# Page Template

Annotated template for entity management pages assembled by this skill.
Copy and adapt this for each entity, replacing `{Entity}` / `{entities}` placeholders.

> [!NOTE]
> This template is for **static-column** pages only. Do NOT add `module`,
> `displayFields`, `currentView`, or `fetchViews` logic.

```tsx
/**
 * {Entity} Management Page
 *
 * List → edit → save workflow for {entities}.
 * Uses {Entity}DataTable + {Entity}EditorDialog.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { use{EntitiesName} } from '@/hooks/use-{entities-kebab}';
import { {Entity}EditorDialog } from './{entity-kebab}-editor-dialog';
import { {Entity}DataTable } from './{entity-kebab}-data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { {Entity} } from '{entityTypePath}';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function {Entity}ManagementPage() {
  // --- Hook: all data + actions ---
  const {
    {entitiesName},
    isLoading,
    error,
    hasHydrated,
    selected{Entity},
    isSelected{Entity}Loading,
    setSelected{Entity},
    create{Entity},
    update{Entity},
    delete{Entity},
    fetch{EntitiesName},
  } = use{EntitiesName}();

  // --- Dialog state ---
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingEntityId, setEditingEntityId] = useState<{EntityIdType} | undefined>(undefined);

  // --- Search state ---
  const [searchTerm, setSearchTerm] = useState('');

  // --- Row selection state ---
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // --- Load on mount ---
  useEffect(() => {
    if (hasHydrated) {
      fetch{EntitiesName}();
    }
  }, [hasHydrated, fetch{EntitiesName}]);

  // --- Hydrate selected entity for edit ---
  useEffect(() => {
    if (!showDialog) return;

    if (editingEntityId && dialogMode === 'edit') {
      setSelected{Entity}(editingEntityId).catch((err) => {
        console.error('[{Entity}Management] Failed to load entity:', err);
      });
      return;
    }

    setSelected{Entity}(null).catch((err) => {
      console.error('[{Entity}Management] Failed to clear selection:', err);
    });
  }, [showDialog, editingEntityId, dialogMode, setSelected{Entity}]);

  // --- Live search filter ---
  // SEARCH_FIELDS controls which text columns are searched.
  // Replace with actual field names from entity-registry.md.
  const SEARCH_FIELDS: (keyof {Entity})[] = [/* e.g. '{entityNameField}', 'contactName' */];

  const filtered{EntitiesName} = useMemo(() => {
    if (!searchTerm.trim()) return {entitiesName};

    const lower = searchTerm.toLowerCase();
    return {entitiesName}.filter((item) =>
      SEARCH_FIELDS.some((field) => {
        const value = item[field];
        return typeof value === 'string' && value.toLowerCase().includes(lower);
      })
    );
  }, [{entitiesName}, searchTerm]);

  // --- Handlers ---
  const handleCreate = useCallback(() => {
    setDialogMode('create');
    setEditingEntityId(undefined);
    setShowDialog(true);
  }, []);

  const handleEdit = useCallback((id: {EntityIdType}) => {
    setDialogMode('edit');
    setEditingEntityId(id);
    setShowDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setShowDialog(false);
    setEditingEntityId(undefined);
    setSelected{Entity}(null).catch((err) => {
      console.error('[{Entity}Management] Failed to clear selection:', err);
    });
  }, [setSelected{Entity}]);

  const handleSave = useCallback(async (payload: Partial<{Entity}>) => {
    if (dialogMode === 'create') {
      await create{Entity}(payload);
    } else if (editingEntityId != null) {
      await update{Entity}(editingEntityId, payload);
    }
  }, [dialogMode, editingEntityId, create{Entity}, update{Entity}]);

  const handleDelete = useCallback(async () => {
    if (editingEntityId != null) {
      await delete{Entity}(editingEntityId);
    }
  }, [editingEntityId, delete{Entity}]);

  // --- Loading state ---
  if (!hasHydrated || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">{pageTitle}</h1>
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" data-testid="{entity-kebab}-management-page">
      {/* Page Header + Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{pageTitle}</h1>
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="{entity-kebab}-search-input"
            />
          </div>
          {/* Add New */}
          <Button onClick={handleCreate} data-testid="create-{entity-kebab}-button">
            <Plus className="size-4" />
            Add New
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      {/* Data Table */}
      <div className="bg-background rounded-lg shadow">
        <{Entity}DataTable
          {entitiesName}={filtered{EntitiesName}}
          isLoading={false}
          pageSize={25}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          onEdit{Entity}={(id) => handleEdit(id)}
          onDelete{Entity}={(entity) => {
            setDialogMode('edit');
            setEditingEntityId(entity.{EntityIdField});
            setShowDialog(true);
          }}
        />
      </div>

      {/* Editor Dialog */}
      <{Entity}EditorDialog
        isOpen={showDialog}
        onClose={handleCloseDialog}
        mode={dialogMode}
        entity={selected{Entity} ?? undefined}
        isLoadingEntity={dialogMode === 'edit' ? isSelected{Entity}Loading : false}
        {entitiesName}={{entitiesName}}
        onSave={handleSave}
        onDelete={dialogMode === 'edit' ? handleDelete : undefined}
      />
    </div>
  );
}
```

## Key Points

1. **No Views integration** — static columns only, no `fetchViews()` or `module` prop
2. **Search is client-side** — `useMemo` filters the full array
3. **Dialog state is in the page** — not in the store
4. **Selection hydration** uses a `useEffect` that triggers when the dialog opens in edit mode
5. **All actions** come from the entity hook, not imported directly from the store
