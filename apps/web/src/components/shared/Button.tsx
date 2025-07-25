/**
 * Button Component - Web Version
 * 
 * Versão web do componente Button do design system
 */

import React from 'react';
import { colors, tokens } from '@shared/tokens';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Texto do botão */
  title: string;
  
  /** Variante visual do botão */
  variant?: 'primary' | 'secondary' | 'outlined' | 'text' | 'danger';
  
  /** Tamanho do botão */
  size?: 'small' | 'medium' | 'large';
  
  /** Estado de carregamento */
  loading?: boolean;
  
  /** Ícone à esquerda do texto */
  leftIcon?: React.ReactNode;
  
  /** Ícone à direita do texto */
  rightIcon?: React.ReactNode;
  
  /** Largura total disponível */
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  onClick,
  ...props
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    onClick?.(event);
  };

  const buttonClasses = [
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    disabled && styles.disabled,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      <div className={styles.content}>
        {loading ? (
          <div className={styles.spinner} />
        ) : (
          <>
            {leftIcon && (
              <span className={styles.leftIcon}>
                {leftIcon}
              </span>
            )}
            
            <span className={styles.text}>
              {title}
            </span>
            
            {rightIcon && (
              <span className={styles.rightIcon}>
                {rightIcon}
              </span>
            )}
          </>
        )}
      </div>
    </button>
  );
};