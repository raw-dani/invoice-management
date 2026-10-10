<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Report Summary - {{ ucfirst($type) }}</title>
    <style>
        @page { margin: 20mm 15mm; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 11px;
            color: #1f2937;
            line-height: 1.4;
        }
        .header {
            margin-bottom: 25px;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 12px;
        }
        .header table { width: 100%; }
        .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #4f46e5;
        }
        .report-title {
            text-align: right;
            font-size: 18px;
            font-weight: bold;
            color: #111827;
            text-transform: uppercase;
        }
        .report-meta {
            text-align: right;
            font-size: 10px;
            color: #6b7280;
        }
        .section-title {
            font-size: 13px;
            font-weight: bold;
            margin: 15px 0 8px 0;
            color: #374151;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table.data-table th {
            background-color: #f3f4f6;
            color: #374151;
            font-weight: bold;
            text-align: left;
            padding: 8px 10px;
            border: 1px solid #e5e7eb;
            font-size: 10px;
            text-transform: uppercase;
        }
        table.data-table td {
            padding: 8px 10px;
            border: 1px solid #e5e7eb;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .footer {
            margin-top: 30px;
            font-size: 9px;
            color: #9ca3af;
            text-align: center;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <table>
            <tr>
                <td style="vertical-align: top;">
                    <div class="company-name">{{ $company->name ?? 'Company Report' }}</div>
                    <div style="color: #6b7280; font-size: 10px; margin-top: 4px;">
                        {{ $company->address ?? '' }}<br>
                        {{ $company->email ?? '' }} | {{ $company->phone ?? '' }}
                    </div>
                </td>
                <td style="vertical-align: top;" class="report-meta">
                    <div class="report-title">{{ ucfirst($type) }} Report</div>
                    <div>Period: <strong>{{ $from }}</strong> to <strong>{{ $to }}</strong></div>
                    <div>Generated: {{ now()->format('d M Y, H:i') }}</div>
                </td>
            </tr>
        </table>
    </div>

    @if ($type === 'revenue')
        <table class="data-table">
            <thead>
                <tr>
                    <th>Category / Period</th>
                    @if(isset($rows[0]['quantity']))
                        <th class="text-right">Quantity</th>
                    @endif
                    <th class="text-right">Revenue (IDR)</th>
                </tr>
            </thead>
            <tbody>
                @php $totalRevenue = 0; @endphp
                @forelse ($rows as $row)
                    @php $totalRevenue += (float) ($row['revenue'] ?? 0); @endphp
                    <tr>
                        <td>{{ $row['label'] ?? '-' }}</td>
                        @if(isset($rows[0]['quantity']))
                            <td class="text-right">{{ number_format($row['quantity'] ?? 0) }}</td>
                        @endif
                        <td class="text-right">{{ number_format($row['revenue'] ?? 0, 2) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="3" class="text-center" style="color: #9ca3af;">No revenue data in this period.</td>
                    </tr>
                @endforelse
            </tbody>
            <tfoot>
                <tr style="background-color: #f9fafb; font-weight: bold;">
                    <td>Total</td>
                    @if(isset($rows[0]['quantity']))
                        <td></td>
                    @endif
                    <td class="text-right">{{ number_format($totalRevenue, 2) }}</td>
                </tr>
            </tfoot>
        </table>
    @elseif ($type === 'invoices')
        <table class="data-table">
            <thead>
                <tr>
                    <th>Invoice Status</th>
                    <th class="text-center">Count</th>
                    <th class="text-right">Total (IDR)</th>
                    <th class="text-right">Outstanding Balance (IDR)</th>
                </tr>
            </thead>
            <tbody>
                @php $totalCount = 0; $sumTotal = 0; $sumBalance = 0; @endphp
                @forelse ($rows as $row)
                    @php
                        $totalCount += (int) $row['count'];
                        $sumTotal += (float) $row['total'];
                        $sumBalance += (float) $row['balance'];
                    @endphp
                    <tr>
                        <td>{{ ucfirst(str_replace('_', ' ', $row['status'])) }}</td>
                        <td class="text-center">{{ number_format($row['count']) }}</td>
                        <td class="text-right">{{ number_format($row['total'], 2) }}</td>
                        <td class="text-right">{{ number_format($row['balance'], 2) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" class="text-center" style="color: #9ca3af;">No invoices in this period.</td>
                    </tr>
                @endforelse
            </tbody>
            <tfoot>
                <tr style="background-color: #f9fafb; font-weight: bold;">
                    <td>Total</td>
                    <td class="text-center">{{ number_format($totalCount) }}</td>
                    <td class="text-right">{{ number_format($sumTotal, 2) }}</td>
                    <td class="text-right">{{ number_format($sumBalance, 2) }}</td>
                </tr>
            </tfoot>
        </table>
    @elseif ($type === 'customers')
        <div class="section-title">Customer Acquisition Status</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Status</th>
                    <th class="text-center">Total Customers</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($statusRows as $row)
                    <tr>
                        <td>{{ ucfirst($row['status']) }}</td>
                        <td class="text-center">{{ number_format($row['count']) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="section-title">Top Outstanding Customer Balances</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Customer Name</th>
                    <th class="text-right">Outstanding Balance (IDR)</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($balances as $row)
                    <tr>
                        <td>{{ $row['customer'] }}</td>
                        <td class="text-right">{{ number_format($row['balance'], 2) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="2" class="text-center" style="color: #9ca3af;">No outstanding balances.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    @elseif ($type === 'subscriptions')
        <div class="section-title">Subscription Status Overview</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Active</th>
                    <th>Paused</th>
                    <th>Cancelled</th>
                    <th class="text-right">Monthly Recurring Revenue (MRR)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{ $data['active'] ?? 0 }}</td>
                    <td>{{ $data['paused'] ?? 0 }}</td>
                    <td>{{ $data['cancelled'] ?? 0 }}</td>
                    <td class="text-right">{{ number_format($data['mrr'] ?? 0, 2) }}</td>
                </tr>
            </tbody>
        </table>

        <div class="section-title">Upcoming Billings</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Subscription Number</th>
                    <th>Billing Cycle</th>
                    <th class="text-center">Next Billing Date</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($data['upcoming'] ?? [] as $row)
                    <tr>
                        <td>{{ $row['subscription_number'] }}</td>
                        <td>{{ ucfirst($row['billing_cycle']) }}</td>
                        <td class="text-center">{{ $row['next_billing_date'] ?? '-' }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="3" class="text-center" style="color: #9ca3af;">No upcoming billings.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    @endif

    <div class="footer">
        Generated automatically by Invoice Management System &bull; Confidential
    </div>
</body>
</html>
