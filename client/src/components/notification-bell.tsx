import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { qk } from "@/state/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, BellRing, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type NotificationItem = { id: string; title: string; ts: number };

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: notes = [] } = useQuery<NotificationItem[]>({ 
    queryKey: qk.notifications, 
    queryFn: async () => [] 
  });

  const clearAllNotifications = () => {
    queryClient.setQueryData(qk.notifications, []);
    setIsOpen(false);
  };

  const dismissNotification = (id: string) => {
    const filtered = notes.filter(n => n.id !== id);
    queryClient.setQueryData(qk.notifications, filtered);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        data-testid="notification-bell-button"
      >
        {notes.length > 0 ? (
          <BellRing className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        
        {notes.length > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
          >
            {notes.length > 99 ? "99+" : notes.length}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-96 max-h-96 overflow-y-auto shadow-lg z-50 bg-white border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Resolution Notifications
              </CardTitle>
              <div className="flex items-center gap-2">
                {notes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllNotifications}
                    className="text-xs"
                    data-testid="clear-all-notifications"
                  >
                    Clear All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  data-testid="close-notifications"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {notes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent notifications
              </p>
            ) : (
              <div className="space-y-2">
                {notes.slice(0, 8).map((note) => (
                  <div 
                    key={note.id} 
                    className="flex items-start justify-between py-2 px-3 bg-green-50 rounded-lg border-l-4 border-l-green-500"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm text-green-800">
                        {note.title}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {new Date(note.ts).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(note.id)}
                      className="ml-2 h-6 w-6 p-0"
                      data-testid={`dismiss-notification-${note.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {notes.length > 8 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    ...and {notes.length - 8} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}