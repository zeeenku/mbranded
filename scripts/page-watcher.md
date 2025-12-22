# Page Auto-Generator

Automatically generates type-safe page templates when you create new `page.tsx` files in the admin app.

## How It Works

When you create a new `page.tsx` file in `app/(apps)/admin/(pages)/`, the watcher automatically:

1. **Detects the new file** (or files that don't have the `createPage` pattern)
2. **Extracts the route** from the file path
   - `(pages)/home/page.tsx` → `/admin/home`
   - `(pages)/brands/[id]/page.tsx` → `/admin/brands/[id]`
3. **Extracts params** from `[param]` folders
   - `[id]` folder → `{ id: string }` param
4. **Generates a template** with the correct `createPage` pattern

## Usage

### Option 1: Run with dev server (Recommended)

```bash
pnpm run dev:watch
```

This runs both the Next.js dev server and the page watcher together.

### Option 2: Run watcher separately

```bash
pnpm run page-watcher
```

Then in another terminal:
```bash
pnpm run dev
```

## Creating a New Page

1. **Create the file structure:**
   ```
   app/(apps)/admin/(pages)/your-route/page.tsx
   ```
   
   Or with dynamic params:
   ```
   app/(apps)/admin/(pages)/your-route/[id]/page.tsx
   ```

2. **Create an empty file or a file with minimal content**

3. **The watcher will auto-generate the template!**

   The generated template will include:
   - Proper route inference
   - Type-safe params (if using `[param]` folders)
   - `createPage` setup
   - Basic page structure

## Example

**Before (empty file):**
```tsx
// Empty or minimal content
```

**After (auto-generated):**
```tsx
/**
 * Admin Your Route Page
 * Route: /admin/your-route (auto-inferred)
 */

import { createPage } from '@/app/(apps)/admin/lib/create-page';

export const page = createPage({
  searchParams: {},
})(async ({ params, searchParams }) => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Your Route</h1>
      <p className="text-gray-600">Welcome to the your route page</p>
    </div>
  );
});

export default page;
```

## Dynamic Routes

For routes with params like `[id]`:

**File:** `(pages)/products/[id]/page.tsx`

**Auto-generated:**
```tsx
/**
 * Admin Products Detail Page
 * Route: /admin/products/[id] (auto-inferred)
 * Params: { id: string } (auto-inferred from [id] folder)
 */

import { createPage } from '@/app/(apps)/admin/lib/create-page';

export const page = createPage({
  searchParams: {},
})(async ({ params, searchParams }) => {
  const { id } = await params;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Products Detail</h1>
      <p className="text-gray-600">Welcome to the products detail page</p>
      <p className="text-gray-600">Id: {id}</p>
    </div>
  );
});

export default page;
```

## Notes

- The watcher only generates templates for files that:
  - Are empty or have minimal content (< 50 bytes)
  - Don't already have the `createPage` pattern
  - Are in the `app/(apps)/admin/(pages)/` directory

- Files with substantial content won't be overwritten - you'll get a warning instead

- Remember to manually update `route-types.ts` to add the new route to the `RoutePath` type union and `RouteSearchParams` for full type safety with `TypedLink`


