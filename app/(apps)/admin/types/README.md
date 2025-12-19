# Type-Safe Route & Search Params

This directory contains type definitions for route params and search params.

## Usage

### 1. Define Route Params

In `types/routes.ts`, define your route params:

```typescript
export type RouteParams = {
  '/admin/brands/[id]': {
    id: string;
  };
  '/admin/users/[userId]/posts/[postId]': {
    userId: string;
    postId: string;
  };
};
```

### 2. Define Search Params

Also in `types/routes.ts`, define search params:

```typescript
export type SearchParams = {
  '/admin/brands': {
    page?: string;
    search?: string;
    sort?: 'name' | 'date';
  };
  '/admin/brands/[id]': {
    tab?: 'details' | 'settings';
  };
};
```

### 3. Use in Pages

In your page components:

```typescript
import type { PageProps } from '@/app/(apps)/admin/lib/page-types';

type Props = PageProps<'/admin/brands/[id]'>;

export default async function BrandPage({ params, searchParams }: Props) {
  // params.id is typed as string
  // searchParams.tab is typed as 'details' | 'settings' | undefined
  
  const { id } = await params;
  const { tab } = await searchParams;
  
  return <div>Brand {id}, Tab: {tab}</div>;
}
```

## Benefits

- ✅ **Type-safe params**: TypeScript knows exactly what params each route has
- ✅ **Type-safe search params**: Query string params are typed
- ✅ **Autocomplete**: IDE suggests available params
- ✅ **Compile-time errors**: Catch typos and missing params
- ✅ **No runtime overhead**: Pure TypeScript types

## Adding New Routes

1. Add route to `RouteParams` type
2. Add search params to `SearchParams` type
3. Use `PageProps<'/your/route'>` in your page component

