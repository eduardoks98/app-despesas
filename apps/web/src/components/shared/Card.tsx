/**
 * Card Component - Web Version
 * 
 * Versão web do componente Card do design system
 */

import React from 'react';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variante visual do card */
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  
  /** Tamanho do padding interno */
  padding?: 'none' | 'small' | 'medium' | 'large';
  
  /** Se o card é clicável */
  clickable?: boolean;
  
  /** Função chamada ao clicar no card */
  onPress?: () => void;
  
  /** Conteúdo do cabeçalho */
  header?: React.ReactNode;
  
  /** Conteúdo do rodapé */
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'medium',
  clickable = false,
  onPress,
  header,
  footer,
  children,
  className,
  onClick,
  ...props
}) => {
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (clickable && onPress) {
      onPress();
    }
    onClick?.(event);
  };

  const cardClasses = [
    styles.card,
    styles[`variant-${variant}`],
    styles[`padding-${padding}`],
    clickable && styles.clickable,
    className,
  ].filter(Boolean).join(' ');

  const Component = clickable ? 'button' : 'div';

  return (
    <Component
      className={cardClasses}
      onClick={clickable ? handleClick : onClick}
      {...(clickable ? { type: 'button' } : {})}
      {...props}
    >
      {header && (
        <div className={styles.header}>
          {header}
        </div>
      )}
      
      <div className={styles.content}>
        {children}
      </div>
      
      {footer && (
        <div className={styles.footer}>
          {footer}
        </div>
      )}
    </Component>
  );
};