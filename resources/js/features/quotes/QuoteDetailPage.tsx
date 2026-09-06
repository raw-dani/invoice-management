import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    useQuote,
    useSendQuote,
    useAcceptQuote,
    useRejectQuote,
    useDeleteQuote,
    useConvertQuote,
    useDuplicateQuote,
} from './hooks';
import { Card, CardBody, CardHeader, PageHeader, StatusBadge } from '../../components/ui/Display';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { quotesApi } from '../../api/quotes';
import { formatMoney, formatDate } from '../../lib/utils';
import { useState } from 'react';
import toast from '../../lib/toast';
import { downloadPdf, openPdfInNewTab, pdfUrls } from '../../lib/pdf';

export default function QuoteDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const { data: quote, isLoading } = useQuote(Number(id));
    const sendQuote = useSendQuote();
    const acceptQuote = useAcceptQuote();
    const rejectQuote = useRejectQuote();
    const convertQuote = useConvertQuote();
    const duplicateQuote = useDuplicateQuote();
    const deleteQuote = useDeleteQuote();

    if (isLoading) return <div>Loading...</div>;
    if (!quote) return <div>Not found</div>;

    const canEdit = ['draft', 'sent', 'viewed', 'rejected', 'expired'].includes(quote.status);
    const canSend = quote.status === 'draft';
    const canAccept = ['sent', 'viewed'].includes(quote.status);
    const canReject = ['sent', 'viewed', 'accepted'].includes(quote.status);
    const canConvert = quote.status === 'accepted';

    return (
        <>
            <PageHeader
                title={quote.quote_number}
                subtitle={`To ${quote.customer?.company_name}`}
                actions={
                    <>
                        <StatusBadge status={quote.status} />
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                                try {
                                    await openPdfInNewTab(pdfUrls.quote(quote.id));
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
                                        pdfUrls.quote(quote.id),
                                        `quote-${quote.quote_number}.pdf`
                                    );
                                    toast.success('PDF downloaded');
                                } catch {
                                    toast.error('Failed to download PDF');
                                }
                            }}
                        >
                            Download PDF
                        </Button>
                        {canEdit && (
                            <Link to={`/quotes/${quote.id}/edit`}>
                                <Button variant="secondary" size="sm">Edit</Button>
                            </Link>
                        )}
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                                try {
                                    const copy = await quotesApi.duplicate(quote.id);
                                    toast.success(`Quote duplicated as ${copy.quote_number}`);
                                    navigate(`/quotes/${copy.id}`);
                                } catch {
                                    toast.error('Failed to duplicate quote');
                                }
                            }}
                        >
                            Duplicate
                        </Button>
                        {canSend && (
                            <Button size="sm" onClick={async () => {
                                await sendQuote.mutateAsync(quote.id);
                                toast.success('Quote sent');
                            }}>Send</Button>
                        )}
                        {canAccept && (
                            <Button size="sm" variant="primary" onClick={async () => {
                                await acceptQuote.mutateAsync(quote.id);
                                toast.success('Quote accepted');
                            }}>Accept</Button>
                        )}
                        {canReject && (
                            <Button size="sm" variant="danger" onClick={async () => {
                                await rejectQuote.mutateAsync(quote.id);
                                toast.success('Quote rejected');
                            }}>Reject</Button>
                        )}
                        {canConvert && (
                            <Button size="sm" onClick={async () => {
                                const invoice = await convertQuote.mutateAsync(quote.id);
                                toast.success('Converted to invoice');
                                navigate(`/invoices/${invoice.id}`);
                            }}>Convert to Invoice</Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={async () => {
                            const copy = await duplicateQuote.mutateAsync(quote.id);
                            toast.success('Quote duplicated');
                            navigate(`/quotes/${copy.id}`);
                        }}>Duplicate</Button>
                        <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)}>Delete</Button>
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
                                {quote.items?.map((it) => (
                                    <tr key={it.id} className="border-b">
                                        <td className="py-2">{it.description}</td>
                                        <td className="py-2 text-right">{it.quantity}</td>
                                        <td className="py-2 text-right">{formatMoney(it.unit_price, quote.currency)}</td>
                                        <td className="py-2 text-right">{formatMoney(it.total, quote.currency)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader><h3 className="font-medium">Summary</h3></CardHeader>
                    <CardBody className="space-y-2 text-sm">
                        <Row label="Subtotal" value={formatMoney(quote.subtotal, quote.currency)} />
                        {quote.discount > 0 && <Row label={quote.discount_type === 1 ? `Discount (${quote.discount}%)` : 'Discount'} value={`-${formatMoney(quote.discount_type === 1 ? quote.subtotal * (quote.discount / 100) : quote.discount, quote.currency)}`} />}
                        {quote.tax_amount > 0 && <Row label={`Tax (${quote.tax_rate}%)`} value={formatMoney(quote.tax_amount, quote.currency)} />}
                        <Row label="Total" value={formatMoney(quote.total, quote.currency)} bold />
                        <div className="pt-2 border-t text-xs text-gray-500">
                            Valid until: {quote.valid_until ? formatDate(quote.valid_until) : '-'}
                        </div>
                    </CardBody>
                </Card>

                {quote.notes && (
                    <Card>
                        <CardHeader><h3 className="font-medium">Notes</h3></CardHeader>
                        <CardBody><p className="text-sm whitespace-pre-wrap">{quote.notes}</p></CardBody>
                    </Card>
                )}
                {quote.terms && (
                    <Card className="lg:col-span-2">
                        <CardHeader><h3 className="font-medium">Terms & Conditions</h3></CardHeader>
                        <CardBody><p className="text-sm whitespace-pre-wrap">{quote.terms}</p></CardBody>
                    </Card>
                )}
            </div>

            <ConfirmDialog
                open={confirmDelete}
                title="Delete quote?"
                message="This action cannot be undone."
                onConfirm={async () => {
                    await deleteQuote.mutateAsync(quote.id);
                    setConfirmDelete(false);
                    navigate('/quotes');
                    toast.success('Quote deleted');
                }}
                onCancel={() => setConfirmDelete(false)}
                danger
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
