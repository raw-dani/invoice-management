import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi, SettingsGroup, DemoDataStats } from '../../api/settings';
import { Card, CardBody, CardHeader, PageHeader } from '../../components/ui/Display';
import { Input, Select, Textarea } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import toast from '../../lib/toast';

const GROUPS: Array<{ key: SettingsGroup; label: string }> = [
    { key: 'company', label: 'Company' },
    { key: 'invoice', label: 'Invoice' },
    { key: 'quote', label: 'Quote' },
    { key: 'email', label: 'Email' },
    { key: 'payment', label: 'Payment' },
];

export default function SettingsPage() {
    const { user } = useAuth();
    const isAdmin = Boolean(user && ['owner', 'admin'].includes(user.role));
    const isDemo = user?.role === 'demo';
    const [group, setGroup] = useState<SettingsGroup>('company');
    const queryClient = useQueryClient();

    const availableGroups: Array<{ key: SettingsGroup; label: string }> = [
        ...GROUPS,
        ...(isAdmin || isDemo ? [{ key: 'demo_data' as const, label: 'Demo Data' }] : []),
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
                    <span className="text-2xl">🔒</span>
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
                                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                                    group === item.key
                                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                                        : 'hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                {item.label}
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
                    <span className="text-base">🔒</span>
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
        return (
            <>
                <Field label="From name">
                    <Input disabled={isDemo} value={values.from_name ?? ''} onChange={(e) => update('from_name', e.target.value)} />
                </Field>
                <Field label="From address">
                    <Input disabled={isDemo} type="email" value={values.from_address ?? ''} onChange={(e) => update('from_address', e.target.value)} />
                </Field>
                <Field label="Mailer">
                    <Input disabled={isDemo} value={values.mailer ?? ''} placeholder="smtp" onChange={(e) => update('mailer', e.target.value)} />
                </Field>
                <Field label="Payment reminders">
                    <Select disabled={isDemo} value={values.payment_reminders_enabled ?? '1'} onChange={(e) => update('payment_reminders_enabled', e.target.value)}>
                        <option value="1">Enabled</option>
                        <option value="0">Disabled</option>
                    </Select>
                </Field>
                <Field label="Reminder: 3 days before due">
                    <Select disabled={isDemo} value={values.reminder_due_soon_enabled ?? '1'} onChange={(e) => update('reminder_due_soon_enabled', e.target.value)}>
                        <option value="1">Enabled</option>
                        <option value="0">Disabled</option>
                    </Select>
                </Field>
                <Field label="Reminder: on due date">
                    <Select disabled={isDemo} value={values.reminder_due_date_enabled ?? '1'} onChange={(e) => update('reminder_due_date_enabled', e.target.value)}>
                        <option value="1">Enabled</option>
                        <option value="0">Disabled</option>
                    </Select>
                </Field>
                <Field label="Reminder: 3 days overdue">
                    <Select disabled={isDemo} value={values.reminder_overdue_enabled ?? '1'} onChange={(e) => update('reminder_overdue_enabled', e.target.value)}>
                        <option value="1">Enabled</option>
                        <option value="0">Disabled</option>
                    </Select>
                </Field>
                <Field label="Reminder: 7 days overdue (final)">
                    <Select disabled={isDemo} value={values.reminder_final_enabled ?? '1'} onChange={(e) => update('reminder_final_enabled', e.target.value)}>
                        <option value="1">Enabled</option>
                        <option value="0">Disabled</option>
                    </Select>
                </Field>
            </>
        );
    return (
        <>
            <Field label="Bank name">
                <Input disabled={isDemo} value={values.bank_name ?? ''} onChange={(e) => update('bank_name', e.target.value)} />
            </Field>
            <Field label="Account name">
                <Input disabled={isDemo} value={values.account_name ?? ''} onChange={(e) => update('account_name', e.target.value)} />
            </Field>
            <Field label="Account number">
                <Input disabled={isDemo} value={values.account_number ?? ''} onChange={(e) => update('account_number', e.target.value)} />
            </Field>
            <Field label="Payment instructions">
                <Textarea disabled={isDemo} value={values.instructions ?? ''} onChange={(e) => update('instructions', e.target.value)} />
            </Field>
        </>
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
        onSuccess: () => toast.success('Test email sent successfully.'),
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to send test email.'),
    });
    return (
        <div className="border-t pt-4">
            <Field label="Test recipient">
                <Input
                    type="email"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    placeholder="you@example.com"
                    disabled={isDemo}
                />
            </Field>
            <Button
                className="mt-2"
                type="button"
                size="sm"
                variant="secondary"
                loading={mutation.isPending}
                disabled={!to || isDemo}
                onClick={() => mutation.mutate()}
            >
                Send Test Email
            </Button>
            {isDemo && (
                <p className="text-xs text-amber-700 mt-1.5">
                    Pengiriman email uji coba dinonaktifkan pada peran Demo.
                </p>
            )}
        </div>
    );
}