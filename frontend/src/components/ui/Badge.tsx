import type { ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success:
    'badge-green',
  warning:
    'badge-orange',
  danger:
    'badge-red',
  info:
    'badge-neon',
  neutral:
    'badge-gray',
};

const Badge = ({ variant = 'neutral', children, className = '' }: BadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold font-inter ${variantStyles[variant]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
