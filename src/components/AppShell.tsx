'use client';

import { usePathname } from 'next/navigation';

interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShell({ sidebar, children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';

  if (isAuthPage) {
    return (
      <main className="w-full h-full min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <>
      {sidebar}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto print:h-auto print:overflow-visible print:block">
        {children}
      </div>
    </>
  );
}
