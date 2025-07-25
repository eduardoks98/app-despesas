import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Card, Input } from '../components/shared';
import styles from './LoginPage.module.css';

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!isLogin) {
        // Cadastro
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        if (password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres');
        }
      }

      // Simular API call - Em um app real, chamaria a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock login/register
      if (isLogin) {
        await login(email, password);
      } else {
        // Simular cadastro e login automático
        await login(email, password);
      }
      
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao processar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.shape}></div>
        <div className={styles.shape}></div>
      </div>
      
      <div className={styles.formContainer}>
        {/* Logo/Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>💰</span>
            <span className={styles.logoText}>MySys Despesas</span>
          </div>
          <h1 className={styles.title}>
            {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
          </h1>
          <p className={styles.subtitle}>
            {isLogin 
              ? 'Entre para acessar seu controle financeiro' 
              : 'Comece a controlar suas finanças hoje'
            }
          </p>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          {!isLogin && (
            <Input
              label="Nome completo"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              required={!isLogin}
              disabled={isLoading}
              leftIcon="👤"
            />
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            disabled={isLoading}
            leftIcon="📧"
          />

          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            required
            disabled={isLoading}
            minLength={6}
            leftIcon="🔒"
          />

          {!isLogin && (
            <Input
              label="Confirmar senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme sua senha"
              required={!isLogin}
              disabled={isLoading}
              minLength={6}
              leftIcon="🔒"
            />
          )}

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <Button
            title={isLogin ? 'Entrar' : 'Criar conta'}
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          />

          {isLogin && (
            <div className={styles.forgotPassword}>
              <a href="#" className={styles.forgotLink}>
                Esqueceu sua senha?
              </a>
            </div>
          )}
        </form>

        {/* Toggle Mode */}
        <div className={styles.toggleContainer}>
          <p className={styles.toggleText}>
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          </p>
          <Button
            title={isLogin ? 'Criar conta' : 'Fazer login'}
            type="button"
            variant="outlined"
            onClick={toggleMode}
            disabled={isLoading}
          />
        </div>

        {/* Premium Features */}
        <div className={styles.features}>
          <h3 className={styles.featuresTitle}>✨ Recursos Premium</h3>
          <div className={styles.featuresList}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>☁️</span>
              <span className={styles.featureText}>Sincronização em nuvem</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>👥</span>
              <span className={styles.featureText}>Conta conjunta/família</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📱</span>
              <span className={styles.featureText}>Acesso web e mobile</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📊</span>
              <span className={styles.featureText}>Relatórios avançados</span>
            </div>
          </div>
          <p className={styles.pricingText}>
            Apenas R$ 9,90/mês • Cancele quando quiser
          </p>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Ao continuar, você concorda com nossos{' '}
            <a href="#" className={styles.footerLink}>Termos de Uso</a>{' '}
            e{' '}
            <a href="#" className={styles.footerLink}>Política de Privacidade</a>
          </p>
        </div>
      </div>
    </div>
  );
};