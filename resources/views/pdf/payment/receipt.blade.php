<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Receipt {{ $payment->payment_number }}</title>
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
            letter-spacing: 3px;
            color: #10b981;
            margin: 0;
            text-transform: uppercase;
        }
        .doc-number { font-size: 13px; font-weight: 600; color: #111827; margin-top: 4px; }

        .received-block {
            background: #ecfdf5;
            padding: 20px;
            border-radius: 6px;
            text-align: center;
            margin-bottom: 24px;
            border: 1px solid #a7f3d0;
        }
        .received-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #047857;
            letter-spacing: 2px;
            margin-bottom: 6px;
            font-weight: 700;
        }
        .received-amount {
            font-size: 32px;
            font-weight: 700;
            color: #065f46;
        }
        .received-amount-currency {
            font-size: 14px;
            color: #047857;
            margin-left: 4px;
            font-weight: 500;
        }

        .meta-grid {
            width: 100%;
            margin-bottom: 24px;
            border-collapse: collapse;
        }
        .meta-grid td {
            padding: 10px 14px;
            background: #f9fafb;
            vertical-align: top;
            width: 50%;
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

        .related {
            background: #f9fafb;
            padding: 14px 16px;
            border-radius: 6px;
            margin-bottom: 24px;
        }
        .related-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 1.5px;
            margin-bottom: 6px;
            font-weight: 700;
        }
        .related-title { font-size: 13px; font-weight: 600; color: #111827; }
        .related-detail { font-size: 11px; color: #4b5563; margin-top: 4px; line-height: 1.5; }

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

        .signature {
            margin-top: 36px;
            text-align: center;
            color: #9ca3af;
            font-size: 10px;
        }

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
            </div>
        </div>
        <div class="doc-title">
            <h1>Payment Receipt</h1>
            <div class="doc-number">#{{ $payment->payment_number }}</div>
        </div>
    </div>

    <div class="received-block">
        <div class="received-label">Amount Received</div>
        <div class="received-amount">
            {{ number_format($payment->amount, 2, ',', '.') }}
            <span class="received-amount-currency">{{ $payment->currency }}</span>
        </div>
    </div>

    <table class="meta-grid">
        <tr>
            <td>
                <div class="meta-label">Payment Date</div>
                <div class="meta-value">{{ \Carbon\Carbon::parse($payment->payment_date)->format('d M Y') }}</div>
            </td>
            <td>
                <div class="meta-label">Payment Method</div>
                <div class="meta-value">{{ ucwords(str_replace('_', ' ', $payment->payment_method)) }}</div>
            </td>
        </tr>
        <tr>
            <td>
                <div class="meta-label">Reference</div>
                <div class="meta-value">{{ $payment->reference ?? '-' }}</div>
            </td>
            <td>
                <div class="meta-label">Received From</div>
                <div class="meta-value">{{ $customer->company_name ?? '-' }}</div>
            </td>
        </tr>
    </table>

    @if ($invoice)
        <div class="related">
            <div class="related-label">For Invoice</div>
            <div class="related-title">#{{ $invoice->invoice_number }}</div>
            <div class="related-detail">
                Invoice Date: {{ \Carbon\Carbon::parse($invoice->invoice_date)->format('d M Y') }}<br>
                Total: {{ number_format($invoice->total, 2, ',', '.') }} {{ $invoice->currency }}<br>
                Paid: {{ number_format($invoice->paid_amount, 2, ',', '.') }} {{ $invoice->currency }}<br>
                Balance: {{ number_format($invoice->balance, 2, ',', '.') }} {{ $invoice->currency }}
            </div>
        </div>
    @endif

    @if (!empty($payment->notes))
        <div class="notes-block">
            <div class="notes-title">Notes</div>
            <div class="notes-body">{{ $payment->notes }}</div>
        </div>
    @endif

    <div class="signature">
        Thank you for your payment.
    </div>

    <div class="footer">
        {{ $company->name ?? 'Your Company' }} &middot; Generated on {{ now()->format('d M Y H:i') }}
    </div>
</body>
</html>
