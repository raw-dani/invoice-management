import { ReactNode, useEffect } from 'react';
import { classNames } from '../../lib/utils';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const SIZE = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
};

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
    useEffect(() => {
        if (!open) return;
        const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onEsc);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onEsc);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black/40" onClick={onClose} />
                <div className={classNames('relative bg-white rounded-lg shadow-xl w-full', SIZE[size])}>
                    <div className="flex items-center justify-between px-5 py-4 border-b">
                        <h3 className="text-lg font-medium">{title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="px-5 py-4">{children}</div>
                </div>
            </div>
        </div>
    );
}

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

export function ConfirmDialog({
    open, title, message, confirmText = 'Confirm', cancelText = 'Cancel',
    onConfirm, onCancel, danger,
}: ConfirmDialogProps) {
    return (
        <Modal open={open} onClose={onCancel} title={title} size="sm">
            <p className="text-sm text-gray-600 mb-4">{message}</p>
            <div className="flex justify-end gap-2">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                    {cancelText}
                </button>
                <button
                    onClick={onConfirm}
                    className={classNames(
                        'px-4 py-2 text-sm rounded-md text-white',
                        danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                    )}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
}
