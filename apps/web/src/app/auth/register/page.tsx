'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Conta criada com sucesso! Faça login para continuar.');
        router.push('/auth/login?registered=true');
      } else {
        toast.error(result.message || 'Erro ao criar conta');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Erro ao criar conta. Tente novamente.');
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
              Criar Conta
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Comece a controlar suas finanças hoje
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="name" className="label">
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                className="input"
                placeholder="Seu nome completo"
                {...register('name', {
                  required: 'Nome é obrigatório',
                  minLength: {
                    value: 2,
                    message: 'Nome deve ter pelo menos 2 caracteres',
                  },
                })}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

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
                    value: 8,
                    message: 'Senha deve ter pelo menos 8 caracteres',
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Senha deve conter ao menos: 1 minúscula, 1 maiúscula e 1 número',
                  },
                })}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="input"
                placeholder="••••••••"
                {...register('confirmPassword', {
                  required: 'Confirmação de senha é obrigatória',
                  validate: (value) =>
                    value === password || 'Senhas não coincidem',
                })}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  {...register('terms', {
                    required: 'Você deve aceitar os termos de uso',
                  })}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-gray-700 dark:text-gray-300">
                  Eu aceito os{' '}
                  <Link
                    href="/terms"
                    className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
                    target="_blank"
                  >
                    Termos de Uso
                  </Link>{' '}
                  e{' '}
                  <Link
                    href="/privacy"
                    className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
                    target="_blank"
                  >
                    Política de Privacidade
                  </Link>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.terms.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Criando conta...
                </div>
              ) : (
                'Criar conta gratuita'
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
                  Já tem uma conta?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/auth/login"
                className="text-primary-600 hover:text-primary-500 dark:text-primary-400 font-medium"
              >
                Fazer login
              </Link>
            </div>
          </div>
        </div>

        {/* Free vs Premium Comparison */}
        <div className="card p-6">
          <h3 className="font-semibold text-lg mb-4 text-center">🆓 Comece Grátis</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Plano Gratuito</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>✅ Transações ilimitadas</li>
                <li>✅ Categorias básicas</li>
                <li>✅ Relatórios simples</li>
                <li>✅ Backup local</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-primary-600 mb-2">Premium (R$ 9,90/mês)</h4>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>🚀 Sincronização na nuvem</li>
                <li>📊 Relatórios avançados</li>
                <li>💾 Backup automático</li>
                <li>🏷️ Tags e categorias ilimitadas</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-center">
            <p className="text-sm text-primary-700 dark:text-primary-300">
              <strong>14 dias grátis</strong> de Premium ao se cadastrar!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}