import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from './ui/Modal';
import { Input, Field } from './ui/Form';
import Button from './ui/Button';
import { customersApi } from '../api/customers';
import type { Customer } from '../types';
import toast from '../lib/toast';

interface QuickAddCustomerProps {
    open: boolean;
    onClose: () => void;
    onCreated: (customer: Customer) => void;
}

const EMPTY = { company_name: '', contact_name: '', email: '', phone: '' };

/**
 * Minimal customer creation modal, usable directly from the
 * invoice/quote wizard without navigating away.
 */
export function QuickAddCustomer({ open, onClose, onCreated }: QuickAddCustomerProps) {
    const [form, setForm] = useState({ ...EMPTY });
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const create = useMutation({
        mutationFn: () => customersApi.create({ ...form, status: 'active' }),
        onSuccess: (customer) => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            setForm({ ...EMPTY });
            setError(null);
            toast.success(`Customer ${customer.company_name} created.`);
            onClose();
            onCreated(customer);
        },
        onError: (e: unknown) => {
            const message = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
                ?? 'Failed to create customer.';
            setError(message);
        },
    });

    const update = (key: keyof typeof EMPTY, value: string) => setForm((f) => ({ ...f, [key]: value }));
    const valid = form.company_name.trim().length > 0;

    return (
        <Modal open={open} onClose={onClose} title="Quick Add Customer" size="md">
            <div className="space-y-3">
                <Field label="Company name" required>
                    <Input value={form.company_name} autoFocus onChange={(e) => update('company_name', e.target.value)} />
                </Field>
                <Field label="Contact name">
                    <Input value={form.contact_name} onChange={(e) => update('contact_name', e.target.value)} />
                </Field>
                <Field label="Email">
                    <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
                </Field>
                <Field label="Phone">
                    <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
                </Field>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button loading={create.isPending} disabled={!valid} onClick={() => create.mutate()}>Create Customer</Button>
                </div>
            </div>
        </Modal>
    );
}
