# Live Search Pattern

Standard client-side search/filter pattern for entity management pages.

## Overview

Every entity management page includes a search bar that filters the displayed
list by matching a search term against one or more text columns. The filtering
is done client-side using `useMemo` since entity lists are fully loaded.

## Implementation

### 1. Search State

```tsx
const [searchTerm, setSearchTerm] = useState('');
```

### 2. Search Fields Configuration

Define which fields are searchable. Use only string-typed fields from the entity
type. Place this as a const inside the component (or outside if static):

```tsx
// Fields to include in text search
const SEARCH_FIELDS: (keyof EntityType)[] = ['entityName', 'contactName', 'city'];
```

### 3. Filtered Data via useMemo

```tsx
const filteredEntities = useMemo(() => {
  if (!searchTerm.trim()) return entities;

  const lower = searchTerm.toLowerCase();
  return entities.filter((item) =>
    SEARCH_FIELDS.some((field) => {
      const value = item[field];
      return typeof value === 'string' && value.toLowerCase().includes(lower);
    })
  );
}, [entities, searchTerm]);
```

### 4. Search Input in Toolbar

```tsx
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
```

### 5. Pass Filtered Data to Table

```tsx
<EntityDataTable
  entities={filteredEntities}  // ← filtered, not raw
  ...
/>
```

## Notes

- **No debounce needed** for client-side filtering on arrays < 10k items
- For very large datasets, add a 300ms debounce:
  ```tsx
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  ```
  Then use `debouncedSearch` in the `useMemo` instead of `searchTerm`.
- The `SEARCH_FIELDS` array should match the entity's `searchFields` in the
  entity registry
- Only string fields should be included; numeric/boolean fields require
  different comparison logic
