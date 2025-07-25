'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  HomeIcon,
  ChartBarIcon,
  DocumentArrowUpIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  CreditCardIcon,
  TagIcon,
  ChartPieIcon,
  StarIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui';

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Transações', href: '/transactions', icon: CreditCardIcon },
  { name: 'Categorias', href: '/categories', icon: TagIcon },
  { name: 'Relatórios', href: '/reports', icon: ChartBarIcon, premium: true },
  { name: 'Análises', href: '/analytics', icon: ChartPieIcon, premium: true },
  { name: 'Exportar', href: '/export', icon: DocumentArrowUpIcon, premium: true },
];

const bottomNavigation = [
  { name: 'Configurações', href: '/settings', icon: Cog6ToothIcon },
  { name: 'Upgrade Premium', href: '/upgrade', icon: StarIcon, highlight: true },
];

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/admin', icon: ShieldCheckIcon, admin: true },
  { name: 'Cobrança', href: '/billing', icon: CreditCardIcon },
  { name: 'PIX', href: '/pix', icon: CreditCardIcon },
];

export function Sidebar({ className }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/login' });
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <Link href="/dashboard" className="flex items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              App Despesas
            </span>
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {session?.user?.name || 'Usuário'}
            </p>
            <div className="flex items-center space-x-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {session?.user?.email}
              </p>
              {session?.user?.isPremium ? (
                <Badge variant="info" size="sm">Premium</Badge>
              ) : (
                <Badge variant="default" size="sm">Free</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-6 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const isPremiumFeature = item.premium && !session?.user?.isPremium;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
                isPremiumFeature && 'opacity-60'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                )}
              />
              {item.name}
              {isPremiumFeature && (
                <StarIcon className="ml-auto h-4 w-4 text-yellow-500" />
              )}
            </Link>
          );
        })}

        {/* Admin Navigation */}
        {session?.user?.isAdmin && (
          <>
            <div className="mt-6 mb-2">
              <h3 className="px-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Administração
              </h3>
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href;
              const shouldShow = item.admin ? session?.user?.isAdmin : true;
              
              if (!shouldShow) return null;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                    )}
                  />
                  {item.name}
                  {item.admin && (
                    <ShieldCheckIcon className="ml-auto h-4 w-4 text-red-500" />
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-6 py-4 space-y-1 border-t border-gray-200 dark:border-gray-700">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href;
          const shouldShow = item.name === 'Upgrade Premium' ? !session?.user?.isPremium : true;
          
          if (!shouldShow) return null;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                item.highlight
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700'
                  : isActive
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  item.highlight
                    ? 'text-white'
                    : isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                )}
              />
              {item.name}
              {item.highlight && (
                <StarIcon className="ml-auto h-4 w-4 text-yellow-300" />
              )}
            </Link>
          );
        })}
        
        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn('hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col', className)}>
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              App Despesas
            </span>
          </Link>
          
          <button
            type="button"
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/25" onClick={() => setIsMobileMenuOpen(false)} />
          
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <XMarkIcon className="h-6 w-6 text-white" />
                </button>
              </div>
              
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-900">
                <SidebarContent />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}