import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { activityApi, ActivityFilters } from '../../api/activity';
import { Card, EmptyState, PageHeader } from '../../components/ui/Display';
import { Input, Select, Field } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Table';
import { formatDate } from '../../lib/utils';

export default function ActivityLogPage() {
    const [filters, setFilters] = useState<ActivityFilters>({ page: 1, per_page: 25 });
    const { data, isLoading } = useQuery({ queryKey: ['activity-logs', filters], queryFn: () => activityApi.list(filters) });

    const updateFilter = (key: string, value: unknown) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    const clearFilters = () => {
        setFilters({ page: 1, per_page: 25 });
    };

    const hasFilters = filters.action || filters.from || filters.to;

    return (
        <>
            <PageHeader title="Activity Log" subtitle="Audit trail for billing activity in your company." />
            <Card>
                <div className="px-5 py-4 border-b bg-gray-50">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-1 min-w-[180px]">
                            <Field label="Action">
                                <Select value={filters.action ?? ''} onChange={(e) => updateFilter('action', e.target.value || undefined)}>
                                    <option value="">All actions</option>
                                    <option value="invoice.sent">Invoice sent</option>
                                    <option value="invoice.voided">Invoice voided</option>
                                    <option value="payment.recorded">Payment recorded</option>
                                    <option value="quote.accepted">Quote accepted</option>
                                    <option value="subscription.paused">Subscription paused</option>
                                </Select>
                            </Field>
                        </div>
                        <div>
                            <Field label="From">
                                <Input type="date" value={filters.from ?? ''} onChange={(e) => updateFilter('from', e.target.value || undefined)} />
                            </Field>
                        </div>
                        <div>
                            <Field label="To">
                                <Input type="date" value={filters.to ?? ''} onChange={(e) => updateFilter('to', e.target.value || undefined)} />
                            </Field>
                        </div>
                        {hasFilters && (
                            <div>
                                <Button type="button" variant="secondary" onClick={clearFilters}>Clear</Button>
                            </div>
                        )}
                    </div>
                </div>
                {isLoading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
                ) : !data?.data.length ? (
                    <EmptyState title="No activity yet" message="Billing actions will appear here as your team uses the application." />
                ) : (
                    <>
                        <div className="divide-y">
                            {data.data.map((activity) => (
                                <div key={activity.id} className="px-5 py-4 flex gap-4">
                                    <div className="mt-1 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                                    <div className="min-w-0">
                                        <div className="text-sm text-gray-900">{activity.description}</div>
                                        <div className="mt-1 text-xs text-gray-500">{activity.user?.name ?? 'System'} · {formatDate(activity.created_at)}</div>
                                    </div>
                                    <div className="ml-auto text-xs text-gray-500 whitespace-nowrap">{activity.action}</div>
                                </div>
                            ))}
                        </div>
                        <div className="px-5 py-3">
                            <Pagination currentPage={data.meta.current_page} lastPage={data.meta.last_page} onPageChange={(page) => setFilters({ ...filters, page })} />
                        </div>
                    </>
                )}
            </Card>
        </>
    );
}
