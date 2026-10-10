@if (($invoice->status ?? null) === 'paid' && ($company->show_paid_watermark ?? true))
<style>
    .watermark-paid-stamp {
        position: absolute;
        top: 30px;
        right: 180px;
        border: 3px solid #059669;
        color: #059669;
        font-family: 'Helvetica', 'Arial', sans-serif;
        font-size: 20px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 2px;
        padding: 5px 14px;
        border-radius: 6px;
        transform: rotate(-10deg);
        opacity: 0.85;
        z-index: 9999;
    }
</style>
<div class="watermark-paid-stamp">LUNAS / PAID</div>
@endif
