import { useState } from 'react';
import { useProducts } from '../features/products/hooks';
import { Modal } from './ui/Modal';
import { Input } from './ui/Form';
import { formatMoney } from '../lib/utils';
import type { Product } from '../types';

interface ProductPickerProps {
    open: boolean;
    onClose: () => void;
    onSelect: (product: Product) => void;
}

export function ProductPicker({ open, onClose, onSelect }: ProductPickerProps) {
    const [search, setSearch] = useState('');
    const { data } = useProducts({ search, per_page: 20, status: 'active' });

    return (
        <Modal open={open} onClose={onClose} title="Select Product" size="lg">
            <Input
                autoFocus
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-3"
            />
            <div className="max-h-96 overflow-y-auto divide-y">
                {data?.data?.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => { onSelect(p); onClose(); }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex justify-between items-center"
                    >
                        <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-gray-500">{p.sku} · {p.type_label}</div>
                        </div>
                        <div className="text-sm font-medium">{formatMoney(p.price, p.currency)}</div>
                    </button>
                ))}
                {data?.data?.length === 0 && (
                    <div className="text-center py-6 text-sm text-gray-500">No products found</div>
                )}
            </div>
        </Modal>
    );
}
