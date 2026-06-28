import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'nima_user';

export interface SessionUser {
  id: number;
  name: string;
  username?: string;
  role: string;
  pin: string;
  isActive: boolean;
  canRefund?: boolean;
  permissions?: string[];
  branchId?: number;
}

/**
 * Hook to get the current user from localStorage.
 * Single source of truth for user identity across the app.
 */
export function useCurrentUser(): SessionUser | null {
  const [user, setUser] = useState<SessionUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return user;
}

/**
 * Non-hook version for use in non-React contexts (event handlers, utilities).
 */
export function getCurrentUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Set the current user in localStorage.
 */
export function setCurrentUser(user: SessionUser | null): void {
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Clear the current user session.
 */
export function clearCurrentUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}
