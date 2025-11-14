import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, Briefcase, Mail, Phone } from 'lucide-react';

interface Employee {
  name: string;
  employeeId: string;
  department: string;
  status: string;
  avatar?: string;
  email?: string;
  phone?: string;
  position?: string;
}

interface EmployeeProfileProps {
  employee: Employee | null;
  timestamp: string;
}

export const EmployeeProfile: React.FC<EmployeeProfileProps> = ({ employee, timestamp }) => {
  if (!employee) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recognition Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-center text-muted-foreground">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Waiting for face recognition...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Last Recognition</CardTitle>
          <Badge className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center text-center mb-6">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={employee.avatar || 'https://images.unsplash.com/photo-1632255658477-9ac8f313ea41?auto=format&fit=max&w=256&q=80'} alt={employee.name} />
            <AvatarFallback className="text-xl">{employee.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <h3 className="text-xl mb-1">{employee.name}</h3>
          <p className="text-sm text-muted-foreground mb-2">{employee.employeeId}</p>
          <Badge variant="outline">{employee.department}</Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Position:</span>
            <span>{employee.position || 'Software Engineer'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Email:</span>
            <span className="truncate">{employee.email || `${employee.name.toLowerCase().replace(' ', '.')}@company.com`}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Phone:</span>
            <span>{employee.phone || '+1 (555) 123-4567'}</span>
          </div>

          <div className="pt-4 border-t mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Check-in Time:</span>
              <span>{timestamp}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge className="bg-green-500">Checked In</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeProfile;


