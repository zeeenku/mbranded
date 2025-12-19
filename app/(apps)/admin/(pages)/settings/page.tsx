/**
 * Admin Settings Page
 * Route: /admin/settings (auto-inferred)
 * 
 * Generic Types:
 * - First generic: Route params (none) → {}
 * - Second generic: Search/query params → { section }
 */

import { createPage } from '@/app/(apps)/admin/lib/create-page';

// Use import.meta.url for better route detection with Turbopack
const fileUrl = typeof import.meta !== 'undefined' && import.meta.url ? import.meta.url : undefined;

export default createPage<
  {},                    // Route params: none (no [param] folders)
  { section?: string }  // Search params
>({
  filePath: fileUrl, // Pass file path for better detection
  searchParams: {
    section: '',
  },
})(async ({ searchParams }) => {
  const { section } = await searchParams;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <p className="text-gray-600">Configure your admin settings</p>
      {section && <p className="text-sm text-gray-500">Section: {section}</p>}
    </div>
  );
});
