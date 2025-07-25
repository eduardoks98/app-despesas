'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Sidebar } from './Sidebar';
import { LoadingPage } from '@/components/ui';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <LoadingPage message="Carregando aplicação..." />;
  }

  if (status === 'unauthenticated') {
    // This should be handled by middleware, but just in case
    return <LoadingPage message="Redirecionando..." />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden lg:ml-72">
        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}