import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, Trash2 } from 'lucide-react';
import payrollService, { Notification } from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';

// Define the expected structure for the paginated response
interface PaginatedNotifications {
    count: number;
    next: string | null;
    previous: string | null;
    results: Notification[];
}

// Helper type to handle the response from listNotifications
type NotificationResponse = Notification[] | PaginatedNotifications;

const NotificationsCard: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response: NotificationResponse = await payrollService.listNotifications();
      
      // FIX: Check if response is the new paginated object and extract 'results', 
      // otherwise assume it's the old array format. Default to empty array.
      let dataArray: Notification[] = [];

      if (response && 'results' in response && Array.isArray(response.results)) {
        // Paginated response structure: { results: [...] }
        dataArray = response.results;
      } else if (Array.isArray(response)) {
        // Old array response structure: [...]
        dataArray = response;
      }

      // Sort newest first for display in the card
      dataArray.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setNotifications(dataArray);

    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]); // Ensure notifications is an array on error
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await payrollService.markNotificationAsRead(id);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
      toast({ title: 'Notification marked as read' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to mark notification as read', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await payrollService.deleteNotification(id);
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      toast({ title: 'Notification deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete notification', variant: 'destructive' });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Format time to be more readable (e.g., "2 hours ago", "Just now")
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Card className="rounded-lg border border-gray-100 bg-white hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 group border-l-4 border-[#6C63FF]/20 overflow-hidden shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 pt-4">
        <CardTitle className="text-base font-semibold group-hover:text-[#6C63FF] transition-colors flex items-center gap-2.5 text-gray-800">
          <Bell className="h-4 w-4 text-[#6C63FF]" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] flex items-center justify-center px-1.5 text-xs font-semibold">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ScrollArea className="min-h-[120px] max-h-[400px] w-full">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div 
                className="animate-spin w-6 h-6 border-2 rounded-full" 
                style={{
                  borderColor: '#6C63FF', 
                  borderTopColor: 'transparent', 
                  borderRightColor: 'transparent'
                }}
              />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 font-medium">No notifications</p>
              <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-1 pr-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-2.5 rounded-lg border transition-all duration-200 hover:shadow-md flex items-start gap-3 group/notif relative ${
                    notification.is_read 
                      ? 'bg-white border-gray-100 hover:border-gray-200' 
                      : 'bg-gradient-to-r from-[#F3F4F6] to-[#F9FAFB] border-[#E9E7FF] hover:border-[#6C63FF]/30'
                  }`}
                >
                  {!notification.is_read && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#6C63FF] rounded-r-full opacity-60" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-relaxed ${
                      notification.is_read 
                        ? 'text-gray-600' 
                        : 'text-gray-900 font-semibold'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <span>{formatTimeAgo(notification.created_at)}</span>
                      <span>•</span>
                      <span>{new Date(notification.created_at).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit',
                        hour12: true 
                      })}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover/notif:opacity-100 transition-opacity duration-200">
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="h-7 w-7 p-0 hover:bg-green-50 rounded-md transition-all duration-200"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(notification.id)}
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200"
                      title="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NotificationsCard;