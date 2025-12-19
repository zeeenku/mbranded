/**
 * Route Generation Configuration
 * 
 * Edit this file to configure route generation:
 * - Add/remove directories to scan
 * - Exclude specific routes
 * - Map routes to custom IDs
 * - Configure output location
 * 
 * Example:
 * ```ts
 * export const config: RouteGenConfig = {
 *   pagesDirs: [
 *     'app/(apps)/admin/(pages)',
 *     'app/(apps)/public/(pages)',
 *   ],
 *   exclude: ['/admin/test', '/admin/debug'],
 *   routeIdMap: {
 *     '/admin/brands/[id]': 'brandDetail',
 *   },
 * };
 * ```
 */

export interface RouteGenConfig {
  /**
   * Directories to scan for page files
   * Default: ['app/(apps)/admin/(pages)']
   */
  pagesDirs?: string[];
  
  /**
   * Output file path for generated routes
   * Default: 'app/(apps)/admin/lib/routes.d.ts'
   */
  outputFile?: string;
  
  /**
   * Routes to exclude from generation
   * Can use glob patterns or exact paths
   * Example: ['/admin/test', '/admin/debug']
   */
  exclude?: string[];
  
  /**
   * Routes to include (if specified, only these will be included)
   * Can use glob patterns or exact paths
   * Example: ['/admin/brands', '/admin/products']
   */
  include?: string[];
  
  /**
   * Custom route ID mappings
   * Map route paths to custom route IDs
   * Example: { '/admin/brands/[id]': 'brandDetail' }
   */
  routeIdMap?: Record<string, string>;
  
  /**
   * Whether to watch for changes in dev mode
   * Default: true
   */
  watch?: boolean;
}

const defaultConfig: RouteGenConfig = {
  pagesDirs: ['app/(apps)/admin/(pages)'],
  outputFile: 'app/(apps)/admin/lib/routes.d.ts',
  exclude: [],
  include: undefined, // undefined means include all
  routeIdMap: {},
  watch: true,
};

export function getRouteGenConfig(): RouteGenConfig {
  // Try to load user config if exported
  try {
    // Check if user has exported a config
    const userConfigModule = require('./route-gen.config');
    if (userConfigModule.config && typeof userConfigModule.config === 'object') {
      return {
        ...defaultConfig,
        ...userConfigModule.config,
      };
    }
  } catch {
    // If no user config, use defaults
  }
  
  return defaultConfig;
}

// Export config for user customization
// Edit this to customize route generation
export const config: RouteGenConfig = {
  ...defaultConfig,
  // Add your customizations here:
  // pagesDirs: ['app/(apps)/admin/(pages)', 'app/(apps)/public/(pages)'],
  // exclude: ['/admin/test'],
  // routeIdMap: { '/admin/brands/[id]': 'brandDetail' },
};

export default defaultConfig;

