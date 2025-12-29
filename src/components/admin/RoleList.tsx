import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit2, Plus, Users } from 'lucide-react';
import rolePermissionService, { Role } from '@/services/rolePermissionService';

interface RoleListProps {
  roles: Role[];
  loading?: boolean;
  onAddRole: () => void;
  onEditPermissions: (role: Role) => void;
}

/**
 * Role List Component
 * Displays all roles in a card grid layout with actions
 */
const RoleList: React.FC<RoleListProps> = ({
  roles,
  loading = false,
  onAddRole,
  onEditPermissions,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Roles</h3>
          <p className="text-sm text-muted-foreground">
            Manage roles and their assigned permissions
          </p>
        </div>
        <Button onClick={onAddRole} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Role
        </Button>
      </div>

      {roles.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-lg text-foreground">No roles found</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Create your first role to get started. Roles help you organize permissions and manage access across your organization.
                </p>
              </div>
              <Button onClick={onAddRole} className="mt-4" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Role
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => {
            const permissionCount =
              role.permissions?.length || role.permission_ids?.length || 0;

            return (
              <Card 
                key={role.id} 
                className="hover:shadow-lg transition-all duration-200 border hover:border-primary/20"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate">
                        {role.name}
                      </CardTitle>
                      {role.description && (
                        <CardDescription className="mt-2 line-clamp-2">
                          {role.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-medium">
                      {permissionCount} permission{permissionCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditPermissions(role)}
                    className="w-full gap-2"
                  >
                    <Edit2 className="h-4 w-4" />
                    Edit Permissions
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoleList;

