/**
 * Admin Navigation Component
 * Uses type-safe navigation with route strings
 */

'use client';

import { TypedLink, useTypedNavigate } from '@/app/(apps)/admin/lib/navigation-helpers';

export function AdminNavigation() {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Admin Panel</h2>
          <div className="flex gap-4">
            <TypedLink to="/admin/home" className="text-gray-600 hover:text-gray-900">
              Home
            </TypedLink>
            <TypedLink to="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </TypedLink>
            <TypedLink to="/admin/brands" className="text-gray-600 hover:text-gray-900">
              Brands
            </TypedLink>
            <TypedLink to="/admin/settings" className="text-gray-600 hover:text-gray-900">
              Settings
            </TypedLink>
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 * Example: Navigate to a brand detail page programmatically
 */
export function BrandLink({ brandId }: { brandId: string }) {
  const navigate = useTypedNavigate();

  const handleClick = () => {
    // ✅ Type-safe navigation - id is typed, tab is typed
    navigate.push('/admin/brands/[id]', { id: brandId }, { tab: 'details' });
  };

  return (
    <button onClick={handleClick} className="text-blue-600 hover:underline">
      View Brand {brandId}
    </button>
  );
}
