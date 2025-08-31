import { Button } from "@/components/ui/button";
import { Download, Share2, ArrowRightLeft } from "lucide-react";

export function Footerbar(){
  return (
    <div className="h-14 border-t bg-card/40 flex items-center justify-between px-4">
      <div className="text-sm text-muted-foreground">2 Assets selected • 198 MB</div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2"><ArrowRightLeft className="h-4 w-4"/>Move to</Button>
        <Button variant="ghost" size="sm" className="gap-2"><Download className="h-4 w-4"/>Download</Button>
        <Button variant="secondary" size="sm" className="gap-2"><Share2 className="h-4 w-4"/>Share</Button>
      </div>
    </div>
  );
}

