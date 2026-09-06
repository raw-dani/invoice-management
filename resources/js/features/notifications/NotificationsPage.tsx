import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../api/notifications';
import { Card, CardBody, CardHeader, EmptyState, PageHeader } from '../../components/ui/Display';
import Button from '../../components/ui/Button';
import { formatDate } from '../../lib/utils';

export default function NotificationsPage() {
    const queryClient = useQueryClient();
    const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list });
    const markRead = useMutation({ mutationFn: notificationsApi.read, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) });
    const markAll = useMutation({ mutationFn: notificationsApi.readAll, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }) });
    return <><PageHeader title="Notifications" subtitle={`${data?.unread_count ?? 0} unread notification(s)`} actions={<Button variant="secondary" size="sm" disabled={!data?.unread_count} loading={markAll.isPending} onClick={() => markAll.mutate()}>Mark all read</Button>} /><Card><CardHeader><h3 className="font-medium">Notification Center</h3></CardHeader><CardBody>{isLoading ? <div>Loading...</div> : !data?.data.data.length ? <EmptyState title="No notifications" message="Important billing events will appear here." /> : <div className="divide-y">{data.data.data.map((notification) => <button key={notification.id} onClick={() => !notification.read_at && markRead.mutate(notification.id)} className={`w-full text-left py-4 flex gap-3 ${notification.read_at ? 'opacity-60' : ''}`}><span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notification.read_at ? 'bg-gray-300' : 'bg-indigo-500'}`} /><span><span className="block font-medium text-sm">{notification.title}</span><span className="block text-sm text-gray-600">{notification.body}</span><span className="block mt-1 text-xs text-gray-400">{formatDate(notification.created_at)}</span></span></button>)}</div>}</CardBody></Card></>;
}