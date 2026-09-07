<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote {{ $quote->quote_number }}</title>
    <style>
        @page { margin: 40px 50px; }
        * { box-sizing: border-box; }
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            font-size: 11px;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
            line-height: 1.5;
        }
        .header {
            border-bottom: 3px solid #1a1a1a;
            padding-bottom: 18px;
            margin-bottom: 28px;
        }
        .company-name {
            font-size: 20px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0 0 8px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .company-detail {
            color: #4a4a4a;
            font-size: 10px;
            line-height: 1.7;
        }
        .doc-title {
            text-align: right;
            margin-top: -40px;
        }
        .doc-title h1 {
            font-size: 28px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .doc-number {
            font-size: 13px;
            font-weight: 700;
            color: #1a1a1a;
            margin-top: 4px;
        }
        .status-badge {
            display: inline-block;
            margin-top: 8px;
            padding: 4px 12px;
            border: 1px solid #1a1a1a;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .bill-to {
            border: 1px solid #1a1a1a;
            padding: 18px 20px;
            margin-bottom: 28px;
        }
        .bill-to-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #1a1a1a;
            letter-spacing: 2px;
            margin-bottom: 10px;
            font-weight: 700;
        }
        .bill-to-name { font-size: 14px; font-weight: 700; color: #1a1a1a; }
        .bill-to-detail { font-size: 11px; color: #4a4a4a; margin-top: 4px; line-height: 1.7; }

        .meta-grid {
            width: 100%;
            margin-bottom: 28px;
            border-collapse: collapse;
        }
        .meta-grid td {
            padding: 14px 18px;
            border: 1px solid #1a1a1a;
            vertical-align: top;
            width: 33.33%;
        }
        .meta-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #1a1a1a;
            letter-spacing: 1.5px;
            margin-bottom: 6px;
            font-weight: 700;
        }
        .meta-value { font-size: 12px; color: #1a1a1a; font-weight: 700; }

        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 28px;
        }
        table.items thead th {
            background: #1a1a1a;
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
            border-bottom: 1px solid #1a1a1a;
            vertical-align: top;
        }
        table.items tbody tr:nth-child(even) td { background: #f5f5f5; }
        .text-right { text-align: right; }
        .item-desc { font-weight: 700; color: #1a1a1a; }

        .totals {
            margin-left: auto;
            width: 300px;
            margin-bottom: 28px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 12px;
            border-bottom: 1px solid #e5e5e5;
        }
        .totals-row.muted { color: #4a4a4a; }
        .totals-row.grand {
            border-top: 2px solid #1a1a1a;
            border-bottom: none;
            margin-top: 10px;
            padding-top: 14px;
            font-size: 18px;
            font-weight: 700;
            color: #1a1a1a;
        }

        .notes-block {
            border: 1px solid #1a1a1a;
            padding: 16px 18px;
            margin-bottom: 18px;
        }
        .notes-title {
            font-size: 9px;
            text-transform: uppercase;
            color: #1a1a1a;
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
            border-top: 1px solid #1a1a1a;
            padding-top: 12px;
        }
    </style>
</head>
<body>
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
            <h1>Quote</h1>
            <div class="doc-number">#{{ $quote->quote_number }}</div>
            <div class="status-badge">{{ str_replace('_', ' ', ucfirst($quote->status)) }}</div>
        </div>
    </div>

    <div class="bill-to">
        <div class="bill-to-label">Prepared For</div>
        <div class="bill-to-name">{{ $quote->customer->company_name ?? '-' }}</div>
        <div class="bill-to-detail">
            @if ($quote->customer?->contact_name) {{ $quote->customer->contact_name }}<br> @endif
            @if ($quote->customer?->address) {{ $quote->customer->address }}<br> @endif
            @if ($quote->customer?->city || $quote->customer?->province)
                {{ trim(implode(', ', array_filter([$quote->customer->city ?? null, $quote->customer->province ?? null]))) }}<br>
            @endif
            @if ($quote->customer?->email) {{ $quote->customer->email }}<br> @endif
            @if ($quote->customer?->phone) {{ $quote->customer->phone }}<br> @endif
            @if ($quote->customer?->tax_number) Tax ID: {{ $quote->customer->tax_number }} @endif
        </div>
    </div>

    <table class="meta-grid">
        <tr>
            <td>
                <div class="meta-label">Quote Date</div>
                <div class="meta-value">{{ \Carbon\Carbon::parse($quote->quote_date)->format('d M Y') }}</div>
            </td>
            <td>
                <div class="meta-label">Valid Until</div>
                <div class="meta-value">{{ $quote->valid_until ? \Carbon\Carbon::parse($quote->valid_until)->format('d M Y') : '-' }}</div>
            </td>
            <td>
                <div class="meta-label">Currency</div>
                <div class="meta-value">{{ $quote->currency }}</div>
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
            @foreach ($quote->items as $item)
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
            <span>{{ number_format($quote->subtotal, 0, ',', '.') }} {{ $quote->currency }}</span>
        </div>
        @if ($quote->discount > 0)
            @php
                $quoteDiscount = $quote->discount_type == 1
                    ? $quote->subtotal * ($quote->discount / 100)
                    : $quote->discount;
            @endphp
            <div class="totals-row muted">
                <span>Discount{{ $quote->discount_type == 1 ? ' (' . rtrim(rtrim(number_format($quote->discount, 2, ',', '.'), '0'), ',') . '%)' : '' }}</span>
                <span>-{{ number_format($quoteDiscount, 0, ',', '.') }} {{ $quote->currency }}</span>
            </div>
        @endif
        @if ($quote->tax_amount > 0)
            <div class="totals-row muted">
                <span>Tax ({{ rtrim(rtrim(number_format($quote->tax_rate, 2, ',', '.'), '0'), ',') }}%)</span>
                <span>{{ number_format($quote->tax_amount, 0, ',', '.') }} {{ $quote->currency }}</span>
            </div>
        @endif
        <div class="totals-row grand">
            <span>Total</span>
            <span>{{ number_format($quote->total, 0, ',', '.') }} {{ $quote->currency }}</span>
        </div>
    </div>

    @if (!empty($quote->notes))
        <div class="notes-block">
            <div class="notes-title">Notes</div>
            <div class="notes-body">{{ $quote->notes }}</div>
        </div>
    @endif

    @if (!empty($quote->terms))
        <div class="notes-block">
            <div class="notes-title">Terms &amp; Conditions</div>
            <div class="notes-body">{{ $quote->terms }}</div>
        </div>
    @endif

    <div class="footer">
        {{ $company->name ?? 'Your Company' }} &middot; Generated on {{ now()->format('d M Y H:i') }}
    </div>
</body>
</html>
