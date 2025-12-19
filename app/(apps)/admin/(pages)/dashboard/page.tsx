/**
 * Admin Dashboard Page
 * Route: /admin/dashboard (auto-inferred)
 * 
 * Generic Types:
 * - First generic: Route params (none) → {}
 * - Second generic: Search/query params → { page, filter }
 */

import { createPage } from '@/app/(apps)/admin/lib/create-page';
import { TypedLink } from '@/app/(apps)/admin/lib/navigation-helpers';

// Use import.meta.url for better route detection with Turbopack
const fileUrl = typeof import.meta !== 'undefined' && import.meta.url ? import.meta.url : undefined;

export const page = createPage<
  {},                              // Route params: none (no [param] folders)
  { page?: string; filter?: string }  // Search params
>({
  filePath: fileUrl, // Pass file path for better detection
  searchParams: {
    page: '1',
    filter: '',
  },
})(async ({ searchParams }) => {
  const { page, filter } = await searchParams;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-gray-600">Welcome to the admin dashboard</p>
      {page && <p className="text-sm text-gray-500">Page: {page}</p>}
      {filter && <p className="text-sm text-gray-500">Filter: {filter}</p>}
      
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">Test Links</h2>
        <div className="flex flex-col gap-2">
          <TypedLink
            to="/admin/brands/[id]"
            params={{ id: 123 }}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View Test Brand (ID: 123)
          </TypedLink>
          <TypedLink
            to="/admin/brands/[id]"
            params={{ id: 456 }}
            search={{ tab: 'settings' }}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View Another Brand with Settings Tab (ID: 456)
          </TypedLink>
          <TypedLink
            to="/admin/brands/[id]"
            params={{ id: 789 }}
            search={{ tab: 'history' }}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            View Brand History (ID: 789)
          </TypedLink>
        </div>
      </div>
    </div>
  );
});

export default page;
