'use client'

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from './navbar'
import { Sidebar } from './sidebar'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auth pages: landing, login, register
  const isAuthPage = pathname.startsWith('/auth') || pathname === '/';

  // During hydration, render a neutral structure to avoid mismatch
  if (!isMounted) {
    return <div suppressHydrationWarning>{children}</div>;
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto bg-background">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
