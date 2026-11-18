import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creditNotesApi, CreditNote } from '../../api/creditNotes';
import { customersApi } from '../../api/customers';
import { invoicesApi } from '../../api/invoices';
import { formatMoney } from '../../lib/utils';
import toast from '../../lib/toast';
import Button from '../../components/ui/Button';

export default function CreditNotesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState<CreditNote | null>(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [taxRate, setTaxRate] = useState('0');

  // Allocation State
  const [allocInvoiceId, setAllocInvoiceId] = useState('');
  const [allocAmount, setAllocAmount] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['credit-notes', search, statusFilter],
    queryFn: () => creditNotesApi.list({ search, status: statusFilter || undefined }),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list-simple'],
    queryFn: () => customersApi.list({ per_page: 100 }),
    enabled: showCreateModal,
  });

  const { data: customerInvoices } = useQuery({
    queryKey: ['customer-invoices-open', customerId],
    queryFn: () => invoicesApi.list({ customer_id: Number(customerId), per_page: 50 }),
    enabled: !!customerId,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => creditNotesApi.create(payload),
    onSuccess: () => {
      toast.success('Credit Note berhasil diterbitkan.');
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal membuat Credit Note.');
    },
  });

  const allocateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => creditNotesApi.allocate(id, payload),
    onSuccess: () => {
      toast.success('Credit Note berhasil dialokasikan ke tagihan.');
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
      setShowAllocateModal(null);
      setAllocAmount('');
      setAllocInvoiceId('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal mengalokasikan Credit Note.');
    },
  });

  const voidMutation = useMutation({
    mutationFn: (id: number) => creditNotesApi.void(id),
    onSuccess: () => {
      toast.success('Credit Note berhasil dibatalkan.');
      queryClient.invalidateQueries({ queryKey: ['credit-notes'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Gagal membatalkan Credit Note.');
    },
  });

  const resetForm = () => {
    setCustomerId('');
    setInvoiceId('');
    setReason('');
    setDescription('');
    setAmount('');
    setTaxRate('0');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !description || !amount) {
      toast.error('Mohon lengkapi data pelanggan, deskripsi, dan nominal.');
      return;
    }

    createMutation.mutate({
      customer_id: Number(customerId),
      invoice_id: invoiceId ? Number(invoiceId) : null,
      credit_note_date: date,
      reason,
      tax_rate: Number(taxRate),
      items: [
        {
          description,
          quantity: 1,
          unit_price: Number(amount),
          tax_rate: Number(taxRate),
        },
      ],
    });
  };

  const handleDownloadPdf = async (cn: CreditNote) => {
    try {
      const res = await creditNotesApi.downloadPdf(cn.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Credit_Note_${cn.credit_note_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Gagal mengunduh PDF Credit Note.');
    }
  };

  const creditNotes: CreditNote[] = data?.data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#083336]">Credit Notes & Penyesuaian</h1>
          <p className="text-sm text-gray-500">
            Kelola nota kredit, retur penjualan, dan pemotongan saldo tagihan pelanggan.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#0F5A5E] hover:bg-[#083336] text-white"
        >
          + Terbitkan Credit Note
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
        <input
          type="text"
          placeholder="Cari No. Credit Note, Klien, atau Alasan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F5A5E]"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#0F5A5E]"
        >
          <option value="">Semua Status</option>
          <option value="open">Open (Tersedia Saldo)</option>
          <option value="applied">Applied (Habis Terpakai)</option>
          <option value="void">Void (Batal)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#F9F8F3]">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#083336] uppercase">No. Dokumen</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#083336] uppercase">Pelanggan</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#083336] uppercase">Tanggal</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-[#083336] uppercase">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-[#083336] uppercase">Total Kredit</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-[#083336] uppercase">Sisa Saldo</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-[#083336] uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">Memuat data credit notes...</td>
              </tr>
            ) : creditNotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">Belum ada Credit Note yang diterbitkan.</td>
              </tr>
            ) : (
              creditNotes.map((cn) => (
                <tr key={cn.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[#0F5A5E]">
                    {cn.credit_note_number}
                    {cn.reason && <p className="text-xs text-gray-400 font-normal">{cn.reason}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-gray-800">{cn.customer?.company_name}</div>
                    <div className="text-xs text-gray-400">{cn.customer?.customer_number}</div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{cn.credit_note_date}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cn.status === 'applied'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : cn.status === 'open'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cn.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-gray-900">
                    {formatMoney(cn.total)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-[#0F5A5E]">
                    {formatMoney(cn.remaining_balance)}
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    {cn.status === 'open' && Number(cn.remaining_balance) > 0 && (
                      <button
                        onClick={() => {
                          setShowAllocateModal(cn);
                          setAllocAmount(String(cn.remaining_balance));
                        }}
                        className="text-xs font-semibold text-[#0F5A5E] hover:underline"
                      >
                        Alokasikan
                      </button>
                    )}
                    <button
                      onClick={() => handleDownloadPdf(cn)}
                      className="text-xs font-medium text-gray-600 hover:text-gray-900"
                    >
                      PDF
                    </button>
                    {cn.status !== 'void' && Number(cn.allocated_amount) === 0 && (
                      <button
                        onClick={() => {
                          if (confirm('Yakin ingin membatalkan (void) Credit Note ini?')) {
                            voidMutation.mutate(cn.id);
                          }
                        }}
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Void
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Terbitkan Credit Note */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <h2 className="text-xl font-bold text-[#083336]">Terbitkan Credit Note</h2>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pelanggan</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#0F5A5E]"
                >
                  <option value="">-- Pilih Pelanggan --</option>
                  {customersData?.data?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.customer_number})
                    </option>
                  ))}
                </select>
              </div>

              {customerId && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Referensi Invoice (Opsional)</label>
                  <select
                    value={invoiceId}
                    onChange={(e) => setInvoiceId(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5"
                  >
                    <option value="">-- Tanpa Referensi Langsung --</option>
                    {customerInvoices?.data
                      ?.filter((inv: any) => Number(inv.balance) > 0)
                      .map((inv: any) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoice_number} (Sisa Tagihan: {formatMoney(inv.balance)})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">PPN (%)</label>
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Alasan Penyesuaian</label>
                <input
                  type="text"
                  placeholder="Contoh: Retur barang rusak, Diskon khusus pameran"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Deskripsi Item Kredit</label>
                <input
                  type="text"
                  required
                  placeholder="Uraian item atau jasa yang dikreditkan"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nominal Kredit (Rp)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-[#0F5A5E] text-white"
                >
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan & Terbitkan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Alokasi Credit Note */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <h2 className="text-xl font-bold text-[#083336]">Alokasikan Credit Note</h2>
            <p className="text-xs text-gray-500">
              Gunakan saldo kredit dari <strong>{showAllocateModal.credit_note_number}</strong> untuk memotong tagihan klien yang belum lunas.
            </p>

            <div className="p-3 bg-[#F9F8F3] rounded-lg text-sm">
              <span className="text-gray-600">Sisa Saldo Kredit Tersedia:</span>
              <strong className="block text-base text-[#0F5A5E]">
                {formatMoney(showAllocateModal.remaining_balance)}
              </strong>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Pilih Invoice Tujuan</label>
                <select
                  value={allocInvoiceId}
                  onChange={(e) => setAllocInvoiceId(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5"
                >
                  <option value="">-- Pilih Invoice --</option>
                  {customerInvoices?.data
                    ?.filter((inv: any) => Number(inv.balance) > 0)
                    .map((inv: any) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoice_number} (Sisa: {formatMoney(inv.balance)})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nominal yang Dipotongkan (Rp)</label>
                <input
                  type="number"
                  max={showAllocateModal.remaining_balance}
                  value={allocAmount}
                  onChange={(e) => setAllocAmount(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAllocateModal(null)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  disabled={!allocInvoiceId || !allocAmount || allocateMutation.isPending}
                  onClick={() =>
                    allocateMutation.mutate({
                      id: showAllocateModal.id,
                      payload: {
                        invoice_id: Number(allocInvoiceId),
                        amount: Number(allocAmount),
                      },
                    })
                  }
                  className="bg-[#0F5A5E] text-white"
                >
                  {allocateMutation.isPending ? 'Mengalokasikan...' : 'Terapkan Pemotongan'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
