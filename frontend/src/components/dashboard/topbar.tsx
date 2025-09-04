"use client";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Bell, 
  Settings, 
  User, 
  ChevronDown, 
  Home, 
  FolderOpen 
} from "lucide-react";
import { 
  flexVariants,
  layouts 
} from '@/lib/design-system/components/layout';
import { mamButtonPresets } from '@/lib/design-system/components/button';
import { cn } from '@/lib/utils';

export function Topbar() {
  return (
    <header className={cn(
      layouts.toolbar,
      'h-16 px-6 bg-card/30 backdrop-blur-sm shadow-sm',
      'border-b border-border/50'
    )}>
      {/* Navigation Context */}
      <div className={cn(
        flexVariants({ align: 'center', gap: 'sm' }),
        'flex-1 min-w-0'
      )}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="/" 
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                Assets
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-muted-foreground/60" />
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="#" 
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                All Assets
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="text-muted-foreground/60" />
            <BreadcrumbItem>
              <span className="text-foreground font-medium">Current View</span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      {/* Actions Bar */}
      <div className={cn(
        flexVariants({ align: 'center', gap: 'md' }),
        'shrink-0'
      )}>
        {/* Quick Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Quick search assets..." 
            className={cn(
              'w-80 pl-10 bg-background/50 border-border/50',
              'focus:bg-background focus:border-ring',
              'placeholder:text-muted-foreground/70'
            )}
          />
        </div>
        
        <Separator orientation="vertical" className="h-6 bg-border/50" />
        
        {/* Quick Actions */}
        <Button 
          className={cn(mamButtonPresets.upload, 'h-9')}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Asset
        </Button>
        
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
          <Bell className="h-4 w-4" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs font-medium flex items-center justify-center"
          >
            3
          </Badge>
        </Button>
        
        <Separator orientation="vertical" className="h-6 bg-border/50" />
        
        {/* User Profile */}
        <div className={cn(
          flexVariants({ align: 'center', gap: 'sm' }),
          'relative'
        )}>
          {/* Collaboration Avatars */}
          <div className="flex -space-x-2">
            {[
              { name: "Alice Martin", initials: "AM", status: "online" },
              { name: "John Smith", initials: "JS", status: "away" },
              { name: "Lisa Morgan", initials: "LM", status: "online" }
            ].map((user, i) => (
              <Avatar key={i} className={cn(
                'h-8 w-8 ring-2 ring-background',
                'hover:z-10 transition-all duration-200 hover:scale-110'
              )}>
                <AvatarImage src={`https://i.pravatar.cc/100?img=${i + 5}`} />
                <AvatarFallback className="text-xs font-medium">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          
          {/* Current User */}
          <Button 
            variant="ghost" 
            className={cn(
              flexVariants({ align: 'center', gap: 'sm' }),
              'h-9 px-3 hover:bg-accent/50'
            )}
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src="https://i.pravatar.cc/100?img=1" />
              <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                MC
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium leading-none">Media Creator</span>
              <span className="text-xs text-muted-foreground leading-none mt-1">Administrator</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          
          {/* Settings */}
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

