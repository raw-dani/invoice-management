import { useForm } from 'react-hook-form';
import { useCreatePayment } from './hooks';
import { Modal } from '../../components/ui/Modal';
import { Field, Input, Select, Textarea } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { formatMoney } from '../../lib/utils';
import toast from '../../lib/toast';
import type { Invoice } from '../../types';

interface RecordPaymentFormProps {
    open: boolean;
    onClose: () => void;
    invoice: Invoice;
}

interface FormData {
    payment_date: string;
    amount: number;
    currency: string;
    payment_method: 'bank_transfer' | 'cash' | 'credit_card' | 'e_wallet' | 'other';
    reference: string;
    notes: string;
}

export function RecordPaymentForm({ open, onClose, invoice }: RecordPaymentFormProps) {
    const create = useCreatePayment();
    const remaining = Number(invoice.balance);

    const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
        defaultValues: {
            payment_date: new Date().toISOString().split('T')[0],
            amount: remaining,
            currency: invoice.currency,
            payment_method: 'bank_transfer',
            reference: '',
            notes: '',
        },
    });

    const amount = watch('amount');

    const onSubmit = async (data: FormData) => {
        try {
            await create.mutateAsync({
                invoice_id: invoice.id,
                payment_date: data.payment_date,
                amount: Number(data.amount),
                currency: data.currency,
                payment_method: data.payment_method,
                reference: data.reference || undefined,
                notes: data.notes || undefined,
            });
            toast.success('Payment recorded');
            reset();
            onClose();
        } catch (err: any) {
            const msg = err.response?.data?.message ?? 'Failed to record payment';
            toast.error(msg);
        }
    };

    const overAmount = Number(amount) > remaining;

    return (
        <Modal open={open} onClose={onClose} title={`Record Payment · ${invoice.invoice_number}`} size="md">
            <div className="mb-4 flex justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                <span className="text-gray-500">Outstanding balance</span>
                <span className="font-medium">{formatMoney(remaining, invoice.currency)}</span>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Payment Date" required>
                    <Input type="date" {...register('payment_date', { required: true })} />
                </Field>

                <Field label="Amount" required error={errors.amount?.message}>
                    <Input
                        type="number"
                        step="0.01"
                        {...register('amount', { required: 'Required', valueAsNumber: true, min: 0.01 })}
                    />
                    {overAmount && (
                        <p className="text-xs text-red-600 mt-1">
                            Exceeds outstanding balance of {formatMoney(remaining, invoice.currency)}
                        </p>
                    )}
                </Field>

                <Field label="Currency" required>
                    <Select {...register('currency')}>
                        <option>IDR</option><option>USD</option><option>SGD</option>
                        <option>EUR</option><option>AUD</option>
                    </Select>
                </Field>

                <Field label="Payment Method" required>
                    <Select {...register('payment_method')}>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="cash">Cash</option>
                        <option value="credit_card">Credit Card</option>
                        <option value="e_wallet">E-Wallet</option>
                        <option value="other">Other</option>
                    </Select>
                </Field>

                <div className="md:col-span-2">
                    <Field label="Reference (transaction ID, check no, etc.)">
                        <Input {...register('reference')} placeholder="e.g. TRX-123456" />
                    </Field>
                </div>

                <div className="md:col-span-2">
                    <Field label="Notes">
                        <Textarea {...register('notes')} />
                    </Field>
                </div>

                <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button
                        type="submit"
                        loading={isSubmitting || create.isPending}
                        disabled={overAmount}
                    >
                        Record Payment
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
