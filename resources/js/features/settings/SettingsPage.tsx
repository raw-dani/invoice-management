import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi, SettingsGroup, DemoDataStats } from '../../api/settings';
import { Card, CardBody, CardHeader, PageHeader } from '../../components/ui/Display';
import { Input, Select, Textarea } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import toast from '../../lib/toast';
import {
    BuildingOfficeIcon,
    DocumentTextIcon,
    DocumentDuplicateIcon,
    EnvelopeIcon,
    CreditCardIcon,
    SparklesIcon,
    LockClosedIcon,
    BuildingLibraryIcon,
    BoltIcon,
    ShieldCheckIcon,
    WalletIcon,
    LightBulbIcon,
    ArrowTopRightOnSquareIcon,
    BeakerIcon,
    PaperAirplaneIcon,
    ServerIcon,
    CogIcon,
} from '../../components/ui/Icons';

const GROUPS: Array<{ key: SettingsGroup; label: string; icon: React.ReactNode }> = [
    { key: 'company', label: 'Company', icon: <BuildingOfficeIcon className="w-4 h-4" /> },
    { key: 'invoice', label: 'Invoice', icon: <DocumentTextIcon className="w-4 h-4" /> },
    { key: 'quote', label: 'Quote', icon: <DocumentDuplicateIcon className="w-4 h-4" /> },
    { key: 'email', label: 'Email', icon: <EnvelopeIcon className="w-4 h-4" /> },
    { key: 'payment', label: 'Payment & Gateway', icon: <CreditCardIcon className="w-4 h-4" /> },
];

export default function SettingsPage() {
    const { user } = useAuth();
    const isAdmin = Boolean(user && ['owner', 'admin'].includes(user.role));
    const isDemo = user?.role === 'demo';
    const [group, setGroup] = useState<SettingsGroup>('company');
    const queryClient = useQueryClient();

    const availableGroups: Array<{ key: SettingsGroup; label: string; icon: React.ReactNode }> = [
        ...GROUPS,
        ...(isAdmin || isDemo ? [{ key: 'demo_data' as const, label: 'Demo Data', icon: <SparklesIcon className="w-4 h-4" /> }] : []),
    ];

    const query = useQuery({
        queryKey: ['settings_group', group],
        queryFn: () => settingsApi.get(group as Exclude<SettingsGroup, 'demo_data'>),
        enabled: group !== 'demo_data',
    });

    const [values, setValues] = useState<Record<string, any>>({});
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        if (query.data) setValues(query.data);
    }, [query.data]);

    const save = useMutation({
        mutationFn: () => settingsApi.update(group as Exclude<SettingsGroup, 'demo_data'>, values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['settings_group', group] });
            toast.success('Pengaturan berhasil disimpan.');
        },
        onError: () => toast.error('Gagal menyimpan pengaturan.'),
    });

    const uploadLogo = useMutation({
        mutationFn: (file: File) => settingsApi.uploadLogo(file),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['settings_group', 'company'] });
            setValues((prev) => ({ ...prev, logo: data.logo }));
            setLogoFile(null);
            setLogoPreview(null);
            toast.success('Logo uploaded successfully.');
        },
        onError: () => toast.error('Failed to upload logo.'),
    });

    const update = (key: string, value: any) => setValues((prev) => ({ ...prev, [key]: value }));

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setLogoFile(file);
        if (file) setLogoPreview(URL.createObjectURL(file));
    };

    const handleUploadLogo = () => {
        if (!logoFile) return;
        uploadLogo.mutate(logoFile);
    };

    return (
        <>
            <PageHeader title="Settings" subtitle="Configure company, billing, email, payment preferences, and demo data." />
            {isDemo && (
                <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
                        <LockClosedIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm">Mode Demo Aktif — Pengaturan View Only</h4>
                        <p className="text-xs text-amber-800 mt-0.5">
                            Akun Anda memiliki peran <strong>Demo</strong>. Anda dapat melihat seluruh konfigurasi dan data demo perusahaan, namun hak akses untuk mengubah pengaturan, mengunggah logo, dan memodifikasi data demo dinonaktifkan.
                        </p>
                    </div>
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
                <Card>
                    <CardBody className="space-y-1">
                        {availableGroups.map((item) => (
                            <button
                                key={item.key}
                                onClick={() => setGroup(item.key)}
                                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-2.5 ${
                                    group === item.key
                                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                                        : 'hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <span className={group === item.key ? 'text-indigo-600' : 'text-gray-400'}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader>
                        <h3 className="font-medium">
                            {availableGroups.find((item) => item.key === group)?.label} Settings
                        </h3>
                    </CardHeader>
                    <CardBody>
                        {group === 'demo_data' ? (
                            <DemoDataSettings isDemo={isDemo} />
                        ) : query.isLoading ? (
                            <div className="text-sm text-gray-500 py-4">Loading...</div>
                        ) : (
                            <div className="space-y-4 max-w-2xl">
                                {group === 'company' ? (
                                    <CompanyFields
                                        values={values}
                                        update={update}
                                        logoPreview={logoPreview}
                                        logoFile={logoFile}
                                        onLogoChange={handleLogoChange}
                                        onUploadLogo={handleUploadLogo}
                                        uploadLogoMutation={uploadLogo}
                                        isDemo={isDemo}
                                    />
                                ) : (
                                    <GroupFields group={group} values={values} update={update} isDemo={isDemo} />
                                )}
                                {group === 'email' && <TestEmail isDemo={isDemo} />}
                                {!isDemo && (
                                    <div className="flex justify-end gap-2 pt-2">
                                        <Button loading={save.isPending} onClick={() => save.mutate()}>
                                            Save Changes
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </>
    );
}

function DemoDataSettings({ isDemo }: { isDemo?: boolean }) {
    const queryClient = useQueryClient();
    const [confirmDelete, setConfirmDelete] = useState(false);

    const { data: stats, isLoading } = useQuery<DemoDataStats>({
        queryKey: ['demo_data_stats'],
        queryFn: () => settingsApi.getDemoStats(),
    });

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['demo_data_stats'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
        queryClient.invalidateQueries({ queryKey: ['quotes'] });
        queryClient.invalidateQueries({ queryKey: ['customers'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        queryClient.invalidateQueries({ queryKey: ['payments'] });
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    };

    const clearMutation = useMutation({
        mutationFn: () => settingsApi.clearDemoData(),
        onSuccess: (res) => {
            invalidateAll();
            toast.success(res.message || 'Data demo berhasil dihapus.');
            setConfirmDelete(false);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Gagal menghapus data demo.');
        },
    });

    const generateMutation = useMutation({
        mutationFn: () => settingsApi.generateDemoData(),
        onSuccess: (res) => {
            invalidateAll();
            toast.success(res.message || 'Data demo lengkap berhasil dimuat.');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Gagal memuat data demo.');
        },
    });

    if (isLoading) return <div className="text-sm text-gray-500 py-4">Memuat status data demo...</div>;

    const hasDemo = stats?.has_demo_data ?? false;
    const counts = stats?.counts ?? {
        customers: 0,
        products: 0,
        quotes: 0,
        invoices: 0,
        payments: 0,
        subscriptions: 0,
        users: 0,
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <p className="text-sm text-gray-600">
                    Fitur ini menyediakan set data simulasi bisnis (dummy) lengkap yang siap digunakan untuk presentasi dan demonstrasi kepada calon klien.
                    Semua data demo ditandai secara khusus sehingga dapat dihapus kapan saja tanpa mempengaruhi data riil operasional Anda.
                </p>
                <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-3 mt-3">
                    <LockClosedIcon className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>
                        <strong>Akses Khusus Admin:</strong> Hanya pengguna dengan peran <em>Owner</em> atau <em>Admin</em> yang diizinkan untuk mengelola dan menghapus data demo.
                    </span>
                </div>
            </div>

            {/* Status Panel */}
            <div className={`p-4 rounded-lg border ${hasDemo ? 'bg-indigo-50/50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${hasDemo ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                        <h4 className="text-sm font-semibold text-gray-900">
                            {hasDemo ? 'Data Demo Sedang Aktif di Sistem' : 'Tidak Ada Data Demo Aktif'}
                        </h4>
                    </div>
                    {hasDemo && (
                        <span className="text-xs bg-indigo-100 text-indigo-800 font-medium px-2 py-0.5 rounded">
                            Demo Active
                        </span>
                    )}
                </div>

                {hasDemo ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center my-3">
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                            <div className="text-xl font-bold text-indigo-600">{counts.invoices}</div>
                            <div className="text-xs text-gray-500">Invoices</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                            <div className="text-xl font-bold text-indigo-600">{counts.quotes}</div>
                            <div className="text-xs text-gray-500">Quotes</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                            <div className="text-xl font-bold text-indigo-600">{counts.customers}</div>
                            <div className="text-xs text-gray-500">Customers</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                            <div className="text-xl font-bold text-indigo-600">{counts.products}</div>
                            <div className="text-xs text-gray-500">Products</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                            <div className="text-xl font-bold text-indigo-600">{counts.payments}</div>
                            <div className="text-xs text-gray-500">Payments</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                            <div className="text-xl font-bold text-indigo-600">{counts.subscriptions}</div>
                            <div className="text-xs text-gray-500">Subscriptions</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                            <div className="text-xl font-bold text-indigo-600">{counts.users}</div>
                            <div className="text-xs text-gray-500">Demo Users</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-100 flex flex-col justify-center">
                            <div className="text-xs text-green-600 font-semibold">Dashboard & Reports</div>
                            <div className="text-[10px] text-gray-400">Siap Ditunjukkan</div>
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-gray-500 my-2">
                        Database saat ini bersih dari sampel data demo. Tekan tombol di bawah jika Anda ingin memuat data dummy lengkap untuk presentasi fitur aplikasi ke calon klien.
                    </p>
                )}
            </div>

            {/* Actions */}
            {isDemo ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                    <strong>Mode Demo (View Only):</strong> Statistik data simulasi di atas dapat Anda tinjau untuk demonstrasi. Tombol inisialisasi dan pembersihan data demo dinonaktifkan pada peran Demo.
                </div>
            ) : (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                    {hasDemo ? (
                        <>
                            <Button
                                type="button"
                                variant="danger"
                                onClick={() => setConfirmDelete(true)}
                                loading={clearMutation.isPending}
                            >
                                Hapus Data Demo
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => generateMutation.mutate()}
                                loading={generateMutation.isPending}
                            >
                                Muat Ulang / Reset Data Demo
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => generateMutation.mutate()}
                            loading={generateMutation.isPending}
                        >
                            Muat Data Demo Lengkap
                        </Button>
                    )}
                </div>
            )}

            <ConfirmDialog
                open={confirmDelete}
                title="Hapus Seluruh Data Demo?"
                message="Tindakan ini akan menghapus semua data transaksi dan entitas bertanda demo (customer, produk, invoice, quote, pembayaran, dan langganan). Data riil perusahaan Anda tidak akan terhapus. Tindakan ini tidak dapat dibatalkan."
                confirmText="Ya, Hapus Data Demo"
                cancelText="Batal"
                danger
                onConfirm={() => clearMutation.mutate()}
                onCancel={() => setConfirmDelete(false)}
            />
        </div>
    );
}

function ImageUploadCard({
    title,
    description,
    currentPath,
    onUpload,
    isUploading,
    disabled,
    placeholder,
}: {
    title: string;
    description: string;
    currentPath: string | null | undefined;
    onUpload: (file: File) => void;
    isUploading: boolean;
    disabled?: boolean;
    placeholder: string;
}) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    const imageUrl = (() => {
        const raw = preview || currentPath;
        if (!raw) return null;
        if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
        if (raw.startsWith('/storage/')) return raw;
        return '/storage/' + raw;
    })();

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setSelectedFile(file);
        if (file) setPreview(URL.createObjectURL(file));
    };

    const handleConfirm = () => {
        if (!selectedFile) return;
        onUpload(selectedFile);
        setSelectedFile(null);
        setPreview(null);
    };

    return (
        <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-2xs space-y-3">
            <div>
                <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                    {imageUrl ? (
                        <img src={imageUrl} alt={title} className="max-h-full max-w-full object-contain" />
                    ) : (
                        <span className="text-[10px] text-gray-400 text-center leading-tight">{placeholder}</span>
                    )}
                </div>
                {!disabled && (
                    <div className="space-y-2 flex-1">
                        <Input type="file" accept="image/*" onChange={handleFile} />
                        {selectedFile && (
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={isUploading}
                                loading={isUploading}
                                onClick={handleConfirm}
                            >
                                Simpan {title}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function CompanyFields({
    values,
    update,
    logoPreview,
    logoFile,
    onLogoChange,
    onUploadLogo,
    uploadLogoMutation,
    isDemo,
}: {
    values: Record<string, any>;
    update: (key: string, value: any) => void;
    logoPreview: string | null;
    logoFile: File | null;
    onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onUploadLogo: () => void;
    uploadLogoMutation: any;
    isDemo?: boolean;
}) {
    const queryClient = useQueryClient();

    const uploadSig = useMutation({
        mutationFn: (file: File) => settingsApi.uploadSignature(file),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['settings_group', 'company'] });
            update('signature', data.signature);
            toast.success('Tanda tangan digital berhasil diunggah.');
        },
        onError: () => toast.error('Gagal mengunggah tanda tangan.'),
    });

    const uploadStamp = useMutation({
        mutationFn: (file: File) => settingsApi.uploadStamp(file),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['settings_group', 'company'] });
            update('stamp', data.stamp);
            toast.success('Stempel perusahaan berhasil diunggah.');
        },
        onError: () => toast.error('Gagal mengunggah stempel.'),
    });

    const uploadQris = useMutation({
        mutationFn: (file: File) => settingsApi.uploadQris(file),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['settings_group', 'company'] });
            update('qris', data.qris);
            toast.success('QRIS pembayaran berhasil diunggah.');
        },
        onError: () => toast.error('Gagal mengunggah QRIS.'),
    });

    const logoUrl = (() => {
        const raw = logoPreview || values.logo;
        if (!raw) return null;
        if (raw.startsWith('http') || raw.startsWith('data:')) return raw;
        if (raw.startsWith('/storage/')) return raw;
        return '/storage/' + raw;
    })();

    return (
        <div className="space-y-6">
            {/* Logo */}
            <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-2xs space-y-3">
                <div>
                    <h4 className="text-sm font-semibold text-gray-900">Logo Perusahaan</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Logo resmi yang ditampilkan di kop surat invoice dan penawaran.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                        ) : (
                            <span className="text-[10px] text-gray-400 text-center leading-tight">Belum Ada Logo</span>
                        )}
                    </div>
                    {!isDemo && (
                        <div className="space-y-2 flex-1">
                            <Input type="file" accept="image/*" onChange={onLogoChange} />
                            {logoFile && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    disabled={uploadLogoMutation.isPending}
                                    loading={uploadLogoMutation.isPending}
                                    onClick={onUploadLogo}
                                >
                                    Simpan Logo
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">Identitas & Kontak Bisnis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Nama Perusahaan">
                        <Input disabled={isDemo} value={values.name ?? ''} onChange={(e) => update('name', e.target.value)} />
                    </Field>
                    <Field label="Email Bisnis">
                        <Input disabled={isDemo} type="email" value={values.email ?? ''} onChange={(e) => update('email', e.target.value)} />
                    </Field>
                    <Field label="No. Telepon">
                        <Input disabled={isDemo} value={values.phone ?? ''} onChange={(e) => update('phone', e.target.value)} />
                    </Field>
                    <Field label="Website">
                        <Input disabled={isDemo} value={values.website ?? ''} onChange={(e) => update('website', e.target.value)} />
                    </Field>
                    <Field label="NPWP / Tax ID">
                        <Input disabled={isDemo} value={values.tax_number ?? ''} onChange={(e) => update('tax_number', e.target.value)} />
                    </Field>
                    <Field label="Kota">
                        <Input disabled={isDemo} value={values.city ?? ''} onChange={(e) => update('city', e.target.value)} placeholder="Contoh: Jakarta Selatan" />
                    </Field>
                </div>
                <Field label="Alamat Kantor">
                    <Textarea disabled={isDemo} value={values.address ?? ''} onChange={(e) => update('address', e.target.value)} />
                </Field>
            </div>

            {/* Legal Signatory & Stamps */}
            <div className="pt-4 border-t border-gray-200 space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-900">Legalitas Dokumen & Otorisasi</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Penandatangan resmi dan stempel perusahaan untuk keabsahan hukum pada PDF.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Nama Penandatangan Resmi" hint="Nama lengkap pejabat yang berwenang menandatangani tagihan">
                        <Input disabled={isDemo} value={values.authorized_signer_name ?? ''} onChange={(e) => update('authorized_signer_name', e.target.value)} placeholder="Contoh: Budi Santoso, S.Kom" />
                    </Field>
                    <Field label="Jabatan Penandatangan" hint="Jabatan resmi dalam perusahaan">
                        <Input disabled={isDemo} value={values.authorized_signer_title ?? ''} onChange={(e) => update('authorized_signer_title', e.target.value)} placeholder="Contoh: Direktur Utama / Finance Manager" />
                    </Field>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ImageUploadCard
                        title="Tanda Tangan Digital"
                        description="Unggah file tanda tangan transparan (PNG/JPG)."
                        currentPath={values.signature}
                        onUpload={(f) => uploadSig.mutate(f)}
                        isUploading={uploadSig.isPending}
                        disabled={isDemo}
                        placeholder="Belum Ada TTD"
                    />
                    <ImageUploadCard
                        title="Stempel / Cap Resmi"
                        description="Unggah cap stempel bulat/kotak perusahaan transparan (PNG)."
                        currentPath={values.stamp}
                        onUpload={(f) => uploadStamp.mutate(f)}
                        isUploading={uploadStamp.isPending}
                        disabled={isDemo}
                        placeholder="Belum Ada Cap"
                    />
                </div>
            </div>

            {/* QRIS Fast Payment */}
            <div className="pt-4 border-t border-gray-200 space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-900">Barcode QRIS Pembayaran Cepat</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Kode barcode QRIS (BCA, Mandiri, BRI, GoPay, OVO, ShopeePay) untuk scan bayar langsung dari PDF invoice.</p>
                </div>
                <ImageUploadCard
                    title="Gambar Barcode QRIS"
                    description="QRIS akan dicetak rapi berdampingan dengan rekening bank di bagian bawah PDF invoice."
                    currentPath={values.qris}
                    onUpload={(f) => uploadQris.mutate(f)}
                    isUploading={uploadQris.isPending}
                    disabled={isDemo}
                    placeholder="Scan QRIS Belum Ada"
                />
            </div>

            {/* PDF Appearance Toggles */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
                <div>
                    <h4 className="text-sm font-semibold text-gray-900">Opsi Tampilan Dokumen PDF</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Pilih elemen yang otomatis dicetak pada lembar PDF tagihan.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors bg-white">
                        <input
                            type="checkbox"
                            disabled={isDemo}
                            checked={Boolean(values.show_signature_on_pdf ?? true)}
                            onChange={(e) => update('show_signature_on_pdf', e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900 block">Tanda Tangan Digital</span>
                            <span className="text-xs text-gray-500">Cetak tanda tangan otorisasi penandatangan di sudut kanan bawah invoice.</span>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors bg-white">
                        <input
                            type="checkbox"
                            disabled={isDemo}
                            checked={Boolean(values.show_stamp_on_pdf ?? true)}
                            onChange={(e) => update('show_stamp_on_pdf', e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900 block">Stempel / Cap Resmi</span>
                            <span className="text-xs text-gray-500">Cetak stempel perusahaan di samping tanda tangan sebagai bukti validitas.</span>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors bg-white">
                        <input
                            type="checkbox"
                            disabled={isDemo}
                            checked={Boolean(values.show_qris_on_pdf ?? true)}
                            onChange={(e) => update('show_qris_on_pdf', e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900 block">QRIS Pembayaran Cepat</span>
                            <span className="text-xs text-gray-500">Tampilkan barcode QRIS di kotak instruksi pembayaran PDF invoice.</span>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors bg-white">
                        <input
                            type="checkbox"
                            disabled={isDemo}
                            checked={Boolean(values.show_paid_watermark ?? true)}
                            onChange={(e) => update('show_paid_watermark', e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                            <span className="text-sm font-medium text-gray-900 block">Watermark "LUNAS / PAID"</span>
                            <span className="text-xs text-gray-500">Cetak watermark stempel besar miring saat invoice berstatus Paid (Lunas).</span>
                        </div>
                    </label>
                </div>
            </div>
        </div>
    );
}

function GroupFields({
    group,
    values,
    update,
    isDemo,
}: {
    group: Exclude<SettingsGroup, 'company' | 'demo_data'>;
    values: Record<string, any>;
    update: (key: string, value: any) => void;
    isDemo?: boolean;
}) {
    if (group === 'invoice')
        return (
            <>
                <Field label="Invoice prefix">
                    <Input disabled={isDemo} value={values.prefix ?? ''} onChange={(e) => update('prefix', e.target.value)} placeholder="INV-" />
                </Field>
                <Field label="Due days">
                    <Input disabled={isDemo} type="number" value={values.due_days ?? ''} onChange={(e) => update('due_days', e.target.value)} />
                </Field>
                <Field label="Currency">
                    <Select disabled={isDemo} value={values.currency ?? 'IDR'} onChange={(e) => update('currency', e.target.value)}>
                        <option>IDR</option>
                        <option>USD</option>
                        <option>SGD</option>
                        <option>EUR</option>
                        <option>AUD</option>
                    </Select>
                </Field>
                <Field label="Default tax rate">
                    <Input disabled={isDemo} type="number" step="0.01" value={values.tax_rate ?? ''} onChange={(e) => update('tax_rate', e.target.value)} />
                </Field>
            </>
        );
    if (group === 'quote')
        return (
            <>
                <Field label="Quote prefix">
                    <Input disabled={isDemo} value={values.prefix ?? ''} onChange={(e) => update('prefix', e.target.value)} placeholder="QT-" />
                </Field>
                <Field label="Valid days">
                    <Input disabled={isDemo} type="number" value={values.valid_days ?? ''} onChange={(e) => update('valid_days', e.target.value)} />
                </Field>
            </>
        );
    if (group === 'email')
        return <EmailFields values={values} update={update} isDemo={isDemo} />;
    return <PaymentSettingsFields values={values} update={update} isDemo={isDemo} />;
}

function PaymentSettingsFields({
    values,
    update,
    isDemo,
}: {
    values: Record<string, any>;
    update: (key: string, value: any) => void;
    isDemo?: boolean;
}) {
    const [activeTab, setActiveTab] = useState<'manual' | 'midtrans' | 'xendit' | 'doku' | 'duitku'>('manual');
    const [showKey, setShowKey] = useState<Record<string, boolean>>({});

    const toggleKeyVisibility = (gateway: string) => {
        setShowKey((prev) => ({ ...prev, [gateway]: !prev[gateway] }));
    };

    const copyWebhookUrl = (gateway: string) => {
        const url = `${window.location.origin}/api/webhooks/payment/${gateway}`;
        navigator.clipboard.writeText(url);
        toast.success(`URL Webhook ${gateway.toUpperCase()} berhasil disalin!`);
    };

    const gateways = [
        { id: 'manual', name: 'Transfer Bank Manual', icon: <BuildingLibraryIcon className="w-4 h-4" />, enabled: true },
        { id: 'midtrans', name: 'Midtrans Snap', icon: <CreditCardIcon className="w-4 h-4" />, enabled: values.midtrans_enabled === '1' },
        { id: 'xendit', name: 'Xendit Invoice', icon: <BoltIcon className="w-4 h-4" />, enabled: values.xendit_enabled === '1' },
        { id: 'doku', name: 'DOKU Checkout', icon: <ShieldCheckIcon className="w-4 h-4" />, enabled: values.doku_enabled === '1' },
        { id: 'duitku', name: 'Duitku Gateway', icon: <WalletIcon className="w-4 h-4" />, enabled: values.duitku_enabled === '1' },
    ];

    return (
        <div className="space-y-6">
            {/* Header / Active Gateway Selector */}
            <div className="bg-gray-50/70 rounded-lg border border-gray-200 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900">Integrasi Pembayaran & Payment Gateway</h3>
                        <p className="text-xs text-gray-500">
                            Atur rekening transfer manual atau sambungkan payment gateway otomatis (Midtrans, Xendit, DOKU, Duitku).
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Metode Pembayaran Utama Pelanggan">
                        <Select
                            disabled={isDemo}
                            value={values.active_gateway ?? 'manual'}
                            onChange={(e) => update('active_gateway', e.target.value)}
                        >
                            <option value="manual">Transfer Bank Manual (Default)</option>
                            <option value="midtrans">Midtrans (Snap / QRIS / VA / E-Wallet)</option>
                            <option value="xendit">Xendit (Invoice & Payment Link)</option>
                            <option value="doku">DOKU Checkout</option>
                            <option value="duitku">Duitku Payment Gateway</option>
                        </Select>
                    </Field>
                    <div className="flex flex-col justify-end">
                        <div className="text-xs text-gray-500 mb-1.5 font-medium">Status Gateway Terkoneksi:</div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {gateways.map((g) => (
                                <span
                                    key={g.id}
                                    className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                        g.enabled
                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                                    }`}
                                >
                                    <span className="w-3.5 h-3.5 flex items-center justify-center">{g.icon}</span>
                                    <span>{g.name.split(' ')[0]}: {g.enabled ? 'Aktif' : 'Off'}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sub-Tab Navigation */}
            <div className="flex border-b border-gray-200 space-x-1 overflow-x-auto pb-1">
                {gateways.map((g) => (
                    <button
                        key={g.id}
                        type="button"
                        onClick={() => setActiveTab(g.id as any)}
                        className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-t-lg border-b-2 whitespace-nowrap transition ${
                            activeTab === g.id
                                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                        }`}
                    >
                        <span>{g.icon}</span>
                        <span>{g.name}</span>
                        {g.enabled && g.id !== 'manual' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content for Manual Bank Transfer */}
            {activeTab === 'manual' && (
                <div className="bg-gray-50/70 rounded-lg border border-gray-200 p-4 space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                        <span className="text-sm font-semibold text-gray-900">Rekening Transfer Bank Manual</span>
                        <span className="text-xs text-gray-500">(Akan tercantum pada lembar tagihan / invoice klien)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Nama Bank">
                            <Input
                                disabled={isDemo}
                                value={values.bank_name ?? ''}
                                onChange={(e) => update('bank_name', e.target.value)}
                                placeholder="BCA / Mandiri / BNI / BRI"
                            />
                        </Field>
                        <Field label="Atas Nama (Account Holder)">
                            <Input
                                disabled={isDemo}
                                value={values.account_name ?? ''}
                                onChange={(e) => update('account_name', e.target.value)}
                                placeholder="PT Solusi Hebat"
                            />
                        </Field>
                        <Field label="Nomor Rekening">
                            <Input
                                disabled={isDemo}
                                value={values.account_number ?? ''}
                                onChange={(e) => update('account_number', e.target.value)}
                                placeholder="1234567890"
                            />
                        </Field>
                    </div>
                    <Field label="Petunjuk Pembayaran (Payment Instructions)">
                        <Textarea
                            disabled={isDemo}
                            value={values.instructions ?? ''}
                            onChange={(e) => update('instructions', e.target.value)}
                            placeholder="Harap sertakan nomor invoice pada berita transfer. Unggah bukti transfer di portal klien untuk verifikasi otomatis."
                            rows={3}
                        />
                    </Field>
                </div>
            )}

            {/* Content for Midtrans */}
            {activeTab === 'midtrans' && (
                <div className="bg-gray-50/70 rounded-lg border border-gray-200 p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div className="flex items-center gap-2">
                            <CreditCardIcon className="w-5 h-5 text-indigo-600" />
                            <span className="text-sm font-semibold text-gray-900">Konfigurasi Midtrans (Snap / QRIS / VA)</span>
                        </div>
                        <a
                            href="https://dashboard.midtrans.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1"
                        >
                            <span>Buka Dashboard Midtrans</span>
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        </a>
                    </div>

                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                        <LightBulbIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-blue-950">Panduan Integrasi Midtrans: </span>
                            Dapatkan <strong>Client Key</strong> dan <strong>Server Key</strong> dari dashboard Midtrans menu <em>Settings &gt; Access Keys</em>.
                            Gunakan mode <strong>Sandbox</strong> untuk uji coba dan beralih ke <strong>Production</strong> saat siap menerima pembayaran asli.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Status Integrasi Midtrans">
                            <Select
                                disabled={isDemo}
                                value={values.midtrans_enabled ?? '0'}
                                onChange={(e) => update('midtrans_enabled', e.target.value)}
                            >
                                <option value="0">Nonaktif (Disabled)</option>
                                <option value="1">Aktif (Enabled)</option>
                            </Select>
                        </Field>
                        <Field label="Environment Mode">
                            <Select
                                disabled={isDemo}
                                value={values.midtrans_mode ?? 'sandbox'}
                                onChange={(e) => update('midtrans_mode', e.target.value)}
                            >
                                <option value="sandbox">Sandbox (Testing / Uji Coba)</option>
                                <option value="production">Production (Live / Transaksi Asli)</option>
                            </Select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Field label="Merchant ID">
                            <Input
                                disabled={isDemo}
                                value={values.midtrans_merchant_id ?? ''}
                                onChange={(e) => update('midtrans_merchant_id', e.target.value)}
                                placeholder="G123456789"
                            />
                        </Field>
                        <Field label="Client Key">
                            <Input
                                disabled={isDemo}
                                value={values.midtrans_client_key ?? ''}
                                onChange={(e) => update('midtrans_client_key', e.target.value)}
                                placeholder="SB-Mid-client-..."
                            />
                        </Field>
                        <div>
                            <label className="block space-y-1">
                                <span className="block text-sm font-medium text-gray-700">Server Key</span>
                                <div className="relative">
                                    <Input
                                        disabled={isDemo}
                                        type={showKey.midtrans ? 'text' : 'password'}
                                        value={values.midtrans_server_key ?? ''}
                                        onChange={(e) => update('midtrans_server_key', e.target.value)}
                                        placeholder="SB-Mid-server-..."
                                        className="pr-16"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleKeyVisibility('midtrans')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-medium transition"
                                        tabIndex={-1}
                                    >
                                        {showKey.midtrans ? 'Tutup' : 'Lihat'}
                                    </button>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Webhook URL Helper */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5">
                        <div className="text-xs font-semibold text-gray-700">Payment Notification / Webhook URL:</div>
                        <div className="flex items-center gap-2">
                            <Input
                                readOnly
                                value={`${window.location.origin}/api/webhooks/payment/midtrans`}
                                className="bg-gray-50 text-xs font-mono"
                            />
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => copyWebhookUrl('midtrans')}
                                className="whitespace-nowrap"
                            >
                                Salin URL
                            </Button>
                        </div>
                        <p className="text-[11px] text-gray-500">
                            Masukkan URL ini di dashboard Midtrans menu <em>Settings &gt; Configuration &gt; Payment Notification URL</em>.
                        </p>
                    </div>
                </div>
            )}

            {/* Content for Xendit */}
            {activeTab === 'xendit' && (
                <div className="bg-gray-50/70 rounded-lg border border-gray-200 p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div className="flex items-center gap-2">
                            <BoltIcon className="w-5 h-5 text-amber-500" />
                            <span className="text-sm font-semibold text-gray-900">Konfigurasi Xendit (Invoice & Payment Link)</span>
                        </div>
                        <a
                            href="https://dashboard.xendit.co"
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1"
                        >
                            <span>Buka Dashboard Xendit</span>
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        </a>
                    </div>

                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                        <LightBulbIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-blue-950">Panduan Integrasi Xendit: </span>
                            Dapatkan <strong>Secret API Key</strong> di dashboard Xendit menu <em>Settings &gt; API Keys &gt; Generate Secret Key</em>.
                            Pastikan memberi izin tulis (Write) untuk Invoice.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Status Integrasi Xendit">
                            <Select
                                disabled={isDemo}
                                value={values.xendit_enabled ?? '0'}
                                onChange={(e) => update('xendit_enabled', e.target.value)}
                            >
                                <option value="0">Nonaktif (Disabled)</option>
                                <option value="1">Aktif (Enabled)</option>
                            </Select>
                        </Field>
                        <Field label="Environment Mode">
                            <Select
                                disabled={isDemo}
                                value={values.xendit_mode ?? 'sandbox'}
                                onChange={(e) => update('xendit_mode', e.target.value)}
                            >
                                <option value="sandbox">Development / Sandbox</option>
                                <option value="production">Production (Live)</option>
                            </Select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block space-y-1">
                                <span className="block text-sm font-medium text-gray-700">Secret API Key</span>
                                <div className="relative">
                                    <Input
                                        disabled={isDemo}
                                        type={showKey.xendit ? 'text' : 'password'}
                                        value={values.xendit_secret_key ?? ''}
                                        onChange={(e) => update('xendit_secret_key', e.target.value)}
                                        placeholder="xnd_development_..."
                                        className="pr-16"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleKeyVisibility('xendit')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-medium transition"
                                        tabIndex={-1}
                                    >
                                        {showKey.xendit ? 'Tutup' : 'Lihat'}
                                    </button>
                                </div>
                            </label>
                        </div>
                        <Field label="Public Key (Opsional)">
                            <Input
                                disabled={isDemo}
                                value={values.xendit_public_key ?? ''}
                                onChange={(e) => update('xendit_public_key', e.target.value)}
                                placeholder="xnd_public_development_..."
                            />
                        </Field>
                        <Field label="Webhook Verification Token (Opsional)">
                            <Input
                                disabled={isDemo}
                                value={values.xendit_webhook_token ?? ''}
                                onChange={(e) => update('xendit_webhook_token', e.target.value)}
                                placeholder="Token verifikasi webhook"
                            />
                        </Field>
                    </div>

                    {/* Webhook URL Helper */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5">
                        <div className="text-xs font-semibold text-gray-700">Webhook / Callback URL:</div>
                        <div className="flex items-center gap-2">
                            <Input
                                readOnly
                                value={`${window.location.origin}/api/webhooks/payment/xendit`}
                                className="bg-gray-50 text-xs font-mono"
                            />
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => copyWebhookUrl('xendit')}
                                className="whitespace-nowrap"
                            >
                                Salin URL
                            </Button>
                        </div>
                        <p className="text-[11px] text-gray-500">
                            Masukkan URL ini di dashboard Xendit menu <em>Settings &gt; Callbacks &gt; Invoices Paid</em>.
                        </p>
                    </div>
                </div>
            )}

            {/* Content for DOKU */}
            {activeTab === 'doku' && (
                <div className="bg-gray-50/70 rounded-lg border border-gray-200 p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div className="flex items-center gap-2">
                            <ShieldCheckIcon className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-semibold text-gray-900">Konfigurasi DOKU Checkout</span>
                        </div>
                        <a
                            href="https://dashboard.doku.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1"
                        >
                            <span>Buka Back Office DOKU</span>
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        </a>
                    </div>

                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                        <LightBulbIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-blue-950">Panduan Integrasi DOKU: </span>
                            Dapatkan <strong>Client ID (Mall ID)</strong> dan <strong>Secret Key (Shared Key)</strong> dari portal DOKU Back Office menu <em>Integration &gt; API Credentials</em>.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Status Integrasi DOKU">
                            <Select
                                disabled={isDemo}
                                value={values.doku_enabled ?? '0'}
                                onChange={(e) => update('doku_enabled', e.target.value)}
                            >
                                <option value="0">Nonaktif (Disabled)</option>
                                <option value="1">Aktif (Enabled)</option>
                            </Select>
                        </Field>
                        <Field label="Environment Mode">
                            <Select
                                disabled={isDemo}
                                value={values.doku_mode ?? 'sandbox'}
                                onChange={(e) => update('doku_mode', e.target.value)}
                            >
                                <option value="sandbox">Sandbox (Testing)</option>
                                <option value="production">Production (Live)</option>
                            </Select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Client ID (Mall ID)">
                            <Input
                                disabled={isDemo}
                                value={values.doku_client_id ?? ''}
                                onChange={(e) => update('doku_client_id', e.target.value)}
                                placeholder="MALLID_12345"
                            />
                        </Field>
                        <div>
                            <label className="block space-y-1">
                                <span className="block text-sm font-medium text-gray-700">Secret Key (Shared Key)</span>
                                <div className="relative">
                                    <Input
                                        disabled={isDemo}
                                        type={showKey.doku ? 'text' : 'password'}
                                        value={values.doku_secret_key ?? ''}
                                        onChange={(e) => update('doku_secret_key', e.target.value)}
                                        placeholder="SK_123456789..."
                                        className="pr-16"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleKeyVisibility('doku')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-medium transition"
                                        tabIndex={-1}
                                    >
                                        {showKey.doku ? 'Tutup' : 'Lihat'}
                                    </button>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Webhook URL Helper */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5">
                        <div className="text-xs font-semibold text-gray-700">Notification / Webhook URL:</div>
                        <div className="flex items-center gap-2">
                            <Input
                                readOnly
                                value={`${window.location.origin}/api/webhooks/payment/doku`}
                                className="bg-gray-50 text-xs font-mono"
                            />
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => copyWebhookUrl('doku')}
                                className="whitespace-nowrap"
                            >
                                Salin URL
                            </Button>
                        </div>
                        <p className="text-[11px] text-gray-500">
                            Masukkan URL ini di DOKU Back Office menu <em>Configuration &gt; Notification URL</em>.
                        </p>
                    </div>
                </div>
            )}

            {/* Content for Duitku */}
            {activeTab === 'duitku' && (
                <div className="bg-gray-50/70 rounded-lg border border-gray-200 p-4 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <div className="flex items-center gap-2">
                            <WalletIcon className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm font-semibold text-gray-900">Konfigurasi Duitku Payment Gateway</span>
                        </div>
                        <a
                            href="https://passport.duitku.com"
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1"
                        >
                            <span>Buka Dashboard Duitku</span>
                            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        </a>
                    </div>

                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                        <LightBulbIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-blue-950">Panduan Integrasi Duitku: </span>
                            Dapatkan <strong>Merchant Code</strong> dan <strong>API Key</strong> dari dashboard Duitku menu <em>Project Settings</em>.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Status Integrasi Duitku">
                            <Select
                                disabled={isDemo}
                                value={values.duitku_enabled ?? '0'}
                                onChange={(e) => update('duitku_enabled', e.target.value)}
                            >
                                <option value="0">Nonaktif (Disabled)</option>
                                <option value="1">Aktif (Enabled)</option>
                            </Select>
                        </Field>
                        <Field label="Environment Mode">
                            <Select
                                disabled={isDemo}
                                value={values.duitku_mode ?? 'sandbox'}
                                onChange={(e) => update('duitku_mode', e.target.value)}
                            >
                                <option value="sandbox">Sandbox (Testing)</option>
                                <option value="production">Production (Live)</option>
                            </Select>
                        </Field>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Merchant Code">
                            <Input
                                disabled={isDemo}
                                value={values.duitku_merchant_code ?? ''}
                                onChange={(e) => update('duitku_merchant_code', e.target.value)}
                                placeholder="D12345"
                            />
                        </Field>
                        <div>
                            <label className="block space-y-1">
                                <span className="block text-sm font-medium text-gray-700">API Key / Merchant Key</span>
                                <div className="relative">
                                    <Input
                                        disabled={isDemo}
                                        type={showKey.duitku ? 'text' : 'password'}
                                        value={values.duitku_api_key ?? ''}
                                        onChange={(e) => update('duitku_api_key', e.target.value)}
                                        placeholder="Key_1234567890..."
                                        className="pr-16"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => toggleKeyVisibility('duitku')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-medium transition"
                                        tabIndex={-1}
                                    >
                                        {showKey.duitku ? 'Tutup' : 'Lihat'}
                                    </button>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Webhook URL Helper */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1.5">
                        <div className="text-xs font-semibold text-gray-700">Callback / Notification URL:</div>
                        <div className="flex items-center gap-2">
                            <Input
                                readOnly
                                value={`${window.location.origin}/api/webhooks/payment/duitku`}
                                className="bg-gray-50 text-xs font-mono"
                            />
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => copyWebhookUrl('duitku')}
                                className="whitespace-nowrap"
                            >
                                Salin URL
                            </Button>
                        </div>
                        <p className="text-[11px] text-gray-500">
                            Masukkan URL ini di dashboard Duitku menu <em>Project &gt; Callback URL</em>.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

interface SmtpPreset {
    id: string;
    name: string;
    icon: React.ReactNode;
    host: string;
    port: string;
    encryption: string;
    defaultUsername?: string;
    badge?: string;
    hint: string;
}

const SMTP_PRESETS: SmtpPreset[] = [
    {
        id: 'gmail',
        name: 'Gmail / Google Workspace',
        icon: <EnvelopeIcon className="w-4 h-4 text-rose-500" />,
        host: 'smtp.gmail.com',
        port: '587',
        encryption: 'tls',
        badge: 'Google',
        hint: 'Wajib menggunakan App Password (Sandi Aplikasi 16 karakter), bukan sandi Google biasa. Aktifkan 2FA di Akun Google > Keamanan > Sandi Aplikasi > buat sandi baru untuk "Email".',
    },
    {
        id: 'mailtrap',
        name: 'Mailtrap (Sandbox & Testing)',
        icon: <BeakerIcon className="w-4 h-4 text-emerald-500" />,
        host: 'sandbox.smtp.mailtrap.io',
        port: '2525',
        encryption: 'tls',
        badge: 'Testing',
        hint: 'Sangat direkomendasikan untuk uji coba. Salin Host, Port, Username, dan Password dari menu Inboxes > SMTP Settings di dashboard Mailtrap Anda.',
    },
    {
        id: 'brevo',
        name: 'Brevo (dahulu Sendinblue)',
        icon: <PaperAirplaneIcon className="w-4 h-4 text-blue-500" />,
        host: 'smtp-relay.brevo.com',
        port: '587',
        encryption: 'tls',
        badge: 'Transactional',
        hint: 'Username adalah alamat email login akun Brevo Anda. Password adalah SMTP Key / Master Key yang digenerate di menu Transactional > Settings di Brevo.',
    },
    {
        id: 'sendgrid',
        name: 'SendGrid (Twilio)',
        icon: <BoltIcon className="w-4 h-4 text-sky-500" />,
        host: 'smtp.sendgrid.net',
        port: '587',
        encryption: 'tls',
        defaultUsername: 'apikey',
        badge: 'High Volume',
        hint: 'Username WAJIB selalu "apikey". Password adalah API Key SendGrid Anda yang memiliki izin Mail Send.',
    },
    {
        id: 'zoho',
        name: 'Zoho Mail',
        icon: <ServerIcon className="w-4 h-4 text-amber-500" />,
        host: 'smtp.zoho.com',
        port: '465',
        encryption: 'ssl',
        badge: 'Business',
        hint: 'Gunakan port 465 (SSL) atau 587 (TLS). Jika akun menggunakan 2FA, buat Application-Specific Password di pengaturan akun Zoho.',
    },
    {
        id: 'custom',
        name: 'Custom SMTP / Lainnya (cPanel / Webmail / VPS)',
        icon: <CogIcon className="w-4 h-4 text-slate-500" />,
        host: '',
        port: '587',
        encryption: 'tls',
        badge: 'Custom',
        hint: 'Masukkan Host, Port, dan kredensial SMTP yang disediakan oleh hosting cPanel, Webmail, Plesk, atau server mail mandiri Anda.',
    },
];

function EmailFields({
    values,
    update,
    isDemo,
}: {
    values: Record<string, any>;
    update: (key: string, value: any) => void;
    isDemo?: boolean;
}) {
    const [showPassword, setShowPassword] = useState(false);

    // Identify active preset based on smtp_provider or host pattern
    const activeProvider = values.smtp_provider || (() => {
        const host = values.smtp_host?.toLowerCase() || '';
        if (host.includes('gmail.com')) return 'gmail';
        if (host.includes('mailtrap.io')) return 'mailtrap';
        if (host.includes('brevo.com') || host.includes('sendinblue.com')) return 'brevo';
        if (host.includes('sendgrid.net')) return 'sendgrid';
        if (host.includes('zoho.com')) return 'zoho';
        return 'custom';
    })();

    const currentPreset = SMTP_PRESETS.find((p) => p.id === activeProvider) || SMTP_PRESETS[SMTP_PRESETS.length - 1];

    const applyPreset = (presetId: string) => {
        const preset = SMTP_PRESETS.find((p) => p.id === presetId);
        if (!preset) return;

        update('smtp_provider', preset.id);
        if (preset.id !== 'custom') {
            update('smtp_host', preset.host);
            update('smtp_port', preset.port);
            update('smtp_encryption', preset.encryption);
            if (preset.defaultUsername) {
                update('smtp_username', preset.defaultUsername);
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Bagian 1: Identitas Pengirim */}
            <div className="bg-gray-50/70 rounded-lg border border-gray-200 p-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                    <span className="text-sm font-semibold text-gray-900">1. Identitas Pengirim Email (From Sender)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="From Name (Nama Pengirim)">
                        <Input
                            disabled={isDemo}
                            value={values.from_name ?? ''}
                            onChange={(e) => update('from_name', e.target.value)}
                            placeholder="PT Solusi Hebat"
                        />
                    </Field>
                    <Field label="From Address (Alamat Email Pengirim)">
                        <Input
                            disabled={isDemo}
                            type="email"
                            value={values.from_address ?? ''}
                            onChange={(e) => update('from_address', e.target.value)}
                            placeholder="billing@solusihebat.com"
                        />
                    </Field>
                </div>
            </div>

            {/* Bagian 2: Konfigurasi Server SMTP */}
            <div className="bg-gray-50/70 rounded-lg border border-gray-200 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="text-sm font-semibold text-gray-900">2. Konfigurasi Server SMTP (Outgoing Mail)</span>
                    <span className="text-xs text-indigo-600 font-medium hidden sm:inline">Pilih preset atau masukkan manual</span>
                </div>

                {/* Preset Provider Selector */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Pilih Layanan SMTP (Preset Otomatis)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {SMTP_PRESETS.map((p) => {
                            const isSelected = activeProvider === p.id;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    disabled={isDemo}
                                    onClick={() => applyPreset(p.id)}
                                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition ${
                                        isSelected
                                            ? 'border-indigo-600 bg-indigo-50/90 text-indigo-900 ring-2 ring-indigo-500/20 font-medium shadow-sm'
                                            : 'border-gray-200 bg-white hover:bg-gray-100 text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-gray-50 border border-gray-100">{p.icon}</span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-semibold truncate">{p.name.split(' (')[0]}</div>
                                        {p.badge && (
                                            <span className="inline-block text-[10px] px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded">
                                                {p.badge}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Preset Guidance Card */}
                {currentPreset && (
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                        <LightBulbIcon className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-blue-950">Petunjuk {currentPreset.name}: </span>
                            <span>{currentPreset.hint}</span>
                        </div>
                    </div>
                )}

                {/* SMTP Server Details Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="md:col-span-2">
                        <Field label="SMTP Host (Server Address)">
                            <Input
                                disabled={isDemo}
                                value={values.smtp_host ?? ''}
                                onChange={(e) => update('smtp_host', e.target.value)}
                                placeholder="smtp.gmail.com"
                            />
                        </Field>
                    </div>
                    <div>
                        <Field label="SMTP Port">
                            <Input
                                disabled={isDemo}
                                type="number"
                                value={values.smtp_port ?? '587'}
                                onChange={(e) => update('smtp_port', e.target.value)}
                                placeholder="587"
                            />
                        </Field>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Enkripsi (Encryption)">
                        <Select
                            disabled={isDemo}
                            value={values.smtp_encryption ?? 'tls'}
                            onChange={(e) => update('smtp_encryption', e.target.value)}
                        >
                            <option value="tls">TLS (Port 587 atau 2525) - Paling Umum</option>
                            <option value="ssl">SSL (Port 465)</option>
                            <option value="none">Tanpa Enkripsi (None)</option>
                        </Select>
                    </Field>
                    <Field label="Driver Mailer">
                        <Input
                            disabled={isDemo}
                            value={values.mailer ?? 'smtp'}
                            onChange={(e) => update('mailer', e.target.value)}
                            placeholder="smtp"
                        />
                    </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="SMTP Username">
                        <Input
                            disabled={isDemo}
                            value={values.smtp_username ?? ''}
                            onChange={(e) => update('smtp_username', e.target.value)}
                            placeholder={activeProvider === 'sendgrid' ? 'apikey' : 'email@perusahaan.com'}
                        />
                    </Field>
                    <div>
                        <label className="block space-y-1">
                            <span className="block text-sm font-medium text-gray-700">SMTP Password / API Key</span>
                            <div className="relative">
                                <Input
                                    disabled={isDemo}
                                    type={showPassword ? 'text' : 'password'}
                                    value={values.smtp_password ?? ''}
                                    onChange={(e) => update('smtp_password', e.target.value)}
                                    placeholder="••••••••••••••••"
                                    className="pr-16"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded font-medium transition"
                                    tabIndex={-1}
                                >
                                    {showPassword ? 'Sembunyikan' : 'Lihat'}
                                </button>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Bagian 3: Otomatisasi Pengingat Pembayaran */}
            <div className="bg-gray-50/70 rounded-lg border border-gray-200 p-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                    <span className="text-sm font-semibold text-gray-900">3. Jadwal Pengingat Pembayaran Otomatis</span>
                </div>
                <div className="space-y-3">
                    <Field label="Status Pengingat Pembayaran (Master Switch)">
                        <Select
                            disabled={isDemo}
                            value={values.payment_reminders_enabled ?? '1'}
                            onChange={(e) => update('payment_reminders_enabled', e.target.value)}
                        >
                            <option value="1">Aktif (Enabled)</option>
                            <option value="0">Nonaktif (Disabled)</option>
                        </Select>
                    </Field>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <Field label="Pengingat: 3 Hari Sebelum Jatuh Tempo">
                            <Select
                                disabled={isDemo}
                                value={values.reminder_due_soon_enabled ?? '1'}
                                onChange={(e) => update('reminder_due_soon_enabled', e.target.value)}
                            >
                                <option value="1">Kirim Otomatis</option>
                                <option value="0">Jangan Kirim</option>
                            </Select>
                        </Field>
                        <Field label="Pengingat: Pada Hari H Jatuh Tempo">
                            <Select
                                disabled={isDemo}
                                value={values.reminder_due_date_enabled ?? '1'}
                                onChange={(e) => update('reminder_due_date_enabled', e.target.value)}
                            >
                                <option value="1">Kirim Otomatis</option>
                                <option value="0">Jangan Kirim</option>
                            </Select>
                        </Field>
                        <Field label="Peringatan: 3 Hari Lewat Jatuh Tempo">
                            <Select
                                disabled={isDemo}
                                value={values.reminder_overdue_enabled ?? '1'}
                                onChange={(e) => update('reminder_overdue_enabled', e.target.value)}
                            >
                                <option value="1">Kirim Otomatis</option>
                                <option value="0">Jangan Kirim</option>
                            </Select>
                        </Field>
                        <Field label="Peringatan Final: 7 Hari Lewat Jatuh Tempo">
                            <Select
                                disabled={isDemo}
                                value={values.reminder_final_enabled ?? '1'}
                                onChange={(e) => update('reminder_final_enabled', e.target.value)}
                            >
                                <option value="1">Kirim Otomatis</option>
                                <option value="0">Jangan Kirim</option>
                            </Select>
                        </Field>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block space-y-1">
            <span className="block text-sm font-medium text-gray-700">{label}</span>
            {children}
        </label>
    );
}

function TestEmail({ isDemo }: { isDemo?: boolean }) {
    const [to, setTo] = useState('');
    const mutation = useMutation({
        mutationFn: () => settingsApi.testEmail(to),
        onSuccess: (res: any) => toast.success(res?.data?.message || res?.message || 'Email uji coba berhasil dikirim!'),
        onError: (err: any) => {
            const msg = err?.response?.data?.message || 'Gagal mengirim email uji coba.';
            const detail = err?.response?.data?.error;
            toast.error(detail ? `${msg} (${detail})` : msg);
        },
    });
    return (
        <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 mb-1.5">
                <PaperAirplaneIcon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <h4 className="text-sm font-semibold text-gray-900">Uji Coba Pengiriman Email (Test Connection)</h4>
            </div>
            <p className="text-xs text-gray-600 mb-3">
                Kirim email uji coba untuk memastikan host, port, username, dan password SMTP Anda berhasil tersambung.
                <strong className="text-indigo-700 ml-1">Pastikan sudah klik tombol "Save Changes" terlebih dahulu sebelum melakukan uji coba.</strong>
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1">
                    <Input
                        type="email"
                        value={to}
                        onChange={(event) => setTo(event.target.value)}
                        placeholder="Masukkan alamat email penerima uji coba..."
                        disabled={isDemo}
                    />
                </div>
                <Button
                    type="button"
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium whitespace-nowrap"
                    loading={mutation.isPending}
                    disabled={!to || isDemo}
                    onClick={() => mutation.mutate()}
                >
                    Kirim Email Uji Coba
                </Button>
            </div>
            {isDemo && (
                <p className="text-xs text-amber-700 mt-2">
                    Pengiriman email uji coba dinonaktifkan pada peran Demo.
                </p>
            )}
        </div>
    );
}