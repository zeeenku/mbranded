/**
 * Global exports for all page types
 * Auto-generated from registered routes
 * Import from here to get type-safe params for any page
 */

import { routeRegistry } from './route-registry';
import { getPageDefinitionByRoute } from './create-page';

/**
 * Get types for a specific route
 * Usage: const types = getPageTypes('/admin/brands/[id]');
 */
export function getPageTypes(route: string) {
  const def = getPageDefinitionByRoute(route);
  if (!def) {
    // Try to get from registry
    const routeDef = routeRegistry.getRoute(route);
    if (routeDef) {
      return {
        params: routeDef.params,
        searchParams: routeDef.searchParams,
        route: routeDef.route,
      } as const;
    }
    return null;
  }
  
  return {
    params: def.params,
    searchParams: def.searchParams,
    route: def.route,
  } as const;
}

/**
 * Type helper to get params for a route
 */
export type PageParams<TRoute extends string> = 
  ReturnType<typeof getPageTypes<TRoute>> extends { params: infer P } ? P : never;

/**
 * Type helper to get search params for a route
 */
export type PageSearchParams<TRoute extends string> = 
  ReturnType<typeof getPageTypes<TRoute>> extends { searchParams: infer S } ? S : never;

// Pre-defined type exports for known routes (auto-complete friendly)
export type BrandDetailParams = PageParams<'/admin/brands/[id]'>;
export type BrandDetailSearchParams = PageSearchParams<'/admin/brands/[id]'>;

export type BrandsParams = PageParams<'/admin/brands'>;
export type BrandsSearchParams = PageSearchParams<'/admin/brands'>;

export type DashboardParams = PageParams<'/admin/dashboard'>;
export type DashboardSearchParams = PageSearchParams<'/admin/dashboard'>;

export type HomeParams = PageParams<'/admin/home'>;
export type HomeSearchParams = PageSearchParams<'/admin/home'>;

export type SettingsParams = PageParams<'/admin/settings'>;
export type SettingsSearchParams = PageSearchParams<'/admin/settings'>;

