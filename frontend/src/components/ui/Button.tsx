import type { FC, ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

const Button: FC<ButtonProps> = ({ children, className = '', variant = 'primary', ...rest }) => {
  const base = 'px-4 py-2 rounded inline-flex items-center justify-center';
  const variantClasses =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : variant === 'secondary'
      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      : 'bg-transparent text-gray-800';

  return (
    <button className={`${base} ${variantClasses} ${className}`} {...rest}>
      {children}
    </button>
  );
};

export default Button;
