import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter, usePathname } from "next/navigation";
import { 
  Folder, 
  Film, 
  Images, 
  Mic, 
  User, 
  CheckCircle2, 
  FolderPlus, 
  Share2, 
  Upload,
  Search,
  Clock,
  Star,
  Archive,
  type LucideIcon 
} from "lucide-react";
import { 
  stackVariants, 
  flexVariants, 
  scrollAreaVariants,
  layouts 
} from '@/lib/design-system/components/layout';
import { mamButtonPresets } from '@/lib/design-system/components/button';
import { cn } from '@/lib/utils';

function Section({title, children, count}:{title:string; children:React.ReactNode; count?: number}){
  return (
    <div className="px-4 py-3">
      <div className={cn(
        flexVariants({ justify: 'between', align: 'center' }),
        'mb-3'
      )}>
        <div className="text-xs uppercase text-muted-foreground font-semibold tracking-wide">
          {title}
        </div>
        {count !== undefined && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-5">
            {count}
          </Badge>
        )}
      </div>
      <div className={cn(stackVariants({ gap: 'xs', align: 'stretch' }))}>
        {children}
      </div>
    </div>
  );
}

const NavItem = ({
  icon: Icon, 
  label, 
  active, 
  count,
  variant = 'default',
  href
}: {
  icon: LucideIcon; 
  label: string; 
  active?: boolean; 
  count?: number;
  variant?: 'default' | 'upload' | 'danger';
  href?: string;
}) => {
  const router = useRouter();
  
  const getVariantClasses = () => {
    if (variant === 'upload') return 'text-status-approved hover:bg-status-approved/10 hover:text-status-approved';
    if (variant === 'danger') return 'text-destructive hover:bg-destructive/10 hover:text-destructive';
    return '';
  };

  const handleClick = () => {
    if (href) {
      router.push(href);
    }
  };

  return (
    <Button 
      variant={active ? "secondary" : "ghost"} 
      size="sm" 
      onClick={handleClick}
      className={cn(
        'w-full justify-start gap-3 h-9 px-3 font-medium transition-colors',
        active && 'bg-accent/50 text-accent-foreground shadow-sm',
        !active && 'hover:bg-accent/30',
        getVariantClasses(),
        href && 'cursor-pointer'
      )}
    >
      <Icon className="h-4 w-4 shrink-0" /> 
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 ml-auto">
          {count}
        </Badge>
      )}
    </Button>
  );
};

export function Sidebar(){
  const router = useRouter();
  const pathname = usePathname();
  
  return (
    <aside className={cn(
      layouts.sidebarNav,
      'w-72 border-r bg-sidebar backdrop-blur-sm',
      'shadow-sm'
    )}>
      {/* Header */}
      <div className={cn(
        flexVariants({ justify: 'between', align: 'center' }),
        'px-4 py-4 border-b'
      )}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Film className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">MAM Studio</div>
            <div className="text-xs text-muted-foreground">Media Asset Management</div>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="px-4 py-3 border-b">
        <Button 
          className={cn(mamButtonPresets.upload, 'w-full h-10 text-sm font-semibold')}
          variant="default" 
          size="sm"
          onClick={() => router.push('/upload')}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Assets
        </Button>
      </div>
      
      {/* Scrollable Navigation */}
      <div className={cn(
        scrollAreaVariants({ direction: 'vertical', scrollbar: 'thin' }),
        'flex-1'
      )}>
        <Section title="Assets" count={1247}>
          <NavItem icon={Folder} label="All Assets" active={pathname === '/'} count={1247} href="/" />
          <NavItem icon={Clock} label="Recent" count={24} />
          <NavItem icon={Star} label="Favorites" count={156} />
          <NavItem icon={Archive} label="Archived" count={89} />
        </Section>
        
        <Section title="By Type" count={1247}>
          <NavItem icon={Film} label="Videos" count={342} />
          <NavItem icon={Images} label="Images" count={678} />
          <NavItem icon={Mic} label="Audio" count={134} />
          <NavItem icon={Folder} label="Documents" count={93} />
        </Section>
        
        <Section title="Workflow" count={234}>
          <NavItem icon={CheckCircle2} label="Draft" count={89} />
          <NavItem icon={Clock} label="In Review" count={23} href="/reviews" />
          <NavItem icon={Star} label="Approved" count={67} />
          <NavItem icon={CheckCircle2} label="Published" count={45} />
          <NavItem icon={Archive} label="Archived" count={10} />
        </Section>
        
        <Section title="Collections" count={8}>
          <NavItem icon={Folder} label="Product Launch 2024" count={234} />
          <NavItem icon={Film} label="Campaign Assets" count={156} />
          <NavItem icon={Images} label="Brand Guidelines" count={67} />
          <NavItem icon={FolderPlus} label="Create Collection" variant="upload" />
        </Section>
        
        <Section title="Shares" count={5}>
          <NavItem icon={Share2} label="All Shares" count={12} href="/shares" />
        </Section>
      </div>
      
      {/* Footer */}
      <div className="mt-auto border-t p-4">
        <div className="text-xs text-muted-foreground text-center">
          <div className="font-medium">Storage: 847 GB / 2 TB</div>
          <div className="text-xs mt-1">MAM Studio v2.1</div>
        </div>
      </div>
    </aside>
  );
}
