import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Sidebar.module.css';

const navigationItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: '📊',
  },
  {
    path: '/transactions',
    label: 'Transações',
    icon: '💰',
  },
  {
    path: '/reports',
    label: 'Relatórios',
    icon: '📈',
  },
  {
    path: '/profile',
    label: 'Perfil',
    icon: '👤',
  },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>💼</div>
        <span className={styles.logoText}>App Despesas</span>
        {user?.plan === 'premium' && (
          <span className={styles.premiumBadge}>Premium</span>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.navigation}>
        {navigationItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
            }
            end={item.path === '/'}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className={styles.userDetails}>
            <div className={styles.userName}>{user?.name}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};