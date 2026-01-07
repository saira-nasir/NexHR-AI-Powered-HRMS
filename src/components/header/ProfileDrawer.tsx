import React from 'react';
import HiringHandbookDrawer from '@/components/modals/HiringHandbookDrawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building2, User, Calendar, Settings, Key } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileDrawer: React.FC<ProfileDrawerProps> = ({ isOpen, onClose }) => {
  const user = useSelector((s: RootState) => s.auth.user as any);
  const { logout } = useAuth();

  const fullName = user ? ([user.firstName || user.fname || user.first_name, user.lastName || user.lname || user.last_name].filter(Boolean).join(' ')) : '';

  return (
    <HiringHandbookDrawer isOpen={isOpen} onClose={onClose}>
      <div className="p-6 max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
            {(fullName || user?.email || 'U').split(' ').map((n: string) => n[0] || '').slice(0,2).join('').toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{fullName || user?.email || 'User'}</h3>
            <div className="flex items-center gap-2 mt-1">
              {user?.company?.name && <Badge className="bg-gray-100 text-gray-800">{user.company.name}</Badge>}
              {user?.role && <Badge className="bg-blue-50 text-blue-700">{Array.isArray(user.role) ? user.role.join(', ') : user.role}</Badge>}
            </div>
          </div>
        </div>

        <Card className="mb-4">
          <CardHeader className="border-b">
            <CardTitle className="text-sm">Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-700"><Mail className="w-4 h-4 text-gray-400" /> {user?.email || 'N/A'}</div>
              <div className="flex items-center gap-2 text-sm text-gray-700"><Phone className="w-4 h-4 text-gray-400" /> {user?.phone || 'N/A'}</div>
              <div className="flex items-center gap-2 text-sm text-gray-700"><Building2 className="w-4 h-4 text-gray-400" /> {user?.company?.name || 'No company'}</div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Link to="/company" onClick={onClose}>
            <Button variant="ghost" className="w-full justify-start gap-3"><Settings className="w-4 h-4" /> Edit Profile</Button>
          </Link>
          <Link to="/settings" onClick={onClose}>
            <Button variant="ghost" className="w-full justify-start gap-3"><Key className="w-4 h-4" /> Change Password</Button>
          </Link>
          <Button variant="destructive" className="w-full" onClick={() => { logout(); onClose(); }}>Sign out</Button>
        </div>

      </div>
    </HiringHandbookDrawer>
  );
};

export default ProfileDrawer;
