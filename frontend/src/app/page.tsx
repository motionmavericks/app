import Link from "next/link";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Toolbar } from "@/components/dashboard/toolbar";
import { Footerbar } from "@/components/dashboard/footerbar";
import { AssetCard, type Asset as CardAsset } from "@/components/dashboard/asset-card";

type ApiAsset = { id: string; title?: string | null; staging_key?: string | null; created_at: string };

async function fetchAssets(): Promise<ApiAsset[]> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3000";
  try {
    const r = await fetch(`${apiBase}/api/assets`);
    if (!r.ok) return [];
    const data = await r.json();
    return (data.items ?? []) as ApiAsset[];
  } catch {
    // During build/prerender the API may not be available; return empty list gracefully.
    return [];
  }
}

function toCardAsset(a: ApiAsset): CardAsset {
  const date = new Date(a.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return {
    id: a.id,
    title: a.title || a.staging_key || "Untitled",
    author: "",
    date,
    duration: "",
    tag: undefined,
    thumb: "/placeholder.svg",
    selected: false,
  };
}

export default async function Home(){
  const items = await fetchAssets();
  const cards = items.map(toCardAsset);
  return (
    <div className="min-h-screen grid grid-rows-[auto_auto_1fr_auto] grid-cols-[18rem_1fr]">
      <div className="col-span-2 row-start-1"><Topbar/></div>
      <div className="row-span-3 row-start-2"><Sidebar/></div>
      <div className="row-start-2 col-start-2"><Toolbar/></div>
      <main className="col-start-2 row-start-3 p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map(a => (
            <Link key={a.id} href={`/assets/${a.id}`} className="block">
              <AssetCard asset={a}/>
            </Link>
          ))}
          {cards.length === 0 && (
            <div className="text-sm text-muted-foreground">No assets yet. Try uploading one on the Upload page.</div>
          )}
        </div>
      </main>
      <div className="col-span-2 row-start-4"><Footerbar/></div>
    </div>
  );
}
export const revalidate = 30;
