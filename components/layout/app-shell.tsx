'use client'

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from './navbar'
import { Sidebar } from './sidebar'

const AUTH_PAGES = ['/auth/login', '/auth/register', '/'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During hydration, render neutral structure
  if (!isMounted) {
    return <div suppressHydrationWarning>{children}</div>;
  }

  const isAuthPage = AUTH_PAGES.includes(pathname) || pathname.startsWith('/auth/');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Navbar />
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  )
}
