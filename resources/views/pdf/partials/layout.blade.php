<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $type ?? 'Document' }}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 12px;
            color: #1f2937;
            margin: 0;
            padding: 32px;
            line-height: 1.4;
        }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
        .company-info { max-width: 55%; }
        .company-logo { max-height: 56px; max-width: 180px; margin-bottom: 8px; }
        .company-name { font-size: 18px; font-weight: 700; color: #4f46e5; margin: 0 0 6px 0; }
        .company-detail { color: #6b7280; font-size: 10.5px; line-height: 1.5; }
        .doc-title {
            text-align: right;
        }
        .doc-title h1 {
            font-size: 24px;
            font-weight: 300;
            letter-spacing: 2px;
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
            margin-top: 6px;
            padding: 3px 10px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .status-draft             { background: #f3f4f6; color: #374151; }
        .status-sent              { background: #dbeafe; color: #1e40af; }
        .status-partially_paid    { background: #fef3c7; color: #92400e; }
        .status-paid              { background: #d1fae5; color: #065f46; }
        .status-overdue           { background: #fee2e2; color: #991b1b; }
        .status-cancelled,
        .status-void              { background: #f3f4f6; color: #6b7280; }
        .status-accepted          { background: #d1fae5; color: #065f46; }
        .status-rejected          { background: #fee2e2; color: #991b1b; }
        .status-expired           { background: #fef3c7; color: #92400e; }
        .status-converted         { background: #e0e7ff; color: #3730a3; }
        .status-viewed            { background: #ede9fe; color: #5b21b6; }

        .meta-grid {
            display: table;
            width: 100%;
            margin-bottom: 24px;
        }
        .meta-row { display: table-row; }
        .meta-cell {
            display: table-cell;
            width: 50%;
            padding: 8px 12px;
            background: #f9fafb;
            vertical-align: top;
        }
        .meta-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #6b7280;
            letter-spacing: 1px;
            margin-bottom: 4px;
            font-weight: 600;
        }
        .meta-value { font-size: 12px; color: #111827; font-weight: 500; }

        table.items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }
        table.items thead th {
            background: #4f46e5;
            color: #ffffff;
            padding: 10px 8px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
        }
        table.items thead th.text-right { text-align: right; }
        table.items tbody td {
            padding: 10px 8px;
            border-bottom: 1px solid #f3f4f6;
            vertical-align: top;
        }
        table.items tbody tr:nth-child(even) td { background: #fafafa; }
        .text-right { text-align: right; }
        .muted { color: #9ca3af; }

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
            font-size: 14px;
            font-weight: 700;
            color: #4f46e5;
        }
        .totals-row.balance { color: #dc2626; font-weight: 600; }

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
            font-weight: 600;
        }
        .notes-body { font-size: 11px; color: #374151; white-space: pre-wrap; }

        .footer {
            margin-top: 32px;
            padding-top: 14px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #9ca3af;
            font-size: 10px;
        }
    </style>
</head>
<body>
    {{ $slot }}
</body>
</html>
