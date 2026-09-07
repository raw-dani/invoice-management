<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoice->invoice_number }}</title>
    <style>
        @page { margin: 30px 40px; }
        * { box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #374151;
            margin: 0;
            padding: 0;
            line-height: 1.35;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 18px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        .company-name {
            font-size: 14px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 4px 0;
        }
        .company-detail {
            color: #6b7280;
            font-size: 9px;
            line-height: 1.5;
        }
        .doc-title { text-align: right; }
        .doc-title h1 {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
            margin: 0;
            text-transform: uppercase;
        }
        .doc-number {
            font-size: 11px;
            font-weight: 600;
            color: #111827;
            margin-top: 2px;
        }
        .status-badge {
            display: inline-block;
            margin-top: 4px;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            background: #f3f4f6;
            color: #374151;
        }

        .bill-to {
            background: #f9fafb;
            padding: 10px 12px;
            border-radius: 4px;
            margin-bottom: 16px;
        }
        .bill-to-label {
            font-size: 8px;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 1px;
            margin-bottom: 3px;
            font-weight: 700;
        }
        .bill-to-name { font-size: 11px; font-weight: 600; color: #111827; }
        .bill-to-detail { font-size: 9px; color: #6b7280; margin-top: 1px; line-height: 1.4; }

        .meta-grid {
            width: 100%;
            margin-bottom: 16px;
            border-collapse: collapse;
        }
        .meta-grid td {
            padding: 6px 10px;
            background: #f9fafb;
            vertical-align: top;
            width: 25%;
            border: 1px solid #f3f4f6;
        }
        .meta-label {
            font-size: 8px;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 0.8px;
            margin-bottom: 2px;
            font-weight: 600;
        }
        .meta-value { font-size: 10px; color: #111827; font-weight: 600; }

        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 14px;
        }
        table.items thead th {
            background: #f3f4f6;
            color: #374151;
            padding: 6px 8px;
            text-align: left;
            font-size: 9px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        table.items thead th.text-right { text-align: right; }
        table.items tbody td {
            padding: 6px 8px;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: top;
        }
        .text-right { text-align: right; }
        .item-desc { font-weight: 500; color: #111827; }

        .totals {
            margin-left: auto;
            width: 240px;
            margin-bottom: 16px;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 10px;
        }
        .totals-row.muted { color: #6b7280; }
        .totals-row.grand {
            border-top: 1px solid #111827;
            margin-top: 4px;
            padding-top: 6px;
            font-size: 12px;
            font-weight: 700;
            color: #111827;
        }
        .totals-row.balance { color: #dc2626; font-weight: 700; padding-top: 4px; }

        .notes-block {
            background: #f9fafb;
            padding: 8px 10px;
            border-radius: 3px;
            margin-bottom: 10px;
        }
        .notes-title {
            font-size: 8px;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 0.8px;
            margin-bottom: 3px;
            font-weight: 600;
        }
        .notes-body { font-size: 9px; color: #374151; white-space: pre-wrap; }

        .footer {
            position: fixed;
            bottom: 12px;
            left: 0;
            right: 0;
            text-align: center;
            color: #9ca3af;
            font-size: 8px;
        }
    </style>
</head>
<body>
    @php
        $currency = $invoice->currency;
    @endphp

    <div class="header">
        <div class="company-info">
            @if (!empty($company->logo))
                <img src="{{ public_path('storage/' . $company->logo) }}" class="company-logo" alt="{{ $company->name }}" style="max-height: 36px; max-width: 140px; margin-bottom: 4px;">
            @endif
            <div class="company-name">{{ $company->name ?? 'Your Company' }}</div>
            <div class="company-detail">
                @if ($company->address) {{ $company->address }} @if ($company->city || $company->province || $company->country), {{ trim(implode(', ', array_filter([$company->city, $company->province, $company->country]))) }} @endif<br> @endif
                @if ($company->phone) Tel: {{ $company->phone }} @endif
                @if ($company->email) · {{ $company->email }} @endif
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
            @if ($invoice->customer?->contact_name) {{ $invoice->customer->contact_name }} · @endif
            @if ($invoice->customer?->email) {{ $invoice->customer->email }} @endif
            @if ($invoice->customer?->phone) · {{ $invoice->customer->phone }} @endif
        </div>
    </div>

    <table class="meta-grid">
        <tr>
            <td>
                <div class="meta-label">Date</div>
                <div class="meta-value">{{ \Carbon\Carbon::parse($invoice->invoice_date)->format('d M Y') }}</div>
            </td>
            <td>
                <div class="meta-label">Due</div>
                <div class="meta-value">{{ \Carbon\Carbon::parse($invoice->due_date)->format('d M Y') }}</div>
            </td>
            <td>
                <div class="meta-label">Currency</div>
                <div class="meta-value">{{ $invoice->currency }}</div>
            </td>
            <td>
                <div class="meta-label">Balance</div>
                <div class="meta-value">{{ number_format($invoice->balance, 0, ',', '.') }} {{ $invoice->currency }}</div>
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
            <tr>
                <th style="width: 50%">Description</th>
                <th class="text-right" style="width: 12%">Qty</th>
                <th class="text-right" style="width: 20%">Price</th>
                <th class="text-right" style="width: 18%">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($invoice->items as $item)
                <tr>
                    <td>
                        <div class="item-desc">{{ $item->description }}</div>
                        @if ($item->discount > 0)
                            <div style="font-size: 8px; color: #6b7280; margin-top: 1px;">
                                Disc: {{ number_format($item->discount, 0, ',', '.') }}
                            </div>
                        @endif
                    </td>
                    <td class="text-right">{{ rtrim(rtrim(number_format($item->quantity, 2, ',', '.'), '0'), ',') }}</td>
                    <td class="text-right">{{ number_format($item->unit_price, 0, ',', '.') }}</td>
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
                <span>Balance</span>
                <span>{{ number_format($invoice->balance, 0, ',', '.') }} {{ $currency }}</span>
            </div>
        @endif
    </div>

    @if (!empty($invoice->notes) || !empty($invoice->terms))
        <div style="border-top: 1px solid #f3f4f6; padding-top: 10px;">
            @if (!empty($invoice->notes))
                <div class="notes-block">
                    <div class="notes-title">Notes</div>
                    <div class="notes-body">{{ $invoice->notes }}</div>
                </div>
            @endif
            @if (!empty($invoice->terms))
                <div class="notes-block">
                    <div class="notes-title">Terms</div>
                    <div class="notes-body">{{ $invoice->terms }}</div>
                </div>
            @endif
        </div>
    @endif
</body>
</html>
