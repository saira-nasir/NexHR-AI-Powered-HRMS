import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setPermissions } from '@/store/authSlice';
import rolePermissionService, { Role, Permission } from '@/services/rolePermissionService';
import { getUserRole } from '@/utils/roleUtils';
import { toast } from 'sonner';

/**
 * Custom hook to sync user permissions on login/mount.
 * Ensures that the Redux store has the latest permissions for the user's role.
 */
export const usePermissionSync = () => {
    const dispatch = useDispatch();
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        const syncPermissions = async () => {
            if (!isAuthenticated || !user) return;

            setIsSyncing(true);
            try {
                let roleId: number | undefined;

                // 1. Try to get Role ID directly from user object
                // The user object shape might vary based on backend response
                const userAny = user as any;

                // Scenario A: user.roles is an array of Role objects
                if (Array.isArray(userAny.roles) && userAny.roles.length > 0 && typeof userAny.roles[0] === 'object') {
                    roleId = Number(userAny.roles[0].id);
                }

                // Scenario B: user.role is a Role object
                else if (userAny.role && typeof userAny.role === 'object' && userAny.role.id) {
                    roleId = Number(userAny.role.id);
                }

                // 2. If ID not found, match by name
                if (!roleId) {
                    const roleName = getUserRole(user) as string; // Cast to string for flexible comparison
                    const allRoles = await rolePermissionService.listRoles();

                    // Find role by name (case insensitive match)
                    const matchedRole = allRoles.find(r =>
                        r.name.toLowerCase() === roleName.toLowerCase() ||
                        (r.name === 'Finance' && roleName === 'Finance Manager') ||
                        (r.name === 'Finance Manager' && roleName === 'Finance')
                    );

                    if (matchedRole) {
                        roleId = matchedRole.id;
                    }
                }

                // 3. If we found a Role ID, fetch its permissions
                if (roleId) {
                    // Use getRole instead of getRolePermissions to avoid 404 if custom endpoint missing
                    // Assuming getRole returns the role with nested permissions (standard DRF nested serializer)
                    const roleData = await rolePermissionService.getRole(roleId);

                    if (roleData && roleData.permissions && Array.isArray(roleData.permissions)) {
                        // Extract codenames
                        const permissionCodenames = roleData.permissions.map(p => p.codename);

                        // Update Redux Store
                        dispatch(setPermissions(permissionCodenames));
                        console.log(`Permissions synced for role ID ${roleId}:`, permissionCodenames);
                    }
                } else {
                    console.warn('Could not determine Role ID for permission sync.');
                }

            } catch (error) {
                console.error('Failed to sync permissions:', error);
                // Silent fail - don't annoy user if it's just a background sync
            } finally {
                setIsSyncing(false);
            }
        };

        syncPermissions();
    }, [isAuthenticated, user?.email, dispatch]); // specific dependency to run on login

    return { isSyncing };
};
