import { Link, useParams } from 'react-router-dom';
import { usePayment, useDeletePayment } from './hooks';
import { Card, CardBody, CardHeader, PageHeader } from '../../components/ui/Display';
import { ConfirmDialog } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { formatMoney, formatDate } from '../../lib/utils';
import { useState } from 'react';
import toast from '../../lib/toast';
import { useNavigate } from 'react-router-dom';
import { downloadPdf, openPdfInNewTab, pdfUrls } from '../../lib/pdf';

export default function PaymentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const { data: payment, isLoading } = usePayment(Number(id));
    const deletePayment = useDeletePayment();

    if (isLoading) return <div>Loading...</div>;
    if (!payment) return <div>Not found</div>;

    return (
        <>
            <PageHeader
                title={payment.payment_number}
                subtitle={`Payment from ${payment.customer?.company_name}`}
                actions={
                    <>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                                try {
                                    await openPdfInNewTab(pdfUrls.receipt(payment.id));
                                } catch {
                                    toast.error('Failed to open receipt');
                                }
                            }}
                        >
                            Preview Receipt
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={async () => {
                                try {
                                    await downloadPdf(
                                        pdfUrls.receipt(payment.id),
                                        `receipt-${payment.payment_number}.pdf`
                                    );
                                    toast.success('Receipt downloaded');
                                } catch {
                                    toast.error('Failed to download receipt');
                                }
                            }}
                        >
                            Download Receipt
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
                            Delete
                        </Button>
                    </>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader><h3 className="font-medium">Payment Information</h3></CardHeader>
                    <CardBody>
                        <dl className="space-y-2 text-sm">
                            <Row label="Date" value={formatDate(payment.payment_date)} />
                            <Row label="Method" value={payment.method_label} />
                            <Row label="Reference" value={payment.reference ?? '-'} />
                            <Row label="Amount" value={formatMoney(payment.amount, payment.currency)} bold />
                        </dl>
                    </CardBody>
                </Card>

                {payment.invoice && (
                    <Card className="lg:col-span-2">
                        <CardHeader><h3 className="font-medium">Related Invoice</h3></CardHeader>
                        <CardBody>
                            <Link to={`/invoices/${payment.invoice.id}`} className="text-indigo-600 hover:underline font-medium">
                                {payment.invoice.invoice_number}
                            </Link>
                            <dl className="mt-3 grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <dt className="text-gray-500">Total</dt>
                                    <dd className="font-medium">{formatMoney(payment.invoice.total, payment.currency)}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Remaining</dt>
                                    <dd className="font-medium">{formatMoney(payment.invoice.balance, payment.currency)}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">Status</dt>
                                    <dd className="capitalize">{payment.invoice.status.replace(/_/g, ' ')}</dd>
                                </div>
                            </dl>
                        </CardBody>
                    </Card>
                )}

                {payment.notes && (
                    <Card className="lg:col-span-3">
                        <CardHeader><h3 className="font-medium">Notes</h3></CardHeader>
                        <CardBody><p className="text-sm whitespace-pre-wrap">{payment.notes}</p></CardBody>
                    </Card>
                )}
            </div>

            <ConfirmDialog
                open={confirmDelete}
                title="Delete payment?"
                message="This will reverse the payment and update the invoice balance."
                onConfirm={async () => {
                    await deletePayment.mutateAsync(payment.id);
                    setConfirmDelete(false);
                    toast.success('Payment deleted');
                    navigate('/payments');
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
