import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, TrendingUp, Lightbulb, Users, BarChart3, Target, Settings, Search, Zap, ChevronDown, Bot } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import chiefOfStaffIcon from "@assets/Screenshot (7)_1756066733450.png";

interface Conflict {
  id: string;
  status: string;
}

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const { data: activeConflicts = [] } = useQuery<Conflict[]>({
    queryKey: ["/api/conflicts/active"]
  });

  const notificationCount = activeConflicts.length;

  const navigationItems = [
    { path: "/", label: "Command Center", icon: Zap },
    { path: "/dashboard", label: "Strategic Cockpit", icon: BarChart3 },
    { 
      path: "/goals", 
      label: "Strategic Objectives", 
      icon: TrendingUp,
      submenu: [
        { path: "/initiatives", label: "Initiatives", icon: Lightbulb },
        { path: "/directive-center", label: "Directive Center", icon: Target },
        { path: "/directives", label: "Directives", icon: Users },
        { path: "/governance", label: "Governance", icon: Settings }
      ]
    },
    { 
      path: "/market-intelligence", 
      label: "Market Intelligence", 
      icon: Search,
      submenu: [
        { path: "/analytics", label: "Predictive Analytics", icon: TrendingUp },
        { path: "/ai-assistant", label: "AI Assistant", icon: Bot }
      ]
    }
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const isParentActive = (item: any) => {
    if (isActive(item.path)) return true;
    if (item.submenu) {
      return item.submenu.some((subItem: any) => isActive(subItem.path));
    }
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
                  <img src={chiefOfStaffIcon} alt="Chief of Staff" className="h-8 w-8 object-contain" />
                  <h1 className="text-xl font-bold text-gray-900">Chief of Staff</h1>
                </div>
              </Link>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                
                if (item.submenu) {
                  return (
                    <div key={item.path} className="relative">
                      <Button
                        variant={isParentActive(item) ? "default" : "ghost"}
                        className={`flex items-center gap-2 ${
                          isParentActive(item) 
                            ? "bg-primary text-primary-foreground" 
                            : "text-gray-600 hover:text-primary"
                        }`}
                        onMouseEnter={() => setDropdownOpen(true)}
                        onMouseLeave={() => setDropdownOpen(false)}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                      
                      {dropdownOpen && (
                        <div 
                          className="absolute top-full left-0 mt-1 bg-white shadow-lg border border-gray-200 rounded-md py-1 z-50"
                          onMouseEnter={() => setDropdownOpen(true)}
                          onMouseLeave={() => setDropdownOpen(false)}
                        >
                          <Link href={item.path}>
                            <div className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-primary cursor-pointer">
                              <Icon className="h-4 w-4 inline mr-2" />
                              {item.label}
                            </div>
                          </Link>
                          {item.submenu.map((subItem) => {
                            const SubIcon = subItem.icon;
                            return (
                              <Link key={subItem.path} href={subItem.path}>
                                <div className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-primary cursor-pointer">
                                  <SubIcon className="h-4 w-4 inline mr-2" />
                                  {subItem.label}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                } else {
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
                }
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
              
              // For mobile, show all items including submenu items as individual buttons
              const items = item.submenu ? [item, ...item.submenu] : [item];
              
              return items.map((navItem) => {
                const NavIcon = navItem.icon;
                return (
                  <Link key={navItem.path} href={navItem.path}>
                    <Button
                      variant={isActive(navItem.path) ? "default" : "ghost"}
                      size="sm"
                      className={`flex items-center gap-1 whitespace-nowrap ${
                        isActive(navItem.path) 
                          ? "bg-primary text-primary-foreground" 
                          : "text-gray-600 hover:text-primary"
                      }`}
                    >
                      <NavIcon className="h-3 w-3" />
                      {navItem.label}
                    </Button>
                  </Link>
                );
              });
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