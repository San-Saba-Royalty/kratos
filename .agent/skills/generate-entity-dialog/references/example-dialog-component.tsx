/**
 * View Editor Dialog Component
 *
 * Dialog for creating and editing views with field selection and reordering.
 * Uses Radix Dialog primitives for accessibility (focus trap, Esc key, screen reader).
 * Drag-and-drop reordering via @dnd-kit.
 * 
 * Architecture:
 * - Receives view data via props (not fetching internally)
 * - Calls onSave/onDelete callbacks (not using store directly)
 * - Optimistic updates handled by parent component/store
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { toast } from 'sonner';
import { getDisplayFields } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { DisplayField, ViewWithFields, View } from '@/types/view';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ViewEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  view?: ViewWithFields; // Only provided in edit mode
  isLoadingView?: boolean;
  views: View[]; // All views for duplicate name checking
  onSave: (viewName: string, fieldIds: string[]) => Promise<void>;
  onDelete?: () => Promise<void>;
}

const dedupeFieldIds = (fieldIds: string[]): string[] => {
  const seen = new Set<string>();
  return fieldIds.filter((fieldId) => {
    if (!fieldId || seen.has(fieldId)) return false;
    seen.add(fieldId);
    return true;
  });
};

const normalizeDisplayFields = (fields: DisplayField[]): DisplayField[] => {
  const uniqueFields = new Map<string, DisplayField>();

  for (const field of fields) {
    if (!field.fieldId || uniqueFields.has(field.fieldId)) continue;
    uniqueFields.set(field.fieldId, field);
  }

  return Array.from(uniqueFields.values());
};

// ---------------------------------------------------------------------------
// Sortable Field Item Component
// ---------------------------------------------------------------------------

interface SortableFieldItemProps {
  field: DisplayField;
  onRemove: (fieldId: string) => void;
}

const SortableFieldItem: React.FC<SortableFieldItemProps> = ({ field, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.fieldId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2 bg-muted rounded group"
      data-testid={`selected-field-${field.fieldId}`}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${field.fieldName}`}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="text-sm flex-1">{field.fieldName}</span>
      <button
        type="button"
        onClick={() => onRemove(field.fieldId)}
        className="cursor-pointer text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Remove ${field.fieldName}`}
        data-testid={`remove-field-${field.fieldId}`}
      >
        <X className="size-4" />
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const ViewEditorDialog: React.FC<ViewEditorDialogProps> = ({
  isOpen,
  onClose,
  mode,
  view,
  isLoadingView = false,
  views,
  onSave,
  onDelete,
}) => {
  // Form state
  const [viewName, setViewName] = useState('');
  const [availableFields, setAvailableFields] = useState<DisplayField[]>([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Track initial state for change detection
  const [initialViewName, setInitialViewName] = useState('');
  const [initialFieldIds, setInitialFieldIds] = useState<string[]>([]);
  const isEditViewLoading = mode === 'edit' && (isLoadingView || !view);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load available fields when dialog opens
  useEffect(() => {
    let cancelled = false;
    
    if (isOpen) {
      getDisplayFields('acquisition').then((fields) => {
        if (!cancelled) {
          setAvailableFields(normalizeDisplayFields(fields));
        }
      }).catch((err) => {
        console.error('[ViewEditor] Failed to load fields:', err);
        toast.error('Failed to load available fields');
      });
    }
    
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        // Create mode: reset to empty
        setViewName('');
        setSelectedFieldIds([]);
        setInitialViewName('');
        setInitialFieldIds([]);
      } else if (!isEditViewLoading && view) {
        // Edit mode: populate from selected view once fields are ready
        const name = view.viewName;
        const fields = view.fields ?? [];
        const sortedFieldIds = dedupeFieldIds(
          fields
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((field) => field.fieldId)
        );

        setViewName(name);
        setSelectedFieldIds(sortedFieldIds);
        setInitialViewName(name);
        setInitialFieldIds(sortedFieldIds);
      }
      setValidationError(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, mode, view, isEditViewLoading]);

  // Detect if form has changes (for edit mode)
  const hasChanges = React.useMemo(() => {
    if (mode === 'create') return true; // Always allow create
    
    const nameChanged = viewName.trim() !== initialViewName;
    const fieldsChanged = 
      selectedFieldIds.length !== initialFieldIds.length ||
      selectedFieldIds.some((id, index) => id !== initialFieldIds[index]);
    
    return nameChanged || fieldsChanged;
  }, [mode, viewName, initialViewName, selectedFieldIds, initialFieldIds]);

  // Validation
  const validate = (): boolean => {
    if (!viewName.trim()) {
      setValidationError('View name is required');
      return false;
    }

    if (viewName.trim().length < 3) {
      setValidationError('View name must be at least 3 characters');
      return false;
    }

    if (viewName.length > 100) {
      setValidationError('View name must be 100 characters or less');
      return false;
    }

    // Check for duplicate name (excluding current view in edit mode)
    const duplicate = views.find(
      (v) => v.viewName === viewName.trim() && v.viewID !== view?.viewID
    );
    if (duplicate) {
      setValidationError('A view with this name already exists');
      return false;
    }

    if (selectedFieldIds.length === 0) {
      setValidationError('Please select at least one field');
      return false;
    }

    setValidationError(null);
    return true;
  };

  // Check if form is valid (for disabling save button)
  const isFormValid = React.useMemo(() => {
    if (isEditViewLoading) return false;
    if (!viewName.trim() || viewName.trim().length < 3) return false;
    if (viewName.length > 100) return false;
    
    const duplicate = views.find(
      (v) => v.viewName === viewName.trim() && v.viewID !== view?.viewID
    );
    if (duplicate) return false;
    
    if (selectedFieldIds.length === 0) return false;
    
    // For edit mode, must have changes
    if (mode === 'edit' && !hasChanges) return false;
    
    return true;
  }, [isEditViewLoading, viewName, views, view?.viewID, selectedFieldIds.length, mode, hasChanges]);

  // Handlers
  const handleToggleField = (fieldId: string) => {
    setSelectedFieldIds((prev) =>
      prev.includes(fieldId)
        ? prev.filter((id) => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleRemoveField = (fieldId: string) => {
    setSelectedFieldIds((prev) => prev.filter((id) => id !== fieldId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedFieldIds((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    if (isEditViewLoading) return;
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave(viewName.trim(), selectedFieldIds);
      toast.success(mode === 'create' ? 'View created successfully' : 'View updated successfully');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save view';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsSaving(true);
    try {
      await onDelete();
      toast.success('View deleted successfully');
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete view';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Derive selected fields from selectedFieldIds, preserving order
  const selectedFields = selectedFieldIds
    .map((id) => availableFields.find((f) => f.fieldId === id))
    .filter((f): f is DisplayField => f !== undefined);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className="sm:max-w-2xl max-h-[80vh] flex flex-col p-0 gap-0"
        data-testid="view-editor-dialog"
      >
        {/* Header with different background */}
        <DialogHeader className="px-6 py-4 bg-muted/30 border-b">
          <DialogTitle>
            {mode === 'create' ? 'Create New View' : 'Edit View'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Choose which fields to include and arrange their order.'
              : 'Modify the fields and their display order for this view.'}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-y-auto flex-1 space-y-6 px-6 py-4">
          {isEditViewLoading ? (
            <div
              className="rounded-md bg-muted/30 px-4 py-6 text-sm text-muted-foreground"
              data-testid="view-editor-loading"
            >
              Loading view fields...
            </div>
          ) : (
            <>
              {/* View Name */}
              <div>
                <label htmlFor="viewName" className="block text-sm font-medium mb-2">
                  View Name
                </label>
                <input
                  id="viewName"
                  type="text"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border-0 ring-1 ring-border rounded-md focus:ring-2 focus:ring-ring transition-shadow"
                  placeholder="Enter view name"
                  maxLength={100}
                  data-testid="view-name-input"
                />
              </div>

              {/* Field Selection */}
              <div>
                <h3 className="text-sm font-medium mb-2">Available Fields</h3>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto bg-muted/30 rounded-md p-3">
                  {availableFields.map((field) => (
                    <label
                      key={field.fieldId}
                      className="flex items-center gap-2 cursor-pointer hover:bg-background/50 px-2 py-1 rounded transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFieldIds.includes(field.fieldId)}
                        onChange={() => handleToggleField(field.fieldId)}
                        className="rounded cursor-pointer"
                        data-testid={`field-checkbox-${field.fieldId}`}
                      />
                      <span className="text-sm">{field.fieldName}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Selected Fields (Reorderable) */}
              {selectedFieldIds.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Selected Fields ({selectedFieldIds.length})
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    Drag to reorder · Hover to remove
                  </p>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={selectedFieldIds}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {selectedFields.map((field) => (
                          <SortableFieldItem
                            key={field.fieldId}
                            field={field}
                            onRemove={handleRemoveField}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}

              {/* Validation Error */}
              {validationError && (
                <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive" data-testid="validation-error">
                  {validationError}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row items-center justify-between sm:justify-between px-6 py-4 border-t bg-muted/30">
          <div>
            {mode === 'edit' && !showDeleteConfirm && onDelete && !isEditViewLoading && (
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving || isEditViewLoading}
                data-testid="delete-button"
              >
                Delete
              </Button>
            )}
            {showDeleteConfirm && !isEditViewLoading && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Delete this view?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isSaving}
                  data-testid="confirm-delete-button"
                >
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  data-testid="cancel-delete-button"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              data-testid="cancel-button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isEditViewLoading || !isFormValid}
              data-testid="save-button"
            >
              {isSaving ? 'Saving...' : mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
