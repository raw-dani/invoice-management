<?php
/** @var \App\Models\Company $company */
/** @var string $type (Invoice|Quote) */
/** @var object $document */
/** @var string $status */
?>
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
        <h1>{{ $type }}</h1>
        @if (isset($document) && method_exists($document, 'getAttribute'))
            @php
                $numberField = strtolower($type) . '_number';
                $number = $document->{$numberField} ?? null;
            @endphp
            @if ($number)
                <div class="doc-number">#{{ $number }}</div>
            @endif
        @endif
        @if (!empty($status))
            <div class="status-badge status-{{ $status }}">{{ str_replace('_', ' ', ucfirst($status)) }}</div>
        @endif
    </div>
</div>
