import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, X, Trash2 } from 'lucide-react';
import payrollService, { Notification } from '@/services/payrollService';
import { useToast } from '@/hooks/use-toast';

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
      const data = await payrollService.listNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
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

  const handleMarkAllAsRead = async () => {
    try {
      await payrollService.markAllNotificationsAsRead();
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      toast({ title: 'All notifications marked as read' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to mark all notifications as read', variant: 'destructive' });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:border-primary/20 group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllAsRead}
            className="h-8 px-2"
          >
            Mark All Read
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No notifications
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-sm ${
                    notification.is_read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${
                        notification.is_read ? 'text-gray-600' : 'text-gray-900 font-medium'
                      }`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(notification.id)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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
