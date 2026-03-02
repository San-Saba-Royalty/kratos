/**
 * View Data Table
 *
 * Feature-specific data table for the View Management page.
 * Wraps SharedDataTable with view-specific column definitions,
 * "All Fields" special item handling, and Edit/Delete actions.
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { SharedDataTable } from '@/components/tables/shared-data-table';
import type {
  DataTableColumn,
  DataTableAction,
  SpecialItemRule,
  SharedDataTableConfig,
} from '@/components/tables/shared-data-table';
import type { View } from '@/types/view';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ViewDataTableProps {
  views: View[];
  isLoading: boolean;
  pageSize: number;
  selectedRows: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
  onEditView: (viewId: string) => void;
  onDeleteView: (view: View) => void;
}

// ---------------------------------------------------------------------------
// Column Definitions
// ---------------------------------------------------------------------------

const VIEW_COLUMNS: DataTableColumn<View>[] = [
  {
    id: 'viewName',
    accessorKey: 'viewName',
    header: 'Name',
    type: 'text',
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: 'Created',
    type: 'date',
  },
  {
    id: 'updatedAt',
    accessorKey: 'updatedAt',
    header: 'Updated',
    type: 'date',
  },
];

// ---------------------------------------------------------------------------
// Special Item Rules
// ---------------------------------------------------------------------------

const ALL_FIELDS_RULE: SpecialItemRule<View> = {
  match: (view) => view.viewName === 'All Fields',
  disableSelection: true,
  disableActions: true,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ViewDataTable({
  views,
  isLoading,
  pageSize,
  selectedRows,
  onSelectionChange,
  onEditView,
  onDeleteView,
}: ViewDataTableProps) {
  // --- Actions ---
  const actions = useMemo<DataTableAction<View>[]>(
    () => [
      {
        id: 'edit',
        label: 'Edit',
        icon: Pencil,
        handler: (view) => onEditView(view.viewID),
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: Trash2,
        handler: (view) => onDeleteView(view),
        isDestructive: true,
      },
    ],
    [onEditView, onDeleteView]
  );

  // --- Config ---
  const handleDoubleClick = useCallback(
    (view: View) => {
      if (view.viewName !== 'All Fields') {
        onEditView(view.viewID);
      }
    },
    [onEditView]
  );

  const config = useMemo<SharedDataTableConfig<View>>(
    () => ({
      idAccessor: 'viewID',
      columns: VIEW_COLUMNS,
      enableSelection: true,
      specialItems: [ALL_FIELDS_RULE],
      actions,
      onRowDoubleClick: handleDoubleClick,
      enableAlternatingRows: true,
      defaultPageSize: pageSize,
      pageSizeOptions: [10, 25, 50, 100],
      emptyState: (
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No views created yet</p>
          <p className="text-sm text-muted-foreground">
            Create custom views to show only the columns you need
          </p>
        </div>
      ),
    }),
    [actions, handleDoubleClick, pageSize]
  );

  return (
    <SharedDataTable<View>
      data={views}
      config={config}
      isLoading={isLoading}
      selectedRows={selectedRows}
      onSelectionChange={onSelectionChange}
    />
  );
}
