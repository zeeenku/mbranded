/**
 * Base page class with decorator support
 */

import type { PagePropsFromDefinition } from './page-definition';

/**
 * Base page class that all pages extend
 */
export abstract class BasePage<
  TParams extends Record<string, any> = {},
  TSearchParams extends Record<string, any> = {}
> {
  // Route metadata (set by decorators)
  static route?: string;
  static routeParams?: Array<{ index: number; name: string; type: string }>;
  static searchParams?: Array<{ index: number; name: string; type: string; defaultValue?: any }>;

  // Instance properties
  params: Promise<TParams>;
  searchParams: Promise<TSearchParams>;

  constructor(props: PagePropsFromDefinition<{
    route: string;
    params: TParams;
    searchParams: TSearchParams;
  }>) {
    this.params = props.params;
    this.searchParams = props.searchParams;
  }

  /**
   * Render method - must be implemented by subclasses
   */
  abstract render(): Promise<React.ReactElement> | React.ReactElement;

  /**
   * Get route definition
   */
  static getRouteDefinition() {
    const route = (this as any).route || '';
    const params: Record<string, any> = {};
    const searchParams: Record<string, any> = {};

    // Build params from decorators
    if ((this as any).routeParams) {
      (this as any).routeParams.forEach((param: any) => {
        params[param.name] = param.type === 'number' ? 0 : '';
      });
    }

    // Build search params from decorators
    if ((this as any).searchParams) {
      (this as any).searchParams.forEach((param: any) => {
        searchParams[param.name] = param.defaultValue ?? (param.type === 'number' ? 0 : param.type === 'boolean' ? false : '');
      });
    }

    return {
      route,
      params,
      searchParams,
    };
  }
}

