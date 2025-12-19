/**
 * Create a type-safe page with automatic route and params inference
 * Route and params are automatically inferred from file location
 */

import { routeRegistry } from './route-registry';

type PageComponent<
  TParams extends Record<string, any> = {},
  TSearchParams extends Record<string, any> = {}
> = (props: {
  params: Promise<TParams>;
  searchParams: Promise<TSearchParams>;
}) => Promise<React.ReactElement> | React.ReactElement;

/**
 * Extract route and params from call stack
 * This works by analyzing the file path from the stack trace
 * Supports both Webpack and Turbopack formats
 */
function getRouteFromCallSite(callerUrl?: string): { route: string; params: Record<string, any> } {
  // Try using callerUrl if provided (from import.meta.url)
  if (callerUrl) {
    try {
      const url = new URL(callerUrl);
      const pathname = url.pathname;
      const route = extractRouteFromPath(pathname);
      if (route) {
        return route;
      }
    } catch {
      // Fall through to stack trace method
    }
  }
  
  // Fallback to stack trace method
  const stack = new Error().stack || '';
  const lines = stack.split('\n');
  
  // Find the line that contains the page file
  for (const line of lines) {
    // Try to extract route from various formats:
    // 1. Standard: (pages)/.../page.tsx
    // 2. With app: (apps)/admin/(pages)/.../page.tsx
    // 3. Turbopack: mbranded_app_(apps)_admin_(pages)_home_page_tsx
    // 4. Windows paths: ...\\(pages)\\...\\page.tsx
    
    // Try standard pattern first
    let match = line.match(/(?:\(apps\)[\\/]admin[\\/])?\(pages\)[\\/](.+?)[\\/]page\.tsx/);
    if (match) {
      const pathSegment = match[1].replace(/\\/g, '/');
      const hasAdminPrefix = line.includes('(apps)/admin') || line.includes('(apps)\\admin');
      const route = hasAdminPrefix ? `/admin/${pathSegment}` : `/${pathSegment}`;
      
      const params: Record<string, any> = {};
      const paramMatches = route.match(/\[([^\]]+)\]/g);
      if (paramMatches) {
        paramMatches.forEach(match => {
          const paramName = match.slice(1, -1);
          params[paramName] = '';
        });
      }
      
      return { route, params };
    }
    
    // Try Turbopack format: mbranded_app_(apps)_admin_(pages)_home_page_tsx
    // Also handles: mbranded_app_(apps)_admin_(pages)_brands_[id]_page_tsx
    // Pattern: (pages)_<path>_page_tsx - capture everything between markers
    match = line.match(/\(pages\)_(.+?)_page_tsx/);
    if (match) {
      // Convert underscores back to path segments, but preserve brackets
      // home -> /admin/home
      // brands_[id] -> /admin/brands/[id]
      // brands_[id]_[idd] -> /admin/brands/[id]/[idd]
      let pathSegment = match[1];
      // Replace underscores with slashes, but keep brackets intact
      // Handle patterns like: brands_[id] or brands_123_[id]
      pathSegment = pathSegment
        .replace(/_\[/g, '/[')  // _[ -> /[
        .replace(/\]_/g, ']/')  // ]_ -> ]/
        .replace(/_/g, '/');     // remaining _ -> /
      const route = `/admin/${pathSegment}`;
      
      const params: Record<string, any> = {};
      const paramMatches = route.match(/\[([^\]]+)\]/g);
      if (paramMatches) {
        paramMatches.forEach(match => {
          const paramName = match.slice(1, -1);
          params[paramName] = '';
        });
      }
      
      return { route, params };
    }
    
    // Try any path that contains (pages) and page.tsx
    match = line.match(/(?:\(apps\)[\\/]admin[\\/])?\(pages\)[\\/](.+?)[\\/]page\.tsx/);
    if (match) {
      const pathSegment = match[1].replace(/\\/g, '/');
      const hasAdminPrefix = line.includes('(apps)/admin') || line.includes('(apps)\\admin');
      const route = hasAdminPrefix ? `/admin/${pathSegment}` : `/${pathSegment}`;
      
      const params: Record<string, any> = {};
      const paramMatches = route.match(/\[([^\]]+)\]/g);
      if (paramMatches) {
        paramMatches.forEach(match => {
          const paramName = match.slice(1, -1);
          params[paramName] = '';
        });
      }
      
      return { route, params };
    }
  }
  
  throw new Error('Could not extract route from file location. Make sure you are calling createPage from a page.tsx file.');
}

/**
 * Extract route from a file path string
 */
function extractRouteFromPath(pathname: string): { route: string; params: Record<string, any> } | null {
  // Normalize path separators
  const normalized = pathname.replace(/\\/g, '/');
  
  // Try various path patterns
  const patterns = [
    // Standard: (pages)/.../page.tsx or (apps)/admin/(pages)/.../page.tsx
    /(?:\(apps\)\/admin\/)?\(pages\)\/(.+?)\/page\.tsx/,
    // Windows paths with backslashes (already normalized)
    /(?:\(apps\)\\admin\\)?\(pages\)\\(.+?)\\page\.tsx/,
    // Turbopack chunk: (pages)_<path>_page_tsx (captures everything between markers)
    /\(pages\)_(.+?)_page_tsx/,
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      let pathSegment = match[1];
      
      // Handle Turbopack format (underscores, but preserve brackets)
      if (pathSegment.includes('_') && !pathSegment.includes('/') && !pathSegment.includes('\\')) {
        // Replace underscores with slashes, but keep brackets intact
        pathSegment = pathSegment.replace(/_\[/g, '/[').replace(/\]_/g, ']/').replace(/_/g, '/');
      } else {
        pathSegment = pathSegment.replace(/\\/g, '/');
      }
      
      const hasAdminPrefix = normalized.includes('(apps)/admin') || normalized.includes('(apps)\\admin') || normalized.includes('(apps)_admin');
      const route = hasAdminPrefix ? `/admin/${pathSegment}` : `/${pathSegment}`;
      
      const params: Record<string, any> = {};
      const paramMatches = route.match(/\[([^\]]+)\]/g);
      if (paramMatches) {
        paramMatches.forEach(match => {
          const paramName = match.slice(1, -1);
          params[paramName] = '';
        });
      }
      
      return { route, params };
    }
  }
  
  return null;
}

/**
 * Create a type-safe page with automatic route and params inference
 * 
 * Generic parameters:
 * - TParams: Route params (from [id] folders) - e.g., { id: number }
 * - TSearchParams: Search/query params - e.g., { tab: 'details' | 'settings' }
 * 
 * Usage:
 * ```tsx
 * // Route params (from [id] folder) + Search params
 * export const page = createPage<
 *   { id: number },           // Route params: id from [id] folder, typed as number
 *   { tab: 'details' | 'settings' | 'history' }  // Search params: tab query param
 * >({
 *   searchParams: { tab: 'details' },
 * })(async ({ params, searchParams }) => {
 *   const { id } = await params; // Typed as number
 *   const { tab } = await searchParams; // Typed as union
 *   return <div>Brand {id}, Tab: {tab}</div>;
 * });
 * 
 * export default page;
 * ```
 */
export function createPage<
  TParams extends Record<string, any> = {},      // Route params from [param] folders
  TSearchParams extends Record<string, any> = {} // Search/query params
>(
  config: {
    searchParams: TSearchParams;
    route?: string; // Optional override if auto-detection fails
    params?: TParams; // Optional override for typing
    filePath?: string; // Optional file path for better detection (use import.meta.url)
  } = {} as any
) {
  // Auto-detect route and params from file location
  let route: string;
  let params: Record<string, any>;

  // Try auto-detection first
  try {
    // Try using filePath if provided (from import.meta.url)
    let detected: { route: string; params: Record<string, any> } | null = null;
    
    if (config.filePath) {
      try {
        // Handle both file:// URLs and file paths
        let pathToUse = config.filePath;
        if (config.filePath.startsWith('file://')) {
          const url = new URL(config.filePath);
          pathToUse = url.pathname;
          // On Windows, remove leading slash from pathname
          if (process.platform === 'win32' && pathToUse.startsWith('/')) {
            pathToUse = pathToUse.slice(1);
          }
        }
        const extracted = extractRouteFromPath(pathToUse);
        if (extracted) {
          detected = extracted;
        }
      } catch {
        // Fall through
      }
    }
    
    // If filePath didn't work, try stack trace
    if (!detected) {
      detected = getRouteFromCallSite(config.filePath);
    }
    
    route = detected.route;
    params = detected.params;
    
    // If params were provided in config, use them for typing (but keep detected structure)
    if (config.params) {
      // Update params to match config structure for typing
      Object.keys(config.params).forEach(key => {
        // Keep the detected param but ensure it exists
        if (!(key in params)) {
          params[key] = typeof config.params![key] === 'number' ? 0 : '';
        }
      });
    }
  } catch (error) {
    // Fallback to manual route if auto-detection fails
    if (config.route) {
      route = config.route;
      params = config.params || {};
      
      // Extract params from route if not provided
      if (!config.params) {
        const paramMatches = route.match(/\[([^\]]+)\]/g);
        if (paramMatches) {
          paramMatches.forEach(match => {
            const paramName = match.slice(1, -1);
            params[paramName] = ''; // Default to string
          });
        }
      }
    } else {
      throw new Error(
        `Route auto-detection failed. Please provide route: createPage({ route: '/admin/your-route', searchParams: {...} })`
      );
    }
  }
  

  // Register route in singleton
  routeRegistry.register({
    route,
    params,
    searchParams: config.searchParams,
  });

  // Store definition globally for type exports
  const definitionKey = `__page_def_${route.replace(/\//g, '_').replace(/\[|\]/g, '')}`;
  (globalThis as any)[definitionKey] = {
    route,
    params,
    searchParams: config.searchParams,
  };

  // Return page component factory
  // Use TParams for typing if provided, otherwise infer from detected params
  type FinalParams = keyof TParams extends never ? typeof params : TParams;
  
  return (component: PageComponent<FinalParams, TSearchParams>) => {
    // Store definition on component
    (component as any).__pageDefinition = {
      route,
      params,
      searchParams: config.searchParams,
    };
    
    return component;
  };
}

/**
 * Get page definition by route
 */
export function getPageDefinitionByRoute(route: string) {
  const key = `__page_def_${route.replace(/\//g, '_').replace(/\[|\]/g, '')}`;
  return (globalThis as any)[key] as {
    route: string;
    params: Record<string, any>;
    searchParams: Record<string, any>;
  } | undefined;
}
