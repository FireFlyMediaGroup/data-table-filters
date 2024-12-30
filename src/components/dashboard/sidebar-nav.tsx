'use client';

import Link from 'next/link';
import { Button } from "../ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import { FileText, Plane, ClipboardList, FolderOpen, Users, Home, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from "../../lib/utils";

interface SidebarNavProps {
  userRole: string;
}

export function SidebarNav({ userRole }: SidebarNavProps) {
  const navItems = [
    {
      title: "Dashboard",
      description: "Return to main dashboard",
      icon: Home,
      href: "/dashboard",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 group-hover:bg-indigo-100",
    },
    {
      title: "POWRA Form",
      description: "Plan of Work Risk Assessment",
      icon: FileText,
      href: "/dashboard/forms/powra",
      color: "text-blue-600",
      bgColor: "bg-blue-50 group-hover:bg-blue-100",
    },
    {
      title: "FPL Mission",
      description: "Flight Planning and Logging",
      icon: Plane,
      href: "/dashboard/forms/fpl-mission",
      color: "text-green-600",
      bgColor: "bg-green-50 group-hover:bg-green-100",
    },
    {
      title: "Tailboard",
      description: "Pre-job safety discussion",
      icon: ClipboardList,
      href: "/dashboard/forms/tailboard",
      color: "text-purple-600",
      bgColor: "bg-purple-50 group-hover:bg-purple-100",
    },
    {
      title: "Documents",
      description: "View all documents",
      icon: FolderOpen,
      href: "/dashboard/documents",
      color: "text-orange-600",
      bgColor: "bg-orange-50 group-hover:bg-orange-100",
    },
  ];

  // Add admin panel for admin users
  if (userRole === 'admin') {
    navItems.push({
      title: "Admin Panel",
      description: "Manage users and settings",
      icon: Users,
      href: "/dashboard/admin/users",
      color: "text-gray-600",
      bgColor: "bg-gray-50 group-hover:bg-gray-100",
    });
  }

  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  return (
    <div className={cn(
      "min-h-screen border-r bg-muted/10 transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className="p-2 space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn(
            "text-lg font-semibold transition-opacity duration-200",
            isCollapsed ? "opacity-0 hidden" : "opacity-100 px-2"
          )}>
            Navigation
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCollapse}
            className="h-8 w-8"
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <Card className={cn(
              "group hover:shadow-md transition-all duration-300 border",
              isCollapsed && "px-2 py-4"
            )}>
              {isCollapsed ? (
                <div className={cn("p-2 rounded-lg transition-colors mx-auto", item.bgColor)}>
                  <item.icon className={cn("h-5 w-5", item.color)} />
                </div>
              ) : (
                <>
                  <CardHeader className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg transition-colors", item.bgColor)}>
                        <item.icon className={cn("h-5 w-5", item.color)} />
                      </div>
                      <h3 className="font-semibold">{item.title}</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 pt-0">
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
