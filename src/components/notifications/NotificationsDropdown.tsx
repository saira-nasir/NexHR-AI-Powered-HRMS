import React from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import payrollService, { Notification } from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ToastAction } from '@/components/ui/toast';
import { useNavigate } from 'react-router-dom';

const NotificationsDropdown: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const load = async () => {
    try {
      setLoading(true);
      const data = await payrollService.listNotifications();
      if (Array.isArray(data)) {
        // Sort newest first
        const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setItems(sorted.slice(0, 8));
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (open) load();
  }, [open]);

  // Poll for new notifications in the background so the user sees live updates
  const latestIdRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    let mounted = true;
    const checkNew = async () => {
      try {
        const data = await payrollService.listNotifications();
        if (!Array.isArray(data)) return;
        // Sort newest first
        const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const newest = sorted[0];
        if (newest) {
          const prev = latestIdRef.current;
          if (prev == null) {
            latestIdRef.current = newest.id;
          } else if (newest.id !== prev) {
            // New notification arrived
            latestIdRef.current = newest.id;
            // Update items so badge updates
            if (mounted) setItems(sorted.slice(0, 8));
            // If dropdown is closed, show a brief toast so it's visible on screen
            if (!open) {
              toast({
                title: 'New notification',
                description: newest.message,
                action: (
                  <ToastAction altText="Open notification" onClick={() => { handleClickItem(newest); }}>
                    Open
                  </ToastAction>
                ),
              });
            }
          }
        }
      } catch (err) {
        // ignore polling errors
      }
    };

    // Initial check
    checkNew();
    const id = setInterval(checkNew, 15000); // poll every 15s
    return () => { mounted = false; clearInterval(id); };
  }, [open, toast]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await payrollService.markNotificationAsRead(id);
      setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      toast({ title: 'Marked as read' });
    } catch (err) {
      console.error('Mark as read failed', err);
      toast({ title: 'Error', description: 'Failed to mark notification as read', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await payrollService.deleteNotification(id);
      setItems(prev => prev.filter(n => n.id !== id));
      toast({ title: 'Notification deleted' });
    } catch (err) {
      console.error('Delete notification failed', err);
      toast({ title: 'Error', description: 'Failed to delete notification', variant: 'destructive' });
    }
  };

  const handleClickItem = async (n: Notification) => {
    // Mark read first (optimistic)
    if (!n.is_read) {
      try { await payrollService.markNotificationAsRead(n.id); } catch (e) { /* ignore */ }
      setItems(prev => prev.map(it => it.id === n.id ? { ...it, is_read: true } : it));
    }

    // If backend provided a target_url, navigate to it; otherwise do nothing
    // Accept either absolute or app-relative paths
    if ((n as any).target_url) {
      const url = (n as any).target_url as string;
      try {
        // Use react-router navigation for in-app routes
        if (url.startsWith('/')) {
          navigate(url);
        } else {
          window.open(url, '_blank');
        }
        setOpen(false);
      } catch (err) {
        console.error('Navigation failed', err);
      }
    }
  };

  const unread = items.some(n => !n.is_read);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button aria-label="Notifications" className="rounded-full p-2 text-gray-600 hover:bg-[#6C63FF]/10 hover:text-[#6C63FF] transition-colors relative focus:outline-none focus:ring-2 focus:ring-[#6C63FF]/30">
          <Bell className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
          {unread && <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-[#FF6B6B] ring-2 ring-white"></span>}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0 bg-white rounded-xl shadow-lg ring-1 ring-black/5 overflow-hidden" align="end">
        <div className="p-4 bg-[#F3F4F6] flex items-center justify-between border-b border-gray-100">
          <div className="text-gray-800 font-semibold">Notifications</div>
          <div>
            {items.some(i => !i.is_read) && (
              <Badge className="bg-[#FF6B6B] text-white px-2 py-0.5 rounded">{items.filter(i => !i.is_read).length}</Badge>
            )}
          </div>
        </div>

        <div className="max-h-80">
          <ScrollArea className="max-h-64">
            {loading ? (
              <div className="p-4 text-sm text-gray-500">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No notifications</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map(n => (
                  <li
                    key={n.id}
                    className={`p-3 flex items-start gap-3 transition-colors ${!n.is_read ? 'bg-[#6C63FF]/8 rounded-lg' : 'hover:bg-gray-50'} `}
                  >
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleClickItem(n)}>
                      <div className={`text-sm ${n.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{n.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {!n.is_read && (
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#6C63FF] hover:bg-[#6C63FF]/10" onClick={() => handleMarkAsRead(n.id)} aria-label="Mark as read">
                          <Check className="h-4 w-4" />
                        </Button>
                      )}

                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-gray-400 hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded transition-colors" onClick={() => handleDelete(n.id)} aria-label="Delete notification">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>

        <div className="p-3 bg-white border-t flex items-center justify-between">
          <Button size="sm" variant="ghost" onClick={() => { setOpen(false); navigate('/payroll'); }} className="text-[#6C63FF] hover:bg-[#6C63FF]/6">View all</Button>
          <div className="text-xs text-gray-400">Showing latest</div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;


