import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Brain, MessageSquare, TrendingUp, Lightbulb, Users, BarChart3, Target, Settings, Search, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Conflict {
  id: string;
  status: string;
}

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  
  const { data: activeConflicts = [] } = useQuery<Conflict[]>({
    queryKey: ["/api/conflicts/active"]
  });

  const notificationCount = activeConflicts.length;

  const navigationItems = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/coo", label: "COO Agent", icon: Settings },
    { path: "/goals", label: "Strategic Objectives", icon: TrendingUp },
    { path: "/initiatives", label: "Initiatives", icon: Lightbulb },
    { path: "/directives", label: "Directives", icon: Users },
    { path: "/intervention", label: "Active Intervention", icon: Zap },
    { path: "/market-intelligence", label: "Market Intelligence", icon: Search },
    { path: "/governance", label: "Governance", icon: Settings },
    { path: "/analytics", label: "Predictive Analytics", icon: TrendingUp },
    { path: "/ai-assistant", label: "AI Assistant", icon: Brain }
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <div className="flex items-center space-x-2 cursor-pointer">
                  <Brain className="h-8 w-8 text-primary" />
                  <h1 className="text-xl font-bold text-gray-900">Chief of Staff</h1>
                </div>
              </Link>
              <Badge variant="secondary" className="bg-blue-100 text-blue-600">
                Strategic AI Orchestrator
              </Badge>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} href={item.path}>
                    <Button
                      variant={isActive(item.path) ? "default" : "ghost"}
                      className={`flex items-center gap-2 ${
                        isActive(item.path) 
                          ? "bg-primary text-primary-foreground" 
                          : "text-gray-600 hover:text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-primary transition-colors">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">SA</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">System Admin</p>
                  <p className="text-xs text-gray-500">Chief of Staff</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-2 overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center gap-1 whitespace-nowrap ${
                      isActive(item.path) 
                        ? "bg-primary text-primary-foreground" 
                        : "text-gray-600 hover:text-primary"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}