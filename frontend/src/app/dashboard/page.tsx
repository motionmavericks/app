'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page since the dashboard is at /
    router.replace('/');
  }, [router]);

  return null;
}