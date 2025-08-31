import React from 'react';
import { useSelector } from 'react-redux';
import { Phone, Mail, BarChart2 } from 'lucide-react';

const EmployeeCard: React.FC = () => {
  const user = useSelector((state: any) => state.auth.user);

  if (!user) return <div>Loading...</div>;

  const firstName = user.firstName || user.fname || '';
  const lastName = user.lastName || user.lname || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const isVerified = Boolean((user as any).is_verified);
  const department = (user as any).department || 'No department';
  const phone = user.phone || (user as any).mobile || '';
  const email = user.email || '';
  const rawStatus = (user as any).status || 'active';
  const statusText = typeof rawStatus === 'string' && rawStatus.length > 0
    ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)
    : 'Active';

  // Hardcode the avatar URL for every user
  const employee = {
    ...user,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80',
    name: fullName
  };

  return (
    <div className="hr-card col-span-1 row-span-2 overflow-hidden flex flex-col animate-scale-in h-full">
      {/* Avatar: always the same for every user */}
      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-cyan-500/40 to-blue-500/40">
        <img
          src={employee.avatar}
          alt={employee.name}
          className="h-full w-full object-cover opacity-90 transition-transform duration-500 hover:scale-105"
        />
        <div className="absolute bottom-4 left-4 rounded-lg bg-black/20 backdrop-blur-sm px-3 py-1 text-white text-sm font-medium">
          <span>{isVerified ? 'Verified' : 'Not Verified'}</span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold">{employee.name}</h3>
          <p className="text-muted-foreground text-sm">{department}</p>
        </div>

        <div className="flex space-x-3 justify-center mb-6">
          <a href={`tel:${phone}`} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors p-2">
            <Phone className="h-5 w-5" />
          </a>
          <a href={`mailto:${email}`} className="rounded-full bg-muted hover:bg-muted/80 transition-colors p-2">
            <Mail className="h-5 w-5" />
          </a>
        </div>

        <div className="border-t border-border/40 pt-4 mt-auto flex-1 flex flex-col justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Account Status</div>
            <div className="flex items-baseline">
              <span className={`text-2xl font-bold ${rawStatus === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {statusText}
              </span>
            </div>

            <div className="mt-4 h-20">
              <div className="flex items-end justify-between h-full">
                {/* Example static bars */}
                {[4, 6, 8, 7, 6, 9, 8].map((value, i) => (
                  <div
                    key={i}
                    className="w-1/12 bg-blue-400/80 rounded-t"
                    style={{ height: `${value * 10}%` }}
                  ></div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
              <span>4 h</span>
              <span>9 h</span>
            </div>
          </div>

          <div className="flex items-center text-xs text-muted-foreground mt-6 justify-center">
            <BarChart2 className="h-3 w-3 mr-1" />
            <span>Work and hours include extra hours</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeCard;