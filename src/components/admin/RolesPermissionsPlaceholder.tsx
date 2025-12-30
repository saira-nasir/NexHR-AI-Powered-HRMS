import React from 'react';
import { Shield, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Roles & Permissions Placeholder Component
 * This will be replaced in Phase 2 with the full Roles & Permissions management UI
 */
const RolesPermissionsPlaceholder: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
        <p className="text-muted-foreground">Manage roles and assign permissions to control access across the platform</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            The Roles & Permissions management interface is currently under development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Settings className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              This section will allow you to create roles, assign predefined permissions, and manage access controls.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RolesPermissionsPlaceholder;

