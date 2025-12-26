import { useState, useEffect } from "react";
import { X, Bell, AlertTriangle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const colors = {
  bgMain: "#F9FAFB",
  cardBg: "#FFFFFF",
  textPrimary: "#1C1C1C",
  textSecondary: "#6B7280",
  accentWarm: "#FF6B6B",
  accentWellness: "#2D5A27",
  borderLight: "#E5E7EB",
};

export interface RegulatoryNotification {
  id: string;
  title: string;
  description: string;
  type: "final_rule" | "revision" | "guidance" | "update";
  priority: "high" | "normal";
  jurisdiction: "FDA" | "EMA" | "ISO";
  publishedAt: string;
  effectiveDate?: string;
  isRead: boolean;
}

const mockNotifications: RegulatoryNotification[] = [
  {
    id: "notif-1",
    title: "FDA Final Rule: 21 CFR Part 820 Quality System Regulation",
    description: "Major revision to medical device QSR aligning with ISO 13485:2016. Effective February 2025.",
    type: "final_rule",
    priority: "high",
    jurisdiction: "FDA",
    publishedAt: new Date().toISOString(),
    effectiveDate: "2025-02-02",
    isRead: false,
  },
  {
    id: "notif-2",
    title: "ISO 13485:2024 Amendment Published",
    description: "Clarifications to risk management integration and software validation requirements.",
    type: "revision",
    priority: "high",
    jurisdiction: "ISO",
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    isRead: false,
  },
  {
    id: "notif-3",
    title: "EMA GMP Annex 1 Implementation Guidance",
    description: "New guidance document for sterile manufacturing requirements.",
    type: "guidance",
    priority: "normal",
    jurisdiction: "EMA",
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    isRead: true,
  },
];

interface SmartNotificationsProps {
  jurisdictionFilter?: "FDA" | "EMA" | "ISO" | "all";
}

export function SmartNotifications({ jurisdictionFilter = "all" }: SmartNotificationsProps) {
  const [notifications, setNotifications] = useState<RegulatoryNotification[]>(mockNotifications);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const filteredNotifications = notifications
    .filter(n => !dismissed.has(n.id))
    .filter(n => jurisdictionFilter === "all" || n.jurisdiction === jurisdictionFilter);

  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;
  const highPriorityCount = filteredNotifications.filter(n => n.priority === "high" && !n.isRead).length;

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(Array.from(prev).concat(id)));
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const newNotif: RegulatoryNotification = {
        id: `notif-${Date.now()}`,
        title: "New Regulatory Update Detected",
        description: "The system has detected a new regulatory change in your monitored tracks.",
        type: Math.random() > 0.5 ? "final_rule" : "revision",
        priority: Math.random() > 0.7 ? "high" : "normal",
        jurisdiction: ["FDA", "EMA", "ISO"][Math.floor(Math.random() * 3)] as "FDA" | "EMA" | "ISO",
        publishedAt: new Date().toISOString(),
        isRead: false,
      };
      setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (filteredNotifications.length === 0) {
    return null;
  }

  const latestHighPriority = filteredNotifications.find(n => n.priority === "high" && !n.isRead);
  const latestNormal = filteredNotifications.find(n => n.priority === "normal" && !n.isRead);

  return (
    <div className="w-full" style={{ backgroundColor: colors.cardBg }}>
      <div 
        className="flex items-center justify-between px-4 py-2 border-b cursor-pointer"
        style={{ borderColor: colors.borderLight }}
        onClick={() => setIsExpanded(!isExpanded)}
        data-testid="notification-bar-toggle"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-5 h-5" style={{ color: highPriorityCount > 0 ? colors.accentWarm : colors.textSecondary }} />
            {unreadCount > 0 && (
              <span 
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center"
                style={{ backgroundColor: colors.accentWarm }}
              >
                {unreadCount}
              </span>
            )}
          </div>
          
          {latestHighPriority && (
            <div className="flex items-center gap-2">
              <Badge 
                className="text-xs"
                style={{ backgroundColor: "rgba(255, 107, 107, 0.15)", color: colors.accentWarm }}
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                High Priority
              </Badge>
              <span className="text-sm font-medium truncate max-w-md" style={{ color: colors.textPrimary }}>
                {latestHighPriority.title}
              </span>
            </div>
          )}
          
          {!latestHighPriority && latestNormal && (
            <div className="flex items-center gap-2">
              <Badge 
                className="text-xs"
                style={{ backgroundColor: "rgba(45, 90, 39, 0.15)", color: colors.accentWellness }}
              >
                <Info className="w-3 h-3 mr-1" />
                Update
              </Badge>
              <span className="text-sm truncate max-w-md" style={{ color: colors.textPrimary }}>
                {latestNormal.title}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: colors.textSecondary }}>
            {unreadCount} unread
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" style={{ color: colors.textSecondary }} />
          ) : (
            <ChevronDown className="w-4 h-4" style={{ color: colors.textSecondary }} />
          )}
        </div>
      </div>

      {isExpanded && (
        <div 
          className="max-h-64 overflow-y-auto border-b"
          style={{ borderColor: colors.borderLight }}
        >
          {filteredNotifications.slice(0, 5).map(notification => (
            <div
              key={notification.id}
              className="flex items-start gap-3 px-4 py-3 transition-colors"
              style={{ 
                backgroundColor: notification.isRead ? colors.bgMain : colors.cardBg,
                borderBottom: `1px solid ${colors.borderLight}`
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.bgMain}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.isRead ? colors.bgMain : colors.cardBg}
              data-testid={`notification-item-${notification.id}`}
            >
              <div 
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ 
                  backgroundColor: notification.priority === "high" ? colors.accentWarm : colors.accentWellness 
                }}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{
                      backgroundColor: notification.jurisdiction === "FDA" ? "#DBEAFE" : 
                                      notification.jurisdiction === "ISO" ? "#F3E8FF" : "#FFEDD5",
                      color: notification.jurisdiction === "FDA" ? "#1D4ED8" : 
                            notification.jurisdiction === "ISO" ? "#7C3AED" : "#C2410C",
                      borderColor: "transparent"
                    }}
                  >
                    {notification.jurisdiction}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className="text-xs capitalize"
                    style={{ borderColor: colors.borderLight, color: colors.textSecondary }}
                  >
                    {notification.type.replace("_", " ")}
                  </Badge>
                </div>
                
                <p className="text-sm font-medium mb-1" style={{ color: colors.textPrimary }}>
                  {notification.title}
                </p>
                <p className="text-xs" style={{ color: colors.textSecondary }}>
                  {notification.description}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification.id);
                    }}
                    data-testid={`button-mark-read-${notification.id}`}
                  >
                    Mark Read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(notification.id);
                  }}
                  data-testid={`button-dismiss-${notification.id}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
