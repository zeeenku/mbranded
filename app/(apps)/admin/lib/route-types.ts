/**
 * File-based route type utilities
 * Uses auto-generated routes from routes.d.ts
 */

import type { routes, RouteId, RouteParamsMap, RoutePathToId } from './routes';

/**
 * Extract route params from a path string (fallback for routes not in generated file)
 * Example: '/admin/brands/[id]' → { id: string }
 */
export type ExtractParams<T extends string> = 
  T extends `${infer _Start}[${infer Param}]${infer Rest}`
    ? { [K in Param]: string } & ExtractParams<Rest>
    : {};

/**
 * Route path type - union of all generated route paths
 */
export type RoutePath = {
  [K in RouteId]: routes[K]['path']
}[RouteId];

/**
 * Create a reverse mapping from path to RouteId
 * This allows us to look up params by path string
 */
type PathToRouteId = {
  [K in RouteId]: routes[K]['path']
};

/**
 * Find the RouteId for a given RoutePath
 * Uses the generated RoutePathToId mapping for exact matching
 * This prevents /admin/brands/[id] from matching /admin/brands/[id]/[idd]
 */
type FindRouteIdByPath<TPath extends RoutePath> = 
  TPath extends keyof RoutePathToId
    ? RoutePathToId[TPath]
    : never;

/**
 * Helper to get params for a specific route path
 * Uses the generated routes.d.ts file
 * This enforces strict type checking - no number/string coercion
 * Uses RouteParamsMap which has explicit types (string vs number)
 */
export type GetParams<TPath extends RoutePath> = 
  FindRouteIdByPath<TPath> extends never
    ? ExtractParams<TPath>
    : FindRouteIdByPath<TPath> extends RouteId
      ? RouteParamsMap[FindRouteIdByPath<TPath>]
      : ExtractParams<TPath>;

/**
 * Helper to get search params for a specific route path
 * Uses the generated routes.d.ts file
 */
export type GetSearchParams<TPath extends RoutePath> = 
  FindRouteIdByPath<TPath> extends never
    ? {}
    : FindRouteIdByPath<TPath> extends RouteId
      ? routes[FindRouteIdByPath<TPath>]['search']
      : {};

/**
 * Type-safe page props based on file path
 * Usage: PageProps<'/admin/brands/[id]'>
 */
export type PageProps<TPath extends RoutePath> = {
  params: Promise<GetParams<TPath>>;
  searchParams: Promise<GetSearchParams<TPath>>;
};

