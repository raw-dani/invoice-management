<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Credit Note {{ $creditNote->credit_note_number }}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 20px; }
        .header { margin-bottom: 25px; border-bottom: 2px solid #0F5A5E; padding-bottom: 15px; }
        .title { font-size: 24px; font-weight: bold; color: #0F5A5E; text-transform: uppercase; }
        .company-info { float: left; width: 60%; }
        .doc-info { float: right; width: 35%; text-align: right; }
        .clear { clear: both; }
        .customer-box { margin-bottom: 20px; padding: 12px; background-color: #F9F8F3; border-left: 4px solid #0F5A5E; border-radius: 4px; }
        table.items { width: 100%; border-collapse: collapse; margin-top: 15px; }
        table.items th { background-color: #0F5A5E; color: #ffffff; padding: 8px; text-align: left; font-size: 11px; }
        table.items td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        .text-right { text-align: right; }
        .totals-table { width: 40%; float: right; margin-top: 15px; border-collapse: collapse; }
        .totals-table td { padding: 6px 8px; font-size: 11px; }
        .total-row { font-weight: bold; font-size: 13px; color: #0F5A5E; border-top: 2px solid #0F5A5E; }
        .badge { display: inline-block; padding: 4px 8px; font-size: 10px; font-weight: bold; border-radius: 3px; background: #e2e8f0; color: #333; }
        .badge-applied { background: #dcfce7; color: #15803d; }
        .badge-open { background: #e0f2fe; color: #0369a1; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <h2 style="margin: 0 0 5px 0; color: #083336;">{{ $creditNote->company->name ?? 'Perusahaan' }}</h2>
            <p style="margin: 0; color: #64748b;">
                {{ $creditNote->company->address }}<br>
                {{ $creditNote->company->city }} {{ $creditNote->company->province }}<br>
                Telp: {{ $creditNote->company->phone }} | Email: {{ $creditNote->company->email }}
            </p>
        </div>
        <div class="doc-info">
            <div class="title">CREDIT NOTE</div>
            <div style="font-size: 14px; font-weight: bold; color: #334155; margin-top: 5px;">{{ $creditNote->credit_note_number }}</div>
            <div style="color: #64748b; margin-top: 3px;">Tanggal: {{ \Carbon\Carbon::parse($creditNote->credit_note_date)->format('d/m/Y') }}</div>
            <div style="margin-top: 5px;">
                <span class="badge {{ $creditNote->status === 'applied' ? 'badge-applied' : 'badge-open' }}">
                    STATUS: {{ strtoupper($creditNote->status) }}
                </span>
            </div>
        </div>
        <div class="clear"></div>
    </div>

    <div class="customer-box">
        <div style="font-weight: bold; color: #0F5A5E; margin-bottom: 4px;">DITUJUKAN KEPADA:</div>
        <div style="font-size: 13px; font-weight: bold;">{{ $creditNote->customer->company_name ?? '-' }}</div>
        <div style="color: #475569;">
            Up. {{ $creditNote->customer->contact_name ?? '-' }}<br>
            {{ $creditNote->customer->address ?? '' }}<br>
            {{ $creditNote->customer->phone ?? '' }} | {{ $creditNote->customer->email ?? '' }}
        </div>
        @if($creditNote->invoice)
            <div style="margin-top: 8px; font-size: 11px; color: #083336;">
                <strong>Referensi Invoice Asli:</strong> {{ $creditNote->invoice->invoice_number }}
            </div>
        @endif
        @if($creditNote->reason)
            <div style="margin-top: 4px; font-size: 11px; color: #083336;">
                <strong>Alasan / Keterangan:</strong> {{ $creditNote->reason }}
            </div>
        @endif
    </div>

    <table class="items">
        <thead>
            <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 55%;">Deskripsi Penyesuaian / Retur</th>
                <th style="width: 10%;" class="text-right">Qty</th>
                <th style="width: 15%;" class="text-right">Harga Satuan</th>
                <th style="width: 15%;" class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($creditNote->items as $idx => $item)
            <tr>
                <td>{{ $idx + 1 }}</td>
                <td>{{ $item->description }}</td>
                <td class="text-right">{{ number_format($item->quantity, 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($item->unit_price, 0, ',', '.') }}</td>
                <td class="text-right">Rp {{ number_format($item->total, 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td>Subtotal</td>
            <td class="text-right">Rp {{ number_format($creditNote->subtotal, 0, ',', '.') }}</td>
        </tr>
        @if($creditNote->tax_amount > 0)
        <tr>
            <td>PPN ({{ $creditNote->tax_rate }}%)</td>
            <td class="text-right">Rp {{ number_format($creditNote->tax_amount, 0, ',', '.') }}</td>
        </tr>
        @endif
        <tr class="total-row">
            <td>TOTAL KREDIT</td>
            <td class="text-right">Rp {{ number_format($creditNote->total, 0, ',', '.') }}</td>
        </tr>
        <tr>
            <td style="color: #15803d;">Telah Dialokasikan</td>
            <td class="text-right" style="color: #15803d;">Rp {{ number_format($creditNote->allocated_amount, 0, ',', '.') }}</td>
        </tr>
        <tr style="font-weight: bold; background-color: #f1f5f9;">
            <td>Sisa Saldo Kredit</td>
            <td class="text-right">Rp {{ number_format($creditNote->remaining_balance, 0, ',', '.') }}</td>
        </tr>
    </table>
    <div class="clear"></div>

    @if($creditNote->allocations->count() > 0)
    <div style="margin-top: 25px;">
        <h4 style="margin-bottom: 8px; color: #083336;">Riwayat Alokasi ke Tagihan</h4>
        <table class="items" style="margin-top: 0;">
            <thead>
                <tr>
                    <th>Invoice Tujuan</th>
                    <th>Tanggal Alokasi</th>
                    <th>Catatan</th>
                    <th class="text-right">Nominal Pengurang</th>
                </tr>
            </thead>
            <tbody>
                @foreach($creditNote->allocations as $alloc)
                <tr>
                    <td>{{ $alloc->invoice->invoice_number ?? '-' }}</td>
                    <td>{{ \Carbon\Carbon::parse($alloc->allocated_at)->format('d/m/Y') }}</td>
                    <td>{{ $alloc->notes ?? '-' }}</td>
                    <td class="text-right">Rp {{ number_format($alloc->amount, 0, ',', '.') }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    @if($creditNote->notes)
    <div style="margin-top: 20px; font-size: 11px; color: #64748b;">
        <strong>Catatan Tambahan:</strong><br>
        {{ $creditNote->notes }}
    </div>
    @endif
</body>
</html>
