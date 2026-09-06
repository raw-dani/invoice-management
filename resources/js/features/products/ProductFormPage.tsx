import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useProduct, useCreateProduct, useUpdateProduct } from './hooks';
import { Card, CardBody, CardHeader, PageHeader } from '../../components/ui/Display';
import { Input, Select, Field, Textarea } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { taxesApi } from '../../api/taxes';

type FormData = {
    name: string;
    description: string;
    type: 'one_time' | 'subscription';
    price: number;
    currency: string;
    tax_rate: number;
    billing_cycle: 'monthly' | 'quarterly' | 'semi_annual' | 'yearly' | '';
    status: 'active' | 'inactive';
    notes: string;
};

export default function ProductFormPage() {
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id && id !== 'new';
    const navigate = useNavigate();

    const { data: existing, isLoading } = useProduct(isEdit ? Number(id) : undefined);
    const createMutation = useCreateProduct();
    const updateMutation = useUpdateProduct();
    const { data: taxRates } = useQuery({ queryKey: ['tax-rates'], queryFn: taxesApi.list });

    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
        defaultValues: {
            name: '', description: '', type: 'one_time', price: 0,
            currency: 'IDR', tax_rate: 0, billing_cycle: '', status: 'active', notes: '',
        },
        values: existing ? {
            name: existing.name,
            description: existing.description ?? '',
            type: existing.type,
            price: existing.price,
            currency: existing.currency,
            tax_rate: existing.tax_rate,
            billing_cycle: existing.billing_cycle ?? '',
            status: existing.status,
            notes: existing.notes ?? '',
        } : undefined,
    });

    const isSubscription = watch('type') === 'subscription';

    const onSubmit = async (data: FormData) => {
        const payload: any = {
            ...data,
            billing_cycle: isSubscription ? data.billing_cycle : null,
        };
        if (!isEdit) {
            const created = await createMutation.mutateAsync(payload);
            navigate(`/products/${created.id}`);
        } else if (id) {
            await updateMutation.mutateAsync({ id: Number(id), data: payload });
            navigate(`/products/${id}`);
        }
    };

    if (isEdit && isLoading) return <div>Loading...</div>;

    return (
        <>
            <PageHeader
                title={isEdit ? 'Edit Product' : 'New Product'}
                actions={<Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>}
            />

            <Card>
                <CardHeader><h3 className="font-medium">Product Information</h3></CardHeader>
                <CardBody>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Name" required error={errors.name?.message}>
                            <Input {...register('name', { required: 'Required' })} />
                        </Field>
                        <Field label="Type" required>
                            <Select {...register('type')}>
                                <option value="one_time">One Time</option>
                                <option value="subscription">Subscription</option>
                            </Select>
                        </Field>
                        <Field label="Price" required error={errors.price?.message}>
                            <Input
                                type="number"
                                step="0.01"
                                {...register('price', { required: 'Required', valueAsNumber: true, min: 0 })}
                            />
                        </Field>
                        <Field label="Currency" required>
                            <Select {...register('currency')}>
                                <option value="IDR">IDR</option>
                                <option value="USD">USD</option>
                                <option value="SGD">SGD</option>
                                <option value="EUR">EUR</option>
                                <option value="AUD">AUD</option>
                            </Select>
                        </Field>
                        <Field label="Tax Rate" error={errors.tax_rate?.message}>
                            <Select {...register('tax_rate', { valueAsNumber: true, min: 0, max: 100 })}>
                                {(taxRates?.length ? taxRates : [
                                    { id: 0, name: 'No Tax', rate: 0 },
                                    { id: -1, name: 'PPN 11%', rate: 11 },
                                    { id: -2, name: 'PPN 12%', rate: 12 },
                                ]).map((tax) => <option key={tax.id} value={tax.rate}>{tax.name} ({tax.rate}%)</option>)}
                            </Select>
                        </Field>
                        {isSubscription && (
                            <Field label="Billing Cycle" required>
                                <Select {...register('billing_cycle', { required: 'Required' })}>
                                    <option value="">Select cycle</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="semi_annual">Semi Annual</option>
                                    <option value="yearly">Yearly</option>
                                </Select>
                            </Field>
                        )}
                        <Field label="Status" required>
                            <Select {...register('status')}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </Select>
                        </Field>
                        <div className="md:col-span-2">
                            <Field label="Description" error={errors.description?.message}>
                                <Textarea {...register('description')} />
                            </Field>
                        </div>
                        <div className="md:col-span-2">
                            <Field label="Notes" error={errors.notes?.message}>
                                <Textarea {...register('notes')} />
                            </Field>
                        </div>
                        <div className="md:col-span-2 flex justify-end pt-2">
                            <Button type="submit" loading={isSubmitting}>
                                {isEdit ? 'Update Product' : 'Create Product'}
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </>
    );
}
