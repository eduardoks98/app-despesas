import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <div className={styles.left}>
          <h1 className={styles.title}>Dashboard</h1>
        </div>
        
        <div className={styles.right}>
          <button
            onClick={toggleTheme}
            className={styles.themeToggle}
            title={`Mudar para modo ${theme === 'light' ? 'escuro' : 'claro'}`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          
          <button
            onClick={logout}
            className={styles.logoutButton}
            title="Sair"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};