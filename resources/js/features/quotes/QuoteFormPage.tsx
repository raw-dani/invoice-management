import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuote, useCreateQuote, useUpdateQuote } from './hooks';
import { useCustomers } from '../customers/hooks';
import { Card, CardBody, PageHeader } from '../../components/ui/Display';
import { Input, Select, Field, Textarea } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { ProductPicker } from '../../components/ProductPicker';
import { QuickAddCustomer } from '../../components/QuickAddCustomer';
import { formatMoney, classNames } from '../../lib/utils';
import toast from '../../lib/toast';
import { CheckIcon, PlusIcon, TrashIcon } from '../../components/ui/Icons';
import type { Product } from '../../types';
import type { QuoteInput } from '../../api/quotes';

interface Item {
    product_id: number | null;
    description: string;
    quantity: number;
    unit_price: number;
    discount: number;
    tax_rate: number;
}

const STEPS = ['Customer', 'Items', 'Terms', 'Preview'];

export default function QuoteFormPage() {
    const { id } = useParams<{ id?: string }>();
    const [searchParams] = useSearchParams();
    const isEdit = !!id && id !== 'new';
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<number | null>(null);
    const [customerId, setCustomerId] = useState<number | null>(
        searchParams.get('customer_id') ? Number(searchParams.get('customer_id')) : null
    );
    const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
    const [validUntil, setValidUntil] = useState(
        new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
    );
    const [currency, setCurrency] = useState('IDR');
    const [taxRate, setTaxRate] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState<0 | 1>(0);
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState('');
    const [items, setItems] = useState<Item[]>([
        { product_id: null, description: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 0 },
    ]);

    const { data: customersData } = useCustomers({ per_page: 100 });
    const { data: existing, isLoading } = useQuote(isEdit ? Number(id) : undefined);
    const createMutation = useCreateQuote();
    const updateMutation = useUpdateQuote();

    useEffect(() => {
        if (existing) {
            setCustomerId(existing.customer_id);
            setQuoteDate(existing.quote_date);
            setValidUntil(existing.valid_until ?? '');
            setCurrency(existing.currency);
            setTaxRate(existing.tax_rate);
            setDiscount(existing.discount);
            setDiscountType(existing.discount_type);
            setNotes(existing.notes ?? '');
            setTerms(existing.terms ?? '');
            setItems(existing.items?.map((it) => ({
                product_id: it.product_id,
                description: it.description,
                quantity: it.quantity,
                unit_price: it.unit_price,
                discount: it.discount,
                tax_rate: it.tax_rate,
            })) ?? []);
        }
    }, [existing]);

    const addItem = () => setItems([
        ...items,
        { product_id: null, description: '', quantity: 1, unit_price: 0, discount: 0, tax_rate: 0 },
    ]);
    const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
    const updateItem = (i: number, patch: Partial<Item>) =>
        setItems(items.map((it, idx) => idx === i ? { ...it, ...patch } : it));

    const selectProduct = (product: Product) => {
        if (activeItem === null) return;
        updateItem(activeItem, {
            product_id: product.id,
            description: product.name,
            unit_price: product.price,
            tax_rate: product.tax_rate,
        });
        setCurrency(product.currency);
    };

    const calcItemTotal = (it: Item) => Math.max(0, it.quantity * it.unit_price - it.discount);

    const subtotal = items.reduce((s, it) => s + calcItemTotal(it), 0);
    const discountAmount = discountType === 1 ? subtotal * (discount / 100) : discount;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = afterDiscount * (taxRate / 100);
    const total = afterDiscount + taxAmount;

    const canNext = () => {
        if (step === 1) return !!customerId;
        if (step === 2) return items.length > 0 && items.every((i) => i.description && i.quantity > 0 && i.unit_price >= 0);
        return true;
    };

    const handleSubmit = async () => {
        if (!customerId) return;
        const payload: QuoteInput = {
            customer_id: customerId,
            quote_date: quoteDate,
            valid_until: validUntil || undefined,
            currency,
            discount,
            discount_type: discountType,
            tax_rate: taxRate,
            notes: notes || undefined,
            terms: terms || undefined,
            items: items.map((i) => ({
                product_id: i.product_id,
                description: i.description,
                quantity: i.quantity,
                unit_price: i.unit_price,
                discount: i.discount,
                tax_rate: i.tax_rate,
            })),
        };
        try {
            if (!isEdit) {
                const created = await createMutation.mutateAsync(payload);
                toast.success('Quote created successfully.');
                navigate(`/quotes/${created.id}`);
            } else if (id) {
                await updateMutation.mutateAsync({ id: Number(id), data: payload });
                toast.success('Quote updated successfully.');
                navigate(`/quotes/${id}`);
            }
        } catch (e) {
            toast.error('Failed to save quote.');
        }
    };

    if (isEdit && isLoading) return <div>Loading...</div>;

    return (
        <>
            <PageHeader
                title={isEdit ? 'Edit Quote' : 'New Quote'}
                actions={<Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>}
            />

            <div className="mb-6 flex items-center">
                {STEPS.map((label, i) => {
                    const num = i + 1;
                    const active = step === num;
                    const done = step > num;
                    return (
                        <div key={label} className="flex items-center">
                            <button
                                onClick={() => setStep(num)}
                                className={classNames(
                                    'flex items-center gap-2 px-3 py-2 rounded',
                                    active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                                )}
                            >
                                <span className={classNames(
                                    'w-6 h-6 rounded-full text-xs flex items-center justify-center',
                                    done ? 'bg-indigo-600 text-white' : active ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200'
                                )}>
                                    {done ? <CheckIcon className="w-3.5 h-3.5" /> : num}
                                </span>
                                <span className="text-sm font-medium">{label}</span>
                            </button>
                            {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-300 mx-2" />}
                        </div>
                    );
                })}
            </div>

            <Card>
                <CardBody>
                    {step === 1 && (
                        <div>
                            <Field label="Customer" required>
                                <Select
                                    value={customerId ?? ''}
                                    onChange={(e) => setCustomerId(Number(e.target.value))}
                                >
                                    <option value="">Select customer...</option>
                                    {customersData?.data.map((c) => (
                                        <option key={c.id} value={c.id}>{c.company_name}</option>
                                    ))}
                                </Select>
                            </Field>
                            <p className="mt-2 text-xs text-gray-500">
                                Don't see the customer?{' '}
                                <button type="button" onClick={() => setQuickAddOpen(true)} className="text-indigo-600 hover:underline">
                                    Add new customer
                                </button>
                            </p>
                            <QuickAddCustomer
                                open={quickAddOpen}
                                onClose={() => setQuickAddOpen(false)}
                                onCreated={(customer) => setCustomerId(customer.id)}
                            />
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-3">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500 border-b">
                                        <th className="pb-2">Description</th>
                                        <th className="pb-2 w-20">Qty</th>
                                        <th className="pb-2 w-28">Price</th>
                                        <th className="pb-2 w-24">Discount</th>
                                        <th className="pb-2 w-20">Tax %</th>
                                        <th className="pb-2 w-28 text-right">Total</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((it, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="py-2 pr-2">
                                                <Input
                                                    value={it.description}
                                                    onChange={(e) => updateItem(i, { description: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => { setActiveItem(i); setPickerOpen(true); }}
                                                    className="mt-1 text-xs text-indigo-600 hover:underline"
                                                >
                                                    Pick from product
                                                </button>
                                            </td>
                                            <td className="py-2 pr-2">
                                                <Input type="number" step="0.01" value={it.quantity}
                                                    onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} />
                                            </td>
                                            <td className="py-2 pr-2">
                                                <Input type="number" step="0.01" value={it.unit_price}
                                                    onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) })} />
                                            </td>
                                            <td className="py-2 pr-2">
                                                <Input type="number" step="0.01" value={it.discount}
                                                    onChange={(e) => updateItem(i, { discount: Number(e.target.value) })} />
                                            </td>
                                            <td className="py-2 pr-2">
                                                <Input type="number" step="0.01" value={it.tax_rate}
                                                    onChange={(e) => updateItem(i, { tax_rate: Number(e.target.value) })} />
                                            </td>
                                            <td className="py-2 text-right">{formatMoney(calcItemTotal(it), currency)}</td>
                                            <td className="py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(i)}
                                                    className="text-gray-400 hover:text-red-600 transition p-1 rounded"
                                                    title="Remove item"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <Button variant="secondary" size="sm" className="inline-flex items-center gap-1.5" onClick={addItem}>
                                <PlusIcon className="w-4 h-4" />
                                <span>Add Item</span>
                            </Button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Quote Date" required>
                                <Input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
                            </Field>
                            <Field label="Valid Until">
                                <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                            </Field>
                            <Field label="Currency" required>
                                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                                    <option>IDR</option><option>USD</option><option>SGD</option>
                                    <option>EUR</option><option>AUD</option>
                                </Select>
                            </Field>
                            <Field label="Tax Rate (%)">
                                <Input type="number" step="0.01" value={taxRate}
                                    onChange={(e) => setTaxRate(Number(e.target.value))} />
                            </Field>
                            <Field label="Discount">
                                <Input type="number" step="0.01" value={discount}
                                    onChange={(e) => setDiscount(Number(e.target.value))} />
                            </Field>
                            <Field label="Discount Type">
                                <Select value={discountType} onChange={(e) => setDiscountType(Number(e.target.value) as 0 | 1)}>
                                    <option value={0}>Fixed amount</option>
                                    <option value={1}>Percentage</option>
                                </Select>
                            </Field>
                            <div className="md:col-span-2">
                                <Field label="Notes">
                                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                                </Field>
                            </div>
                            <div className="md:col-span-2">
                                <Field label="Terms & Conditions">
                                    <Textarea value={terms} onChange={(e) => setTerms(e.target.value)} />
                                </Field>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <div className="text-sm">
                                <strong>Customer:</strong>{' '}
                                {customersData?.data.find((c) => c.id === customerId)?.company_name}
                                <br />
                                <strong>Date:</strong> {quoteDate}{validUntil && <> · <strong>Valid until:</strong> {validUntil}</>}
                            </div>
                            <table className="w-full text-sm border-t border-b">
                                <tbody>
                                    {items.map((it, i) => (
                                        <tr key={i} className="border-b">
                                            <td className="py-2">
                                                {it.description}
                                                {it.discount > 0 && (
                                                    <div className="text-xs text-gray-500 mt-0.5">
                                                        Discount: -{formatMoney(it.discount, currency)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2 text-right">{it.quantity} × {formatMoney(it.unit_price, currency)}</td>
                                            <td className="py-2 text-right font-medium">{formatMoney(calcItemTotal(it), currency)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex justify-end">
                                <div className="w-64 text-sm space-y-1">
                                    <div className="flex justify-between"><span>Subtotal:</span><span>{formatMoney(subtotal, currency)}</span></div>
                                    {discountAmount > 0 && <div className="flex justify-between"><span>{discountType === 1 ? `Discount (${discount}%)` : 'Discount'}:</span><span>-{formatMoney(discountAmount, currency)}</span></div>}
                                    {taxAmount > 0 && <div className="flex justify-between"><span>Tax ({taxRate}%):</span><span>{formatMoney(taxAmount, currency)}</span></div>}
                                    <div className="flex justify-between pt-2 border-t font-semibold"><span>Total:</span><span>{formatMoney(total, currency)}</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            <div className="flex justify-between mt-4">
                <Button variant="secondary" disabled={step === 1} onClick={() => setStep(step - 1)}>Back</Button>
                {step < STEPS.length ? (
                    <Button disabled={!canNext()} onClick={() => setStep(step + 1)}>Next</Button>
                ) : (
                    <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
                        {isEdit ? 'Update Quote' : 'Create Quote'}
                    </Button>
                )}
            </div>

            <ProductPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={selectProduct} />
        </>
    );
}
