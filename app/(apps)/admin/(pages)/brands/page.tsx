/**
 * Admin Brands List Page
 * Route: /admin/brands (auto-inferred)
 * 
 * Generic Types:
 * - First generic: Route params (none) → {}
 * - Second generic: Search/query params → { page, search, sort }
 */

import { createPage } from '@/app/(apps)/admin/lib/create-page';

// Use import.meta.url for better route detection with Turbopack
const fileUrl = typeof import.meta !== 'undefined' && import.meta.url ? import.meta.url : undefined;

export const page = createPage<
  {},                                                    // Route params: none (no [param] folders)
  { page?: string; search?: string; sort?: 'name' | 'date' | 'status' }  // Search params
>({
  filePath: fileUrl, // Pass file path for better detection
  searchParams: {
    page: '1',
    search: '',
    sort: 'name',
  },
})(async ({ searchParams }) => {
  const { page = '1', search, sort = 'name' } = await searchParams;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Brands</h1>
      <p className="text-gray-600">Manage your brands here</p>
      <div className="mt-4 space-y-2">
        <p>Page: {page}</p>
        {search && <p>Search: {search}</p>}
        <p>Sort: {sort}</p>
      </div>
    </div>
  );
});

export default page;
