import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesApi } from '../../api/quotes';
import { Card, CardBody, CardHeader } from '../../components/ui/Display';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';
import { Modal } from '../../components/ui/Modal';
import { formatMoney, formatDate } from '../../lib/utils';
import toast from '../../lib/toast';
import { CogIcon, PlusIcon, TargetIcon, DocumentTextIcon, RocketLaunchIcon } from '../../components/ui/Icons';
import type { Quote, QuoteMilestone } from '../../types';

interface MilestoneDraft {
    name: string;
    percentage: number;
    due_date?: string;
    notes?: string;
}

export function QuoteMilestoneSection({ quote }: { quote: Quote }) {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [drafts, setDrafts] = useState<MilestoneDraft[]>([]);

    const milestones = quote.milestones ?? [];
    const hasMilestones = milestones.length > 0;

    // Calculate billed stats
    const invoicedMilestones = milestones.filter((m) => m.invoice_id);
    const invoicedPercentage = invoicedMilestones.reduce((acc, m) => acc + Number(m.percentage), 0);
    const invoicedAmount = invoicedMilestones.reduce((acc, m) => acc + Number(m.amount), 0);
    const remainingPercentage = Math.max(0, 100 - invoicedPercentage);
    const remainingAmount = Math.max(0, quote.total - invoicedAmount);

    const saveMutation = useMutation({
        mutationFn: (items: MilestoneDraft[]) => quotesApi.saveMilestones(quote.id, items),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quote', quote.id] });
            queryClient.invalidateQueries({ queryKey: ['quotes'] });
            toast.success('Rencana termin pembayaran berhasil disimpan!');
            setModalOpen(false);
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || 'Gagal menyimpan rencana termin.';
            toast.error(msg);
        },
    });

    const generateInvoiceMutation = useMutation({
        mutationFn: (milestoneId: number) => quotesApi.generateMilestoneInvoice(quote.id, milestoneId),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['quote', quote.id] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            toast.success(res.message || 'Invoice termin berhasil diterbitkan!');
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || 'Gagal menerbitkan invoice termin.';
            toast.error(msg);
        },
    });

    const openSetupModal = () => {
        if (hasMilestones) {
            setDrafts(
                milestones.map((m) => ({
                    name: m.name,
                    percentage: Number(m.percentage),
                    due_date: m.due_date || '',
                    notes: m.notes || '',
                }))
            );
        } else {
            // Default preset 30% - 40% - 30%
            applyPreset30_40_30();
        }
        setModalOpen(true);
    };

    const applyPreset50_50 = () => {
        setDrafts([
            { name: 'Termin 1: Uang Muka (DP)', percentage: 50, notes: 'Pembayaran awal sebelum proyek dimulai' },
            { name: 'Termin 2: Pelunasan & Serah Terima', percentage: 50, notes: 'Pelunasan saat serah terima hasil proyek' },
        ]);
    };

    const applyPreset30_40_30 = () => {
        setDrafts([
            { name: 'Termin 1: Uang Muka (DP)', percentage: 30, notes: 'Pembayaran awal proyek' },
            { name: 'Termin 2: Progres Pengerjaan 50%', percentage: 40, notes: 'Setelah milestone tengah selesai' },
            { name: 'Termin 3: Pelunasan & Serah Terima', percentage: 30, notes: 'Pelunasan akhir saat go-live' },
        ]);
    };

    const applyPreset25x4 = () => {
        setDrafts([
            { name: 'Termin 1: Uang Muka (DP)', percentage: 25, notes: 'Uang muka proyek' },
            { name: 'Termin 2: Tahap Desain & Blueprint', percentage: 25, notes: 'Setelah desain disetujui' },
            { name: 'Termin 3: Tahap Pengembangan Sistem', percentage: 25, notes: 'Setelah sistem fungsional' },
            { name: 'Termin 4: Pelunasan & Serah Terima', percentage: 25, notes: 'Pelunasan akhir' },
        ]);
    };

    const addDraftRow = () => {
        setDrafts([...drafts, { name: `Termin ${drafts.length + 1}`, percentage: 0, notes: '' }]);
    };

    const removeDraftRow = (index: number) => {
        setDrafts(drafts.filter((_, idx) => idx !== index));
    };

    const updateDraftRow = (index: number, key: keyof MilestoneDraft, value: any) => {
        const next = [...drafts];
        next[index] = { ...next[index], [key]: value };
        setDrafts(next);
    };

    const totalDraftPercentage = drafts.reduce((acc, d) => acc + (Number(d.percentage) || 0), 0);
    const isValidPercentage = Math.abs(totalDraftPercentage - 100) < 0.05;

    return (
        <Card className="mt-6">
            <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-base">Rencana Termin & Milestone Billing</h3>
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Fitur Unggulan Proyek
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Bagi pembayaran penawaran ini ke dalam beberapa tahapan / termin (DP & Pelunasan).
                        </p>
                    </div>
                    <div>
                        <Button size="sm" variant="secondary" className="inline-flex items-center gap-1.5" onClick={openSetupModal}>
                            {hasMilestones ? (
                                <>
                                    <CogIcon className="w-4 h-4 text-gray-600" />
                                    <span>Atur Ulang Skema Termin</span>
                                </>
                            ) : (
                                <>
                                    <PlusIcon className="w-4 h-4 text-gray-600" />
                                    <span>Aktifkan Termin / DP</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardBody>
                {!hasMilestones ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/60 p-6">
                        <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                            <TargetIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">Belum Ada Skema Termin</h4>
                        <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
                            Klien B2B seringkali membutuhkan pembayaran bertahap (misal DP 30% lalu Pelunasan 70%). Buat skema termin dengan 1 klik!
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            <Button size="sm" variant="secondary" onClick={() => { applyPreset50_50(); setModalOpen(true); }}>
                                Preset DP 50% & Pelunasan 50%
                            </Button>
                            <Button size="sm" variant="primary" onClick={() => { applyPreset30_40_30(); setModalOpen(true); }}>
                                Preset 30% - 40% - 30%
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Progress Bar & Summary */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                            <div className="flex flex-col sm:flex-row justify-between text-xs font-medium text-slate-700 mb-2 gap-1">
                                <span>
                                    Tertagih (Invoice): <strong>{formatMoney(invoicedAmount, quote.currency)}</strong> ({invoicedPercentage.toFixed(0)}%)
                                </span>
                                <span>
                                    Sisa Termin: <strong>{formatMoney(remainingAmount, quote.currency)}</strong> ({remainingPercentage.toFixed(0)}%)
                                </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
                                <div
                                    className="bg-emerald-500 h-3 transition-all duration-500"
                                    style={{ width: `${invoicedPercentage}%` }}
                                    title={`Tertagih: ${invoicedPercentage}%`}
                                />
                                <div
                                    className="bg-indigo-300 h-3 transition-all duration-500"
                                    style={{ width: `${remainingPercentage}%` }}
                                    title={`Sisa: ${remainingPercentage}%`}
                                />
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-gray-500 mt-2">
                                <span>Total Penawaran: <strong>{formatMoney(quote.total, quote.currency)}</strong></span>
                                <span>{invoicedMilestones.length} dari {milestones.length} termin sudah dibuat invoice</span>
                            </div>
                        </div>

                        {/* List of Milestones */}
                        <div className="grid grid-cols-1 gap-3">
                            {milestones.map((milestone) => {
                                const isInvoiced = Boolean(milestone.invoice_id);
                                return (
                                    <div
                                        key={milestone.id}
                                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                                            isInvoiced
                                                ? 'bg-emerald-50/40 border-emerald-200'
                                                : 'bg-white border-gray-200 hover:border-indigo-300 shadow-2xs'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3 mb-3 sm:mb-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                                                isInvoiced
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'bg-indigo-100 text-indigo-700'
                                            }`}>
                                                {milestone.sequence}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h5 className="font-semibold text-gray-900 text-sm">
                                                        {milestone.name}
                                                    </h5>
                                                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                                                        {Number(milestone.percentage).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                                                    <span>Nilai: <strong className="text-gray-800">{formatMoney(Number(milestone.amount), quote.currency)}</strong></span>
                                                    {milestone.due_date && (
                                                        <span>Target: <strong>{formatDate(milestone.due_date)}</strong></span>
                                                    )}
                                                    {milestone.notes && <span className="italic">· {milestone.notes}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                            {isInvoiced ? (
                                                <Link
                                                    to={`/invoices/${milestone.invoice_id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 shadow-2xs transition-colors"
                                                >
                                                    <DocumentTextIcon className="w-3.5 h-3.5 text-emerald-600" />
                                                    <span>Invoice #{milestone.invoice_number || milestone.invoice_id}</span>
                                                    {milestone.invoice_status && (
                                                        <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                                                            {milestone.invoice_status}
                                                        </span>
                                                    )}
                                                    <span>&rarr;</span>
                                                </Link>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="primary"
                                                    className="inline-flex items-center gap-1.5"
                                                    disabled={generateInvoiceMutation.isPending}
                                                    loading={generateInvoiceMutation.isPending}
                                                    onClick={() => generateInvoiceMutation.mutate(milestone.id)}
                                                    title="Otomatis buatkan faktur/invoice untuk tahapan pembayaran ini"
                                                >
                                                    <RocketLaunchIcon className="w-4 h-4" />
                                                    <span>Buat Invoice Termin</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardBody>

            {/* Setup / Edit Modal */}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Konfigurasi Skema Termin Proyek">
                <div className="space-y-4">
                    <p className="text-xs text-gray-500">
                        Tentukan tahapan penagihan proyek untuk penawaran senilai <strong>{formatMoney(quote.total, quote.currency)}</strong>. Total akumulasi persentase harus tepat 100%.
                    </p>

                    {/* Presets */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 font-medium">Gunakan Preset Cepat:</span>
                        <button
                            type="button"
                            onClick={applyPreset50_50}
                            className="px-2.5 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                        >
                            DP 50% & Pelunasan 50%
                        </button>
                        <button
                            type="button"
                            onClick={applyPreset30_40_30}
                            className="px-2.5 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                        >
                            30% - 40% - 30%
                        </button>
                        <button
                            type="button"
                            onClick={applyPreset25x4}
                            className="px-2.5 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
                        >
                            4 Tahap (25% x 4)
                        </button>
                    </div>

                    {/* Drafts Rows */}
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {drafts.map((draft, idx) => {
                            const calculatedAmount = Math.round(quote.total * ((Number(draft.percentage) || 0) / 100));
                            return (
                                <div key={idx} className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-gray-700">Tahap {idx + 1}</span>
                                        {drafts.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeDraftRow(idx)}
                                                className="text-xs text-red-600 hover:underline"
                                            >
                                                Hapus
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                        <div className="sm:col-span-6">
                                            <Input
                                                placeholder="Nama termin (misal: Uang Muka DP)"
                                                value={draft.name}
                                                onChange={(e) => updateDraftRow(idx, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="sm:col-span-3">
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    step="0.1"
                                                    placeholder="%"
                                                    value={draft.percentage || ''}
                                                    onChange={(e) => updateDraftRow(idx, 'percentage', parseFloat(e.target.value) || 0)}
                                                />
                                                <span className="absolute right-3 top-2 text-xs text-gray-400">%</span>
                                            </div>
                                        </div>
                                        <div className="sm:col-span-3 flex items-center justify-end text-xs font-semibold text-gray-700">
                                            {formatMoney(calculatedAmount, quote.currency)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <Input
                                            type="date"
                                            placeholder="Target Jatuh Tempo"
                                            value={draft.due_date || ''}
                                            onChange={(e) => updateDraftRow(idx, 'due_date', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Catatan tambahan (opsional)"
                                            value={draft.notes || ''}
                                            onChange={(e) => updateDraftRow(idx, 'notes', e.target.value)}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t">
                        <Button type="button" size="sm" variant="secondary" className="inline-flex items-center gap-1" onClick={addDraftRow}>
                            <PlusIcon className="w-3.5 h-3.5" />
                            <span>Tambah Tahap Termin</span>
                        </Button>
                        <div className="text-right text-xs">
                            <span className="text-gray-500">Total Persentase: </span>
                            <span className={`font-bold ${isValidPercentage ? 'text-emerald-600' : 'text-red-600'}`}>
                                {totalDraftPercentage.toFixed(1)}% / 100%
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3">
                        <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            disabled={!isValidPercentage || saveMutation.isPending}
                            loading={saveMutation.isPending}
                            onClick={() => saveMutation.mutate(drafts)}
                        >
                            Simpan Rencana Termin
                        </Button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
}
