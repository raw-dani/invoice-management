<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'slug'   => 'invoice',
                'name'   => 'Invoice',
                'subject' => 'Invoice {{invoice.number}} from {{company.name}}',
                'body'   => <<<HTML
<p>Hi {{customer.name}},</p>
<p>Thank you for your business. Please find your invoice <strong>{{invoice.number}}</strong> attached.</p>
<table cellpadding="6" style="border-collapse:collapse;">
  <tr><td>Invoice Date</td><td>: {{invoice.date}}</td></tr>
  <tr><td>Due Date</td><td>: {{invoice.due_date}}</td></tr>
  <tr><td>Amount Due</td><td>: {{invoice.currency}} {{invoice.total}}</td></tr>
</table>
<p>If you have any questions, please reply to this email.</p>
<p>Best regards,<br>{{company.name}}<br>{{company.email}}</p>
HTML,
            ],
            [
                'slug'   => 'quote',
                'name'   => 'Quote',
                'subject' => 'Quote {{quote.number}} from {{company.name}}',
                'body'   => <<<HTML
<p>Hi {{customer.name}},</p>
<p>As requested, please find our quotation <strong>{{quote.number}}</strong> attached.</p>
<table cellpadding="6" style="border-collapse:collapse;">
  <tr><td>Quote Date</td><td>: {{quote.date}}</td></tr>
  <tr><td>Valid Until</td><td>: {{quote.valid_until}}</td></tr>
  <tr><td>Total</td><td>: {{quote.currency}} {{quote.total}}</td></tr>
</table>
<p>To proceed, simply reply to this email and we will issue the corresponding invoice.</p>
<p>Best regards,<br>{{company.name}}<br>{{company.email}}</p>
HTML,
            ],
            [
                'slug'   => 'invoice_paid',
                'name'   => 'Invoice Paid',
                'subject' => 'Payment received for {{invoice.number}}',
                'body'   => <<<HTML
<p>Hi {{customer.name}},</p>
<p>We have received your payment in full for invoice <strong>{{invoice.number}}</strong>. Thank you!</p>
<table cellpadding="6" style="border-collapse:collapse;">
  <tr><td>Invoice</td><td>: {{invoice.number}}</td></tr>
  <tr><td>Amount Paid</td><td>: {{invoice.currency}} {{invoice.paid}}</td></tr>
  <tr><td>Status</td><td>: {{invoice.status}}</td></tr>
</table>
<p>We look forward to working with you again.</p>
<p>Best regards,<br>{{company.name}}<br>{{company.email}}</p>
HTML,
            ],
            [
                'slug'   => 'payment_received',
                'name'   => 'Payment Received',
                'subject' => 'Payment receipt {{payment.number}}',
                'body'   => <<<HTML
<p>Hi {{customer.name}},</p>
<p>Thank you. We have recorded your payment <strong>{{payment.number}}</strong>.</p>
<table cellpadding="6" style="border-collapse:collapse;">
  <tr><td>Amount</td><td>: {{payment.currency}} {{payment.amount}}</td></tr>
  <tr><td>Method</td><td>: {{payment.method}}</td></tr>
  <tr><td>Reference</td><td>: {{payment.reference}}</td></tr>
</table>
<p>Your invoice balance has been updated accordingly.</p>
<p>Best regards,<br>{{company.name}}<br>{{company.email}}</p>
HTML,
            ],
      [
        'slug' => 'invoice_overdue',
        'name' => 'Invoice Overdue',
        'subject' => 'Payment reminder for {{invoice.number}}',
        'body' => '<p>Hi {{customer.name}},</p><p>Invoice <strong>{{invoice.number}}</strong> is overdue. The outstanding balance is {{invoice.currency}} {{invoice.balance}}.</p><p>Please arrange payment at your earliest convenience.</p><p>Best regards,<br>{{company.name}}</p>',
      ],
      [
        'slug' => 'payment_reminder',
        'name' => 'Payment Reminder',
        'subject' => 'Payment reminder for {{invoice.number}}',
        'body' => '<p>Hi {{customer.name}},</p><p>This is a friendly reminder that invoice <strong>{{invoice.number}}</strong> is due on {{invoice.due_date}}.</p><p>Amount due: {{invoice.currency}} {{invoice.balance}}</p><p>Best regards,<br>{{company.name}}</p>',
      ],
      [
        'slug' => 'quote_accepted',
        'name' => 'Quote Accepted',
        'subject' => 'Quote {{quote.number}} was accepted',
        'body' => '<p>Quote <strong>{{quote.number}}</strong> for {{customer.name}} has been accepted.</p><p>Total: {{quote.currency}} {{quote.total}}</p><p>Best regards,<br>{{company.name}}</p>',
      ],
        ];

        foreach ($templates as $t) {
            EmailTemplate::updateOrCreate(
                ['company_id' => null, 'slug' => $t['slug']],
                [
                    'name'    => $t['name'],
                    'subject' => $t['subject'],
                    'body'    => $t['body'],
                    'is_default' => true,
                ]
            );
        }
    }
}
