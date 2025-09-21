import React from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import payrollService, { Notification } from '@/services/payrollService';

const NotificationsDropdown: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await payrollService.listNotifications();
      setItems(Array.isArray(data) ? data.slice(0, 8) : []);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open) load();
  }, [open]);

  const unread = items.some(n => !n.is_read);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="rounded-full p-1.5 sm:p-2 text-gray-500 hover:bg-lavender hover:text-english-violet transition-colors relative">
          <Bell className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
          {unread && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b font-medium">Notifications</div>
        <div className="max-h-80 overflow-auto">
          {loading ? (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No notifications</div>
          ) : (
            <ul className="divide-y">
              {items.map(n => (
                <li key={n.id} className="p-3 text-sm">
                  <div className="font-medium text-gray-900">{n.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;


