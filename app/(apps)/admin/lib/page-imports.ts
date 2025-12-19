/**
 * Type-safe page imports
 * Import page definitions to get type-safe params
 */

// Re-export page definitions for easy importing
export type { BrandDetailParams, BrandDetailSearchParams, BrandDetailRoute } from '../(pages)/brands/[id]/page';
export type { BrandsParams, BrandsSearchParams, BrandsRoute } from '../(pages)/brands/page';
export type { DashboardParams, DashboardSearchParams, DashboardRoute } from '../(pages)/dashboard/page';
export type { HomeParams, HomeSearchParams, HomeRoute } from '../(pages)/home/page';
export type { SettingsParams, SettingsSearchParams, SettingsRoute } from '../(pages)/settings/page';

// Helper to get params type from a page import
export type GetPageParams<T> = T extends { params: infer P } ? P : never;
export type GetPageSearchParams<T> = T extends { searchParams: infer S } ? S : never;

