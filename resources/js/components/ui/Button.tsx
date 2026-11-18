import { forwardRef, ButtonHTMLAttributes } from 'react';
import { classNames } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
}

const VARIANT: Record<Variant, string> = {
    primary: 'bg-[#0F5A5E] text-white hover:bg-[#0A4447] focus:ring-[#4DB6AC] shadow-xs',
    secondary: 'bg-white text-[#083336] border border-[#0F5A5E]/20 hover:bg-[#F9F8F3] hover:text-[#0F5A5E] focus:ring-[#4DB6AC] shadow-xs',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-xs',
    ghost: 'text-[#083336] hover:bg-[#F0F7F7] hover:text-[#0F5A5E] focus:ring-[#4DB6AC]',
};

const SIZE: Record<Size, string> = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...rest }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || loading}
                className={classNames(
                    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-offset-1',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    VARIANT[variant],
                    SIZE[size],
                    className
                )}
                {...rest}
            >
                {loading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                )}
                {children}
            </button>
        );
    }
);
Button.displayName = 'Button';
export default Button;
