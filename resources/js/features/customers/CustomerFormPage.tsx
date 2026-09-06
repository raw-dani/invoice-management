import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useCustomer, useCreateCustomer, useUpdateCustomer } from './hooks';
import { Card, CardBody, CardHeader, PageHeader } from '../../components/ui/Display';
import { Input, Select, Field, Textarea } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import type { Customer } from '../../types';

type FormData = Omit<Customer, 'id' | 'company_id' | 'customer_number' | 'created_at' | 'updated_at' | 'status_color'>;

export default function CustomerFormPage() {
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id && id !== 'new';
    const navigate = useNavigate();

    const { data: existing, isLoading } = useCustomer(isEdit ? Number(id) : undefined);
    const createMutation = useCreateCustomer();
    const updateMutation = useUpdateCustomer();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        values: existing ? {
            company_name: existing.company_name,
            contact_name: existing.contact_name ?? '',
            email: existing.email ?? '',
            phone: existing.phone ?? '',
            address: existing.address ?? '',
            city: existing.city ?? '',
            province: existing.province ?? '',
            country: existing.country ?? '',
            tax_number: existing.tax_number ?? '',
            notes: existing.notes ?? '',
            status: existing.status,
        } : undefined,
    });

    const onSubmit = async (data: FormData) => {
        const payload: Partial<Customer> = { ...data };
        if (createMutation.mutateAsync) {
            const created = await createMutation.mutateAsync(payload);
            navigate(`/customers/${created.id}`);
        }
        if (isEdit && id) {
            await updateMutation.mutateAsync({ id: Number(id), data: payload });
            navigate(`/customers/${id}`);
        }
    };

    if (isEdit && isLoading) return <div className="p-8">Loading...</div>;

    return (
        <>
            <PageHeader
                title={isEdit ? 'Edit Customer' : 'New Customer'}
                actions={<Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>}
            />

            <Card>
                <CardHeader><h3 className="font-medium">Customer Information</h3></CardHeader>
                <CardBody>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Company name" required error={errors.company_name?.message}>
                            <Input {...register('company_name', { required: 'Required' })} />
                        </Field>
                        <Field label="Contact name" error={errors.contact_name?.message}>
                            <Input {...register('contact_name')} />
                        </Field>
                        <Field label="Email" error={errors.email?.message}>
                            <Input type="email" {...register('email')} />
                        </Field>
                        <Field label="Phone" error={errors.phone?.message}>
                            <Input {...register('phone')} />
                        </Field>
                        <Field label="Tax Number" error={errors.tax_number?.message}>
                            <Input {...register('tax_number')} />
                        </Field>
                        <Field label="Status" required>
                            <Select {...register('status')}>
                                <option value="lead">Lead</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </Select>
                        </Field>
                        <div className="md:col-span-2">
                            <Field label="Address" error={errors.address?.message}>
                                <Textarea {...register('address')} />
                            </Field>
                        </div>
                        <Field label="City" error={errors.city?.message}>
                            <Input {...register('city')} />
                        </Field>
                        <Field label="Province" error={errors.province?.message}>
                            <Input {...register('province')} />
                        </Field>
                        <Field label="Country" error={errors.country?.message}>
                            <Input {...register('country')} />
                        </Field>
                        <div className="md:col-span-2">
                            <Field label="Notes" error={errors.notes?.message}>
                                <Textarea {...register('notes')} />
                            </Field>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                            <Button type="submit" loading={isSubmitting}>
                                {isEdit ? 'Update Customer' : 'Create Customer'}
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </>
    );
}
