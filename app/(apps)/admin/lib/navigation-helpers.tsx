/**
 * Type-safe navigation helpers
 * TanStack Router-style API with route string inference
 */

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { RouteId, RouteParams, RouteSearch, RoutePathUnion, RoutePathToId } from './routes';
import { routes } from './routes';
import { routeRegistry } from './route-registry';

/**
 * Convert RoutePath to RouteId for type inference
 */
type PathToRouteId<TPath extends RoutePathUnion> = 
  TPath extends keyof RoutePathToId
    ? RoutePathToId[TPath]
    : never;

/**
 * Make params optional only if they're empty (for routes without params)
 * If params exist, they are REQUIRED
 * Enforces strict type checking - no coercion allowed
 * TanStack Router-style: uses path but enforces types via route ID
 */
type OptionalParams<TPath extends RoutePathUnion> = 
  PathToRouteId<TPath> extends RouteId
    ? keyof RouteParams<PathToRouteId<TPath>> extends never
      ? { params?: RouteParams<PathToRouteId<TPath>> }
      : { 
          // Params are REQUIRED when they exist
          // Enforce exact type matching - prevents number being passed where string is expected
          params: RouteParams<PathToRouteId<TPath>>
        }
    : { params?: never };

/**
 * Build a route string from a route template and params
 * Converts params to string for URL (but types are checked at call site)
 */
function buildRoute(
  routeTemplate: string,
  params?: Record<string, any>
): string {
  let route = routeTemplate;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      route = route.replace(`[${key}]`, String(value));
    }
  }
  return route;
}

/**
 * Build search params string from object
 */
function buildSearchParams(searchParams?: Record<string, any>): string {
  if (!searchParams || Object.keys(searchParams).length === 0) {
    return '';
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null) {
      search.append(key, String(value));
    }
  }
  return search.toString();
}

/**
 * Type-safe navigation hook (TanStack Router-style)
 * Usage:
 * ```ts
 * const navigate = useTypedNavigate();
 * navigate.push('/admin/brands/[id]', { id: '123' }, { tab: 'details' });
 * ```
 */
export function useTypedNavigate() {
  const router = useRouter();

  return {
    push: <TPath extends RoutePathUnion>(
      to: TPath,
      ...args: PathToRouteId<TPath> extends RouteId
        ? keyof RouteParams<PathToRouteId<TPath>> extends never
          ? [params?: RouteParams<PathToRouteId<TPath>>, search?: RouteSearch<PathToRouteId<TPath>> | ((prev: RouteSearch<PathToRouteId<TPath>>) => RouteSearch<PathToRouteId<TPath>>)]
          : [params: RouteParams<PathToRouteId<TPath>>, search?: RouteSearch<PathToRouteId<TPath>> | ((prev: RouteSearch<PathToRouteId<TPath>>) => RouteSearch<PathToRouteId<TPath>>)]
        : [params?: never, search?: never]
    ) => {
      // Look up route ID from path at runtime
      const routeIdMap: Record<string, RouteId> = {
        '/admin/brands': 'brands',
        '/admin/brands/[id]': 'brandsIdDetail',
        '/admin/brands/[id]/[idd]': 'brandsIdIddDetail',
        '/admin/dashboard': 'dashboard',
        '/admin/home': 'home',
        '/admin/settings': 'settings',
      };
      const routeId = routeIdMap[to];
      if (!routeId) {
        console.warn(`Route not found: ${to}`);
        return;
      }
      const params = args[0] as any;
      const search = args[1] as any;
      const route = buildRoute(to, params as Record<string, string | number> | undefined);
      const searchObj = typeof search === 'function' ? search({}) : search;
      const searchString = buildSearchParams(searchObj);
      const finalRoute = searchString ? `${route}?${searchString}` : route;
      // @ts-expect-error - Next.js router types are strict but string works at runtime
      router.push(finalRoute);
    },
    replace: <TPath extends RoutePathUnion>(
      to: TPath,
      ...args: PathToRouteId<TPath> extends RouteId
        ? keyof RouteParams<PathToRouteId<TPath>> extends never
          ? [params?: RouteParams<PathToRouteId<TPath>>, search?: RouteSearch<PathToRouteId<TPath>> | ((prev: RouteSearch<PathToRouteId<TPath>>) => RouteSearch<PathToRouteId<TPath>>)]
          : [params: RouteParams<PathToRouteId<TPath>>, search?: RouteSearch<PathToRouteId<TPath>> | ((prev: RouteSearch<PathToRouteId<TPath>>) => RouteSearch<PathToRouteId<TPath>>)]
        : [params?: never, search?: never]
    ) => {
      // Look up route ID from path at runtime
      const routeIdMap: Record<string, RouteId> = {
        '/admin/brands': 'brands',
        '/admin/brands/[id]': 'brandsIdDetail',
        '/admin/brands/[id]/[idd]': 'brandsIdIddDetail',
        '/admin/dashboard': 'dashboard',
        '/admin/home': 'home',
        '/admin/settings': 'settings',
      };
      const routeId = routeIdMap[to];
      if (!routeId) {
        console.warn(`Route not found: ${to}`);
        return;
      }
      const params = args[0] as any;
      const search = args[1] as any;
      const route = buildRoute(to, params as Record<string, string | number> | undefined);
      const searchObj = typeof search === 'function' ? search({}) : search;
      const searchString = buildSearchParams(searchObj);
      const finalRoute = searchString ? `${route}?${searchString}` : route;
      // @ts-expect-error - Next.js router types are strict but string works at runtime
      router.replace(finalRoute);
    },
  };
}

/**
 * Type-safe Link component (TanStack Router-style)
 * Uses route paths but enforces types via route ID mapping
 * 
 * Usage:
 * ```tsx
 * <TypedLink
 *   to="/admin/brands/[id]"
 *   params={{ id: '123' }}
 *   search={{ tab: 'details' }}
 * >
 *   Brand Details
 * </TypedLink>
 * 
 * // Or with search function:
 * <TypedLink
 *   to="/admin/brands/[id]"
 *   params={{ id: '123' }}
 *   search={(prev) => ({ ...prev, tab: 'details' })}
 * >
 *   Brand Details
 * </TypedLink>
 * ```
 */
export function TypedLink<
  TPath extends RoutePathUnion
>({
  to,
  params,
  search,
  children,
  ...props
}: {
  to: TPath;
} & OptionalParams<TPath> & {
  search?: PathToRouteId<TPath> extends RouteId
    ? RouteSearch<PathToRouteId<TPath>> | ((prev: RouteSearch<PathToRouteId<TPath>>) => RouteSearch<PathToRouteId<TPath>>)
    : never;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'to'>) {
  // Look up route ID from path at runtime
  const routeIdMap: Record<string, RouteId> = {
    '/admin/brands': 'brands',
    '/admin/brands/[id]': 'brandsIdDetail',
    '/admin/brands/[id]/[idd]': 'brandsIdIddDetail',
    '/admin/dashboard': 'dashboard',
    '/admin/home': 'home',
    '/admin/settings': 'settings',
  };
  const routeId = routeIdMap[to];
  // Type-check params at call site - this ensures strict type checking
  const typedParams = params as Record<string, any> | undefined;
  const route = buildRoute(to, typedParams);
  const searchObj = typeof search === 'function' 
    ? (search as any)({})
    : search;
  const searchString = buildSearchParams(searchObj);
  const href = searchString ? `${route}?${searchString}` : route;

  return (
    // @ts-expect-error - Next.js Link types are strict but string works at runtime
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}


