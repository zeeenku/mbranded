/**
 * Centralized route exports
 * Import route definitions and types from here
 */

// Import all page classes to register them
import '@/app/(apps)/admin/(pages)/home/page';
import '@/app/(apps)/admin/(pages)/dashboard/page';
import '@/app/(apps)/admin/(pages)/brands/page';
import '@/app/(apps)/admin/(pages)/brands/[id]/page';
import '@/app/(apps)/admin/(pages)/settings/page';

// Re-export types for easy importing
export type { BrandDetailParams, BrandDetailSearchParams, BrandDetailRoute } from '../(pages)/brands/[id]/page';
export type { BrandsParams, BrandsSearchParams, BrandsRoute } from '../(pages)/brands/page';
export type { DashboardParams, DashboardSearchParams, DashboardRoute } from '../(pages)/dashboard/page';
export type { HomeParams, HomeSearchParams, HomeRoute } from '../(pages)/home/page';
export type { SettingsParams, SettingsSearchParams, SettingsRoute } from '../(pages)/settings/page';

// Export route registry
export { routeRegistry } from './route-registry';

