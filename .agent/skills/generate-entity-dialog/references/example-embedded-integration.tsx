/**
 * Acquisitions List Page
 *
 * Demonstrates the full view-driven data table pattern with real-time updates.
 * This serves as the reference implementation for other entity list pages.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DataTable } from '@/components/tables/data-table';
import { ViewSelector } from '@/components/views/view-selector';
import { ViewEditorDialog } from '@/components/views/view-editor-dialog';
import { useView } from '@/hooks/use-view';
import { useViewColumns } from '@/hooks/use-view-columns';
import { useAuth } from '@/hooks/use-auth';
import { useAcquisition } from '@/hooks/use-acquisition';
import { getDisplayFields } from '@/lib/api-client';
import type { Acquisition } from '@/types/acquisition';
import type { DisplayField } from '@/types/view';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AcquisitionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    views,
    fetchViews, 
    hasHydrated: viewsHydrated,
    createView,
    updateView,
    deleteView,
    selectedView,
    setSelectedView,
    isSelectedViewLoading,
  } = useView();
  const { roles } = useAuth();
  
  // Acquisition state from store (includes real-time updates)
  const {
    acquisitions,
    selectedAcquisitionId,
    isLoading: acquisitionsLoading,
    error: acquisitionsError,
    hasHydrated: acquisitionsHydrated,
    fetchAcquisitions,
    setSelectedAcquisition,
    clearError,
    exportAcquisitionsToCSV,
  } = useAcquisition();

  // Get view column state for export
  const { visibleColumns, columnOrder } = useViewColumns();

  // Local UI state
  const [displayFields, setDisplayFields] = useState<DisplayField[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showViewEditor, setShowViewEditor] = useState(false);
  const [viewEditorMode, setViewEditorMode] = useState<'create' | 'edit'>('create');
  const [editingViewId, setEditingViewId] = useState<string | undefined>(undefined);

  // Fetch selected view with fields through store (cached per view)
  useEffect(() => {
    if (!showViewEditor) return;

    if (editingViewId && viewEditorMode === 'edit') {
      setSelectedView(editingViewId).catch((err) => {
        console.error('[Acquisitions] Failed to load view fields:', err);
      });
      return;
    }

    setSelectedView(null).catch((err) => {
      console.error('[Acquisitions] Failed to clear selected view:', err);
    });
  }, [showViewEditor, editingViewId, viewEditorMode, setSelectedView]);

  // Combined hydration check
  const hasHydrated = viewsHydrated && acquisitionsHydrated;

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch acquisitions, display fields, and views in parallel
        await Promise.all([
          fetchAcquisitions(),
          getDisplayFields('acquisition').then(setDisplayFields),
          fetchViews(),
        ]);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    if (hasHydrated) {
      loadData();
    }
  }, [hasHydrated, fetchAcquisitions, fetchViews]);

  // Restore selected acquisition from URL query parameter
  useEffect(() => {
    const acquisitionId = searchParams.get('acquisitionId');
    if (acquisitionId && acquisitionId !== selectedAcquisitionId) {
      setSelectedAcquisition(acquisitionId);
    }
  }, [searchParams, selectedAcquisitionId, setSelectedAcquisition]);

  // Row selection handler
  const handleRowSelect = useCallback(
    (acquisition: Acquisition) => {
      setSelectedAcquisition(acquisition.acquisitionId);
      
      // Update URL query parameter
      const params = new URLSearchParams(searchParams.toString());
      params.set('acquisitionId', acquisition.acquisitionId);
      router.push(`/acquisitions?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, setSelectedAcquisition]
  );

  // Navigation actions
  const handleNewAcquisition = useCallback(() => {
    router.push('/acquisitions/new');
  }, [router]);

  const handleEditAcquisition = useCallback(() => {
    if (selectedAcquisitionId) {
      router.push(`/acquisitions/${selectedAcquisitionId}/edit`);
    }
  }, [router, selectedAcquisitionId]);

  const handleDeleteAcquisition = async () => {
    if (!selectedAcquisitionId) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this acquisition?'
    );

    if (confirmed) {
      try {
        // TODO: Implement delete API call
        // await deleteAcquisition(selectedAcquisitionId);
        
        // Refresh the list
        await fetchAcquisitions();
        setSelectedAcquisition(null);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete acquisition');
      }
    }
  };

  // View management
  const handleManageViews = (viewId?: string) => {
    if (viewId) {
      setViewEditorMode('edit');
      setEditingViewId(viewId);
    } else {
      setViewEditorMode('create');
      setEditingViewId(undefined);
    }
    setShowViewEditor(true);
  };

  const handleCloseViewEditor = () => {
    setShowViewEditor(false);
    setEditingViewId(undefined);
    setSelectedView(null).catch((err) => {
      console.error('[Acquisitions] Failed to clear selected view:', err);
    });
  };

  // View editor save handler
  const handleSaveView = useCallback(async (viewName: string, fieldIds: string[]) => {
    if (viewEditorMode === 'create') {
      await createView(viewName, fieldIds);
    } else if (editingViewId) {
      await updateView(editingViewId, { viewName, selectedFieldIds: fieldIds });
    }
  }, [viewEditorMode, editingViewId, createView, updateView]);

  // View editor delete handler
  const handleDeleteView = useCallback(async () => {
    if (editingViewId) {
      await deleteView(editingViewId);
    }
  }, [editingViewId, deleteView]);

  // Export handler
  const handleExport = useCallback(() => {
    // Convert visibleColumns map to column visibility object
    const columnVisibility: Record<string, boolean> = {};
    Object.entries(visibleColumns).forEach(([fieldId, isVisible]) => {
      columnVisibility[fieldId] = isVisible;
    });

    exportAcquisitionsToCSV(displayFields, columnVisibility, columnOrder);
  }, [exportAcquisitionsToCSV, displayFields, visibleColumns, columnOrder]);

  // Search functionality
  const filteredAcquisitions = React.useMemo(() => {
    if (!searchQuery.trim()) return acquisitions;

    const query = searchQuery.toLowerCase();
    return acquisitions.filter((acq) =>
      Object.values(acq).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  }, [acquisitions, searchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N: New acquisition
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewAcquisition();
      }

      // Enter: Edit selected acquisition
      if (e.key === 'Enter' && selectedAcquisitionId) {
        e.preventDefault();
        handleEditAcquisition();
      }

      // Ctrl/Cmd + F: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAcquisitionId, handleNewAcquisition, handleEditAcquisition]);

  // Loading state
  if (!hasHydrated || acquisitionsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="h-10 w-48 bg-muted animate-pulse rounded mb-6" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  // Error state
  if (acquisitionsError) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Acquisitions</h1>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
          <p className="text-red-600 dark:text-red-400">{acquisitionsError}</p>
          <button
            type="button"
            onClick={clearError}
            className="mt-2 px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  // Toolbar actions (reusable pattern)
  const toolbarActions = (
    <div className="flex items-center gap-4">
      {/* Search */}
      <input
        id="search-input"
        type="text"
        placeholder="Search acquisitions..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="px-3 py-2 border rounded-md w-64"
        data-testid="search-input"
      />

      {/* View Selector - REUSABLE */}
      <ViewSelector onManageViews={handleManageViews} />

      {/* Entity-specific actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={handleExport}
          disabled={acquisitions.length === 0}
          className="px-4 py-2 border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="export-button"
        >
          Export CSV
        </button>

        <button
          type="button"
          onClick={handleNewAcquisition}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
          data-testid="new-button"
        >
          New Acquisition
        </button>

        <button
          type="button"
          onClick={handleEditAcquisition}
          disabled={!selectedAcquisitionId}
          className="px-4 py-2 border rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="edit-button"
        >
          Edit
        </button>

        {/* Admin only: Delete button */}
        {roles?.includes('Administrator') && (
          <button
            type="button"
            onClick={handleDeleteAcquisition}
            disabled={!selectedAcquisitionId}
            className="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="delete-button"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6" data-testid="acquisitions-page">
      {/* Page Header */}
      <h1 className="text-2xl font-bold mb-6">Acquisitions</h1>

      {/* Data Table - REUSABLE PATTERN */}
      <DataTable<Acquisition>
        data={filteredAcquisitions}
        entityType="acquisition"
        displayFields={displayFields}
        selectedRowId={selectedAcquisitionId ?? undefined}
        onRowSelect={handleRowSelect}
        toolbarActions={toolbarActions}
        emptyState={
          <div className="text-center">
            <p className="text-lg font-medium">No acquisitions found</p>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by creating your first acquisition
            </p>
            <button
              type="button"
              onClick={handleNewAcquisition}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Create Acquisition
            </button>
          </div>
        }
      />

      {/* View Editor Dialog - REUSABLE */}
      <ViewEditorDialog
        isOpen={showViewEditor}
        onClose={handleCloseViewEditor}
        mode={viewEditorMode}
        view={selectedView ?? undefined}
        isLoadingView={viewEditorMode === 'edit' ? isSelectedViewLoading : false}
        views={views}
        onSave={handleSaveView}
        onDelete={viewEditorMode === 'edit' ? handleDeleteView : undefined}
      />
    </div>
  );
}
