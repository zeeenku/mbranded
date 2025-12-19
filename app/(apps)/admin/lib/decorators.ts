/**
 * TypeScript decorators for route definitions
 */

/**
 * Route parameter decorator
 * Defines a route parameter with its type
 */
export function RouteParam(type: 'string' | 'number' = 'string') {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // Store param metadata
    if (!target.constructor.routeParams) {
      target.constructor.routeParams = [];
    }
    target.constructor.routeParams.push({
      index: parameterIndex,
      name: propertyKey as string,
      type,
    });
  };
}

/**
 * Search parameter decorator
 * Defines a search/query parameter with its type
 */
export function SearchParam(type: 'string' | 'number' | 'boolean' = 'string', defaultValue?: any) {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    if (!target.constructor.searchParams) {
      target.constructor.searchParams = [];
    }
    target.constructor.searchParams.push({
      index: parameterIndex,
      name: propertyKey as string,
      type,
      defaultValue,
    });
  };
}

/**
 * Route definition decorator
 * Defines the route path for a page class
 */
export function Route(path: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    constructor.prototype.route = path;
    return constructor;
  };
}

