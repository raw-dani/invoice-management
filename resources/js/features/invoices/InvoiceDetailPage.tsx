import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    useInvoice,
    useMarkInvoiceSent,
    useVoidInvoice,
    useDeleteInvoice,
    useDuplicateInvoice,
} from './hooks';
import { useDeletePayment } from '../payments/hooks';
import { Card, CardBody, CardHeader, PageHeader, StatusBadge } from '../../components/ui/Display';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { formatMoney, formatDate } from '../../lib/utils';
import { useState } from 'react';
import toast from '../../lib/toast';
import { RecordPaymentForm } from '../payments/RecordPaymentForm';
import { downloadPdf, openPdfInNewTab, pdfUrls } from '../../lib/pdf';

export default function InvoiceDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [confirmVoid, setConfirmVoid] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<number | null>(null);

    const { data: invoice, isLoading } = useInvoice(Number(id));
    const markSent = useMarkInvoiceSent();
    const voidInvoice = useVoidInvoice();
    const deleteInvoice = useDeleteInvoice();
    const deletePayment = useDeletePayment();
    const duplicateInvoice = useDuplicateInvoice();

    if (isLoading) return <div>Loading...</div>;
    if (!invoice) return <div>Not found</div>;

    const isDraft = invoice.status === 'draft';
    const canRecordPayment = !['paid', 'void', 'cancelled'].includes(invoice.status) && invoice.balance > 0;

    return (
        <>
            <PageHeader
                title={invoice.invoice_number}
                subtitle={`To ${invoice.customer?.company_name} · Due ${formatDate(invoice.due_date)}`}
                    actions={
                    <>
                        <StatusBadge status={invoice.status} />
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                                try {
                                    await openPdfInNewTab(pdfUrls.invoice(invoice.id));
                                } catch {
                                    toast.error('Failed to open PDF');
                                }
                            }}
                        >
                            Preview PDF
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                                try {
                                    await downloadPdf(
                                        pdfUrls.invoice(invoice.id),
                                        `invoice-${invoice.invoice_number}.pdf`
                                    );
                                    toast.success('PDF downloaded');
                                } catch {
                                    toast.error('Failed to download PDF');
                                }
                            }}
                        >
                            Download PDF
                        </Button>
                        <Button size="sm" variant="secondary" loading={duplicateInvoice.isPending} onClick={async () => { const copy = await duplicateInvoice.mutateAsync(invoice.id); toast.success('Invoice duplicated'); navigate(`/invoices/${copy.id}`); }}>
                            Duplicate
                        </Button>
                        {canRecordPayment && (
                            <Button size="sm" variant="primary" onClick={() => setPaymentOpen(true)}>
                                Record Payment
                            </Button>
                        )}
                        {isDraft && (
                            <>
                                <Link to={`/invoices/${invoice.id}/edit`}>
                                    <Button variant="secondary" size="sm">Edit</Button>
                                </Link>
                                <Button
                                    size="sm"
                                    onClick={async () => {
                                        await markSent.mutateAsync(invoice.id);
                                        toast.success('Invoice marked as sent');
                                    }}
                                >
                                    Mark as Sent
                                </Button>
                            </>
                        )}
                        {!['paid', 'void'].includes(invoice.status) && (
                            <Button size="sm" variant="danger" onClick={() => setConfirmVoid(true)}>
                                Void
                            </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>
                            Delete
                        </Button>
                    </>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader><h3 className="font-medium">Items</h3></CardHeader>
                    <CardBody>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-gray-500">
                                    <th className="py-2">Description</th>
                                    <th className="py-2 text-right">Qty</th>
                                    <th className="py-2 text-right">Price</th>
                                    <th className="py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items?.map((it) => (
                                    <tr key={it.id} className="border-b">
                                        <td className="py-2">{it.description}</td>
                                        <td className="py-2 text-right">{it.quantity}</td>
                                        <td className="py-2 text-right">{formatMoney(it.unit_price, invoice.currency)}</td>
                                        <td className="py-2 text-right">{formatMoney(it.total, invoice.currency)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader><h3 className="font-medium">Summary</h3></CardHeader>
                    <CardBody className="space-y-2 text-sm">
                        <Row label="Subtotal" value={formatMoney(invoice.subtotal, invoice.currency)} />
                        {invoice.discount > 0 && (
                            <Row label={invoice.discount_type === 1 ? `Discount (${invoice.discount}%)` : 'Discount'} value={`-${formatMoney(invoice.discount_type === 1 ? invoice.subtotal * (invoice.discount / 100) : invoice.discount, invoice.currency)}`} />
                        )}
                        {invoice.tax_amount > 0 && (
                            <Row label={`Tax (${invoice.tax_rate}%)`} value={formatMoney(invoice.tax_amount, invoice.currency)} />
                        )}
                        <Row label="Total" value={formatMoney(invoice.total, invoice.currency)} bold />
                        <Row label="Paid" value={formatMoney(invoice.paid_amount, invoice.currency)} />
                        <Row label="Balance" value={formatMoney(invoice.balance, invoice.currency)} bold />
                    </CardBody>
                </Card>

                {invoice.notes && (
                    <Card>
                        <CardHeader><h3 className="font-medium">Notes</h3></CardHeader>
                        <CardBody><p className="text-sm whitespace-pre-wrap">{invoice.notes}</p></CardBody>
                    </Card>
                )}
                {invoice.terms && (
                    <Card className="lg:col-span-2">
                        <CardHeader><h3 className="font-medium">Terms & Conditions</h3></CardHeader>
                        <CardBody><p className="text-sm whitespace-pre-wrap">{invoice.terms}</p></CardBody>
                    </Card>
                )}

                {(invoice.payments?.length ?? 0) > 0 && (
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium">Payment History</h3>
                                {canRecordPayment && (
                                    <Button size="sm" onClick={() => setPaymentOpen(true)}>
                                        + Record Payment
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardBody>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-gray-500">
                                        <th className="py-2">Payment #</th>
                                        <th className="py-2">Date</th>
                                        <th className="py-2">Method</th>
                                        <th className="py-2">Reference</th>
                                        <th className="py-2 text-right">Amount</th>
                                        <th className="py-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.payments?.map((p) => (
                                        <tr key={p.id} className="border-b">
                                            <td className="py-2">
                                                <Link to={`/payments/${p.id}`} className="text-indigo-600 hover:underline">
                                                    {p.payment_number}
                                                </Link>
                                            </td>
                                            <td className="py-2">{formatDate(p.payment_date)}</td>
                                            <td className="py-2">{p.method_label}</td>
                                            <td className="py-2">{p.reference ?? '-'}</td>
                                            <td className="py-2 text-right font-medium">{formatMoney(p.amount, invoice.currency)}</td>
                                            <td className="py-2 text-right">
                                                <button
                                                    onClick={() => setPaymentToDelete(p.id)}
                                                    className="text-red-600 hover:text-red-700 text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardBody>
                    </Card>
                )}
            </div>

            <ConfirmDialog
                open={confirmVoid}
                title="Void invoice?"
                message="This will cancel the invoice and prevent further actions."
                onConfirm={async () => {
                    await voidInvoice.mutateAsync(invoice.id);
                    setConfirmVoid(false);
                    toast.success('Invoice voided');
                }}
                onCancel={() => setConfirmVoid(false)}
                danger
            />
            <ConfirmDialog
                open={confirmDelete}
                title="Delete invoice?"
                message="This action cannot be undone."
                onConfirm={async () => {
                    await deleteInvoice.mutateAsync(invoice.id);
                    setConfirmDelete(false);
                    navigate('/invoices');
                    toast.success('Invoice deleted');
                }}
                onCancel={() => setConfirmDelete(false)}
                danger
            />
            <ConfirmDialog
                open={paymentToDelete !== null}
                title="Delete payment?"
                message="This will reverse the payment and update the invoice balance."
                onConfirm={async () => {
                    if (paymentToDelete === null) return;
                    await deletePayment.mutateAsync(paymentToDelete);
                    setPaymentToDelete(null);
                    toast.success('Payment deleted');
                }}
                onCancel={() => setPaymentToDelete(null)}
                danger
            />

            <RecordPaymentForm
                open={paymentOpen}
                onClose={() => setPaymentOpen(false)}
                invoice={invoice}
            />
        </>
    );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className={`flex justify-between ${bold ? 'pt-2 border-t font-semibold' : ''}`}>
            <span className="text-gray-500">{label}</span>
            <span>{value}</span>
        </div>
    );
}
