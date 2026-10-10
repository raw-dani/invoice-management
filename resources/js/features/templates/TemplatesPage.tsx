import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { templatesApi, PdfTemplate } from '../../api/templates';
import { Card, CardBody, CardHeader, PageHeader, EmptyState } from '../../components/ui/Display';
import { Modal } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { getPdfBlobUrl, downloadPdf, openPdfInNewTab, pdfUrls } from '../../lib/pdf';
import toast from '../../lib/toast';

interface TemplateMeta {
    description: string;
    styleTag: string;
    features: string[];
    accentColor: string;
}

const TEMPLATE_DETAILS: Record<string, TemplateMeta> = {
    modern: {
        description: 'Tata letak kontemporer dengan aksen indigo elegan, header bersih, dan tipografi modern yang estetik.',
        styleTag: 'Contemporary & Clean',
        features: ['Header dua kolom', 'Highlight aksen indigo', 'Tipografi sans-serif modern'],
        accentColor: 'indigo',
    },
    professional: {
        description: 'Format formal korporat dengan tabel bergaris tegas dan struktur rapi, cocok untuk penagihan B2B & instansi.',
        styleTag: 'Corporate & Formal',
        features: ['Garis aksen tegas', 'Format formal profesional', 'Ideal untuk kontrak B2B'],
        accentColor: 'slate',
    },
    classic: {
        description: 'Desain tradisional monokromatik berakar pada standar pembukuan akuntansi klasik dengan garis batas solid.',
        styleTag: 'Classic Accounting',
        features: ['Monokrom hitam-putih formal', 'Garis tabel klasik', 'Gaya editorial timeless'],
        accentColor: 'zinc',
    },
    compact: {
        description: 'Format ringkas hemat ruang, memaksimalkan efisiensi halaman untuk transaksi dengan banyak daftar item produk.',
        styleTag: 'Space Efficient',
        features: ['Spasi padat hemat kertas', 'Optimal untuk banyak item', 'Struktur tabel ringkas'],
        accentColor: 'sky',
    },
    corporate: {
        description: 'Format penawaran eksekutif dengan struktur approval resmi, terms & conditions terperinci, dan tabel kalkulasi lengkap.',
        styleTag: 'Executive Proposal',
        features: ['Area tanda tangan approval', 'Struktur klausul resmi', 'Header korporat berwibawa'],
        accentColor: 'emerald',
    },
};

interface PreviewState {
    open: boolean;
    template: PdfTemplate | null;
    type: 'invoice' | 'quote';
    blobUrl: string | null;
    loading: boolean;
}

function TemplateGroup({
    title,
    type,
    templates,
    activate,
    onPreview,
}: {
    title: string;
    type: 'invoice' | 'quote';
    templates?: PdfTemplate[];
    activate: (id: number) => Promise<unknown>;
    onPreview: (template: PdfTemplate, type: 'invoice' | 'quote') => void;
}) {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: activate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pdf-templates'] });
            toast.success('Template berhasil diatur sebagai layout default.');
        },
        onError: () => {
            toast.error('Gagal mengaktifkan template.');
        },
    });

    if (!templates?.length) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-gray-900">{title}</h3>
                </CardHeader>
                <CardBody>
                    <EmptyState title="Belum ada template" message="Tidak ada template PDF yang tersedia." />
                </CardBody>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">{title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Pilih layout desain yang akan dicetak pada berkas PDF {type === 'invoice' ? 'Invoice' : 'Quotation'}.
                        </p>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                        {templates.length} Pilihan Desain
                    </span>
                </div>
            </CardHeader>
            <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                    {templates.map((template) => {
                        const meta = TEMPLATE_DETAILS[template.slug] || {
                            description: 'Format tata letak standar untuk dokumen PDF.',
                            styleTag: 'Standard Layout',
                            features: ['Layout standar PDF'],
                            accentColor: 'gray',
                        };

                        const isDefault = template.is_default;

                        return (
                            <div
                                key={template.id}
                                className={`flex flex-col justify-between border-2 rounded-xl p-5 transition-all duration-200 bg-white ${
                                    isDefault
                                        ? 'border-indigo-600 shadow-md ring-2 ring-indigo-600/10'
                                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                }`}
                            >
                                <div className="space-y-3">
                                    {/* Card Header & Badge */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900 text-base">{template.name}</h4>
                                                <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                                                    {template.slug}
                                                </span>
                                            </div>
                                            <span className="inline-block mt-1 text-xs font-medium text-indigo-600">
                                                {meta.styleTag}
                                            </span>
                                        </div>

                                        {isDefault ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                <svg className="w-3.5 h-3.5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                Default Aktif
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400 font-medium">Tersedia</span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        {meta.description}
                                    </p>

                                    {/* Mini Visual Preview Mockup Box */}
                                    <div
                                        onClick={() => onPreview(template, type)}
                                        className="cursor-pointer group relative p-3 rounded-lg border border-dashed border-gray-200 hover:border-indigo-300 bg-gray-50/70 hover:bg-indigo-50/30 transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-10 bg-white border border-gray-300 rounded shadow-2xs flex flex-col p-1 justify-between group-hover:border-indigo-400 transition">
                                                <div className="w-full h-1 bg-indigo-500 rounded-xs" />
                                                <div className="space-y-0.5">
                                                    <div className="w-3/4 h-0.5 bg-gray-300 rounded-xs" />
                                                    <div className="w-full h-0.5 bg-gray-200 rounded-xs" />
                                                </div>
                                                <div className="w-1/2 h-0.5 bg-gray-400 self-end rounded-xs" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-semibold text-gray-800 group-hover:text-indigo-600 transition flex items-center gap-1">
                                                    Lihat Contoh Dokumen PDF
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </div>
                                                <div className="text-[11px] text-gray-400">Klik untuk melihat pratinjau dokumen asli</div>
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-indigo-600 group-hover:underline">Preview</span>
                                    </div>

                                    {/* Feature Pills */}
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {meta.features.map((feat, idx) => (
                                            <span
                                                key={idx}
                                                className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md"
                                            >
                                                • {feat}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => onPreview(template, type)}
                                        className="flex items-center gap-1.5"
                                    >
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        Preview PDF
                                    </Button>

                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={isDefault ? 'secondary' : 'primary'}
                                        disabled={isDefault}
                                        loading={mutation.isPending}
                                        onClick={() => mutation.mutate(template.id)}
                                    >
                                        {isDefault ? 'Template Aktif' : 'Set as Default'}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardBody>
        </Card>
    );
}

export default function TemplatesPage() {
    const invoice = useQuery({ queryKey: ['pdf-templates', 'invoice'], queryFn: templatesApi.invoice });
    const quote = useQuery({ queryKey: ['pdf-templates', 'quote'], queryFn: templatesApi.quote });
    const queryClient = useQueryClient();

    const [preview, setPreview] = useState<PreviewState>({
        open: false,
        template: null,
        type: 'invoice',
        blobUrl: null,
        loading: false,
    });

    const activateInvoiceMutation = useMutation({
        mutationFn: templatesApi.activateInvoice,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pdf-templates'] });
            toast.success('Template Invoice berhasil diaktifkan.');
            setPreview((prev) => ({ ...prev, open: false }));
        },
        onError: () => toast.error('Gagal mengaktifkan template Invoice.'),
    });

    const activateQuoteMutation = useMutation({
        mutationFn: templatesApi.activateQuote,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pdf-templates'] });
            toast.success('Template Quote berhasil diaktifkan.');
            setPreview((prev) => ({ ...prev, open: false }));
        },
        onError: () => toast.error('Gagal mengaktifkan template Quote.'),
    });

    const handlePreview = async (template: PdfTemplate, type: 'invoice' | 'quote') => {
        // Clean up previous blob if any
        if (preview.blobUrl) {
            URL.revokeObjectURL(preview.blobUrl);
        }

        setPreview({
            open: true,
            template,
            type,
            blobUrl: null,
            loading: true,
        });

        try {
            const url =
                type === 'invoice'
                    ? pdfUrls.templateInvoicePreview(template.slug)
                    : pdfUrls.templateQuotePreview(template.slug);

            const blobUrl = await getPdfBlobUrl(url);
            setPreview((prev) => ({
                ...prev,
                blobUrl,
                loading: false,
            }));
        } catch (err) {
            console.error('Failed to load PDF preview:', err);
            toast.error('Gagal memuat pratinjau PDF. Pastikan server aktif.');
            setPreview((prev) => ({
                ...prev,
                loading: false,
            }));
        }
    };

    const closePreview = () => {
        if (preview.blobUrl) {
            URL.revokeObjectURL(preview.blobUrl);
        }
        setPreview({
            open: false,
            template: null,
            type: 'invoice',
            blobUrl: null,
            loading: false,
        });
    };

    // Clean up blob URL on unmount
    useEffect(() => {
        return () => {
            if (preview.blobUrl) {
                URL.revokeObjectURL(preview.blobUrl);
            }
        };
    }, [preview.blobUrl]);

    if (invoice.isLoading || quote.isLoading) {
        return (
            <div className="flex items-center justify-center p-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (invoice.error || quote.error) {
        return (
            <div className="p-8 text-center text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                Gagal memuat daftar template PDF. Silakan muat ulang halaman.
            </div>
        );
    }

    const isCurrentPreviewDefault = Boolean(preview.template?.is_default);

    return (
        <div className="space-y-6">
            <PageHeader
                title="PDF Templates"
                subtitle="Sesuaikan dan pilih gaya tampilan dokumen PDF Invoice dan Surat Penawaran (Quote) sesuai identitas bisnis Anda."
            />

            <div className="space-y-8">
                <TemplateGroup
                    title="Invoice Layout Templates"
                    type="invoice"
                    templates={invoice.data}
                    activate={templatesApi.activateInvoice}
                    onPreview={handlePreview}
                />

                <TemplateGroup
                    title="Quote Layout Templates"
                    type="quote"
                    templates={quote.data}
                    activate={templatesApi.activateQuote}
                    onPreview={handlePreview}
                />
            </div>

            {/* Interactive PDF Preview Modal */}
            <Modal
                open={preview.open}
                onClose={closePreview}
                title={`Preview Template: ${preview.template?.name ?? ''} (${preview.type === 'invoice' ? 'Invoice' : 'Quote'})`}
                size="2xl"
            >
                <div className="space-y-4">
                    {/* Top Modal Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-700">Layout Slug:</span>
                            <code className="bg-white px-2 py-0.5 rounded border border-gray-200 text-indigo-600 font-mono">
                                {preview.template?.slug}
                            </code>
                            {isCurrentPreviewDefault && (
                                <span className="bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full text-[11px]">
                                    Default Saat Ini
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            {preview.blobUrl && (
                                <>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                            const url =
                                                preview.type === 'invoice'
                                                    ? pdfUrls.templateInvoicePreview(preview.template!.slug)
                                                    : pdfUrls.templateQuotePreview(preview.template!.slug);
                                            openPdfInNewTab(url);
                                        }}
                                        className="flex items-center gap-1"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        Tab Baru
                                    </Button>

                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => {
                                            const url =
                                                preview.type === 'invoice'
                                                    ? pdfUrls.templateInvoicePreview(preview.template!.slug)
                                                    : pdfUrls.templateQuotePreview(preview.template!.slug);
                                            downloadPdf(url, `${preview.type}-${preview.template?.slug}-sample.pdf`);
                                        }}
                                        className="flex items-center gap-1"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Download PDF
                                    </Button>
                                </>
                            )}

                            {!isCurrentPreviewDefault && preview.template && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="primary"
                                    loading={
                                        preview.type === 'invoice'
                                            ? activateInvoiceMutation.isPending
                                            : activateQuoteMutation.isPending
                                    }
                                    onClick={() => {
                                        if (preview.type === 'invoice') {
                                            activateInvoiceMutation.mutate(preview.template!.id);
                                        } else {
                                            activateQuoteMutation.mutate(preview.template!.id);
                                        }
                                    }}
                                >
                                    Jadikan Default Layout
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* PDF Viewer Canvas */}
                    <div className="relative w-full h-[650px] bg-gray-100 rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center">
                        {preview.loading && (
                            <div className="text-center space-y-3">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
                                <div className="text-xs text-gray-500 font-medium">Merender preview PDF dokumen...</div>
                            </div>
                        )}

                        {!preview.loading && preview.blobUrl && (
                            <iframe
                                src={`${preview.blobUrl}#toolbar=1&navpanes=0`}
                                title="PDF Template Preview"
                                className="w-full h-full border-0"
                            />
                        )}

                        {!preview.loading && !preview.blobUrl && (
                            <div className="text-center p-6 text-sm text-red-600">
                                Pratinjau PDF tidak dapat ditampilkan. Silakan coba tombol "Tab Baru" di atas.
                            </div>
                        )}
                    </div>

                    {/* Bottom Modal Footer */}
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-gray-400">
                            Pratinjau menampilkan contoh sampel data tagihan dan data profil perusahaan Anda.
                        </span>
                        <Button type="button" variant="secondary" onClick={closePreview}>
                            Tutup
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
