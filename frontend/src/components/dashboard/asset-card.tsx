import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";

export type Asset = {
  id: string;
  title: string;
  author: string;
  date: string;
  duration: string;
  tag?: string;
  thumb?: string;
  selected?: boolean;
};

export function AssetCard({asset}:{asset:Asset}){
  return (
    <Card className={`bg-card/50 overflow-hidden border-muted/40 ${asset.selected?"ring-2 ring-primary":""}`}>
      <div className="relative aspect-video">
        <Image src={asset.thumb || "/placeholder.svg"} alt="thumb" fill className="object-cover opacity-90"/>
        <div className="absolute left-2 top-2 bg-background/70 rounded-md p-1">
          <Checkbox checked={asset.selected} aria-label="select"/>
        </div>
        <div className="absolute right-2 bottom-2 text-xs bg-background/60 px-1.5 py-0.5 rounded-md">{asset.duration}</div>
      </div>
      <div className="p-3 space-y-2">
        <div className="text-sm font-medium line-clamp-1">{asset.title}</div>
        <div className="text-xs text-muted-foreground">{asset.author} • {asset.date}</div>
        <div className="bg-secondary rounded-md p-2 text-xs flex items-center justify-between">
          <div className="text-muted-foreground">Role</div>
          {asset.tag && <Badge variant="secondary" className="rounded">{asset.tag}</Badge>}
        </div>
      </div>
    </Card>
  );
}

