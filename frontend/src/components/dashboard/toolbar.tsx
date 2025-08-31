import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, Columns3, SortDesc } from "lucide-react";

export function Toolbar(){
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b bg-background/60 sticky top-14 z-10">
      <div className="text-sm text-muted-foreground">16 Assets • 134 GB</div>
      <div className="ml-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2"><Columns3 className="h-4 w-4"/>Appearance</Button>
        <Button variant="ghost" size="sm" className="gap-2"><Filter className="h-4 w-4"/>Fields <Badge variant="secondary" className="ml-1">1 Visible</Badge></Button>
        <Button variant="ghost" size="sm" className="gap-2"><SortDesc className="h-4 w-4"/>Sorted by <span className="font-medium">Date Uploaded</span></Button>
      </div>
    </div>
  );
}

