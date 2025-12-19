/**
 * Page template generator
 * Use this as a template when creating new pages
 */

/**
 * Template for a new page file:
 * 
 * ```typescript
 * import { createPage } from '@/app/(apps)/admin/lib/create-page';
 * 
 * // Route and params are auto-inferred from file location
 * // File: (pages)/brands/[id]/page.tsx → Route: /admin/brands/[id], Params: { id: string }
 * export const page = createPage({
 *   searchParams: {
 *     // Define your search params here
 *     tab: 'details' as 'details' | 'settings',
 *   },
 * })(async ({ params, searchParams }) => {
 *   // params are auto-typed from folder structure
 *   // searchParams are typed from the definition above
 *   const { id } = await params;
 *   const { tab } = await searchParams;
 * 
 *   return (
 *     <div>
 *       <h1>Your Page</h1>
 *     </div>
 *   );
 * });
 * 
 * export default page;
 * ```
 */

// This is just a template - not actual code
export const TEMPLATE = 'See comments above';

