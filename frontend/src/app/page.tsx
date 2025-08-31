import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Toolbar } from "@/components/dashboard/toolbar";
import { Footerbar } from "@/components/dashboard/footerbar";
import { AssetCard } from "@/components/dashboard/asset-card";
import { assets } from "@/components/dashboard/data";

export default function Home(){
  return (
    <div className="min-h-screen grid grid-rows-[auto_auto_1fr_auto] grid-cols-[18rem_1fr]">
      <div className="col-span-2 row-start-1"><Topbar/></div>
      <div className="row-span-3 row-start-2"><Sidebar/></div>
      <div className="row-start-2 col-start-2"><Toolbar/></div>
      <main className="col-start-2 row-start-3 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map(a => <AssetCard key={a.id} asset={a}/>) }
        </div>
      </main>
      <div className="col-span-2 row-start-4"><Footerbar/></div>
    </div>
  );
}
