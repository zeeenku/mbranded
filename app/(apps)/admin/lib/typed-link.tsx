/**
 * Type-safe Link component using route IDs
 * Uses generated routes.d.ts for type safety
 */

'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { RouteId, RouteParams, RouteSearch, RoutePath } from './routes';
import { routes } from './routes';
import type { RoutePath as OldRoutePath, GetParams, GetSearchParams } from './route-types';

/**
 * Build a route string from a route template and params
 */
function buildRoute(
  routeTemplate: string,
  params?: Record<string, string | number>
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
 * Make params optional if they're empty
 */
type OptionalParams<TRouteId extends RouteId> = 
  keyof RouteParams<TRouteId> extends never 
    ? { params?: RouteParams<TRouteId> }
    : { params: RouteParams<TRouteId> };

/**
 * Find route ID from route path
 */
function findRouteIdByPath(path: string): RouteId | null {
  for (const [routeId, routeDef] of Object.entries(routes)) {
    if (routeDef.path === path) {
      return routeId as RouteId;
    }
  }
  return null;
}

/**
 * Type-safe Link component - accepts both route IDs and route paths
 * 
 * Usage with route ID:
 * ```tsx
 * <TypedLink
 *   to="brandsIdDetail"
 *   params={{ id: 123 }}
 *   search={{ tab: 'settings' }}
 * >
 *   Brand Details
 * </TypedLink>
 * ```
 * 
 * Usage with route path (backward compatible):
 * ```tsx
 * <TypedLink
 *   to="/admin/brands/[id]"
 *   params={{ id: 123 }}
 *   search={{ tab: 'settings' }}
 * >
 *   Brand Details
 * </TypedLink>
 * ```
 */
export function TypedLink<
  TRouteId extends RouteId | OldRoutePath
>({
  to,
  params,
  search,
  children,
  ...props
}: {
  to: TRouteId;
} & (
  TRouteId extends RouteId
    ? OptionalParams<TRouteId> & { search?: RouteSearch<TRouteId> }
    : TRouteId extends OldRoutePath
    ? { params?: GetParams<TRouteId> } & { search?: GetSearchParams<TRouteId> }
    : never
) & {
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, 'href' | 'to'>) {
  // Check if to is a route ID or a route path
  const routeId = to in routes ? (to as RouteId) : findRouteIdByPath(to as string);
  
  let routePath: string;
  let finalParams: Record<string, string | number> | undefined;
  let finalSearch: Record<string, any> | undefined;
  
  if (routeId) {
    // Using route ID
    const routeDef = routes[routeId];
    routePath = routeDef.path;
    finalParams = params as Record<string, string | number> | undefined;
    finalSearch = search as Record<string, any> | undefined;
  } else {
    // Using route path (backward compatible)
    routePath = to as string;
    finalParams = params as Record<string, string | number> | undefined;
    finalSearch = search as Record<string, any> | undefined;
  }
  
  const route = buildRoute(routePath, finalParams);
  const searchString = buildSearchParams(finalSearch);
  const href = searchString ? `${route}?${searchString}` : route;

  return (
    // @ts-expect-error - Next.js Link types are strict but string works at runtime
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}

/**
 * Type-safe navigation hook using route IDs
 */
export function useTypedNavigate() {
  const router = useRouter();

  return {
    push: <TRouteId extends RouteId>(
      to: TRouteId,
      ...args: keyof RouteParams<TRouteId> extends never
        ? [params?: RouteParams<TRouteId>, search?: RouteSearch<TRouteId>]
        : [params: RouteParams<TRouteId>, search?: RouteSearch<TRouteId>]
    ) => {
      const params = args[0] as RouteParams<TRouteId> | undefined;
      const search = args[1] as RouteSearch<TRouteId> | undefined;
      const routeDef = routes[to];
      const route = buildRoute(routeDef.path, params as Record<string, string | number> | undefined);
      const searchString = buildSearchParams(search as Record<string, any> | undefined);
      const finalRoute = searchString ? `${route}?${searchString}` : route;
      // @ts-expect-error - Next.js router types are strict but string works at runtime
      router.push(finalRoute);
    },
    replace: <TRouteId extends RouteId>(
      to: TRouteId,
      ...args: keyof RouteParams<TRouteId> extends never
        ? [params?: RouteParams<TRouteId>, search?: RouteSearch<TRouteId>]
        : [params: RouteParams<TRouteId>, search?: RouteSearch<TRouteId>]
    ) => {
      const params = args[0] as RouteParams<TRouteId> | undefined;
      const search = args[1] as RouteSearch<TRouteId> | undefined;
      const routeDef = routes[to];
      const route = buildRoute(routeDef.path, params as Record<string, string | number> | undefined);
      const searchString = buildSearchParams(search as Record<string, any> | undefined);
      const finalRoute = searchString ? `${route}?${searchString}` : route;
      // @ts-expect-error - Next.js router types are strict but string works at runtime
      router.replace(finalRoute);
    },
  };
}

