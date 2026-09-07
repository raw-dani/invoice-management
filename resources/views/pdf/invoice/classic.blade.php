<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        @page { margin: 50px 60px; }
        * { box-sizing: border-box; }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12px;
            color: #000;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .company-name {
            font-size: 22px;
            font-weight: 700;
            color: #000;
            margin: 0 0 6px 0;
            text-transform: uppercase;
            letter-spacing: 3px;
        }
        .company-detail {
            color: #333;
            font-size: 10px;
            line-height: 1.7;
        }
        .doc-title {
            margin-top: 18px;
        }
        .doc-title h1 {
            font-size: 32px;
            font-weight: 700;
            color: #000;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 6px;
        }
        .doc-number {
            font-size: 14px;
            font-weight: 700;
            color: #000;
            margin-top: 6px;
        }
        .status-badge {
            display: inline-block;
            margin-top: 10px;
            padding: 5px 14px;
            border: 1px solid #000;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .bill-to {
            border: 1px solid #000;
            padding: 18px 20px;
            margin-bottom: 30px;
        }
        .bill-to-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #000;
            letter-spacing: 2px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .bill-to-name { font-size: 14px; font-weight: 700; color: #000; }
        .bill-to-detail { font-size: 11px; color: #333; margin-top: 4px; line-height: 1.7; }

        .meta-grid {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
        }
        .meta-grid td {
            padding: 14px 18px;
            border: 1px solid #000;
            vertical-align: top;
            width: 25%;
        }
        .meta-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #000;
            letter-spacing: 1.5px;
            margin-bottom: 6px;
            font-weight: 700;
        }
        .meta-value { font-size: 12px; color: #000; font-weight: 700; }

        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 28px;
        }
        table.items thead th {
            background: #000;
            color: #fff;
            padding: 12px 14px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 700;
        }
        table.items thead th.text-right { text-align: right; }
        table.items tbody td {
            padding: 12px 14px;
            border-bottom: 1px solid #000;
            vertical-align: top;
        }
        table.items tbody tr:nth-child(even) td { background: #f5f5f5; }
        .text-right { text-align: right; }
        .item-desc { font-weight: 700; color: #000; }

        .totals {
            margin-left: auto;
            width: 320px;
            margin-bottom: 30px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 12px;
            border-bottom: 1px solid #e5e5e5;
        }
        .totals-row.muted { color: #333; }
        .totals-row.grand {
            border-top: 2px solid #000;
            border-bottom: none;
            margin-top: 10px;
            padding-top: 14px;
            font-size: 18px;
            font-weight: 700;
            color: #000;
        }
        .totals-row.balance { color: #000; font-weight: 700; padding-top: 10px; }

        .notes-block {
            border: 1px solid #000;
            padding: 16px 18px;
            margin-bottom: 18px;
        }
        .notes-title {
            font-size: 9px;
            text-transform: uppercase;
            color: #000;
            letter-spacing: 1.5px;
            margin-bottom: 8px;
            font-weight: 700;
        }
        .notes-body { font-size: 11px; color: #333; white-space: pre-wrap; }

        .footer {
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            text-align: center;
            color: #666;
            font-size: 9px;
            border-top: 1px solid #000;
            padding-top: 12px;
        }
    </style>
</head>
<body>
    @php
        $currency = $invoice->currency;
    @endphp

    <div class="header">
        <div class="company-info" style="text-align: left; display: inline-block;">
            @if (!empty($company->logo))
                <img src="{{ public_path('storage/' . $company->logo) }}" class="company-logo" alt="{{ $company->name }}" style="max-height: 44px; max-width: 150px; margin-bottom: 8px;">
            @endif
            <div class="company-name">{{ $company->name ?? 'Your Company' }}</div>
            <div class="company-detail">
                @if ($company->address) {{ $company->address }}<br> @endif
                @if ($company->city || $company->province || $company->country)
                    {{ trim(implode(', ', array_filter([$company->city, $company->province, $company->country]))) }}<br>
                @endif
                @if ($company->phone) Phone: {{ $company->phone }}<br> @endif
                @if ($company->email) Email: {{ $company->email }}<br> @endif
                @if ($company->website) Web: {{ $company->website }}<br> @endif
                @if ($company->tax_number) Tax ID: {{ $company->tax_number }} @endif
            </div>
        </div>
        <div class="doc-title">
            <h1>Invoice</h1>
            <div class="doc-number">#{{ $invoice->invoice_number }}</div>
            <div class="status-badge">{{ str_replace('_', ' ', ucfirst($invoice->status)) }}</div>
        </div>
    </div>

    <div class="bill-to">
        <div class="bill-to-label">Bill To</div>
        <div class="bill-to-name">{{ $invoice->customer->company_name ?? '-' }}</div>
        <div class="bill-to-detail">
            @if ($invoice->customer?->contact_name) {{ $invoice->customer->contact_name }}<br> @endif
            @if ($invoice->customer?->address) {{ $invoice->customer->address }}<br> @endif
            @if ($invoice->customer?->city || $invoice->customer?->province)
                {{ trim(implode(', ', array_filter([$invoice->customer->city ?? null, $invoice->customer->province ?? null]))) }}<br>
            @endif
            @if ($invoice->customer?->email) {{ $invoice->customer->email }}<br> @endif
            @if ($invoice->customer?->phone) {{ $invoice->customer->phone }}<br> @endif
            @if ($invoice->customer?->tax_number) Tax ID: {{ $invoice->customer->tax_number }} @endif
        </div>
    </div>

    <table class="meta-grid">
        <tr>
            <td>
                <div class="meta-label">Invoice Date</div>
                <div class="meta-value">{{ \Carbon\Carbon::parse($invoice->invoice_date)->format('d M Y') }}</div>
            </td>
            <td>
                <div class="meta-label">Due Date</div>
                <div class="meta-value">{{ \Carbon\Carbon::parse($invoice->due_date)->format('d M Y') }}</div>
            </td>
            <td>
                <div class="meta-label">Currency</div>
                <div class="meta-value">{{ $invoice->currency }}</div>
            </td>
            <td>
                <div class="meta-label">Amount Due</div>
                <div class="meta-value">{{ number_format($invoice->balance, 0, ',', '.') }} {{ $invoice->currency }}</div>
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th style="width: 45%">Description</th>
                <th class="text-right" style="width: 10%">Qty</th>
                <th class="text-right" style="width: 18%">Unit Price</th>
                <th class="text-right" style="width: 12%">Tax</th>
                <th class="text-right" style="width: 15%">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($invoice->items as $item)
                <tr>
                    <td>
                        <div class="item-desc">{{ $item->description }}</div>
                        @if ($item->discount > 0)
                            <div style="font-size: 9px; color: #666; margin-top: 2px;">
                                Discount: {{ number_format($item->discount, 0, ',', '.') }}
                            </div>
                        @endif
                    </td>
                    <td class="text-right">{{ rtrim(rtrim(number_format($item->quantity, 2, ',', '.'), '0'), ',') }}</td>
                    <td class="text-right">{{ number_format($item->unit_price, 0, ',', '.') }}</td>
                    <td class="text-right">{{ rtrim(rtrim(number_format($item->tax_rate, 2, ',', '.'), '0'), ',') }}%</td>
                    <td class="text-right">{{ number_format($item->total, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <div class="totals-row muted">
            <span>Subtotal</span>
            <span>{{ number_format($invoice->subtotal, 0, ',', '.') }} {{ $currency }}</span>
        </div>
        @if ($invoice->discount > 0)
            @php
                $invoiceDiscount = $invoice->discount_type == 1
                    ? $invoice->subtotal * ($invoice->discount / 100)
                    : $invoice->discount;
            @endphp
            <div class="totals-row muted">
                <span>Discount{{ $invoice->discount_type == 1 ? ' (' . rtrim(rtrim(number_format($invoice->discount, 2, ',', '.'), '0'), ',') . '%)' : '' }}</span>
                <span>-{{ number_format($invoiceDiscount, 0, ',', '.') }} {{ $currency }}</span>
            </div>
        @endif
        @if ($invoice->tax_amount > 0)
            <div class="totals-row muted">
                <span>Tax ({{ rtrim(rtrim(number_format($invoice->tax_rate, 2, ',', '.'), '0'), ',') }}%)</span>
                <span>{{ number_format($invoice->tax_amount, 0, ',', '.') }} {{ $currency }}</span>
            </div>
        @endif
        <div class="totals-row grand">
            <span>Total</span>
            <span>{{ number_format($invoice->total, 0, ',', '.') }} {{ $currency }}</span>
        </div>
        @if ($invoice->paid_amount > 0)
            <div class="totals-row">
                <span>Paid</span>
                <span>{{ number_format($invoice->paid_amount, 0, ',', '.') }} {{ $currency }}</span>
            </div>
            <div class="totals-row balance">
                <span>Balance Due</span>
                <span>{{ number_format($invoice->balance, 0, ',', '.') }} {{ $currency }}</span>
            </div>
        @endif
    </div>

    @if (!empty($invoice->notes))
        <div class="notes-block">
            <div class="notes-title">Notes</div>
            <div class="notes-body">{{ $invoice->notes }}</div>
        </div>
    @endif

    @if (!empty($invoice->terms))
        <div class="notes-block">
            <div class="notes-title">Terms &amp; Conditions</div>
            <div class="notes-body">{{ $invoice->terms }}</div>
        </div>
    @endif

    <div class="footer">
        {{ $company->name ?? 'Your Company' }} &middot; Generated on {{ now()->format('d M Y H:i') }}
    </div>
</body>
</html>
