import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';

type ValidationState = 'error' | 'success' | null;

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string;
  validation?: ValidationState;
  errorMessage?: string;
  icon?: ReactNode;
}

const validationStyles: Record<string, string> = {
  error:
    'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
  success:
    'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20',
  normal:
    'input-neon',
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, validation = null, errorMessage, icon, className = '', id, ...props }, ref) => {
    const [, setFocused] = useState(false);
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    const state = validation || 'normal';

    return (
      <div className="w-full">
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 pointer-events-none z-10">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            onFocus={(e) => {
              setFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              props.onBlur?.(e);
            }}
            className={`peer w-full rounded-xl border-2 bg-white/5 px-4 pb-2 pt-6 text-sm text-gray-100 outline-none transition-all duration-200 placeholder-transparent disabled:opacity-50 disabled:cursor-not-allowed ${icon ? 'pl-11' : ''} ${validationStyles[state]} ${className}`}
            placeholder={label}
            {...props}
          />
          <label
            htmlFor={inputId}
            className={`absolute left-3 top-1 origin-[0] -translate-y-1 scale-75 transform cursor-text select-none px-1 text-sm font-medium transition-all duration-200 peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:scale-100 peer-focus:top-1 peer-focus:-translate-y-1 peer-focus:scale-75 ${
              state === 'error'
                ? 'text-red-400'
                : state === 'success'
                  ? 'text-emerald-400'
                  : 'text-gray-500 peer-focus:text-cyan-400'
            } ${icon ? 'left-11' : ''}`}
          >
            {label}
          </label>
        </div>
        {state === 'error' && errorMessage && (
          <p className="mt-1.5 text-xs font-medium text-red-400">{errorMessage}</p>
        )}
        {state === 'success' && (
          <p className="mt-1.5 text-xs font-medium text-emerald-400">Looks good!</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
