import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  tone?: 'primary' | 'secondary' | 'ghost';
}

export function Button({ children, className = '', tone = 'primary', type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={`button button--${tone} ${className}`.trim()} {...props}>{children}</button>;
}
