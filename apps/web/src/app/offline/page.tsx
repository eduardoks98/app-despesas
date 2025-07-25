'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  WifiIcon,
  ArrowPathIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      router.push('/dashboard');
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Check current status
    setIsOnline(navigator.onLine);

    // Listen for connection changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const handleRetry = () => {
    if (navigator.onLine) {
      router.push('/dashboard');
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Status Icon */}
        <div className="mb-8">
          {isOnline ? (
            <WifiIcon className="mx-auto h-24 w-24 text-green-500" />
          ) : (
            <div className="relative">
              <WifiIcon className="mx-auto h-24 w-24 text-gray-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-24 bg-red-500 rotate-45 transform origin-center"></div>
              </div>
            </div>
          )}
        </div>

        {/* Status Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {isOnline ? 'Conectando...' : 'Você está offline'}
        </h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          {isOnline 
            ? 'Reconectando ao App Despesas...' 
            : 'Verifique sua conexão com a internet para acessar todas as funcionalidades.'
          }
        </p>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleRetry}
            disabled={isOnline}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            {isOnline ? 'Conectando...' : 'Tentar novamente'}
          </button>

          {!isOnline && (
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Usar modo offline limitado
            </button>
          )}
        </div>

        {/* Offline Features Info */}
        {!isOnline && (
          <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start">
              <InformationCircleIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-left">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Funcionalidades offline disponíveis:
                </h3>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li>" Visualizar transações salvas</li>
                  <li>" Acessar categorias cadastradas</li>
                  <li>" Ver relatórios básicos em cache</li>
                  <li>" Navegar pela interface</li>
                </ul>
                <p className="text-xs text-blue-700 dark:text-blue-500 mt-3">
                  <strong>Nota:</strong> Novas transações serão sincronizadas quando você voltar online.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          Status da conexão: {' '}
          <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </div>
  );
}