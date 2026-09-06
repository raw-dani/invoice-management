<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Quote {{ $quote->quote_number }}</title>
    <style>
        @page { margin: 0; }
        * { box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            color: #1f2937;
            margin: 0;
            padding: 36px 40px;
            line-height: 1.4;
        }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
        .company-info { max-width: 55%; }
        .company-logo { max-height: 56px; max-width: 180px; margin-bottom: 8px; }
        .company-name { font-size: 18px; font-weight: 700; color: #4f46e5; margin: 0 0 6px 0; }
        .company-detail { color: #6b7280; font-size: 10.5px; line-height: 1.55; }
        .doc-title { text-align: right; }
        .doc-title h1 {
            font-size: 26px;
            font-weight: 300;
            letter-spacing: 4px;
            color: #4f46e5;
            margin: 0;
            text-transform: uppercase;
        }
        .doc-number { font-size: 13px; font-weight: 600; color: #111827; margin-top: 4px; }
        .status-badge {
            display: inline-block;
            margin-top: 8px;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-draft      { background: #f3f4f6; color: #374151; }
        .status-sent       { background: #dbeafe; color: #1e40af; }
        .status-viewed     { background: #ede9fe; color: #5b21b6; }
        .status-accepted   { background: #d1fae5; color: #065f46; }
        .status-rejected   { background: #fee2e2; color: #991b1b; }
        .status-expired    { background: #fef3c7; color: #92400e; }
        .status-converted  { background: #e0e7ff; color: #3730a3; }

        .bill-to {
            background: #f9fafb;
            padding: 14px 16px;
            border-radius: 6px;
            margin-bottom: 24px;
        }
        .bill-to-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 1.5px;
            margin-bottom: 6px;
            font-weight: 700;
        }
        .bill-to-name { font-size: 13px; font-weight: 600; color: #111827; }
        .bill-to-detail { font-size: 11px; color: #4b5563; margin-top: 2px; line-height: 1.5; }

        .meta-grid {
            width: 100%;
            margin-bottom: 24px;
            border-collapse: collapse;
        }
        .meta-grid td {
            padding: 10px 14px;
            background: #f9fafb;
            vertical-align: top;
            width: 33.33%;
            border: 1px solid #f3f4f6;
        }
        .meta-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 1px;
            margin-bottom: 4px;
            font-weight: 700;
        }
        .meta-value { font-size: 12px; color: #111827; font-weight: 600; }

        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table.items thead th {
            background: #4f46e5;
            color: #ffffff;
            padding: 11px 10px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            font-weight: 700;
        }
        table.items thead th.text-right { text-align: right; }
        table.items tbody td {
            padding: 11px 10px;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: top;
        }
        table.items tbody tr:nth-child(even) td { background: #fafafa; }
        .text-right { text-align: right; }
        .item-desc { font-weight: 500; color: #111827; }

        .totals {
            margin-left: auto;
            width: 280px;
            margin-bottom: 24px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 12px;
        }
        .totals-row.muted { color: #6b7280; }
        .totals-row.grand {
            border-top: 2px solid #4f46e5;
            margin-top: 6px;
            padding-top: 10px;
            font-size: 15px;
            font-weight: 700;
            color: #4f46e5;
        }

        .notes-block {
            background: #f9fafb;
            padding: 12px 14px;
            border-left: 3px solid #4f46e5;
            margin-bottom: 14px;
        }
        .notes-title {
            font-size: 9px;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 1px;
            margin-bottom: 4px;
            font-weight: 700;
        }
        .notes-body { font-size: 11px; color: #374151; white-space: pre-wrap; }

        .footer {
            position: fixed;
            bottom: 18px;
            left: 0;
            right: 0;
            text-align: center;
            color: #9ca3af;
            font-size: 9px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-info">
            @if (!empty($company->logo))
                <img src="{{ public_path('storage/' . $company->logo) }}" class="company-logo" alt="{{ $company->name }}">
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
            <div class="status-badge status-{{ $quote->status }}">{{ str_replace('_', ' ', ucfirst($quote->status)) }}</div>
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
                <th style="width: 50%">Description</th>
                <th class="text-right" style="width: 10%">Qty</th>
                <th class="text-right" style="width: 18%">Unit Price</th>
                <th class="text-right" style="width: 12%">Tax</th>
                <th class="text-right" style="width: 10%">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($quote->items as $item)
                <tr>
                    <td>
                        <div class="item-desc">{{ $item->description }}</div>
                        @if ($item->discount > 0)
                            <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">
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
