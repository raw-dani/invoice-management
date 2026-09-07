import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { templatesApi, PdfTemplate } from '../../api/templates';
import { Card, CardBody, CardHeader, PageHeader, EmptyState } from '../../components/ui/Display';
import Button from '../../components/ui/Button';
import toast from '../../lib/toast';

function TemplateGroup({ title, templates, activate }: { title: string; templates?: PdfTemplate[]; activate: (id: number) => Promise<unknown> }) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: activate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pdf-templates'] });
            toast.success('Template activated successfully.');
        },
        onError: () => {
            toast.error('Failed to activate template.');
        },
    });

    if (!templates?.length) {
        return (
            <Card>
                <CardHeader><h3 className="font-medium">{title}</h3></CardHeader>
                <CardBody>
                    <EmptyState title="No templates" message="No PDF templates available yet." />
                </CardBody>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader><h3 className="font-medium">{title}</h3></CardHeader>
            <CardBody>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {templates.map((template) => (
                        <div key={template.id} className={`border rounded-lg p-4 ${template.is_default ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium">{template.name}</div>
                                    <div className="text-xs text-gray-500 mt-1">{template.slug}</div>
                                </div>
                                {template.is_default && <span className="text-xs text-indigo-700">Default</span>}
                            </div>
                            <Button
                                className="mt-4"
                                size="sm"
                                variant={template.is_default ? 'secondary' : 'primary'}
                                disabled={template.is_default}
                                loading={mutation.isPending}
                                onClick={() => mutation.mutate(template.id)}
                            >
                                {template.is_default ? 'Active' : 'Set as Default'}
                            </Button>
                        </div>
                    ))}
                </div>
            </CardBody>
        </Card>
    );
}

export default function TemplatesPage() {
    const invoice = useQuery({ queryKey: ['pdf-templates', 'invoice'], queryFn: templatesApi.invoice });
    const quote = useQuery({ queryKey: ['pdf-templates', 'quote'], queryFn: templatesApi.quote });

    if (invoice.isLoading || quote.isLoading) {
        return <div className="p-8 text-center text-sm text-gray-500">Loading templates...</div>;
    }

    if (invoice.error || quote.error) {
        return <div className="p-8 text-center text-sm text-red-600">Failed to load templates. Please try again.</div>;
    }

    return (
        <>
            <PageHeader title="PDF Templates" subtitle="Choose the default layout for invoices and quotes." />
            <div className="space-y-6">
                <TemplateGroup title="Invoice Templates" templates={invoice.data} activate={templatesApi.activateInvoice} />
                <TemplateGroup title="Quote Templates" templates={quote.data} activate={templatesApi.activateQuote} />
            </div>
        </>
    );
}
