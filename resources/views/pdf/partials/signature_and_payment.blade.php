{{-- Payment & Sign-off Table --}}
<table style="width: 100%; margin-top: 24px; border-collapse: collapse; page-break-inside: avoid;">
    <tr>
        {{-- Left Column: Bank details & QRIS --}}
        <td style="width: 58%; vertical-align: top; padding-right: 20px;">
            @if (!empty($bank['account_number']) || (!empty($company->qris) && ($company->show_qris_on_pdf ?? true)))
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 14px;">
                    <div style="font-weight: 700; font-size: 10.5px; color: #374151; margin-bottom: 5px; text-transform: uppercase;">
                        Informasi Pembayaran
                    </div>
                    @if (!empty($bank['bank_name']) || !empty($bank['account_number']))
                        <div style="font-size: 10.5px; color: #4b5563; line-height: 1.5;">
                            Bank: <strong>{{ $bank['bank_name'] ?? 'Transfer Bank' }}</strong><br>
                            No. Rekening: <strong>{{ $bank['account_number'] ?? '-' }}</strong><br>
                            Atas Nama: <strong>{{ $bank['account_name'] ?? ($company->name ?? '-') }}</strong>
                        </div>
                    @endif

                    @if (!empty($company->qris) && ($company->show_qris_on_pdf ?? true))
                        @php $qrisUri = $company->qris_data_uri; @endphp
                        @if ($qrisUri)
                            <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #d1d5db;">
                                <div style="font-size: 9.5px; font-weight: 700; color: #4f46e5; margin-bottom: 3px;">
                                    SCAN QRIS PEMBAYARAN:
                                </div>
                                <img src="{{ $qrisUri }}" alt="QRIS" style="max-height: 90px; max-width: 90px; border: 1px solid #e5e7eb; border-radius: 4px; padding: 2px; background: #fff;">
                                <div style="font-size: 8.5px; color: #6b7280; margin-top: 2px;">
                                    Mendukung GoPay, OVO, Dana, ShopeePay, BCA Mobile, dll.
                                </div>
                            </div>
                        @endif
                    @endif
                </div>
            @endif
        </td>

        {{-- Right Column: Authorized Signature & Company Stamp --}}
        <td style="width: 42%; vertical-align: top; text-align: center;">
            @if (($company->show_signature_on_pdf ?? true) || ($company->show_stamp_on_pdf ?? true) || !empty($company->authorized_signer_name))
                <div style="display: inline-block; min-width: 170px;">
                    <div style="font-size: 10px; color: #4b5563; margin-bottom: 3px;">
                        {{ $company->city ?? 'Indonesia' }}, {{ \Carbon\Carbon::parse($invoice->invoice_date)->format('d M Y') }}
                    </div>
                    <div style="font-size: 10.5px; font-weight: 700; color: #111827; margin-bottom: 4px;">
                        {{ $company->name ?? 'Perusahaan' }}
                    </div>

                    {{-- Signature & Stamp Container --}}
                    <div style="position: relative; height: 70px; margin: 0 auto; width: 160px;">
                        @php
                            $stampUri = ($company->show_stamp_on_pdf ?? true) ? $company->stamp_data_uri : null;
                            $sigUri = ($company->show_signature_on_pdf ?? true) ? $company->signature_data_uri : null;
                        @endphp

                        @if ($stampUri)
                            <img src="{{ $stampUri }}" alt="Stamp" style="position: absolute; left: 5px; top: 0px; max-height: 70px; max-width: 80px; opacity: 0.85; z-index: 1;">
                        @endif

                        @if ($sigUri)
                            <img src="{{ $sigUri }}" alt="Signature" style="position: absolute; right: 5px; top: 8px; max-height: 55px; max-width: 120px; z-index: 2;">
                        @endif
                    </div>

                    {{-- Signer Name & Title --}}
                    <div style="border-top: 1px solid #111827; padding-top: 3px; margin-top: 3px;">
                        <div style="font-size: 10.5px; font-weight: 700; color: #111827;">
                            {{ $company->authorized_signer_name ?? 'Penanggung Jawab' }}
                        </div>
                        <div style="font-size: 9.5px; color: #6b7280;">
                            {{ $company->authorized_signer_title ?? 'Authorized Signature' }}
                        </div>
                    </div>
                </div>
            @endif
        </td>
    </tr>
</table>
