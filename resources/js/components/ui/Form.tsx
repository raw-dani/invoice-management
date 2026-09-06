import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { classNames } from '../../lib/utils';

interface FieldProps {
    label: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
    hint?: string;
}

export function Field({ label, error, required, children, hint }: FieldProps) {
    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

const inputClass = (hasError?: string) => classNames(
    'block w-full rounded-md border bg-white px-3 py-2 text-sm shadow-sm',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
    'disabled:bg-gray-100 disabled:cursor-not-allowed',
    hasError ? 'border-red-300' : 'border-gray-300'
);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ error, className, ...rest }, ref) => (
        <input ref={ref} className={classNames(inputClass(error), className)} {...rest} />
    )
);
Input.displayName = 'Input';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ error, className, children, ...rest }, ref) => (
        <select ref={ref} className={classNames(inputClass(error), className)} {...rest}>
            {children}
        </select>
    )
);
Select.displayName = 'Select';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ error, className, ...rest }, ref) => (
        <textarea ref={ref} rows={3} className={classNames(inputClass(error), className)} {...rest} />
    )
);
Textarea.displayName = 'Textarea';
