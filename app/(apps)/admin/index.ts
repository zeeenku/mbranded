/**
 * Admin app entry point
 * Exports components and types
 */

export { AdminLayout } from './(components)/layouts/AdminLayout';
export { AdminNavigation } from './(components)/Navigation';

// Export types for use in pages
export type { 
  RoutePath, 
  RouteSearchParams, 
  PageProps,
  GetParams,
  GetSearchParams 
} from './lib/route-types';

