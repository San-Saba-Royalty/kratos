/**
 * View Management Page
 *
 * Standalone page for managing all views.
 * Accessible via Tools → Views in the admin menu.
 *
 * Uses the shared ViewDataTable component built on SharedDataTable.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useView } from '@/hooks/use-view';
import { ViewEditorDialog } from '@/components/views/view-editor-dialog';
import { Button } from '@/components/ui/button';
import { ViewDataTable } from './view-data-table';
import type { View } from '@/types/view';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ViewManagementPage() {
  const {
    views,
    pageSize,
    createView,
    updateView,
    deleteView,
    fetchViews,
    selectedView,
    setSelectedView,
    isSelectedViewLoading,
    isLoading,
    hasHydrated,
  } = useView();

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingViewId, setEditingViewId] = useState<string | undefined>(undefined);

  // Delete confirmation state
  const [deletingView, setDeletingView] = useState<View | null>(null);

  // Row selection state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Load views on mount (fetchViews is a stable Zustand action)
  useEffect(() => {
    if (hasHydrated) {
      fetchViews();
    }
  }, [hasHydrated, fetchViews]);

  // Fetch selected view with fields through store (cached per view)
  useEffect(() => {
    if (!showDialog) return;

    if (editingViewId && dialogMode === 'edit') {
      setSelectedView(editingViewId).catch((err) => {
        console.error('[ViewManagement] Failed to load view fields:', err);
      });
      return;
    }

    setSelectedView(null).catch((err) => {
      console.error('[ViewManagement] Failed to clear selected view:', err);
    });
  }, [showDialog, editingViewId, dialogMode, setSelectedView]);

  // Handlers
  const handleCreateView = useCallback(() => {
    setDialogMode('create');
    setEditingViewId(undefined);
    setShowDialog(true);
  }, []);

  const handleEditView = useCallback((viewId: string) => {
    setDialogMode('edit');
    setEditingViewId(viewId);
    setShowDialog(true);
  }, []);

  const handleDeleteClick = useCallback((view: View) => {
    setDeletingView(view);
  }, []);

  const handleConfirmDelete = async () => {
    if (deletingView) {
      await deleteView(deletingView.viewID);
      setDeletingView(null);
    }
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingViewId(undefined);
    setSelectedView(null).catch((err) => {
      console.error('[ViewManagement] Failed to clear selected view:', err);
    });
  };

  const handleCloseDeleteConfirm = () => {
    setDeletingView(null);
  };

  // Save handler for the dialog
  const handleSaveView = useCallback(async (viewName: string, fieldIds: string[]) => {
    if (dialogMode === 'create') {
      await createView(viewName, fieldIds);
    } else if (editingViewId) {
      await updateView(editingViewId, { viewName, selectedFieldIds: fieldIds });
    }
  }, [dialogMode, editingViewId, createView, updateView]);

  // Delete handler for the dialog
  const handleDeleteView = useCallback(async () => {
    if (editingViewId) {
      await deleteView(editingViewId);
    }
  }, [editingViewId, deleteView]);

  // Loading state
  if (!hasHydrated || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">View Management</h1>
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" data-testid="view-management-page">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">View Management</h1>
        <Button onClick={handleCreateView} data-testid="create-view-button">
          <Plus className="size-4" />
          Create New View
        </Button>
      </div>

      {/* Views Table — using shared data table */}
      <div className="bg-background rounded-lg shadow">
        <ViewDataTable
          views={views}
          isLoading={false}
          pageSize={pageSize}
          selectedRows={selectedRows}
          onSelectionChange={setSelectedRows}
          onEditView={handleEditView}
          onDeleteView={handleDeleteClick}
        />
      </div>

      {/* View Editor Dialog */}
      <ViewEditorDialog
        isOpen={showDialog}
        onClose={handleCloseDialog}
        mode={dialogMode}
        view={selectedView ?? undefined}
        isLoadingView={dialogMode === 'edit' ? isSelectedViewLoading : false}
        views={views}
        onSave={handleSaveView}
        onDelete={dialogMode === 'edit' ? handleDeleteView : undefined}
      />

      {/* Delete Confirmation Dialog */}
      {deletingView && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleCloseDeleteConfirm}
            aria-label="Close dialog"
            tabIndex={-1}
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="bg-background rounded-lg shadow-xl max-w-md w-full p-6"
              data-testid="delete-confirm-dialog"
            >
              <h2 className="text-lg font-semibold mb-4">Delete View</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete &quot;{deletingView.viewName}&quot;? This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCloseDeleteConfirm}
                  data-testid="cancel-delete-button"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmDelete}
                  data-testid="confirm-delete-button"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
