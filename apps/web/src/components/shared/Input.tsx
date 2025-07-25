/**
 * Input Component - Web Version
 * 
 * Versão web do componente Input do design system
 */

import React, { forwardRef } from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label do campo */
  label?: string;
  
  /** Texto de ajuda abaixo do campo */
  helperText?: string;
  
  /** Mensagem de erro */
  error?: string;
  
  /** Ícone à esquerda */
  leftIcon?: React.ReactNode;
  
  /** Ícone à direita */
  rightIcon?: React.ReactNode;
  
  /** Variante visual */
  variant?: 'default' | 'filled' | 'outlined';
  
  /** Tamanho do input */
  size?: 'small' | 'medium' | 'large';
  
  /** Se deve ocupar toda a largura */
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  helperText,
  error,
  leftIcon,
  rightIcon,
  variant = 'outlined',
  size = 'medium',
  fullWidth = true,
  className,
  disabled,
  required,
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = Boolean(error);

  const containerClasses = [
    styles.container,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    fullWidth && styles.fullWidth,
    hasError && styles.hasError,
    disabled && styles.disabled,
    className,
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    leftIcon && styles.hasLeftIcon,
    rightIcon && styles.hasRightIcon,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label 
          htmlFor={inputId} 
          className={styles.label}
        >
          {label}
          {required && (
            <span className={styles.required} aria-label="obrigatório">
              *
            </span>
          )}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        {leftIcon && (
          <div className={styles.leftIcon}>
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            [
              helperText && `${inputId}-helper`,
              error && `${inputId}-error`,
            ].filter(Boolean).join(' ') || undefined
          }
          {...props}
        />
        
        {rightIcon && (
          <div className={styles.rightIcon}>
            {rightIcon}
          </div>
        )}
      </div>
      
      {(helperText || error) && (
        <div className={styles.feedback}>
          {error ? (
            <span 
              id={`${inputId}-error`}
              className={styles.error}
              role="alert"
            >
              {error}
            </span>
          ) : helperText ? (
            <span 
              id={`${inputId}-helper`}
              className={styles.helperText}
            >
              {helperText}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
});