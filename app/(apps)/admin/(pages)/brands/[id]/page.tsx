/**
 * Admin Brand Detail Page
 * Route: /admin/brands/[id] (auto-inferred from file location)
 * 
 * Generic Types:
 * - First generic: Route params from [id] folder → { id: number }
 * - Second generic: Search/query params → { tab: 'details' | 'settings' | 'history' }
 */

import { createPage } from '@/app/(apps)/admin/lib/create-page';

// Route and params are automatically inferred from file location
// File: (pages)/brands/[id]/page.tsx
// → Route: /admin/brands/[id] (auto-detected)
// → Route params: { id: number } (from [id] folder, specified in first generic)
// → Search params: { tab: 'details' | 'settings' | 'history' } (specified in second generic)

// Use import.meta.url for better route detection with Turbopack
const fileUrl = typeof import.meta !== 'undefined' && import.meta.url ? import.meta.url : undefined;

export const page = createPage<
  { id: number },                                    // Route params: id from [id] folder (typed as number)
  { tab?: 'details' | 'settings' | 'history' }       // Search params: tab query param (optional)
>({
  filePath: fileUrl, // Pass file path for better detection
  searchParams: {
    tab: 'details',
  },
})(async ({ params, searchParams }) => {
  // ✅ params.id is typed as number (from generic)
  // ✅ searchParams.tab is typed from generic
  const { id: idString } = await params;
  const id = Number(idString); // Convert string to number (Next.js params are always strings)
  const { tab } = await searchParams;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Brand Details</h1>
      <p className="text-gray-600">Brand ID: {id}</p>
      {tab && <p className="text-gray-600">Active Tab: {tab}</p>}
    </div>
  );
});

export default page;
