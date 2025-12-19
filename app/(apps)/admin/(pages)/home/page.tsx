/**
 * Admin Home Page
 * Route: /admin/home (auto-inferred)
 * 
 * Generic Types:
 * - First generic: Route params (none) → {}
 * - Second generic: Search/query params (none) → {}
 */

import { createPage } from '@/app/(apps)/admin/lib/create-page';

// Use import.meta.url for better route detection with Turbopack
const fileUrl = typeof import.meta !== 'undefined' && import.meta.url ? import.meta.url : undefined;

export const page = createPage<
  {},  // Route params: none (no [param] folders)
  {}   // Search params: none
>({
  filePath: fileUrl, // Pass file path for better detection
  searchParams: {},
})(async () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Hello Admin from Home</h1>
    </div>
  );
});

export default page;
