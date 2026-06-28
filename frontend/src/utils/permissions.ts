import { User, Role } from '../types';

export const hasPermission = (user: User | null | undefined, userRole: Role | null | undefined, permission: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin' || user.permissions?.includes('all') || userRole?.permissions?.includes('all')) return true;

    // Direct user permission
    if (user.permissions?.includes(permission)) return true;

    // Role-based permission (if Role object exists and contains the permission)
    if (userRole && userRole.permissions?.includes(permission)) return true;
    
    return false;
};

/**
 * Decorator-like Higher Order Function that wraps a business logic method.
 * If the user doesn't have permission, throws an Error.
 * 
 * Usage:
 * const safeVoidItem = withPermissionCheck(user, role, 'void_item', (item) => { ... });
 */
export const withPermissionCheck = <T extends (...args: any[]) => any>(
    user: User | null | undefined,
    userRole: Role | null | undefined,
    permission: string,
    action: T
): (...funcArgs: Parameters<T>) => ReturnType<T> => {
    return (...args: Parameters<T>): ReturnType<T> => {
        if (!hasPermission(user, userRole, permission)) {
            throw new Error(`ليس لديك صلاحية للقيام بهذا الإجراء (${permission})`);
        }
        return action(...args);
    };
};
