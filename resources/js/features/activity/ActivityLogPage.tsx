import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activityApi, ActivityFilters } from '../../api/activity';
import { Card, EmptyState, PageHeader } from '../../components/ui/Display';
import { Input, Select } from '../../components/ui/Form';
import { Pagination } from '../../components/ui/Table';
import { formatDate } from '../../lib/utils';

export default function ActivityLogPage() {
    const [filters, setFilters] = useState<ActivityFilters>({ page: 1, per_page: 25 });
    const { data, isLoading } = useQuery({ queryKey: ['activity-logs', filters], queryFn: () => activityApi.list(filters) });
    return <>
        <PageHeader title="Activity Log" subtitle="Audit trail for billing activity in your company." />
        <Card>
            <div className="px-5 py-3 border-b flex flex-wrap gap-3">
                <Select className="max-w-[190px]" defaultValue="" onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined, page: 1 })}>
                    <option value="">All actions</option><option value="invoice.sent">Invoice sent</option><option value="invoice.voided">Invoice voided</option><option value="payment.recorded">Payment recorded</option><option value="quote.accepted">Quote accepted</option><option value="subscription.paused">Subscription paused</option>
                </Select>
                <Input type="date" onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined, page: 1 })} />
                <Input type="date" onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined, page: 1 })} />
            </div>
            {isLoading ? <div className="p-8 text-center text-sm text-gray-500">Loading...</div> : !data?.data.length ? <EmptyState title="No activity yet" message="Billing actions will appear here as your team uses the application." /> : <>
                <div className="divide-y">{data.data.map((activity) => <div key={activity.id} className="px-5 py-4 flex gap-4"><div className="mt-1 h-2 w-2 rounded-full bg-indigo-500 shrink-0" /><div className="min-w-0"><div className="text-sm text-gray-900">{activity.description}</div><div className="mt-1 text-xs text-gray-500">{activity.user?.name ?? 'System'} · {formatDate(activity.created_at)}</div></div><div className="ml-auto text-xs text-gray-500 whitespace-nowrap">{activity.action}</div></div>)}</div>
                <div className="px-5 py-3"><Pagination currentPage={data.meta.current_page} lastPage={data.meta.last_page} onPageChange={(page) => setFilters({ ...filters, page })} /></div>
            </>}
        </Card>
    </>;
}