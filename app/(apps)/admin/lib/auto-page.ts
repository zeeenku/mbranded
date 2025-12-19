/**
 * Automatic page creation with file path inference
 * Uses a helper that must be called with file context
 */

import { routeRegistry } from './route-registry';

/**
 * Create page with automatic route and params from file path
 * This version requires the file path to be passed
 * 
 * In practice, you'd use a build-time tool or a different approach
 * For now, we'll use a simpler pattern where route is inferred from a pattern
 */

/**
 * Helper to create route from relative path
 * Usage: autoCreatePage(__filename) or autoCreatePage(import.meta.url)
 */
export function autoCreatePage<
  TSearchParams extends Record<string, any> = {}
>(
  filePathOrRoute: string,
  config: {
    searchParams: TSearchParams;
  }
) {
  // Extract route from file path
  // Pattern: .../(pages)/brands/[id]/page.tsx → /admin/brands/[id]
  let route: string;
  let params: Record<string, any> = {};

  if (filePathOrRoute.startsWith('/')) {
    // Already a route
    route = filePathOrRoute;
  } else {
    // Extract from file path
    const normalized = filePathOrRoute.replace(/\\/g, '/');
    const match = normalized.match(/\(pages\)[\/](.+?)[\/]page\.tsx/);
    if (!match) {
      throw new Error(`Could not extract route from path: ${filePathOrRoute}`);
    }
    route = `/${match[1]}`;
  }

  // Extract params from route
  const paramMatches = route.match(/\[([^\]]+)\]/g);
  if (paramMatches) {
    paramMatches.forEach(match => {
      const paramName = match.slice(1, -1);
      params[paramName] = '' as string;
    });
  }

  // Register in singleton
  routeRegistry.register({
    route,
    params,
    searchParams: config.searchParams,
  });

  // Store globally
  const definitionKey = `__page_def_${route.replace(/\//g, '_').replace(/\[|\]/g, '')}`;
  (globalThis as any)[definitionKey] = {
    route,
    params,
    searchParams: config.searchParams,
  };

  return {
    route,
    params,
    searchParams: config.searchParams,
  };
}

