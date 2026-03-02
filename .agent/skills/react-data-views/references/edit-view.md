# Edit / Detail View Reference

Complete annotated templates for implementing an edit form or detail view that
loads and saves server data. Replace `{Entity}` / `{entity}` with your domain name.

Assumes the Zustand store from the list view already exists. This reference
focuses on the hook and component layers for single-entity operations.

---

## 1. Form Hook (View-Model)

```typescript
// hooks/use-{entity}-form.ts

import { useEffect, useState, useCallback } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEntityStore } from '@/stores/use-{entity}-store';
import { Entity } from '@/types/{entity}';
import { useToast } from '@/components/ui/use-toast';

// --- Zod schema for validation ---
const entitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  // ... add fields matching your entity
});

export type EntityFormValues = z.infer<typeof entitySchema>;

interface UseEntityFormOptions {
  id?: string;              // undefined = create mode, string = edit mode
  onSuccess?: () => void;   // callback after save (e.g., navigate away)
}

interface UseEntityFormReturn {
  form: UseFormReturn<EntityFormValues>;
  onSubmit: (values: EntityFormValues) => Promise<void>;
  isLoading: boolean;       // initial data loading
  isSaving: boolean;        // mutation in progress
  error: string | null;
  isCreateMode: boolean;
  entity: Entity | null;    // loaded entity for display (read-only fields, etc.)
}

export function useEntityForm({
  id,
  onSuccess,
}: UseEntityFormOptions): UseEntityFormReturn {
  const { toast } = useToast();

  // --- Store selectors ---
  const entities = useEntityStore((s) => s.entities);
  const fetchEntities = useEntityStore((s) => s.fetchEntities);
  const createEntity = useEntityStore((s) => s.createEntity);
  const updateEntity = useEntityStore((s) => s.updateEntity);

  // --- Local state (form-specific, not global) ---
  const [isLoading, setIsLoading] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreateMode = !id;

  // --- react-hook-form with Zod validation ---
  const form = useForm<EntityFormValues>({
    resolver: zodResolver(entitySchema),
    defaultValues: {
      name: '',
      // ... defaults for all fields
    },
  });

  // --- Find entity from store (if edit mode) ---
  const entity = id ? entities.find((e) => e.id === id) ?? null : null;

  // --- Lifecycle: load entity data into form ---
  useEffect(() => {
    if (!id) return; // create mode — nothing to load

    const loadEntity = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // If entity is not in the store yet, fetch all
        // (or implement a dedicated getById action on the store)
        if (!entity) {
          await fetchEntities();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    };

    loadEntity();
  }, [id, entity, fetchEntities]);

  // --- Populate form when entity arrives ---
  useEffect(() => {
    if (entity) {
      form.reset({
        name: entity.name,
        // ... map entity fields to form values
      });
      setIsLoading(false);
    }
  }, [entity, form]);

  // --- Submit handler ---
  const onSubmit = useCallback(
    async (values: EntityFormValues) => {
      setIsSaving(true);
      setError(null);
      try {
        if (isCreateMode) {
          await createEntity(values);
          toast({ title: 'Created successfully' });
        } else {
          await updateEntity(id!, values);
          toast({ title: 'Updated successfully' });
        }
        onSuccess?.();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to save';
        setError(message);
        toast({ title: 'Error', description: message, variant: 'destructive' });
      } finally {
        setIsSaving(false);
      }
    },
    [id, isCreateMode, createEntity, updateEntity, toast, onSuccess]
  );

  return {
    form,
    onSubmit,
    isLoading,
    isSaving,
    error,
    isCreateMode,
    entity,
  };
}
```

**Key decisions:**
- `isLoading` (initial fetch) and `isSaving` (mutation) are separate flags
- Validation is Zod + react-hook-form — not hand-rolled
- The hook owns the `toast` side-effect, not the component
- `onSuccess` callback lets the component decide navigation
- Form `reset()` happens in a `useEffect` watching the entity, NOT in the fetch

---

## 2. Edit View Component

```tsx
// components/{Entity}EditView.tsx

import { useEntityForm } from '@/hooks/use-{entity}-form';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function EntityEditView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // --- Single hook call: the component's ONLY data source ---
  const {
    form,
    onSubmit,
    isLoading,
    isSaving,
    error,
    isCreateMode,
  } = useEntityForm({
    id,
    onSuccess: () => navigate('/entities'),
  });

  // --- Loading state ---
  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  // --- Error state ---
  if (error && !form.formState.isDirty) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // --- Render: map hook return values to shadcn-ui primitives ---
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isCreateMode ? 'Create Entity' : 'Edit Entity'}
        </CardTitle>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Inline error for save failures */}
            {error && form.formState.isDirty && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Add additional FormField blocks for each entity field */}
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/entities')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreateMode ? 'Create' : 'Save Changes'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
```

**Notice what the component does NOT do:**
- No `useEntityStore()` import
- No `fetch()` or API calls
- No validation logic (Zod + react-hook-form live in the hook)
- No toast calls (hook handles success/error notifications)
- It calls ONE hook and renders the results

---

## 3. Route Setup

```tsx
// Typical route configuration (React Router v6)

<Route path="/entities" element={<EntityListView />} />
<Route path="/entities/new" element={<EntityEditView />} />
<Route path="/entities/:id/edit" element={<EntityEditView />} />
```

The `EntityEditView` component handles both create and edit modes based on
whether `id` is present in the URL params. The hook detects this and adjusts
its behavior accordingly.

---

## 4. Extending for Detail (Read-Only) View

For a read-only detail view, create a simpler hook variant:

```typescript
// hooks/use-{entity}-detail.ts

export function useEntityDetail(id: string) {
  const entities = useEntityStore((s) => s.entities);
  const fetchEntities = useEntityStore((s) => s.fetchEntities);
  const [isLoading, setIsLoading] = useState(true);

  const entity = entities.find((e) => e.id === id) ?? null;

  useEffect(() => {
    if (!entity) {
      fetchEntities().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [entity, fetchEntities]);

  return { entity, isLoading };
}
```

The detail component then renders entity fields in read-only shadcn
components (`Badge`, `Separator`, description lists) rather than form inputs.