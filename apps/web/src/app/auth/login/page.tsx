'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Email ou senha incorretos');
        return;
      }

      if (result?.ok) {
        toast.success('Login realizado com sucesso!');
        
        // Get the session to check user status
        const session = await getSession();
        
        // Redirect based on user type
        if (session?.user?.isPremium) {
          router.push('/dashboard');
        } else {
          router.push('/dashboard?welcome=true');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              App Despesas
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Entre na sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="seu@email.com"
                {...register('email', {
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Senha
              </label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="••••••••"
                {...register('password', {
                  required: 'Senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'Senha deve ter pelo menos 6 caracteres',
                  },
                })}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  Lembrar de mim
                </label>
              </div>

              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
              >
                Esqueceu a senha?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                  Novo por aqui?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/auth/register"
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
              >
                Criar conta gratuita
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Ao entrar, você concorda com nossos{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                  Termos de Uso
                </Link>{' '}
                e{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                  Política de Privacidade
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Premium Features Preview */}
        <div className="card p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <h3 className="font-semibold text-lg mb-2">🚀 Recursos Premium</h3>
          <ul className="text-sm space-y-1 opacity-90">
            <li>• Sincronização automática entre dispositivos</li>
            <li>• Relatórios avançados com gráficos</li>
            <li>• Backup na nuvem e exportação</li>
            <li>• Categorias e tags ilimitadas</li>
          </ul>
          <div className="mt-4">
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              14 dias grátis • R$ 9,90/mês
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}