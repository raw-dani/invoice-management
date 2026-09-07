import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCancelSubscription, useGenerateSubscriptionInvoice, usePauseSubscription, useResumeSubscription, useSubscription, useDeleteSubscription } from './hooks';
import { Card, CardBody, CardHeader, PageHeader, StatusBadge } from '../../components/ui/Display';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { formatDate, formatMoney } from '../../lib/utils';
import toast from '../../lib/toast';
import { useState } from 'react';

export default function SubscriptionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const subscriptionId = Number(id);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const { data: subscription, isLoading } = useSubscription(subscriptionId);
    const pause = usePauseSubscription(); const resume = useResumeSubscription(); const cancel = useCancelSubscription(); const generate = useGenerateSubscriptionInvoice(); const deleteSubscription = useDeleteSubscription();
    if (isLoading || !subscription) return <div>Loading...</div>;

    const run = async (action: typeof pause) => {
        try {
            await action.mutateAsync(subscriptionId);
            toast.success('Subscription updated successfully.');
        } catch (e) {
            toast.error('Failed to update subscription.');
        }
    };

    const handleDelete = async () => {
        await deleteSubscription.mutateAsync(subscriptionId);
        toast.success('Subscription deleted successfully.');
        navigate('/subscriptions');
    };

    const handleGenerateInvoice = async () => {
        try {
            await generate.mutateAsync(subscriptionId);
            toast.success('Invoice generated successfully.');
        } catch (e) {
            toast.error('Failed to generate invoice.');
        }
    };
    return <>
        <PageHeader
            title={subscription.subscription_number}
            subtitle={subscription.customer?.company_name}
            actions={
                <>
                    <StatusBadge status={subscription.status} />
                    <Link to={`/subscriptions/${id}/edit`}><Button variant="secondary">Edit</Button></Link>
                    {subscription.status === 'active' && <Button variant="secondary" onClick={() => run(pause)}>Pause</Button>}
                    {subscription.status === 'paused' && <Button variant="secondary" onClick={() => run(resume)}>Resume</Button>}
                    {['active', 'paused', 'draft'].includes(subscription.status) && <Button variant="danger" onClick={() => run(cancel)}>Cancel</Button>}
                    {subscription.status === 'active' && <Button onClick={handleGenerateInvoice}>Generate Invoice</Button>}
                    <Button variant="ghost" onClick={() => setConfirmDelete(true)}>Delete</Button>
                </>
            }
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Card className="lg:col-span-2"><CardHeader><h3 className="font-medium">Subscription Items</h3></CardHeader><CardBody><div className="divide-y">{subscription.items?.map((item) => <div key={item.id} className="py-3 flex justify-between"><div><div className="font-medium">{item.description}</div><div className="text-sm text-gray-500">{item.quantity} × {formatMoney(item.unit_price, subscription.currency)}</div></div><div className="font-medium">{formatMoney(item.total, subscription.currency)}</div></div>)}</div></CardBody></Card><Card><CardHeader><h3 className="font-medium">Details</h3></CardHeader><CardBody className="space-y-3 text-sm"><div className="flex justify-between"><span>Status</span><StatusBadge status={subscription.status} /></div><div className="flex justify-between"><span>Cycle</span><span>{subscription.billing_cycle.replace('_', ' ')}</span></div><div className="flex justify-between"><span>Next billing</span><span>{formatDate(subscription.next_billing_date)}</span></div><div className="flex justify-between"><span>Due days</span><span>{subscription.invoice_due_days}</span></div></CardBody></Card></div>
        <Card className="mt-6"><CardHeader><h3 className="font-medium">Generated Invoices</h3></CardHeader><CardBody><div className="divide-y">{subscription.invoices?.length ? subscription.invoices.map((invoice) => <Link key={invoice.id} to={`/invoices/${invoice.id}`} className="flex justify-between py-3 hover:bg-gray-50"><span className="text-indigo-600">{invoice.invoice_number}</span><span>{formatMoney(invoice.total, invoice.currency)}</span></Link>) : <p className="text-sm text-gray-500">No invoices generated yet.</p>}</div></CardBody></Card>

        <ConfirmDialog open={confirmDelete} title="Delete subscription?" message="This action cannot be undone." onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} danger />
    </>;
}