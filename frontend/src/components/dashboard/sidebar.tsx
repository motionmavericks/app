import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Folder, Film, Images, Mic, User, CheckCircle2, FolderPlus, Share2, type LucideIcon } from "lucide-react";

function Section({title, children}:{title:string; children:React.ReactNode}){
  return (
    <div className="px-3 py-2">
      <div className="text-xs uppercase text-muted-foreground mb-2 px-2">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

const NavItem = ({icon:Icon,label,active}:{icon:LucideIcon;label:string;active?:boolean}) => (
  <Button variant={active?"secondary":"ghost"} size="sm" className="w-full justify-start gap-2">
    <Icon className="h-4 w-4" /> {label}
  </Button>
);

export function Sidebar(){
  return (
    <aside className="w-72 border-r bg-card/30 flex flex-col">
      <div className="px-4 h-14 flex items-center text-sm font-medium tracking-tight">Assets</div>
      <Separator/>
      <Section title="Assets">
        <NavItem icon={Folder} label="All Assets" active/>
        <NavItem icon={Film} label="Episodes" />
        <NavItem icon={Film} label="Key Scenes" />
        <NavItem icon={User} label="Talent" />
        <NavItem icon={Folder} label="Location" />
      </Section>
      <Separator/>
      <Section title="Collections">
        <NavItem icon={CheckCircle2} label="Needs Retouching" />
        <NavItem icon={Film} label="Videos" />
        <NavItem icon={Images} label="Images" />
        <NavItem icon={Mic} label="Audio" />
        <NavItem icon={CheckCircle2} label="Needs Review" />
        <NavItem icon={CheckCircle2} label="Approved" />
        <NavItem icon={FolderPlus} label="New Collection" />
      </Section>
      <Separator/>
      <Section title="Shares">
        <NavItem icon={Share2} label="All Shares" />
        <NavItem icon={Share2} label="Rough Cut 10/14/24" />
        <NavItem icon={Share2} label="Trailer v2" />
        <NavItem icon={Share2} label="New Share" />
      </Section>
      <div className="mt-auto border-t p-3 text-xs text-muted-foreground">C2C Connections</div>
    </aside>
  );
}
