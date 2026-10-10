import { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import Button from './ui/Button';
import { Input, Select, Textarea, Field } from './ui/Form';
import { formatMoney, formatDate } from '../lib/utils';
import toast from '../lib/toast';

export interface WhatsAppShareData {
    entityType: 'invoice' | 'quote';
    id: number;
    number: string;
    total: number;
    balance?: number;
    currency: string;
    date: string;
    dueDate?: string;
    customerName: string;
    customerPhone?: string | null;
    companyName?: string;
    publicToken?: string;
    bankName?: string | null;
    bankAccount?: string | null;
    bankHolder?: string | null;
}

interface WhatsAppShareModalProps {
    open: boolean;
    onClose: () => void;
    data: WhatsAppShareData | null;
}

export function WhatsAppShareModal({ open, onClose, data }: WhatsAppShareModalProps) {
    if (!data) return null;

    const [phone, setPhone] = useState('');
    const [templateType, setTemplateType] = useState('new');
    const [message, setMessage] = useState('');

    const portalUrl = data.publicToken
        ? `${window.location.origin}/${data.entityType === 'invoice' ? 'i' : 'q'}/${data.publicToken}`
        : `${window.location.origin}/${data.entityType === 'invoice' ? 'invoices' : 'quotes'}/${data.id}`;

    // Normalize phone number to international format (628...)
    const cleanPhone = (raw: string) => {
        let cleaned = raw.replace(/[^0-9]/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        } else if (cleaned.startsWith('8')) {
            cleaned = '628' + cleaned.substring(1);
        }
        return cleaned;
    };

    useEffect(() => {
        if (data.customerPhone) {
            setPhone(cleanPhone(data.customerPhone));
        } else {
            setPhone('');
        }
    }, [data.customerPhone]);

    // Build message template whenever templateType or data changes
    useEffect(() => {
        const comp = data.companyName || 'Perusahaan Kami';
        const client = data.customerName || 'Bapak/Ibu';
        const formattedTotal = formatMoney(data.total, data.currency);
        const formattedBalance = data.balance !== undefined ? formatMoney(data.balance, data.currency) : formattedTotal;
        const formattedDue = data.dueDate ? formatDate(data.dueDate) : '-';

        let text = '';

        if (data.entityType === 'invoice') {
            if (templateType === 'new') {
                text = `Halo *${client}*,\n\n` +
                    `Terima kasih atas kerja samanya. Berikut kami kirimkan rincian invoice tagihan Anda:\n\n` +
                    `📄 *No. Invoice:* ${data.number}\n` +
                    `💰 *Total Tagihan:* ${formattedTotal}\n` +
                    (data.balance !== undefined && data.balance < data.total ? `💳 *Sisa Pembayaran:* ${formattedBalance}\n` : '') +
                    `📅 *Jatuh Tempo:* ${formattedDue}\n\n` +
                    `Rincian invoice & pengunggahan bukti transfer dapat diakses melalui tautan berikut:\n` +
                    `🔗 ${portalUrl}\n\n` +
                    (data.bankAccount ? `Pembayaran dapat ditransfer ke:\n🏦 *${data.bankName || 'Bank'}*: ${data.bankAccount} (a/n ${data.bankHolder || comp})\n\n` : '') +
                    `Mohon konfirmasikan apabila pembayaran telah dilakukan. Terima kasih!\n\n` +
                    `Salam hangat,\n*${comp}*`;
            } else if (templateType === 'reminder_due_soon') {
                text = `Halo *${client}*,\n\n` +
                    `Sekadar pengingat ramah dari *${comp}*, tagihan invoice Anda akan jatuh tempo dalam waktu dekat:\n\n` +
                    `📄 *No. Invoice:* ${data.number}\n` +
                    `💰 *Sisa Tagihan:* ${formattedBalance}\n` +
                    `📅 *Jatuh Tempo:* ${formattedDue}\n\n` +
                    `Lihat dokumen lengkap & konfirmasi pembayaran di:\n` +
                    `🔗 ${portalUrl}\n\n` +
                    `Abaikan pesan ini apabila Anda telah melakukan pembayaran. Terima kasih atas kerja samanya!`;
            } else if (templateType === 'reminder_due_today') {
                text = `Halo *${client}*,\n\n` +
                    `Kami ingin menginformasikan bahwa tagihan invoice berikut jatuh tempo *hari ini*:\n\n` +
                    `📄 *No. Invoice:* ${data.number}\n` +
                    `💰 *Total Pembayaran:* ${formattedBalance}\n` +
                    `📅 *Batas Pembayaran:* Hari ini (${formattedDue})\n\n` +
                    `Tautan Invoice & Bukti Pembayaran:\n` +
                    `🔗 ${portalUrl}\n\n` +
                    (data.bankAccount ? `Rekening tujuan:\n🏦 *${data.bankName || 'Bank'}*: ${data.bankAccount} a/n ${data.bankHolder || comp}\n\n` : '') +
                    `Mohon dapat segera menyelesaikan pembayaran hari ini agar layanan tetap berjalan lancar. Terima kasih!`;
            } else if (templateType === 'reminder_overdue') {
                text = `Halo *${client}*,\n\n` +
                    `Pemberitahuan penting: Tagihan Anda tercatat telah *melewati batas jatuh tempo* (${formattedDue}):\n\n` +
                    `📄 *No. Invoice:* ${data.number}\n` +
                    `⚠️ *Tunggakan:* ${formattedBalance}\n\n` +
                    `Mohon kesediaannya untuk segera memproses pembayaran melalui tautan berikut:\n` +
                    `🔗 ${portalUrl}\n\n` +
                    `Jika terdapat kendala atau pertanyaan mengenai tagihan ini, silakan hubungi kami segera.\n\n` +
                    `Hormat kami,\n*${comp}*`;
            } else if (templateType === 'paid_receipt') {
                text = `Halo *${client}*,\n\n` +
                    `Pembayaran untuk tagihan Anda telah kami terima dengan baik. Terima kasih banyak!\n\n` +
                    `📄 *No. Invoice:* ${data.number}\n` +
                    `✅ *Status:* LUNAS / PAID\n` +
                    `💰 *Jumlah:* ${formattedTotal}\n\n` +
                    `Anda dapat mengunduh kuitansi & invoice resmi di tautan berikut:\n` +
                    `🔗 ${portalUrl}\n\n` +
                    `Senang dapat berbisnis dengan Anda!\n*${comp}*`;
            }
        } else {
            // Quote templates
            if (templateType === 'new') {
                text = `Halo *${client}*,\n\n` +
                    `Terima kasih atas ketertarikan Anda. Bersama ini kami kirimkan dokumen penawaran harga resmi (Quotation):\n\n` +
                    `📋 *No. Penawaran:* ${data.number}\n` +
                    `💰 *Estimasi Biaya:* ${formattedTotal}\n` +
                    `📅 *Berlaku Hingga:* ${formattedDue}\n\n` +
                    `Rincian item penawaran dapat Anda lihat dan setujui langsung melalui tautan berikut:\n` +
                    `🔗 ${portalUrl}\n\n` +
                    `Jika ada pertanyaan atau butuh penyesuaian spesifikasi, jangan ragu untuk menghubungi kami.\n\n` +
                    `Salam hormat,\n*${comp}*`;
            } else if (templateType === 'followup') {
                text = `Halo *${client}*,\n\n` +
                    `Bagaimana kabar Anda? Kami ingin menanyakan kabar terkait penawaran harga kami sebelumnya:\n\n` +
                    `📋 *No. Penawaran:* ${data.number}\n` +
                    `💰 *Estimasi Total:* ${formattedTotal}\n` +
                    `🔗 Tautan: ${portalUrl}\n\n` +
                    `Apakah ada hal yang perlu kami diskusikan lebih lanjut agar dapat membantu kebutuhan proyek Anda?\n\n` +
                    `Terima kasih!\n*${comp}*`;
            }
        }

        setMessage(text);
    }, [data, templateType, portalUrl]);

    const handleCopy = () => {
        navigator.clipboard.writeText(message);
        toast.success('Pesan WhatsApp berhasil disalin ke clipboard!');
    };

    const handleSend = () => {
        const targetPhone = cleanPhone(phone);
        if (!targetPhone) {
            toast.error('Masukkan nomor WhatsApp tujuan (contoh: 08123456789 atau 628123456789).');
            return;
        }
        const encodedText = encodeURIComponent(message);
        const url = `https://wa.me/${targetPhone}?text=${encodedText}`;
        window.open(url, '_blank');
        onClose();
    };

    return (
        <Modal open={open} onClose={onClose} title="Kirim via WhatsApp" size="lg">
            <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs">
                    <span className="text-xl">💬</span>
                    <div>
                        <strong className="block font-semibold">1-Click WhatsApp Direct Invoicing</strong>
                        Pesan otomatis tersusun rapi dengan link portal interaktif pelanggan dan format markdown WhatsApp.
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Nomor WhatsApp Pelanggan" required>
                        <Input
                            placeholder="Contoh: 08123456789"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </Field>

                    <Field label="Template Pesan" required>
                        <Select value={templateType} onChange={(e) => setTemplateType(e.target.value)}>
                            {data.entityType === 'invoice' ? (
                                <>
                                    <option value="new">Kirim Invoice Baru (Lengkap & Sopan)</option>
                                    <option value="reminder_due_soon">Pengingat Ramah (H-3 Jatuh Tempo)</option>
                                    <option value="reminder_due_today">Pengingat Hari-H Jatuh Tempo</option>
                                    <option value="reminder_overdue">Teguran Keterlambatan (Overdue)</option>
                                    <option value="paid_receipt">Konfirmasi Pembayaran Lunas</option>
                                </>
                            ) : (
                                <>
                                    <option value="new">Kirim Penawaran Harga Baru</option>
                                    <option value="followup">Follow Up Tindak Lanjut Penawaran</option>
                                </>
                            )}
                        </Select>
                    </Field>
                </div>

                <Field label="Pratinjau & Edit Pesan WhatsApp">
                    <Textarea
                        rows={9}
                        className="font-mono text-xs leading-relaxed"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </Field>

                <div className="flex items-center justify-between pt-2 border-t">
                    <Button variant="secondary" size="sm" onClick={handleCopy}>
                        📋 Salin Teks
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" size="sm" onClick={onClose}>
                            Batal
                        </Button>
                        <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-2"
                            onClick={handleSend}
                        >
                            <span>Buka WhatsApp</span> ↗
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
