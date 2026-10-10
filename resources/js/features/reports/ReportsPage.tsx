import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsApi, ReportFilters } from '../../api/reports';
import { Card, CardBody, CardHeader, EmptyState, PageHeader } from '../../components/ui/Display';
import { Input, Select } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { formatMoney, formatDate, statusBadgeClass } from '../../lib/utils';
import { downloadPdf } from '../../lib/pdf';
import toast from '../../lib/toast';

type Tab = 'revenue' | 'invoices' | 'customers' | 'subscriptions';
type DatePreset = 'this_month' | 'last_30' | 'this_quarter' | 'this_year' | 'all' | 'custom';

const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'revenue', label: 'Pendapatan', icon: '💰' },
    { key: 'invoices', label: 'Tagihan (Invoices)', icon: '📄' },
    { key: 'customers', label: 'Pelanggan', icon: '👥' },
    { key: 'subscriptions', label: 'Langganan', icon: '🔄' },
];

const formatDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function getPresetDates(preset: DatePreset) {
    const now = new Date();
    const to = formatDateStr(now);

    if (preset === 'this_month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { from: formatDateStr(start), to };
    }
    if (preset === 'last_30') {
        const start = new Date();
        start.setDate(now.getDate() - 30);
        return { from: formatDateStr(start), to };
    }
    if (preset === 'this_quarter') {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        const start = new Date(now.getFullYear(), quarterMonth, 1);
        return { from: formatDateStr(start), to };
    }
    if (preset === 'this_year') {
        const start = new Date(now.getFullYear(), 0, 1);
        return { from: formatDateStr(start), to };
    }
    if (preset === 'all') {
        return { from: '2020-01-01', to };
    }
    return { from: '', to: '' };
}

export default function ReportsPage() {
    const [tab, setTab] = useState<Tab>('revenue');
    const [activePreset, setActivePreset] = useState<DatePreset>('this_year');
    const [filters, setFilters] = useState<ReportFilters>(() => ({
        ...getPresetDates('this_year'),
        group_by: 'month',
    }));
    const [isExporting, setIsExporting] = useState(false);

    const report = useQuery({
        queryKey: ['reports', tab, filters],
        queryFn: () => (tab === 'subscriptions' ? reportsApi.subscriptions() : reportsApi[tab](filters)),
    });

    const updateDate = (key: 'from' | 'to', value: string) => {
        setActivePreset('custom');
        setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    };

    const updateGroupBy = (value: string) => {
        setFilters((prev) => ({ ...prev, group_by: value }));
    };

    const handlePresetChange = (preset: DatePreset) => {
        setActivePreset(preset);
        const dates = getPresetDates(preset);
        setFilters((prev) => ({
            ...prev,
            from: dates.from,
            to: dates.to,
        }));
    };

    const handleExport = async (format: 'csv' | 'pdf') => {
        try {
            setIsExporting(true);
            const params = new URLSearchParams({
                type: tab,
                ...(filters.from ? { from: filters.from } : {}),
                ...(filters.to ? { to: filters.to } : {}),
                ...(filters.group_by ? { group_by: filters.group_by } : {}),
            });
            const ext = format === 'csv' ? 'csv' : 'pdf';
            await downloadPdf(`/api/reports/export/${format}?${params.toString()}`, `laporan-${tab}.${ext}`);
            toast.success(`Laporan format ${format.toUpperCase()} berhasil diekspor.`);
        } catch {
            toast.error(`Gagal mengekspor laporan ${format.toUpperCase()}.`);
        } finally {
            setIsExporting(false);
        }
    };

    if (report.isError) {
        return (
            <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-red-200">
                <p className="text-sm font-medium text-red-600">Gagal memuat data laporan dari server.</p>
                <Button className="mt-4" variant="secondary" onClick={() => report.refetch()}>
                    Coba Lagi
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Laporan & Analisis Bisnis"
                subtitle="Visualisasi performa pendapatan, efisiensi penagihan invoice, saldo piutang, dan tren langganan berulang."
                actions={
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => handleExport('csv')}
                            disabled={isExporting}
                            className="flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export CSV
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => handleExport('pdf')}
                            disabled={isExporting}
                            className="flex items-center gap-1.5"
                        >
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Export PDF
                        </Button>
                    </div>
                }
            />

            {/* Tab Navigation Pill Bar */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
                {TABS.map((item) => {
                    const isActive = tab === item.key;
                    return (
                        <button
                            key={item.key}
                            onClick={() => setTab(item.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap ${
                                isActive
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white border border-gray-200'
                            }`}
                        >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Filter Bar with Presets & Date Inputs (Hidden for subscriptions tab) */}
            {tab !== 'subscriptions' && (
                <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-4 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        {/* Quick Presets */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-1">
                                Periode:
                            </span>
                            {(
                                [
                                    { key: 'this_month', label: 'Bulan Ini' },
                                    { key: 'last_30', label: '30 Hari Terakhir' },
                                    { key: 'this_quarter', label: 'Kuartal Ini' },
                                    { key: 'this_year', label: 'Tahun Ini' },
                                    { key: 'all', label: 'Semua Waktu' },
                                ] as const
                            ).map((p) => {
                                const isActive = activePreset === p.key;
                                return (
                                    <button
                                        key={p.key}
                                        type="button"
                                        onClick={() => handlePresetChange(p.key)}
                                        className={`px-3 py-1.5 text-xs rounded-lg font-medium transition ${
                                            isActive
                                                ? 'bg-indigo-100 text-indigo-700 font-semibold border border-indigo-300'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Date Inputs & Group By */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5">
                                <label className="text-xs text-gray-500 font-medium">Dari:</label>
                                <Input
                                    type="date"
                                    value={filters.from ?? ''}
                                    onChange={(e) => updateDate('from', e.target.value)}
                                    className="text-xs py-1 px-2.5 h-8 w-36"
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <label className="text-xs text-gray-500 font-medium">Sampai:</label>
                                <Input
                                    type="date"
                                    value={filters.to ?? ''}
                                    onChange={(e) => updateDate('to', e.target.value)}
                                    className="text-xs py-1 px-2.5 h-8 w-36"
                                />
                            </div>

                            {tab === 'revenue' && (
                                <div className="flex items-center gap-1.5">
                                    <label className="text-xs text-gray-500 font-medium">Kelompokkan:</label>
                                    <Select
                                        value={filters.group_by ?? 'month'}
                                        onChange={(e) => updateGroupBy(e.target.value)}
                                        className="text-xs py-1 px-2.5 h-8"
                                    >
                                        <option value="month">Per Bulan</option>
                                        <option value="customer">Per Pelanggan</option>
                                        <option value="product">Per Produk</option>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {report.isLoading ? (
                <div className="flex items-center justify-center p-16 bg-white rounded-xl border border-gray-200">
                    <div className="text-center space-y-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 inline-block" />
                        <div className="text-xs text-gray-500 font-medium">Mengkalkulasi metrik laporan...</div>
                    </div>
                </div>
            ) : tab === 'revenue' ? (
                <RevenueReport data={report.data} groupBy={filters.group_by ?? 'month'} />
            ) : tab === 'invoices' ? (
                <InvoiceReport data={report.data} />
            ) : tab === 'customers' ? (
                <CustomerReport data={report.data} />
            ) : (
                <SubscriptionReport data={report.data} />
            )}
        </div>
    );
}

/* =========================================================================
   1. REVENUE REPORT COMPONENT (DENGAN GRAFIK KOLOM & RANKING HORIZONTAL)
   ========================================================================= */
function RevenueReport({ data, groupBy }: { data: any; groupBy: string }) {
    const rows: Array<{ label: string; revenue: number | string; quantity?: number }> = data?.rows ?? [];
    const currency = data?.currency ?? 'IDR';

    const numericRows = rows.map((r) => ({
        ...r,
        revenue: Number(r.revenue) || 0,
    }));

    const totalRevenue = numericRows.reduce((acc, cur) => acc + cur.revenue, 0);
    const maxRevenue = Math.max(...numericRows.map((r) => r.revenue), 1);
    const avgRevenue = numericRows.length > 0 ? Math.round(totalRevenue / numericRows.length) : 0;
    const peakRow = numericRows.reduce((max, cur) => (cur.revenue > max.revenue ? cur : max), {
        label: '-',
        revenue: 0,
    });

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    if (!rows.length) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-gray-900">Laporan Pendapatan</h3>
                </CardHeader>
                <CardBody>
                    <EmptyState
                        title="Belum ada data pendapatan"
                        message="Tidak ada catatan pembayaran pada rentang tanggal yang dipilih."
                    />
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Pendapatan"
                    value={formatMoney(totalRevenue, currency)}
                    badge="Total Kas Masuk"
                    badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
                    icon="💵"
                />
                <MetricCard
                    title="Rata-rata Pendapatan"
                    value={formatMoney(avgRevenue, currency)}
                    badge={`Rerata per ${groupBy === 'month' ? 'Bulan' : groupBy === 'customer' ? 'Klien' : 'Produk'}`}
                    badgeColor="bg-blue-50 text-blue-700 border-blue-200"
                    icon="📊"
                />
                <MetricCard
                    title="Periode/Penyumbang Tertinggi"
                    value={formatMoney(peakRow.revenue, currency)}
                    badge={peakRow.label}
                    badgeColor="bg-purple-50 text-purple-700 border-purple-200"
                    icon="🏆"
                />
                <MetricCard
                    title="Jumlah Entri Analisis"
                    value={`${numericRows.length} ${groupBy === 'month' ? 'Bulan' : 'Item'}`}
                    badge="Data Terhitung"
                    badgeColor="bg-gray-100 text-gray-700 border-gray-200"
                    icon="📅"
                />
            </div>

            {/* Visual Chart Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">
                                {groupBy === 'month'
                                    ? 'Grafik Tren Pendapatan Bulanan'
                                    : groupBy === 'customer'
                                    ? 'Grafik Kontribusi Pendapatan per Pelanggan'
                                    : 'Grafik Penjualan Produk'}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Visualisasi distribusi penerimaan pembayaran berdasarkan {groupBy}.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1.5 text-gray-600">
                                <span className="w-3 h-3 rounded-xs bg-indigo-600 inline-block" />
                                Realisasi Pendapatan
                            </span>
                            {groupBy === 'month' && (
                                <span className="flex items-center gap-1.5 text-gray-600">
                                    <span className="w-3 h-0.5 bg-dashed bg-amber-500 inline-block" />
                                    Garis Rata-rata
                                </span>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    {groupBy === 'month' ? (
                        /* Modern Vertical Column / Bar Chart */
                        <div className="space-y-4">
                            <div className="relative pt-6 pb-2">
                                {/* Dotted Average Reference Line */}
                                {avgRevenue > 0 && maxRevenue > 0 && (
                                    <div
                                        className="absolute left-0 right-0 border-t-2 border-dashed border-amber-400 z-10 pointer-events-none flex items-center justify-end"
                                        style={{
                                            bottom: `${Math.min(Math.max((avgRevenue / maxRevenue) * 220, 20), 220) + 32}px`,
                                        }}
                                    >
                                        <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded shadow-2xs mr-2">
                                            Rerata: {formatMoney(avgRevenue, currency)}
                                        </span>
                                    </div>
                                )}

                                {/* Bar Chart Container */}
                                <div className="h-[240px] flex items-end gap-2 sm:gap-4 border-b border-gray-200 px-2">
                                    {numericRows.map((row, index) => {
                                        const heightPercent = maxRevenue > 0 ? (row.revenue / maxRevenue) * 100 : 0;
                                        const isHovered = hoveredIndex === index;
                                        const isPeak = row.revenue === peakRow.revenue && row.revenue > 0;

                                        return (
                                            <div
                                                key={row.label}
                                                className="flex-1 flex flex-col items-center h-full justify-end group relative"
                                                onMouseEnter={() => setHoveredIndex(index)}
                                                onMouseLeave={() => setHoveredIndex(null)}
                                            >
                                                {/* Tooltip on Hover */}
                                                {isHovered && (
                                                    <div className="absolute -top-12 z-20 bg-gray-900 text-white text-[11px] py-1 px-2.5 rounded shadow-lg whitespace-nowrap pointer-events-none text-center">
                                                        <div className="font-semibold">{row.label}</div>
                                                        <div className="text-emerald-400 font-mono">
                                                            {formatMoney(row.revenue, currency)}
                                                        </div>
                                                        <div className="text-[10px] text-gray-300">
                                                            {totalRevenue > 0
                                                                ? `${((row.revenue / totalRevenue) * 100).toFixed(1)}% total`
                                                                : '0%'}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Bar */}
                                                <div
                                                    className={`w-full max-w-[48px] rounded-t-md transition-all duration-300 relative ${
                                                        isPeak
                                                            ? 'bg-gradient-to-t from-indigo-700 to-indigo-500 shadow-sm'
                                                            : 'bg-gradient-to-t from-indigo-500 to-indigo-300 group-hover:from-indigo-600 group-hover:to-indigo-400'
                                                    }`}
                                                    style={{
                                                        height: `${Math.max(heightPercent, 3)}%`,
                                                    }}
                                                >
                                                    {isPeak && (
                                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs">
                                                            ⭐
                                                        </span>
                                                    )}
                                                </div>

                                                {/* X-Axis Label */}
                                                <div className="mt-2 text-[11px] text-gray-600 font-medium truncate w-full text-center">
                                                    {row.label}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Horizontal Ranking Bar Chart for Customers & Products */
                        <div className="space-y-3.5">
                            {numericRows.slice(0, 10).map((row, index) => {
                                const percentage = totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0;
                                const barWidth = maxRevenue > 0 ? (row.revenue / maxRevenue) * 100 : 0;

                                return (
                                    <div key={row.label} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                                        index === 0
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : index === 1
                                                            ? 'bg-gray-200 text-gray-800'
                                                            : index === 2
                                                            ? 'bg-orange-100 text-orange-800'
                                                            : 'bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {index + 1}
                                                </span>
                                                <span className="font-semibold text-gray-800">{row.label}</span>
                                                {row.quantity !== undefined && (
                                                    <span className="text-[11px] text-gray-400">
                                                        ({row.quantity} unit)
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 font-mono">
                                                    {formatMoney(row.revenue, currency)}
                                                </span>
                                                <span className="text-gray-400 text-[11px] w-12 text-right">
                                                    {percentage.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    index === 0
                                                        ? 'bg-indigo-600'
                                                        : index < 3
                                                        ? 'bg-indigo-500'
                                                        : 'bg-indigo-400'
                                                }`}
                                                style={{ width: `${Math.max(barWidth, 2)}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Detailed Table */}
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-gray-900">Rincian Data Pendapatan</h3>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm divide-y divide-gray-200">
                            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                                <tr>
                                    <th className="py-3 px-4 text-left">No</th>
                                    <th className="py-3 px-4 text-left">
                                        {groupBy === 'month' ? 'Periode Bulan' : groupBy === 'customer' ? 'Nama Pelanggan' : 'Nama Produk'}
                                    </th>
                                    {groupBy === 'product' && <th className="py-3 px-4 text-right">Kuantitas</th>}
                                    <th className="py-3 px-4 text-right">Pendapatan</th>
                                    <th className="py-3 px-4 text-right">Porsi (% Total)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {numericRows.map((row, index) => {
                                    const share = totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0;
                                    return (
                                        <tr key={row.label} className="hover:bg-gray-50/70">
                                            <td className="py-3 px-4 text-gray-400 font-mono text-xs">{index + 1}</td>
                                            <td className="py-3 px-4 font-semibold text-gray-800">{row.label}</td>
                                            {groupBy === 'product' && (
                                                <td className="py-3 px-4 text-right text-gray-600">
                                                    {row.quantity ?? '-'}
                                                </td>
                                            )}
                                            <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">
                                                {formatMoney(row.revenue, currency)}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 bg-gray-100 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-indigo-600 h-full rounded-full"
                                                            style={{ width: `${share}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-500 font-mono w-10 text-right">
                                                        {share.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

/* =========================================================================
   2. INVOICE REPORT COMPONENT (DENGAN DISTRIBUSI STATUS & COLLECTION RATE)
   ========================================================================= */
function InvoiceReport({ data }: { data: any }) {
    const rows: Array<{ status: string; count: number; total: number; balance: number }> = (data?.rows ?? []).map(
        (r: any) => ({
            status: r.status,
            count: Number(r.count) || 0,
            total: Number(r.total) || 0,
            balance: Number(r.balance) || 0,
        })
    );

    const totalInvoices = rows.reduce((acc, cur) => acc + cur.count, 0);
    const totalAmount = rows.reduce((acc, cur) => acc + cur.total, 0);
    const totalBalance = rows.reduce((acc, cur) => acc + cur.balance, 0);
    const totalCollected = Math.max(totalAmount - totalBalance, 0);
    const collectionRate = totalAmount > 0 ? (totalCollected / totalAmount) * 100 : 0;

    const STATUS_COLORS: Record<string, { bg: string; text: string; fill: string }> = {
        paid: { bg: 'bg-emerald-500', text: 'text-emerald-700', fill: '#10b981' },
        partially_paid: { bg: 'bg-amber-500', text: 'text-amber-700', fill: '#f59e0b' },
        sent: { bg: 'bg-blue-500', text: 'text-blue-700', fill: '#3b82f6' },
        overdue: { bg: 'bg-red-500', text: 'text-red-700', fill: '#ef4444' },
        draft: { bg: 'bg-gray-400', text: 'text-gray-700', fill: '#9ca3af' },
        void: { bg: 'bg-zinc-400', text: 'text-zinc-700', fill: '#71717a' },
    };

    if (!rows.length) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-gray-900">Laporan Invoice</h3>
                </CardHeader>
                <CardBody>
                    <EmptyState
                        title="Belum ada data tagihan"
                        message="Tidak ada invoice yang diterbitkan pada rentang waktu yang dipilih."
                    />
                </CardBody>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Tagihan Diterbitkan"
                    value={formatMoney(totalAmount)}
                    badge={`${totalInvoices} Dokumen`}
                    badgeColor="bg-indigo-50 text-indigo-700 border-indigo-200"
                    icon="📑"
                />
                <MetricCard
                    title="Pembayaran Berhasil Dihimpun"
                    value={formatMoney(totalCollected)}
                    badge="Lunas Terkumpul"
                    badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
                    icon="✅"
                />
                <MetricCard
                    title="Sisa Piutang Berjalan"
                    value={formatMoney(totalBalance)}
                    badge="Belum Terbayar"
                    badgeColor="bg-red-50 text-red-700 border-red-200"
                    icon="⏳"
                />
                <MetricCard
                    title="Tingkat Penagihan (Collection Rate)"
                    value={`${collectionRate.toFixed(1)}%`}
                    badge={collectionRate >= 80 ? 'Sangat Baik' : 'Perlu Ditindaklanjuti'}
                    badgeColor={
                        collectionRate >= 80
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                    }
                    icon="📈"
                />
            </div>

            {/* Visual Status Breakdown & Progress Card */}
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-gray-900">Distribusi Status Tagihan</h3>
                </CardHeader>
                <CardBody className="space-y-5">
                    {/* Multi-segment distribution progress bar */}
                    <div>
                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                            <span>Komposisi Berdasarkan Nilai Tagihan</span>
                            <span>Total: {formatMoney(totalAmount)}</span>
                        </div>
                        <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                            {rows.map((r) => {
                                const percent = totalAmount > 0 ? (r.total / totalAmount) * 100 : 0;
                                const color = STATUS_COLORS[r.status]?.bg ?? 'bg-gray-400';
                                if (percent <= 0) return null;

                                return (
                                    <div
                                        key={r.status}
                                        style={{ width: `${percent}%` }}
                                        className={`${color} transition-all duration-500 hover:opacity-90`}
                                        title={`${r.status.toUpperCase()}: ${formatMoney(r.total)} (${percent.toFixed(1)}%)`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Status Pill Badges & Amounts */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                        {rows.map((r) => {
                            const percent = totalAmount > 0 ? (r.total / totalAmount) * 100 : 0;
                            const color = STATUS_COLORS[r.status] ?? {
                                bg: 'bg-gray-400',
                                text: 'text-gray-700',
                                fill: '#9ca3af',
                            };

                            return (
                                <div
                                    key={r.status}
                                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${color.bg}`} />
                                        <span className="text-[11px] font-semibold uppercase text-gray-500 font-mono">
                                            {r.count} Lembar
                                        </span>
                                    </div>
                                    <div className="font-semibold text-gray-900 text-xs capitalize">
                                        {r.status.replace('_', ' ')}
                                    </div>
                                    <div className="font-bold text-sm text-gray-800 font-mono">
                                        {formatMoney(r.total)}
                                    </div>
                                    <div className="text-[11px] text-gray-400 font-mono">
                                        {percent.toFixed(1)}% dari total
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardBody>
            </Card>

            {/* Detailed Table */}
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-gray-900">Rincian Status Invoice</h3>
                </CardHeader>
                <CardBody className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm divide-y divide-gray-200">
                            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                                <tr>
                                    <th className="py-3 px-4 text-left">Status</th>
                                    <th className="py-3 px-4 text-right">Jumlah Invoice</th>
                                    <th className="py-3 px-4 text-right">Total Nilai Tagihan</th>
                                    <th className="py-3 px-4 text-right">Sisa Piutang (Balance)</th>
                                    <th className="py-3 px-4 text-right">Tingkat Pelunasan</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((r) => {
                                    const collected = r.total - r.balance;
                                    const rate = r.total > 0 ? (collected / r.total) * 100 : 0;

                                    return (
                                        <tr key={r.status} className="hover:bg-gray-50/70">
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusBadgeClass(
                                                        r.status
                                                    )}`}
                                                >
                                                    {r.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold text-gray-700">
                                                {r.count}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-gray-900 font-mono">
                                                {formatMoney(r.total)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-red-600 font-mono">
                                                {formatMoney(r.balance)}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-16 bg-gray-100 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full ${
                                                                rate === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                                                            }`}
                                                            style={{ width: `${Math.max(rate, 0)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-600 font-mono w-12 text-right">
                                                        {rate.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

/* =========================================================================
   3. CUSTOMER REPORT COMPONENT (DENGAN GRAFIK PIUTANG & SEBARAN PELANGGAN)
   ========================================================================= */
function CustomerReport({ data }: { data: any }) {
    const statusRows: Array<{ status: string; count: number }> = (data?.status ?? []).map((r: any) => ({
        status: r.status,
        count: Number(r.count) || 0,
    }));

    const balanceRows: Array<{ customer: string; balance: number }> = (data?.balances ?? []).map((r: any) => ({
        customer: r.customer,
        balance: Number(r.balance) || 0,
    }));

    const totalCustomers = statusRows.reduce((acc, cur) => acc + cur.count, 0);
    const totalReceivables = balanceRows.reduce((acc, cur) => acc + cur.balance, 0);
    const maxBalance = Math.max(...balanceRows.map((r) => r.balance), 1);

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                    title="Total Pelanggan Baru (Periode Ini)"
                    value={`${totalCustomers} Pelanggan`}
                    badge="Pertumbuhan Klien"
                    badgeColor="bg-indigo-50 text-indigo-700 border-indigo-200"
                    icon="👥"
                />
                <MetricCard
                    title="Total Saldo Piutang (Top Debitur)"
                    value={formatMoney(totalReceivables)}
                    badge="Harus Ditagih"
                    badgeColor="bg-red-50 text-red-700 border-red-200"
                    icon="⚠️"
                />
                <MetricCard
                    title="Debitur Piutang Terbesar"
                    value={balanceRows[0]?.customer ?? '-'}
                    badge={balanceRows[0] ? formatMoney(balanceRows[0].balance) : '-'}
                    badgeColor="bg-amber-50 text-amber-700 border-amber-200"
                    icon="🏢"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Horizontal Bar Chart: Top Accounts Receivable */}
                <div className="lg:col-span-8">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        Top 10 Piutang Pelanggan Terbesar
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Daftar pelanggan dengan akumulasi tagihan belum lunas terbanyak.
                                    </p>
                                </div>
                                <span className="text-xs text-red-600 font-semibold bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                                    Prioritas Penagihan
                                </span>
                            </div>
                        </CardHeader>
                        <CardBody>
                            {balanceRows.length ? (
                                <div className="space-y-4">
                                    {balanceRows.map((row, index) => {
                                        const widthPercent = (row.balance / maxBalance) * 100;
                                        return (
                                            <div key={row.customer} className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center font-bold text-[10px]">
                                                            {index + 1}
                                                        </span>
                                                        <span className="font-semibold text-gray-800">
                                                            {row.customer}
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-red-600 font-mono">
                                                        {formatMoney(row.balance)}
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.max(widthPercent, 2)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <EmptyState
                                    title="Tidak ada piutang tertunggak"
                                    message="Semua pelanggan telah melunasi invoice mereka. Bagus sekali!"
                                />
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Customer Status Breakdown */}
                <div className="lg:col-span-4">
                    <Card>
                        <CardHeader>
                            <h3 className="font-semibold text-gray-900">Status Pelanggan</h3>
                        </CardHeader>
                        <CardBody>
                            {statusRows.length ? (
                                <div className="space-y-3">
                                    {statusRows.map((row) => (
                                        <div
                                            key={row.status}
                                            className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                                        >
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusBadgeClass(
                                                    row.status
                                                )}`}
                                            >
                                                {row.status}
                                            </span>
                                            <div className="text-right">
                                                <div className="font-bold text-gray-900 text-base">{row.count}</div>
                                                <div className="text-[10px] text-gray-400">Akun Klien</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    title="Belum ada data"
                                    message="Tidak ada data pendaftaran pelanggan pada periode ini."
                                />
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}

/* =========================================================================
   4. SUBSCRIPTION REPORT COMPONENT (DENGAN METRIK MRR/ARR & JADWAL TAGIHAN)
   ========================================================================= */
function SubscriptionReport({ data }: { data: any }) {
    const active = Number(data?.active) || 0;
    const paused = Number(data?.paused) || 0;
    const cancelled = Number(data?.cancelled) || 0;
    const totalSubs = active + paused + cancelled;
    const mrr = Number(data?.mrr) || 0;
    const arr = mrr * 12; // Annual Run Rate

    const upcoming: Array<{
        subscription_number: string;
        billing_cycle: string;
        next_billing_date: string;
    }> = data?.upcoming ?? [];

    const activeRate = totalSubs > 0 ? (active / totalSubs) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="MRR (Monthly Recurring Revenue)"
                    value={formatMoney(mrr)}
                    badge="Pendapatan Bulanan Tetap"
                    badgeColor="bg-purple-50 text-purple-700 border-purple-200"
                    icon="🔁"
                />
                <MetricCard
                    title="ARR Est. (Annual Run Rate)"
                    value={formatMoney(arr)}
                    badge="Proyeksi 12 Bulan"
                    badgeColor="bg-indigo-50 text-indigo-700 border-indigo-200"
                    icon="📊"
                />
                <MetricCard
                    title="Langganan Aktif"
                    value={`${active} Kontrak`}
                    badge={`${activeRate.toFixed(0)}% dari total`}
                    badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
                    icon="✅"
                />
                <MetricCard
                    title="Ditangguhkan / Berhenti"
                    value={`${paused + cancelled} Kontrak`}
                    badge={`${paused} Paused · ${cancelled} Cancelled`}
                    badgeColor="bg-gray-100 text-gray-700 border-gray-200"
                    icon="⏸️"
                />
            </div>

            {/* Health Meter Card */}
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-gray-900">Kesehatan Portofolio Langganan</h3>
                </CardHeader>
                <CardBody className="space-y-4">
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-gray-600">
                            <span>Rasio Status Kontrak Langganan</span>
                            <span className="font-semibold">{totalSubs} Total Langganan</span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
                            {active > 0 && (
                                <div
                                    style={{ width: `${(active / totalSubs) * 100}%` }}
                                    className="bg-emerald-500"
                                    title={`Aktif: ${active}`}
                                />
                            )}
                            {paused > 0 && (
                                <div
                                    style={{ width: `${(paused / totalSubs) * 100}%` }}
                                    className="bg-amber-500"
                                    title={`Paused: ${paused}`}
                                />
                            )}
                            {cancelled > 0 && (
                                <div
                                    style={{ width: `${(cancelled / totalSubs) * 100}%` }}
                                    className="bg-red-400"
                                    title={`Cancelled: ${cancelled}`}
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs pt-1">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                            <span className="text-gray-700 font-medium">Aktif ({active})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                            <span className="text-gray-700 font-medium">Ditangguhkan ({paused})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                            <span className="text-gray-700 font-medium">Dibatalkan ({cancelled})</span>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Upcoming Billings Timeline */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Jadwal Penagihan Berikutnya</h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Invoice yang akan otomatis di-generate oleh sistem scheduler.
                            </p>
                        </div>
                        <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                            Auto Billing
                        </span>
                    </div>
                </CardHeader>
                <CardBody className="p-0">
                    {upcoming.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm divide-y divide-gray-200">
                                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                                    <tr>
                                        <th className="py-3 px-4 text-left">Nomor Langganan</th>
                                        <th className="py-3 px-4 text-left">Siklus Penagihan</th>
                                        <th className="py-3 px-4 text-right">Tanggal Tagihan Berikutnya</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {upcoming.map((item) => (
                                        <tr key={item.subscription_number} className="hover:bg-gray-50/70">
                                            <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                                                {item.subscription_number}
                                            </td>
                                            <td className="py-3 px-4 capitalize text-gray-700">
                                                <span className="px-2 py-0.5 rounded text-xs bg-gray-100 font-medium">
                                                    {item.billing_cycle?.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium text-gray-900 font-mono">
                                                {formatDate(item.next_billing_date)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-8">
                            <EmptyState
                                title="Tidak ada jadwal tagihan dekat"
                                message="Belum ada tagihan berulang yang dijadwalkan dalam 30 hari ke depan."
                            />
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}

/* =========================================================================
   REUSABLE METRIC CARD COMPONENT
   ========================================================================= */
function MetricCard({
    title,
    value,
    badge,
    badgeColor,
    icon,
}: {
    title: string;
    value: string | number;
    badge?: string;
    badgeColor?: string;
    icon?: string;
}) {
    return (
        <Card className="hover:shadow-sm transition">
            <CardBody className="p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>{title}</span>
                    {icon && <span className="text-base">{icon}</span>}
                </div>
                <div className="text-xl font-bold text-gray-900 tracking-tight font-mono">{value}</div>
                {badge && (
                    <div className="pt-1">
                        <span
                            className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                                badgeColor ?? 'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                        >
                            {badge}
                        </span>
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
