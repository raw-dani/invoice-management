import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    useQuote,
    useSendQuote,
    useAcceptQuote,
    useRejectQuote,
    useDeleteQuote,
    useConvertQuote,
    useDuplicateQuote,
    useSendQuoteEmail,
} from './hooks';
import { useEntityActivityLogs } from '../activity/hooks';
import { Card, CardBody, CardHeader, PageHeader, StatusBadge, EmptyState } from '../../components/ui/Display';
import Button from '../../components/ui/Button';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { quotesApi } from '../../api/quotes';
import { formatMoney, formatDate } from '../../lib/utils';
import { useState } from 'react';
import toast from '../../lib/toast';
import { downloadPdf, openPdfInNewTab, pdfUrls } from '../../lib/pdf';
import { WhatsAppShareModal } from '../../components/WhatsAppShareModal';
import { QuoteMilestoneSection } from './QuoteMilestoneSection';
import type { ActivityLog } from '../../types';

export default function QuoteDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmConvert, setConfirmConvert] = useState(false);
    const [showActivity, setShowActivity] = useState(false);
    const [whatsappOpen, setWhatsappOpen] = useState(false);

    const { data: quote, isLoading } = useQuote(Number(id));
    const sendQuote = useSendQuote();
    const acceptQuote = useAcceptQuote();
    const rejectQuote = useRejectQuote();
    const convertQuote = useConvertQuote();
    const duplicateQuote = useDuplicateQuote();
    const deleteQuote = useDeleteQuote();
    const sendEmail = useSendQuoteEmail();
    const { data: activityData } = useEntityActivityLogs('Quote', Number(id));

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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            onClick={() => setWhatsappOpen(true)}
                        >
                            💬 WhatsApp
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                                const url = `${window.location.origin}/q/${quote.public_token || quote.id}`;
                                navigator.clipboard.writeText(url);
                                toast.success('Tautan Portal Penawaran berhasil disalin!');
                            }}
                            title="Salin tautan portal klien publik"
                        >
                            🔗 Portal Klien
                        </Button>
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
                            <Button size="sm" onClick={() => setConfirmConvert(true)}>Convert to Invoice</Button>
                        )}
                        {!['draft'].includes(quote.status) && (
                            <Button size="sm" variant="secondary" loading={sendEmail.isPending} onClick={async () => {
                                await sendEmail.mutateAsync({ id: quote.id });
                                toast.success('Quote email sent');
                            }}>
                                Send Email
                            </Button>
                        )}
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

            {/* Project Milestones / Termin Billing */}
            <QuoteMilestoneSection quote={quote} />

            <Card className="mt-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <h3 className="font-medium">Activity Log</h3>
                        <Button size="sm" variant="secondary" onClick={() => setShowActivity(!showActivity)}>
                            {showActivity ? 'Hide' : 'Show'}
                        </Button>
                    </div>
                </CardHeader>
                {showActivity && (
                    <CardBody>
                        {!activityData?.data?.length ? (
                            <EmptyState title="No activity yet" message="Actions on this quote will appear here." />
                        ) : (
                            <div className="divide-y">
                                {activityData.data.map((activity: ActivityLog) => (
                                    <div key={activity.id} className="py-3 flex gap-4">
                                        <div className="mt-1 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                                        <div className="min-w-0">
                                            <div className="text-sm text-gray-900">{activity.description}</div>
                                            <div className="mt-1 text-xs text-gray-500">{activity.user?.name ?? 'System'} · {formatDate(activity.created_at)}</div>
                                        </div>
                                        <div className="ml-auto text-xs text-gray-500 whitespace-nowrap">{activity.action}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                )}
            </Card>

            <Modal
                open={confirmConvert}
                onClose={() => setConfirmConvert(false)}
                title="Convert Quote to Invoice"
                size="lg"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Are you sure you want to convert quote <strong className="text-gray-900">{quote.quote_number}</strong> into an invoice?
                        This will generate a new draft invoice based on the accepted items and totals below.
                    </p>

                    <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2 border border-gray-200">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Customer</span>
                            <span className="font-medium text-gray-900">{quote.customer?.company_name || quote.customer?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Items Count</span>
                            <span className="font-medium text-gray-900">{quote.items?.length || 0} line items</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span>{formatMoney(quote.subtotal, quote.currency)}</span>
                        </div>
                        {quote.discount > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Discount</span>
                                <span>-{formatMoney(quote.discount_type === 1 ? quote.subtotal * (quote.discount / 100) : quote.discount, quote.currency)}</span>
                            </div>
                        )}
                        {quote.tax_amount > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Tax ({quote.tax_rate}%)</span>
                                <span>{formatMoney(quote.tax_amount, quote.currency)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900 text-base">
                            <span>Total Invoice Amount</span>
                            <span className="text-indigo-600">{formatMoney(quote.total, quote.currency)}</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="secondary"
                            onClick={() => setConfirmConvert(false)}
                            disabled={convertQuote.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            loading={convertQuote.isPending}
                            onClick={async () => {
                                try {
                                    const invoice = await convertQuote.mutateAsync(quote.id);
                                    toast.success('Quote successfully converted to invoice');
                                    setConfirmConvert(false);
                                    navigate(`/invoices/${invoice.id}`);
                                } catch (err: any) {
                                    toast.error(err?.response?.data?.message || 'Failed to convert quote');
                                }
                            }}
                        >
                            Confirm & Convert
                        </Button>
                    </div>
                </div>
            </Modal>

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

            <WhatsAppShareModal
                open={whatsappOpen}
                onClose={() => setWhatsappOpen(false)}
                data={{
                    entityType: 'quote',
                    id: quote.id,
                    number: quote.quote_number,
                    total: quote.total,
                    currency: quote.currency,
                    date: quote.quote_date,
                    dueDate: quote.valid_until || undefined,
                    customerName: quote.customer?.company_name || 'Pelanggan',
                    customerPhone: quote.customer?.phone,
                    publicToken: quote.public_token,
                }}
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
