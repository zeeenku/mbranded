/**
 * File-based route type helper
 * Automatically infers route path from file location
 * 
 * Usage in page files:
 * ```ts
 * import { definePage } from '@/app/(apps)/admin/lib/file-route';
 * 
 * export default definePage('/admin/brands/[id]', async ({ params, searchParams }) => {
 *   const { id } = await params; // Type: string
 *   const { tab } = await searchParams; // Type: 'details' | 'settings' | 'history' | undefined
 *   return <div>...</div>;
 * });
 * ```
 */

import type { PageProps, RoutePath } from './route-types';

/**
 * Define a page component with type-safe params
 */
export function definePage<TPath extends RoutePath>(
  path: TPath,
  component: (props: PageProps<TPath>) => Promise<React.ReactElement> | React.ReactElement
) {
  return component;
}

/**
 * Helper to get the route path from file location
 * This can be used to automatically infer the path
 * 
 * Usage:
 * ```ts
 * const route = getRouteFromFile(__filename); // '/admin/brands/[id]'
 * ```
 */
export function getRouteFromFile(filePath: string): RoutePath {
  // Extract route from file path
  // app/(apps)/admin/(pages)/brands/[id]/page.tsx → /admin/brands/[id]
  const match = filePath.match(/\(pages\)\/(.+?)\/page\.tsx?$/);
  if (!match) {
    throw new Error(`Could not extract route from file path: ${filePath}`);
  }
  
  const route = `/${match[1]}`.replace(/\[([^\]]+)\]/g, '[$1]');
  return route as RoutePath;
}

