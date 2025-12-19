# Admin App - Auto Type-Safe Pages

Fully automatic route and params inference from file location. Just define search params!

## Creating a New Page

### 1. Create the file

Create: `(pages)/your-route/[id]/page.tsx`

### 2. Use the template

```typescript
import { createPage } from '@/app/(apps)/admin/lib/create-page';

// Route and params are AUTO-INFERRED from file location!
// File: (pages)/brands/[id]/page.tsx
// → Route: /admin/brands/[id]
// → Params: { id: string } (from [id] folder)
export const page = createPage({
  // Only define search params - everything else is automatic!
  searchParams: {
    tab: 'details' as 'details' | 'settings',
  },
})(async ({ params, searchParams }) => {
  // ✅ params.id is auto-typed (from [id] folder)
  // ✅ searchParams.tab is typed from definition
  const { id } = await params;
  const { tab } = await searchParams;

  return (
    <div>
      <h1>Your Page</h1>
    </div>
  );
});

export default page;
```

That's it! No manual route, no manual params, no type exports needed.

## Importing Types (Global Source)

Import types from the global source:

```typescript
// Import from global source - no need to export from each page!
import type { 
  BrandDetailParams,
  BrandDetailSearchParams,
  BrandsParams,
  DashboardParams,
  // ... all page types available here
} from '@/app/(apps)/admin/lib/all-page-types';

// Use anywhere
function buildUrl(params: BrandDetailParams) {
  // Type-safe!
}
```

## How It Works

1. **Route Auto-Detection**: Extracted from file path via stack trace
2. **Params Auto-Detection**: Extracted from `[param]` folders in path
3. **Auto-Registration**: `createPage` automatically registers in singleton
4. **Global Types**: All types available from `all-page-types.ts`

## File Structure → Route Mapping

- `(pages)/home/page.tsx` → `/admin/home`, Params: `{}`
- `(pages)/brands/page.tsx` → `/admin/brands`, Params: `{}`
- `(pages)/brands/[id]/page.tsx` → `/admin/brands/[id]`, Params: `{ id: string }`
- `(pages)/users/[userId]/posts/[postId]/page.tsx` → `/admin/users/[userId]/posts/[postId]`, Params: `{ userId: string; postId: string }`

## Benefits

- ✅ **Zero config**: Just create file and use `createPage`
- ✅ **Auto route**: Inferred from file location
- ✅ **Auto params**: Inferred from folder structure
- ✅ **Auto registration**: Singleton auto-discovers
- ✅ **Global types**: Import from one place
- ✅ **Type-safe**: Full TypeScript support
