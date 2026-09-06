import { ReactNode } from 'react';
import { classNames, statusBadgeClass, statusLabel } from '../../lib/utils';

interface BadgeProps {
    status: string;
    className?: string;
}

export function StatusBadge({ status, className }: BadgeProps) {
    return (
        <span className={classNames(
            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
            statusBadgeClass(status),
            className
        )}>
            {statusLabel(status)}
        </span>
    );
}

interface CardProps {
    children: ReactNode;
    className?: string;
}

export function Card({ children, className }: CardProps) {
    return (
        <div className={classNames('bg-white shadow rounded-lg', className)}>
            {children}
        </div>
    );
}

export function CardHeader({ children, className }: CardProps) {
    return (
        <div className={classNames('px-5 py-4 border-b border-gray-200', className)}>
            {children}
        </div>
    );
}

export function CardBody({ children, className }: CardProps) {
    return (
        <div className={classNames('px-5 py-4', className)}>
            {children}
        </div>
    );
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="flex justify-between items-start mb-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
        </div>
    );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
    return (
        <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
            {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
