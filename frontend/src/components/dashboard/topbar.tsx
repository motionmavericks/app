"use client";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Plus } from "lucide-react";

export function Topbar() {
  return (
    <div className="flex items-center gap-3 px-4 h-14 border-b bg-card/40">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Teaser</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">All Assets</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#" className="text-foreground">Key Scenes</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" variant="ghost" className="gap-2"><Plus className="h-4 w-4"/>New</Button>
        <div className="relative">
          <Input placeholder="Search in Key Scenes" className="w-[280px] bg-secondary" />
        </div>
        <Separator orientation="vertical" className="h-6"/>
        <div className="flex -space-x-2">
          {["AM","JS","LM"].map((n,i)=> (
            <Avatar key={i} className="h-7 w-7 ring-2 ring-background">
              <AvatarImage src={`https://i.pravatar.cc/100?img=${i+5}`} />
              <AvatarFallback>{n}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <Button size="sm" variant="secondary" className="rounded-full px-3">36</Button>
      </div>
    </div>
  );
}

