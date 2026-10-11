<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EmailController;
use App\Http\Controllers\Api\EmailTemplateController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\QuoteController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\CurrencyController;
use App\Http\Controllers\Api\TaxRateController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\PublicPortalController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\SamlController;
use App\Http\Controllers\Api\LicenseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/health', fn () => response()->json(['status' => 'ok']));

// Public Client Portal (Rate limited to protect against brute force and scraping)
Route::prefix('public')->middleware('throttle:60,1')->group(function () {
    Route::get('invoices/{token}', [PublicPortalController::class, 'showInvoice']);
    Route::post('invoices/{token}/proof', [PublicPortalController::class, 'uploadInvoiceProof'])->middleware('throttle:15,1');
    Route::get('invoices/{token}/pdf', [PublicPortalController::class, 'downloadInvoicePdf']);
    Route::get('quotes/{token}', [PublicPortalController::class, 'showQuote']);
    Route::post('quotes/{token}/accept', [PublicPortalController::class, 'acceptQuote']);
    Route::post('quotes/{token}/reject', [PublicPortalController::class, 'rejectQuote']);
    Route::get('quotes/{token}/pdf', [PublicPortalController::class, 'downloadQuotePdf']);
});

// Payment Gateway Webhooks (Midtrans, Xendit, Doku, Duitku)
Route::post('webhooks/payment/{gateway}', [\App\Http\Controllers\Api\PaymentWebhookController::class, 'handle'])
    ->middleware('throttle:120,1');

// Public auth
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:auth');
Route::post('/auth/login',    [AuthController::class, 'login'])->middleware('throttle:auth');

// SAML 2.0 Single Sign-On (SSO) Endpoints (Google Workspace, Azure AD, Okta)
Route::get('saml/status', [SamlController::class, 'status']);
Route::get('saml/metadata', [SamlController::class, 'metadata'])->name('saml.metadata');
Route::get('saml/login', [SamlController::class, 'login'])->name('saml.login');
Route::post('saml/acs', [SamlController::class, 'acs'])->name('saml.acs');
Route::match(['get', 'post'], 'saml/sls', [SamlController::class, 'sls'])->name('saml.sls');

// Protected (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Dashboard
    Route::get('dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('dashboard/recent-invoices', [DashboardController::class, 'recentInvoices']);
    Route::get('dashboard/overdue-invoices', [DashboardController::class, 'overdueInvoices']);
    Route::get('dashboard/upcoming-billing', [DashboardController::class, 'upcomingBilling']);

    // Customers
    Route::apiResource('customers', CustomerController::class);
    Route::post('customers/bulk-status', [CustomerController::class, 'bulkStatus'])->middleware('role:owner,admin');
    Route::post('customers/{customer}/convert-subscription', [CustomerController::class, 'convertToSubscription']);
    Route::get('customers/{customer}/overview', [CustomerController::class, 'overview']);

    // Products
    Route::apiResource('products', ProductController::class);
    Route::post('products/bulk-status', [ProductController::class, 'bulkStatus'])->middleware('role:owner,admin');

    // Invoices
    Route::apiResource('invoices', InvoiceController::class);
    Route::post('invoices/bulk-action', [InvoiceController::class, 'bulkAction']);
    Route::post('invoices/{invoice}/mark-as-sent', [InvoiceController::class, 'markAsSent']);
    Route::post('invoices/{invoice}/void',        [InvoiceController::class, 'void']);
    Route::post('invoices/{invoice}/duplicate',   [InvoiceController::class, 'duplicate']);
    Route::get('invoices/{invoice}/pdf',          [InvoiceController::class, 'pdf']);
    Route::post('invoices/{invoice}/email',       [EmailController::class, 'sendInvoice']);
    Route::post('invoices/{invoice}/approve-proof', [InvoiceController::class, 'approvePaymentProof']);
    Route::post('invoices/{invoice}/reject-proof',  [InvoiceController::class, 'rejectPaymentProof']);

    // Payments
    Route::get('invoices/{invoice}/payments',     [PaymentController::class, 'index']);
    Route::post('invoices/{invoice}/payments',    [PaymentController::class, 'store']);
    Route::apiResource('payments', PaymentController::class)->except(['store']);
    Route::get('payments/{payment}/receipt',      [PaymentController::class, 'receipt']);

    // Quotes
    Route::apiResource('quotes', QuoteController::class);
    Route::post('quotes/bulk-action', [QuoteController::class, 'bulkAction']);
    Route::post('quotes/{quote}/send',                  [QuoteController::class, 'send']);
    Route::post('quotes/{quote}/accept',                [QuoteController::class, 'accept']);
    Route::post('quotes/{quote}/reject',                [QuoteController::class, 'reject']);
    Route::post('quotes/{quote}/mark-as-expired',       [QuoteController::class, 'markAsExpired']);
    Route::post('quotes/{quote}/duplicate',             [QuoteController::class, 'duplicate']);
    Route::post('quotes/{quote}/convert-to-invoice',    [QuoteController::class, 'convertToInvoice']);
    Route::post('quotes/{quote}/milestones',            [QuoteController::class, 'saveMilestones']);
    Route::post('quotes/{quote}/milestones/{milestone}/generate-invoice', [QuoteController::class, 'generateMilestoneInvoice']);
    Route::get('quotes/{quote}/pdf',                    [QuoteController::class, 'pdf']);
    Route::post('quotes/{quote}/email',                 [EmailController::class, 'sendQuote']);

    // Email automation
    Route::apiResource('email-templates', EmailTemplateController::class);
    Route::post('email-templates/{slug}/restore', [EmailTemplateController::class, 'restore']);
    Route::get('email-logs', [EmailTemplateController::class, 'logs']);

    // Subscriptions
    Route::apiResource('subscriptions', SubscriptionController::class);
    Route::post('subscriptions/bulk-action', [SubscriptionController::class, 'bulkAction']);
    Route::post('subscriptions/{subscription}/pause', [SubscriptionController::class, 'pause']);
    Route::post('subscriptions/{subscription}/resume', [SubscriptionController::class, 'resume']);
    Route::post('subscriptions/{subscription}/cancel', [SubscriptionController::class, 'cancel']);
    Route::post('subscriptions/{subscription}/generate-invoice', [SubscriptionController::class, 'generateInvoice']);

    // PDF templates
    Route::get('invoice-templates', [TemplateController::class, 'invoiceTemplates']);
    Route::get('invoice-templates/{slug}/preview', [TemplateController::class, 'previewInvoice']);
    Route::post('invoice-templates/{invoiceTemplate}/activate', [TemplateController::class, 'activateInvoice']);
    Route::get('quote-templates', [TemplateController::class, 'quoteTemplates']);
    Route::get('quote-templates/{slug}/preview', [TemplateController::class, 'previewQuote']);
    Route::post('quote-templates/{quoteTemplate}/activate', [TemplateController::class, 'activateQuote']);
    Route::get('activity-logs', [ActivityLogController::class, 'index']);
    Route::get('reports/revenue', [ReportController::class, 'revenue']);
    Route::get('reports/invoices', [ReportController::class, 'invoices']);
    Route::get('reports/customers', [ReportController::class, 'customers']);
    Route::get('reports/subscriptions', [ReportController::class, 'subscriptions']);
    Route::get('reports/ar-aging', [ReportController::class, 'arAging']);
    Route::get('reports/export/csv', [ReportController::class, 'exportCsv']);
    Route::get('reports/export/pdf', [ReportController::class, 'exportPdf']);
    Route::get('settings/demo-data/stats', [SettingsController::class, 'demoDataStats'])->middleware('role:owner,admin,demo');
    Route::get('settings/demo_data/stats', [SettingsController::class, 'demoDataStats'])->middleware('role:owner,admin,demo');
    Route::post('settings/demo-data/clear', [SettingsController::class, 'clearDemoData'])->middleware('role:owner,admin');
    Route::post('settings/demo_data/clear', [SettingsController::class, 'clearDemoData'])->middleware('role:owner,admin');
    Route::post('settings/demo-data/generate', [SettingsController::class, 'generateDemoData'])->middleware('role:owner,admin');
    Route::post('settings/demo_data/generate', [SettingsController::class, 'generateDemoData'])->middleware('role:owner,admin');
    Route::get('settings/{group}', [SettingsController::class, 'show']);
    Route::put('settings/{group}', [SettingsController::class, 'update'])->middleware('role:owner,admin');
    Route::post('settings/email/test', [SettingsController::class, 'testEmail'])->middleware('role:owner,admin');
    Route::post('saml/test',          [SamlController::class, 'test'])->middleware('role:owner,admin');
    Route::get('settings/license/status',    [LicenseController::class, 'status'])->middleware('role:owner,admin,demo');
    Route::post('settings/license/activate', [LicenseController::class, 'activate'])->middleware('role:owner,admin');
    Route::post('settings/license/verify',   [LicenseController::class, 'verify'])->middleware('role:owner,admin');
    Route::post('settings/license/revoke',   [LicenseController::class, 'revoke'])->middleware('role:owner,admin');
    Route::post('company/logo',      [SettingsController::class, 'uploadLogo'])->middleware('role:owner,admin');
    Route::post('company/signature', [SettingsController::class, 'uploadSignature'])->middleware('role:owner,admin');
    Route::post('company/stamp',     [SettingsController::class, 'uploadStamp'])->middleware('role:owner,admin');
    Route::post('company/qris',      [SettingsController::class, 'uploadQris'])->middleware('role:owner,admin');
    Route::get('currencies', [CurrencyController::class, 'index']);
    Route::get('tax-rates', [TaxRateController::class, 'index']);
    Route::get('search', [SearchController::class, 'index']);
    Route::get('profile', [ProfileController::class, 'show']);
    Route::put('profile', [ProfileController::class, 'update']);
    Route::put('profile/password', [ProfileController::class, 'changePassword']);
    Route::get('users', [UserController::class, 'index'])->middleware('role:owner,admin,demo');
    Route::post('users', [UserController::class, 'store'])->middleware('role:owner,admin');
    Route::put('users/{user}', [UserController::class, 'update'])->middleware('role:owner,admin');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->middleware('role:owner,admin');
    Route::post('users/{user}/assign-role', [UserController::class, 'assignRole'])->middleware('role:owner,admin');
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'read']);
    Route::post('notifications/read-all', [NotificationController::class, 'readAll']);
});
