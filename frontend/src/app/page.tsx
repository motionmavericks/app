import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the dashboard page which has the new AssetBrowser
  redirect('/dashboard');
}
