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
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::get('/health', fn () => response()->json(['status' => 'ok']));

// Public auth
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:auth');
Route::post('/auth/login',    [AuthController::class, 'login'])->middleware('throttle:auth');

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
    Route::post('invoice-templates/{invoiceTemplate}/activate', [TemplateController::class, 'activateInvoice']);
    Route::get('quote-templates', [TemplateController::class, 'quoteTemplates']);
    Route::post('quote-templates/{quoteTemplate}/activate', [TemplateController::class, 'activateQuote']);
    Route::get('activity-logs', [ActivityLogController::class, 'index']);
    Route::get('reports/revenue', [ReportController::class, 'revenue']);
    Route::get('reports/invoices', [ReportController::class, 'invoices']);
    Route::get('reports/customers', [ReportController::class, 'customers']);
    Route::get('reports/subscriptions', [ReportController::class, 'subscriptions']);
    Route::get('settings/{group}', [SettingsController::class, 'show']);
    Route::put('settings/{group}', [SettingsController::class, 'update'])->middleware('role:owner,admin');
    Route::post('settings/email/test', [SettingsController::class, 'testEmail'])->middleware('role:owner,admin');
    Route::get('currencies', [CurrencyController::class, 'index']);
    Route::get('tax-rates', [TaxRateController::class, 'index']);
    Route::get('search', [SearchController::class, 'index']);
    Route::apiResource('users', UserController::class)->only(['index', 'store', 'update', 'destroy'])->middleware('role:owner,admin');
    Route::post('users/{user}/assign-role', [UserController::class, 'assignRole'])->middleware('role:owner,admin');
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'read']);
    Route::post('notifications/read-all', [NotificationController::class, 'readAll']);
});
