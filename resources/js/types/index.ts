// Shared TypeScript types matching Laravel API Resources

export interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    company_id: number;
    company?: {
        id: number;
        name: string;
        logo?: string | null;
    };
}

export interface Paginated<T> {
    data: T[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        path: string;
        per_page: number;
        to: number;
        total: number;
    };
}

export interface Customer {
    id: number;
    company_id: number;
    customer_number: string;
    company_name: string;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    tax_number: string | null;
    notes: string | null;
    status: 'lead' | 'active' | 'inactive';
    status_color: string;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: number;
    company_id: number;
    sku: string;
    name: string;
    description: string | null;
    type: 'one_time' | 'subscription';
    type_label: string;
    price: number;
    currency: string;
    tax_rate: number;
    billing_cycle: 'monthly' | 'quarterly' | 'semi_annual' | 'yearly' | null;
    billing_cycle_label: string;
    status: 'active' | 'inactive';
    notes: string | null;
    is_subscription: boolean;
    is_one_time: boolean;
    created_at: string;
    updated_at: string;
}

export interface SubscriptionItem {
    id: number;
    subscription_id: number;
    product_id: number | null;
    description: string;
    quantity: number;
    unit_price: number;
    discount: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    product?: Product;
}

export interface Subscription {
    id: number;
    company_id: number;
    customer_id: number;
    subscription_number: string;
    status: 'draft' | 'active' | 'paused' | 'cancelled' | 'expired';
    billing_cycle: 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';
    start_date: string;
    next_billing_date: string;
    end_date: string | null;
    invoice_due_days: number;
    currency: string;
    notes: string | null;
    customer?: Customer;
    items?: SubscriptionItem[];
    invoices?: Invoice[];
    created_at: string;
    updated_at: string;
}

export interface EmailTemplate {
    id: number;
    company_id: number | null;
    slug: string;
    name: string;
    subject: string;
    body: string;
    is_default: boolean;
    is_custom: boolean;
    created_at: string;
    updated_at: string;
}

export interface EmailLog {
    id: number;
    template_slug: string | null;
    to_email: string;
    subject: string;
    status: 'queued' | 'sent' | 'failed';
    error_message: string | null;
    sent_at: string | null;
    created_at: string;
}

export interface ActivityLog {
    id: number;
    action: string;
    description: string;
    properties: Record<string, unknown>;
    subject_type: string | null;
    subject_id: number | null;
    user?: { id: number; name: string };
    created_at: string;
}

export interface Notification {
    id: number;
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown> | null;
    read_at: string | null;
    created_at: string;
}

export interface InvoiceItem {
    id: number;
    invoice_id: number;
    product_id: number | null;
    description: string;
    quantity: number;
    unit_price: number;
    discount: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    product?: Product;
}

export interface Invoice {
    id: number;
    company_id: number;
    customer_id: number;
    subscription_id: number | null;
    quote_id: number | null;
    invoice_number: string;
    public_token?: string;
    invoice_date: string;
    due_date: string;
    status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'void';
    status_color: string;
    subtotal: number;
    discount: number;
    discount_type: 0 | 1;
    tax_rate: number;
    tax_amount: number;
    total: number;
    paid_amount: number;
    balance: number;
    currency: string;
    notes: string | null;
    terms: string | null;
    payment_proof_path?: string | null;
    payment_proof_status?: 'none' | 'pending' | 'approved' | 'rejected';
    payment_proof_notes?: string | null;
    payment_proof_uploaded_at?: string | null;
    milestone_name?: string | null;
    milestone_sequence?: number | null;
    milestone_total_termins?: number | null;
    milestone_percentage?: number | null;
    customer?: Customer;
    items?: InvoiceItem[];
    payments?: Payment[];
    created_at: string;
    updated_at: string;
}

export interface QuoteMilestone {
    id: number;
    sequence: number;
    name: string;
    percentage: number;
    amount: number;
    due_date: string | null;
    status: 'pending' | 'invoiced' | 'paid';
    notes: string | null;
    invoice_id: number | null;
    invoice_number?: string | null;
    invoice_status?: string | null;
}

export interface QuoteItem {
    id: number;
    quote_id: number;
    product_id: number | null;
    description: string;
    quantity: number;
    unit_price: number;
    discount: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    product?: Product;
}

export interface Payment {
    id: number;
    company_id: number;
    customer_id: number;
    invoice_id: number;
    payment_number: string;
    payment_date: string;
    amount: number;
    currency: string;
    payment_method: 'bank_transfer' | 'cash' | 'credit_card' | 'e_wallet' | 'other';
    method_label: string;
    reference: string | null;
    notes: string | null;
    customer?: Customer;
    invoice?: {
        id: number;
        invoice_number: string;
        total: number;
        balance: number;
        status: string;
    };
    created_at: string;
    updated_at: string;
}

export interface Quote {
    id: number;
    company_id: number;
    customer_id: number;
    invoice_id: number | null;
    quote_number: string;
    public_token?: string;
    quote_date: string;
    valid_until: string | null;
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted';
    status_color: string;
    subtotal: number;
    discount: number;
    discount_type: 0 | 1;
    tax_rate: number;
    tax_amount: number;
    total: number;
    currency: string;
    notes: string | null;
    terms: string | null;
    customer?: Customer;
    items?: QuoteItem[];
    milestones?: QuoteMilestone[];
    created_at: string;
    updated_at: string;
}

export interface CustomerOverview {
    invoices: Invoice[];
    quotes: Quote[];
    subscriptions: Subscription[];
    payments: Payment[];
    activity: ActivityLog[];
}
