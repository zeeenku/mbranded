/**
 * Page definition class - defines route params and search params
 * Route is set when creating the instance (matches file path)
 */

/**
 * Base class for page definitions
 * Extend this to define your page's params and search params
 */
export abstract class PageDefinition<
  TParams extends Record<string, any> = {},
  TSearchParams extends Record<string, any> = {}
> {
  // Route path (set when creating instance)
  abstract readonly route: string;
  
  // These are set by the class definition
  abstract readonly params: TParams;
  abstract readonly searchParams: TSearchParams;
}
