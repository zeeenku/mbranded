/**
 * Global type exports for all pages
 * Automatically collects all page definitions
 */

import { routeRegistry } from './route-registry';
import { getPageDefinitionByRoute } from './create-page';

/**
 * Get all registered routes and their types
 * This is populated when pages are loaded
 */
export function getAllPageTypes() {
  const routes = routeRegistry.getAllRoutes();
  
  return routes.map(route => ({
    route: route.route,
    params: route.params,
    searchParams: route.searchParams,
  }));
}

/**
 * Re-export types from all pages
 * These are auto-generated when pages are loaded
 */

// Brand Detail Page
export type BrandDetailParams = ReturnType<typeof getPageDefinitionByRoute> extends { params: infer P } ? P : never;
export type BrandDetailSearchParams = ReturnType<typeof getPageDefinitionByRoute> extends { searchParams: infer S } ? S : never;

// Helper to get types for a specific route
export function getPageTypes<T extends string>(route: T) {
  const def = getPageDefinitionByRoute(route);
  if (!def) return null;
  
  return {
    params: def.params,
    searchParams: def.searchParams,
    route: def.route,
  } as const;
}

// Type helpers
export type PageParamsOf<T extends string> = 
  ReturnType<typeof getPageDefinitionByRoute> extends { params: infer P } ? P : never;

export type PageSearchParamsOf<T extends string> = 
  ReturnType<typeof getPageDefinitionByRoute> extends { searchParams: infer S } ? S : never;

