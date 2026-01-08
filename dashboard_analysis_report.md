# Dashboard Roles & Permissions Analysis Report

This report details the implementation of roles, permissions, redirection, and sidebar logic within the application.

## 1. Dashboard Redirection Logic
**Current Behavior:** All users, regardless of role, are redirected to `/dashboard` upon login.

*   **Login Redirection (`Login.tsx`)**:
    *   After a successful login, the app navigates to `redirectPath` (if set by a previous attempted access) or defaults to `/dashboard`.
    *   Code: `navigate(redirectPath || '/dashboard', { replace: true });`
*   **Role Mapping (`roleUtils.ts`)**:
    *   The `ROLE_DASHBOARD_MAP` object exists but currently maps **all roles** (`HR`, `Admin`, `Finance Manager`, `Employee`) to the same path: `/dashboard`.
    *   There is no distinct "Admin Dashboard" or "HR Dashboard" route; the content within `/dashboard` (or the Sidebar options) changes instead.

## 2. Sidebar Logic & Menu Visibility
**Mechanism:** The sidebar is dynamic, filtering items based on the user's role and assigned permissions.

*   **Configuration (`sidebarItems.ts`)**:
    *   Defines the menu structure. Each item can have:
        *   `allowedRoles`: Array of strings (e.g., `['HR', 'Admin']`).
        *   `codename`: Permission string (e.g., `view_employees`).
*   **Filtering Component (`Sidebar.tsx`)**:
    *   The `getVisibleItems` function iterates through the config.
    *   **Visibility Rules**:
        1.  **Permission Check**: If an item has a `codename`, the user sees it if their `permissions` list (from Redux) includes that codename.
        2.  **Role Fallback**: If the permission is missing (or not set), it checks if the user's role is in `allowedRoles`.
        3.  **Admin Override**:
            *   **Admins** generally see strict `allowedRoles` items.
            *   For items with `codenames`, Admins often bypass the specific permission check in `RoleBasedRoute`, though `Sidebar.tsx` has specific logic to keep the sidebar clean for them.

## 3. Permissions Handling
**Storage & Synchronization:**

*   **Source**: Permissions are associated with **Roles**.
*   **Synchronization (`usePermissionSync.ts`)**:
    *   Runs on application mount or login.
    *   It identifies the user's role ID (or matches by name).
    *   Fetches the *full role object* (which includes a list of permissions) from `rolePermissionService`.
    *   Extracts `codename` strings from these permissions.
    *   Dispatches the list of codenames to the Redux store (`auth.permissions`).
*   **Storage**:
    *   **Redux Store**: `state.auth.permissions` (Runtime usage).
    *   **LocalStorage**:
        *   `authState`: Persists the Redux state (including permissions) to survive page reloads.
        *   `mock_permissions`: (In Mock Mode) Stores the definitions of all available permissions.

## 4. Hardcoded Areas & Logic
Specific places where roles or logic are hardcoded:

*   **`roleUtils.ts`**:
    *   **Role Constants**: `HR`, `Admin`, `Finance Manager`, `Employee` are hardcoded key-values.
    *   **Normalization**: Logic to convert strings like "Super Admin" or "staff" into the canonical constants.
    *   **Failsafe**: `if (user.email === 'admin@nexhr.com') return ROLES.ADMIN;` specifically hardcodes admin access for this email.
*   **`Sidebar.tsx`**:
    *   Contains conditional logic specifically for `'Admin'` to strictly enforce `allowedRoles` filtering to prevent clutter, whereas other roles rely more heavily on permission overrides.
*   **`RoleBasedRoute.tsx`**:
    *   **Admin Bypass**: `if (getUserRole(user) !== 'Admin')` ... implies that Admins bypass the `requiredPermission` check for routes.

## 5. Mock Data (`rolePermissionService.mock.ts`)
The system currently uses mock data initialized in LocalStorage:

*   **`mock_permissions`**: Contains ~20 predefined permissions (e.g., `schedule_meeting`, `view_employees`, `manage_expenses`, `manage_roles`).
*   **`mock_roles`**: Stores the role definitions (linking IDs to permission IDs).

## Summary Table

| Feature | Implementation Source | Key Logic |
| :--- | :--- | :--- |
| **Redirection** | `Login.tsx`, `roleUtils.ts` | Redirects to `/dashboard` for all roles. |
| **User Role** | `roleUtils.ts` | Derived from user object properties (roles array, role object, etc.). |
| **Sidebar** | `Sidebar.tsx`, `sidebarItems.ts` | Shows items if `permissions.includes(codename)` OR `allowedRoles.includes(role)`. |
| **Permissions** | `usePermissionSync.ts` | Fetched from Role service, stored in Redux & LocalStorage (`authState`). |
| **Route Guard** | `RoleBasedRoute.tsx` | Checks `hasRole` and `permissions.includes`. Admins bypass permission checks. |
