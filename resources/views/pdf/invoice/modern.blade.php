<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
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
        .doc-number {
            font-size: 13px;
            font-weight: 600;
            color: #111827;
            margin-top: 4px;
        }
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
        .status-draft          { background: #f3f4f6; color: #374151; }
        .status-sent           { background: #dbeafe; color: #1e40af; }
        .status-partially_paid { background: #fef3c7; color: #92400e; }
        .status-paid           { background: #d1fae5; color: #065f46; }
        .status-overdue        { background: #fee2e2; color: #991b1b; }
        .status-cancelled,
        .status-void           { background: #f3f4f6; color: #6b7280; }

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
            width: 25%;
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
        .totals-row.balance { color: #dc2626; font-weight: 700; padding-top: 6px; }

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
    @php
        $currency = $invoice->currency;
    @endphp

    {{-- Header --}}
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
            <h1>Invoice</h1>
            <div class="doc-number">#{{ $invoice->invoice_number }}</div>
            <div class="status-badge status-{{ $invoice->status }}">{{ str_replace('_', ' ', ucfirst($invoice->status)) }}</div>
        </div>
    </div>

    {{-- Bill To --}}
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

    {{-- Meta --}}
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

    {{-- Items --}}
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
            @foreach ($invoice->items as $item)
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

    {{-- Totals --}}
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

    {{-- Notes --}}
    @if (!empty($invoice->notes))
        <div class="notes-block">
            <div class="notes-title">Notes</div>
            <div class="notes-body">{{ $invoice->notes }}</div>
        </div>
    @endif

    {{-- Terms --}}
    @if (!empty($invoice->terms))
        <div class="notes-block">
            <div class="notes-title">Terms &amp; Conditions</div>
            <div class="notes-body">{{ $invoice->terms }}</div>
        </div>
    @endif

    {{-- Footer --}}
    <div class="footer">
        {{ $company->name ?? 'Your Company' }} &middot; Generated on {{ now()->format('d M Y H:i') }}
    </div>
</body>
</html>
