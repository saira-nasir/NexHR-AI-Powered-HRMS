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
// NEW IMPORTS: SWR and necessary utilities
import useSWR from 'swr';
import { apiGet } from '@/lib/api'; 
import { AxiosError } from 'axios';


// SWR Fetcher: Uses the existing apiGet helper from your api.ts
// It fetches the notification list from the backend
const fetcher = (url: string) => apiGet(url);

const NotificationsDropdown: React.FC = () => {
    const [open, setOpen] = React.useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();

    // 1. USE SWR HOOK FOR DATA FETCHING, CACHING, AND POLLING
    const { data: swrData, error, isLoading, mutate } = useSWR(
        // Fetch the first page of notifications. The pagination applied in views.py
        // handles returning only the latest 10 items efficiently.
        '/payroll/notifications/', 
        fetcher,
        {
            // SWR Options
            revalidateOnFocus: true, // Re-fetch when the window gains focus
            refreshInterval: 60000, // Poll every 60 seconds (much less aggressive than 15s)
            // Initial data structure for when no data is in the cache yet
            fallbackData: { results: [] } 
        }
    );

    // Extract notifications (handle the paginated structure: data.results)
    const items: Notification[] = swrData?.results || [];

    // 2. LOGIC TO SHOW TOAST ON NEW NOTIFICATION (REPLACES COMPLEX POLLING LOGIC)
    const latestIdRef = React.useRef<number | null>(null);
    
    React.useEffect(() => {
        if (items.length > 0) {
            const newest = items[0];
            const prev = latestIdRef.current;
            
            if (prev == null) {
                // Initialize reference with the newest ID on mount
                latestIdRef.current = newest.id;
            } else if (newest.id !== prev) {
                // New notification detected after background fetch/revalidation
                latestIdRef.current = newest.id;
                
                // Only show toast if dropdown is closed
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
    }, [items, open, toast]);

    // SWR Error Handling
    if (error && !(error as AxiosError).response) { 
        console.error('Notifications SWR Network Error:', error);
        // Show a general error if it's a true network/connection issue
        toast({ 
            title: 'Connection Issue', 
            description: 'Failed to connect to the server to fetch notifications.', 
            variant: 'destructive' 
        });
    }


    // 3. HANDLERS USING OPTIMISTIC MUTATION

    const handleMarkAsRead = async (id: number) => {
        // Optimistically update the UI: map over results and set is_read: true for the matching ID
        mutate(
            prevData => {
                if (!prevData || !Array.isArray(prevData.results)) return prevData;
                return {
                    ...prevData,
                    results: prevData.results.map(n => n.id === id ? { ...n, is_read: true } : n)
                };
            },
            { revalidate: false } // Don't re-fetch yet, rely on the optimistic update
        );

        try {
            // API call to persist the change
            await payrollService.markNotificationAsRead(id);
            toast({ title: 'Marked as read' });
            // Revalidate to sync the cache (optional, but good practice)
            mutate(); 
        } catch (err) {
            console.error('Mark as read failed', err);
            toast({ title: 'Error', description: 'Failed to mark notification as read', variant: 'destructive' });
            mutate(); // Revert the optimistic update by forcing a re-fetch on failure
        }
    };

    const handleDelete = async (id: number) => {
        // Optimistically update the UI: filter out the deleted item
        mutate(
            prevData => {
                if (!prevData || !Array.isArray(prevData.results)) return prevData;
                return {
                    ...prevData,
                    results: prevData.results.filter(n => n.id !== id)
                };
            },
            { revalidate: false }
        );

        try {
            // API call to delete
            await payrollService.deleteNotification(id);
            toast({ title: 'Notification deleted' });
            mutate(); // Revalidate
        } catch (err) {
            console.error('Delete notification failed', err);
            toast({ title: 'Error', description: 'Failed to delete notification', variant: 'destructive' });
            mutate(); // Revert the optimistic update by forcing a re-fetch on failure
        }
    };

    const handleClickItem = async (n: Notification) => {
        // Optimistically mark read and trigger a local update
        if (!n.is_read) {
            try { 
                await payrollService.markNotificationAsRead(n.id); 
            } catch (e) { 
                /* ignore minor API failure, UX priority */ 
            }
            // Trigger SWR mutate to update the state immediately
            mutate(
                prevData => {
                    if (!prevData || !Array.isArray(prevData.results)) return prevData;
                    return {
                        ...prevData,
                        results: prevData.results.map(it => it.id === n.id ? { ...it, is_read: true } : it)
                    };
                },
                { revalidate: false }
            );
        }

        // Navigation logic (using target_url from the notification object)
        if (n.target_url) {
            const url = n.target_url as string;
            try {
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
    const displayItems = items; // Already sorted and paginated by the backend

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
                        {unread && (
                            <Badge className="bg-[#FF6B6B] text-white px-2 py-0.5 rounded">{items.filter(i => !i.is_read).length}</Badge>
                        )}
                    </div>
                </div>

                <div className="max-h-80">
                    <ScrollArea className="max-h-64">
                        {isLoading ? (
                            <div className="p-4 text-sm text-gray-500">Loading…</div>
                        ) : displayItems.length === 0 ? (
                            <div className="p-4 text-sm text-gray-500">No notifications</div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {displayItems.map(n => (
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