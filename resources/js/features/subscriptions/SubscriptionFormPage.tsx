import { useFieldArray, useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useSubscription, useCreateSubscription, useUpdateSubscription } from './hooks';
import { useCustomers } from '../customers/hooks';
import { useProducts } from '../products/hooks';
import { Card, CardBody, CardHeader, PageHeader } from '../../components/ui/Display';
import { Field, Input, Select, Textarea } from '../../components/ui/Form';
import Button from '../../components/ui/Button';

type FormData = {
    customer_id: number;
    status: 'draft' | 'active' | 'paused' | 'cancelled' | 'expired';
    billing_cycle: 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';
    start_date: string;
    next_billing_date: string;
    end_date: string;
    invoice_due_days: number;
    currency: string;
    notes: string;
    items: Array<{ product_id?: number | null; description: string; quantity: number; unit_price: number; discount: number; tax_rate: number }>;
};

export default function SubscriptionFormPage() {
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id && id !== 'new';
    const navigate = useNavigate();
    const { data: existing, isLoading } = useSubscription(isEdit ? Number(id) : undefined);
    const { data: customers } = useCustomers({ per_page: 100 });
    const { data: products } = useProducts({ type: 'subscription', per_page: 100 });
    const createMutation = useCreateSubscription();
    const updateMutation = useUpdateSubscription();
    const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
        defaultValues: { customer_id: 0, status: 'active', billing_cycle: 'monthly', start_date: new Date().toISOString().slice(0, 10), next_billing_date: new Date().toISOString().slice(0, 10), end_date: '', invoice_due_days: 30, currency: 'IDR', notes: '', items: [{ description: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 0 }] },
        values: existing ? { customer_id: existing.customer_id, status: existing.status, billing_cycle: existing.billing_cycle, start_date: existing.start_date, next_billing_date: existing.next_billing_date, end_date: existing.end_date ?? '', invoice_due_days: existing.invoice_due_days, currency: existing.currency, notes: existing.notes ?? '', items: existing.items?.map((item) => ({ product_id: item.product_id, description: item.description, quantity: item.quantity, unit_price: item.unit_price, discount: item.discount, tax_rate: item.tax_rate })) ?? [] } : undefined,
    });
    const { fields, append, remove } = useFieldArray({ control, name: 'items' });

    if (isEdit && isLoading) return <div>Loading...</div>;
    const onSubmit = async (data: FormData) => {
        const payload = { ...data, end_date: data.end_date || null };
        if (isEdit) await updateMutation.mutateAsync({ id: Number(id), data: payload });
        else await createMutation.mutateAsync(payload);
        navigate('/subscriptions');
    };

    return <>
        <PageHeader title={isEdit ? 'Edit Subscription' : 'New Subscription'} actions={<Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>} />
        <Card><CardHeader><h3 className="font-medium">Subscription Information</h3></CardHeader><CardBody>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Customer" required error={errors.customer_id?.message}><Select {...register('customer_id', { required: 'Required', valueAsNumber: true, min: { value: 1, message: 'Required' } })}><option value="0">Select customer</option>{customers?.data.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}</Select></Field>
                <Field label="Status" required><Select {...register('status')}><option value="active">Active</option><option value="draft">Draft</option><option value="paused">Paused</option></Select></Field>
                <Field label="Billing Cycle" required><Select {...register('billing_cycle')}><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="semi_annual">Semi Annual</option><option value="yearly">Yearly</option></Select></Field>
                <Field label="Currency" required><Select {...register('currency')}><option>IDR</option><option>USD</option><option>SGD</option><option>EUR</option><option>AUD</option></Select></Field>
                <Field label="Start Date" required><Input type="date" {...register('start_date', { required: 'Required' })} /></Field>
                <Field label="Next Billing Date" required><Input type="date" {...register('next_billing_date', { required: 'Required' })} /></Field>
                <Field label="End Date"><Input type="date" {...register('end_date')} /></Field>
                <Field label="Invoice Due Days" required><Input type="number" {...register('invoice_due_days', { valueAsNumber: true, min: 0 })} /></Field>
                <div className="md:col-span-2"><Field label="Notes"><Textarea {...register('notes')} /></Field></div>
                <div className="md:col-span-2"><div className="flex items-center justify-between mb-2"><h3 className="font-medium">Recurring Items</h3><Button type="button" size="sm" variant="secondary" onClick={() => append({ description: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 0 })}>+ Add Item</Button></div>
                    <div className="space-y-3">{fields.map((field, index) => <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end"><Field label="Product"><Select {...register(`items.${index}.product_id`, { valueAsNumber: true })} onChange={(e) => { const product = products?.data.find((p) => p.id === Number(e.target.value)); if (product) { setValue(`items.${index}.description`, product.name); setValue(`items.${index}.unit_price`, product.price); setValue(`items.${index}.tax_rate`, product.tax_rate); } }}><option value="">Custom item</option>{products?.data.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field><Field label="Description"><Input {...register(`items.${index}.description`, { required: 'Required' })} /></Field><Field label="Qty"><Input type="number" step="0.01" {...register(`items.${index}.quantity`, { valueAsNumber: true, min: 0.01 })} /></Field><Field label="Unit price"><Input type="number" step="0.01" {...register(`items.${index}.unit_price`, { valueAsNumber: true, min: 0 })} /></Field><Field label="Tax %"><Input type="number" step="0.01" {...register(`items.${index}.tax_rate`, { valueAsNumber: true, min: 0, max: 100 })} /></Field><Button type="button" variant="danger" size="sm" onClick={() => remove(index)} disabled={fields.length === 1}>Remove</Button></div>)}</div>
                </div>
                <div className="md:col-span-2 flex justify-end"><Button type="submit" loading={isSubmitting}>{isEdit ? 'Update Subscription' : 'Create Subscription'}</Button></div>
            </form>
        </CardBody></Card>
    </>;
}