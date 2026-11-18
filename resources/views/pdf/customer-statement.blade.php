<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Customer Statement of Account</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #333; margin: 0; padding: 20px; }
        .header { margin-bottom: 20px; border-bottom: 2px solid #0F5A5E; padding-bottom: 12px; }
        .title { font-size: 20px; font-weight: bold; color: #0F5A5E; text-transform: uppercase; }
        .company-info { float: left; width: 55%; }
        .doc-info { float: right; width: 40%; text-align: right; }
        .clear { clear: both; }
        .customer-box { margin-bottom: 15px; padding: 10px; background-color: #F9F8F3; border-left: 4px solid #0F5A5E; border-radius: 4px; }
        table.statement { width: 100%; border-collapse: collapse; margin-top: 10px; }
        table.statement th { background-color: #0F5A5E; color: #ffffff; padding: 7px; text-align: left; font-size: 10px; }
        table.statement td { padding: 6px 7px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .summary-cards { margin-bottom: 15px; }
        .summary-card { float: left; width: 23%; margin-right: 2%; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px; text-align: center; }
        .summary-card:last-child { margin-right: 0; }
        .summary-title { font-size: 9px; color: #64748b; text-transform: uppercase; }
        .summary-value { font-size: 12px; font-weight: bold; color: #0F5A5E; margin-top: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            <h2 style="margin: 0 0 4px 0; color: #083336; font-size: 16px;">{{ $company->name ?? 'Perusahaan' }}</h2>
            <p style="margin: 0; color: #64748b; font-size: 10px;">
                {{ $company->address }}<br>
                Telp: {{ $company->phone }} | Email: {{ $company->email }}
            </p>
        </div>
        <div class="doc-info">
            <div class="title">STATEMENT OF ACCOUNT</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                Periode: {{ \Carbon\Carbon::parse($startDate)->format('d/m/Y') }} s/d {{ \Carbon\Carbon::parse($endDate)->format('d/m/Y') }}
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                Tanggal Cetak: {{ now()->format('d/m/Y H:i') }}
            </div>
        </div>
        <div class="clear"></div>
    </div>

    <div class="customer-box">
        <div style="font-weight: bold; color: #0F5A5E; font-size: 10px; margin-bottom: 3px;">PELANGGAN:</div>
        <div style="font-size: 13px; font-weight: bold; color: #083336;">{{ $customer->company_name }} ({{ $customer->customer_number }})</div>
        <div style="color: #475569; font-size: 10px; margin-top: 2px;">
            Attn: {{ $customer->contact_name ?? '-' }} | Telp: {{ $customer->phone ?? '-' }} | Email: {{ $customer->email ?? '-' }}<br>
            {{ $customer->address ?? '' }}
        </div>
    </div>

    <div class="summary-cards">
        <div class="summary-card">
            <div class="summary-title">Saldo Awal</div>
            <div class="summary-value">Rp {{ number_format($statement['opening_balance'], 0, ',', '.') }}</div>
        </div>
        <div class="summary-card">
            <div class="summary-title">Total Tagihan (Debit)</div>
            <div class="summary-value" style="color: #0369a1;">Rp {{ number_format($statement['total_debit'], 0, ',', '.') }}</div>
        </div>
        <div class="summary-card">
            <div class="summary-title">Total Pembayaran (Kredit)</div>
            <div class="summary-value" style="color: #15803d;">Rp {{ number_format($statement['total_credit'], 0, ',', '.') }}</div>
        </div>
        <div class="summary-card" style="border-color: #0F5A5E; background: #e6f4f1;">
            <div class="summary-title" style="color: #083336;">Saldo Akhir Piutang</div>
            <div class="summary-value" style="color: #0F5A5E;">Rp {{ number_format($statement['closing_balance'], 0, ',', '.') }}</div>
        </div>
        <div class="clear"></div>
    </div>

    <table class="statement">
        <thead>
            <tr>
                <th style="width: 10%;">Tanggal</th>
                <th style="width: 12%;">Tipe</th>
                <th style="width: 16%;">No. Referensi</th>
                <th style="width: 26%;">Keterangan</th>
                <th style="width: 12%;" class="text-right">Debit (Tagihan)</th>
                <th style="width: 12%;" class="text-right">Kredit (Bayar)</th>
                <th style="width: 12%;" class="text-right">Saldo Berjalan</th>
            </tr>
        </thead>
        <tbody>
            <tr style="background-color: #f8fafc; font-weight: bold;">
                <td colspan="4">SALDO AWAL PER {{ \Carbon\Carbon::parse($startDate)->format('d/m/Y') }}</td>
                <td class="text-right">-</td>
                <td class="text-right">-</td>
                <td class="text-right">Rp {{ number_format($statement['opening_balance'], 0, ',', '.') }}</td>
            </tr>
            @forelse($statement['transactions'] as $tx)
            <tr>
                <td>{{ \Carbon\Carbon::parse($tx['date'])->format('d/m/Y') }}</td>
                <td>{{ $tx['type'] }}</td>
                <td><strong>{{ $tx['reference'] }}</strong></td>
                <td>{{ $tx['description'] }}</td>
                <td class="text-right">{{ $tx['debit'] > 0 ? 'Rp ' . number_format($tx['debit'], 0, ',', '.') : '-' }}</td>
                <td class="text-right" style="color: #15803d;">{{ $tx['credit'] > 0 ? 'Rp ' . number_format($tx['credit'], 0, ',', '.') : '-' }}</td>
                <td class="text-right" style="font-weight: bold;">Rp {{ number_format($tx['running_balance'], 0, ',', '.') }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="7" class="text-center" style="padding: 15px; color: #94a3b8;">
                    Tidak ada transaksi dalam periode ini.
                </td>
            </tr>
            @endforelse
            <tr style="background-color: #f1f5f9; font-weight: bold; border-top: 2px solid #0F5A5E;">
                <td colspan="4" class="text-right">TOTAL MUTASI & SALDO AKHIR:</td>
                <td class="text-right">Rp {{ number_format($statement['total_debit'], 0, ',', '.') }}</td>
                <td class="text-right" style="color: #15803d;">Rp {{ number_format($statement['total_credit'], 0, ',', '.') }}</td>
                <td class="text-right" style="color: #0F5A5E; font-size: 11px;">Rp {{ number_format($statement['closing_balance'], 0, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>
</body>
</html>
