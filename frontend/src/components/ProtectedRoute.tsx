import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const userString = localStorage.getItem('nima_user');
  const sessionUser = userString ? JSON.parse(userString) : null;
  const location = useLocation();
  const roles = useLiveQuery(() => db.roles.toArray());
  const dbUser = useLiveQuery(() => sessionUser?.id ? db.users.get(sessionUser.id) : undefined);

  if (!sessionUser || Object.keys(sessionUser).length === 0) {
    return <Navigate to="/" replace />;
  }

  // Wait for roles and DB user verification
  if (!roles || dbUser === undefined) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-slate-50">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
      );
  }

  // Logged in user not found in DB, deactivated, or PIN mismatch (tampring detection)
  if (!dbUser || !dbUser.isActive || sessionUser.pin !== dbUser.pin) {
      localStorage.removeItem('nima_user');
      return <Navigate to="/" replace />;
  }

  const user = dbUser;
  const role = user.role || 'cashier';
  const userRoleObj = roles.find(r => r.name === role);
  const rolePermissions = userRoleObj?.permissions || [];
  const allPermissions = Array.from(new Set([...(user.permissions || []), ...rolePermissions]));

  const isAdmin = role === 'admin' || allPermissions.includes('all');

  // Simple base path checking
  const checkPath = `/${location.pathname.split('/')[1]}`;
  const hasPermission = isAdmin || allPermissions.includes(checkPath) || allPermissions.includes(location.pathname) || (location.pathname === '/' && allPermissions.includes('/'));
  
  if (!hasPermission && location.pathname !== '/') {
      return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
