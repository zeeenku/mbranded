/**
 * Admin Layout Component
 * Provides shared layout for all admin routes
 */

import { AdminNavigation } from '../Navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <main>{children}</main>
    </div>
  );
}

