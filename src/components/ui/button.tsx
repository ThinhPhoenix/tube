import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'default' | 'secondary';
  label: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({ 
  variant = 'default', 
  label, 
  icon,
  fullWidth = false,
  style,
  ...props 
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    height: 'var(--button-height)',
    minWidth: '100px',
    padding: '0 var(--spacing-lg)',
    borderRadius: 0,
    border: 'none',
    fontSize: 'var(--font-size-md)',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--spacing-sm)',
    transition: 'opacity 0.2s',
    width: fullWidth ? '100%' : 'auto',
    ...style,
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: '#3EA6FF',
      color: '#000000',
    },
    secondary: {
      background: 'transparent',
      color: '#3EA6FF',
    },
    danger: {
      background: '#FF0000',
      color: '#FFFFFF',
    },
    default: {
      background: 'transparent',
      color: '#AAAAAA',
      border: '1px solid #303030',
    },
  };

  return (
    <button
      style={{ ...baseStyles, ...variantStyles[variant] }}
      {...props}
    >
      {icon}
      {label}
    </button>
  );
}
