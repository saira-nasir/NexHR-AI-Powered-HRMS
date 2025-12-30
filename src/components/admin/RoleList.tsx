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
          <h3 className="text-xl font-bold text-foreground">Roles</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Manage roles and their assigned permissions
          </p>
        </div>
        <Button 
          onClick={onAddRole} 
          className="gap-2 bg-gradient-to-r from-[#6C63FF] to-[#7B73FF] hover:from-[#5B52FF] hover:to-[#6C63FF] shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Add Role
        </Button>
      </div>

      {roles.length === 0 ? (
        <Card className="border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg border border-primary/20">
                <Users className="h-10 w-10 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="font-semibold text-lg text-foreground">No roles found</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Create your first role to get started. Roles help you organize permissions and manage access across your organization.
                </p>
              </div>
              <Button onClick={onAddRole} className="mt-4 bg-gradient-to-r from-[#6C63FF] to-[#7B73FF] hover:from-[#5B52FF] hover:to-[#6C63FF] shadow-md hover:shadow-lg transition-all duration-200" size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Role
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role, index) => {
            const permissionCount =
              role.permissions?.length || role.permission_ids?.length || 0;

            // Different gradient colors for visual variety
            const gradientColors = [
              'from-[#6C63FF]/10 via-[#7B73FF]/5 to-transparent',
              'from-[#8B82FF]/10 via-[#9B92FF]/5 to-transparent',
              'from-[#6C63FF]/10 via-[#8B82FF]/5 to-transparent',
            ];
            const gradientColor = gradientColors[index % gradientColors.length];

            return (
              <Card 
                key={role.id} 
                className={`
                  relative overflow-hidden group
                  bg-gradient-to-br ${gradientColor}
                  border border-primary/20 hover:border-primary/40
                  hover:shadow-xl hover:shadow-primary/10
                  transition-all duration-300
                  transform hover:-translate-y-1
                `}
              >
                {/* Decorative gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-bold truncate text-foreground group-hover:text-primary transition-colors">
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
                <CardContent className="space-y-4 relative z-10">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className="font-semibold bg-white/80 backdrop-blur-sm text-primary border-primary/30 shadow-sm hover:shadow-md transition-shadow"
                    >
                      {permissionCount} permission{permissionCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditPermissions(role)}
                    className="w-full gap-2 border-primary/30 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md"
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

