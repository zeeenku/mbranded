/**
 * Singleton route registry
 * Automatically discovers routes from createPage calls
 */

type RouteDefinition = {
  route: string;
  params: Record<string, any>;
  searchParams: Record<string, any>;
};

class RouteRegistry {
  private static instance: RouteRegistry;
  private routes: Map<string, RouteDefinition> = new Map();
  private initialized = false;

  private constructor() {}

  static getInstance(): RouteRegistry {
    if (!RouteRegistry.instance) {
      RouteRegistry.instance = new RouteRegistry();
    }
    return RouteRegistry.instance;
  }

  /**
   * Register a route
   */
  register(definition: RouteDefinition) {
    this.routes.set(definition.route, definition);
  }

  /**
   * Get route by path
   */
  getRoute(path: string): RouteDefinition | undefined {
    // Try exact match first
    let route = this.routes.get(path);
    if (route) return route;

    // Try pattern matching for dynamic routes
    for (const [routePath, routeDef] of this.routes.entries()) {
      if (this.matchesRoute(routePath, path)) {
        return routeDef;
      }
    }

    return undefined;
  }

  /**
   * Check if route path matches pattern
   */
  private matchesRoute(pattern: string, path: string): boolean {
    const patternRegex = pattern
      .replace(/\[([^\]]+)\]/g, '([^/]+)')
      .replace(/\//g, '\\/');
    const regex = new RegExp(`^${patternRegex}$`);
    return regex.test(path);
  }

  /**
   * Extract params from path
   */
  extractParams(pattern: string, path: string): Record<string, string> {
    const paramNames = (pattern.match(/\[([^\]]+)\]/g) || []).map(p => p.slice(1, -1));
    const patternRegex = pattern
      .replace(/\[([^\]]+)\]/g, '([^/]+)')
      .replace(/\//g, '\\/');
    const regex = new RegExp(`^${patternRegex}$`);
    const match = path.match(regex);

    if (!match) return {};

    const params: Record<string, string> = {};
    paramNames.forEach((name, index) => {
      params[name] = match[index + 1] || '';
    });

    return params;
  }

  /**
   * Get all routes
   */
  getAllRoutes(): RouteDefinition[] {
    return Array.from(this.routes.values());
  }

  /**
   * Initialize registry - loads all routes
   * Routes are registered when createPage is called (on module load)
   */
  async initialize() {
    if (this.initialized) return;

    // Import all pages to trigger createPage registration
    // Routes are registered when createPage is called during import
    const pages = [
      () => import('../(pages)/home/page'),
      () => import('../(pages)/dashboard/page'),
      () => import('../(pages)/brands/page'),
      () => import('../(pages)/brands/[id]/page'),
      () => import('../(pages)/settings/page'),
    ];

    for (const loader of pages) {
      try {
        await loader();
        // createPage already registered the route during import
      } catch (error) {
        console.warn('Failed to load page:', error);
      }
    }

    this.initialized = true;
    console.log(`Route registry initialized with ${this.routes.size} routes`);
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export const routeRegistry = RouteRegistry.getInstance();

// Initialize on module load (server start)
if (typeof window === 'undefined') {
  routeRegistry.initialize().catch(console.error);
}
